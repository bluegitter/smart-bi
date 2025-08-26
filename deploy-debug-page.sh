#!/bin/bash

# 部署调试页面到服务器

TARGET_SERVER="192.168.63.50"
TARGET_DIR="/data/smart-bi"

echo "=== 部署前端认证调试页面 ==="

# 复制调试页面到服务器
echo "1. 复制调试页面到服务器..."
scp "/Users/yanfei/Downloads/smart-bi/public/debug-auth.html" "$TARGET_SERVER:$TARGET_DIR/public/"

# 重启应用以加载新的静态文件
echo "2. 重启应用加载静态文件..."
ssh "$TARGET_SERVER" "
    cd $TARGET_DIR
    docker compose restart smart-bi-app
    
    echo '等待应用启动...'
    sleep 10
    
    echo '检查应用状态:'
    docker compose ps smart-bi-app
"

echo ""
echo "✅ 调试页面部署完成!"
echo ""
echo "📱 访问调试页面:"
echo "http://192.168.63.50:3002/debug-auth.html"
echo ""
echo "📋 使用步骤:"
echo "1. 打开上面的URL"
echo "2. 点击'登录获取Token'"
echo "3. 点击'测试 Datasets API'和'测试 Datasources API'"
echo "4. 查看浏览器控制台(F12)获取详细信息"
echo ""
echo "🔧 如果仍有问题，请检查:"
echo "1. 浏览器Network标签中的请求headers"
echo "2. 浏览器Console标签中的错误信息"