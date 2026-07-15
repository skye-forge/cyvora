import 'package:flutter/foundation.dart';
import 'package:varnis/services/api_service.dart';
import 'package:varnis/utils/local_storage.dart';

class Achievement {
  final String id;
  final String title;
  final String description;
  final int points;
  final int lessonsRequired;
  bool isUnlocked;

  Achievement({
    required this.id,
    required this.title,
    required this.description,
    required this.points,
    required this.lessonsRequired,
    this.isUnlocked = false,
  });
}

/// Points, levels, and achievements for the Learning Academy.
/// State persists locally and lesson completions sync to the backend.
class GamificationProvider extends ChangeNotifier {
  static const String _pointsKey = 'gamification_points';
  static const String _completedKey = 'gamification_completed_lessons';
  static const String _achievementsKey = 'gamification_achievements';
  static const int _pointsPerLesson = 100;
  static const int _pointsPerLevel = 100;

  final ApiService _api;

  GamificationProvider(this._api) {
    _load();
  }

  int _totalPoints = 0;
  List<String> _completedLessonIds = [];

  final List<Achievement> _achievements = [
    Achievement(
      id: 'first_lesson',
      title: 'First Steps',
      description: 'Complete your first lesson',
      points: 50,
      lessonsRequired: 1,
    ),
    Achievement(
      id: 'five_lessons',
      title: 'On Your Way',
      description: 'Complete 5 lessons',
      points: 100,
      lessonsRequired: 5,
    ),
    Achievement(
      id: 'ten_lessons',
      title: 'Safety Expert',
      description: 'Complete 10 lessons',
      points: 250,
      lessonsRequired: 10,
    ),
    Achievement(
      id: 'all_lessons',
      title: 'Master of Safety',
      description: 'Complete all lessons',
      points: 500,
      lessonsRequired: 15, // matches current curriculum size; recompute from getLessons() when backend adds courses
    ),
  ];

  int get totalPoints => _totalPoints;
  int get currentLevel => (_totalPoints ~/ _pointsPerLevel) + 1;
  int get pointsToNextLevel =>
      currentLevel * _pointsPerLevel - _totalPoints;
  double get levelProgress => (_totalPoints % _pointsPerLevel) / _pointsPerLevel;
  List<String> get completedLessonIds =>
      List.unmodifiable(_completedLessonIds);
  List<Achievement> get achievements => List.unmodifiable(_achievements);

  bool isLessonCompleted(String lessonId) =>
      _completedLessonIds.contains(lessonId);

  // ------------------------------------------------------------ persistence

  void _load() {
    _totalPoints = LocalStorage.getInt(_pointsKey) ?? 0;
    _completedLessonIds =
        LocalStorage.getStringList(_completedKey) ?? [];
    final unlockedIds =
        LocalStorage.getStringList(_achievementsKey) ?? [];
    for (final achievement in _achievements) {
      achievement.isUnlocked = unlockedIds.contains(achievement.id);
    }
    notifyListeners();
  }

  Future<void> _persist() async {
    await LocalStorage.saveInt(_pointsKey, _totalPoints);
    await LocalStorage.saveStringList(_completedKey, _completedLessonIds);
    await LocalStorage.saveStringList(
      _achievementsKey,
      _achievements
          .where((a) => a.isUnlocked)
          .map((a) => a.id)
          .toList(),
    );
  }

  // ----------------------------------------------------------------- events

  /// Marks a lesson complete: awards points, checks achievements,
  /// persists locally, and syncs to the backend (fire-and-forget so a
  /// bad connection never blocks the completion UX).
  /// Returns the achievements newly unlocked by this completion so the
  /// UI can celebrate them.
  Future<List<Achievement>> completeLesson(String lessonId) async {
    if (_completedLessonIds.contains(lessonId)) return const [];

    _completedLessonIds.add(lessonId);
    _totalPoints += _pointsPerLesson;

    final newlyUnlocked = <Achievement>[];
    for (final achievement in _achievements) {
      if (!achievement.isUnlocked &&
          _completedLessonIds.length >= achievement.lessonsRequired) {
        achievement.isUnlocked = true;
        _totalPoints += achievement.points;
        newlyUnlocked.add(achievement);
      }
    }

    notifyListeners();
    await _persist();

    // Backend sync — non-blocking, ignore failures (retried implicitly
    // next time the profile syncs).
    _api.completeLesson(lessonId).catchError((e) {
      debugPrint('Lesson completion sync failed: $e');
    });

    return newlyUnlocked;
  }

  /// Clears progress on logout (call from AuthProvider.logout or the
  /// sign-out flow) so the next account starts fresh.
  Future<void> reset() async {
    _totalPoints = 0;
    _completedLessonIds = [];
    for (final achievement in _achievements) {
      achievement.isUnlocked = false;
    }
    await LocalStorage.remove(_pointsKey);
    await LocalStorage.remove(_completedKey);
    await LocalStorage.remove(_achievementsKey);
    notifyListeners();
  }
}