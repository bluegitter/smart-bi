#!/bin/bash

# 快速重新部署应用脚本

TARGET_SERVER="192.168.63.50"
TARGET_DIR="/data/smart-bi"

echo "=== 快速重新部署Smart-BI应用 ==="

# 复制更新的文件到服务器
echo "1. 复制更新的文件..."
scp "/Users/yanfei/Downloads/smart-bi/src/app/api/datasets/route.ts" "$TARGET_SERVER:$TARGET_DIR/src/app/api/datasets/"

# 重新构建并启动应用
echo "2. 重新构建应用..."
ssh "$TARGET_SERVER" "
    cd $TARGET_DIR
    
    # 停止应用
    docker compose stop smart-bi-app
    
    # 重新构建（仅应用容器）
    docker compose build smart-bi-app
    
    # 启动应用
    docker compose up -d smart-bi-app
    
    echo '等待应用启动...'
    sleep 10
    
    echo '检查应用状态:'
    docker compose ps smart-bi-app
"

echo "3. 测试API..."
echo "现在可以重新测试API来查看详细错误信息："
echo "curl -H \"Authorization: Bearer YOUR_TOKEN\" http://$TARGET_SERVER:3002/api/datasets"

echo ""
echo "✅ 重新部署完成！"