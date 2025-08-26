#!/bin/bash

# 测试登录API并获取token的脚本

TARGET_SERVER="192.168.63.50"
TARGET_PORT="3002"

echo "=== Smart-BI 登录API测试 ==="
echo "服务器: $TARGET_SERVER:$TARGET_PORT"
echo ""

# 测试登录接口
echo "1. 测试管理员登录..."
echo "用户名: admin@smartbi.com"
echo "密码: admin123"
echo ""

RESPONSE=$(curl -s -X POST http://$TARGET_SERVER:$TARGET_PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartbi.com","password":"admin123"}')

echo "登录响应:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 提取token
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
    echo "✅ 登录成功! Token已获取"
    echo ""
    echo "2. 使用token测试API..."
    echo ""
    
    # 测试datasources API
    echo "测试 /api/datasources:"
    curl -s -H "Authorization: Bearer $TOKEN" \
        "http://$TARGET_SERVER:$TARGET_PORT/api/datasources" | \
        python3 -m json.tool 2>/dev/null || echo "API调用失败"
    echo ""
    
    # 测试datasets API
    echo "测试 /api/datasets:"
    curl -s -H "Authorization: Bearer $TOKEN" \
        "http://$TARGET_SERVER:$TARGET_PORT/api/datasets" | \
        python3 -m json.tool 2>/dev/null || echo "API调用失败"
    echo ""
    
    echo "=== Token信息 ==="
    echo "Bearer Token: $TOKEN"
    echo ""
    echo "使用示例:"
    echo "curl -H \"Authorization: Bearer $TOKEN\" http://$TARGET_SERVER:$TARGET_PORT/api/datasources"
    echo "curl -H \"Authorization: Bearer $TOKEN\" http://$TARGET_SERVER:$TARGET_PORT/api/datasets"
    
else
    echo "❌ 登录失败或token获取失败"
    echo ""
    echo "可能的原因:"
    echo "1. 服务未启动"
    echo "2. 认证API有问题"
    echo "3. 用户名密码不正确"
    echo ""
    echo "请检查服务状态:"
    echo "ssh $TARGET_SERVER 'cd /data/smart-bi && docker compose ps'"
    echo "ssh $TARGET_SERVER 'cd /data/smart-bi && docker compose logs smart-bi-app'"
fi

echo ""
echo "=== 其他可用账户 ==="
echo "管理员: admin@smartbi.com / admin123"
echo "普通用户: user@smartbi.com / user123"  
echo "观察者: viewer@smartbi.com / viewer123"