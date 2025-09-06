#!/bin/bash

# 前端部署到 S3 腳本 - 在本地執行
echo "🌐 開始部署前端到 S3..."

# 檢查 AWS CLI 是否安裝
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI 未安裝，請先安裝 AWS CLI 並配置憑證"
    echo "安裝指南: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# 獲取用戶輸入
read -p "請輸入 S3 存儲桶名稱: " S3_BUCKET
read -p "請輸入 AWS 區域 (例如: us-east-1): " AWS_REGION

echo "✅ 使用存儲桶: $S3_BUCKET"
echo "✅ 使用區域: $AWS_REGION"

# 構建前端
echo "🔨 構建前端應用..."
cd client
npm install || { echo "❌ 前端依賴安裝失敗"; exit 1; }
npm run build || { echo "❌ 前端構建失敗"; exit 1; }
cd ..

echo "✅ 前端應用構建完成，輸出到 client/build"

# 創建 S3 存儲桶（如果不存在）
echo "🪣 檢查/創建 S3 存儲桶..."
if ! aws s3 ls "s3://$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null; then
    echo "S3 存儲桶 $S3_BUCKET 不存在，正在創建..."
    aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION" || { echo "❌ 創建 S3 存儲桶失敗"; exit 1; }
    echo "✅ S3 存儲桶 $S3_BUCKET 創建成功"

    # 配置儲存桶為靜態網站托管
    echo "配置 S3 儲存桶為靜態網站托管..."
    aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html --region "$AWS_REGION" || { echo "❌ 配置靜態網站托管失敗"; exit 1; }
    echo "✅ S3 靜態網站托管配置成功"

    # 設置儲存桶策略，允許公開讀取
    echo "設置儲存桶策略，允許公開讀取..."
    cat <<EOF > bucket-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET/*"
        }
    ]
}
EOF
    aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file://bucket-policy.json --region "$AWS_REGION" || { echo "❌ 設置儲存桶策略失敗"; exit 1; }
    rm bucket-policy.json
    echo "✅ 儲存桶策略設置成功 (公開讀取)"
else
    echo "S3 存儲桶 $S3_BUCKET 已存在"
fi

# 同步前端構建文件到 S3
echo "☁️ 上傳前端靜態文件到 S3..."
aws s3 sync client/build "s3://$S3_BUCKET" --delete --region "$AWS_REGION" || { echo "❌ 同步前端文件到 S3 失敗"; exit 1; }
echo "✅ 前端靜態文件已成功部署到 S3"

# 獲取 S3 網站 URL
S3_WEBSITE_URL="http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"

echo ""
echo "🎉 前端部署完成！"
echo "🌐 前端訪問地址: $S3_WEBSITE_URL"
echo ""
echo "📝 後續步驟："
echo "1. 在 Lightsail 服務器上配置 nginx"
echo "2. 在 Lightsail 服務器上運行後端 Docker 容器"
echo "3. 前端需要連接到: ws://YOUR_LIGHTSAIL_IP:80/ws"
echo ""
echo "💡 提示："
echo "- 前端已托管在 S3，完全免費"
echo "- 後端需要在 Lightsail 上運行"
echo "- 確保 Lightsail 防火牆開放 80 端口"
