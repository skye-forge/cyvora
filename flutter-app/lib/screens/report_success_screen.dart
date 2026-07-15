import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/report.dart';
import 'package:varnis/widgets/primary_button.dart';
import 'package:varnis/widgets/secondary_button.dart';
import 'report_detail.dart';

/// Confirmation shown after a report is submitted. Displays the report
/// reference ID (tap to copy), the current status, and what happens
/// next in the review pipeline.
class ReportSuccessScreen extends StatelessWidget {
  final Report report;

  const ReportSuccessScreen({super.key, required this.report});

  void _copyId(BuildContext context) {
    Clipboard.setData(ClipboardData(text: report.id));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Report ID copied'),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 88,
                height: 88,
                decoration: const BoxDecoration(
                  color: AppColors.successLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  size: 48,
                  color: AppColors.success,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Report Submitted',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppColors.gray900,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Thank you for helping keep the community safe. '
                'Our taskforce will review your report shortly.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.gray500,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 28),
              _buildReferenceCard(context),
              const Spacer(),
              PrimaryButton(
                text: 'Track My Report',
                icon: Icons.receipt_long_outlined,
                iconLeading: true,
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          ReportDetailsScreen(report: report),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
              SecondaryButton(
                text: 'Done',
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReferenceCard(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Reference ID',
                  style: TextStyle(fontSize: 13, color: AppColors.gray500),
                ),
                InkWell(
                  onTap: () => _copyId(context),
                  borderRadius: BorderRadius.circular(8),
                  child: Row(
                    children: [
                      Text(
                        report.id,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.copy_rounded,
                          size: 15, color: AppColors.gray400),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24, color: AppColors.gray200),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Status',
                  style: TextStyle(fontSize: 13, color: AppColors.gray500),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    report.status,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.warning,
                    ),
                  ),
                ),
              ],
            ),
            if (report.isAnonymous) ...[
              const Divider(height: 24, color: AppColors.gray200),
              const Row(
                children: [
                  Icon(Icons.visibility_off_outlined,
                      size: 16, color: AppColors.gray500),
                  SizedBox(width: 8),
                  Text(
                    'Submitted anonymously',
                    style:
                        TextStyle(fontSize: 13, color: AppColors.gray500),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
