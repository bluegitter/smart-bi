#!/bin/bash

# 手动配置Docker镜像源脚本
# 如果deploy.sh自动配置失败，可以手动运行此脚本

TARGET_SERVER="192.168.63.50"

echo "配置Docker镜像源到服务器 $TARGET_SERVER"

# 创建daemon.json内容
DAEMON_CONFIG='{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com", 
    "https://docker.mirrors.ustc.edu.cn",
    "https://reg-mirror.qiniu.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "features": {
    "buildkit": true
  }
}'

echo "正在配置Docker镜像源..."

ssh "$TARGET_SERVER" "
    # 备份现有配置
    if [ -f /etc/docker/daemon.json ]; then
        echo '备份现有Docker配置...'
        sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # 创建docker目录
    sudo mkdir -p /etc/docker
    
    # 写入新配置
    echo '$DAEMON_CONFIG' | sudo tee /etc/docker/daemon.json
    
    # 设置权限
    sudo chown root:root /etc/docker/daemon.json
    sudo chmod 644 /etc/docker/daemon.json
    
    # 重启Docker服务
    echo '重启Docker服务...'
    sudo systemctl restart docker
    
    # 等待服务重启
    sleep 10
    
    # 验证配置
    echo '验证Docker服务状态...'
    sudo systemctl status docker --no-pager -l
    
    # 显示配置信息
    echo '当前Docker镜像源配置:'
    docker info | grep -A 10 'Registry Mirrors' || echo '无镜像源配置显示'
"

echo "Docker镜像源配置完成!"
echo "现在可以尝试重新运行部署: ./deploy.sh"