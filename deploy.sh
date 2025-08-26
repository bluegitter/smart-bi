#!/bin/bash

# Smart-BI Docker Deployment Script
# 部署到 192.168.63.50 服务器的 /data/smart-bi 目录

set -e  # Exit on any error

# Configuration
TARGET_SERVER="192.168.63.50"
TARGET_DIR="/data/smart-bi"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if SSH access is available
check_ssh_access() {
    log_info "检查SSH连接到 $TARGET_SERVER..."
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$TARGET_SERVER" exit 2>/dev/null; then
        log_error "无法连接到服务器 $TARGET_SERVER"
        log_error "请确保："
        echo "  1. SSH密钥已配置"
        echo "  2. 服务器地址正确"
        echo "  3. 网络连接正常"
        exit 1
    fi
    log_success "SSH连接成功"
}

# Check if Docker is available on target server
check_docker_on_server() {
    log_info "检查服务器Docker环境..."
    if ! ssh "$TARGET_SERVER" "docker --version && docker compose version" > /dev/null 2>&1; then
        log_error "服务器上未安装Docker或docker compose"
        exit 1
    fi
    log_success "服务器Docker环境正常"
}

# Configure Docker registry mirrors
configure_docker_registry() {
    log_info "配置Docker镜像源..."
    
    ssh "$TARGET_SERVER" "
        # Backup existing daemon.json if it exists
        if [ -f /etc/docker/daemon.json ]; then
            sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
        fi
        
        # Create docker directory if it doesn't exist
        sudo mkdir -p /etc/docker
    "
    
    # Copy daemon.json to server
    scp "$SCRIPT_DIR/docker/daemon.json" "$TARGET_SERVER:/tmp/daemon.json"
    
    ssh "$TARGET_SERVER" "
        # Move daemon.json to proper location
        sudo mv /tmp/daemon.json /etc/docker/daemon.json
        sudo chown root:root /etc/docker/daemon.json
        sudo chmod 644 /etc/docker/daemon.json
        
        # Restart Docker daemon
        sudo systemctl restart docker
        
        # Wait for Docker to restart
        sleep 5
        
        # Verify Docker is running
        docker --version
    "
    
    log_success "Docker镜像源配置完成"
}

# Create directory structure on server
create_server_directories() {
    log_info "在服务器上创建目录结构..."
    ssh "$TARGET_SERVER" "
        sudo mkdir -p $TARGET_DIR
        sudo mkdir -p $TARGET_DIR/nginx
        sudo mkdir -p $TARGET_DIR/scripts
        sudo mkdir -p $TARGET_DIR/logs
        sudo chown -R \$(whoami):\$(whoami) $TARGET_DIR
    "
    log_success "目录结构创建完成"
}

# Copy files to server
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

# Create MongoDB init script
create_mongo_init_script() {
    log_info "创建MongoDB初始化脚本..."
    
    cat > /tmp/init-db.js << 'EOF'
// MongoDB initialization script for Smart-BI
print('开始初始化Smart-BI数据库...');

// Switch to smartbi database
db = db.getSiblingDB('smartbi');

// Create collections if they don't exist
db.createCollection('users');
db.createCollection('dashboards');
db.createCollection('datasets');
db.createCollection('datasources');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.dashboards.createIndex({ "userId": 1 });
db.dashboards.createIndex({ "createdAt": 1 });
db.datasets.createIndex({ "userId": 1 });
db.datasets.createIndex({ "datasourceId": 1 });
db.datasources.createIndex({ "userId": 1 });

print('Smart-BI数据库初始化完成');
EOF

    scp "/tmp/init-db.js" "$TARGET_SERVER:$TARGET_DIR/scripts/"
    rm "/tmp/init-db.js"
    
    log_success "MongoDB初始化脚本创建完成"
}

# Create environment file
create_env_file() {
    log_info "创建环境配置文件..."
    
    cat > /tmp/.env.production << 'EOF'
# Production Environment Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Application
PORT=3002

# Database
MONGODB_URI=mongodb://admin:adminpassword@mongodb:27017/smartbi?authSource=admin
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=SmartBI_JWT_Secret_2024_Production_Key

# MySQL (if needed)
MYSQL_HOST=host.docker.internal
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=smart_bi_test
MYSQL_PORT=3306

# OpenAI (optional)
# OPENAI_API_KEY=your_openai_api_key
# OPENAI_API_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-3.5-turbo
EOF

    scp "/tmp/.env.production" "$TARGET_SERVER:$TARGET_DIR/"
    rm "/tmp/.env.production"
    
    log_success "环境配置文件创建完成"
}

# Stop existing services
stop_existing_services() {
    log_info "停止现有服务..."
    ssh "$TARGET_SERVER" "
        cd $TARGET_DIR
        if [ -f docker-compose.yml ]; then
            docker compose down --remove-orphans || true
        fi
        # Clean up any orphaned containers
        docker container prune -f || true
    " || true
    log_success "现有服务已停止"
}

# Build and start services
start_services() {
    log_info "构建并启动Smart-BI服务..."
    ssh "$TARGET_SERVER" "
        cd $TARGET_DIR
        
        # Build and start services
        docker compose build --no-cache
        docker compose up -d
        
        # Wait for services to be ready
        echo '等待服务启动...'
        sleep 30
        
        # Check service health
        docker compose ps
    "
    log_success "服务启动完成"
}

# Verify deployment
verify_deployment() {
    log_info "验证部署状态..."
    
    ssh "$TARGET_SERVER" "
        cd $TARGET_DIR
        
        # Check container status
        echo '=== 容器状态 ==='
        docker compose ps
        
        # Check logs
        echo '=== 应用日志 (最后20行) ==='
        docker compose logs --tail=20 smart-bi-app
        
        # Test health endpoint
        echo '=== 健康检查 ==='
        sleep 5
        docker exec smart-bi-app curl -f http://localhost:3002/api/health || echo '健康检查失败'
    "
    
    log_success "部署验证完成"
}

# Display deployment information
show_deployment_info() {
    log_success "Smart-BI部署完成!"
    echo ""
    echo "=== 部署信息 ==="
    echo "服务器: $TARGET_SERVER"
    echo "部署目录: $TARGET_DIR"
    echo ""
    echo "=== 服务端口 ==="
    echo "Smart-BI应用: http://$TARGET_SERVER:3002"
    echo "MongoDB: $TARGET_SERVER:27018"
    echo "Redis: $TARGET_SERVER:6380"
    echo "MongoDB Express: http://$TARGET_SERVER:8082"
    echo "Nginx (如果启用): http://$TARGET_SERVER"
    echo ""
    echo "=== 管理命令 ==="
    echo "查看服务状态: ssh $TARGET_SERVER 'cd $TARGET_DIR && docker compose ps'"
    echo "查看应用日志: ssh $TARGET_SERVER 'cd $TARGET_DIR && docker compose logs -f smart-bi-app'"
    echo "重启服务: ssh $TARGET_SERVER 'cd $TARGET_DIR && docker compose restart'"
    echo "停止服务: ssh $TARGET_SERVER 'cd $TARGET_DIR && docker compose down'"
    echo ""
    echo "=== 数据库连接信息 ==="
    echo "MongoDB连接字符串: mongodb://admin:SmartBI@2024!@$TARGET_SERVER:27018/smartbi?authSource=admin"
    echo "MongoDB Express: http://$TARGET_SERVER:8082 (用户名: admin, 密码: SmartBI@2024!)"
}

# Main deployment function
main() {
    log_info "开始Smart-BI Docker部署..."
    
    check_ssh_access
    check_docker_on_server
    configure_docker_registry
    create_server_directories
    copy_files_to_server
    create_mongo_init_script
    create_env_file
    stop_existing_services
    start_services
    verify_deployment
    show_deployment_info
}

# Run deployment
if [ "$1" == "--force" ]; then
    log_warning "强制部署模式，跳过确认..."
    main
else
    echo "即将部署Smart-BI到服务器 $TARGET_SERVER"
    echo "部署目录: $TARGET_DIR"
    echo ""
    read -p "确认继续部署? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        main
    else
        log_info "部署已取消"
        exit 0
    fi
fi