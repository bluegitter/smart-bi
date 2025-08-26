#!/bin/bash

# JWT调试脚本 - 检查容器中的JWT配置

TARGET_SERVER="192.168.63.50"
TARGET_DIR="/data/smart-bi"

echo "=== 检查容器环境变量 ==="
ssh "$TARGET_SERVER" "
    cd $TARGET_DIR
    echo 'JWT_SECRET in container:'
    docker exec smart-bi-app env | grep JWT_SECRET || echo 'JWT_SECRET not found'
    
    echo 'NODE_ENV in container:'
    docker exec smart-bi-app env | grep NODE_ENV || echo 'NODE_ENV not found'
    
    echo 'All environment variables:'
    docker exec smart-bi-app env | grep -E '(JWT|NODE_ENV|MONGODB|REDIS)'
"

echo ""
echo "=== 测试JWT生成 ==="
ssh "$TARGET_SERVER" "
    cd $TARGET_DIR
    echo 'Testing JWT token generation...'
    docker exec smart-bi-app node -e \"
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'fallback-secret';
        console.log('JWT_SECRET:', secret.substring(0, 10) + '...');
        
        try {
            const token = jwt.sign({ userId: '123', email: 'test@example.com' }, secret, { expiresIn: '1h' });
            console.log('Generated token:', token.substring(0, 50) + '...');
            
            const decoded = jwt.verify(token, secret);
            console.log('Token verification successful:', decoded);
        } catch (error) {
            console.error('JWT test failed:', error.message);
        }
    \"
"

echo ""
echo "=== 检查应用健康 ==="
ssh "$TARGET_SERVER" "
    cd $TARGET_DIR
    echo 'Testing health endpoint...'
    docker exec smart-bi-app curl -s http://localhost:3002/api/health || echo 'Health check failed'
"