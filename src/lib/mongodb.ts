import { MongoClient, Db } from 'mongodb'

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

// 导出数据库连接promise以供其他模块使用
export default clientPromise

// 全局类型声明
declare global {
  var _mongoClientPromise: Promise<MongoClient>
}