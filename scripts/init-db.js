const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function initDatabase() {
  // 连接配置
  const config = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    multipleStatements: true
  }

  try {
    console.log('连接MySQL服务器...')
    const connection = await mysql.createConnection(config)
    
    console.log('读取SQL脚本...')
    const sqlScript = fs.readFileSync(path.join(__dirname, 'create_test_db.sql'), 'utf8')
    
    console.log('执行SQL脚本...')
    await connection.query(sqlScript)
    
    console.log('验证数据...')
    await connection.query('USE smart_bi_test')
    
    // 检查表是否创建成功
    const [tables] = await connection.query('SHOW TABLES')
    console.log('创建的表:', tables.map(t => Object.values(t)[0]))
    
    // 检查数据是否插入成功
    const [salesData] = await connection.query('SELECT COUNT(*) as count FROM sales_data')
    const [userData] = await connection.query('SELECT COUNT(*) as count FROM user_behavior')
    const [financialData] = await connection.query('SELECT COUNT(*) as count FROM financial_data')
    
    console.log(`销售数据: ${salesData[0].count} 条`)
    console.log(`用户行为数据: ${userData[0].count} 条`)
    console.log(`财务数据: ${financialData[0].count} 条`)
    
    await connection.end()
    console.log('数据库初始化完成!')
    
  } catch (error) {
    console.error('数据库初始化失败:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n请确保MySQL服务已启动:')
      console.log('- macOS: brew services start mysql')
      console.log('- Windows: net start mysql')
      console.log('- Linux: sudo systemctl start mysql')
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n请检查MySQL用户名和密码是否正确')
      console.log('默认配置: localhost:3306, root/root')
    }
    
    process.exit(1)
  }
}

// 运行初始化
initDatabase()