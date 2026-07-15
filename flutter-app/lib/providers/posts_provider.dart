import 'package:flutter/foundation.dart';
import 'package:varnis/models/post.dart';
import 'package:varnis/services/api_service.dart';

/// Community feed: posts, likes, saves, comments, creation.
/// Likes/saves update optimistically (instant UI) and sync to the
/// backend in the background, reverting on failure.
class PostsProvider extends ChangeNotifier {
  final ApiService _api;

  PostsProvider(this._api);

  List<Post> _posts = [];
  bool _isLoading = false;
  bool _isPosting = false;
  String? _error;
  bool _hasLoaded = false;

  List<Post> get posts => List.unmodifiable(_posts);
  List<Post> get savedPosts =>
      _posts.where((p) => p.isSaved).toList();
  bool get isLoading => _isLoading;
  bool get isPosting => _isPosting;
  String? get error => _error;

  Future<void> load() async {
    if (_hasLoaded && _posts.isNotEmpty) return;
    await refresh();
  }

  Future<void> refresh() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _posts = await _api.getPosts();
      _hasLoaded = true;
    } catch (e) {
      _error = 'Could not load the feed. Pull down to retry.';
      debugPrint('PostsProvider.refresh: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void toggleLike(Post post) {
    final wasLiked = post.isLiked;
    post.isLiked = !wasLiked;
    post.likes += post.isLiked ? 1 : -1;
    notifyListeners();

    _api.setPostLiked(post.id, post.isLiked).catchError((e) {
      // Revert on failure.
      post.isLiked = wasLiked;
      post.likes += wasLiked ? 1 : -1;
      notifyListeners();
      debugPrint('PostsProvider.toggleLike: $e');
    });
  }

  void toggleSave(Post post) {
    final wasSaved = post.isSaved;
    post.isSaved = !wasSaved;
    notifyListeners();

    _api.setPostSaved(post.id, post.isSaved).catchError((e) {
      post.isSaved = wasSaved;
      notifyListeners();
      debugPrint('PostsProvider.toggleSave: $e');
    });
  }

  Future<Post> createPost(String content, List<String> hashtags,
      {String? imagePath}) async {
    _isPosting = true;
    notifyListeners();
    try {
      final post =
          await _api.createPost(content, hashtags, imagePath: imagePath);
      _posts.insert(0, post);
      return post;
    } catch (e) {
      debugPrint('PostsProvider.createPost: $e');
      throw Exception(
          'Could not publish your post. Check your connection and try again.');
    } finally {
      _isPosting = false;
      notifyListeners();
    }
  }

  Future<List<Map<String, dynamic>>> getComments(String postId) =>
      _api.getComments(postId);

  Future<void> addComment(Post post, String content) async {
    await _api.addComment(post.id, content);
    post.comments += 1;
    notifyListeners();
  }

  void clear() {
    _posts = [];
    _hasLoaded = false;
    _error = null;
    notifyListeners();
  }
}