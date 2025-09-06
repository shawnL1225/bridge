#!/bin/bash

# 後端部署腳本 - 在 Lightsail 服務器上執行
echo "🐳 開始部署後端到 Lightsail..."

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未運行，請先啟動 Docker"
    echo "安裝 Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# 檢查 docker-compose 是否安裝
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安裝，請先安裝 docker-compose"
    exit 1
fi

echo "✅ Docker 環境檢查完成"

# 創建項目目錄
PROJECT_DIR="/var/www/bridge"
echo "📁 創建項目目錄: $PROJECT_DIR"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# 複製後端文件到項目目錄
echo "📋 複製後端文件..."
cp -r server $PROJECT_DIR/
cp docker-compose.prod.yml $PROJECT_DIR/
cp bridge.conf $PROJECT_DIR/

# 進入項目目錄
cd $PROJECT_DIR

# 配置 nginx
echo "📋 配置 nginx..."

# 方法1: 添加到現有 nginx.conf
echo "選擇 nginx 配置方式："
echo "1) 添加到現有 nginx.conf"
echo "2) 創建獨立的配置文件"
read -p "請選擇 (1 或 2): " nginx_choice

if [ "$nginx_choice" = "1" ]; then
    echo "將 bridge.conf 內容添加到現有 nginx.conf..."
    echo "" >> /etc/nginx/nginx.conf
    echo "# 橋牌遊戲配置" >> /etc/nginx/nginx.conf
    cat bridge.conf >> /etc/nginx/nginx.conf
    echo "✅ 已添加到現有 nginx.conf"
elif [ "$nginx_choice" = "2" ]; then
    echo "創建獨立的 nginx 配置文件..."
    sudo cp bridge.conf /etc/nginx/sites-available/poker_game
    sudo ln -sf /etc/nginx/sites-available/poker_game /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    echo "✅ 已創建獨立的 nginx 配置文件"
else
    echo "❌ 無效選擇，跳過 nginx 配置"
fi

# 測試 nginx 配置
echo "🔍 測試 nginx 配置..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ nginx 配置錯誤，請檢查配置文件"
    echo "您可以手動編輯 nginx 配置文件"
    exit 1
fi

# 啟動後端 Docker 容器
echo "🐳 啟動後端 Docker 容器..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 等待後端啟動
echo "⏳ 等待後端啟動..."
sleep 10

# 重啟 nginx
echo "🔄 重啟 nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 檢查服務狀態
echo "🔍 檢查服務狀態..."
docker-compose -f docker-compose.prod.yml ps

# 獲取服務器 IP 地址
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")

# 測試健康檢查
echo "💚 測試健康檢查..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 後端服務正常運行"
else
    echo "❌ 後端服務異常，請檢查日誌"
    docker-compose -f docker-compose.prod.yml logs backend
fi

echo ""
echo "🎉 後端部署完成！"
echo "🔌 WebSocket: ws://$SERVER_IP:80/ws"
echo "💚 健康檢查: http://$SERVER_IP:80/health"
echo ""
echo "📝 常用管理命令："
echo "  查看後端狀態: docker-compose -f docker-compose.prod.yml ps"
echo "  查看後端日誌: docker-compose -f docker-compose.prod.yml logs -f backend"
echo "  重啟後端: docker-compose -f docker-compose.prod.yml restart"
echo "  查看 nginx 狀態: sudo systemctl status nginx"
echo "  重啟 nginx: sudo systemctl restart nginx"
echo ""
echo "🎯 架構說明："
echo "  ✅ 後端運行在 Docker 容器內"
echo "  ✅ nginx 代理 WebSocket 和健康檢查"
echo "  ✅ 前端托管在 S3 (需要單獨部署)"
echo ""
echo "🔌 WebSocket 連接："
echo "  前端需要連接到: ws://$SERVER_IP:80/ws"
echo "  或使用 wss:// (如果配置了 SSL)"
