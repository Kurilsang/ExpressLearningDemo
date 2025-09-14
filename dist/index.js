"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./database/db"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});
app.get('/', (req, res) => {
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
app.get('/chat', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.get('/chat.html', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.post('/init', async (req, res) => {
    try {
        await db_1.default.initDatabase();
        res.json({
            success: true,
            message: '数据库初始化成功',
            config: db_1.default.getConfig(),
            connected: db_1.default.isConnected()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '数据库初始化失败: ' + error.message,
            connected: db_1.default.isConnected()
        });
    }
});
app.get('/db/status', (req, res) => {
    res.json({
        success: true,
        data: {
            connected: db_1.default.isConnected(),
            config: {
                host: db_1.default.getConfig().host,
                port: db_1.default.getConfig().port,
                database: db_1.default.getConfig().database,
                charset: db_1.default.getConfig().charset
            }
        },
        message: '数据库状态检查完成'
    });
});
app.use('/users', userRoutes_1.default);
app.use('/ai', aiRoutes_1.default);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});
async function startServer() {
    try {
        await db_1.default.connect();
        const PORT = parseInt(process.env.PORT || '3000');
        app.listen(PORT, () => {
            console.log(`🚀 TypeScript服务器运行在 http://localhost:${PORT}`);
            console.log('📋 API端点:');
            console.log('📊 数据库相关:');
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
        });
    }
    catch (error) {
        console.error('启动服务器失败:', error.message);
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    console.log('\n🔄 正在关闭服务器...');
    await db_1.default.close();
    console.log('✅ 服务器已关闭');
    process.exit(0);
});
startServer();
