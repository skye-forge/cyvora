import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/services/api_service.dart';
import 'package:varnis/services/location_service.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'package:varnis/utils/language_picker.dart';

class SafeZonesScreen extends StatefulWidget {
  const SafeZonesScreen({super.key});

  @override
  State<SafeZonesScreen> createState() => _SafeZonesScreenState();
}

class _SafeZonesScreenState extends State<SafeZonesScreen> {
  List<Map<String, dynamic>> _zones = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final zones = await context.read<ApiService>().getSafeZones();
      // Compute distance from the user's position when available and
      // sort nearest-first; otherwise keep server order.
      final position = await LocationService.getCurrentPosition();
      final enriched = zones.map((zone) {
        final z = Map<String, dynamic>.from(zone);
        final lat = (z['latitude'] as num?)?.toDouble();
        final lng = (z['longitude'] as num?)?.toDouble();
        if (position != null && lat != null && lng != null) {
          final km = LocationService.distanceKm(
              position.latitude, position.longitude, lat, lng);
          z['distanceKm'] = km;
          z['distance'] = km < 10
              ? '${km.toStringAsFixed(1)} km'
              : '${km.round()} km';
        } else {
          z['distance'] = z['distance'] ?? '—';
        }
        return z;
      }).toList();
      if (position != null) {
        enriched.sort((a, b) => ((a['distanceKm'] as double?) ?? 1e9)
            .compareTo((b['distanceKm'] as double?) ?? 1e9));
      }
      if (!mounted) return;
      setState(() => _zones = enriched);
    } catch (_) {
      if (!mounted) return;
      setState(() =>
          _error = 'Could not load safe zones. Pull down to retry.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(context),
                  const SizedBox(height: 18),
                  const Text(
                    'Safe Zones',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Verified public locations where you can seek help or '
                    'shelter nearby.',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.gray500,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? Center(
                          child: TextButton(
                            onPressed: _load,
                            child: Text(
                              _error!,
                              style: const TextStyle(
                                  color: AppColors.gray500),
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(
                                20, 12, 20, 24),
                            itemCount: _zones.length,
                            separatorBuilder: (context, index) =>
                                const SizedBox(height: 14),
                            itemBuilder: (context, index) =>
                                _ZoneCard(zone: _zones[index]),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Padding(
            padding: EdgeInsets.only(right: 12),
            child: Icon(Icons.arrow_back, size: 22, color: AppColors.gray900),
          ),
        ),
        const AppLogo(size: 30),
        const SizedBox(width: 10),
        const Text(
          'Varnis',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 18,
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

class _ZoneCard extends StatelessWidget {
  final Map<String, dynamic> zone;

  const _ZoneCard({required this.zone});

  bool get _isAlwaysOpen => zone['hours'] == 'Open 24/7';

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.place_outlined,
                  color: AppColors.success,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      zone['name'] as String? ?? '',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: AppColors.gray900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      zone['address'] as String? ?? '',
                      style: const TextStyle(
                        color: AppColors.gray500,
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  zone['distance'] as String? ?? '—',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.gray100),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(
                Icons.access_time_rounded,
                size: 14,
                color: _isAlwaysOpen ? AppColors.success : AppColors.gray400,
              ),
              const SizedBox(width: 5),
              Text(
                zone['hours'] as String? ?? '',
                style: TextStyle(
                  color:
                      _isAlwaysOpen ? AppColors.success : AppColors.gray500,
                  fontSize: 12,
                  fontWeight:
                      _isAlwaysOpen ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () async {
                  final lat = (zone['latitude'] as num?)?.toDouble();
                  final lng = (zone['longitude'] as num?)?.toDouble();
                  final destination = (lat != null && lng != null)
                      ? '$lat,$lng'
                      : Uri.encodeComponent(
                          zone['address'] as String? ?? '');
                  final uri = Uri.parse(
                      'https://www.google.com/maps/dir/?api=1'
                      '&destination=$destination');
                  await launchUrl(uri,
                      mode: LaunchMode.externalApplication);
                },
                child: Row(
                  children: const [
                    Icon(
                      Icons.directions_outlined,
                      size: 15,
                      color: AppColors.primary,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Directions',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}