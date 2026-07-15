import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/providers/settings_provider.dart';

/// Shared EN / FR picker, used by the header language buttons across
/// screens and the Settings language row. Persists the choice via
/// [SettingsProvider.setLocale].
Future<void> showLanguagePicker(BuildContext context) async {
  final settings = context.read<SettingsProvider>();
  final selected = await showModalBottomSheet<String>(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (context) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 14),
          const Text(
            'Language / Langue',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          RadioListTile<String>(
            value: 'en',
            groupValue: settings.locale.languageCode,
            title: const Text('English'),
            activeColor: AppColors.primary,
            onChanged: (v) => Navigator.pop(context, v),
          ),
          RadioListTile<String>(
            value: 'fr',
            groupValue: settings.locale.languageCode,
            title: const Text('Français'),
            activeColor: AppColors.primary,
            onChanged: (v) => Navigator.pop(context, v),
          ),
          const SizedBox(height: 8),
        ],
      ),
    ),
  );
  if (selected != null) await settings.setLocale(selected);
}
