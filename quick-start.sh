#!/bin/bash

echo "🎮 橋牌遊戲快速啟動"
echo "===================="

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝，請先安裝 Docker"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未運行，請先啟動 Docker"
    exit 1
fi

echo "✅ Docker 已就緒"

# 選擇啟動模式
echo ""
echo "請選擇啟動模式："
echo "1) 🚀 生產環境 (端口 80, 3001)"
echo "2) 🔧 開發環境 (端口 3000, 3001, 熱重載)"
echo "3) 🛑 停止所有容器"
echo "4) 📊 查看容器狀態"
echo "5) 📝 查看日誌"

read -p "請輸入選擇 (1-5): " choice

case $choice in
    1)
        echo "🚀 啟動生產環境..."
        docker-compose -f docker-compose.prod.yml up --build -d
        echo ""
        echo "✅ 生產環境已啟動！"
        echo "🌐 前端: http://localhost:80"
        echo "🔧 後端: http://localhost:3001"
        echo "💚 健康檢查: http://localhost:3001/health"
        ;;
    2)
        echo "🔧 啟動開發環境..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    3)
        echo "🛑 停止所有容器..."
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.dev.yml down
        echo "✅ 所有容器已停止"
        ;;
    4)
        echo "📊 容器狀態："
        docker-compose -f docker-compose.prod.yml ps
        docker-compose -f docker-compose.dev.yml ps
        ;;
    5)
        echo "📝 選擇要查看的日誌："
        echo "1) 生產環境前端"
        echo "2) 生產環境後端"
        echo "3) 開發環境前端"
        echo "4) 開發環境後端"
        read -p "請輸入選擇 (1-4): " log_choice
        
        case $log_choice in
            1) docker-compose -f docker-compose.prod.yml logs -f frontend ;;
            2) docker-compose -f docker-compose.prod.yml logs -f backend ;;
            3) docker-compose -f docker-compose.dev.yml logs -f frontend-dev ;;
            4) docker-compose -f docker-compose.dev.yml logs -f backend-dev ;;
            *) echo "❌ 無效選擇" ;;
        esac
        ;;
    *)
        echo "❌ 無效選擇"
        exit 1
        ;;
esac
