const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./Category');

const Movie = sequelize.define('Movie', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  poster: {
    type: DataTypes.STRING,
    allowNull: false
  },
  backdrop: {
    type: DataTypes.STRING
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Category,
      key: 'id'
    }
  },
  language: {
    type: DataTypes.ENUM('kinyarwanda', 'english', 'french', 'mixed'),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  releaseYear: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  videoSource: {
    type: DataTypes.JSON,
    allowNull: false
  },
  subtitles: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  seoTitle: {
    type: DataTypes.STRING
  },
  seoDescription: {
    type: DataTypes.TEXT
  },
  seoKeywords: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['isActive']
    },
    {
      fields: ['featured']
    },
    {
      fields: ['categoryId']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['views']
    },
    {
      fields: ['releaseYear']
    },
    {
      fields: ['language']
    },
    {
      fields: ['isActive', 'featured']
    },
    {
      fields: ['categoryId', 'isActive']
    },
    {
      fields: ['title'],
      type: 'FULLTEXT'
    }
  ],
  timestamps: true,
  hooks: {
    beforeSave: (movie) => {
      // Generate slug from title
      if (movie.changed('title') || !movie.slug) {
        movie.slug = movie.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      if (movie.changed('videoSource') && movie.videoSource.type === 'youtube' && movie.videoSource.url) {
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = movie.videoSource.url.match(youtubeRegex);
        if (match) {
          movie.videoSource.youtubeId = match[1];
        }
      }
    }
  }
});

// Associations
Movie.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Movie, { foreignKey: 'categoryId', as: 'movies' });

module.exports = Movie;