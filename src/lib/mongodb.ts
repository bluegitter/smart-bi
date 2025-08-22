import { MongoClient, Db } from 'mongodb'
import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // 在开发环境中，使用全局变量以便热重载时保持连接
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // 在生产环境中，最好不要使用全局变量
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise
  const db = client.db('smartbi')
  return { client, db }
}

// Mongoose 连接状态
let isMongooseConnected = false

// 简化的连接函数，用于API路由
export async function connectDB(): Promise<void> {
  try {
    // 连接 MongoDB native driver
    await clientPromise
    
    // 连接 Mongoose
    if (!isMongooseConnected) {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri, {
          dbName: 'smartbi'
        })
        isMongooseConnected = true
        console.log('Mongoose connected to MongoDB')
      }
    }
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    throw error
  }
}

// 导出数据库连接promise以供其他模块使用
export default clientPromise

// 全局类型声明
declare global {
  var _mongoClientPromise: Promise<MongoClient>
}