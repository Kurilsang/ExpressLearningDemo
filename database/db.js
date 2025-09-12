const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 读取配置文件
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/config.json'), 'utf8'));

class Database {
    constructor() {
        this.connection = null;
    }

    // 连接数据库
    async connect() {
        try {
            this.connection = await mysql.createConnection(config.database);
            console.log('数据库连接成功');
            return this.connection;
        } catch (error) {
            console.error('数据库连接失败:', error.message);
            throw error;
        }
    }

    // 执行SQL查询
    async query(sql, params = []) {
        try {
            if (!this.connection) {
                await this.connect();
            }
            const [results] = await this.connection.execute(sql, params);
            return results;
        } catch (error) {
            console.error('SQL查询失败:', error.message);
            throw error;
        }
    }

    // 关闭连接
    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('数据库连接已关闭');
        }
    }

    // 初始化数据库（执行SQL文件）
    async initDatabase() {
        try {
            // 先连接MySQL服务器（不指定数据库）
            const serverConnection = await mysql.createConnection({
                host: config.database.host,
                port: config.database.port,
                user: config.database.user,
                password: config.database.password,
                charset: config.database.charset
            });

            // 读取并执行SQL文件
            const sqlFile = fs.readFileSync(path.join(__dirname, '../init.sql'), 'utf8');
            const sqlStatements = sqlFile.split(';').filter(stmt => stmt.trim());
            
            for (const statement of sqlStatements) {
                if (statement.trim()) {
                    await serverConnection.execute(statement);
                }
            }
            
            await serverConnection.end();
            console.log('数据库初始化完成');
            
            // 重新连接到指定数据库
            await this.connect();
        } catch (error) {
            console.error('数据库初始化失败:', error.message);
            throw error;
        }
    }
}

module.exports = new Database();
