/// Sample data served by ApiService while mockMode is on (backend not
/// yet live). Mirrors the content shown in the design mocks so demos
/// look real. Delete or ignore once the backend is the source of truth.
library;

import 'package:varnis/models/alert.dart';
import 'package:varnis/models/notification.dart';
import 'package:varnis/models/post.dart';
import 'package:varnis/models/report.dart';

final List<Report> sampleReports = [
  Report(
    id: 'CV-9828',
    title: 'Phishing Attempt',
    category: 'Phishing',
    description:
        'I received a suspicious SMS claiming to be from my bank (BICEC). '
        'The message stated that my account was temporarily suspended and '
        'provided a link (www.bicec-auth-portal.com) to "verify" my '
        'identity. The site looked identical to the official bank login '
        'but the URL was incorrect.',
    status: 'Pending',
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
    location: 'Yaoundé, Mfoundi',
    timeline: [
      ReportStatusEvent(
        label: 'Submitted',
        date: DateTime.now().subtract(const Duration(days: 1)),
      ),
    ],
  ),
  Report(
    id: 'CV-9825',
    title: 'Physical Disturbance',
    category: 'Public Safety',
    description:
        'Group causing disturbance near the market entrance in the evening '
        'hours. Reported for community awareness.',
    status: 'Approved',
    createdAt: DateTime.now().subtract(const Duration(days: 3)),
    location: 'Douala, Wouri',
    reviewedBy: 'Regional Office',
    timeline: [
      ReportStatusEvent(
        label: 'Submitted',
        date: DateTime.now().subtract(const Duration(days: 3)),
      ),
      ReportStatusEvent(
        label: 'Under Review',
        date: DateTime.now().subtract(const Duration(days: 2)),
      ),
      ReportStatusEvent(
        label: 'Approved',
        date: DateTime.now().subtract(const Duration(days: 1)),
      ),
    ],
  ),
  Report(
    id: 'CV-9812',
    title: 'Suspicious Activity',
    category: 'Scam Call',
    description:
        'Received repeated calls from an unknown number claiming to be a '
        'mobile money agent asking for my PIN.',
    status: 'Rejected',
    createdAt: DateTime.now().subtract(const Duration(days: 5)),
    location: 'Yaoundé, Bastos',
    reviewedBy: 'AI Taskforce Assistant',
    aiAnalysis:
        'Automated analysis: insufficient identifying information to '
        'action this report. No number, date, or recording was provided. '
        'Resubmit with the caller\'s number if the calls continue.',
    aiConfidence: 0.87,
    timeline: [
      ReportStatusEvent(
        label: 'Submitted',
        date: DateTime.now().subtract(const Duration(days: 5)),
      ),
      ReportStatusEvent(
        label: 'AI Pre-Review',
        date: DateTime.now().subtract(const Duration(days: 4)),
      ),
      ReportStatusEvent(
        label: 'Rejected',
        date: DateTime.now().subtract(const Duration(days: 4)),
      ),
    ],
  ),
];

final List<Alert> sampleAlerts = [
  Alert(
    id: 'a1',
    category: 'Urgent',
    title: 'Critical Alert: New Banking Scam',
    content:
        'A sophisticated phishing campaign targeting local banking users '
        'has been detected. Users are advised never to share OTPs or click '
        'links in unsolicited SMS messages claiming to be from their '
        'financial institutions.',
    fullContent:
        'A sophisticated phishing campaign targeting local banking users '
        'has been detected across Douala and Yaoundé. Victims receive an '
        'SMS claiming their account is suspended, with a link to a cloned '
        'bank login page.\n\nDo not click links in unsolicited messages. '
        'Banks never ask for your PIN, OTP, or password by SMS or phone. '
        'If you have entered credentials on a suspicious site, contact '
        'your bank immediately and report the incident through Varnis.',
    publishedAt: DateTime.now().subtract(const Duration(hours: 5)),
    region: 'Douala',
  ),
  Alert(
    id: 'a2',
    category: 'Security',
    title: 'Update: National Security Guidelines',
    content:
        'The national cybersecurity agency has published revised guidelines '
        'for personal data protection. All citizens are encouraged to '
        'review the updated recommendations.',
    publishedAt: DateTime.now().subtract(const Duration(days: 2)),
  ),
  Alert(
    id: 'a3',
    category: 'Info',
    title: 'New Digital Safety Course Available',
    content:
        'A new course on advanced password security is now available in '
        'the Learning Academy. Complete it to earn safety points.',
    publishedAt: DateTime.now().subtract(const Duration(days: 6)),
  ),
];

final List<Post> samplePosts = [
  Post(
    id: 'p1',
    authorName: 'Chidi O.',
    authorInitials: 'CO',
    location: 'Bamenda',
    timestamp: DateTime.now().subtract(const Duration(hours: 2)),
    content:
        "Beware of fake 'Win a Car' SMS links. Don't click! Many residents "
        'are reporting receiving these messages today. They ask for your '
        'ID card info to claim the prize. Stay safe!',
    hashtags: ['ScamAlert', 'SafetyTip'],
    likes: 24,
    comments: 8,
    shares: 2,
  ),
  Post(
    id: 'p2',
    authorName: 'Marie N.',
    authorInitials: 'MN',
    location: 'Douala',
    timestamp: DateTime.now().subtract(const Duration(hours: 5)),
    content:
        'Just saw a suspicious bag left near the Akwa station. Reported to '
        'the platform already. Please avoid the North entrance for now.',
    hashtags: ['Douala', 'PublicSafety'],
    likes: 112,
    comments: 45,
    shares: 12,
    isLiked: true,
  ),
];

final List<AppNotification> sampleNotifications = [
  AppNotification(
    id: 'n1',
    type: NotificationType.incidentUpdate,
    title: 'Report #CV-9825 approved',
    body: 'Your safety report regarding traffic infrastructure in Mfoundi '
        'has been verified and approved by the civic authority.',
    timestamp: DateTime.now().subtract(const Duration(hours: 2)),
    isRead: false,
    relatedId: 'CV-9825',
  ),
  AppNotification(
    id: 'n2',
    type: NotificationType.communityReply,
    title: 'Reply to your Community Post',
    body: 'Officer Jean-Pierre replied: "Thank you for the detailed '
        'observation. We are dispatching a team to investigate."',
    timestamp: DateTime.now().subtract(const Duration(hours: 5)),
    isRead: false,
    relatedId: 'p2',
  ),
  AppNotification(
    id: 'n3',
    type: NotificationType.lessonReminder,
    title: 'New Lesson Available',
    body: '"First Aid Essentials: Handling Domestic Injuries" is now '
        'available in the Learn module.',
    timestamp: DateTime.now().subtract(const Duration(days: 1)),
    isRead: true,
    relatedId: '2',
  ),
  AppNotification(
    id: 'n4',
    type: NotificationType.insights,
    title: 'Weekly Safety Insights',
    body: 'Safety metrics for the Wouri region improved by 12% last week. '
        'View the full civic report.',
    timestamp: DateTime.now().subtract(const Duration(days: 2)),
    isRead: true,
  ),
];

final List<Map<String, dynamic>> sampleSafeZones = [
  {
    'name': 'Bastos Community Center',
    'address': 'Rue 1839, Bastos, Yaoundé',
    'latitude': 3.8940,
    'longitude': 11.5090,
    'hours': 'Open 24/7',
  },
  {
    'name': 'Central Police Station',
    'address': 'Avenue Kennedy, Centre-ville, Yaoundé',
    'latitude': 3.8667,
    'longitude': 11.5167,
    'hours': 'Open 24/7',
  },
  {
    'name': 'Mfoundi District Library',
    'address': 'Quartier Nlongkak, Yaoundé',
    'latitude': 3.8830,
    'longitude': 11.5210,
    'hours': 'Mon–Fri: 9AM–8PM',
  },
  {
    'name': 'Fire Brigade Station No. 2',
    'address': 'Boulevard du 20 Mai, Yaoundé',
    'latitude': 3.8610,
    'longitude': 11.5180,
    'hours': 'Open 24/7',
  },
];