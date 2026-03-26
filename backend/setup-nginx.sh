#!/bin/bash
# Run this on the Azure VM to set up nginx + open port 80
# Then open port 80 in Azure Portal > VM > Networking > Inbound rules

set -e
echo "=== UniAudit VM Setup ==="

# 1. Install nginx
sudo apt-get update -q && sudo apt-get install -y nginx

# 2. Write nginx config
sudo tee /etc/nginx/sites-available/uni-audit > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;

    location /uni-api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
}
NGINX

# 3. Enable site
sudo ln -sf /etc/nginx/sites-available/uni-audit /etc/nginx/sites-enabled/uni-audit
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx && sudo systemctl enable nginx
echo "✓ nginx configured: /uni-api/ → localhost:8000/api/"

# 4. Create systemd service for backend
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo tee /etc/systemd/system/uni-audit-backend.service > /dev/null << SYSTEMD
[Unit]
Description=UniAudit Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/../.env
ExecStart=$BACKEND_DIR/venv/bin/python -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable uni-audit-backend
sudo systemctl start uni-audit-backend
echo "✓ Backend service running"

echo ""
echo "=== DONE! Now open Azure Portal ==="
echo "VM > Networking > Add inbound port rule > Port 80 > Allow"
echo "Then test: curl http://$(curl -s ifconfig.me)/uni-api/universities"
