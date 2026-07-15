import 'package:flutter/material.dart';

/// The Varnis brand mark (assets/images/logo.png).
///
/// Use [AppLogo] anywhere the logo is needed — headers, splash, about,
/// auth screens — so the asset path lives in exactly one place.
///
/// [boxed] wraps the mark in the small rounded container used by the
/// per-screen top headers (previously a navy box with a shield icon).
class AppLogo extends StatelessWidget {
  final double size;
  final bool boxed;
  final Color? boxColor;

  const AppLogo({
    super.key,
    this.size = 30,
    this.boxed = false,
    this.boxColor,
  });

  static const String assetPath = 'assets/images/logo.png';

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      assetPath,
      width: boxed ? size * 0.62 : size,
      height: boxed ? size * 0.62 : size,
      fit: BoxFit.contain,
    );
    if (!boxed) return image;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: boxColor ?? Colors.white,
        borderRadius: BorderRadius.circular(size * 0.3),
      ),
      alignment: Alignment.center,
      child: image,
    );
  }
}
