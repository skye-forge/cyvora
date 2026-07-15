import 'package:flutter/material.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/utils/local_storage.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'signin_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // ---- Design palette (move into AppColors when ready) ----
  static const Color _bgLight = Color(0xFFF4F5FB); // off-white background
  static const Color _navy = Color(0xFF14276B); // brand navy
  static const Color _titleDark = Color(0xFF1A1D2E); // near-black titles
  static const Color _textGray = Color(0xFF6B7280); // description gray
  static const Color _dotInactive = Color(0xFFD1D5DB);
  static const Color _chipBorder = Color(0xFFE5E7EB);

  final List<_OnboardingPageData> _pages = [
    _OnboardingPageData(
      title: 'Learn Digital Safety',
      titleColor: _titleDark,
      description:
          'Master the skills to protect yourself and your family online.',
      imagePath: 'assets/images/onboarding_learn.jpg',
    ),
    _OnboardingPageData(
      title: 'Report Incidents / Signaler',
      titleColor: _titleDark,
      description:
          'Spotted a scam or received a phishing attempt? Take immediate '
          'action. Your reports help keep the community safe across Cameroon.',
      imagePath: 'assets/images/onboarding_report.jpg',
    ),
    _OnboardingPageData(
      title: 'Join Your Community',
      titleColor: _navy, // brighter blue title on the last page
      description:
          'Connect with neighbors in Yaoundé and Douala. Share real-time '
          'safety tips, report local incidents, and work together to build a '
          'more secure environment for everyone.',
      imagePath: 'assets/images/onboarding_community.jpg',
      features: [
        _FeatureChipData(icon: Icons.forum_outlined, label: 'Local Discussions'),
        _FeatureChipData(icon: Icons.verified_outlined, label: 'Verified Tips'),
      ],
    ),
  ];

  bool get _isLastPage => _currentPage == _pages.length - 1;

  Future<void> _completeOnboarding() async {
    await LocalStorage.saveBool(AppConstants.isFirstLaunchKey, false);
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const SignInScreen()),
      );
    }
  }

  void _nextPage() {
    if (_isLastPage) {
      _completeOnboarding();
    } else {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    _pageController.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgLight,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) =>
                    _OnboardingPage(data: _pages[index]),
              ),
            ),
            _buildBottomSection(),
          ],
        ),
      ),
    );
  }

  /// Top bar: shield logo + "Varnis" wordmark on the left, Skip on the right.
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 16, 8),
      child: Row(
        children: [
          const AppLogo(size: 28),
          const SizedBox(width: 10),
          const Text(
            'Varnis',
            style: TextStyle(
              color: _navy,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: _completeOnboarding,
            child: const Text(
              'Skip',
              style: TextStyle(
                color: _textGray,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Dots indicator + Next/Get Started button (+ Back on pages after the first).
  Widget _buildBottomSection() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _pages.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                height: 8,
                width: _currentPage == index ? 28 : 8,
                decoration: BoxDecoration(
                  color: _currentPage == index ? _navy : _dotInactive,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Primary button: label + arrow
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: _nextPage,
              style: ElevatedButton.styleFrom(
                backgroundColor: _navy,
                foregroundColor: AppColors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _isLastPage ? 'Get Started' : 'Next',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward_rounded, size: 20),
                ],
              ),
            ),
          ),

          // Back button on pages after the first
          if (_currentPage > 0) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: OutlinedButton(
                onPressed: _previousPage,
                style: OutlinedButton.styleFrom(
                  backgroundColor: AppColors.white,
                  foregroundColor: _textGray,
                  side: const BorderSide(color: _chipBorder),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'Back',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// One onboarding page: image card, title, description, optional feature chips.
class _OnboardingPage extends StatelessWidget {
  final _OnboardingPageData data;
  const _OnboardingPage({required this.data});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        children: [
          // Image card with soft shadow
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.asset(
                data.imagePath,
                height: 280,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 280,
                  color: _OnboardingScreenState._dotInactive,
                  child: const Icon(Icons.image_outlined, size: 48),
                ),
              ),
            ),
          ),
          const SizedBox(height: 36),

          Text(
            data.title,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: data.titleColor,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 14),

          Text(
            data.description,
            style: const TextStyle(
              fontSize: 15,
              color: _OnboardingScreenState._textGray,
              height: 1.55,
            ),
            textAlign: TextAlign.center,
          ),

          // Feature chips (last page only)
          if (data.features != null) ...[
            const SizedBox(height: 24),
            Row(
              children: [
                for (var i = 0; i < data.features!.length; i++) ...[
                  if (i > 0) const SizedBox(width: 12),
                  Expanded(child: _FeatureChip(data: data.features![i])),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// Light pill card with an icon and label ("Local Discussions", "Verified Tips").
class _FeatureChip extends StatelessWidget {
  final _FeatureChipData data;
  const _FeatureChip({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _OnboardingScreenState._chipBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(data.icon, size: 18, color: _OnboardingScreenState._navy),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              data.label,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _OnboardingScreenState._titleDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingPageData {
  final String title;
  final Color titleColor;
  final String description;
  final String imagePath;
  final List<_FeatureChipData>? features;

  const _OnboardingPageData({
    required this.title,
    required this.titleColor,
    required this.description,
    required this.imagePath,
    this.features,
  });
}

class _FeatureChipData {
  final IconData icon;
  final String label;

  const _FeatureChipData({required this.icon, required this.label});
}