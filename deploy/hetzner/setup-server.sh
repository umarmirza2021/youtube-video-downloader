#!/usr/bin/env bash
# Initial Hetzner CX21 setup — Ubuntu 22.04
# Run as root: bash setup-server.sh

set -euo pipefail

APP_DIR=/var/www/vidinsecs
LOG_DIR=/var/log/vidinsecs
REPO=${REPO:-https://github.com/umarmirza2021/youtube-video-downloader.git}

echo "==> System update"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo "==> Base packages"
apt-get install -y curl git nginx certbot python3-certbot-nginx \
  python3 python3-pip ffmpeg ufw fail2ban

echo "==> Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

echo "==> yt-dlp (latest)"
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp
pip3 install --upgrade instaloader

echo "==> UFW firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Fail2ban"
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
cat >> /etc/fail2ban/jail.local <<'EOF'

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
findtime = 600
maxretry = 10
bantime = 3600
EOF
systemctl enable fail2ban
systemctl restart fail2ban

echo "==> App directory"
mkdir -p "$APP_DIR" "$LOG_DIR"
chown -R www-data:www-data "$LOG_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
fi

echo "==> Nginx config (HTTP-only until certbot)"
cp "$APP_DIR/deploy/hetzner/nginx-vidinsecs-http.conf" /etc/nginx/sites-available/vidinsecs.com
ln -sf /etc/nginx/sites-available/vidinsecs.com /etc/nginx/sites-enabled/vidinsecs.com
rm -f /etc/nginx/sites-enabled/default

echo "==> PM2 startup on boot"
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7

echo "==> Weekly yt-dlp update cron"
cat > /etc/cron.weekly/yt-dlp-update <<'EOF'
#!/bin/sh
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp
EOF
chmod +x /etc/cron.weekly/yt-dlp-update

echo ""
echo "=== Server base setup complete ==="
echo "Next steps:"
echo "  1. Copy deploy/hetzner/env.production.example to $APP_DIR/server/.env and fill values"
echo "  2. Point Cloudflare DNS A record to this server IP (orange cloud ON)"
echo "  3. Run: certbot --nginx -d vidinsecs.com -d www.vidinsecs.com"
echo "  4. Run: bash $APP_DIR/deploy/hetzner/deploy.sh"