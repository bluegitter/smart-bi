#!/bin/bash

# 修复ObjectId问题的部署脚本

TARGET_SERVER="192.168.63.50"
TARGET_DIR="/data/smart-bi"

echo "=== 修复ObjectId类型问题 ==="

# 复制更新的文件到服务器
echo "1. 复制修复的登录API文件..."
scp "/Users/yanfei/Downloads/smart-bi/src/app/api/auth/login/route.ts" "$TARGET_SERVER:$TARGET_DIR/src/app/api/auth/login/"

# 重新构建并启动应用
echo "2. 重新构建应用..."
ssh "$TARGET_SERVER" "
    cd $TARGET_DIR
    
    # 停止应用
    docker compose stop smart-bi-app
    
    # 重新构建应用容器
    docker compose build smart-bi-app
    
    # 启动应用
    docker compose up -d smart-bi-app
    
    echo '等待应用启动...'
    sleep 15
    
    echo '检查应用状态:'
    docker compose ps smart-bi-app
    
    echo '检查应用日志:'
    docker compose logs --tail=10 smart-bi-app
"

echo ""
echo "3. 测试修复结果..."

# 重新登录获取新token
echo "重新登录获取新token..."
RESPONSE=$(ssh "$TARGET_SERVER" "curl -s -X POST http://localhost:3002/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@smartbi.com\",\"password\":\"admin123\"}'")

echo "登录响应: $RESPONSE"

TOKEN=$(echo "$RESPONSE" | python3 -c "
import json
import sys
try:
    data = json.load(sys.stdin)
    if 'token' in data:
        print(data['token'])
    else:
        print('TOKEN_NOT_FOUND')
except:
    print('PARSE_ERROR')
" 2>/dev/null)

if [ "$TOKEN" != "TOKEN_NOT_FOUND" ] && [ "$TOKEN" != "PARSE_ERROR" ] && [ ! -z "$TOKEN" ]; then
    echo "✅ 新token获取成功"
    echo "Token: $TOKEN"
    echo ""
    
    echo "测试datasets API..."
    ssh "$TARGET_SERVER" "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3002/api/datasets"
    echo ""
    
    echo "测试datasources API..."
    ssh "$TARGET_SERVER" "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3002/api/datasources"
    echo ""
    
else
    echo "❌ 获取token失败"
fi

echo ""
echo "=== 手动测试命令 ==="
echo "# 1. 重新登录:"
echo "curl -X POST http://192.168.63.50:3002/api/auth/login -H \"Content-Type: application/json\" -d '{\"email\":\"admin@smartbi.com\",\"password\":\"admin123\"}'"
echo ""
echo "# 2. 使用新token测试API:"
echo "curl -H \"Authorization: Bearer NEW_TOKEN_HERE\" http://192.168.63.50:3002/api/datasets"
echo "curl -H \"Authorization: Bearer NEW_TOKEN_HERE\" http://192.168.63.50:3002/api/datasources"