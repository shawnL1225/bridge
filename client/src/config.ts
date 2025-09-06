// 環境配置
export const config = {
  // WebSocket 連接配置
  wsUrl: (() => {
    // 檢查是否在 S3 環境（通過域名判斷）
    const isS3Hosted = window.location.hostname.includes('s3-website') || 
                       window.location.hostname.includes('amazonaws.com') ||
                       window.location.hostname.includes('cloudfront.net');
    
    // 檢查是否為生產構建
    const isProductionBuild = process.env.NODE_ENV === 'production';
    
    // 如果是 S3 託管或生產構建，使用 Lightsail IP
    if (isS3Hosted || isProductionBuild) {
      return `wss://175.41.231.205:443/ws`;  // 生產環境：連接到 Lightsail IP (HTTPS)
    }
    
    // 開發環境：直接連接到後端
    return `wss://localhost:3001`;
  })(),
};
