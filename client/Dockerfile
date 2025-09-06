# React Frontend Dockerfile
FROM node:18-alpine as build

# 設置工作目錄
WORKDIR /app

# 複製 package 文件
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製源代碼
COPY . .

# 構建應用
RUN npm run build

# 生產階段 - 使用 nginx 提供靜態文件
FROM nginx:alpine

# 複製構建文件到 nginx
COPY --from=build /app/build /usr/share/nginx/html

# 複製自定義 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]

