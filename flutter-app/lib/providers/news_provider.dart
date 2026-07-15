import 'package:flutter/foundation.dart';
import 'package:varnis/models/news_article.dart';
import 'package:varnis/services/news_service.dart';

/// Live news headlines for the National Updates screen.
class NewsProvider extends ChangeNotifier {
  final NewsService _service;

  NewsProvider(this._service);

  List<NewsArticle> _articles = [];
  bool _isLoading = false;
  String? _error;
  bool _hasLoaded = false;

  List<NewsArticle> get articles => List.unmodifiable(_articles);
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<NewsArticle> byCategory(String category) => category == 'All'
      ? _articles
      : _articles.where((a) => a.category == category).toList();

  Future<void> load() async {
    if (_hasLoaded && _articles.isNotEmpty) return;
    await refresh();
  }

  Future<void> refresh({bool force = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _articles = await _service.getNews(force: force);
      _hasLoaded = true;
      if (_articles.isEmpty) {
        _error = 'No headlines available right now. Pull down to retry.';
      }
    } catch (e) {
      _error = 'Could not load news. Check your connection.';
      debugPrint('NewsProvider.refresh: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
