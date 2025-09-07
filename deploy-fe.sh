#!/bin/bash
# A full deployment, include invalidation(clean cache)

echo "Building React app..."
npm run build

echo "Uploading to S3..."
aws s3 sync ./client/build s3://bridge-card/ \
  --delete \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000"

aws s3 sync ./client/build s3://bridge-card/ \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Creating CloudFront invalidation..."
aws cloudfront create-invalidation \
  --distribution-id E6S81GB1LYYIF \
  --paths "/*"

echo "Deployment complete!"