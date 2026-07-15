import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/providers/settings_provider.dart';
import 'package:varnis/utils/language_picker.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'change_password_screen.dart';
import 'edit_profile_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _localAuth = LocalAuthentication();
  String _version = '';

  @override
  void initState() {
    super.initState();
    PackageInfo.fromPlatform().then((info) {
      if (mounted) {
        setState(() =>
            _version = 'v${info.version} (Build ${info.buildNumber})');
      }
    });
  }

  Future<void> _toggleBiometric(bool enable) async {
    final settings = context.read<SettingsProvider>();
    if (!enable) {
      await settings.setBiometricEnabled(false);
      return;
    }
    // Confirm the device actually supports biometrics and the user can
    // authenticate before persisting the preference.
    try {
      final supported = await _localAuth.isDeviceSupported();
      final canCheck = await _localAuth.canCheckBiometrics;
      if (!supported || !canCheck) {
        _showSnack('Biometric authentication is not available on this device.',
            isError: true);
        return;
      }
      final didAuth = await _localAuth.authenticate(
        localizedReason: 'Confirm your identity to enable biometric login',
      );
      if (didAuth) await settings.setBiometricEnabled(true);
    } catch (_) {
      _showSnack('Could not enable biometric login.', isError: true);
    }
  }


  Future<void> _openUrl(String url) async {
    final ok = await launchUrl(Uri.parse(url),
        mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      _showSnack('Could not open the link.', isError: true);
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              const SizedBox(height: 18),
              const Text(
                'Settings',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.gray900,
                ),
              ),
              const SizedBox(height: 14),
              _buildProfileRow(context),
              const SizedBox(height: 24),

              _buildSectionLabel('GENERAL'),
              const SizedBox(height: 10),
              _buildSwitchRow(
                icon: Icons.notifications_none_rounded,
                title: 'Notifications',
                value: settings.notificationsEnabled,
                onChanged: (value) =>
                    settings.setNotificationsEnabled(value),
              ),
              const SizedBox(height: 10),
              _buildSwitchRow(
                icon: Icons.dark_mode_outlined,
                title: 'Dark Mode',
                value: settings.darkMode,
                onChanged: (value) => settings.setDarkMode(value),
              ),
              const SizedBox(height: 10),
              _buildNavigationRow(
                icon: Icons.language,
                title: 'Language / Langue',
                trailingText:
                    settings.isFrench ? 'Français' : 'English',
                onTap: () => showLanguagePicker(context),
              ),
              const SizedBox(height: 24),

              _buildSectionLabel('SECURITY'),
              const SizedBox(height: 10),
              _buildSwitchRow(
                icon: Icons.fingerprint,
                title: 'Biometric Login',
                value: settings.biometricEnabled,
                onChanged: _toggleBiometric,
              ),
              const SizedBox(height: 10),
              _buildNavigationRow(
                icon: Icons.sync_lock_outlined,
                title: 'Change Password',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ChangePasswordScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),

              _buildSectionLabel('ABOUT'),
              const SizedBox(height: 10),
              _buildNavigationRow(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                isExternalLink: true,
                onTap: () => _openUrl(AppConstants.privacyPolicyUrl),
              ),
              const SizedBox(height: 10),
              _buildNavigationRow(
                icon: Icons.description_outlined,
                title: 'Terms of Service',
                isExternalLink: true,
                onTap: () => _openUrl(AppConstants.termsUrl),
              ),
              const SizedBox(height: 10),
              _buildInfoRow(
                icon: Icons.info_outline,
                title: 'Version',
                trailingText: _version,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        // Remove if this screen becomes a root tab.
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Padding(
            padding: EdgeInsets.only(right: 12),
            child: Icon(Icons.arrow_back, size: 22, color: AppColors.gray900),
          ),
        ),
        const AppLogo(size: 30),
        const SizedBox(width: 10),
        const Text(
          'Varnis',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const Spacer(),
        GestureDetector(
          onTap: () => showLanguagePicker(context),
          child: const Text(
            'EN / FR',
            style: TextStyle(
              color: AppColors.gray900,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ],
    );
  }

  /// Avatar + name + email from AuthProvider, edit pencil on the right.
  Widget _buildProfileRow(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return CustomCard(
      padding: const EdgeInsets.all(14),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const EditProfileScreen()),
        );
      },
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primaryLight,
            backgroundImage: (user?.avatarUrl != null &&
                    user!.avatarUrl!.isNotEmpty)
                ? NetworkImage(user.avatarUrl!)
                : null,
            child: (user?.avatarUrl == null || user!.avatarUrl!.isEmpty)
                ? Text(
                    user?.initials ?? '?',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.fullName ?? 'Guest',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gray900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  user?.email ?? '',
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.gray500),
                ),
              ],
            ),
          ),
          const Icon(Icons.edit_outlined, size: 18, color: AppColors.gray600),
        ],
      ),
    );
  }

  Widget _buildSectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
        color: AppColors.gray500,
      ),
    );
  }

  /// Row with a trailing switch.
  Widget _buildSwitchRow({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return CustomCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 21, color: AppColors.gray700),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.gray900,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.white,
            activeTrackColor: AppColors.primary,
            inactiveThumbColor: AppColors.white,
            inactiveTrackColor: AppColors.gray200,
          ),
        ],
      ),
    );
  }

  /// Row with a chevron (and optional trailing text like the current
  /// language), or an external-link icon for web destinations.
  Widget _buildNavigationRow({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    String? trailingText,
    bool isExternalLink = false,
  }) {
    return CustomCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 21, color: AppColors.gray700),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.gray900,
              ),
            ),
          ),
          if (trailingText != null) ...[
            Text(
              trailingText,
              style: const TextStyle(fontSize: 13, color: AppColors.gray500),
            ),
            const SizedBox(width: 4),
          ],
          Icon(
            isExternalLink ? Icons.open_in_new : Icons.chevron_right,
            size: isExternalLink ? 17 : 20,
            color: AppColors.gray400,
          ),
        ],
      ),
    );
  }

  /// Non-interactive row with plain trailing text (e.g. version number).
  Widget _buildInfoRow({
    required IconData icon,
    required String title,
    required String trailingText,
  }) {
    return CustomCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 21, color: AppColors.gray700),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.gray900,
              ),
            ),
          ),
          Text(
            trailingText,
            style: const TextStyle(fontSize: 13, color: AppColors.gray500),
          ),
        ],
      ),
    );
  }
}