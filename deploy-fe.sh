#!/bin/bash
# A full deployment, include invalidation(clean cache)

echo "Building React app..."
npm run build

echo "Uploading to S3..."
aws s3 sync ./client/build s3://bridge-card/ \
  --delete \
  --exclude "*.html" \
  --exclude "backgroudmusic_Fall-Coffee-Shop.mp3" \
  --exclude "*.mp3" \
  --exclude "*.wav" \
  --exclude "*.ogg" \
  --cache-control "public, max-age=31536000"

aws s3 sync ./client/build s3://bridge-card/ \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Uploading audio files with long cache..."
aws s3 sync ./client/build s3://bridge-card/ \
  --include "backgroudmusic_Fall-Coffee-Shop.mp3" \
  --cache-control "public, max-age=86400"

echo "Creating CloudFront invalidation..."
aws cloudfront create-invalidation \
  --distribution-id E6S81GB1LYYIF \
  --paths "/*"

echo "Deployment complete!"