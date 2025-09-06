#!/bin/bash

# 橋牌遊戲部署腳本

echo "🎮 開始部署橋牌遊戲..."

# 檢查 Docker 是否運行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未運行，請先啟動 Docker"
    exit 1
fi

# 選擇部署模式
echo "請選擇部署模式："
echo "1) 開發環境 (熱重載)"
echo "2) 生產環境 (優化構建)"
read -p "請輸入選擇 (1 或 2): " choice

case $choice in
    1)
        echo "🚀 啟動開發環境..."
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    2)
        echo "🚀 啟動生產環境..."
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.prod.yml up --build -d
        echo "✅ 生產環境已啟動！"
        echo "🌐 前端: http://localhost:80"
        echo "🔧 後端: http://localhost:3001"
        ;;
    *)
        echo "❌ 無效選擇"
        exit 1
        ;;
esac
