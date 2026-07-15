import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:varnis/constants/app_colors.dart';
import 'package:varnis/models/post.dart';
import 'package:varnis/providers/posts_provider.dart';

/// Comment thread for a community post. Loads via
/// [PostsProvider.getComments] and adds via [PostsProvider.addComment].
/// Official taskforce replies render with a verified badge.
class CommentsScreen extends StatefulWidget {
  final Post post;

  const CommentsScreen({super.key, required this.post});

  @override
  State<CommentsScreen> createState() => _CommentsScreenState();
}

class _CommentsScreenState extends State<CommentsScreen> {
  final _inputController = TextEditingController();
  List<Map<String, dynamic>> _comments = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final comments =
          await context.read<PostsProvider>().getComments(widget.post.id);
      if (!mounted) return;
      setState(() => _comments = comments);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not load comments. Tap to retry.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _send() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isSending) return;

    setState(() => _isSending = true);
    try {
      await context.read<PostsProvider>().addComment(widget.post, text);
      if (!mounted) return;
      _inputController.clear();
      // Optimistically append; a refresh would also pick it up.
      setState(() {
        _comments.add({
          'id': 'local_${DateTime.now().millisecondsSinceEpoch}',
          'authorName': 'You',
          'content': text,
          'timestamp': DateTime.now().toIso8601String(),
          'isOfficial': false,
        });
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not post your comment. Try again.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    final date = DateTime.tryParse(iso);
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Comments')),
      body: SafeArea(
        child: Column(
          children: [
            _buildPostSummary(),
            Expanded(child: _buildBody()),
            _buildComposer(),
          ],
        ),
      ),
    );
  }

  Widget _buildPostSummary() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.post.authorName,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.gray900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.post.content,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.gray600,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: TextButton(
          onPressed: _load,
          child: Text(_error!,
              style: const TextStyle(color: AppColors.gray500)),
        ),
      );
    }
    if (_comments.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.chat_bubble_outline_rounded,
                  size: 44, color: AppColors.gray300),
              SizedBox(height: 12),
              Text(
                'No comments yet.\nBe the first to respond.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.gray500, height: 1.5),
              ),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        itemCount: _comments.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) => _buildComment(_comments[index]),
      ),
    );
  }

  Widget _buildComment(Map<String, dynamic> comment) {
    final isOfficial = comment['isOfficial'] == true;
    final name = comment['authorName'] as String? ?? 'Member';
    final initials = name
        .trim()
        .split(RegExp(r'\s+'))
        .map((w) => w.isNotEmpty ? w[0] : '')
        .take(2)
        .join()
        .toUpperCase();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isOfficial ? AppColors.primaryLight : AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isOfficial ? AppColors.primary : AppColors.gray200,
          width: isOfficial ? 1.2 : 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor:
                isOfficial ? AppColors.primary : AppColors.gray100,
            child: Text(
              initials,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isOfficial ? AppColors.white : AppColors.gray600,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.gray900,
                        ),
                      ),
                    ),
                    if (isOfficial) ...[
                      const SizedBox(width: 5),
                      const Icon(Icons.verified_rounded,
                          size: 14, color: AppColors.primary),
                    ],
                    const Spacer(),
                    Text(
                      _timeAgo(comment['timestamp'] as String?),
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.gray400),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  comment['content'] as String? ?? '',
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: AppColors.gray700,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComposer() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(top: BorderSide(color: AppColors.gray200)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _inputController,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _send(),
              decoration: const InputDecoration(
                hintText: 'Write a comment…',
                isDense: true,
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: _send,
            child: Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: _isSending
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.white,
                      ),
                    )
                  : const Icon(Icons.send_rounded,
                      size: 20, color: AppColors.white),
            ),
          ),
        ],
      ),
    );
  }
}
