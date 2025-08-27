#!/bin/bash



TARGET_SERVER="192.168.63.50"
TARGET_DIR="/data/smart-bi"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 快速重新部署应用脚本
copy_files_to_server() {
    log_info "复制部署文件到服务器..."
    
    # Copy main files
    scp "$SCRIPT_DIR/docker-compose.yml" "$TARGET_SERVER:$TARGET_DIR/"
    scp "$SCRIPT_DIR/Dockerfile" "$TARGET_SERVER:$TARGET_DIR/"
    scp "$SCRIPT_DIR/next.config.ts" "$TARGET_SERVER:$TARGET_DIR/"
    scp "$SCRIPT_DIR/package.json" "$TARGET_SERVER:$TARGET_DIR/"
    scp "$SCRIPT_DIR/package-lock.json" "$TARGET_SERVER:$TARGET_DIR/"
    
    # Copy nginx config
    scp "$SCRIPT_DIR/nginx/nginx.conf" "$TARGET_SERVER:$TARGET_DIR/nginx/"
    
    # Copy source code
    log_info "复制源代码..."
    rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
          "$SCRIPT_DIR/src" "$TARGET_SERVER:$TARGET_DIR/"
    rsync -avz "$SCRIPT_DIR/public" "$TARGET_SERVER:$TARGET_DIR/"
    
    # Copy additional config files
    if [ -f "$SCRIPT_DIR/tailwind.config.ts" ]; then
        scp "$SCRIPT_DIR/tailwind.config.ts" "$TARGET_SERVER:$TARGET_DIR/"
    fi
    if [ -f "$SCRIPT_DIR/tsconfig.json" ]; then
        scp "$SCRIPT_DIR/tsconfig.json" "$TARGET_SERVER:$TARGET_DIR/"
    fi
    if [ -f "$SCRIPT_DIR/postcss.config.mjs" ]; then
        scp "$SCRIPT_DIR/postcss.config.mjs" "$TARGET_SERVER:$TARGET_DIR/"
    fi
    
    log_success "文件复制完成"
}

echo "=== 快速重新部署Smart-BI应用 ==="

# 复制更新的文件到服务器
echo "1. 复制更新的文件..."
copy_files_to_server

# 重新构建并启动应用
echo "2. 重新构建应用..."
ssh "$TARGET_SERVER" "
    cd $TARGET_DIR
    
    # 停止应用
    docker compose stop smart-bi-app
    
    # 删除旧容器
    docker compose rm -f smart-bi-app
    docker rmi $(docker images -f "dangling=true" -q)

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