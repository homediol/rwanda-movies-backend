const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token && req.session.userId) {
      // Try to get user from session
      const user = await User.findByPk(req.session.userId, {
        attributes: { exclude: ['password'] }
      });
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token && req.session.userId) {
      // Try to get user from session
      const user = await User.findByPk(req.session.userId, {
        attributes: { exclude: ['password'] }
      });
      if (user && user.role === 'admin') {
        req.user = user;
        return next();
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authorization failed' });
  }
};

module.exports = { auth, adminAuth };