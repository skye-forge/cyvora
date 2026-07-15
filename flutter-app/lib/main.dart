import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:dio/dio.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/constants/app_theme.dart';
import 'package:varnis/screens/splash_screen.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/providers/gamification_provider.dart';
import 'package:varnis/providers/settings_provider.dart';
import 'package:varnis/providers/report_provider.dart';
import 'package:varnis/providers/alert_provider.dart';
import 'package:varnis/providers/posts_provider.dart';
import 'package:varnis/providers/news_provider.dart';
import 'package:varnis/providers/notification_provider.dart';
import 'package:varnis/utils/local_storage.dart';
import 'package:varnis/services/api_service.dart';
import 'package:varnis/services/news_service.dart';

/// Global navigator key — needed later for navigating from push
/// notification taps (FCM) when no BuildContext is available.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalStorage.init();
  await Hive.initFlutter();
  await Hive.openBox('varnis_cache');
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ApiService first: every provider below depends on it.
        Provider<ApiService>(
          create: (_) => ApiService(Dio(), Hive.box('varnis_cache')),
        ),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(
          create: (context) => AuthProvider(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              GamificationProvider(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => ReportsProvider(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => AlertsProvider(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) => PostsProvider(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              NotificationsProvider(context.read<ApiService>()),
        ),
        ChangeNotifierProvider(
          create: (_) =>
              NewsProvider(NewsService(Dio(), Hive.box('varnis_cache'))),
        ),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settings, _) {
          return MaterialApp(
            title: AppConstants.appName,
            debugShowCheckedModeBanner: false,
            navigatorKey: navigatorKey,
            theme: AppTheme.lightTheme,
            // TODO: design a proper dark theme; until then dark mode
            // falls back to the light theme.
            darkTheme: AppTheme.lightTheme,
            themeMode: settings.themeMode,
            locale: settings.locale,
            supportedLocales: const [Locale('en'), Locale('fr')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}