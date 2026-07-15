import 'package:geolocator/geolocator.dart';

/// Thin wrapper around geolocator so screens never deal with
/// permission plumbing directly. Returns null (with a reason) instead
/// of throwing, so callers can show a friendly snackbar.
///
/// Android: add ACCESS_FINE_LOCATION to AndroidManifest.xml.
/// iOS: add NSLocationWhenInUseUsageDescription to Info.plist.
class LocationService {
  /// Human-readable reason when the last call returned null.
  static String? lastError;

  /// Current device position, or null if services are off or
  /// permission was denied.
  static Future<Position?> getCurrentPosition() async {
    lastError = null;

    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      lastError = 'Location services are turned off on this device.';
      return null;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      lastError = 'Location permission was denied.';
      return null;
    }
    if (permission == LocationPermission.deniedForever) {
      lastError =
          'Location permission is permanently denied. Enable it in your device settings.';
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 10),
        ),
      );
    } catch (_) {
      lastError = 'Could not determine your location. Try again.';
      return null;
    }
  }

  /// Distance in kilometres between two coordinates (for Safe Zones
  /// distance sorting).
  static double distanceKm(
      double lat1, double lng1, double lat2, double lng2) {
    return Geolocator.distanceBetween(lat1, lng1, lat2, lng2) / 1000.0;
  }
}
