import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/lesson.dart';
import 'package:varnis/providers/gamification_provider.dart';
import 'package:varnis/widgets/primary_button.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'package:varnis/utils/language_picker.dart';

/// JSON-driven lesson player. One screen renders every lesson: each page's
/// content comes from LessonBlock data (see models/lesson.dart for the
/// block vocabulary), so new lessons can be uploaded from the admin
/// dashboard without app changes.
class LessonDetailScreen extends StatefulWidget {
  final Lesson lesson;

  const LessonDetailScreen({super.key, required this.lesson});

  @override
  State<LessonDetailScreen> createState() => _LessonDetailScreenState();
}

class _LessonDetailScreenState extends State<LessonDetailScreen> {
  int _pageIndex = 0;
  int? _selectedQuizAnswer;
  bool _quizAnswered = false;

  LessonPage get _page => widget.lesson.pages[_pageIndex];
  bool get _isLastPage => _pageIndex == widget.lesson.pages.length - 1;

  bool get _pageHasUnansweredQuiz =>
      _page.blocks.any((b) => b.type == 'quiz') && !_quizAnswered;

  void _next() {
    if (!_isLastPage) {
      setState(() {
        _pageIndex++;
        _selectedQuizAnswer = null;
        _quizAnswered = false;
      });
    } else {
      final gamification = Provider.of<GamificationProvider>(
        context,
        listen: false,
      );
      gamification.completeLesson(widget.lesson.id);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lesson completed! 🎉 +100 points!'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    }
  }

  void _previous() {
    if (_pageIndex > 0) {
      setState(() {
        _pageIndex--;
        _selectedQuizAnswer = null;
        _quizAnswered = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_pageIndex + 1) / widget.lesson.pages.length;
    final percent = (progress * 100).round();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                children: [
                  _buildHeader(),
                  const SizedBox(height: 16),
                  _buildProgress(percent, progress),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_page.title != null) ...[
                      Text(
                        _page.title!,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                    if (_page.intro != null) ...[
                      _richText(
                        _page.intro!,
                        const TextStyle(
                          fontSize: 15,
                          color: AppColors.gray600,
                          height: 1.55,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    for (final block in _page.blocks) ...[
                      _buildBlock(block),
                      const SizedBox(height: 14),
                    ],
                  ],
                ),
              ),
            ),
            _buildBottomNav(),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------- header

  Widget _buildHeader() {
    return Row(
      children: [
        const AppLogo(size: 30),
        const SizedBox(width: 10),
        const Text(
          'Varnis',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const Spacer(),
        GestureDetector(
          onTap: () => showLanguagePicker(context),
          child: const Text(
            'EN / FR',
            style: TextStyle(
              color: AppColors.gray900,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        const SizedBox(width: 14),
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Icon(Icons.close, size: 22, color: AppColors.gray900),
        ),
      ],
    );
  }

  Widget _buildProgress(int percent, double progress) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                (_page.moduleLabel?.isNotEmpty ?? false)
                    ? _page.moduleLabel!
                    : widget.lesson.title,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                  color: AppColors.gray600,
                ),
              ),
            ),
            Text(
              '$percent% Complete',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: AppColors.gray200,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNav() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      child: Row(
        children: [
          if (_pageIndex > 0) ...[
            Expanded(
              child: SizedBox(
                height: 54,
                child: OutlinedButton(
                  onPressed: _previous,
                  child: const Text('Previous'),
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            flex: 2,
            child: PrimaryButton(
              text: _isLastPage ? 'Finish Lesson' : 'Continue',
              icon: Icons.arrow_forward_rounded,
              onPressed: _pageHasUnansweredQuiz ? null : _next,
            ),
          ),
        ],
      ),
    );
  }

  // ------------------------------------------------------- inline rich text

  /// Parses **bold** and `code` spans; used by most text blocks.
  Widget _richText(String text, TextStyle base) {
    return Text.rich(TextSpan(children: _parseSpans(text, base)));
  }

  List<TextSpan> _parseSpans(String text, TextStyle base) {
    final spans = <TextSpan>[];
    final pattern = RegExp(r'\*\*(.+?)\*\*|`(.+?)`');
    var cursor = 0;

    for (final match in pattern.allMatches(text)) {
      if (match.start > cursor) {
        spans.add(
          TextSpan(text: text.substring(cursor, match.start), style: base),
        );
      }
      if (match.group(1) != null) {
        // **bold**
        spans.add(
          TextSpan(
            text: match.group(1),
            style: base.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.gray900,
            ),
          ),
        );
      } else {
        // `code`
        spans.add(
          TextSpan(
            text: ' ${match.group(2)} ',
            style: base.copyWith(
              fontFamily: 'monospace',
              fontSize: (base.fontSize ?? 14) - 1,
              color: AppColors.gray800,
              backgroundColor: AppColors.gray200,
            ),
          ),
        );
      }
      cursor = match.end;
    }
    if (cursor < text.length) {
      spans.add(TextSpan(text: text.substring(cursor), style: base));
    }
    return spans;
  }

  // --------------------------------------------------------- block renderer

  Color _colorFromName(String? name, Color fallback) {
    switch (name) {
      case 'red':
        return AppColors.errorDark;
      case 'green':
        return AppColors.success;
      case 'orange':
        return AppColors.accent;
      case 'navy':
        return AppColors.primary;
      default:
        return fallback;
    }
  }

  IconData _iconFromName(String? name) {
    switch (name) {
      case 'warning':
        return Icons.warning_amber_rounded;
      case 'clock':
        return Icons.access_time_rounded;
      case 'face':
        return Icons.face_retouching_natural;
      case 'mail':
        return Icons.mail_outline;
      case 'shield':
        return Icons.shield_outlined;
      case 'eye':
        return Icons.remove_red_eye_outlined;
      case 'flag':
        return Icons.flag_outlined;
      default:
        return Icons.info_outline;
    }
  }

  Widget _buildBlock(LessonBlock block) {
    switch (block.type) {
      case 'heading':
        return Text(
          block.text ?? '',
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: AppColors.gray900,
          ),
        );

      case 'paragraph':
        return _richText(
          block.text ?? '',
          const TextStyle(fontSize: 15, color: AppColors.gray600, height: 1.55),
        );

      case 'image':
        return ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Image.network(
            block.url ?? '',
            width: double.infinity,
            height: 190,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(
              height: 190,
              color: AppColors.gray200,
              child: const Icon(
                Icons.image_not_supported,
                color: AppColors.gray400,
              ),
            ),
          ),
        );

      // Navy callout card, e.g. "Skepticism is Your Shield" / "PRO TIP"
      case 'hero':
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (block.label != null) ...[
                Text(
                  block.label!.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: AppColors.onPrimaryMuted,
                  ),
                ),
                const SizedBox(height: 6),
              ],
              if (block.title != null) ...[
                Text(
                  block.title!,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    color: AppColors.white,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 8),
              ],
              if (block.text != null)
                Text(
                  block.text!,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.onPrimaryMuted,
                    height: 1.55,
                  ),
                ),
            ],
          ),
        );

      // White card with a colored label header wrapping child blocks,
      // e.g. "FAKE LOTTERY WINS", "PHISHING PATTERN", "The Filter Strategy"
      case 'section':
        final labelColor = _colorFromName(block.labelColor, AppColors.primary);
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.gray200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (block.label != null) ...[
                Row(
                  children: [
                    if (block.icon != null) ...[
                      Icon(
                        _iconFromName(block.icon),
                        size: 18,
                        color: labelColor,
                      ),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: Text(
                        block.label!,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                          color: labelColor,
                        ),
                      ),
                    ),
                    if (block.note != null)
                      Text(
                        block.note!,
                        style: const TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: AppColors.gray400,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
              for (var i = 0; i < (block.children?.length ?? 0); i++) ...[
                _buildBlock(block.children![i]),
                if (i < block.children!.length - 1) const SizedBox(height: 12),
              ],
            ],
          ),
        );

      // Tinted alert box, e.g. "Red Flag: ..." / "Emotional Hijacking" /
      // "High-Risk Extensions"
      case 'alert':
        final isDanger = block.variant != 'warning';
        final color = isDanger ? AppColors.errorDark : AppColors.warning;
        final bg = isDanger ? AppColors.errorLight : const Color(0xFFFFF4E0);
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.report_gmailerrorred_outlined, size: 18, color: color),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (block.title != null) ...[
                      Text(
                        block.title!,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: color,
                        ),
                      ),
                      const SizedBox(height: 3),
                    ],
                    _richText(
                      block.text ?? '',
                      TextStyle(fontSize: 13, color: color, height: 1.5),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );

      // Big red rule card, e.g. "CRITICAL RULE: banks will NEVER ask..."
      case 'critical':
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.errorLight,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.gpp_bad_outlined,
                    size: 18,
                    color: AppColors.errorDark,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    (block.label ?? 'CRITICAL RULE').toUpperCase(),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: AppColors.errorDark,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (block.title != null) ...[
                _richText(
                  block.title!,
                  const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.errorDark,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 10),
              ],
              if (block.text != null)
                _richText(
                  block.text!,
                  const TextStyle(
                    fontSize: 13,
                    color: AppColors.errorDark,
                    height: 1.5,
                  ),
                ),
            ],
          ),
        );

      // ✓ (green) or ✗ (red) item list, e.g. "Why this is suspicious"
      case 'checklist':
        final isCross = block.style == 'cross';
        final color = isCross ? AppColors.errorDark : AppColors.success;
        final icon = isCross ? Icons.close : Icons.check_circle_outline;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (block.title != null) ...[
              Text(
                block.title!,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.gray900,
                ),
              ),
              const SizedBox(height: 10),
            ],
            for (final item in block.items ?? <LessonListItem>[]) ...[
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Icon(icon, size: 16, color: color),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _richText(
                        item.title != null
                            ? '**${item.title}** ${item.text}'
                            : item.text,
                        const TextStyle(
                          fontSize: 14,
                          color: AppColors.gray600,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        );

      // Numbered steps, e.g. "1 On Desktop / 2 On Mobile"
      case 'steps':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var i = 0; i < (block.items?.length ?? 0); i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryLight,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${i + 1}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (block.items![i].title != null)
                            Text(
                              block.items![i].title!,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.gray900,
                              ),
                            ),
                          _richText(
                            block.items![i].text,
                            const TextStyle(
                              fontSize: 14,
                              color: AppColors.gray600,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
          ],
        );

      // Green pro-tip quote card
      case 'quote':
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.successLight,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.school_outlined,
                    size: 16,
                    color: AppColors.success,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    block.label ?? 'Pro Tip',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '"${block.text ?? ''}"',
                style: const TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  color: AppColors.gray700,
                  height: 1.55,
                ),
              ),
            ],
          ),
        );

      // Monospace phishing email sample with a highlighted first line
      case 'emailSample':
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (block.highlight != null) ...[
                Text(
                  block.highlight!,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.errorDark,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.errorDark,
                  ),
                ),
                const SizedBox(height: 6),
              ],
              Text(
                block.text ?? '',
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: AppColors.gray700,
                  height: 1.55,
                ),
              ),
            ],
          ),
        );

      // Suspicious file preview, e.g. Invoice_Confidential_882.zip
      case 'attachment':
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFEBEBF3),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              const Icon(
                Icons.folder_zip_outlined,
                size: 34,
                color: AppColors.gray500,
              ),
              const SizedBox(height: 10),
              Text(
                block.filename ?? '',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.gray900,
                ),
              ),
              if (block.source != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Source: ${block.source}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.gray500,
                  ),
                ),
              ],
            ],
          ),
        );

      // Legacy lightbulb tip
      case 'tip':
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.lightbulb_outline,
                color: AppColors.primary,
                size: 22,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  block.text ?? '',
                  style: const TextStyle(
                    color: AppColors.gray700,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        );

      case 'quiz':
        return _buildQuiz(block.quiz);

      default:
        return const SizedBox.shrink();
    }
  }

  // -------------------------------------------------------------------- quiz

  Widget _buildQuiz(LessonQuiz? quiz) {
    if (quiz == null) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.quiz_outlined, color: AppColors.primary, size: 20),
              SizedBox(width: 8),
              Text(
                'Quick Quiz',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            quiz.question,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.gray900,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          ...quiz.options.asMap().entries.map((entry) {
            final index = entry.key;
            final option = entry.value;
            final isSelected = _selectedQuizAnswer == index;
            final isCorrect = index == quiz.correctAnswerIndex;
            final showResult = _quizAnswered;

            Color borderColor = AppColors.gray200;
            Color bg = AppColors.white;
            Color textColor = AppColors.gray700;
            IconData? resultIcon;

            if (showResult && isCorrect) {
              borderColor = AppColors.success;
              bg = AppColors.successLight;
              textColor = AppColors.success;
              resultIcon = Icons.check_circle;
            } else if (showResult && isSelected) {
              borderColor = AppColors.error;
              bg = AppColors.errorLight;
              textColor = AppColors.errorDark;
              resultIcon = Icons.cancel;
            } else if (isSelected) {
              borderColor = AppColors.primary;
              bg = AppColors.primaryLight;
              textColor = AppColors.primary;
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                onTap: _quizAnswered
                    ? null
                    : () => setState(() => _selectedQuizAnswer = index),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: bg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderColor, width: 1.5),
                  ),
                  child: Row(
                    children: [
                      if (resultIcon != null) ...[
                        Icon(resultIcon, size: 18, color: textColor),
                        const SizedBox(width: 10),
                      ],
                      Expanded(
                        child: Text(
                          option,
                          style: TextStyle(
                            fontSize: 14,
                            color: textColor,
                            fontWeight: isSelected || (showResult && isCorrect)
                                ? FontWeight.w700
                                : FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          if (!_quizAnswered)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: PrimaryButton(
                text: 'Check Answer',
                onPressed: _selectedQuizAnswer == null
                    ? null
                    : () => setState(() => _quizAnswered = true),
              ),
            ),
          if (_quizAnswered && quiz.explanation != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  quiz.explanation!,
                  style: const TextStyle(
                    color: AppColors.gray700,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
