#!/bin/bash

# MongoDB认证修复脚本

TARGET_SERVER="192.168.63.50"
TARGET_DIR="/data/smart-bi"

echo "=== 修复MongoDB认证问题 ==="

echo "方法1: 重新创建MongoDB容器（推荐）"
echo "这将删除现有数据，如果有重要数据请先备份"
read -p "是否重新创建MongoDB容器? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh "$TARGET_SERVER" "
        cd $TARGET_DIR
        echo '停止并删除MongoDB容器...'
        docker compose stop mongodb
        docker compose rm -f mongodb
        
        echo '删除MongoDB数据卷（这会清除所有数据）...'
        docker volume rm smart-bi_mongodb_data || true
        
        echo '重新启动MongoDB容器...'
        docker compose up -d mongodb
        
        echo '等待MongoDB启动...'
        sleep 20
        
        echo '检查MongoDB容器状态...'
        docker compose ps mongodb
        
        echo '检查MongoDB日志...'
        docker compose logs --tail=10 mongodb
        
        echo '重启应用容器...'
        docker compose restart smart-bi-app
    "
else
    echo ""
    echo "方法2: 在现有容器中更改密码"
    echo "这将保留现有数据"
    
    ssh "$TARGET_SERVER" "
        cd $TARGET_DIR
        echo '连接到MongoDB容器并更改密码...'
        docker exec -it smart-bi-mongodb mongosh -u admin -p --eval \"
            use admin;
            db.changeUserPassword('admin', 'adminpassword');
            print('密码更改完成');
        \"
        
        echo '重启应用容器...'
        docker compose restart smart-bi-app
    "
fi

echo ""
echo "=== 验证连接 ==="
ssh "$TARGET_SERVER" "
    cd $TARGET_DIR
    echo '测试MongoDB连接...'
    docker exec smart-bi-mongodb mongosh 'mongodb://admin:adminpassword@localhost:27017/smartbi?authSource=admin' --eval 'db.runCommand({ ping: 1 })'
    
    echo '检查应用日志...'
    docker compose logs --tail=10 smart-bi-app
"

echo "修复完成！"