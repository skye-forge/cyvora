import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:hive/hive.dart';
import 'package:varnis/models/news_article.dart';

/// Live news via Google News RSS — no API key or account required.
///
/// Feeds are plain RSS XML; we parse the fields we need (title, link,
/// pubDate, source) with lightweight string handling so no XML package
/// dependency is needed. Results are cached in Hive so the section still
/// works offline, and refreshed at most every [_minRefreshInterval].
///
/// To change topics later, edit [_feeds] — each entry is just a Google
/// News search query. If you ever move to a dedicated provider
/// (NewsAPI, GNews, a government feed), only this file changes; the
/// provider and UI stay the same.
class NewsService {
  static const Duration _minRefreshInterval = Duration(minutes: 15);
  static const String _cacheKey = 'live_news';
  static const String _cacheTimeKey = 'live_news_fetched_at';

  /// query → category label shown on the chip
  static const Map<String, String> _feeds = {
    'cameroon security OR safety': 'Cameroon',
    'cameroon news': 'Cameroon',
    'cybersecurity scam OR phishing africa': 'Cybersecurity',
  };

  final Dio _dio;
  final Box _cache;

  NewsService(this._dio, this._cache);

  /// Cached articles if fresh enough, otherwise fetches all feeds,
  /// merges, de-duplicates and sorts newest-first. Falls back to the
  /// cache (however old) when offline; returns an empty list only if
  /// there has never been a successful fetch.
  Future<List<NewsArticle>> getNews({bool force = false}) async {
    final lastFetchIso = _cache.get(_cacheTimeKey) as String?;
    final lastFetch =
        lastFetchIso != null ? DateTime.tryParse(lastFetchIso) : null;
    final isFresh = lastFetch != null &&
        DateTime.now().difference(lastFetch) < _minRefreshInterval;

    if (!force && isFresh) {
      final cached = _readCache();
      if (cached.isNotEmpty) return cached;
    }

    try {
      final results = await Future.wait(
        _feeds.entries.map((feed) => _fetchFeed(feed.key, feed.value)),
      );
      final merged = <String, NewsArticle>{};
      for (final list in results) {
        for (final article in list) {
          merged[article.title] = article; // de-dupe by title
        }
      }
      final articles = merged.values.toList()
        ..sort((a, b) => (b.publishedAt ?? DateTime(2000))
            .compareTo(a.publishedAt ?? DateTime(2000)));

      if (articles.isNotEmpty) {
        await _cache.put(_cacheKey,
            jsonEncode(articles.map((a) => a.toJson()).toList()));
        await _cache.put(
            _cacheTimeKey, DateTime.now().toIso8601String());
      }
      return articles.isNotEmpty ? articles : _readCache();
    } catch (_) {
      return _readCache();
    }
  }

  Future<List<NewsArticle>> _fetchFeed(
      String query, String category) async {
    final url = 'https://news.google.com/rss/search'
        '?q=${Uri.encodeComponent(query)}&hl=en-US&gl=US&ceid=US:en';
    try {
      final response = await _dio.get<String>(
        url,
        options: Options(
          responseType: ResponseType.plain,
          receiveTimeout: const Duration(seconds: 12),
        ),
      );
      return _parseRss(response.data ?? '', category);
    } catch (_) {
      return const [];
    }
  }

  /// Minimal RSS <item> parser for the fields Google News provides.
  List<NewsArticle> _parseRss(String xml, String category) {
    final articles = <NewsArticle>[];
    final items = xml.split('<item>').skip(1);
    for (final raw in items.take(15)) {
      final item = raw.split('</item>').first;
      var title = _tag(item, 'title');
      final link = _tag(item, 'link');
      final pubDate = _tag(item, 'pubDate');
      var source = _tag(item, 'source');

      // Google News titles end with " - Publisher"; prefer the <source>
      // tag but fall back to splitting the title.
      if (source.isEmpty && title.contains(' - ')) {
        final parts = title.split(' - ');
        source = parts.removeLast().trim();
        title = parts.join(' - ').trim();
      } else if (title.endsWith(' - $source')) {
        title =
            title.substring(0, title.length - source.length - 3).trim();
      }

      if (title.isEmpty || link.isEmpty) continue;
      articles.add(NewsArticle(
        title: _decodeEntities(title),
        link: link,
        source: _decodeEntities(source),
        publishedAt: _parseRfc822(pubDate),
        category: category,
      ));
    }
    return articles;
  }

  String _tag(String xml, String tag) {
    final start = xml.indexOf('<$tag');
    if (start == -1) return '';
    final open = xml.indexOf('>', start);
    final close = xml.indexOf('</$tag>', open);
    if (open == -1 || close == -1) return '';
    var value = xml.substring(open + 1, close).trim();
    if (value.startsWith('<![CDATA[')) {
      value = value.substring(9);
      if (value.endsWith(']]>')) {
        value = value.substring(0, value.length - 3);
      }
    }
    return value.trim();
  }

  String _decodeEntities(String text) => text
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&apos;', "'");

  /// RFC-822 dates like "Tue, 14 Jul 2026 09:30:00 GMT".
  DateTime? _parseRfc822(String date) {
    if (date.isEmpty) return null;
    const months = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
    };
    try {
      final parts = date.replaceAll(',', '').split(RegExp(r'\s+'));
      // [Tue] 14 Jul 2026 09:30:00 GMT
      final offset = parts.length >= 6 ? 1 : 0;
      final day = int.parse(parts[offset]);
      final month = months[parts[offset + 1]] ?? 1;
      final year = int.parse(parts[offset + 2]);
      final time = parts[offset + 3].split(':');
      return DateTime.utc(year, month, day, int.parse(time[0]),
              int.parse(time[1]), int.parse(time[2]))
          .toLocal();
    } catch (_) {
      return null;
    }
  }

  List<NewsArticle> _readCache() {
    final raw = _cache.get(_cacheKey) as String?;
    if (raw == null) return const [];
    try {
      return (jsonDecode(raw) as List)
          .map((json) =>
              NewsArticle.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const [];
    }
  }
}
