/// Lesson content model — JSON-driven so lessons can be authored in the
/// admin dashboard and rendered by the app without an app release.
///
/// A Lesson has pages; each page has a module label, an optional title,
/// and a list of content blocks. Block types (see LessonDetailScreen for
/// how each renders):
///
///   heading      {text}
///   paragraph    {text}                       — supports **bold** + `code`
///   image        {url}
///   hero         {title, text}                — navy callout card
///   section      {label, labelColor?, icon?, note?, children[]}
///                                             — white card wrapping blocks
///   alert        {title?, text, variant}      — variant: danger | warning
///   critical     {label?, headline, text}     — big red rule card
///   checklist    {title?, style, items[]}     — style: check | cross
///   steps        {items[]}                    — numbered steps
///   quote        {label?, text}               — green pro-tip card, italic
///   emailSample  {highlight?, text}           — monospace phishing sample
///   attachment   {filename, source}           — suspicious file preview
///   tip          {text}                       — legacy lightbulb tip
///   quiz         {quiz}                       — interactive quiz
///
/// items[] entries: {title?, text}
///
/// Legacy support: a lesson JSON with a top-level "blocks" array (the old
/// schema) is auto-converted to one block per page.
library;
import 'package:json_annotation/json_annotation.dart';

part 'lesson.g.dart';

@JsonSerializable()
class Lesson {
  final String id;
  final String title;
  final String category;
  final String description;
  final String duration;
  final int progress;
  final List<LessonPage> pages;
  final String? coverImageUrl;

  Lesson({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.duration,
    this.progress = 0,
    required this.pages,
    this.coverImageUrl,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) => _$LessonFromJson(json);
  Map<String, dynamic> toJson() => _$LessonToJson(this);

  Lesson copyWith({
    String? id,
    String? title,
    String? category,
    String? description,
    String? duration,
    int? progress,
    List<LessonPage>? pages,
    String? coverImageUrl,
  }) {
    return Lesson(
      id: id ?? this.id,
      title: title ?? this.title,
      category: category ?? this.category,
      description: description ?? this.description,
      duration: duration ?? this.duration,
      progress: progress ?? this.progress,
      pages: pages ?? this.pages,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
    );
  }
}

@JsonSerializable()
class LessonPage {
  final String? title;
  final String? intro;
  final String? moduleLabel;
  final List<LessonBlock> blocks;

  LessonPage({this.title, this.intro, this.moduleLabel, required this.blocks});

  factory LessonPage.fromJson(Map<String, dynamic> json) =>
      _$LessonPageFromJson(json);
  Map<String, dynamic> toJson() => _$LessonPageToJson(this);
}

@JsonSerializable()
class LessonBlock {
  final String type;
  final String? text;
  final String? url;
  final String? label;
  final String? title;
  final String? labelColor;
  final String? icon;
  final String? note;
  final String? variant;
  final String? style;
  final List<LessonBlock>? children;
  final List<LessonListItem>? items;
  final String? highlight;
  final String? filename;
  final String? source;
  final LessonQuiz? quiz;
  final List<String>? keyPoints;

  LessonBlock({
    required this.type,
    this.text,
    this.url,
    this.label,
    this.title,
    this.labelColor,
    this.icon,
    this.note,
    this.variant,
    this.style,
    this.children,
    this.items,
    this.highlight,
    this.filename,
    this.source,
    this.quiz,
    this.keyPoints,
  });

  factory LessonBlock.fromJson(Map<String, dynamic> json) =>
      _$LessonBlockFromJson(json);
  Map<String, dynamic> toJson() => _$LessonBlockToJson(this);
}

@JsonSerializable()
class LessonListItem {
  final String? title;
  final String text;

  LessonListItem({this.title, required this.text});

  factory LessonListItem.fromJson(Map<String, dynamic> json) =>
      _$LessonListItemFromJson(json);
  Map<String, dynamic> toJson() => _$LessonListItemToJson(this);
}

@JsonSerializable()
class LessonQuiz {
  final String question;
  final List<String> options;
  final int correctAnswerIndex;
  final String? explanation;

  LessonQuiz({
    required this.question,
    required this.options,
    required this.correctAnswerIndex,
    this.explanation,
  });

  factory LessonQuiz.fromJson(Map<String, dynamic> json) =>
      _$LessonQuizFromJson(json);
  Map<String, dynamic> toJson() => _$LessonQuizToJson(this);
}
