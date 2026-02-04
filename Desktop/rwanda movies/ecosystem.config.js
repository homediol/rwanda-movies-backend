module.exports = {
  apps: [{
    name: 'rwanda-movies-api',
    script: './server.js',
    cwd: './backend',
    
    // Instance configuration
    instances: 1,
    exec_mode: 'fork',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 5002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5002
    },
    
    // Restart configuration
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // Auto restart on file changes (development only)
    watch: false,
    ignore_watch: [
      'node_modules',
      'uploads',
      'logs',
      '.git'
    ],
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced options
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Merge logs from all instances
    merge_logs: true,
    
    // Auto restart
    autorestart: true,
    
    // Wait time before restart
    restart_delay: 4000
  }]
};