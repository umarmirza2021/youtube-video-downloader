module.exports = {
  apps: [{
    name: 'vidinsecs',
    script: 'index.js',
    cwd: '/var/www/vidinsecs/server',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '3G',
    autorestart: true,
    watch: false,
    max_restarts: 15,
    min_uptime: '10s',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/vidinsecs/pm2-error.log',
    out_file: '/var/log/vidinsecs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 10000,
  }],
};