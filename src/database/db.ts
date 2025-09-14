import mysql, { Connection, RowDataPacket, OkPacket } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// 数据库配置类型
interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    charset: string;
}

interface Config {
    database: DatabaseConfig;
    server: {
        port: number;
    };
}

// 读取配置文件
const config: Config = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../config/config.json'), 'utf8')
);

class Database {
    private connection: Connection | null = null;

    // 连接数据库
    async connect(): Promise<Connection> {
        try {
            this.connection = await mysql.createConnection(config.database);
            console.log('✅ 数据库连接成功');
            return this.connection;
        } catch (error: any) {
            console.error('❌ 数据库连接失败:', error.message);
            throw error;
        }
    }

    // 执行SQL查询
    async query(sql: string, params: any[] = []): Promise<RowDataPacket[] | OkPacket> {
        try {
            if (!this.connection) {
                await this.connect();
            }
            const [results] = await this.connection!.execute(sql, params);
            return results as RowDataPacket[] | OkPacket;
        } catch (error: any) {
            console.error('❌ SQL查询失败:', error.message);
            throw error;
        }
    }

    // 关闭连接
    async close(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            console.log('🔌 数据库连接已关闭');
        }
    }

    // 初始化数据库（执行SQL文件）
    async initDatabase(): Promise<void> {
        try {
            console.log('🔄 开始初始化数据库...');
            
            // 先连接MySQL服务器（不指定数据库）
            const serverConnection = await mysql.createConnection({
                host: config.database.host,
                port: config.database.port,
                user: config.database.user,
                password: config.database.password,
                charset: config.database.charset
            });

            // 读取并执行SQL文件
            const sqlFile = fs.readFileSync(path.join(__dirname, '../../init.sql'), 'utf8');
            const sqlStatements = sqlFile.split(';').filter(stmt => stmt.trim());
            
            console.log(`📝 执行 ${sqlStatements.length} 条SQL语句...`);
            
            for (const statement of sqlStatements) {
                if (statement.trim()) {
                    await serverConnection.execute(statement);
                }
            }
            
            await serverConnection.end();
            console.log('✅ 数据库初始化完成');
            
            // 重新连接到指定数据库
            await this.connect();
        } catch (error: any) {
            console.error('❌ 数据库初始化失败:', error.message);
            throw error;
        }
    }

    // 获取数据库配置信息
    getConfig(): DatabaseConfig {
        return config.database;
    }

    // 检查连接状态
    isConnected(): boolean {
        return this.connection !== null;
    }
}

// 导出单例实例
const database = new Database();
export default database;
