-- 创建测试数据库
CREATE DATABASE IF NOT EXISTS smart_bi_test DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE smart_bi_test;

-- 创建销售数据表
CREATE TABLE IF NOT EXISTS sales_data (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID，自增',
    date DATE NOT NULL COMMENT '销售日期',
    product_name VARCHAR(100) NOT NULL COMMENT '产品名称',
    category VARCHAR(50) NOT NULL COMMENT '产品类别',
    region VARCHAR(50) NOT NULL COMMENT '销售区域',
    sales_amount DECIMAL(10,2) NOT NULL COMMENT '销售金额（元）',
    quantity INT NOT NULL COMMENT '销售数量',
    customer_count INT NOT NULL COMMENT '购买客户数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间'
) COMMENT='销售数据表，记录每日各产品的销售情况';

-- 创建用户行为数据表
CREATE TABLE IF NOT EXISTS user_behavior (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID，自增',
    user_id VARCHAR(50) NOT NULL COMMENT '用户唯一标识',
    action_type VARCHAR(50) NOT NULL COMMENT '行为类型（如page_view、click、search等）',
    page_url VARCHAR(200) COMMENT '访问的页面URL',
    duration_seconds INT COMMENT '停留时长（秒）',
    device_type VARCHAR(20) COMMENT '设备类型（desktop、mobile、tablet）',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '行为发生时间'
) COMMENT='用户行为数据表，记录用户在网站的各种操作行为';

-- 创建财务数据表
CREATE TABLE IF NOT EXISTS financial_data (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID，自增',
    date DATE NOT NULL COMMENT '财务数据日期',
    revenue DECIMAL(12,2) NOT NULL COMMENT '营收金额（元）',
    cost DECIMAL(12,2) NOT NULL COMMENT '成本金额（元）',
    profit DECIMAL(12,2) NOT NULL COMMENT '利润金额（元）',
    department VARCHAR(50) NOT NULL COMMENT '所属部门',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间'
) COMMENT='财务数据表，记录各部门的日常财务收支情况';

-- 插入销售测试数据
INSERT INTO sales_data (date, product_name, category, region, sales_amount, quantity, customer_count) VALUES
('2024-01-01', 'iPhone 15', '电子产品', '北京', 12000.00, 12, 10),
('2024-01-01', 'MacBook Pro', '电子产品', '北京', 25000.00, 10, 8),
('2024-01-01', 'Nike运动鞋', '服装', '上海', 800.00, 20, 18),
('2024-01-02', 'iPhone 15', '电子产品', '上海', 15000.00, 15, 12),
('2024-01-02', 'iPad Air', '电子产品', '深圳', 8000.00, 16, 14),
('2024-01-02', 'Adidas T恤', '服装', '广州', 300.00, 50, 45),
('2024-01-03', 'MacBook Pro', '电子产品', '北京', 30000.00, 12, 10),
('2024-01-03', 'Apple Watch', '电子产品', '上海', 3000.00, 10, 8),
('2024-01-03', '联想笔记本', '电子产品', '深圳', 6000.00, 8, 7),
('2024-01-04', 'Samsung手机', '电子产品', '广州', 4500.00, 9, 8),
('2024-01-04', 'Nike运动鞋', '服装', '北京', 1200.00, 15, 12),
('2024-01-05', 'iPad Air', '电子产品', '上海', 12000.00, 24, 20),
('2024-01-05', 'Adidas运动鞋', '服装', '深圳', 900.00, 18, 16),
('2024-01-06', 'iPhone 15', '电子产品', '广州', 18000.00, 18, 15),
('2024-01-06', 'MacBook Air', '电子产品', '北京', 16000.00, 16, 12),
('2024-01-07', 'Apple Watch', '电子产品', '上海', 4500.00, 15, 12),
('2024-01-07', 'Puma T恤', '服装', '深圳', 400.00, 40, 35),
('2024-01-08', 'Samsung平板', '电子产品', '广州', 3200.00, 8, 6),
('2024-01-08', 'Nike运动鞋', '服装', '北京', 1600.00, 20, 18),
('2024-01-09', 'iPad Pro', '电子产品', '上海', 9000.00, 9, 8),
('2024-01-09', '联想台式机', '电子产品', '深圳', 4800.00, 6, 5),
('2024-01-10', 'MacBook Pro', '电子产品', '广州', 35000.00, 14, 12);

-- 插入用户行为测试数据
INSERT INTO user_behavior (user_id, action_type, page_url, duration_seconds, device_type) VALUES
('user_001', 'page_view', '/home', 120, 'desktop'),
('user_001', 'click', '/products/iphone', 45, 'desktop'),
('user_002', 'page_view', '/home', 80, 'mobile'),
('user_002', 'search', '/search?q=macbook', 25, 'mobile'),
('user_003', 'page_view', '/categories/electronics', 200, 'tablet'),
('user_003', 'add_to_cart', '/products/ipad', 15, 'tablet'),
('user_004', 'page_view', '/home', 90, 'desktop'),
('user_004', 'checkout', '/checkout', 300, 'desktop'),
('user_005', 'page_view', '/products/nike-shoes', 150, 'mobile'),
('user_005', 'add_to_cart', '/products/nike-shoes', 20, 'mobile'),
('user_006', 'page_view', '/home', 60, 'desktop'),
('user_006', 'click', '/categories/clothing', 30, 'desktop'),
('user_007', 'search', '/search?q=apple', 35, 'mobile'),
('user_007', 'page_view', '/products/apple-watch', 180, 'mobile'),
('user_008', 'page_view', '/home', 100, 'tablet'),
('user_008', 'click', '/deals', 40, 'tablet'),
('user_009', 'page_view', '/categories/electronics', 220, 'desktop'),
('user_009', 'add_to_cart', '/products/macbook', 25, 'desktop'),
('user_010', 'page_view', '/home', 75, 'mobile'),
('user_010', 'search', '/search?q=samsung', 28, 'mobile');

-- 插入财务测试数据
INSERT INTO financial_data (date, revenue, cost, profit, department) VALUES
('2024-01-01', 120000.00, 80000.00, 40000.00, '销售部'),
('2024-01-01', 50000.00, 30000.00, 20000.00, '市场部'),
('2024-01-02', 150000.00, 95000.00, 55000.00, '销售部'),
('2024-01-02', 60000.00, 35000.00, 25000.00, '市场部'),
('2024-01-03', 180000.00, 110000.00, 70000.00, '销售部'),
('2024-01-03', 45000.00, 28000.00, 17000.00, '市场部'),
('2024-01-04', 135000.00, 85000.00, 50000.00, '销售部'),
('2024-01-04', 55000.00, 32000.00, 23000.00, '市场部'),
('2024-01-05', 160000.00, 100000.00, 60000.00, '销售部'),
('2024-01-05', 48000.00, 29000.00, 19000.00, '市场部'),
('2024-01-06', 200000.00, 125000.00, 75000.00, '销售部'),
('2024-01-06', 65000.00, 38000.00, 27000.00, '市场部'),
('2024-01-07', 175000.00, 108000.00, 67000.00, '销售部'),
('2024-01-07', 52000.00, 31000.00, 21000.00, '市场部'),
('2024-01-08', 145000.00, 90000.00, 55000.00, '销售部'),
('2024-01-08', 58000.00, 34000.00, 24000.00, '市场部'),
('2024-01-09', 165000.00, 102000.00, 63000.00, '销售部'),
('2024-01-09', 47000.00, 28500.00, 18500.00, '市场部'),
('2024-01-10', 190000.00, 118000.00, 72000.00, '销售部'),
('2024-01-10', 62000.00, 36000.00, 26000.00, '市场部');