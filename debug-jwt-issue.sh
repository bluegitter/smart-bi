#!/bin/bash

# JWT问题调试脚本

TARGET_SERVER="192.168.63.50"
TARGET_PORT="3002"

echo "=== JWT令牌格式错误调试 ==="
echo ""

echo "1. 测试登录API并检查token格式"
echo "================================"

RESPONSE=$(curl -s -X POST http://$TARGET_SERVER:$TARGET_PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartbi.com","password":"admin123"}')

echo "完整登录响应:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 提取并验证token
TOKEN=$(echo "$RESPONSE" | python3 -c "
import json
import sys
try:
    data = json.load(sys.stdin)
    if 'token' in data:
        print(data['token'])
    else:
        print('NO_TOKEN')
except Exception as e:
    print(f'ERROR: {e}')
" 2>/dev/null)

echo "提取的token:"
echo "$TOKEN"
echo ""

if [ "$TOKEN" != "NO_TOKEN" ] && [ "$TOKEN" != "ERROR" ] && [ ! -z "$TOKEN" ]; then
    echo "2. 验证token格式"
    echo "================"
    
    # 检查token是否是标准的JWT格式 (header.payload.signature)
    DOT_COUNT=$(echo "$TOKEN" | grep -o '\.' | wc -l)
    echo "Token中的点号数量: $DOT_COUNT (标准JWT应该是2个点)"
    
    if [ "$DOT_COUNT" -eq 2 ]; then
        echo "✅ Token格式看起来正确"
        
        # 解码JWT payload部分（第二部分）
        PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2)
        echo ""
        echo "JWT payload (base64解码):"
        echo "$PAYLOAD" | base64 -d 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "解码失败"
        
    else
        echo "❌ Token格式不正确"
    fi
    
    echo ""
    echo "3. 测试token验证"
    echo "==============="
    
    echo "测试API调用..."
    API_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "http://$TARGET_SERVER:$TARGET_PORT/api/datasets")
    
    echo "API响应:"
    echo "$API_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$API_RESPONSE"
    
else
    echo "❌ 无法从登录响应中提取token"
fi

echo ""
echo "4. 检查应用日志中的JWT错误"
echo "=========================="
ssh "$TARGET_SERVER" "cd /data/smart-bi && docker compose logs --tail=20 smart-bi-app | grep -i jwt"

echo ""
echo "5. 建议的解决步骤"
echo "================"
echo "如果token格式不正确："
echo "1. 检查登录API是否正确生成JWT"
echo "2. 检查前端是否正确存储和传递token"
echo "3. 检查token是否在传递过程中被截断"
echo ""
echo "如果是前端问题："
echo "1. 清除浏览器缓存和localStorage"
echo "2. 重新登录"
echo "3. 检查浏览器开发者工具中的网络请求"