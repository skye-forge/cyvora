import 'package:flutter/material.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'package:varnis/utils/language_picker.dart';

class SafetyTipsScreen extends StatelessWidget {
  const SafetyTipsScreen({super.key});

  static const List<Map<String, dynamic>> _tips = [
    {
      'icon': Icons.lock_outline,
      'title': 'Use Strong Passwords',
      'content':
          'Always use unique, strong passwords for each of your accounts. '
          'Consider using a password manager.',
    },
    {
      'icon': Icons.verified_user_outlined,
      'title': 'Enable Two-Factor Authentication',
      'content':
          'Add an extra layer of security by enabling 2FA wherever possible.',
    },
    {
      'icon': Icons.mark_email_unread_outlined,
      'title': 'Be Wary of Phishing',
      'content':
          'Never click on links or download attachments from unknown '
          'senders.',
    },
    {
      'icon': Icons.smartphone_outlined,
      'title': 'Protect Your Mobile Money',
      'content':
          'Never share your PIN or OTP with anyone — banks and operators '
          'will never ask for them by call or SMS.',
    },
    {
      'icon': Icons.system_update_alt_outlined,
      'title': 'Keep Software Updated',
      'content':
          'Always keep your operating system, apps, and antivirus software '
          'up to date.',
    },
    {
      'icon': Icons.wifi_outlined,
      'title': 'Secure Your Wi-Fi',
      'content':
          'Use strong encryption (WPA3/WPA2) and a strong password for your '
          'home network.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 18),
                  const Text(
                    'Safety Tips',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Quick habits that keep you and your family safe online.',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.gray500,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                itemCount: _tips.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 12),
                itemBuilder: (context, index) => _TipCard(tip: _tips[index]),
              ),
            ),
          ],
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
}

class _TipCard extends StatelessWidget {
  final Map<String, dynamic> tip;

  const _TipCard({required this.tip});

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              tip['icon'] as IconData,
              color: AppColors.primary,
              size: 21,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tip['title'] as String,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: AppColors.gray900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  tip['content'] as String,
                  style: const TextStyle(
                    color: AppColors.gray600,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}