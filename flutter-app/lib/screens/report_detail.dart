import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/report.dart';
import 'package:varnis/widgets/custom_card.dart';

/// Report details, driven by a Report object. Shows the status
/// timeline and — when the ML pipeline has processed the report —
/// the AI analysis section.
class ReportDetailsScreen extends StatelessWidget {
  final Report report;

  const ReportDetailsScreen({super.key, required this.report});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              const SizedBox(height: 16),
              _buildBreadcrumb(context),
              const SizedBox(height: 14),
              _buildStatusCard(),
              const SizedBox(height: 16),
              _buildDescriptionCard(),
              if (report.aiAnalysis != null) ...[
                const SizedBox(height: 16),
                _buildAiAnalysisCard(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Padding(
            padding: EdgeInsets.only(right: 12),
            child:
                Icon(Icons.arrow_back, size: 22, color: AppColors.gray900),
          ),
        ),
        const Text(
          'Varnis',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const Spacer(),
        const Icon(Icons.shield_outlined,
            size: 18, color: AppColors.primary),
      ],
    );
  }

  Widget _buildBreadcrumb(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Text(
            'My Reports',
            style: TextStyle(fontSize: 13, color: AppColors.gray500),
          ),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 6),
          child:
              Icon(Icons.chevron_right, size: 15, color: AppColors.gray400),
        ),
        Text(
          'Incident #${report.id}',
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.primary,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusCard() {
    final dateLabel = DateFormat('MMM d, y').format(report.createdAt);

    return CustomCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  report.title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.gray900,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              _buildStatusPill(),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Reported on $dateLabel'
            '${report.location.isNotEmpty ? ' • ${report.location}' : ''}',
            style: const TextStyle(fontSize: 13, color: AppColors.gray500),
          ),
          if (report.timeline.isNotEmpty) ...[
            const SizedBox(height: 24),
            _buildTimeline(),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusPill() {
    late final Color background;
    late final Color textColor;
    late final IconData icon;

    switch (report.status) {
      case 'Rejected':
        background = AppColors.errorLight;
        textColor = AppColors.errorDark;
        icon = Icons.cancel;
        break;
      case 'Pending':
      case 'Under Review':
        background = const Color(0xFFFFF4E0);
        textColor = AppColors.warning;
        icon = Icons.schedule;
        break;
      default:
        background = AppColors.successLight;
        textColor = AppColors.success;
        icon = Icons.check_circle;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            report.status,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline() {
    final steps = report.timeline;
    return Row(
      children: [
        for (var i = 0; i < steps.length; i++) ...[
          _buildTimelineStep(steps[i]),
          if (i < steps.length - 1)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 32),
                child: Container(
                  height: 2,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: steps[i + 1].isCompleted
                        ? AppColors.primary
                        : AppColors.gray200,
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ),
            ),
        ],
      ],
    );
  }

  Widget _buildTimelineStep(ReportStatusEvent step) {
    final isCompleted = step.isCompleted;
    final isAiStep = step.label.toLowerCase().contains('ai');

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isCompleted ? AppColors.primary : AppColors.white,
            shape: BoxShape.circle,
            border: isCompleted
                ? null
                : Border.all(color: AppColors.gray300, width: 2),
          ),
          child: isCompleted
              ? Icon(
                  isAiStep ? Icons.smart_toy_outlined : Icons.check,
                  size: 16,
                  color: AppColors.white,
                )
              : null,
        ),
        const SizedBox(height: 8),
        Text(
          step.label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isCompleted ? AppColors.gray900 : AppColors.gray400,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          DateFormat('MMM d').format(step.date),
          style: const TextStyle(fontSize: 11, color: AppColors.gray400),
        ),
      ],
    );
  }

  Widget _buildDescriptionCard() {
    return CustomCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.description_outlined,
                  size: 20, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'Description / Signalement',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              report.description,
              style: const TextStyle(
                fontSize: 14,
                height: 1.6,
                color: AppColors.gray700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Shown when the ML pipeline has analysed the report (i.e. the
  /// admin hadn't reviewed it in time and the trained model stepped in).
  Widget _buildAiAnalysisCard() {
    final confidence = report.aiConfidence;

    return CustomCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.smart_toy_outlined,
                  size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Automated Analysis',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
              if (confidence != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${(confidence * 100).round()}% confidence',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              report.aiAnalysis!,
              style: const TextStyle(
                fontSize: 14,
                height: 1.6,
                color: AppColors.gray700,
              ),
            ),
          ),
          if (report.reviewedBy != null) ...[
            const SizedBox(height: 10),
            Text(
              'Reviewed by: ${report.reviewedBy}',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.gray400,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }
}