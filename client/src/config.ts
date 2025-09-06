// 環境配置
export const config = {
    // WebSocket 連接配置
    wsUrl: (() => {
        const cloudfront = window.location.hostname.includes('cloudfront.net');
        const isProductionBuild = process.env.NODE_ENV === 'production';

        // 如果是 S3 託管或生產構建，使用 Lightsail IP
        if (isProductionBuild) {
            if (cloudfront) {
                return `wss://175.41.231.205:443/ws`; 
            }else{
                return `ws://175.41.231.205:80/ws`;
            }
        }

        return `ws://localhost:3001`;
    })(),
};
