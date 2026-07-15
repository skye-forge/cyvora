import 'package:flutter/material.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/widgets/custom_card.dart';
import 'package:varnis/widgets/app_logo.dart';
import 'package:varnis/utils/language_picker.dart';
import 'package:provider/provider.dart';
import 'package:varnis/models/post.dart';
import 'package:varnis/providers/posts_provider.dart';

class SavedPostsScreen extends StatefulWidget {
  const SavedPostsScreen({super.key});

  @override
  State<SavedPostsScreen> createState() => _SavedPostsScreenState();
}

class _SavedPostsScreenState extends State<SavedPostsScreen> {
  @override
  void initState() {
    super.initState();
    // Ensure the feed (and therefore saved flags) is loaded even if the
    // user lands here before visiting the Community tab.
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<PostsProvider>().load(),
    );
  }

  void _unsavePost(Post post) {
    context.read<PostsProvider>().toggleSave(post);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Post removed from saved'),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Undo',
          onPressed: () =>
              context.read<PostsProvider>().toggleSave(post),
        ),
      ),
    );
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
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
                    'Saved Posts',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Community posts you bookmarked for later.',
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
              child: Builder(builder: (context) {
                final saved =
                    context.watch<PostsProvider>().savedPosts;
                if (saved.isEmpty) return _buildEmptyState();
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                  itemCount: saved.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 14),
                  itemBuilder: (context, index) =>
                      _buildPostCard(saved[index]),
                );
              }),
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

  Widget _buildPostCard(Post post) {
    return CustomCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
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
              ),
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
                        const Icon(
                          Icons.location_on_outlined,
                          size: 12,
                          color: AppColors.gray400,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          '${post.location}  •  ${_timeAgo(post.timestamp)}',
                          style: const TextStyle(
                            color: AppColors.gray400,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () => _unsavePost(post),
                child: const Icon(
                  Icons.bookmark,
                  color: AppColors.primary,
                  size: 22,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            post.content,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13.5,
              color: AppColors.gray600,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.favorite_border_rounded,
                  size: 16, color: AppColors.gray400),
              const SizedBox(width: 4),
              Text(
                '${post.likes}',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.gray500),
              ),
              const SizedBox(width: 14),
              const Icon(Icons.chat_bubble_outline_rounded,
                  size: 15, color: AppColors.gray400),
              const SizedBox(width: 4),
              Text(
                '${post.comments}',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.gray500),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(
            Icons.bookmark_border_rounded,
            size: 64,
            color: AppColors.gray300,
          ),
          SizedBox(height: 14),
          Text(
            'No saved posts yet',
            style: TextStyle(fontSize: 16, color: AppColors.gray500),
          ),
          SizedBox(height: 4),
          Text(
            'Bookmark posts in the community feed to find them here.',
            style: TextStyle(fontSize: 13, color: AppColors.gray400),
          ),
        ],
      ),
    );
  }
}