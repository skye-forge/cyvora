import 'package:flutter/foundation.dart';
import 'package:varnis/models/notification.dart';
import 'package:varnis/services/api_service.dart';

/// In-app notifications. [unreadCount] drives the dashboard bell dot.
class NotificationsProvider extends ChangeNotifier {
  final ApiService _api;

  NotificationsProvider(this._api);

  List<AppNotification> _notifications = [];
  bool _isLoading = false;
  String? _error;
  bool _hasLoaded = false;

  List<AppNotification> get notifications =>
      List.unmodifiable(_notifications);
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount =>
      _notifications.where((n) => !n.isRead).length;
  bool get hasUnread => unreadCount > 0;

  Future<void> load() async {
    if (_hasLoaded && _notifications.isNotEmpty) return;
    await refresh();
  }

  Future<void> refresh() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _notifications = await _api.getNotifications();
      _notifications.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      _hasLoaded = true;
    } catch (e) {
      _error = 'Could not load notifications. Pull down to retry.';
      debugPrint('NotificationsProvider.refresh: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void markAsRead(AppNotification notification) {
    if (notification.isRead) return;
    final index = _notifications.indexOf(notification);
    if (index == -1) return;
    _notifications[index] = notification.copyWith(isRead: true);
    notifyListeners();

    _api.markNotificationRead(notification.id).catchError((e) {
      debugPrint('NotificationsProvider.markAsRead: $e');
    });
  }

  void markAllAsRead() {
    _notifications =
        _notifications.map((n) => n.copyWith(isRead: true)).toList();
    notifyListeners();

    _api.markAllNotificationsRead().catchError((e) {
      debugPrint('NotificationsProvider.markAllAsRead: $e');
    });
  }

  void clear() {
    _notifications = [];
    _hasLoaded = false;
    _error = null;
    notifyListeners();
  }
}