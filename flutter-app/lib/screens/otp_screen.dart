import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'main_screen.dart';

/// OTP verification for signup (and reused by the password-reset flow
/// via [onVerified]). Wired to AuthProvider.verifyOtp / resendOtp.
class OtpVerificationScreen extends StatefulWidget {
  /// The email or phone number the code was sent to.
  final String identifier;

  /// If provided, called with the verified code instead of navigating
  /// to MainScreen (used by the forgot-password flow).
  final void Function(String code)? onVerified;

  const OtpVerificationScreen({
    super.key,
    required this.identifier,
    this.onVerified,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  static const int _otpLength = 6;
  static const int _resendCooldownSeconds = 30;

  final List<TextEditingController> _controllers =
      List.generate(_otpLength, (_) => TextEditingController());
  final List<FocusNode> _focusNodes =
      List.generate(_otpLength, (_) => FocusNode());

  bool _isVerifying = false;
  int _resendCooldown = 0;
  Timer? _cooldownTimer;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String get _code => _controllers.map((c) => c.text).join();

  String get _maskedNumber {
    final raw = widget.identifier.replaceAll(' ', '');
    if (raw.contains('@')) {
      // Mask email: a•••@domain
      final parts = raw.split('@');
      final name = parts.first;
      return '${name.isNotEmpty ? name[0] : ''}•••@${parts.last}';
    }
    if (raw.length < 8) return widget.identifier;
    final start = raw.substring(0, raw.length - 8);
    final end = raw.substring(raw.length - 3);
    return '$start• • • • • $end';
  }

  String _cleanError(Object e) => e.toString().replaceFirst('Exception: ', '');

  void _startCooldown() {
    setState(() => _resendCooldown = _resendCooldownSeconds);
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_resendCooldown <= 1) {
        timer.cancel();
        setState(() => _resendCooldown = 0);
      } else {
        setState(() => _resendCooldown--);
      }
    });
  }

  void _onDigitChanged(int index, String value) {
    // Paste support: if a full code lands in one box, distribute it.
    if (value.length == _otpLength &&
        RegExp(r'^\d+$').hasMatch(value)) {
      for (var i = 0; i < _otpLength; i++) {
        _controllers[i].text = value[i];
      }
      FocusScope.of(context).unfocus();
      setState(() {});
      return;
    }

    if (value.isNotEmpty && index < _otpLength - 1) {
      _focusNodes[index + 1].requestFocus();
    }
    if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    if (_code.length == _otpLength) {
      FocusScope.of(context).unfocus();
    }
    setState(() {});
  }

  Future<void> _verifyCode() async {
    if (_code.length < _otpLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter the complete 6-digit code'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    setState(() => _isVerifying = true);
    try {
      final verified = await authProvider.verifyOtp(
        _code,
        identifier: widget.identifier,
      );
      if (!mounted) return;

      if (!verified) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid code. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }

      if (widget.onVerified != null) {
        widget.onVerified!(_code);
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
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resendCode() async {
    if (_resendCooldown > 0) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    try {
      await authProvider.resendOtp(identifier: widget.identifier);
      if (!mounted) return;
      _startCooldown();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('A new code was sent to $_maskedNumber'),
          backgroundColor: AppColors.primary,
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
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                  alignment: Alignment.centerLeft,
                  icon: const Icon(
                    Icons.arrow_back,
                    color: AppColors.gray900,
                    size: 24,
                  ),
                ),
              ),
              const SizedBox(height: 8),

              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Center(child: AppLogo(size: 36)),
                ),
              ),
              const SizedBox(height: 24),

              const Center(
                child: Text(
                  'Two-Step Verification',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gray900,
                  ),
                ),
              ),
              const SizedBox(height: 10),

              Center(
                child: Text.rich(
                  TextSpan(
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.gray500,
                      height: 1.5,
                    ),
                    children: [
                      const TextSpan(
                        text: 'Enter the 6-digit verification code\nsent to ',
                      ),
                      TextSpan(
                        text: _maskedNumber,
                        style: const TextStyle(
                          color: AppColors.gray900,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 36),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < _otpLength; i++) ...[
                    if (i == _otpLength ~/ 2)
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 6),
                        child: Text(
                          '-',
                          style: TextStyle(
                            fontSize: 18,
                            color: AppColors.gray400,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    Padding(
                      padding: EdgeInsets.only(
                        right: i == _otpLength - 1 ? 0 : 8,
                      ),
                      child: _buildOtpBox(i),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 40),

              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _isVerifying ? null : _verifyCode,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: _isVerifying
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: AppColors.white,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Text(
                              'Verify Code',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(width: 8),
                            Icon(Icons.verified_user_outlined, size: 20),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 28),

              Center(
                child: Column(
                  children: [
                    const Text(
                      "Didn't receive code?",
                      style: TextStyle(fontSize: 14, color: AppColors.gray500),
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: _resendCode,
                      child: Text(
                        _resendCooldown > 0
                            ? 'Resend in ${_resendCooldown}s'
                            : 'Resend Code',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: _resendCooldown > 0
                              ? AppColors.gray400
                              : AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.lock_outline, size: 14, color: AppColors.gray400),
                    SizedBox(width: 6),
                    Text(
                      'End-to-end encrypted session',
                      style: TextStyle(fontSize: 12, color: AppColors.gray400),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOtpBox(int index) {
    return SizedBox(
      width: 44,
      height: 52,
      child: TextField(
        controller: _controllers[index],
        focusNode: _focusNodes[index],
        onChanged: (value) => _onDigitChanged(index, value),
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        // Allow a pasted full code into the first box.
        maxLength: index == 0 ? _otpLength : 1,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.gray900,
        ),
        decoration: InputDecoration(
          counterText: '',
          filled: true,
          fillColor: const Color(0xFFECEDF3),
          contentPadding: EdgeInsets.zero,
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
      ),
    );
  }
}