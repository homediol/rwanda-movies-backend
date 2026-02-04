-- MySQL Performance Optimization for Rwanda Movies
-- Run these commands in your MySQL console or phpMyAdmin

-- 1. Set MySQL configuration variables for better performance
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL max_connections = 200;
SET GLOBAL wait_timeout = 600;
SET GLOBAL interactive_timeout = 600;
SET GLOBAL connect_timeout = 60;

-- 2. Create additional indexes for better query performance
USE rwanda_movies;

-- Index for movie filtering and sorting
CREATE INDEX idx_movies_active_featured ON Movies (isActive, featured);
CREATE INDEX idx_movies_category_active ON Movies (categoryId, isActive);
CREATE INDEX idx_movies_created_desc ON Movies (createdAt DESC);
CREATE INDEX idx_movies_views_desc ON Movies (views DESC);
CREATE INDEX idx_movies_language ON Movies (language);
CREATE INDEX idx_movies_release_year ON Movies (releaseYear);

-- Full-text search index for title and description
ALTER TABLE Movies ADD FULLTEXT(title, description);

-- Category indexes
CREATE INDEX idx_categories_slug ON Categories (slug);
CREATE INDEX idx_categories_name ON Categories (name);

-- 3. Analyze tables for query optimization
ANALYZE TABLE Movies;
ANALYZE TABLE Categories;

-- 4. Show current MySQL configuration
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'wait_timeout';

-- 5. Check table status
SHOW TABLE STATUS LIKE 'Movies';
SHOW TABLE STATUS LIKE 'Categories';