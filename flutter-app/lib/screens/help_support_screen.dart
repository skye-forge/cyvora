import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'package:varnis/utils/language_picker.dart';
import 'emergency_chat_screen.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  final _searchController = TextEditingController();

  static final List<Map<String, String>> _faqs = [
    {
      'question': 'How do I report an incident?',
      'answer':
          'Tap the Report Incident card on the Home screen, select the '
          'category, describe what happened, and submit. You can attach '
          'screenshots and include your location to help our response team.',
    },
    {
      'question': 'Is my data kept confidential?',
      'answer':
          'Yes. Your reports are encrypted and sent directly to the National '
          'Security Cyber Taskforce. Your personal information is never '
          'shared publicly.',
    },
    {
      'question': 'How are safety scores calculated?',
      'answer':
          'Safety scores combine verified incident reports, resolution '
          'rates, and official civic data for each region, updated weekly.',
    },
    {
      'question': 'What do status chips mean?',
      'answer':
          'Pending means your report is awaiting review, Approved means it '
          'has been verified by the civic authority, and Rejected means it '
          'could not be verified. Tap any report to see its full timeline.',
    },
  ];

  static final List<Map<String, dynamic>> _categories = [
    {'icon': Icons.warning_amber_rounded, 'label': 'Reporting'},
    {'icon': Icons.account_circle_outlined, 'label': 'Account'},
    {'icon': Icons.location_on_outlined, 'label': 'Regions'},
    {'icon': Icons.gavel_outlined, 'label': 'Legal'},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, String>> get _visibleFaqs {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) return _faqs;
    return _faqs.where((faq) {
      return faq['question']!.toLowerCase().contains(query) ||
          faq['answer']!.toLowerCase().contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final faqs = _visibleFaqs;

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
                'How can we help?',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Search our documentation or contact our 24/7 civic safety '
                'support team.',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.gray500,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 16),

              _buildSearchBar(),
              const SizedBox(height: 18),

              _buildCategoryGrid(),
              const SizedBox(height: 24),

              const Text(
                'Frequently Asked Questions',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),

              if (faqs.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'No help topics match your search.',
                      style: TextStyle(color: AppColors.gray500),
                    ),
                  ),
                )
              else
                for (final faq in faqs) ...[
                  _buildFaqCard(faq),
                  const SizedBox(height: 10),
                ],
              const SizedBox(height: 14),

              _buildContactCard(),
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

  Widget _buildSearchBar() {
    return TextField(
      controller: _searchController,
      onChanged: (_) => setState(() {}),
      style: const TextStyle(fontSize: 14, color: AppColors.gray900),
      decoration: InputDecoration(
        hintText: 'Search for help topics...',
        hintStyle: const TextStyle(color: AppColors.gray400, fontSize: 14),
        prefixIcon:
            const Icon(Icons.search, size: 20, color: AppColors.gray400),
        filled: true,
        fillColor: AppColors.gray100,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
    );
  }

  /// 2x2 grid of help categories.
  Widget _buildCategoryGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 2.1,
      ),
      itemCount: _categories.length,
      itemBuilder: (context, index) {
        final category = _categories[index];
        return CustomCard(
          padding: const EdgeInsets.all(14),
          onTap: () {
            // Pre-filter the FAQ search with this category.
            setState(() {
              _searchController.text = category['label'] as String;
            });
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                category['icon'] as IconData,
                size: 22,
                color: AppColors.primary,
              ),
              const SizedBox(height: 8),
              Text(
                category['label'] as String,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.gray900,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Expandable FAQ card.
  Widget _buildFaqCard(Map<String, String> faq) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          shape: const RoundedRectangleBorder(),
          iconColor: AppColors.gray500,
          collapsedIconColor: AppColors.gray500,
          title: Text(
            faq['question']!,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.gray900,
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  faq['answer']!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.gray600,
                    height: 1.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// "Still need help?" contact options.
  Widget _buildContactCard() {
    return CustomCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Text(
            'Still need help?',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.gray900,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.email_outlined, size: 18),
                  label: const Text('Email Us'),
                  onPressed: () async {
                    final uri = Uri(
                      scheme: 'mailto',
                      path: AppConstants.supportEmail,
                      query: 'subject=Varnis Support Request',
                    );
                    final ok = await launchUrl(uri);
                    if (!ok && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                              'No mail app found. Write to '
                              '${AppConstants.supportEmail}'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    }
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.chat_bubble_outline, size: 18),
                  label: const Text('Live Chat'),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const EmergencyChatScreen(),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}