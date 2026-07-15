import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/widgets/custom_text_field.dart';
import 'package:varnis/widgets/primary_button.dart';
import 'otp_screen.dart';

/// Forgot-password flow:
/// 1. Enter email/phone → request reset code
/// 2. OTP screen verifies the code (reused OtpVerificationScreen)
/// 3. Set a new password
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;

  /// 0 = enter identifier, 1 = set new password (after OTP verified)
  int _step = 0;
  String? _verifiedCode;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  String _cleanError(Object e) => e.toString().replaceFirst('Exception: ', '');

  Future<void> _requestReset() async {
    if (!_formKey.currentState!.validate()) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    setState(() => _isLoading = true);
    try {
      await authProvider.requestPasswordReset(_identifierController.text);
      if (!mounted) return;

      // Verify the code, then come back here for the new password.
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => OtpVerificationScreen(
            identifier: _identifierController.text.trim(),
            onVerified: (code) {
              Navigator.pop(context); // close the OTP screen
              setState(() {
                _verifiedCode = code;
                _step = 1;
              });
            },
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_cleanError(e)),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitNewPassword() async {
    if (!_formKey.currentState!.validate()) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    setState(() => _isLoading = true);
    try {
      await authProvider.resetPassword(
        _identifierController.text,
        _verifiedCode!,
        _passwordController.text,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset. Please sign in.'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context); // back to sign in
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_cleanError(e)),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                  alignment: Alignment.centerLeft,
                  icon: const Icon(
                    Icons.arrow_back,
                    color: AppColors.gray900,
                    size: 24,
                  ),
                ),
                const SizedBox(height: 12),

                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(
                      Icons.lock_reset_rounded,
                      size: 30,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                Text(
                  _step == 0
                      ? 'Forgot Password / Mot de passe oublié'
                      : 'Set New Password / Nouveau mot de passe',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.titleBlue,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _step == 0
                      ? "Enter the email or phone number linked to your "
                          "account and we'll send you a reset code."
                      : 'Choose a strong new password for your account.',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.gray500,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),

                if (_step == 0) ...[
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
                  const SizedBox(height: 28),
                  PrimaryButton(
                    text: 'Send Reset Code',
                    icon: Icons.arrow_forward_rounded,
                    isLoading: _isLoading,
                    onPressed: _requestReset,
                  ),
                ] else ...[
                  CustomTextField(
                    controller: _passwordController,
                    labelText: 'New Password / Nouveau mot de passe',
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
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter a new password';
                      }
                      if (value.length < 8) {
                        return 'Password must be at least 8 characters';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  CustomTextField(
                    controller: _confirmController,
                    labelText: 'Confirm Password / Confirmer',
                    hintText: '• • • • • • • •',
                    obscureText: true,
                    suffixIcon: const Icon(
                      Icons.lock_outline,
                      size: 20,
                      color: AppColors.gray400,
                    ),
                    validator: (value) {
                      if (value != _passwordController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 28),
                  PrimaryButton(
                    text: 'Reset Password',
                    icon: Icons.check_rounded,
                    isLoading: _isLoading,
                    onPressed: _submitNewPassword,
                  ),
                ],
                const SizedBox(height: 32),

                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.lock_outline,
                          size: 14, color: AppColors.gray400),
                      SizedBox(width: 6),
                      Text(
                        'End-to-end encrypted session',
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
      ),
    );
  }
}