# Rwanda Movies - Modern Streaming Platform

A modern movie streaming website built with React.js, Tailwind CSS, Node.js, and Express.js, specifically designed for Rwandan cinema and international films with Kinyarwanda subtitles.

## 🎬 Features

### Frontend Features
- **Netflix-inspired dark UI** with Tailwind CSS
- **Fully responsive design** (mobile, tablet, desktop)
- **Homepage** with featured movies and category browsing
- **Movie detail pages** with integrated video player
- **Search and filtering** by category, language, and more
- **Smooth animations** and hover effects
- **SEO-optimized** with meta tags and structured data

### Video Playback
- **Video.js integration** for hosted videos with subtitle support
- **YouTube iframe embedding** for YouTube content
- **Subtitle language selector** for hosted videos
- **Responsive video containers** with proper aspect ratios

### Backend Features
- **RESTful API** with Express.js
- **JWT authentication** for admin users
- **Admin dashboard API** for content management
- **File upload support** for posters, backdrops, and subtitles
- **MongoDB integration** with Mongoose ODM
- **Security middleware** (Helmet, CORS, rate limiting)

### Content Categories
1. **Films Nyarwanda** - Original Rwandan films
2. **Movies Agasobanuye** - International movies with Kinyarwanda & English subtitles
3. **French Movies** - French cinema with subtitles
4. **English Movies** - Hollywood and international English films
5. **Ibiganiro & Films** - Talk shows and films from YouTube

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rwanda-movies
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   
   Create `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/rwanda-movies
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Seed the database** (optional)
   ```bash
   cd backend
   node seed.js
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

## 📁 Project Structure

```
rwanda-movies/
├── backend/                 # Node.js/Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── uploads/            # File uploads directory
│   ├── server.js           # Main server file
│   └── seed.js             # Database seeding script
├── frontend/               # React.js frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main App component
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── package.json
└── package.json            # Root package.json
```

## 🎯 Usage

### Admin Access
After seeding the database, you can access the admin panel with:
- **Email:** admin@rwandamovies.com
- **Password:** admin123

### Adding Movies
1. Log in as admin
2. Navigate to `/admin/movies`
3. Use the movie management interface to:
   - Add new movies
   - Upload posters and backdrops
   - Add subtitle files (.vtt or .srt)
   - Set video source (hosted URL or YouTube URL)
   - Configure movie metadata

### Video Sources
- **Hosted Videos:** Provide direct video file URLs
- **YouTube Videos:** Provide YouTube video URLs (ID will be extracted automatically)

### Subtitle Support
- Upload `.vtt` or `.srt` subtitle files
- Support for multiple languages per movie
- Automatic subtitle selector in video player

## 🛠 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/movies` - Get movies with filtering and pagination
- `GET /api/movies/:slug` - Get single movie by slug
- `POST /api/movies` - Create movie (admin only)
- `PUT /api/movies/:id` - Update movie (admin only)
- `DELETE /api/movies/:id` - Delete movie (admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get single category
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

## 🎨 Customization

### Styling
The project uses Tailwind CSS with a custom Netflix-inspired theme. Colors and styling can be customized in:
- `frontend/tailwind.config.js` - Tailwind configuration
- `frontend/src/index.css` - Global styles and custom CSS

### Video Player
Video.js is used for hosted videos with custom styling. Customize the player in:
- `frontend/src/components/VideoPlayer.js` - Player component
- `frontend/src/index.css` - Video.js custom styles

## 🔧 Configuration

### Environment Variables
- `PORT` - Backend server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

### Google AdSense
To enable Google AdSense:
1. Replace `ca-pub-XXXXXXXXXX` in `frontend/public/index.html` with your AdSense publisher ID
2. Add ad units where needed in your components

## 📱 Performance Optimization

### For African Users
- **Lazy loading** for images and videos
- **Optimized video streaming** with multiple quality options
- **Efficient caching** strategies
- **Compressed assets** and images
- **CDN-ready** architecture

### SEO Optimization
- **Server-side rendering** ready
- **Meta tags** and Open Graph support
- **Structured data** for search engines
- **SEO-friendly URLs** with slugs

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and deploy to your preferred platform (Heroku, DigitalOcean, AWS, etc.)
3. Ensure MongoDB is accessible from production environment

### Frontend Deployment
1. Build the React app:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `build` folder to your hosting service (Netlify, Vercel, etc.)
3. Configure environment variables for production API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Netflix for UI/UX inspiration
- Video.js for video player functionality
- Tailwind CSS for styling framework
- React.js and Node.js communities

## 📞 Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**Rwanda Movies** - Bringing Rwandan cinema to the world 🇷🇼