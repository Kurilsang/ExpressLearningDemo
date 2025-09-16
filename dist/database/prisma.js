"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
exports.prisma = prisma;
class PrismaService {
    constructor() {
        this.user = {
            findMany: async (options) => {
                return this.client.user.findMany({
                    orderBy: options?.orderBy || { createdAt: 'desc' },
                    take: options?.take,
                    skip: options?.skip,
                });
            },
            findUnique: async (id) => {
                return this.client.user.findUnique({
                    where: { id },
                });
            },
            findByEmail: async (email) => {
                return this.client.user.findUnique({
                    where: { email },
                });
            },
            create: async (data) => {
                return this.client.user.create({
                    data: {
                        name: data.name,
                        email: data.email,
                        age: data.age || 0,
                    },
                });
            },
            update: async (id, data) => {
                return this.client.user.update({
                    where: { id },
                    data,
                });
            },
            delete: async (id) => {
                return this.client.user.delete({
                    where: { id },
                });
            },
            count: async () => {
                return this.client.user.count();
            },
        };
        this.client = prisma;
    }
    getClient() {
        return this.client;
    }
    async connect() {
        try {
            await this.client.$connect();
            console.log('✅ Prisma 数据库连接成功');
        }
        catch (error) {
            console.error('❌ Prisma 数据库连接失败:', error.message);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.client.$disconnect();
            console.log('🔌 Prisma 数据库连接已关闭');
        }
        catch (error) {
            console.error('❌ 断开数据库连接失败:', error.message);
            throw error;
        }
    }
    async isConnected() {
        try {
            await this.client.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async initDatabase() {
        try {
            console.log('🔄 开始初始化数据库...');
            await this.connect();
            const tableExists = await this.client.$queryRaw `
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() AND table_name = 'users'
            `;
            if (tableExists[0].count === 0) {
                console.log('📝 用户表不存在，需要推送数据库模式...');
                console.log('💡 请运行 "npx prisma db push" 来创建表结构');
            }
            else {
                console.log('✅ 用户表已存在');
            }
            console.log('✅ 数据库初始化完成');
        }
        catch (error) {
            console.error('❌ 数据库初始化失败:', error.message);
            throw error;
        }
    }
}
const prismaService = new PrismaService();
exports.default = prismaService;
