import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/constants/app_constants.dart';
import 'package:varnis/providers/report_provider.dart';
import 'package:varnis/services/location_service.dart';
import 'package:varnis/widgets/custom_text_field.dart';
import 'package:varnis/widgets/primary_button.dart';
import 'report_success_screen.dart';

/// Full incident report form.
///
/// Wired to [ReportsProvider.submit]; captures category, description,
/// location (typed or GPS via LocationService), photo evidence
/// (camera/gallery via image_picker) and an anonymous flag. On success
/// navigates to [ReportSuccessScreen] with the created report.
class ReportIncidentScreen extends StatefulWidget {
  const ReportIncidentScreen({super.key});

  @override
  State<ReportIncidentScreen> createState() => _ReportIncidentScreenState();
}

class _ReportIncidentScreenState extends State<ReportIncidentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _picker = ImagePicker();

  String? _selectedCategory;
  bool _isAnonymous = false;
  bool _isFetchingLocation = false;
  double? _latitude;
  double? _longitude;
  final List<XFile> _evidence = [];

  @override
  void dispose() {
    _descriptionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  // ------------------------------------------------------------- location

  Future<void> _useMyLocation() async {
    setState(() => _isFetchingLocation = true);
    final position = await LocationService.getCurrentPosition();
    if (!mounted) return;
    setState(() => _isFetchingLocation = false);

    if (position == null) {
      _showSnack(
        LocationService.lastError ?? 'Could not get your location.',
        isError: true,
      );
      return;
    }
    setState(() {
      _latitude = position.latitude;
      _longitude = position.longitude;
      _locationController.text =
          '${position.latitude.toStringAsFixed(5)}, '
          '${position.longitude.toStringAsFixed(5)}';
    });
    _showSnack('Location captured.');
  }

  // ------------------------------------------------------------- evidence

  Future<void> _addEvidence() async {
    if (_evidence.length >= AppConstants.reportMaxEvidenceImages) {
      _showSnack(
        'Maximum ${AppConstants.reportMaxEvidenceImages} images per report.',
        isError: true,
      );
      return;
    }
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.gray300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined,
                  color: AppColors.primary),
              title: const Text('Take a photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined,
                  color: AppColors.primary),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (source == null) return;

    try {
      if (source == ImageSource.gallery) {
        final remaining =
            AppConstants.reportMaxEvidenceImages - _evidence.length;
        final picked = await _picker.pickMultiImage(
          imageQuality: 80,
          limit: remaining,
        );
        if (picked.isEmpty) return;
        setState(() => _evidence.addAll(picked.take(remaining)));
      } else {
        final photo =
            await _picker.pickImage(source: source, imageQuality: 80);
        if (photo == null) return;
        setState(() => _evidence.add(photo));
      }
    } catch (_) {
      _showSnack('Could not open the image picker.', isError: true);
    }
  }

  void _removeEvidence(int index) {
    setState(() => _evidence.removeAt(index));
  }

  // --------------------------------------------------------------- submit

  Future<void> _submitReport() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<ReportsProvider>();
    try {
      final report = await provider.submit(
        category: _selectedCategory!,
        description: _descriptionController.text.trim(),
        location: _locationController.text.trim().isEmpty
            ? null
            : _locationController.text.trim(),
        latitude: _latitude,
        longitude: _longitude,
        imagePaths: _evidence.map((x) => x.path).toList(),
        isAnonymous: _isAnonymous,
      );
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ReportSuccessScreen(report: report),
        ),
      );
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

  // ---------------------------------------------------------------- build

  @override
  Widget build(BuildContext context) {
    final isSubmitting =
        context.watch<ReportsProvider>().isSubmitting;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Report Incident')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildIntroBanner(),
                const SizedBox(height: 16),
                _buildDetailsCard(),
                const SizedBox(height: 16),
                _buildEvidenceCard(),
                const SizedBox(height: 16),
                _buildAnonymousCard(),
                const SizedBox(height: 24),
                PrimaryButton(
                  text: 'Submit Report',
                  icon: Icons.send_rounded,
                  isLoading: isSubmitting,
                  onPressed: _submitReport,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIntroBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Row(
        children: [
          Icon(Icons.shield_outlined, color: AppColors.primary, size: 22),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Your report helps protect the community. Provide as much '
              'detail as you can.',
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
    );
  }

  Widget _buildDetailsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Incident Details',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.gray900,
              ),
            ),
            const SizedBox(height: 18),
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Text(
                'Category',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.gray700,
                ),
              ),
            ),
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: const InputDecoration(
                hintText: 'Select the type of incident',
                prefixIcon: Icon(Icons.category_outlined, size: 20),
              ),
              items: AppConstants.reportCategories
                  .map(
                    (category) => DropdownMenuItem(
                      value: category,
                      child: Text(category),
                    ),
                  )
                  .toList(),
              onChanged: (value) =>
                  setState(() => _selectedCategory = value),
              validator: (value) =>
                  value == null ? 'Please select a category' : null,
            ),
            const SizedBox(height: 18),
            CustomTextField(
              controller: _descriptionController,
              labelText: 'Description',
              hintText: 'Describe what happened, when, and who was involved…',
              maxLines: 6,
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.isEmpty) {
                  return 'Please provide a description';
                }
                if (text.length < AppConstants.reportDescriptionMinLength) {
                  return 'Please add more detail (at least '
                      '${AppConstants.reportDescriptionMinLength} characters)';
                }
                return null;
              },
            ),
            const SizedBox(height: 18),
            CustomTextField(
              controller: _locationController,
              labelText: 'Location (optional)',
              hintText: 'e.g. Bastos, Yaoundé — or use GPS',
              prefixIcon:
                  const Icon(Icons.location_on_outlined, size: 20),
              suffixIcon: _isFetchingLocation
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : IconButton(
                      tooltip: 'Use my location',
                      icon: const Icon(Icons.my_location_rounded,
                          size: 20, color: AppColors.primary),
                      onPressed: _useMyLocation,
                    ),
              onChanged: (_) {
                // A manual edit invalidates previously captured GPS coords.
                if (_latitude != null) {
                  setState(() {
                    _latitude = null;
                    _longitude = null;
                  });
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEvidenceCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Evidence',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gray900,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '(optional · ${_evidence.length}/'
                  '${AppConstants.reportMaxEvidenceImages})',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.gray500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (_evidence.isNotEmpty) ...[
              SizedBox(
                height: 92,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _evidence.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, index) =>
                      _buildEvidenceThumb(index),
                ),
              ),
              const SizedBox(height: 12),
            ],
            InkWell(
              onTap: _addEvidence,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 20),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.gray300),
                  borderRadius: BorderRadius.circular(12),
                  color: AppColors.gray50,
                ),
                child: const Column(
                  children: [
                    Icon(Icons.add_a_photo_outlined,
                        size: 32, color: AppColors.gray400),
                    SizedBox(height: 8),
                    Text(
                      'Add screenshots or photos',
                      style: TextStyle(
                        color: AppColors.gray600,
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEvidenceThumb(int index) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.file(
            File(_evidence[index].path),
            width: 92,
            height: 92,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () => _removeEvidence(index),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: AppColors.gray900,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close,
                  size: 13, color: AppColors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAnonymousCard() {
    return Card(
      child: SwitchListTile(
        title: const Text(
          'Report Anonymously',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
        subtitle: const Text(
          'Your identity will be kept confidential',
          style: TextStyle(fontSize: 13, color: AppColors.gray500),
        ),
        value: _isAnonymous,
        onChanged: (value) => setState(() => _isAnonymous = value),
        activeThumbColor: AppColors.white,
        activeTrackColor: AppColors.primary,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
      ),
    );
  }
}
