import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/providers/auth_provider.dart';
import 'package:varnis/providers/posts_provider.dart';
import 'package:varnis/widgets/primary_button.dart';

/// Compose a community post. Wired to [PostsProvider.createPost];
/// hashtags are parsed from the text (#word) plus an optional topic
/// chip row, and one image can be attached.
class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _contentController = TextEditingController();
  final _picker = ImagePicker();
  XFile? _image;

  static const List<String> _suggestedTopics = [
    'PhishingAlert',
    'ScamWarning',
    'SafetyTip',
    'CommunityWatch',
    'FraudPrevention',
  ];
  final Set<String> _selectedTopics = {};

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  List<String> _collectHashtags() {
    final fromText = RegExp(r'#(\w+)')
        .allMatches(_contentController.text)
        .map((m) => m.group(1)!)
        .toSet();
    return {...fromText, ..._selectedTopics}.toList();
  }

  Future<void> _pickImage() async {
    try {
      final photo = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
        maxWidth: 1440,
      );
      if (photo != null) setState(() => _image = photo);
    } catch (_) {
      _showSnack('Could not open the image picker.', isError: true);
    }
  }

  Future<void> _publish() async {
    final content = _contentController.text.trim();
    if (content.length < 5) {
      _showSnack('Write a little more before posting.', isError: true);
      return;
    }
    FocusScope.of(context).unfocus();
    try {
      await context.read<PostsProvider>().createPost(
            content,
            _collectHashtags(),
            imagePath: _image?.path,
          );
      if (!mounted) return;
      _showSnack('Post published!');
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      _showSnack(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
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
    final user = context.watch<AuthProvider>().user;
    final isPosting = context.watch<PostsProvider>().isPosting;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Create Post')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primaryLight,
                    child: Text(
                      user?.initials ?? '?',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.fullName ?? 'Guest',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.gray900,
                        ),
                      ),
                      Text(
                        user?.city.isNotEmpty == true
                            ? user!.city
                            : 'Community member',
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.gray500),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: TextField(
                    controller: _contentController,
                    maxLines: 7,
                    maxLength: 500,
                    decoration: const InputDecoration(
                      hintText:
                          'Share a warning, tip, or safety update with the '
                          'community… Use #hashtags for topics.',
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      fillColor: Colors.transparent,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              if (_image != null) ...[
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.file(
                        File(_image!.path),
                        width: double.infinity,
                        height: 180,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        onTap: () => setState(() => _image = null),
                        child: Container(
                          padding: const EdgeInsets.all(5),
                          decoration: const BoxDecoration(
                            color: AppColors.gray900,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close,
                              size: 15, color: AppColors.white),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
              ],
              OutlinedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.image_outlined, size: 19),
                label: Text(_image == null ? 'Add a photo' : 'Change photo'),
              ),
              const SizedBox(height: 20),
              const Text(
                'TOPICS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: AppColors.gray500,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _suggestedTopics.map((topic) {
                  final selected = _selectedTopics.contains(topic);
                  return FilterChip(
                    label: Text('#$topic'),
                    selected: selected,
                    onSelected: (value) {
                      setState(() {
                        value
                            ? _selectedTopics.add(topic)
                            : _selectedTopics.remove(topic);
                      });
                    },
                    selectedColor: AppColors.primaryLight,
                    checkmarkColor: AppColors.primary,
                    labelStyle: TextStyle(
                      fontSize: 13,
                      color: selected
                          ? AppColors.primary
                          : AppColors.gray600,
                      fontWeight: FontWeight.w600,
                    ),
                    backgroundColor: AppColors.white,
                    side: BorderSide(
                      color: selected
                          ? AppColors.primary
                          : AppColors.gray200,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 28),
              PrimaryButton(
                text: 'Publish',
                icon: Icons.send_rounded,
                isLoading: isPosting,
                onPressed: _publish,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
