import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/report.dart';
import 'package:varnis/providers/report_provider.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'report_detail.dart';
import 'report_incident_screen.dart';

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key});

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  String _selectedTab = 'All Reports';

  static const List<String> _tabs = [
    'All Reports',
    'Pending',
    'Approved',
    'Rejected',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().load();
    });
  }

  List<Report> _visibleReports(ReportsProvider provider) {
    if (_selectedTab == 'All Reports') return provider.reports;
    if (_selectedTab == 'Pending') {
      return provider.reports
          .where((r) =>
              r.status == 'Pending' || r.status == 'Under Review')
          .toList();
    }
    return provider.byStatus(_selectedTab);
  }

  (IconData, Color, Color) _iconFor(Report report) {
    switch (report.status) {
      case 'Approved':
        return (
          Icons.shield_outlined,
          AppColors.success,
          AppColors.successLight
        );
      case 'Rejected':
        return (
          Icons.error_outline,
          AppColors.errorDark,
          AppColors.errorLight
        );
      default:
        return (
          Icons.phishing,
          AppColors.primary,
          AppColors.primaryLight
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportsProvider>();
    final reports = _visibleReports(provider);

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const ReportIncidentScreen(),
            ),
          );
        },
        backgroundColor: AppColors.primary,
        shape: const CircleBorder(),
        child: const Icon(Icons.add, color: AppColors.white),
      ),
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
                    'My Reports',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Track and manage your submitted civic safety incidents.',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.gray500,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildTabs(),
            const SizedBox(height: 4),
            Expanded(child: _buildBody(provider, reports)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(ReportsProvider provider, List<Report> reports) {
    if (provider.isLoading && provider.reports.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.error != null && provider.reports.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_rounded,
                size: 48, color: AppColors.gray300),
            const SizedBox(height: 12),
            Text(
              provider.error!,
              style: const TextStyle(color: AppColors.gray500),
            ),
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
      child: reports.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 120),
                Center(
                  child: Column(
                    children: [
                      const Icon(Icons.description_outlined,
                          size: 48, color: AppColors.gray300),
                      const SizedBox(height: 12),
                      Text(
                        _selectedTab == 'All Reports'
                            ? 'No reports yet. Tap + to submit your first.'
                            : 'No ${_selectedTab.toLowerCase()} reports.',
                        style: const TextStyle(color: AppColors.gray500),
                      ),
                    ],
                  ),
                ),
              ],
            )
          : ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 90),
              itemCount: reports.length,
              separatorBuilder: (context, index) =>
                  const SizedBox(height: 14),
              itemBuilder: (context, index) =>
                  _buildReportCard(reports[index]),
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

  Widget _buildTabs() {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _tabs.length,
        separatorBuilder: (context, index) => const SizedBox(width: 24),
        itemBuilder: (context, index) {
          final tab = _tabs[index];
          final isSelected = tab == _selectedTab;
          return GestureDetector(
            onTap: () => setState(() => _selectedTab = tab),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Text(
                    tab,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w500,
                      color: isSelected
                          ? AppColors.gray900
                          : AppColors.gray500,
                    ),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 3,
                  width: isSelected ? 28 : 0,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildReportCard(Report report) {
    final (icon, iconColor, iconBg) = _iconFor(report);
    final dateLabel = DateFormat('MMM d, y').format(report.createdAt);

    return CustomCard(
      padding: const EdgeInsets.all(16),
      onTap: () => _viewDetails(report),
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
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 22, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      report.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.gray900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '#${report.id}',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.gray400),
                    ),
                  ],
                ),
              ),
              _buildStatusPill(report.status),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: AppColors.gray100),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 14, color: AppColors.gray400),
              const SizedBox(width: 6),
              Text(
                dateLabel,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.gray500),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => _viewDetails(report),
                child: Row(
                  children: const [
                    Text(
                      'View Details',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.chevron_right,
                        size: 16, color: AppColors.primary),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusPill(String status) {
    late final Color background;
    late final Color textColor;

    switch (status) {
      case 'Approved':
        background = AppColors.successLight;
        textColor = AppColors.success;
        break;
      case 'Rejected':
        background = AppColors.errorLight;
        textColor = AppColors.errorDark;
        break;
      default: // Pending / Under Review
        background = const Color(0xFFFFF4E0);
        textColor = AppColors.warning;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: textColor,
        ),
      ),
    );
  }

  void _viewDetails(Report report) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ReportDetailsScreen(report: report),
      ),
    );
  }
}