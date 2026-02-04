const express = require('express');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const User = require('../models/User');
const Movie = require('../models/Movie');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get comments for a movie
router.get('/movies/:movieId/comments', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { movieId: req.params.movieId },
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['id', 'username'] 
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment to movie
router.post('/movies/:movieId/comments', auth, async (req, res) => {
  try {
    const comment = await Comment.create({
      content: req.body.content,
      userId: req.user.id,
      movieId: req.params.movieId
    });
    
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['id', 'username'] 
      }]
    });
    
    res.status(201).json(commentWithUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Like/unlike a movie
router.post('/movies/:movieId/like', auth, async (req, res) => {
  try {
    const existingLike = await Like.findOne({
      where: { userId: req.user.id, movieId: req.params.movieId }
    });

    if (existingLike) {
      await existingLike.destroy();
      res.json({ liked: false, message: 'Movie unliked' });
    } else {
      await Like.create({
        userId: req.user.id,
        movieId: req.params.movieId
      });
      res.json({ liked: true, message: 'Movie liked' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get like count and user's like status for a movie
router.get('/movies/:movieId/likes', async (req, res) => {
  try {
    const likeCount = await Like.count({
      where: { movieId: req.params.movieId }
    });

    let userLiked = false;
    if (req.user) {
      const userLike = await Like.findOne({
        where: { userId: req.user.id, movieId: req.params.movieId }
      });
      userLiked = !!userLike;
    }

    res.json({ count: likeCount, userLiked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;