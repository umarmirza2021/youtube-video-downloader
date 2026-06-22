# GitHub Actions Secrets

| Secret | Example |
|--------|---------|
| `HETZNER_HOST` | `123.45.67.89` |
| `HETZNER_USER` | `root` |
| `HETZNER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` |
| `TELEGRAM_CHAT_ID` | `123456789` |

Optional (for cache purge in deploy.sh — set on VPS `.env` or `/etc/environment`):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`