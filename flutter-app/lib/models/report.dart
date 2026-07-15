/// Incident report. Includes fields for the ML review pipeline:
/// when the admin hasn't reviewed a report in time, a trained model
/// analyses it and populates [aiAnalysis]; [reviewedBy] then reads
/// e.g. 'AI Taskforce Assistant' instead of an officer's name.
class Report {
  final String id; // e.g. 'CV-9821'
  final String title;
  final String category; // e.g. 'Phishing', 'Scam Call', 'Fake Site'
  final String description;
  final String status; // 'Pending' | 'Under Review' | 'Approved' | 'Rejected'
  final DateTime createdAt;
  final String location; // e.g. 'Yaoundé, Mfoundi'
  final List<String> imageUrls; // attached screenshots/photos
  final List<ReportStatusEvent> timeline;
  final bool isAnonymous; // reporter identity hidden from public view

  // ML review pipeline fields (nullable until the backend populates them)
  final String? aiAnalysis; // model's analysis summary
  final String? reviewedBy; // officer name or 'AI Taskforce Assistant'
  final double? aiConfidence; // 0.0 - 1.0

  Report({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    this.status = 'Pending',
    required this.createdAt,
    this.location = '',
    this.imageUrls = const [],
    this.timeline = const [],
    this.isAnonymous = false,
    this.aiAnalysis,
    this.reviewedBy,
    this.aiConfidence,
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['id'] as String,
      title: json['title'] as String,
      category: json['category'] as String? ?? '',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'Pending',
      createdAt: DateTime.parse(json['createdAt'] as String),
      location: json['location'] as String? ?? '',
      imageUrls: (json['imageUrls'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      timeline: (json['timeline'] as List<dynamic>?)
              ?.map((e) =>
                  ReportStatusEvent.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      isAnonymous: json['isAnonymous'] as bool? ?? false,
      aiAnalysis: json['aiAnalysis'] as String?,
      reviewedBy: json['reviewedBy'] as String?,
      aiConfidence: (json['aiConfidence'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'category': category,
      'description': description,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'location': location,
      'imageUrls': imageUrls,
      'timeline': timeline.map((e) => e.toJson()).toList(),
      'isAnonymous': isAnonymous,
      'aiAnalysis': aiAnalysis,
      'reviewedBy': reviewedBy,
      'aiConfidence': aiConfidence,
    };
  }
}

/// One step in a report's status timeline
/// (Submitted → AI Pre-Review / Under Review → Approved/Rejected).
class ReportStatusEvent {
  final String label;
  final DateTime date;
  final bool isCompleted;

  ReportStatusEvent({
    required this.label,
    required this.date,
    this.isCompleted = true,
  });

  factory ReportStatusEvent.fromJson(Map<String, dynamic> json) {
    return ReportStatusEvent(
      label: json['label'] as String,
      date: DateTime.parse(json['date'] as String),
      isCompleted: json['isCompleted'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'date': date.toIso8601String(),
      'isCompleted': isCompleted,
    };
  }
}