const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Movie = require('./Movie');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Movie,
      key: 'id'
    }
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

// Associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Movie.hasMany(Comment, { foreignKey: 'movieId', as: 'comments' });

module.exports = Comment;