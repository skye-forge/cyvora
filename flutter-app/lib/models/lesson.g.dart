// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lesson.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Lesson _$LessonFromJson(Map<String, dynamic> json) => Lesson(
      id: json['id'] as String,
      title: json['title'] as String,
      category: json['category'] as String,
      description: json['description'] as String,
      duration: json['duration'] as String,
      progress: (json['progress'] as num?)?.toInt() ?? 0,
      pages: (json['pages'] as List<dynamic>)
          .map((e) => LessonPage.fromJson(e as Map<String, dynamic>))
          .toList(),
      coverImageUrl: json['coverImageUrl'] as String?,
    );

Map<String, dynamic> _$LessonToJson(Lesson instance) => <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'category': instance.category,
      'description': instance.description,
      'duration': instance.duration,
      'progress': instance.progress,
      'pages': instance.pages,
      'coverImageUrl': instance.coverImageUrl,
    };

LessonPage _$LessonPageFromJson(Map<String, dynamic> json) => LessonPage(
      title: json['title'] as String?,
      intro: json['intro'] as String?,
      moduleLabel: json['moduleLabel'] as String?,
      blocks: (json['blocks'] as List<dynamic>)
          .map((e) => LessonBlock.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$LessonPageToJson(LessonPage instance) =>
    <String, dynamic>{
      'title': instance.title,
      'intro': instance.intro,
      'moduleLabel': instance.moduleLabel,
      'blocks': instance.blocks,
    };

LessonBlock _$LessonBlockFromJson(Map<String, dynamic> json) => LessonBlock(
      type: json['type'] as String,
      text: json['text'] as String?,
      url: json['url'] as String?,
      label: json['label'] as String?,
      title: json['title'] as String?,
      labelColor: json['labelColor'] as String?,
      icon: json['icon'] as String?,
      note: json['note'] as String?,
      variant: json['variant'] as String?,
      style: json['style'] as String?,
      children: (json['children'] as List<dynamic>?)
          ?.map((e) => LessonBlock.fromJson(e as Map<String, dynamic>))
          .toList(),
      items: (json['items'] as List<dynamic>?)
          ?.map((e) => LessonListItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      highlight: json['highlight'] as String?,
      filename: json['filename'] as String?,
      source: json['source'] as String?,
      quiz: json['quiz'] == null
          ? null
          : LessonQuiz.fromJson(json['quiz'] as Map<String, dynamic>),
      keyPoints: (json['keyPoints'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$LessonBlockToJson(LessonBlock instance) =>
    <String, dynamic>{
      'type': instance.type,
      'text': instance.text,
      'url': instance.url,
      'label': instance.label,
      'title': instance.title,
      'labelColor': instance.labelColor,
      'icon': instance.icon,
      'note': instance.note,
      'variant': instance.variant,
      'style': instance.style,
      'children': instance.children,
      'items': instance.items,
      'highlight': instance.highlight,
      'filename': instance.filename,
      'source': instance.source,
      'quiz': instance.quiz,
      'keyPoints': instance.keyPoints,
    };

LessonListItem _$LessonListItemFromJson(Map<String, dynamic> json) =>
    LessonListItem(
      title: json['title'] as String?,
      text: json['text'] as String,
    );

Map<String, dynamic> _$LessonListItemToJson(LessonListItem instance) =>
    <String, dynamic>{
      'title': instance.title,
      'text': instance.text,
    };

LessonQuiz _$LessonQuizFromJson(Map<String, dynamic> json) => LessonQuiz(
      question: json['question'] as String,
      options:
          (json['options'] as List<dynamic>).map((e) => e as String).toList(),
      correctAnswerIndex: (json['correctAnswerIndex'] as num).toInt(),
      explanation: json['explanation'] as String?,
    );

Map<String, dynamic> _$LessonQuizToJson(LessonQuiz instance) =>
    <String, dynamic>{
      'question': instance.question,
      'options': instance.options,
      'correctAnswerIndex': instance.correctAnswerIndex,
      'explanation': instance.explanation,
    };
