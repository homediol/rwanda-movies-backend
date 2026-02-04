const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Movie = require('./Movie');

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'movieId']
    }
  ]
});

// Associations
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Like.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Movie.hasMany(Like, { foreignKey: 'movieId', as: 'likes' });

module.exports = Like;