/// National update / safety alert, published by admins (and later
/// aggregated from official sources server-side). Urgent alerts are
/// also delivered as push notifications.
class Alert {
  final String id;
  final String category; // 'Urgent' | 'Security' | 'Info'
  final String title;
  final String content; // short body shown in lists
  final String? fullContent; // long body for the alert detail screen
  final DateTime publishedAt;
  final String? region; // e.g. 'Douala', 'Yaoundé', null = national

  Alert({
    required this.id,
    required this.category,
    required this.title,
    required this.content,
    this.fullContent,
    required this.publishedAt,
    this.region,
  });

  bool get isUrgent => category == 'Urgent';

  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      id: json['id'] as String,
      category: json['category'] as String? ?? 'Info',
      title: json['title'] as String,
      content: json['content'] as String? ?? '',
      fullContent: json['fullContent'] as String?,
      publishedAt: DateTime.parse(json['publishedAt'] as String),
      region: json['region'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category': category,
      'title': title,
      'content': content,
      'fullContent': fullContent,
      'publishedAt': publishedAt.toIso8601String(),
      'region': region,
    };
  }
}