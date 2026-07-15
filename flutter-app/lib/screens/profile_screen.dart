import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'edit_profile_screen.dart';
import 'settings_screen.dart';
import 'my_reports_screen.dart';
import 'help_support_screen.dart';
import 'about_varnis_screen.dart';
import 'package:varnis/providers/settings_provider.dart';
import 'package:varnis/utils/language_picker.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    PackageInfo.fromPlatform().then((info) {
      if (mounted) {
        setState(() =>
            _version = 'Varnis v${info.version} (Build ${info.buildNumber})');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 16),
            _buildProfileCard(),
            const SizedBox(height: 24),

            _buildSectionLabel('Account Settings'),
            const SizedBox(height: 10),
            _buildMenuItem(
              icon: Icons.manage_accounts_outlined,
              title: 'Edit Profile',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const EditProfileScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),
            _buildMenuItem(
              icon: Icons.description_outlined,
              title: 'My Reports',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const MyReportsScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),
            _buildMenuItem(
              icon: Icons.shield_outlined,
              title: 'Privacy & Security',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (context) => const SettingsScreen()),
                );
              },
            ),
            const SizedBox(height: 10),
            _buildLanguageItem(),
            const SizedBox(height: 24),

            _buildSectionLabel('Support & Legal'),
            const SizedBox(height: 10),
            _buildMenuItem(
              icon: Icons.help_outline,
              title: 'Help & Support',
              iconColor: AppColors.gray600,
              iconBg: AppColors.gray100,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const HelpSupportScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),
            _buildMenuItem(
              icon: Icons.info_outline,
              title: 'About Varnis',
              iconColor: AppColors.gray600,
              iconBg: AppColors.gray100,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AboutVarnisScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: 28),

            // Sign Out — centered red link
            Center(
              child: GestureDetector(
                onTap: () => _confirmSignOut(context, authProvider),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.logout_rounded, size: 18, color: AppColors.error),
                    SizedBox(width: 8),
                    Text(
                      'Sign Out',
                      style: TextStyle(
                        color: AppColors.error,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Version footer
            Center(
              child: Text(
                _version,
                style: TextStyle(fontSize: 12, color: AppColors.gray400),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        const AppLogo(size: 32),
        const SizedBox(width: 10),
        const Text(
          'Varnis',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        const Spacer(),
        GestureDetector(
          onTap: () => showLanguagePicker(context),
          child: const Text(
            'FR',
            style: TextStyle(
              color: AppColors.gray900,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  /// Avatar with verified badge, name, Verified Citizen pill, and stats.
  Widget _buildProfileCard() {
    return CustomCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Avatar with green verified check badge
          Stack(
            clipBehavior: Clip.none,
            children: [
              Builder(builder: (context) {
                final user = context.watch<AuthProvider>().user;
                final hasAvatar = user?.avatarUrl != null &&
                    user!.avatarUrl!.isNotEmpty;
                return CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.primaryLight,
                  backgroundImage:
                      hasAvatar ? NetworkImage(user.avatarUrl!) : null,
                  child: hasAvatar
                      ? null
                      : Text(
                          user?.initials ?? '?',
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                );
              }),
              Positioned(
                right: -2,
                bottom: -2,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.white, width: 2.5),
                  ),
                  child: const Icon(
                    Icons.check,
                    size: 13,
                    color: AppColors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          Text(
            context.watch<AuthProvider>().user?.fullName ?? 'Guest',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.gray900,
            ),
          ),
          const SizedBox(height: 8),

          // Verified Citizen pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.successLight,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Verified Citizen',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.success,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Stats: Reports / Lessons
          Builder(builder: (context) {
            final user = context.watch<AuthProvider>().user;
            return Row(
              children: [
                Expanded(
                    child: _buildStatBox(
                        '${user?.reportsCount ?? 0}', 'Reports')),
                const SizedBox(width: 14),
                Expanded(
                    child: _buildStatBox(
                        '${user?.lessonsCount ?? 0}', 'Lessons')),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildStatBox(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.gray500),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.gray500,
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color iconColor = AppColors.primary,
    Color iconBg = AppColors.primaryLight,
  }) {
    return CustomCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 19, color: iconColor),
          ),
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
          const Icon(
            Icons.chevron_right,
            size: 20,
            color: AppColors.gray400,
          ),
        ],
      ),
    );
  }

  /// Language row with an inline EN/FR segmented toggle instead of a chevron.
  Widget _buildLanguageItem() {
    return CustomCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.language,
              size: 19,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Language',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.gray900,
              ),
            ),
          ),

          // EN / FR segmented toggle
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildLanguageSegment('EN'),
                _buildLanguageSegment('FR'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageSegment(String lang) {
    final settings = context.watch<SettingsProvider>();
    final isSelected =
        (lang == 'FR') == settings.isFrench;
    return GestureDetector(
      onTap: () {
        context
            .read<SettingsProvider>()
            .setLocale(lang == 'FR' ? 'fr' : 'en');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 4,
                  ),
                ]
              : null,
        ),
        child: Text(
          lang,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isSelected ? AppColors.gray900 : AppColors.gray400,
          ),
        ),
      ),
    );
  }

  Future<void> _confirmSignOut(
    BuildContext context,
    AuthProvider authProvider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppColors.gray500),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Sign Out',
              style: TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await authProvider.logout();
    }
  }
}