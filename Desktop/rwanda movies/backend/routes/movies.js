const express = require('express');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const Movie = require('../models/Movie');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'poster' || file.fieldname === 'backdrop') {
      cb(null, 'uploads/images/');
    } else if (file.fieldname === 'subtitles') {
      cb(null, 'uploads/subtitles/');
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'poster' || file.fieldname === 'backdrop') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    } else if (file.fieldname === 'subtitles') {
      if (file.mimetype === 'text/vtt' || file.originalname.endsWith('.srt') || file.originalname.endsWith('.vtt')) {
        cb(null, true);
      } else {
        cb(new Error('Only .vtt and .srt subtitle files are allowed'));
      }
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all movies with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      language, 
      search, 
      featured,
      sort = 'createdAt'
    } = req.query;

    const where = { isActive: true };
    const include = [{ 
      model: Category, 
      as: 'category', 
      attributes: ['id', 'name', 'slug'],
      required: false
    }];
    
    // Handle category filtering by slug
    if (category && category !== '') {
      const categoryRecord = await Category.findOne({ where: { slug: category } });
      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }
    
    if (language && language !== '') where.language = language;
    if (featured && featured !== '') where.featured = featured === 'true';
    if (search && search !== '') {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const order = sort.startsWith('-') 
      ? [[sort.substring(1), 'DESC']]
      : [[sort, 'ASC']];

    // Use separate queries for better performance
    const [movies, totalCount] = await Promise.all([
      Movie.findAll({
        where,
        include,
        attributes: {
          exclude: ['seoKeywords', 'subtitles'] // Exclude heavy JSON fields
        },
        order,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        raw: false,
        nest: true
      }),
      Movie.count({ where })
    ]);

    res.json({
      movies,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      total: totalCount
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug route to check all movies
router.get('/debug/all', async (req, res) => {
  try {
    const movies = await Movie.findAll({
      include: [{ model: Category, as: 'category' }]
    });
    res.json(movies.map(m => ({ id: m.id, title: m.title, slug: m.slug, isActive: m.isActive })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single movie by slug
router.get('/:slug', async (req, res) => {
  try {
    console.log('Looking for movie with slug:', req.params.slug);
    
    const movie = await Movie.findOne({ 
      where: { slug: req.params.slug, isActive: true },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }]
    });

    if (!movie) {
      console.log('Movie not found with slug:', req.params.slug);
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Increment view count
    await movie.increment('views');

    res.json(movie);
  } catch (error) {
    console.error('Get movie error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create movie (Admin only)
router.post('/', adminAuth, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'backdrop', maxCount: 1 },
  { name: 'subtitles', maxCount: 10 }
]), async (req, res) => {
  try {
    const movieData = { ...req.body };
    
    // Generate slug from title
    if (movieData.title) {
      movieData.slug = movieData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    // Handle poster upload
    if (req.files && req.files.poster) {
      movieData.poster = `/uploads/images/${req.files.poster[0].filename}`;
    } else if (!movieData.poster) {
      movieData.poster = 'https://picsum.photos/300/450?random=' + Date.now();
    }
    
    // Parse JSON strings if they exist
    if (typeof movieData.videoSource === 'string') {
      movieData.videoSource = JSON.parse(movieData.videoSource);
    }
    if (typeof movieData.tags === 'string') {
      movieData.tags = JSON.parse(movieData.tags);
    }

    const movie = await Movie.create(movieData);
    const movieWithCategory = await Movie.findByPk(movie.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }]
    });

    res.status(201).json(movieWithCategory);
  } catch (error) {
    console.error('Movie creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update movie (Admin only)
router.put('/:id', adminAuth, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'backdrop', maxCount: 1 },
  { name: 'subtitles', maxCount: 10 }
]), async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const updateData = { ...req.body };
    
    if (req.files.poster) {
      updateData.poster = `/uploads/images/${req.files.poster[0].filename}`;
    }
    
    if (req.files.backdrop) {
      updateData.backdrop = `/uploads/images/${req.files.backdrop[0].filename}`;
    }

    if (req.files.subtitles) {
      updateData.subtitles = req.files.subtitles.map((file, index) => ({
        language: req.body[`subtitle_language_${index}`] || 'en',
        label: req.body[`subtitle_label_${index}`] || 'English',
        src: `/uploads/subtitles/${file.filename}`,
        default: index === 0
      }));
    }

    await movie.update(updateData);
    const updatedMovie = await Movie.findByPk(movie.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }]
    });

    res.json(updatedMovie);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete movie (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    await movie.destroy();
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;