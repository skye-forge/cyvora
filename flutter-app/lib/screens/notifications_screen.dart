import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/notification.dart';
import 'package:varnis/providers/notification_provider.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'my_reports_screen.dart';
import 'learning_academy_screen.dart';
import 'community_feed_screen.dart';
import 'national_updates_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationsProvider>().load();
    });
  }

  IconData _iconFor(NotificationType type) {
    switch (type) {
      case NotificationType.lessonReminder:
        return Icons.menu_book_outlined;
      case NotificationType.incidentUpdate:
        return Icons.check_circle_outline_rounded;
      case NotificationType.communityReply:
        return Icons.chat_bubble_outline_rounded;
      case NotificationType.safetyAlert:
        return Icons.warning_amber_rounded;
      case NotificationType.achievement:
        return Icons.emoji_events_outlined;
      case NotificationType.insights:
        return Icons.insert_chart_outlined;
    }
  }

  Color _colorFor(NotificationType type) {
    switch (type) {
      case NotificationType.lessonReminder:
        return AppColors.accent;
      case NotificationType.incidentUpdate:
        return AppColors.success;
      case NotificationType.communityReply:
        return AppColors.primary;
      case NotificationType.safetyAlert:
        return AppColors.errorDark;
      case NotificationType.achievement:
        return AppColors.success;
      case NotificationType.insights:
        return AppColors.gray600;
    }
  }

  String _timeAgo(DateTime timestamp) {
    final difference = DateTime.now().difference(timestamp);
    if (difference.inDays == 1) return 'Yesterday';
    if (difference.inDays > 0) return '${difference.inDays} days ago';
    if (difference.inHours > 0) return '${difference.inHours} hours ago';
    if (difference.inMinutes > 0) return '${difference.inMinutes} min ago';
    return 'Just now';
  }

  bool _isToday(DateTime timestamp) {
    final now = DateTime.now();
    return timestamp.year == now.year &&
        timestamp.month == now.month &&
        timestamp.day == now.day;
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationsProvider>();
    final today =
        provider.notifications.where((n) => _isToday(n.timestamp)).toList();
    final earlier =
        provider.notifications.where((n) => !_isToday(n.timestamp)).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: _buildHeader(context),
            ),
            Expanded(child: _buildBody(provider, today, earlier)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(
    NotificationsProvider provider,
    List<AppNotification> today,
    List<AppNotification> earlier,
  ) {
    if (provider.isLoading && provider.notifications.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.error != null && provider.notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_rounded,
                size: 48, color: AppColors.gray300),
            const SizedBox(height: 12),
            Text(provider.error!,
                style: const TextStyle(color: AppColors.gray500)),
            const SizedBox(height: 16),
            SizedBox(
              width: 130,
              child: ElevatedButton(
                onPressed: () => provider.refresh(),
                child: const Text('Retry'),
              ),
            ),
          ],
        ),
      );
    }

    if (provider.notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.notifications_none,
                size: 72, color: AppColors.gray300),
            SizedBox(height: 16),
            Text(
              'No notifications yet',
              style: TextStyle(fontSize: 17, color: AppColors.gray500),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => provider.refresh(),
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (today.isNotEmpty) ...[
              Row(
                children: [
                  const Text(
                    'Today',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.gray900,
                    ),
                  ),
                  const Spacer(),
                  if (provider.hasUnread)
                    GestureDetector(
                      onTap: provider.markAllAsRead,
                      child: const Text(
                        'Mark all as read',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              for (final notification in today) ...[
                _buildNotificationCard(provider, notification),
                const SizedBox(height: 12),
              ],
              const SizedBox(height: 12),
            ],
            if (earlier.isNotEmpty) ...[
              const Text(
                'Earlier',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.gray900,
                ),
              ),
              const SizedBox(height: 12),
              for (final notification in earlier) ...[
                _buildNotificationCard(provider, notification),
                const SizedBox(height: 12),
              ],
            ],
          ],
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
      ],
    );
  }

  Widget _buildNotificationCard(
    NotificationsProvider provider,
    AppNotification notification,
  ) {
    final isRead = notification.isRead;
    final color = _colorFor(notification.type);

    return GestureDetector(
      onTap: () {
        provider.markAsRead(notification);
        _openNotification(context, notification);
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isRead ? const Color(0xFFEFF0F6) : AppColors.white,
          borderRadius: BorderRadius.circular(14),
          border: isRead ? null : Border.all(color: AppColors.gray200),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child:
                  Icon(_iconFor(notification.type), size: 20, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight:
                          isRead ? FontWeight.w600 : FontWeight.w700,
                      color: AppColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.gray600,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _timeAgo(notification.timestamp),
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.gray400),
                  ),
                ],
              ),
            ),
            if (!isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(left: 8, top: 4),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
  /// Routes a tapped notification to the relevant screen by type.
  /// relatedId lets detail screens load the exact record once the
  /// backend supplies real IDs.
  void _openNotification(
      BuildContext context, AppNotification notification) {
    switch (notification.type) {
      case NotificationType.incidentUpdate:
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) => const MyReportsScreen()),
        );
        break;
      case NotificationType.lessonReminder:
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) => const LearningAcademyScreen()),
        );
        break;
      case NotificationType.communityReply:
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) => const CommunityFeedScreen()),
        );
        break;
      case NotificationType.safetyAlert:
      case NotificationType.insights:
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) => const NationalUpdatesScreen()),
        );
        break;
      case NotificationType.achievement:
        // Achievements live on the profile; the root tab bar owns that
        // navigation, so just close the panel.
        Navigator.pop(context);
        break;
    }
  }
}
