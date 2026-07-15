import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/alert.dart';
import 'package:varnis/models/notification.dart';
import 'package:varnis/providers/alert_provider.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/providers/notification_provider.dart';
import 'package:varnis/providers/report_provider.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'main_screen.dart';
import 'report_incident_screen.dart';
import 'my_reports_screen.dart';
import 'national_updates_screen.dart';
import 'notifications_screen.dart';
import 'safety_tips_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Load everything the dashboard displays.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().load();
      context.read<AlertsProvider>().load();
      context.read<NotificationsProvider>().load();
    });
  }

  Future<void> _refreshAll() async {
    await Future.wait([
      context.read<ReportsProvider>().refresh(),
      context.read<AlertsProvider>().refresh(),
      context.read<NotificationsProvider>().refresh(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final firstName =
        user != null && user.fullName.isNotEmpty
            ? user.fullName.split(' ').first
            : 'there';

    return Container(
      color: AppColors.background,
      child: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refreshAll,
          color: AppColors.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context),
                const SizedBox(height: 20),
                Text(
                  'Hello, $firstName 👋',
                  style: const TextStyle(
                    color: AppColors.gray900,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  "Your city's safety is our priority today.",
                  style: TextStyle(color: AppColors.gray500, fontSize: 14),
                ),
                const SizedBox(height: 16),
                _buildNationalAlert(context),
                _buildReportingSummary(context),
                const SizedBox(height: 20),
                _buildReportIncidentCard(context),
                const SizedBox(height: 16),
                _buildQuickActions(context),
                const SizedBox(height: 20),
                _buildRecentActivity(context),
                const SizedBox(height: 20),
                _buildNeighborhoodWatchBanner(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Varnis wordmark + notification bell with a live unread dot.
  Widget _buildHeader(BuildContext context) {
    final hasUnread =
        context.watch<NotificationsProvider>().hasUnread;

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
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const NotificationsScreen(),
              ),
            );
          },
          child: Stack(
            children: [
              const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(
                  Icons.notifications_none_rounded,
                  size: 26,
                  color: AppColors.gray900,
                ),
              ),
              if (hasUnread)
                Positioned(
                  right: 4,
                  top: 4,
                  child: Container(
                    width: 9,
                    height: 9,
                    decoration: BoxDecoration(
                      color: AppColors.errorDark,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.background,
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  /// Pink alert banner bound to the latest urgent alert; hidden when
  /// there is none.
  Widget _buildNationalAlert(BuildContext context) {
    final Alert? alert = context.watch<AlertsProvider>().latestUrgent;
    if (alert == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const NationalUpdatesScreen(),
            ),
          );
        },
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.errorLight,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.warning_rounded,
                  color: AppColors.errorDark, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'National Alert',
                      style: TextStyle(
                        color: AppColors.errorDark,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      alert.content,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.errorDark,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Stats bound to ReportsProvider.
  Widget _buildReportingSummary(BuildContext context) {
    final reportsProvider = context.watch<ReportsProvider>();
    final total = reportsProvider.reports.length;
    final resolved = reportsProvider.resolvedCount;
    final pending = reportsProvider.pendingCount;
    final successRate =
        total == 0 ? 0 : ((resolved / total) * 100).round();

    return Container(
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
              Text(
                'Reporting Summary',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.gray900,
                ),
              ),
              Spacer(),
              Icon(Icons.insert_chart_outlined,
                  size: 20, color: AppColors.gray400),
            ],
          ),
          const SizedBox(height: 16),
          if (reportsProvider.isLoading && total == 0)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                ),
              ),
            )
          else ...[
            Row(
              children: [
                Expanded(
                  child: _buildStat(
                      '$resolved', 'Resolved Cases', AppColors.primary),
                ),
                Expanded(
                  child: _buildStat(
                      '$pending', 'Pending Reports', AppColors.gray400),
                ),
              ],
            ),
            if (total > 0) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  _buildChip(
                    label: '$successRate% Success Rate',
                    background: AppColors.successLight,
                    textColor: AppColors.success,
                    showDot: true,
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildStat(String value, String label, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: color,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 2),
        Text(label,
            style: const TextStyle(fontSize: 12, color: AppColors.gray500)),
      ],
    );
  }

  Widget _buildChip({
    required String label,
    required Color background,
    required Color textColor,
    bool showDot = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 6,
              height: 6,
              decoration:
                  BoxDecoration(color: textColor, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportIncidentCard(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const ReportIncidentScreen(),
          ),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.notifications_active_outlined,
                color: AppColors.white,
                size: 24,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Report Incident',
              style: TextStyle(
                color: AppColors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: const [
                Expanded(
                  child: Text(
                    'Immediate help or reporting for civic issues.',
                    style: TextStyle(
                      color: AppColors.onPrimaryMuted,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
                Icon(Icons.arrow_forward_rounded,
                    color: AppColors.white, size: 22),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildQuickActionCard(
            icon: Icons.verified_user_outlined,
            title: 'Safety Lessons',
            subtitle: 'Learn how to stay safe',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SafetyTipsScreen(),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: _buildQuickActionCard(
            icon: Icons.forum_outlined,
            title: 'Community Feed',
            subtitle: 'Join local discussions',
            onTap: () => MainScreen.of(context)?.switchTab(1),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.gray200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 24, color: AppColors.primary),
            const SizedBox(height: 14),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.gray900,
              ),
            ),
            const SizedBox(height: 3),
            Text(subtitle,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.gray500)),
          ],
        ),
      ),
    );
  }

  /// Latest notifications as recent activity.
  Widget _buildRecentActivity(BuildContext context) {
    final items = context
        .watch<NotificationsProvider>()
        .notifications
        .take(2)
        .toList();

    return Container(
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
            children: [
              const Text(
                'Recent Activity',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.gray900,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const NotificationsScreen(),
                    ),
                  );
                },
                child: const Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (items.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'No recent activity yet.',
                style: TextStyle(color: AppColors.gray400, fontSize: 13),
              ),
            )
          else
            for (var i = 0; i < items.length; i++) ...[
              _buildActivityItem(items[i]),
              if (i < items.length - 1) const SizedBox(height: 14),
            ],
        ],
      ),
    );
  }

  Widget _buildActivityItem(AppNotification notification) {
    final (icon, color, bg) = switch (notification.type) {
      NotificationType.incidentUpdate => (
          Icons.check_circle_outline_rounded,
          AppColors.success,
          AppColors.successLight,
        ),
      NotificationType.lessonReminder => (
          Icons.play_circle_outline_rounded,
          AppColors.primary,
          AppColors.primaryLight,
        ),
      NotificationType.communityReply => (
          Icons.chat_bubble_outline_rounded,
          AppColors.primary,
          AppColors.primaryLight,
        ),
      NotificationType.safetyAlert => (
          Icons.warning_amber_rounded,
          AppColors.errorDark,
          AppColors.errorLight,
        ),
      _ => (
          Icons.insert_chart_outlined,
          AppColors.gray600,
          AppColors.gray100,
        ),
    };

    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
          child: Icon(icon, size: 22, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                notification.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.gray900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                notification.body,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.gray400),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Photo banner with dark overlay: "Protecting Douala-V together".
  Widget _buildNeighborhoodWatchBanner() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          Image.asset(
            'assets/images/dashboard_banner.jpg',
            height: 160,
            width: double.infinity,
            fit: BoxFit.cover,
            alignment: const Alignment(0, -0.35),
            errorBuilder: (context, error, stackTrace) => Container(
              height: 160,
              color: AppColors.primary,
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.15),
                    Colors.black.withOpacity(0.65),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 16,
            bottom: 16,
            right: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.45),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'NEIGHBORHOOD WATCH',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Protecting Douala-V together',
                  style: TextStyle(
                    color: AppColors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}