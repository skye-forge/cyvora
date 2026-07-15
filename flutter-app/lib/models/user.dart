class User {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final DateTime? createdAt;

  // Design-driven additions
  final String city; // e.g. 'Yaoundé'
  final String bio;
  final bool isVerified; // drives the 'Verified Citizen' badge
  final String preferredLanguage; // 'en' | 'fr'
  final int reportsCount;
  final int lessonsCount;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    this.avatarUrl,
    this.createdAt,
    this.city = '',
    this.bio = '',
    this.isVerified = false,
    this.preferredLanguage = 'en',
    this.reportsCount = 0,
    this.lessonsCount = 0,
  });

  String get initials {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    return parts
        .map((word) => word.isNotEmpty ? word[0] : '')
        .take(2)
        .join()
        .toUpperCase();
  }

  /// Tolerant parsing: accepts snake_case (primary convention) and
  /// camelCase, so the app keeps working whichever the backend ships.
  factory User.fromJson(Map<String, dynamic> json) {
    T? pick<T>(String snake, String camel) =>
        (json[snake] ?? json[camel]) as T?;

    final stats = (json['stats'] as Map<String, dynamic>?) ?? const {};
    final createdRaw = pick<String>('created_at', 'createdAt');

    return User(
      id: json['id'].toString(),
      fullName: pick<String>('full_name', 'fullName') ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String?,
      avatarUrl: pick<String>('avatar', 'avatarUrl'),
      createdAt: createdRaw != null ? DateTime.parse(createdRaw) : null,
      city: json['city'] as String? ?? '',
      bio: json['bio'] as String? ?? '',
      isVerified: pick<bool>('is_verified', 'isVerified') ?? false,
      preferredLanguage:
          pick<String>('preferred_language', 'preferredLanguage') ?? 'en',
      reportsCount: stats['reports'] as int? ?? 0,
      lessonsCount: stats['lessons'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'email': email,
      'phone': phone,
      'avatar': avatarUrl,
      'created_at': createdAt?.toIso8601String(),
      'city': city,
      'bio': bio,
      'is_verified': isVerified,
      'preferred_language': preferredLanguage,
      'stats': {'reports': reportsCount, 'lessons': lessonsCount},
    };
  }

  User copyWith({
    String? fullName,
    String? email,
    String? phone,
    String? avatarUrl,
    String? city,
    String? bio,
    String? preferredLanguage,
  }) {
    return User(
      id: id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      createdAt: createdAt,
      city: city ?? this.city,
      bio: bio ?? this.bio,
      isVerified: isVerified,
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      reportsCount: reportsCount,
      lessonsCount: lessonsCount,
    );
  }
}