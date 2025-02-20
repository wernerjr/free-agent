module.exports = {
  apps: [{
    name: 'free-agent-backend',
    script: 'dist/index.js',
    watch: true,
    ignore_watch: ['node_modules', 'logs'],
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 8000,
      CORS_ORIGIN: 'http://localhost:5173'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000,
      CORS_ORIGIN: 'http://localhost:5173'
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
}; 