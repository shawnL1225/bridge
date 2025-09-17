#!/usr/bin/env node

/**
 * iOS 資源生成腳本
 * 這個腳本會生成所有 iOS 需要的圖示和啟動畫面
 * 
 * 使用方法：
 * 1. 確保已安裝 sharp: npm install sharp
 * 2. 執行: node generate-ios-assets.js
 */

const fs = require('fs');
const path = require('path');

// 檢查是否安裝了 sharp
try {
  require('sharp');
} catch (error) {
  console.log('❌ 需要安裝 sharp 套件來生成圖示');
  console.log('請執行: npm install sharp');
  process.exit(1);
}

const sharp = require('sharp');

const publicDir = path.join(__dirname, 'public');
const appleAssetsDir = path.join(publicDir, 'apple-assets');

// iOS 圖示尺寸
const iconSizes = [
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
];

// iOS 啟動畫面尺寸 (iPhone X 及之後的設備)
const splashSizes = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png' }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png' }, // iPad Pro 11"
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' }, // iPad
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone X/XS/11 Pro
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png' }, // iPhone XS Max/11 Pro Max
  { width: 1170, height: 2532, name: 'apple-splash-1170-2532.png' }, // iPhone 12/13 mini
  { width: 1284, height: 2778, name: 'apple-splash-1284-2778.png' }, // iPhone 12/13 Pro Max
  { width: 1179, height: 2556, name: 'apple-splash-1179-2556.png' }, // iPhone 14/15/16/17
  { width: 1290, height: 2796, name: 'apple-splash-1290-2796.png' }  // iPhone 14/15/16/17 Pro Max
];

async function generateIcons() {
  console.log('🎨 生成 iOS 圖示...');
  
  const iconSvg = fs.readFileSync(path.join(appleAssetsDir, 'apple-touch-icon.svg'));
  
  for (const { size, name } of iconSizes) {
    try {
      await sharp(iconSvg)
        .resize(size, size)
        .png()
        .toFile(path.join(appleAssetsDir, name));
      
      console.log(`✅ 生成 ${name} (${size}x${size})`);
    } catch (error) {
      console.log(`❌ 生成 ${name} 失敗:`, error.message);
    }
  }
}

async function generateSplashScreens() {
  console.log('🖼️ 生成 iOS 啟動畫面...');
  
  const splashSvg = fs.readFileSync(path.join(appleAssetsDir, 'apple-splash-template.svg'));
  
  for (const { width, height, name } of splashSizes) {
    try {
      await sharp(splashSvg)
        .resize(width, height)
        .png()
        .toFile(path.join(appleAssetsDir, name));
      
      console.log(`✅ 生成 ${name} (${width}x${height})`);
    } catch (error) {
      console.log(`❌ 生成 ${name} 失敗:`, error.message);
    }
  }
}

async function generateDefaultIcon() {
  console.log('📱 生成預設圖示...');
  
  const iconSvg = fs.readFileSync(path.join(appleAssetsDir, 'apple-touch-icon.svg'));
  
  try {
    await sharp(iconSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(appleAssetsDir, 'apple-touch-icon.png'));
    
    console.log('✅ 生成 apple-touch-icon.png (180x180)');
  } catch (error) {
    console.log('❌ 生成預設圖示失敗:', error.message);
  }
}

async function main() {
  console.log('🚀 開始生成 iOS 資源...\n');
  
  try {
    await generateIcons();
    console.log('');
    await generateSplashScreens();
    console.log('');
    await generateDefaultIcon();
    
    console.log('\n🎉 所有 iOS 資源生成完成！');
    console.log('\n📋 下一步：');
    console.log('1. 建置應用程式: npm run build');
    console.log('2. 部署到 HTTPS 伺服器');
    console.log('3. 在 iOS Safari 中測試安裝功能');
    
  } catch (error) {
    console.log('❌ 生成過程發生錯誤:', error.message);
    process.exit(1);
  }
}

// 執行主函數
main();
