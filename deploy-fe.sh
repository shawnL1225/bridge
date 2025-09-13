#!/bin/bash
# A full deployment, include invalidation(clean cache)

echo "Building React app..."
npm run build

echo "Uploading static assets (excluding audio and HTML)..."
aws s3 sync ./client/build s3://bridge-card/ \
  --exclude "*.html" \
  --exclude "*.mp3" \
  --exclude "*.wav" \
  --exclude "*.ogg" \
  --cache-control "public, max-age=31536000"

echo "Uploading HTML files..."
aws s3 sync ./client/build s3://bridge-card/ \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Checking if audio file needs update..."
# 只在上傳音頻文件，不強制覆蓋
aws s3 cp ./client/build/backgroudmusic_Fall-Coffee-Shop.mp3 s3://bridge-card/backgroudmusic_Fall-Coffee-Shop.mp3 \
  --cache-control "public, max-age=86400" \
  --only-show-errors

echo "Creating CloudFront invalidation..."
aws cloudfront create-invalidation \
  --distribution-id E6S81GB1LYYIF \
  --paths "/*"

echo "Deployment complete!"