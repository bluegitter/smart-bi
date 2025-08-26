#!/bin/bash

# 简单重置MongoDB容器脚本

TARGET_SERVER="192.168.63.50"
TARGET_DIR="/data/smart-bi"

echo "=== 重置MongoDB容器 ==="
echo "警告: 这将删除所有现有数据库数据"
echo "如果有重要数据，请先运行备份命令："
echo "docker exec smart-bi-mongodb mongodump --authenticationDatabase admin -u admin -p [old_password] --db smartbi --out /tmp/backup"
echo ""

read -p "确认要继续重置MongoDB吗? (输入 'yes' 确认): " confirm

if [ "$confirm" = "yes" ]; then
    echo "开始重置MongoDB容器..."
    
    ssh "$TARGET_SERVER" "
        cd $TARGET_DIR
        
        # 停止所有服务
        echo '1. 停止所有服务...'
        docker compose down
        
        # 删除MongoDB数据卷
        echo '2. 删除MongoDB数据卷...'
        docker volume rm smart-bi_mongodb_data 2>/dev/null || true
        
        # 重新启动服务
        echo '3. 重新启动所有服务...'
        docker compose up -d
        
        # 等待服务启动
        echo '4. 等待服务启动...'
        sleep 30
        
        # 检查服务状态
        echo '5. 检查服务状态...'
        docker compose ps
        
        # 测试连接
        echo '6. 测试MongoDB连接...'
        docker exec smart-bi-mongodb mongosh 'mongodb://admin:adminpassword@localhost:27017/smartbi?authSource=admin' --eval 'print(\"连接成功!\"); db.runCommand({ ping: 1 })'
        
        # 检查应用日志
        echo '7. 检查应用日志...'
        docker compose logs --tail=20 smart-bi-app
    "
    
    echo ""
    echo "✅ MongoDB重置完成!"
    echo "新的连接信息:"
    echo "- 用户名: admin"
    echo "- 密码: adminpassword"
    echo "- 连接字符串: mongodb://admin:adminpassword@192.168.63.50:27018/smartbi?authSource=admin"
    
else
    echo "操作已取消"
fi