import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:hive/hive.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/constants/sample_data.dart';
import 'package:varnis/constants/sample_lessons.dart';
import 'package:varnis/models/alert.dart';
import 'package:varnis/models/lesson.dart';
import 'package:varnis/models/notification.dart';
import 'package:varnis/models/post.dart';
import 'package:varnis/models/report.dart';
import 'package:varnis/utils/local_storage.dart';

/// Central API layer.
///
/// mockMode: while the backend is being built, all reads return sample
/// data and all writes simulate success (after a short delay so loading
/// states are visible). Flip to false when the backend goes live — the
/// method signatures don't change, so no screen or provider needs edits.
///
/// Read endpoints follow: network → Hive cache → sample/empty.
class ApiService {
  static const bool mockMode = true; // TODO: set false when backend is live
  static const Duration _mockDelay = Duration(milliseconds: 600);

  final Dio _dio;
  final Box _hiveBox;

  ApiService(this._dio, this._hiveBox) {
    _dio.options.baseUrl = AppConstants.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);

    // Attach the auth token to every request when present.
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = LocalStorage.getString(AppConstants.accessTokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        // TODO: onError 401 → refresh token flow when backend defines it
      ),
    );
  }

  // ------------------------------------------------------------------ auth

  /// Returns the response map, expected shape:
  /// { accessToken, refreshToken, user: {...} }
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return {
        'accessToken': 'mock-token',
        'refreshToken': 'mock-refresh',
        'user': _mockUser,
      };
    }
    final response = await _dio.post(AppConstants.loginEndpoint, data: {
      'identifier': identifier, // email or phone
      'password': password,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register({
    required String fullName,
    required String identifier,
    required String password,
    required String preferredLanguage, // 'en' | 'fr'
  }) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return {
        'accessToken': 'mock-token',
        'refreshToken': 'mock-refresh',
        'user': {..._mockUser, 'fullName': fullName},
        'otpRequired': true,
      };
    }
    final response = await _dio.post(AppConstants.registerEndpoint, data: {
      'fullName': fullName,
      'identifier': identifier,
      'password': password,
      'preferredLanguage': preferredLanguage,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<void> logout() async {
    if (mockMode) return;
    await _dio.post(AppConstants.logoutEndpoint);
  }

  Future<bool> verifyOtp(String identifier, String code) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return code == '123456'; // mock: this code always works
    }
    final response = await _dio.post('${AppConstants.authEndpoint}/verify-otp',
        data: {'identifier': identifier, 'code': code});
    return response.data['verified'] == true;
  }

  Future<void> resendOtp(String identifier) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return;
    }
    await _dio.post('${AppConstants.authEndpoint}/resend-otp',
        data: {'identifier': identifier});
  }

  Future<void> requestPasswordReset(String identifier) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return;
    }
    await _dio.post('${AppConstants.authEndpoint}/forgot-password',
        data: {'identifier': identifier});
  }

  Future<void> resetPassword(
      String identifier, String code, String newPassword) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return;
    }
    await _dio.post('${AppConstants.authEndpoint}/reset-password',
        data: {'identifier': identifier, 'code': code, 'password': newPassword});
  }

  Future<void> changePassword(String current, String newPassword) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return;
    }
    await _dio.post('${AppConstants.authEndpoint}/change-password',
        data: {'currentPassword': current, 'newPassword': newPassword});
  }

  // ------------------------------------------------------------------ user

  Future<Map<String, dynamic>> getProfile() async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return _mockUser;
    }
    return _cachedGet('profile', '${AppConstants.usersEndpoint}/me')
        as Future<Map<String, dynamic>>;
  }

  Future<void> updateProfile(Map<String, dynamic> fields) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return;
    }
    await _dio.patch('${AppConstants.usersEndpoint}/me', data: fields);
  }

  // --------------------------------------------------------------- reports

  Future<List<Report>> getReports() async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return sampleReports;
    }
    try {
      final response = await _dio.get(AppConstants.reportsEndpoint);
      final List<dynamic> data = response.data;
      await _hiveBox.put('reports', jsonEncode(data));
      return data.map((json) => Report.fromJson(json)).toList();
    } catch (_) {
      final cached = _hiveBox.get('reports');
      if (cached != null) {
        final List<dynamic> data = jsonDecode(cached);
        return data.map((json) => Report.fromJson(json)).toList();
      }
      rethrow;
    }
  }

  Future<Report> getReport(String id) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return sampleReports.firstWhere((r) => r.id == id,
          orElse: () => sampleReports.first);
    }
    final response = await _dio.get('${AppConstants.reportsEndpoint}/$id');
    return Report.fromJson(response.data);
  }

  /// Submits a report. imagePaths are local file paths; uploaded as
  /// multipart when the backend is live.
  Future<Report> submitReport({
    required String category,
    required String description,
    String? location,
    double? latitude,
    double? longitude,
    List<String> imagePaths = const [],
    bool isAnonymous = false,
  }) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return Report(
        id: 'CV-${9830 + DateTime.now().second}',
        title: category,
        category: category,
        description: description,
        status: 'Pending',
        createdAt: DateTime.now(),
        location: location ?? '',
        isAnonymous: isAnonymous,
        timeline: [
          ReportStatusEvent(label: 'Submitted', date: DateTime.now()),
        ],
      );
    }
    final formData = FormData.fromMap({
      'category': category,
      'description': description,
      if (location != null) 'location': location,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      'isAnonymous': isAnonymous,
      'images': [
        for (final path in imagePaths) await MultipartFile.fromFile(path),
      ],
    });
    final response =
        await _dio.post(AppConstants.reportsEndpoint, data: formData);
    return Report.fromJson(response.data);
  }

  // ---------------------------------------------------------------- alerts

  Future<List<Alert>> getAlerts() async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return sampleAlerts;
    }
    try {
      final response = await _dio.get('/alerts');
      final List<dynamic> data = response.data;
      await _hiveBox.put('alerts', jsonEncode(data));
      return data.map((json) => Alert.fromJson(json)).toList();
    } catch (_) {
      final cached = _hiveBox.get('alerts');
      if (cached != null) {
        final List<dynamic> data = jsonDecode(cached);
        return data.map((json) => Alert.fromJson(json)).toList();
      }
      rethrow;
    }
  }

  // ----------------------------------------------------------------- posts

  Future<List<Post>> getPosts() async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return samplePosts;
    }
    try {
      final response = await _dio.get(AppConstants.postsEndpoint);
      final List<dynamic> data = response.data;
      await _hiveBox.put('posts', jsonEncode(data));
      return data.map((json) => Post.fromJson(json)).toList();
    } catch (_) {
      final cached = _hiveBox.get('posts');
      if (cached != null) {
        final List<dynamic> data = jsonDecode(cached);
        return data.map((json) => Post.fromJson(json)).toList();
      }
      rethrow;
    }
  }

  Future<Post> createPost(String content, List<String> hashtags,
      {String? imagePath}) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return Post(
        id: 'p${DateTime.now().millisecondsSinceEpoch}',
        authorName: _mockUser['fullName'] as String,
        authorInitials: 'AT',
        location: _mockUser['city'] as String,
        timestamp: DateTime.now(),
        content: content,
        hashtags: hashtags,
      );
    }
    final formData = FormData.fromMap({
      'content': content,
      'hashtags': hashtags,
      if (imagePath != null) 'image': await MultipartFile.fromFile(imagePath),
    });
    final response =
        await _dio.post(AppConstants.postsEndpoint, data: formData);
    return Post.fromJson(response.data);
  }

  Future<void> setPostLiked(String postId, bool liked) async {
    if (mockMode) return;
    await _dio.post('${AppConstants.postsEndpoint}/$postId/like',
        data: {'liked': liked});
  }

  Future<void> setPostSaved(String postId, bool saved) async {
    if (mockMode) return;
    await _dio.post('${AppConstants.postsEndpoint}/$postId/save',
        data: {'saved': saved});
  }

  Future<List<Map<String, dynamic>>> getComments(String postId) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return [
        {
          'id': 'c1',
          'authorName': 'Officer Jean-Pierre',
          'content': 'Thank you for the detailed observation. We are '
              'dispatching a team to investigate.',
          'timestamp': DateTime.now()
              .subtract(const Duration(hours: 3))
              .toIso8601String(),
          'isOfficial': true,
        },
      ];
    }
    final response =
        await _dio.get('${AppConstants.postsEndpoint}/$postId/comments');
    return (response.data as List).cast<Map<String, dynamic>>();
  }

  Future<void> addComment(String postId, String content) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return;
    }
    await _dio.post('${AppConstants.postsEndpoint}/$postId/comments',
        data: {'content': content});
  }

  // -------------------------------------------------------- notifications

  Future<List<AppNotification>> getNotifications() async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return sampleNotifications;
    }
    final response = await _dio.get('/notifications');
    return (response.data as List)
        .map((json) => AppNotification.fromJson(json))
        .toList();
  }

  Future<void> markNotificationRead(String id) async {
    if (mockMode) return;
    await _dio.post('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    if (mockMode) return;
    await _dio.post('/notifications/read-all');
  }

  // ------------------------------------------------------------ safe zones

  Future<List<Map<String, dynamic>>> getSafeZones() async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return sampleSafeZones;
    }
    try {
      final response = await _dio.get('/safe-zones');
      final data = (response.data as List).cast<Map<String, dynamic>>();
      await _hiveBox.put('safe_zones', jsonEncode(data));
      return data;
    } catch (_) {
      final cached = _hiveBox.get('safe_zones');
      if (cached != null) {
        return (jsonDecode(cached) as List).cast<Map<String, dynamic>>();
      }
      rethrow;
    }
  }

  // --------------------------------------------------------------- lessons

  Future<List<Lesson>> getLessons() async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      return getSampleLessons();
    }
    try {
      final response = await _dio.get(AppConstants.lessonsEndpoint);
      final List<dynamic> data = response.data;
      await _hiveBox.put('lessons', jsonEncode(data));
      return data.map((json) => Lesson.fromJson(json)).toList();
    } catch (_) {
      final cached = _hiveBox.get('lessons');
      if (cached != null) {
        final List<dynamic> data = jsonDecode(cached);
        return data.map((json) => Lesson.fromJson(json)).toList();
      }
      return getSampleLessons();
    }
  }

  Future<Lesson> getLesson(String id) async {
    if (mockMode) {
      await Future.delayed(_mockDelay);
      final samples = getSampleLessons();
      return samples.firstWhere((l) => l.id == id, orElse: () => samples.first);
    }
    try {
      final response = await _dio.get('${AppConstants.lessonsEndpoint}/$id');
      final lesson = Lesson.fromJson(response.data);
      await _hiveBox.put('lesson_$id', jsonEncode(response.data));
      return lesson;
    } catch (_) {
      final cached = _hiveBox.get('lesson_$id');
      if (cached != null) return Lesson.fromJson(jsonDecode(cached));
      rethrow;
    }
  }

  Future<void> completeLesson(String id) async {
    if (mockMode) return;
    await _dio.post('${AppConstants.lessonsEndpoint}/$id/complete');
  }

  // ------------------------------------------------------------------ misc

  /// Generic cached GET for map responses.
  Future<dynamic> _cachedGet(String cacheKey, String path) async {
    try {
      final response = await _dio.get(path);
      await _hiveBox.put(cacheKey, jsonEncode(response.data));
      return response.data;
    } catch (_) {
      final cached = _hiveBox.get(cacheKey);
      if (cached != null) return jsonDecode(cached);
      rethrow;
    }
  }

  static const Map<String, dynamic> _mockUser = {
    'id': 'u1',
    'fullName': 'Amadou Traoré',
    'email': 'amadou.traore@varnis.cm',
    'phone': '+237 677 000 000',
    'city': 'Yaoundé',
    'bio': 'Community safety advocate focused on urban resilience in the '
        'Mfoundi region.',
    'isVerified': true,
    'stats': {'reports': 12, 'lessons': 8},
  };
}