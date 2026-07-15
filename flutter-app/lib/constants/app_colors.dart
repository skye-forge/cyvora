import 'package:flutter/material.dart';

class AppColors {
  // Brand — deep navy per Varnis design
  static const Color primary = Color(0xFF14276B);      // was 0xFF165DFF
  static const Color primaryDark = Color(0xFF0B1B45);  // lock icon / darkest navy
  static const Color primaryLight = Color(0xFFE4E7FB); // badge/tinted backgrounds
  static const Color titleBlue = Color(0xFF1B3B8B);    // NEW: auth screen titles
  static const Color secondary = Color(0xFF5D87FF);
  static const Color onPrimaryMuted = Color(0xFFB9C4E8); // NEW: light text on navy cards
  static const Color accent = Color(0xFFFF7D00);
  static const Color accentGreen = Color(0xFF3DDC64);  // NEW: splash lock badge / status dots

  // Surfaces
  static const Color background = Color(0xFFF6F7FB);   // NEW: light page background
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);

  // Grays (unchanged — already match the design)
  static const Color gray50 = Color(0xFFF9FAFB);
  static const Color gray100 = Color(0xFFF3F4F6);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray300 = Color(0xFFD1D5DB);
  static const Color gray400 = Color(0xFF9CA3AF);
  static const Color gray500 = Color(0xFF6B7280);
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray700 = Color(0xFF374151);
  static const Color gray800 = Color(0xFF1F2937);
  static const Color gray900 = Color(0xFF111827);

  // Semantic
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFE7F8EE); // NEW: green chip/icon backgrounds
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color errorDark = Color(0xFFD32F2F);    // NEW: alert banner text/icon
  static const Color errorLight = Color(0xFFFDE8E8);   // NEW: alert banner background
  static const Color info = Color(0xFF3B82F6);
}