/// A headline from an external news feed (RSS). Used by the Live News
/// tab on the National Updates screen. Distinct from [Alert], which is
/// an official taskforce publication from the Varnis backend.
class NewsArticle {
  final String title;
  final String link;
  final String source; // publisher name, e.g. 'Cameroon Tribune'
  final DateTime? publishedAt;
  final String category; // 'Cameroon' | 'Cybersecurity'

  NewsArticle({
    required this.title,
    required this.link,
    this.source = '',
    this.publishedAt,
    this.category = '',
  });

  factory NewsArticle.fromJson(Map<String, dynamic> json) {
    return NewsArticle(
      title: json['title'] as String? ?? '',
      link: json['link'] as String? ?? '',
      source: json['source'] as String? ?? '',
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'] as String)
          : null,
      category: json['category'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'title': title,
        'link': link,
        'source': source,
        'publishedAt': publishedAt?.toIso8601String(),
        'category': category,
      };
}
