import 'package:flutter/foundation.dart';
import 'package:varnis/models/report.dart';
import 'package:varnis/services/api_service.dart';

/// Loads and submits incident reports.
class ReportsProvider extends ChangeNotifier {
  final ApiService _api;

  ReportsProvider(this._api);

  List<Report> _reports = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _error;
  bool _hasLoaded = false;

  List<Report> get reports => List.unmodifiable(_reports);
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get error => _error;

  int get resolvedCount =>
      _reports.where((r) => r.status == 'Approved').length;
  int get pendingCount => _reports
      .where((r) => r.status == 'Pending' || r.status == 'Under Review')
      .length;

  List<Report> byStatus(String status) =>
      _reports.where((r) => r.status == status).toList();

  /// Loads once; call refresh() to force a reload (pull-to-refresh).
  Future<void> load() async {
    if (_hasLoaded && _reports.isNotEmpty) return;
    await refresh();
  }

  Future<void> refresh() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _reports = await _api.getReports();
      _hasLoaded = true;
    } catch (e) {
      _error = 'Could not load reports. Pull down to retry.';
      debugPrint('ReportsProvider.refresh: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Report?> getReport(String id) async {
    try {
      return await _api.getReport(id);
    } catch (e) {
      debugPrint('ReportsProvider.getReport: $e');
      // Fall back to the cached list entry if present.
      try {
        return _reports.firstWhere((r) => r.id == id);
      } catch (_) {
        return null;
      }
    }
  }

  /// Submits a report and prepends it to the local list. Returns the
  /// created report (for the success screen) or throws with a friendly
  /// message.
  Future<Report> submit({
    required String category,
    required String description,
    String? location,
    double? latitude,
    double? longitude,
    List<String> imagePaths = const [],
    bool isAnonymous = false,
  }) async {
    _isSubmitting = true;
    notifyListeners();
    try {
      final report = await _api.submitReport(
        category: category,
        description: description,
        location: location,
        latitude: latitude,
        longitude: longitude,
        imagePaths: imagePaths,
        isAnonymous: isAnonymous,
      );
      _reports.insert(0, report);
      return report;
    } catch (e) {
      debugPrint('ReportsProvider.submit: $e');
      throw Exception(
          'Could not submit your report. Check your connection and try again.');
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  void clear() {
    _reports = [];
    _hasLoaded = false;
    _error = null;
    notifyListeners();
  }
}