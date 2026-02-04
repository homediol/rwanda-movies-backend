const express = require('express');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Movie = require('../models/Movie');
const { auth, adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Create user (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user'
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    console.log('Fetching users for admin:', req.user.username);
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    console.log('Found users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update user (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = { username, email, role };
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.id;
    
    // Prevent admin from deleting themselves
    if (userId == currentUserId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Admin ${req.user.username} deleting user ${user.username}`);
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all comments (admin only)
router.get('/comments/all', adminAuth, async (req, res) => {
  try {
    console.log('Fetching comments for admin:', req.user.username);
    const comments = await Comment.findAll({
      include: [
        { model: User, as: 'user', attributes: ['username'] },
        { model: Movie, as: 'movie', attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    console.log('Found comments:', comments.length);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete comment (admin only)
router.delete('/comments/:id', adminAuth, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    await comment.destroy();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;