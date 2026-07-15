class AppConstants {
  // API Configuration
  static const String baseUrl = 'https://api.varnis.example.com';
  static const String apiVersion = 'v1';

  // API Endpoints
  static const String authEndpoint = '/auth';
  static const String loginEndpoint = '$authEndpoint/login';
  static const String registerEndpoint = '$authEndpoint/register';
  static const String logoutEndpoint = '$authEndpoint/logout';

  static const String reportsEndpoint = '/reports';
  static const String lessonsEndpoint = '/lessons';
  static const String postsEndpoint = '/posts';
  static const String usersEndpoint = '/users';

  // Storage Keys
  static const String isFirstLaunchKey = 'is_first_launch';
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';

  // App Info
  static const String appName = 'Varnis';
  static const String supportEmail = 'support@varnis.cm';
  static const String privacyPolicyUrl = 'https://varnis.cm/privacy';
  static const String termsUrl = 'https://varnis.cm/terms';

  // Report incident form
  static const List<String> reportCategories = [
    'Phishing',
    'Scam Call',
    'Fake Website',
    'Malware',
    'Harassment',
    'Data Breach',
    'Identity Theft',
    'Other',
  ];
  static const int reportDescriptionMinLength = 20;
  static const int reportMaxEvidenceImages = 4;
}
