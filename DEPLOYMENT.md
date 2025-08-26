# Smart-BI Docker部署指南

## 概述

本文档介绍如何使用Docker将Smart-BI部署到生产服务器。

## 部署架构

- **应用端口**: 3002 (避免与现有3000端口冲突)
- **MongoDB端口**: 27018 (避免与现有27017端口冲突) 
- **Redis端口**: 6380
- **MongoDB Express**: 8082
- **Nginx**: 80/443 (可选)

## 快速部署

### 1. 一键部署脚本

最简单的部署方式是使用提供的一键部署脚本：

```bash
# 运行部署脚本
./deploy.sh

# 或者强制部署（跳过确认）
./deploy.sh --force
```

### 2. 手动部署步骤

如果需要手动部署，请按以下步骤操作：

#### 2.1 服务器准备

确保目标服务器(192.168.63.50)具备以下条件：
- Docker已安装
- Docker Compose已安装
- SSH访问权限
- 足够的磁盘空间

#### 2.2 复制文件到服务器

```bash
# 创建目标目录
ssh 192.168.63.50 "sudo mkdir -p /data/smart-bi && sudo chown \$(whoami):\$(whoami) /data/smart-bi"

# 复制部署文件
scp -r . 192.168.63.50:/data/smart-bi/
```

#### 2.3 启动服务

```bash
ssh 192.168.63.50 "cd /data/smart-bi && docker compose up -d"
```

## 服务配置

### 环境变量

主要环境变量在`docker-compose.yml`中配置：

- `MONGODB_URI`: MongoDB连接字符串
- `REDIS_URL`: Redis连接字符串
- `JWT_SECRET`: JWT加密密钥
- `PORT`: 应用端口 (3002)

### 数据持久化

以下数据将持久化存储：
- MongoDB数据: `mongodb_data` volume
- Redis数据: `redis_data` volume  
- 应用上传文件: `uploads_data` volume
- 日志文件: `logs_data` volume

## 访问服务

部署完成后，可以通过以下地址访问服务：

- **Smart-BI应用**: http://192.168.63.50:3002
- **MongoDB Express**: http://192.168.63.50:8082
- **Nginx代理** (如果启用): http://192.168.63.50

### 登录信息

#### Web界面登录
- 管理员: `admin@smartbi.com` / `admin123`
- 普通用户: `user@smartbi.com` / `user123`
- 观察者: `viewer@smartbi.com` / `viewer123`

#### API访问Token
如果需要直接调用API，可以获取JWT token：

```bash
# 获取管理员token
curl -X POST http://192.168.63.50:3002/api/auth/token

# 或使用登录接口
curl -X POST http://192.168.63.50:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartbi.com","password":"admin123"}'

# 使用token调用API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://192.168.63.50:3002/api/dashboards
```

#### MongoDB Express登录信息

- 用户名: `admin`
- 密码: `adminpassword`

## 管理命令

### 查看服务状态

```bash
ssh 192.168.63.50 "cd /data/smart-bi && docker compose ps"
```

### 查看应用日志

```bash
ssh 192.168.63.50 "cd /data/smart-bi && docker compose logs -f smart-bi-app"
```

### 重启服务

```bash
ssh 192.168.63.50 "cd /data/smart-bi && docker compose restart"
```

### 停止服务

```bash
ssh 192.168.63.50 "cd /data/smart-bi && docker compose down"
```

### 更新应用

```bash
ssh 192.168.63.50 "cd /data/smart-bi && docker compose down && docker compose build --no-cache && docker compose up -d"
```

## 监控和维护

### 健康检查

应用内置健康检查端点: `http://192.168.63.50:3002/api/health`

### 日志管理

日志文件位置：
- 应用日志: `docker compose logs smart-bi-app`
- MongoDB日志: `docker compose logs mongodb`
- Nginx日志: `/data/smart-bi/logs/`

### 备份

定期备份重要数据：

```bash
# 备份MongoDB
ssh 192.168.63.50 "docker exec smart-bi-mongodb mongodump --authenticationDatabase admin -u admin -p 'adminpassword' --db smartbi --out /tmp/backup"

# 复制备份到本地
scp -r 192.168.63.50:/tmp/backup ./mongodb-backup-$(date +%Y%m%d)
```

## 故障排查

### 常见问题

1. **端口冲突**
   - 确认3002, 27018, 6380, 8082端口未被占用
   - 修改docker-compose.yml中的端口映射

2. **Docker镜像拉取超时/Alpine包管理器慢**
   - 症状: `dial tcp xxx:443: i/o timeout` 或 `fetch https://dl-cdn.alpinelinux.org` 很慢
   - 解决方案: 已自动配置国内镜像源
     - Docker Hub镜像源: 阿里云、中科大等
     - Alpine软件源: 阿里云镜像
     - NPM镜像源: npmmirror.com
   ```bash
   # 自动配置 (deploy.sh会自动执行)
   ./configure-docker-mirrors.sh
   
   # 手动配置
   sudo mkdir -p /etc/docker
   sudo tee /etc/docker/daemon.json <<EOF
   {
     "registry-mirrors": [
       "https://docker.m.daocloud.io",
       "https://dockerproxy.com",
       "https://docker.mirrors.ustc.edu.cn"
     ]
   }
   EOF
   sudo systemctl restart docker
   ```

3. **服务启动失败**
   - 检查Docker服务状态: `docker --version`
   - 检查磁盘空间: `df -h`
   - 查看容器日志: `docker compose logs`

4. **数据库连接失败**
   - 确认MongoDB容器正常运行
   - 检查环境变量配置
   - 验证数据库认证信息

### 调试命令

```bash
# 进入应用容器
ssh 192.168.63.50 "docker exec -it smart-bi-app sh"

# 进入MongoDB容器
ssh 192.168.63.50 "docker exec -it smart-bi-mongodb mongosh"

# 查看网络配置
ssh 192.168.63.50 "docker network ls && docker network inspect smart-bi_smart-bi-network"
```

## 安全考虑

1. **密码安全**: 修改默认密码
2. **防火墙**: 配置适当的防火墙规则
3. **SSL/TLS**: 在生产环境中启用HTTPS
4. **定期更新**: 保持Docker镜像和系统更新

## 性能优化

1. **资源限制**: 在docker-compose.yml中设置适当的资源限制
2. **缓存优化**: 配置Redis缓存
3. **数据库优化**: 定期清理和索引优化
4. **Nginx代理**: 启用Nginx进行负载均衡和静态文件服务