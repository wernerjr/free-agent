module.exports = {
  apps: [{
    name: 'free-agent-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
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
    merge_logs: true,
    time: true
  }]
}; 