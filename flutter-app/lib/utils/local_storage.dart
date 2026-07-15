
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  static late SharedPreferences _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Save data
  static Future<bool> saveString(String key, String value) async {
    return await _prefs.setString(key, value);
  }

  static Future<bool> saveBool(String key, bool value) async {
    return await _prefs.setBool(key, value);
  }

  static Future<bool> saveInt(String key, int value) async {
    return await _prefs.setInt(key, value);
  }

  static Future<bool> saveDouble(String key, double value) async {
    return await _prefs.setDouble(key, value);
  }

  static Future<bool> saveStringList(String key, List<String> value) async {
    return await _prefs.setStringList(key, value);
  }

  // Get data
  static String? getString(String key) {
    return _prefs.getString(key);
  }

  static bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  static int? getInt(String key) {
    return _prefs.getInt(key);
  }

  static double? getDouble(String key) {
    return _prefs.getDouble(key);
  }

  static List<String>? getStringList(String key) {
    return _prefs.getStringList(key);
  }

  // Remove data
  static Future<bool> remove(String key) async {
    return await _prefs.remove(key);
  }

  static Future<bool> clear() async {
    return await _prefs.clear();
  }

  // Check if key exists
  static bool containsKey(String key) {
    return _prefs.containsKey(key);
  }
}
