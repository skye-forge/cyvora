import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/widgets/custom_text_field.dart';
import 'package:varnis/widgets/primary_button.dart';
import 'package:varnis/utils/language_picker.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emailController;
  late final TextEditingController _bioController;

  final _picker = ImagePicker();
  XFile? _pickedAvatar; // local preview until avatar upload API exists
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _nameController = TextEditingController(text: user?.fullName ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    try {
      final photo = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 800,
      );
      if (photo != null) setState(() => _pickedAvatar = photo);
    } catch (_) {
      _showSnack('Could not open the image picker.', isError: true);
    }
  }

  Future<void> _saveChanges() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      await context.read<AuthProvider>().updateProfile(
            fullName: _nameController.text.trim(),
            email: _emailController.text.trim(),
            phone: _phoneController.text.trim(),
            bio: _bioController.text.trim(),
          );
      // NOTE: avatar upload endpoint is not defined yet; _pickedAvatar is
      // previewed locally. Add ApiService.uploadAvatar when the backend
      // exposes it, then send _pickedAvatar.path here.
      if (!mounted) return;
      _showSnack('Profile updated successfully!');
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      _showSnack(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Form(
            key: _formKey,
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              const SizedBox(height: 24),

              // Avatar with edit pencil badge
              Center(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    _buildAvatar(context),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _pickAvatar,
                        child: Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            border:
                                Border.all(color: AppColors.white, width: 2.5),
                          ),
                          child: const Icon(
                            Icons.edit,
                            color: AppColors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              CustomTextField(
                controller: _nameController,
                labelText: 'Full Name / Nom Complet',
                prefixIcon: const Icon(
                  Icons.person_outline,
                  size: 20,
                  color: AppColors.gray500,
                ),
                keyboardType: TextInputType.name,
                validator: (value) =>
                    (value == null || value.trim().length < 3)
                        ? 'Please enter your full name'
                        : null,
              ),
              const SizedBox(height: 18),

              CustomTextField(
                controller: _phoneController,
                labelText: 'Phone Number / Numéro de Téléphone',
                prefixIcon: const Icon(
                  Icons.phone_outlined,
                  size: 20,
                  color: AppColors.gray500,
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 18),

              CustomTextField(
                controller: _emailController,
                labelText: 'Email Address / Adresse Email',
                prefixIcon: const Icon(
                  Icons.mail_outline,
                  size: 20,
                  color: AppColors.gray500,
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  final text = value?.trim() ?? '';
                  if (text.isEmpty) return 'Please enter your email';
                  final emailOk = RegExp(
                          r'^[\w.+-]+@[\w-]+(\.[\w-]+)+$')
                      .hasMatch(text);
                  return emailOk ? null : 'Enter a valid email address';
                },
              ),
              const SizedBox(height: 18),

              CustomTextField(
                controller: _bioController,
                labelText: 'Bio / Biographie',
                maxLines: 3,
                prefixIcon: const Icon(
                  Icons.description_outlined,
                  size: 20,
                  color: AppColors.gray500,
                ),
              ),
              const SizedBox(height: 22),

              // Privacy notice
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Icon(
                      Icons.info_outline,
                      size: 18,
                      color: AppColors.primary,
                    ),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Your contact information is only visible to verified '
                        "safety responders and is protected by Varnis's "
                        'security protocols.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.primary,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),

              PrimaryButton(
                text: 'Save Changes',
                icon: Icons.save_rounded,
                iconLeading: true,
                isLoading: _isSaving,
                onPressed: _saveChanges,
              ),
            ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    ImageProvider? image;
    if (_pickedAvatar != null) {
      image = FileImage(File(_pickedAvatar!.path));
    } else if (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty) {
      image = NetworkImage(user.avatarUrl!);
    }
    return CircleAvatar(
      radius: 48,
      backgroundColor: AppColors.primaryLight,
      backgroundImage: image,
      child: image == null
          ? Text(
              user?.initials ?? '?',
              style: const TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            )
          : null,
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
          'Edit Profile',
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
}