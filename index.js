// 加载环境变量
require('dotenv').config();

const express = require('express');
const db = require('./database/db');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('public'));

// CORS中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// 首页路由
app.get('/', (req, res) => {
    res.json({
        message: '欢迎使用Node.js Express MySQL CRUD + LangChain.js API',
        endpoints: {
            database: {
                'POST /init': '初始化数据库'
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
                'POST /ai/chat': 'AI对话功能',
                'POST /ai/chat-context': '上下文对话功能',
                'POST /ai/clear-context': '清空对话历史',
                'POST /ai/summarize': '文本摘要功能',
                'GET /ai/config': 'LangChain配置信息'
            },
            frontend: {
                'GET /chat': 'AI对话调试页面',
                'GET /chat.html': 'AI对话调试页面(备选)'
            }
        },
        note: 'AI功能需要配置相应的API密钥'
    });
});

// 聊天页面路由
app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 聊天页面路由(备选)
app.get('/chat.html', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// 初始化数据库路由
app.post('/init', async (req, res) => {
    try {
        await db.initDatabase();
        res.json({ 
            success: true, 
            message: '数据库初始化成功' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: '数据库初始化失败: ' + error.message 
        });
    }
});

// 用户路由
app.use('/users', userRoutes);

// AI路由 (LangChain.js)
app.use('/ai', aiRoutes);

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: '接口不存在' 
    });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({ 
        success: false, 
        message: '服务器内部错误' 
    });
});

// 启动服务器
async function startServer() {
    try {
        // 连接数据库
        await db.connect();
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log('API端点:');
            console.log('数据库相关:');
            console.log('  GET    /              - 首页信息');
            console.log('  POST   /init          - 初始化数据库');
            console.log('用户管理:');
            console.log('  GET    /users         - 获取所有用户');
            console.log('  GET    /users/:id     - 根据ID获取用户');
            console.log('  POST   /users         - 创建用户');
            console.log('  PUT    /users/:id     - 更新用户');
            console.log('  DELETE /users/:id     - 删除用户');
            console.log('AI功能 (LangChain.js):');
            console.log('  GET    /ai            - AI功能列表');
            console.log('  POST   /ai/chat       - AI对话');
            console.log('  POST   /ai/summarize  - 文本摘要');
            console.log('  GET    /ai/config     - 配置信息');
            console.log('注意: AI功能需要配置API密钥');
        });
    } catch (error) {
        console.error('启动服务器失败:', error.message);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    await db.close();
    process.exit(0);
});

startServer();