const sequelize = require('./config/database');
const User = require('./models/User');
const Category = require('./models/Category');
const Movie = require('./models/Movie');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MySQL
    await sequelize.authenticate();
    console.log('Connected to MySQL');

    // Sync database (create tables)
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@rwandamovies.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Created admin user');

    // Create categories
    const categories = await Category.bulkCreate([
      {
        name: 'Films Nyarwanda',
        slug: 'films-nyarwanda',
        description: 'Original Rwandan films showcasing local talent and stories'
      },
      {
        name: 'Movies Agasobanuye',
        slug: 'movies-agasobanuye',
        description: 'International movies with Kinyarwanda & English subtitles'
      },
      {
        name: 'French Movies',
        slug: 'french-movies',
        description: 'French cinema with subtitles'
      },
      {
        name: 'English Movies',
        slug: 'english-movies',
        description: 'Hollywood and international English films'
      },
      {
        name: 'Ibiganiro & Films',
        slug: 'ibiganiro-films',
        description: 'Talk shows and films from YouTube'
      }
    ]);
    console.log('Created categories');

    // Create sample movies
    const sampleMovies = [
      {
        title: 'Zootopia 2',
        slug: 'zootopia-2',
        description: 'Brave rabbit cop Judy Hopps and her friend, the fox Nick Wilde, team up again to crack a new case, the most perilous and intricate of their career',
        poster: '/api/placeholder/300/450',
        backdrop: '/api/placeholder/800/450',
        categoryId: categories[1].id, // Movies Agasobanuye
        language: 'kinyarwanda',
        duration: 200,
        releaseYear: 2025,
        videoSource: {
          type: 'hosted',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        },
        tags: ['animation', 'adventure', 'family'],
        featured: true,
        views: 6
      },
      {
        title: 'Seburikoko',
        slug: 'seburikoko',
        description: 'Ubuzima bwo mucyaro',
        poster: '/images/Seburikoko_movie.jpg',
        backdrop: '/images/Seburikoko_movie.jpg',
        categoryId: categories[0].id, // Films Nyarwanda
        language: 'kinyarwanda',
        duration: 2000,
        releaseYear: 2026,
        videoSource: {
          type: 'hosted',
          url: '/images/video-1769981126814.mp4'
        },
        tags: ['drama', 'rural life', 'rwandan'],
        featured: true,
        views: 23
      },
      {
        title: 'Ubwoba',
        slug: 'ubwoba',
        description: 'A thrilling Rwandan horror film that explores traditional beliefs and modern fears.',
        poster: '/api/placeholder/300/450',
        backdrop: '/api/placeholder/800/450',
        categoryId: categories[0].id, // Films Nyarwanda
        language: 'kinyarwanda',
        duration: 95,
        releaseYear: 2023,
        videoSource: {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        },
        tags: ['horror', 'thriller', 'rwandan'],
        featured: true,
        views: 1260
      },
      {
        title: 'The Lion King (Kinyarwanda)',
        slug: 'the-lion-king-kinyarwanda',
        description: 'The classic Disney animated film with Kinyarwanda and English subtitles.',
        poster: '/api/placeholder/300/450',
        backdrop: '/api/placeholder/800/450',
        categoryId: categories[1].id, // Movies Agasobanuye
        language: 'mixed',
        duration: 88,
        releaseYear: 1994,
        videoSource: {
          type: 'hosted',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        },
        subtitles: [
          {
            language: 'rw',
            label: 'Kinyarwanda',
            src: '/uploads/subtitles/lion-king-rw.vtt',
            default: true
          },
          {
            language: 'en',
            label: 'English',
            src: '/uploads/subtitles/lion-king-en.vtt',
            default: false
          }
        ],
        tags: ['animation', 'family', 'disney'],
        featured: true,
        views: 3428
      },
      {
        title: 'Amélie',
        slug: 'amelie',
        description: 'A whimsical French romantic comedy about a shy waitress who decides to help others.',
        poster: '/api/placeholder/300/450',
        backdrop: '/api/placeholder/800/450',
        categoryId: categories[2].id, // French Movies
        language: 'french',
        duration: 122,
        releaseYear: 2001,
        videoSource: {
          type: 'hosted',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
        },
        subtitles: [
          {
            language: 'rw',
            label: 'Kinyarwanda',
            src: '/uploads/subtitles/amelie-rw.vtt',
            default: true
          },
          {
            language: 'en',
            label: 'English',
            src: '/uploads/subtitles/amelie-en.vtt',
            default: false
          }
        ],
        tags: ['romance', 'comedy', 'french'],
        views: 895
      },
      {
        title: 'Black Panther',
        slug: 'black-panther',
        description: 'A superhero film that celebrates African culture and heritage.',
        poster: '/api/placeholder/300/450',
        backdrop: '/api/placeholder/800/450',
        categoryId: categories[3].id, // English Movies
        language: 'english',
        duration: 134,
        releaseYear: 2018,
        videoSource: {
          type: 'hosted',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        },
        subtitles: [
          {
            language: 'rw',
            label: 'Kinyarwanda',
            src: '/uploads/subtitles/black-panther-rw.vtt',
            default: true
          }
        ],
        tags: ['action', 'superhero', 'marvel'],
        featured: true,
        views: 5672
      }
    ];

    await Movie.bulkCreate(sampleMovies);
    console.log('Created sample movies');

    console.log('Database seeded successfully!');
    console.log('Admin credentials: admin@rwandamovies.com / admin123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
    console.log('Disconnected from MySQL');
  }
};

seedDatabase();