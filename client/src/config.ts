// 環境配置
export const config = {
    // WebSocket 連接配置
    wsUrl: (() => {
        const isProductionBuild = process.env.NODE_ENV === 'production';
        if (isProductionBuild) {
            return `wss://api.attechbridge.online/ws`; 
        }

        return `ws://localhost:3001`;
    })(),
};
