import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/post.dart';
import 'package:varnis/providers/posts_provider.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/primary_button.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'emergency_chat_screen.dart';
import 'package:flutter/services.dart';
import 'comments_screen.dart';
import 'create_post_screen.dart';

class CommunityFeedScreen extends StatefulWidget {
  const CommunityFeedScreen({super.key});

  @override
  State<CommunityFeedScreen> createState() => _CommunityFeedScreenState();
}

class _CommunityFeedScreenState extends State<CommunityFeedScreen> {
  final _searchController = TextEditingController();
  String _selectedFilter = 'All Alerts';

  static const List<String> _filters = [
    'All Alerts',
    '#ScamAlert',
    '#SafetyTip',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PostsProvider>().load();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatTime(DateTime timestamp) {
    final difference = DateTime.now().difference(timestamp);
    if (difference.inDays > 0) return '${difference.inDays}d ago';
    if (difference.inHours > 0) return '${difference.inHours}h ago';
    if (difference.inMinutes > 0) return '${difference.inMinutes}m ago';
    return 'Just now';
  }

  List<Post> _visiblePosts(PostsProvider provider) {
    final query = _searchController.text.trim().toLowerCase();
    return provider.posts.where((post) {
      final matchesFilter = _selectedFilter == 'All Alerts' ||
          post.hashtags.any(
            (tag) =>
                '#$tag'.toLowerCase() == _selectedFilter.toLowerCase(),
          );
      final matchesQuery = query.isEmpty ||
          post.content.toLowerCase().contains(query) ||
          post.hashtags.any((tag) => tag.toLowerCase().contains(query));
      return matchesFilter && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PostsProvider>();
    final posts = _visiblePosts(provider);

    return Stack(
      children: [
        SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Column(
                  children: [
                    _buildHeader(),
                    const SizedBox(height: 16),
                    _buildSearchBar(),
                    const SizedBox(height: 14),
                    PrimaryButton(
                      text: 'Post Tip',
                      icon: Icons.add_circle_outline,
                      iconLeading: true,
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) =>
                                const CreatePostScreen(),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 14),
                    _buildFilterChips(),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              Expanded(child: _buildBody(provider, posts)),
            ],
          ),
        ),

        // Red SOS floating action button → Emergency Chat
        Positioned(
          right: 20,
          bottom: 20,
          child: GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const EmergencyChatScreen(),
                ),
              );
            },
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.errorDark,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.emergency_rounded,
                color: AppColors.white,
                size: 26,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBody(PostsProvider provider, List<Post> posts) {
    if (provider.isLoading && provider.posts.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.error != null && provider.posts.isEmpty) {
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
      child: posts.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 120),
                Center(
                  child: Text(
                    'No posts match your search.',
                    style: TextStyle(color: AppColors.gray500),
                  ),
                ),
              ],
            )
          : ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 90),
              itemCount: posts.length,
              separatorBuilder: (context, index) =>
                  const SizedBox(height: 14),
              itemBuilder: (context, index) =>
                  _buildPostCard(provider, posts[index]),
            ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        const AppLogo(size: 34),
        const SizedBox(width: 10),
        const Text(
          'Citizen Community',
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 19,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return TextField(
      controller: _searchController,
      onChanged: (_) => setState(() {}),
      style: const TextStyle(fontSize: 14, color: AppColors.gray900),
      decoration: InputDecoration(
        hintText: 'Search safety alerts or topics...',
        hintStyle: const TextStyle(color: AppColors.gray400, fontSize: 14),
        prefixIcon:
            const Icon(Icons.search, size: 20, color: AppColors.gray400),
        filled: true,
        fillColor: AppColors.gray100,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _filters.length,
        separatorBuilder: (context, index) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final filter = _filters[index];
          final isSelected = filter == _selectedFilter;
          return GestureDetector(
            onTap: () => setState(() => _selectedFilter = filter),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : AppColors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color:
                      isSelected ? AppColors.primary : AppColors.gray200,
                ),
              ),
              child: Text(
                filter,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? AppColors.white : AppColors.gray600,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPostCard(PostsProvider provider, Post post) {
    return CustomCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildAvatar(post),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post.authorName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppColors.gray900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 12, color: AppColors.gray400),
                        const SizedBox(width: 2),
                        Text(
                          '${post.location}  •  ${_formatTime(post.timestamp)}',
                          style: const TextStyle(
                              color: AppColors.gray400, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Bookmark toggle (feeds the Saved Posts screen)
              GestureDetector(
                onTap: () => provider.toggleSave(post),
                child: Icon(
                  post.isSaved
                      ? Icons.bookmark
                      : Icons.bookmark_border_rounded,
                  size: 22,
                  color: post.isSaved
                      ? AppColors.primary
                      : AppColors.gray400,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            post.content,
            style: const TextStyle(
              fontSize: 14,
              height: 1.5,
              color: AppColors.gray800,
            ),
          ),
          if (post.imageUrl != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                post.imageUrl!,
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 180,
                  color: AppColors.gray200,
                  child: const Center(
                    child: Icon(Icons.image_not_supported,
                        color: AppColors.gray400),
                  ),
                ),
              ),
            ),
          ],
          if (post.hashtags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: post.hashtags
                  .map(
                    (tag) => GestureDetector(
                      onTap: () {
                        final asFilter = '#$tag';
                        if (_filters.contains(asFilter)) {
                          setState(() => _selectedFilter = asFilter);
                        }
                      },
                      child: Text(
                        '#$tag',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.gray100),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildPostAction(
                icon: post.isLiked
                    ? Icons.thumb_up_alt_rounded
                    : Icons.thumb_up_alt_outlined,
                label: post.likes.toString(),
                color: post.isLiked
                    ? AppColors.primary
                    : AppColors.gray400,
                bold: post.isLiked,
                onTap: () => provider.toggleLike(post),
              ),
              const SizedBox(width: 28),
              _buildPostAction(
                icon: Icons.chat_bubble_outline_rounded,
                label: post.comments.toString(),
                color: AppColors.gray400,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CommentsScreen(post: post),
                    ),
                  );
                },
              ),
              const SizedBox(width: 28),
              _buildPostAction(
                icon: Icons.share_outlined,
                label: 'Share',
                color: AppColors.gray400,
                onTap: () {
                  // No share_plus dependency yet — copy the post text so
                  // it can be pasted anywhere. Swap for share_plus later
                  // if a native share sheet is preferred.
                  Clipboard.setData(ClipboardData(
                    text: '${post.content}\n\n— shared from Varnis',
                  ));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Post copied to clipboard.'),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(Post post) {
    if (post.avatarUrl != null) {
      return CircleAvatar(
        radius: 18,
        backgroundColor: AppColors.gray200,
        backgroundImage: NetworkImage(post.avatarUrl!),
        onBackgroundImageError: (_, __) {},
      );
    }
    return CircleAvatar(
      radius: 18,
      backgroundColor: AppColors.primaryLight,
      child: Text(
        post.authorInitials,
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w700,
          fontSize: 13,
        ),
      ),
    );
  }

  Widget _buildPostAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    bool bold = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Row(
          children: [
            Icon(icon, size: 19, color: color),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}