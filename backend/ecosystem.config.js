/**
 * PM2 Ecosystem Configuration
 * Production deployment for Windows Server
 */

module.exports = {
  apps: [
    {
      name: 'obedio-backend',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Windows service configuration
      windowsHide: true,
      
      // Health monitoring
      health_check_url: 'http://localhost:3001/api/health',
      health_check_grace_period: 3000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Auto-restart on file changes (disabled in production)
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        'backups'
      ]
    }
  ]
};