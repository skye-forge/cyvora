import 'package:flutter/material.dart';
import 'package:varnis/utils/local_storage.dart';

/// App-wide user preferences: language, theme, notifications, biometrics.
/// Persisted via LocalStorage so they survive restarts.
///
/// Language is chosen during signup and can be changed in Settings.
class SettingsProvider extends ChangeNotifier {
  static const String _localeKey = 'app_locale';
  static const String _darkModeKey = 'dark_mode';
  static const String _notificationsKey = 'notifications_enabled';
  static const String _biometricKey = 'biometric_enabled';

  Locale _locale = const Locale('en');
  bool _darkMode = false;
  bool _notificationsEnabled = true;
  bool _biometricEnabled = false;

  SettingsProvider() {
    _load();
  }

  Locale get locale => _locale;
  bool get isFrench => _locale.languageCode == 'fr';
  bool get darkMode => _darkMode;
  ThemeMode get themeMode => _darkMode ? ThemeMode.dark : ThemeMode.light;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get biometricEnabled => _biometricEnabled;

  void _load() {
    final savedLocale = LocalStorage.getString(_localeKey);
    if (savedLocale != null) _locale = Locale(savedLocale);
    _darkMode = LocalStorage.getBool(_darkModeKey) ?? false;
    _notificationsEnabled = LocalStorage.getBool(_notificationsKey) ?? true;
    _biometricEnabled = LocalStorage.getBool(_biometricKey) ?? false;
    notifyListeners();
  }

  Future<void> setLocale(String languageCode) async {
    _locale = Locale(languageCode);
    await LocalStorage.saveString(_localeKey, languageCode);
    notifyListeners();
  }

  Future<void> setDarkMode(bool value) async {
    _darkMode = value;
    await LocalStorage.saveBool(_darkModeKey, value);
    notifyListeners();
  }

  Future<void> setNotificationsEnabled(bool value) async {
    _notificationsEnabled = value;
    await LocalStorage.saveBool(_notificationsKey, value);
    notifyListeners();
    // TODO: subscribe/unsubscribe FCM topics when push is wired
  }

  Future<void> setBiometricEnabled(bool value) async {
    _biometricEnabled = value;
    await LocalStorage.saveBool(_biometricKey, value);
    notifyListeners();
  }
}