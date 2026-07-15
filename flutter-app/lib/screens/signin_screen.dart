import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/widgets/custom_text_field.dart';
import 'package:varnis/widgets/primary_button.dart';
import 'package:varnis/widgets/secondary_button.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'forgot_password_screen.dart';
import 'signup_screen.dart';
import 'main_screen.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String _cleanError(Object e) => e.toString().replaceFirst('Exception: ', '');

  Future<void> _signIn() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    try {
      await authProvider.login(
        _identifierController.text,
        _passwordController.text,
      );
      if (mounted) {
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
                        'Welcome Back / Bon retour',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: AppColors.titleBlue,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Sign in to access safety reports and community alerts.',
                        style: TextStyle(
                          fontSize: 15,
                          color: AppColors.gray500,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 32),

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
                          return null;
                        },
                      ),
                      const SizedBox(height: 10),

                      Align(
                        alignment: Alignment.centerRight,
                        child: GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    const ForgotPasswordScreen(),
                              ),
                            );
                          },
                          child: const Text(
                            'Forgot Password? / Mot de passe oublié ?',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      PrimaryButton(
                        text: 'Sign In',
                        icon: Icons.arrow_forward_rounded,
                        isLoading: authProvider.isLoading,
                        onPressed: _signIn,
                      ),
                      const SizedBox(height: 28),

                      Row(
                        children: const [
                          Expanded(child: Divider(color: AppColors.gray200)),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'or / ou',
                              style: TextStyle(
                                color: AppColors.gray500,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: AppColors.gray200)),
                        ],
                      ),
                      const SizedBox(height: 28),

                      SecondaryButton(
                        text: 'Continue with Google',
                        // TODO: replace with the Google logo asset and hook
                        // up google_sign_in when the backend supports it.
                        icon: const Icon(
                          Icons.g_mobiledata_rounded,
                          size: 28,
                          color: AppColors.primary,
                        ),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content:
                                  Text('Google sign-in is coming soon.'),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 28),

                      Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              "Don't have an account?  ",
                              style: TextStyle(
                                color: AppColors.gray700,
                                fontSize: 14,
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const SignUpScreen(),
                                  ),
                                );
                              },
                              child: const Text(
                                'Sign Up',
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

  /// Header without the EN/FR toggle.
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
}