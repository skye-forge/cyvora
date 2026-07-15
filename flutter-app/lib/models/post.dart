class Post {
  final String id;
  final String authorName;
  final String authorInitials;
  final String location;
  final DateTime timestamp;
  final String content;
  final List<String> hashtags;
  final String? imageUrl;
  final String? avatarUrl;

  // Mutable: updated optimistically by PostsProvider
  int likes;
  int comments;
  int shares;
  bool isLiked;
  bool isSaved;

  Post({
    required this.id,
    required this.authorName,
    this.authorInitials = '',
    this.location = '',
    required this.timestamp,
    required this.content,
    this.hashtags = const [],
    this.imageUrl,
    this.avatarUrl,
    this.likes = 0,
    this.comments = 0,
    this.shares = 0,
    this.isLiked = false,
    this.isSaved = false,
  });

  /// Tolerant parsing: accepts snake_case (primary) and camelCase keys.
  factory Post.fromJson(Map<String, dynamic> json) {
    T? pick<T>(String snake, String camel) =>
        (json[snake] ?? json[camel]) as T?;

    final authorName = pick<String>('author_name', 'authorName') ?? '';
    final initials = pick<String>('author_initials', 'authorInitials') ??
        authorName
            .trim()
            .split(RegExp(r'\s+'))
            .map((word) => word.isNotEmpty ? word[0] : '')
            .take(2)
            .join()
            .toUpperCase();

    return Post(
      id: json['id'].toString(),
      authorName: authorName,
      authorInitials: initials,
      location: json['location'] as String? ?? '',
      timestamp: DateTime.parse(
        (pick<String>('created_at', 'timestamp')) ??
            DateTime.now().toIso8601String(),
      ),
      content: json['content'] as String? ?? '',
      hashtags: (json['hashtags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      imageUrl: pick<String>('image_url', 'imageUrl'),
      avatarUrl: pick<String>('avatar_url', 'avatarUrl'),
      likes: json['likes'] as int? ?? 0,
      comments: json['comments'] as int? ?? 0,
      shares: json['shares'] as int? ?? 0,
      isLiked: pick<bool>('is_liked', 'isLiked') ?? false,
      isSaved: pick<bool>('is_saved', 'isSaved') ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'author_name': authorName,
      'author_initials': authorInitials,
      'location': location,
      'created_at': timestamp.toIso8601String(),
      'content': content,
      'hashtags': hashtags,
      'image_url': imageUrl,
      'avatar_url': avatarUrl,
      'likes': likes,
      'comments': comments,
      'shares': shares,
      'is_liked': isLiked,
      'is_saved': isSaved,
    };
  }
}