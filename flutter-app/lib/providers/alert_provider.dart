import 'package:flutter/foundation.dart';
import 'package:varnis/models/alert.dart';
import 'package:varnis/services/api_service.dart';

/// National updates / safety alerts. The dashboard banner shows
/// [latestUrgent]; the National Updates screen shows the full list.
/// Later, FCM pushes call refresh() so new alerts appear in real time.
class AlertsProvider extends ChangeNotifier {
  final ApiService _api;

  AlertsProvider(this._api);

  List<Alert> _alerts = [];
  bool _isLoading = false;
  String? _error;
  bool _hasLoaded = false;

  List<Alert> get alerts => List.unmodifiable(_alerts);
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Most recent urgent alert, for the dashboard banner. Null hides it.
  Alert? get latestUrgent {
    for (final alert in _alerts) {
      if (alert.isUrgent) return alert;
    }
    return null;
  }

  List<Alert> byCategory(String category) => category == 'All'
      ? alerts
      : _alerts.where((a) => a.category == category).toList();

  Future<void> load() async {
    if (_hasLoaded && _alerts.isNotEmpty) return;
    await refresh();
  }

  Future<void> refresh() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _alerts = await _api.getAlerts();
      _alerts.sort((a, b) => b.publishedAt.compareTo(a.publishedAt));
      _hasLoaded = true;
    } catch (e) {
      _error = 'Could not load updates. Pull down to retry.';
      debugPrint('AlertsProvider.refresh: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clear() {
    _alerts = [];
    _hasLoaded = false;
    _error = null;
    notifyListeners();
  }
}