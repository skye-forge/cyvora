import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/widgets/custom_text_field.dart';
import 'package:varnis/widgets/primary_button.dart';

/// Change the account password. Wired to [AuthProvider.changePassword];
/// validates the new password locally before calling the API.
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isSaving = false;

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  String? _validateNewPassword(String? value) {
    final text = value ?? '';
    if (text.isEmpty) return 'Please enter a new password';
    if (text.length < 8) return 'Must be at least 8 characters';
    if (!RegExp(r'[A-Za-z]').hasMatch(text) ||
        !RegExp(r'[0-9]').hasMatch(text)) {
      return 'Use letters and at least one number';
    }
    if (text == _currentController.text) {
      return 'New password must be different from the current one';
    }
    return null;
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      await context.read<AuthProvider>().changePassword(
            _currentController.text,
            _newController.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password updated successfully.'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Widget _visibilityToggle(bool obscured, VoidCallback onTap) {
    return IconButton(
      icon: Icon(
        obscured
            ? Icons.visibility_off_outlined
            : Icons.visibility_outlined,
        size: 20,
        color: AppColors.gray400,
      ),
      onPressed: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Change Password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.lock_outline_rounded,
                          color: AppColors.primary, size: 22),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Choose a strong password you don\'t use anywhere '
                          'else — at least 8 characters with a number.',
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w500,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                CustomTextField(
                  controller: _currentController,
                  labelText: 'Current Password',
                  hintText: 'Enter your current password',
                  obscureText: _obscureCurrent,
                  suffixIcon: _visibilityToggle(
                    _obscureCurrent,
                    () => setState(
                        () => _obscureCurrent = !_obscureCurrent),
                  ),
                  validator: (value) => (value == null || value.isEmpty)
                      ? 'Please enter your current password'
                      : null,
                ),
                const SizedBox(height: 18),
                CustomTextField(
                  controller: _newController,
                  labelText: 'New Password',
                  hintText: 'At least 8 characters',
                  obscureText: _obscureNew,
                  suffixIcon: _visibilityToggle(
                    _obscureNew,
                    () => setState(() => _obscureNew = !_obscureNew),
                  ),
                  validator: _validateNewPassword,
                ),
                const SizedBox(height: 18),
                CustomTextField(
                  controller: _confirmController,
                  labelText: 'Confirm New Password',
                  hintText: 'Re-enter the new password',
                  obscureText: _obscureConfirm,
                  suffixIcon: _visibilityToggle(
                    _obscureConfirm,
                    () => setState(
                        () => _obscureConfirm = !_obscureConfirm),
                  ),
                  validator: (value) => value != _newController.text
                      ? 'Passwords do not match'
                      : null,
                ),
                const SizedBox(height: 28),
                PrimaryButton(
                  text: 'Update Password',
                  isLoading: _isSaving,
                  onPressed: _save,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
