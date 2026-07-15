import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/models/user.dart';
import 'package:varnis/services/api_service.dart';
import 'package:varnis/utils/local_storage.dart';

/// Auth state and flows, backed by ApiService.
///
/// Signup flow: register() → requiresOtp is true → OTP screen calls
/// verifyOtp() → isAuthenticated becomes true → MainScreen.
class AuthProvider with ChangeNotifier {
  final ApiService _api;

  AuthProvider(this._api) {
    _loadUserFromStorage();
  }

  User? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;

  /// Set after register(); the OTP screen verifies against this.
  String? _pendingIdentifier;

  /// Temporary data and user from register() to persist after OTP verification.
  Map<String, dynamic>? _pendingRegistrationData;
  User? _pendingUser;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get pendingIdentifier => _pendingIdentifier;
  bool get requiresOtp => _pendingIdentifier != null;

  // ------------------------------------------------------------- lifecycle

  Future<void> _loadUserFromStorage() async {
    _isLoading = true;
    notifyListeners();
    try {
      final userJson = LocalStorage.getString(AppConstants.userKey);
      final token = LocalStorage.getString(AppConstants.accessTokenKey);
      if (userJson != null && token != null) {
        _user = User.fromJson(jsonDecode(userJson));
        _isAuthenticated = true;
      }
    } catch (e) {
      debugPrint('Error loading user from storage: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _persistSession(Map<String, dynamic> data, User user) async {
    await LocalStorage.saveString(
      AppConstants.userKey,
      jsonEncode(user.toJson()),
    );
    if (data['accessToken'] != null) {
      await LocalStorage.saveString(
        AppConstants.accessTokenKey,
        data['accessToken'] as String,
      );
    }
    if (data['refreshToken'] != null) {
      await LocalStorage.saveString(
        AppConstants.refreshTokenKey,
        data['refreshToken'] as String,
      );
    }
  }

  // ------------------------------------------------------------------ auth

  Future<void> login(String identifier, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _api.login(identifier.trim(), password);
      _user = User.fromJson(data['user'] as Map<String, dynamic>);
      await _persistSession(data, _user!);
      _isAuthenticated = true;
    } on DioException catch (e) {
      throw _friendlyError(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Registers the account. Always requires OTP verification;
  /// [requiresOtp] becomes true and the caller navigates to the
  /// OTP screen. [language] is the user's choice from the signup step.
  Future<void> register(
    String fullName,
    String identifier,
    String password, {
    String language = 'en',
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _api.register(
        fullName: fullName.trim(),
        identifier: identifier.trim(),
        password: password,
        preferredLanguage: language,
      );
      // Store temporarily instead of authenticating right away
      _pendingUser = User.fromJson(data['user'] as Map<String, dynamic>);
      _pendingRegistrationData = data;
      _pendingIdentifier = identifier.trim();
      // Don't persist session or set isAuthenticated yet — wait for OTP
    } on DioException catch (e) {
      throw _friendlyError(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Verifies the OTP for the pending signup (or a passed identifier
  /// for password-reset flows). Returns true on success.
  Future<bool> verifyOtp(String code, {String? identifier}) async {
    final target = identifier ?? _pendingIdentifier;
    if (target == null) return false;

    _isLoading = true;
    notifyListeners();
    try {
      final verified = await _api.verifyOtp(target, code);
      if (verified && target == _pendingIdentifier) {
        // Now that OTP is verified, persist the session and authenticate
        if (_pendingRegistrationData != null && _pendingUser != null) {
          _user = _pendingUser;
          await _persistSession(_pendingRegistrationData!, _user!);
        }
        _pendingIdentifier = null;
        _pendingRegistrationData = null;
        _pendingUser = null;
        _isAuthenticated = true;
      }
      return verified;
    } on DioException catch (e) {
      throw _friendlyError(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> resendOtp({String? identifier}) async {
    final target = identifier ?? _pendingIdentifier;
    if (target == null) return;
    try {
      await _api.resendOtp(target);
    } on DioException catch (e) {
      throw _friendlyError(e);
    }
  }

  Future<void> requestPasswordReset(String identifier) async {
    try {
      await _api.requestPasswordReset(identifier.trim());
    } on DioException catch (e) {
      throw _friendlyError(e);
    }
  }

  Future<void> resetPassword(
    String identifier,
    String code,
    String newPassword,
  ) async {
    try {
      await _api.resetPassword(identifier.trim(), code, newPassword);
    } on DioException catch (e) {
      throw _friendlyError(e);
    }
  }

  Future<void> changePassword(String current, String newPassword) async {
    try {
      await _api.changePassword(current, newPassword);
    } on DioException catch (e) {
      throw _friendlyError(e);
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    try {
      try {
        await _api.logout();
      } catch (_) {
        // Even if the server call fails, clear the local session.
      }
      await LocalStorage.remove(AppConstants.userKey);
      await LocalStorage.remove(AppConstants.accessTokenKey);
      await LocalStorage.remove(AppConstants.refreshTokenKey);
      _user = null;
      _pendingIdentifier = null;
      _pendingRegistrationData = null;
      _pendingUser = null;
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // --------------------------------------------------------------- profile

  Future<void> updateProfile({
    String? fullName,
    String? email,
    String? phone,
    String? bio,
    String? city,
  }) async {
    if (_user == null) return;
    final fields = <String, dynamic>{
      if (fullName != null) 'fullName': fullName,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (bio != null) 'bio': bio,
      if (city != null) 'city': city,
    };
    if (fields.isEmpty) return;

    try {
      await _api.updateProfile(fields);
      _user = _user!.copyWith(
        fullName: fullName,
        email: email,
        phone: phone,
        bio: bio,
        city: city,
      );
      await LocalStorage.saveString(
        AppConstants.userKey,
        jsonEncode(_user!.toJson()),
      );
      notifyListeners();
    } on DioException catch (e) {
      throw _friendlyError(e);
    }
  }

  // ------------------------------------------------------------------ misc

  /// Converts Dio errors into short user-facing messages so screens can
  /// show them in snackbars without exposing stack traces or URLs.
  Exception _friendlyError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError) {
      return Exception('No connection. Check your internet and try again.');
    }
    final status = e.response?.statusCode;
    if (status == 401) return Exception('Incorrect credentials.');
    if (status == 409)
      return Exception('An account already exists for this email or phone.');
    final serverMessage = e.response?.data is Map
        ? (e.response!.data['message'] as String?)
        : null;
    return Exception(
      serverMessage ?? 'Something went wrong. Please try again.',
    );
  }
}
