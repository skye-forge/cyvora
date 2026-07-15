import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/alert.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:varnis/models/news_article.dart';
import 'package:varnis/providers/alert_provider.dart';
import 'package:varnis/providers/news_provider.dart';
import 'package:varnis/widgets/app_logo.dart';

class NationalUpdatesScreen extends StatefulWidget {
  const NationalUpdatesScreen({super.key});

  @override
  State<NationalUpdatesScreen> createState() =>
      _NationalUpdatesScreenState();
}

class _NationalUpdatesScreenState extends State<NationalUpdatesScreen> {
  final _searchController = TextEditingController();
  String _categoryFilter = 'All';

  /// 0 = Official Alerts (backend), 1 = Live News (RSS).
  int _tab = 0;

  // Awareness banner carousel ("images in motion").
  static const List<String> _bannerAssets = [
    'assets/images/news_banner_1.jpg',
    'assets/images/news_banner_2.jpg',
    'assets/images/dashboard_banner.jpg',
    'assets/images/onboarding_learn.jpg',
  ];
  final _bannerController = PageController();
  int _bannerIndex = 0;
  Timer? _bannerTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AlertsProvider>().load();
      context.read<NewsProvider>().load();
    });
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_bannerController.hasClients) return;
      final next = (_bannerIndex + 1) % _bannerAssets.length;
      _bannerController.animateToPage(
        next,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  List<Alert> _visibleAlerts(AlertsProvider provider) {
    final query = _searchController.text.trim().toLowerCase();
    return provider.byCategory(_categoryFilter).where((alert) {
      return query.isEmpty ||
          alert.title.toLowerCase().contains(query) ||
          alert.content.toLowerCase().contains(query);
    }).toList();
  }

  ({Color accent, Color pillBg, Color pillText, Color iconBg, IconData icon})
      _styleFor(String category) {
    switch (category) {
      case 'Urgent':
        return (
          accent: AppColors.errorDark,
          pillBg: AppColors.errorDark,
          pillText: AppColors.white,
          iconBg: AppColors.errorLight,
          icon: Icons.warning_rounded,
        );
      case 'Security':
        return (
          accent: AppColors.success,
          pillBg: AppColors.successLight,
          pillText: AppColors.success,
          iconBg: AppColors.successLight,
          icon: Icons.shield_outlined,
        );
      default:
        return (
          accent: AppColors.primary,
          pillBg: AppColors.primaryLight,
          pillText: AppColors.primary,
          iconBg: AppColors.primaryLight,
          icon: Icons.school_outlined,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AlertsProvider>();
    final alerts = _visibleAlerts(provider);

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
                    'National Updates',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Stay informed with official communications and safety '
                    'announcements from national authorities.',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.gray500,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _buildBannerCarousel(),
                  const SizedBox(height: 14),
                  _buildTabSwitcher(),
                  if (_tab == 0) ...[
                    const SizedBox(height: 12),
                    _buildSearchAndFilter(),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _tab == 0
                  ? _buildBody(provider, alerts)
                  : _buildNewsBody(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(AlertsProvider provider, List<Alert> alerts) {
    if (provider.isLoading && provider.alerts.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.error != null && provider.alerts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_rounded,
                size: 48, color: AppColors.gray300),
            const SizedBox(height: 12),
            Text(provider.error!,
                style: const TextStyle(color: AppColors.gray500)),
            const SizedBox(height: 16),
            SizedBox(
              width: 130,
              child: ElevatedButton(
                onPressed: () => provider.refresh(),
                child: const Text('Retry'),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => provider.refresh(),
      color: AppColors.primary,
      child: alerts.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 120),
                Center(
                  child: Text(
                    'No updates match your search.',
                    style: TextStyle(color: AppColors.gray500),
                  ),
                ),
              ],
            )
          : ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
              itemCount: alerts.length,
              separatorBuilder: (context, index) =>
                  const SizedBox(height: 14),
              itemBuilder: (context, index) =>
                  _buildUpdateCard(alerts[index]),
            ),
    );
  }

  /// Rotating awareness banners. Swap the assets in [_bannerAssets]
  /// (or feed URLs from the backend later) without touching the UI.
  Widget _buildBannerCarousel() {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            height: 150,
            width: double.infinity,
            child: PageView.builder(
              controller: _bannerController,
              onPageChanged: (index) =>
                  setState(() => _bannerIndex = index),
              itemCount: _bannerAssets.length,
              itemBuilder: (context, index) => Image.asset(
                _bannerAssets[index],
                fit: BoxFit.cover,
                alignment: const Alignment(0, -0.4),
                errorBuilder: (context, error, stackTrace) =>
                    Container(color: AppColors.primaryLight),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_bannerAssets.length, (index) {
            final active = index == _bannerIndex;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 16 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: active ? AppColors.primary : AppColors.gray300,
                borderRadius: BorderRadius.circular(3),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildTabSwitcher() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.gray100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildTabButton('Official Alerts', 0),
          _buildTabButton('Live News', 1),
        ],
      ),
    );
  }

  Widget _buildTabButton(String label, int index) {
    final selected = _tab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tab = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: selected ? AppColors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 6,
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: selected ? AppColors.primary : AppColors.gray500,
            ),
          ),
        ),
      ),
    );
  }

  // ------------------------------------------------------------ live news

  Widget _buildNewsBody() {
    final news = context.watch<NewsProvider>();

    if (news.isLoading && news.articles.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (news.articles.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.newspaper_rounded,
                size: 48, color: AppColors.gray300),
            const SizedBox(height: 12),
            Text(
              news.error ?? 'No headlines available right now.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.gray500),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: 130,
              child: ElevatedButton(
                onPressed: () => news.refresh(force: true),
                child: const Text('Retry'),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => news.refresh(force: true),
      color: AppColors.primary,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        itemCount: news.articles.length,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) =>
            _buildNewsCard(news.articles[index]),
      ),
    );
  }

  Widget _buildNewsCard(NewsArticle article) {
    final isCyber = article.category == 'Cybersecurity';
    return GestureDetector(
      onTap: () => launchUrl(
        Uri.parse(article.link),
        mode: LaunchMode.externalApplication,
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.gray200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isCyber
                        ? AppColors.primaryLight
                        : AppColors.successLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    article.category,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isCyber
                          ? AppColors.primary
                          : AppColors.success,
                    ),
                  ),
                ),
                const Spacer(),
                if (article.publishedAt != null)
                  Text(
                    _newsTimeAgo(article.publishedAt!),
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.gray400),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              article.title,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w700,
                color: AppColors.gray900,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.public_rounded,
                    size: 13, color: AppColors.gray400),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    article.source.isNotEmpty
                        ? article.source
                        : 'External source',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.gray500),
                  ),
                ),
                const Icon(Icons.open_in_new_rounded,
                    size: 14, color: AppColors.primary),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _newsTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Padding(
            padding: EdgeInsets.only(right: 12),
            child:
                Icon(Icons.arrow_back, size: 22, color: AppColors.gray900),
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
      ],
    );
  }

  Widget _buildSearchAndFilter() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchController,
            onChanged: (_) => setState(() {}),
            style:
                const TextStyle(fontSize: 14, color: AppColors.gray900),
            decoration: InputDecoration(
              hintText: 'Search updates...',
              hintStyle: const TextStyle(
                  color: AppColors.gray400, fontSize: 14),
              prefixIcon: const Icon(Icons.search,
                  size: 20, color: AppColors.gray400),
              filled: true,
              fillColor: AppColors.gray100,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
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
                borderSide: const BorderSide(
                    color: AppColors.primary, width: 1.5),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        GestureDetector(
          onTap: _showFilterSheet,
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.gray200),
            ),
            child: Row(
              children: [
                const Icon(Icons.tune, size: 17, color: AppColors.gray700),
                const SizedBox(width: 6),
                Text(
                  _categoryFilter == 'All' ? 'Filter' : _categoryFilter,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.gray700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Filter by category',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gray900,
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 10,
                  children:
                      ['All', 'Urgent', 'Security', 'Info'].map((category) {
                    final isSelected = category == _categoryFilter;
                    return GestureDetector(
                      onTap: () {
                        setState(() => _categoryFilter = category);
                        Navigator.pop(context);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 9),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.gray200,
                          ),
                        ),
                        child: Text(
                          category,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: isSelected
                                ? AppColors.white
                                : AppColors.gray600,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildUpdateCard(Alert alert) {
    final style = _styleFor(alert.category);
    final dateLabel = DateFormat('d MMM y').format(alert.publishedAt);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gray200),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: style.accent),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: style.iconBg,
                          shape: BoxShape.circle,
                        ),
                        child:
                            Icon(style.icon, size: 24, color: style.accent),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: style.pillBg,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              alert.isUrgent
                                  ? alert.category.toUpperCase()
                                  : alert.category,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: alert.isUrgent ? 0.5 : 0,
                                color: style.pillText,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            dateLabel,
                            style: const TextStyle(
                                fontSize: 12, color: AppColors.gray400),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        alert.title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.gray900,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        alert.content,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.gray600,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 14),
                      GestureDetector(
                        onTap: () => _showFullAlert(alert, style.accent),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Read Full Alert',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: style.accent,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(Icons.arrow_forward_rounded,
                                size: 16, color: style.accent),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Full alert in a bottom sheet (fullContent falls back to content).
  void _showFullAlert(Alert alert, Color accent) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.gray200,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    alert.title,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: accent,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${DateFormat('d MMMM y').format(alert.publishedAt)}'
                    '${alert.region != null ? ' • ${alert.region}' : ''}',
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.gray400),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    alert.fullContent ?? alert.content,
                    style: const TextStyle(
                      fontSize: 15,
                      height: 1.65,
                      color: AppColors.gray700,
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}