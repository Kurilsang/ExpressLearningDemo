import { PrismaClient } from '../generated/prisma';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

// 数据库连接类
class PrismaService {
    private client: PrismaClient;

    constructor() {
        this.client = prisma;
    }

    // 获取Prisma客户端实例
    getClient(): PrismaClient {
        return this.client;
    }

    // 连接数据库
    async connect(): Promise<void> {
        try {
            await this.client.$connect();
            console.log('✅ Prisma 数据库连接成功');
        } catch (error: any) {
            console.error('❌ Prisma 数据库连接失败:', error.message);
            throw error;
        }
    }

    // 断开连接
    async disconnect(): Promise<void> {
        try {
            await this.client.$disconnect();
            console.log('🔌 Prisma 数据库连接已关闭');
        } catch (error: any) {
            console.error('❌ 断开数据库连接失败:', error.message);
            throw error;
        }
    }

    // 检查连接状态
    async isConnected(): Promise<boolean> {
        try {
            await this.client.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            return false;
        }
    }

    // 初始化数据库（运行迁移）
    async initDatabase(): Promise<void> {
        try {
            console.log('🔄 开始初始化数据库...');
            
            // 检查连接
            await this.connect();
            
            // 检查表是否存在，如果不存在则推送schema
            const tableExists = await this.client.$queryRaw`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() AND table_name = 'users'
            ` as any[];
            
            if (tableExists[0].count === 0) {
                console.log('📝 用户表不存在，需要推送数据库模式...');
                console.log('💡 请运行 "npx prisma db push" 来创建表结构');
            } else {
                console.log('✅ 用户表已存在');
            }
            
            console.log('✅ 数据库初始化完成');
        } catch (error: any) {
            console.error('❌ 数据库初始化失败:', error.message);
            throw error;
        }
    }

    // 用户相关操作
    user = {
        // 获取所有用户
        findMany: async (options?: {
            orderBy?: { createdAt?: 'asc' | 'desc' };
            take?: number;
            skip?: number;
        }) => {
            return this.client.user.findMany({
                orderBy: options?.orderBy || { createdAt: 'desc' },
                take: options?.take,
                skip: options?.skip,
            });
        },

        // 根据ID获取用户
        findUnique: async (id: number) => {
            return this.client.user.findUnique({
                where: { id },
            });
        },

        // 根据邮箱获取用户
        findByEmail: async (email: string) => {
            return this.client.user.findUnique({
                where: { email },
            });
        },

        // 创建用户
        create: async (data: {
            name: string;
            email: string;
            age?: number;
        }) => {
            return this.client.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    age: data.age || 0,
                },
            });
        },

        // 更新用户
        update: async (id: number, data: {
            name?: string;
            email?: string;
            age?: number;
        }) => {
            return this.client.user.update({
                where: { id },
                data,
            });
        },

        // 删除用户
        delete: async (id: number) => {
            return this.client.user.delete({
                where: { id },
            });
        },

        // 用户数量
        count: async () => {
            return this.client.user.count();
        },
    };
}

// 导出单例实例
const prismaService = new PrismaService();
export default prismaService;

// 也导出Prisma客户端，以防需要直接使用
export { prisma };
