import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/utils/local_storage.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'onboarding_screen.dart';
import 'main_screen.dart';
import 'signin_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  // ---- Design palette (move these into AppColors when ready) ----
  static const Color _bgNavy = Color(0xFF14276B); // deep navy background
  static const Color _badgeGreen = Color(0xFF3DDC64); // padlock badge
  static const Color _chipBg = Color(0xFF0F1F55); // city pill fill
  static const Color _chipBorder = Color(0x33FFFFFF); // subtle pill border

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _animationController.forward();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    while (authProvider.isLoading) {
      await Future.delayed(const Duration(milliseconds: 100));
    }

    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      _navigateToNextScreen(authProvider);
    }
  }

  void _navigateToNextScreen(AuthProvider authProvider) {
    if (authProvider.isAuthenticated) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainScreen()),
      );
    } else {
      final isFirstLaunch =
          LocalStorage.getBool(AppConstants.isFirstLaunchKey) ?? true;
      if (isFirstLaunch) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const OnboardingScreen()),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const SignInScreen()),
        );
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgNavy,
      body: Stack(
        children: [
          // Subtle constellation / network pattern faded into the top area
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: MediaQuery.of(context).size.height * 0.35,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: CustomPaint(painter: _NetworkPatternPainter()),
            ),
          ),

          // Main content
          SafeArea(
            child: Column(
              children: [
                // Centered logo + wordmark
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ScaleTransition(
                          scale: _scaleAnimation,
                          child: FadeTransition(
                            opacity: _fadeAnimation,
                            child: _buildLogo(),
                          ),
                        ),
                        const SizedBox(height: 28),
                        FadeTransition(
                          opacity: _fadeAnimation,
                          child: const Text(
                            'Varnis',
                            style: TextStyle(
                              color: AppColors.white,
                              fontSize: 40,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Bottom tagline + city chips
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Securing Our Digital Future',
                          style: TextStyle(
                            color: AppColors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            _CityChip(label: 'YAOUNDÉ'),
                            SizedBox(width: 12),
                            _CityChip(label: 'DOUALA'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// White rounded card containing the navy shield + heart,
  /// with a green padlock badge overlapping the bottom-right corner.
  Widget _buildLogo() {
    return SizedBox(
      width: 150,
      height: 150,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // White squircle card
          Container(
            width: 132,
            height: 132,
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.20),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Center(
              // Varnis brand mark
              child: AppLogo(size: 84),
            ),
          ),

          // Green padlock badge, bottom-right overlap
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: _badgeGreen,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _bgNavy, width: 3),
              ),
              child: const Icon(
                Icons.lock_rounded,
                size: 24,
                color: Color(0xFF0B1B45),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Small dark pill with a green status dot and uppercase city label.
class _CityChip extends StatelessWidget {
  final String label;
  const _CityChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: _SplashScreenState._chipBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _SplashScreenState._chipBorder, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
              color: _SplashScreenState._badgeGreen,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 7),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

/// Faint constellation-style network lines and dots for the top background.
class _NetworkPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final random = math.Random(42); // fixed seed = stable pattern
    final dotPaint = Paint()..color = Colors.white.withOpacity(0.10);
    final linePaint = Paint()
      ..color = Colors.white.withOpacity(0.06)
      ..strokeWidth = 1;

    final points = List.generate(28, (_) {
      return Offset(
        random.nextDouble() * size.width,
        random.nextDouble() * size.height,
      );
    });

    // Connect nearby points
    for (var i = 0; i < points.length; i++) {
      for (var j = i + 1; j < points.length; j++) {
        final distance = (points[i] - points[j]).distance;
        if (distance < size.width * 0.28) {
          canvas.drawLine(points[i], points[j], linePaint);
        }
      }
    }

    for (final point in points) {
      canvas.drawCircle(point, 2, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}