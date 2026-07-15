import 'package:flutter/material.dart';
import 'package:in_app_review/in_app_review.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'package:varnis/utils/language_picker.dart';

class AboutVarnisScreen extends StatefulWidget {
  const AboutVarnisScreen({super.key});

  @override
  State<AboutVarnisScreen> createState() => _AboutVarnisScreenState();
}

class _AboutVarnisScreenState extends State<AboutVarnisScreen> {
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

  Future<void> _openUrl(BuildContext context, String url) async {
    final ok = await launchUrl(Uri.parse(url),
        mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not open the link.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _rateApp() async {
    final review = InAppReview.instance;
    if (await review.isAvailable()) {
      await review.requestReview();
    } else {
      await review.openStoreListing();
    }
  }

  static const List<Map<String, dynamic>> _features = [
    {
      'icon': Icons.school_outlined,
      'title': 'Digital Safety Education',
      'description':
          'Interactive lessons that teach you to recognize scams, phishing, '
          'and other digital threats.',
    },
    {
      'icon': Icons.report_gmailerrorred_outlined,
      'title': 'Incident Reporting',
      'description':
          'Report suspicious activity directly to the National Security '
          'Cyber Taskforce in a few taps.',
    },
    {
      'icon': Icons.people_outline,
      'title': 'Community Support',
      'description':
          'Connect with neighbors in Yaoundé and Douala to share alerts and '
          'build safer communities.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              const SizedBox(height: 24),

              // Logo, name, version
              Center(
                child: Column(
                  children: [
                    const AppLogo(size: 88),
                    const SizedBox(height: 14),
                    const Text(
                      'Varnis',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _version,
                      style: TextStyle(
                        color: AppColors.gray400,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              const Text(
                'Our Mission',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Varnis is dedicated to empowering citizens and communities '
                'across Cameroon to stay safe — online and offline — through '
                'education, incident reporting, and community support.',
                style: TextStyle(
                  color: AppColors.gray600,
                  fontSize: 14,
                  height: 1.55,
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'What We Do',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              for (final feature in _features) ...[
                _buildFeatureCard(feature),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 18),

              _buildLinkItem(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                isExternalLink: true,
                onTap: () => _openUrl(context, AppConstants.privacyPolicyUrl),
              ),
              const SizedBox(height: 10),
              _buildLinkItem(
                icon: Icons.gavel_outlined,
                title: 'Terms of Service',
                isExternalLink: true,
                onTap: () => _openUrl(context, AppConstants.termsUrl),
              ),
              const SizedBox(height: 10),
              _buildLinkItem(
                icon: Icons.star_border_rounded,
                title: 'Rate the App',
                onTap: _rateApp,
              ),
              const SizedBox(height: 28),

              // Footer mark, consistent with the auth screens
              Center(
                child: Column(
                  children: const [
                    Icon(
                      Icons.shield_outlined,
                      size: 18,
                      color: AppColors.gray400,
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Secure Institutional Portal',
                      style:
                          TextStyle(fontSize: 12, color: AppColors.gray400),
                    ),
                  ],
                ),
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
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Padding(
            padding: EdgeInsets.only(right: 14),
            child: Icon(Icons.arrow_back, size: 22, color: AppColors.gray900),
          ),
        ),
        const Text(
          'About Varnis',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 19,
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

  Widget _buildFeatureCard(Map<String, dynamic> feature) {
    return CustomCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              feature['icon'] as IconData,
              size: 21,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  feature['title'] as String,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gray900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  feature['description'] as String,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.gray600,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLinkItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
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
          Icon(
            isExternalLink ? Icons.open_in_new : Icons.chevron_right,
            size: isExternalLink ? 17 : 20,
            color: AppColors.gray400,
          ),
        ],
      ),
    );
  }
}