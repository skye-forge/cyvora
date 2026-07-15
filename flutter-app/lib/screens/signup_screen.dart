import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/providers/settings_provider.dart';
import 'package:varnis/widgets/custom_text_field.dart';
import 'package:varnis/widgets/primary_button.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'main_screen.dart';
import 'otp_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:varnis/constants/app_constants.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _agreedToTerms = false;

  /// Preferred language, chosen at signup. 'en' | 'fr'
  String _language = 'en';

  @override
  void dispose() {
    _nameController.dispose();
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String _cleanError(Object e) => e.toString().replaceFirst('Exception: ', '');

  Future<void> _signUp() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please agree to the Terms of Service to continue'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final settings = Provider.of<SettingsProvider>(context, listen: false);

    try {
      // Apply the chosen language app-wide immediately.
      await settings.setLocale(_language);

      await authProvider.register(
        _nameController.text,
        _identifierController.text,
        _passwordController.text,
        language: _language,
      );

      if (!mounted) return;

      if (authProvider.requiresOtp) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => OtpVerificationScreen(
              identifier: authProvider.pendingIdentifier!,
            ),
          ),
        );
      } else {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const MainScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_cleanError(e)),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Create Account / Créer un compte',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: AppColors.titleBlue,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Sign up to access safety reports and community alerts.',
                        style: TextStyle(
                          fontSize: 15,
                          color: AppColors.gray500,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Preferred language — chosen at signup, changeable
                      // later in Settings.
                      _buildLanguageSelector(),
                      const SizedBox(height: 24),

                      CustomTextField(
                        controller: _nameController,
                        labelText: 'Full Name / Nom Complet',
                        hintText: 'Enter your full name',
                        suffixIcon: const Icon(
                          Icons.person_outline,
                          size: 20,
                          color: AppColors.gray400,
                        ),
                        keyboardType: TextInputType.name,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),

                      CustomTextField(
                        controller: _identifierController,
                        labelText: 'Email or Phone / Email ou Téléphone',
                        hintText: 'e.g. +237 6XX XXX XXX',
                        suffixIcon: const Icon(
                          Icons.alternate_email,
                          size: 20,
                          color: AppColors.gray400,
                        ),
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your email or phone number';
                          }
                          final v = value.trim();
                          final isEmail =
                              RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v);
                          final isPhone =
                              RegExp(r'^\+?[\d\s]{9,15}$').hasMatch(v);
                          if (!isEmail && !isPhone) {
                            return 'Enter a valid email or phone number';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),

                      CustomTextField(
                        controller: _passwordController,
                        labelText: 'Password / Mot de passe',
                        hintText: '• • • • • • • •',
                        obscureText: _obscurePassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            size: 20,
                            color: AppColors.gray400,
                          ),
                          onPressed: () {
                            setState(
                                () => _obscurePassword = !_obscurePassword);
                          },
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your password';
                          }
                          if (value.length < 8) {
                            return 'Password must be at least 8 characters';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),

                      _buildTermsCheckbox(),
                      const SizedBox(height: 28),

                      PrimaryButton(
                        text: 'Create Account',
                        icon: Icons.arrow_forward_rounded,
                        isLoading: authProvider.isLoading,
                        onPressed: _signUp,
                      ),
                      const SizedBox(height: 24),

                      Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'Already have an account?  ',
                              style: TextStyle(
                                color: AppColors.gray700,
                                fontSize: 14,
                              ),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: const Text(
                                'Sign In',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),

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
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.gray400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Header without the EN/FR toggle (language is chosen in the form).
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Row(
        children: [
          const AppLogo(size: 28),
          const SizedBox(width: 10),
          const Text(
            'Varnis',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  /// Segmented English / Français choice.
  Widget _buildLanguageSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text(
            'Preferred Language / Langue préférée',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.gray700,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.gray100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              _buildLanguageSegment('en', 'English'),
              _buildLanguageSegment('fr', 'Français'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLanguageSegment(String code, String label) {
    final isSelected = _language == code;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _language = code),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 4,
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? AppColors.primary : AppColors.gray500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTermsCheckbox() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: _agreedToTerms,
            activeColor: AppColors.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6),
            ),
            side: const BorderSide(color: AppColors.gray400, width: 1.5),
            onChanged: (value) {
              setState(() => _agreedToTerms = value ?? false);
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text.rich(
            TextSpan(
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.gray700,
                height: 1.5,
              ),
              children: [
                const TextSpan(text: 'I agree to the '),
                TextSpan(
                  text: 'Terms of Service',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                  recognizer: TapGestureRecognizer()
                    ..onTap = () => launchUrl(
                          Uri.parse(AppConstants.termsUrl),
                          mode: LaunchMode.externalApplication,
                        ),
                ),
                const TextSpan(text: ' and '),
                TextSpan(
                  text: 'Privacy Policy',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                  recognizer: TapGestureRecognizer()
                    ..onTap = () => launchUrl(
                          Uri.parse(AppConstants.privacyPolicyUrl),
                          mode: LaunchMode.externalApplication,
                        ),
                ),
                const TextSpan(text: ' of Varnis.'),
              ],
            ),
          ),
        ),
      ],
    );
  }
}