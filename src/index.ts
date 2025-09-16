// 加载环境变量
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import prismaService from './database/prisma';
import userRoutes from './routes/userRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('public'));

// CORS中间件
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// 首页路由
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: '欢迎使用Node.js Express MySQL CRUD + LangChain.js API (TypeScript)',
        endpoints: {
            database: {
                'POST /init': '初始化数据库',
                'GET /db/status': '数据库状态检查'
            },
            users: {
                'GET /users': '获取所有用户',
                'GET /users/:id': '根据ID获取用户',
                'POST /users': '创建用户',
                'PUT /users/:id': '更新用户',
                'DELETE /users/:id': '删除用户'
            },
            ai: {
                'GET /ai': '获取AI功能列表',
                'POST /ai/chat': 'AI对话功能(支持上下文)',
                'POST /ai/summarize': '文本摘要功能',
                'GET /ai/config': 'LangChain配置信息'
            },
            frontend: {
                'GET /chat': 'AI对话调试页面',
                'GET /chat.html': 'AI对话调试页面(备选)'
            }
        },
        note: 'AI功能需要配置相应的API密钥',
        tech: 'TypeScript + Express + LangChain.js'
    });
});

// 聊天页面路由
app.get('/chat', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 聊天页面路由(备选)
app.get('/chat.html', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 初始化数据库路由
app.post('/init', async (req: Request, res: Response) => {
    try {
        await prismaService.initDatabase();
        const connected = await prismaService.isConnected();
        res.json({ 
            success: true, 
            message: '数据库初始化成功',
            connected: connected,
            note: '如果用户表不存在，请运行 "npx prisma db push" 来创建表结构'
        });
    } catch (error: any) {
        const connected = await prismaService.isConnected();
        res.status(500).json({ 
            success: false, 
            message: '数据库初始化失败: ' + error.message,
            connected: connected
        });
    }
});

// 数据库状态检查路由
app.get('/db/status', async (req: Request, res: Response) => {
    try {
        const connected = await prismaService.isConnected();
        res.json({
            success: true,
            data: {
                connected: connected,
                provider: 'mysql',
                orm: 'prisma'
            },
            message: '数据库状态检查完成'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: {
                connected: false,
                provider: 'mysql',
                orm: 'prisma'
            },
            message: '数据库状态检查失败: ' + error.message
        });
    }
});

// 用户路由
app.use('/users', userRoutes);

// AI路由 (LangChain.js)
app.use('/ai', aiRoutes);

// 404 处理
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ 
        success: false, 
        message: '接口不存在' 
    });
});

// 全局错误处理中间件
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('服务器错误:', error);
    res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
    });
});

// 启动服务器
async function startServer(): Promise<void> {
    try {
        // 连接数据库
        await prismaService.connect();
        
        const PORT: number = parseInt(process.env.PORT || '3000');
        app.listen(PORT, () => {
            console.log(`🚀 TypeScript服务器运行在 http://localhost:${PORT}`);
            console.log('📋 API端点:');
            console.log('📊 数据库相关 (Prisma ORM):');
            console.log('  GET    /              - 首页信息');
            console.log('  POST   /init          - 初始化数据库');
            console.log('  GET    /db/status     - 数据库状态检查');
            console.log('👥 用户管理:');
            console.log('  GET    /users         - 获取所有用户');
            console.log('  GET    /users/:id     - 根据ID获取用户');
            console.log('  POST   /users         - 创建用户');
            console.log('  PUT    /users/:id     - 更新用户');
            console.log('  DELETE /users/:id     - 删除用户');
            console.log('🤖 AI功能 (LangChain.js):');
            console.log('  GET    /ai            - AI功能列表');
            console.log('  POST   /ai/chat       - AI对话(支持上下文)');
            console.log('  POST   /ai/summarize  - 文本摘要');
            console.log('  GET    /ai/config     - 配置信息');
            console.log('🎯 前端界面:');
            console.log('  GET    /chat          - 对话调试页面');
            console.log('⚠️  注意: AI功能需要配置API密钥');
            console.log('💡 数据库已使用 Prisma ORM');
        });
    } catch (error: any) {
        console.error('启动服务器失败:', error.message);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🔄 正在关闭服务器...');
    await prismaService.disconnect();
    console.log('✅ 服务器已关闭');
    process.exit(0);
});

startServer();

