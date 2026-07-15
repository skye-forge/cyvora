import 'package:varnis/models/lesson.dart';

// Sample JSON data for lessons
List<Map<String, dynamic>> sampleLessonJson = [
  {
    "id": "1",
    "title": "Introduction to Phishing",
    "category": "Phishing Awareness",
    "description": "Learn the basics of phishing attacks and how to spot them.",
    "duration": "15 min",
    "progress": 30,
    "coverImageUrl":
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cybersecurity%20phishing%20education%20illustration&image_size=landscape_16_9",
    "pages": [
      {
        "moduleLabel": "Module 1 / 4",
        "title": "What is Phishing?",
        "intro":
            "Phishing is a type of social engineering attack where attackers impersonate legitimate entities to trick you into revealing sensitive information.",
        "blocks": [
          {"type": "heading", "text": "How it Works"},
          {
            "type": "paragraph",
            "text":
                "Attackers pretend to be someone you trust (like a bank or service provider) and ask for personal information.",
          },
          {
            "type": "image",
            "url":
                "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=phishing%20attack%20illustration&image_size=landscape_16_9",
          },
        ],
      },
      {
        "moduleLabel": "Module 2 / 4",
        "title": "Red Flags to Spot",
        "intro": "Here are the most common signs of a phishing attempt.",
        "blocks": [
          {
            "type": "alert",
            "variant": "warning",
            "title": "Generic Greetings",
            "text":
                "Look for generic salutations like \"Dear Customer\" instead of your actual name.",
          },
          {
            "type": "checklist",
            "style": "cross",
            "title": "Common Red Flags",
            "items": [
              {
                "title": "Urgent language",
                "text": "They try to scare you into acting quickly.",
              },
              {
                "title": "Misspelled domains",
                "text": "Check URLs carefully for typos.",
              },
              {
                "title": "Requests for personal info",
                "text": "Legitimate companies rarely ask for this via email.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    "id": "2",
    "title": "Spotting Phishing Links",
    "category": "Phishing Awareness",
    "description":
        "Master the art of identifying malicious URLs before you click.",
    "duration": "12 min",
    "progress": 80,
    "coverImageUrl":
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cybersecurity%20url%20link%20checking&image_size=landscape_16_9",
    "pages": [
      {
        "title": "Checking Links",
        "intro":
            "Hover over links (on desktop) or press and hold (on mobile) to see the actual URL.",
        "blocks": [
          {
            "type": "tip",
            "text":
                "Always look for HTTPS and the padlock icon in your browser.",
          },
        ],
      },
    ],
  },
];

// Helper function to get Lesson objects from JSON
List<Lesson> getSampleLessons() {
  return sampleLessonJson.map((json) => Lesson.fromJson(json)).toList();
}
