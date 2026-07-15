import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/lesson.dart';
import 'package:varnis/screens/lesson_detail_screen.dart';
import 'package:varnis/services/api_service.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'package:varnis/utils/language_picker.dart';

class LearningAcademyScreen extends StatefulWidget {
  const LearningAcademyScreen({super.key});

  @override
  State<LearningAcademyScreen> createState() => _LearningAcademyScreenState();
}

class _LearningAcademyScreenState extends State<LearningAcademyScreen> {
  late Future<List<Lesson>> _lessonsFuture;

  @override
  void initState() {
    super.initState();
    _loadLessons();
  }

  void _loadLessons() {
    final apiService = Provider.of<ApiService>(context, listen: false);
    setState(() {
      _lessonsFuture = apiService.getLessons();
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: FutureBuilder<List<Lesson>>(
        future: _lessonsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Failed to load lessons',
                    style: TextStyle(color: AppColors.gray600),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: 140,
                    child: ElevatedButton(
                      onPressed: _loadLessons,
                      child: const Text('Retry'),
                    ),
                  ),
                ],
              ),
            );
          }

          final lessons = snapshot.data ?? [];
          final completedCount = lessons.where((l) => l.progress == 100).length;

          // Group lessons by category
          final Map<String, List<Lesson>> groupedLessons = {};
          for (final lesson in lessons) {
            groupedLessons.putIfAbsent(lesson.category, () => []).add(lesson);
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 18),
                _buildProgressCard(lessons, completedCount),
                const SizedBox(height: 24),
                for (final entry in groupedLessons.entries)
                  _buildLessonGroup(context, entry.key, entry.value),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        const AppLogo(size: 32),
        const SizedBox(width: 10),
        const Text(
          'Varnis',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        const Spacer(),
        GestureDetector(
          onTap: () => showLanguagePicker(context),
          child: const Text(
            'FR',
            style: TextStyle(
              color: AppColors.gray900,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  /// Flat navy hero card with overall training progress.
  Widget _buildProgressCard(List<Lesson> lessons, int completedCount) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Continue Learning!',
                      style: TextStyle(
                        color: AppColors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Complete your safety training',
                      style: TextStyle(
                        color: AppColors.onPrimaryMuted,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppColors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'Level ${(completedCount / 2).ceil()}',
                  style: const TextStyle(
                    color: AppColors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Text(
                'Your Progress',
                style: TextStyle(
                  color: AppColors.onPrimaryMuted,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              const Spacer(),
              Text(
                '$completedCount/${lessons.length} Lessons',
                style: const TextStyle(
                  color: AppColors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: lessons.isEmpty ? 0 : completedCount / lessons.length,
              backgroundColor: AppColors.white.withOpacity(0.25),
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.accentGreen,
              ),
              minHeight: 7,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLessonGroup(
    BuildContext context,
    String category,
    List<Lesson> lessons,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          category,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: AppColors.gray900,
          ),
        ),
        const SizedBox(height: 12),
        for (final lesson in lessons) ...[
          _buildLessonCard(context, lesson),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildLessonCard(BuildContext context, Lesson lesson) {
    final isCompleted = lesson.progress == 100;
    final isStarted = lesson.progress > 0 && !isCompleted;
    final hasCover = lesson.coverImageUrl?.isNotEmpty ?? false;

    final Color stateColor = isCompleted
        ? AppColors.success
        : isStarted
        ? AppColors.warning
        : AppColors.primary;

    return CustomCard(
      padding: const EdgeInsets.all(14),
      onTap: () async {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => LessonDetailScreen(lesson: lesson),
          ),
        );
        // Refresh progress after returning from a lesson
        _loadLessons();
      },
      child: Row(
        children: [
          // Cover image or state icon
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: stateColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              image: hasCover
                  ? DecorationImage(
                      image: NetworkImage(lesson.coverImageUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: !hasCover
                ? Icon(
                    isCompleted
                        ? Icons.check_circle_outline
                        : Icons.play_circle_outline,
                    color: stateColor,
                    size: 26,
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lesson.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: AppColors.gray900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  [
                    if (lesson.category.isNotEmpty) lesson.category,
                    if (lesson.duration.isNotEmpty) lesson.duration,
                  ].join('  •  '),
                  style: const TextStyle(
                    color: AppColors.gray500,
                    fontSize: 12,
                  ),
                ),
                if (lesson.progress > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: lesson.progress / 100,
                        backgroundColor: AppColors.gray200,
                        valueColor: AlwaysStoppedAnimation<Color>(stateColor),
                        minHeight: 4,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right, color: AppColors.gray400, size: 20),
        ],
      ),
    );
  }
}
