"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, '../../config/config.json'), 'utf8'));
class Database {
    constructor() {
        this.connection = null;
    }
    async connect() {
        try {
            this.connection = await promise_1.default.createConnection(config.database);
            console.log('✅ 数据库连接成功');
            return this.connection;
        }
        catch (error) {
            console.error('❌ 数据库连接失败:', error.message);
            throw error;
        }
    }
    async query(sql, params = []) {
        try {
            if (!this.connection) {
                await this.connect();
            }
            const [results] = await this.connection.execute(sql, params);
            return results;
        }
        catch (error) {
            console.error('❌ SQL查询失败:', error.message);
            throw error;
        }
    }
    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('🔌 数据库连接已关闭');
        }
    }
    async initDatabase() {
        try {
            console.log('🔄 开始初始化数据库...');
            const serverConnection = await promise_1.default.createConnection({
                host: config.database.host,
                port: config.database.port,
                user: config.database.user,
                password: config.database.password,
                charset: config.database.charset
            });
            const sqlFile = fs_1.default.readFileSync(path_1.default.join(__dirname, '../../init.sql'), 'utf8');
            const sqlStatements = sqlFile.split(';').filter(stmt => stmt.trim());
            console.log(`📝 执行 ${sqlStatements.length} 条SQL语句...`);
            for (const statement of sqlStatements) {
                if (statement.trim()) {
                    await serverConnection.execute(statement);
                }
            }
            await serverConnection.end();
            console.log('✅ 数据库初始化完成');
            await this.connect();
        }
        catch (error) {
            console.error('❌ 数据库初始化失败:', error.message);
            throw error;
        }
    }
    getConfig() {
        return config.database;
    }
    isConnected() {
        return this.connection !== null;
    }
}
const database = new Database();
exports.default = database;
