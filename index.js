const express = require('express');
const db = require('./database/db');
const userRoutes = require('./routes/userRoutes');

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        message: '欢迎使用Node.js Express MySQL CRUD API',
        endpoints: {
            'GET /users': '获取所有用户',
            'GET /users/:id': '根据ID获取用户',
            'POST /users': '创建用户',
            'PUT /users/:id': '更新用户',
            'DELETE /users/:id': '删除用户',
            'POST /init': '初始化数据库'
        }
    });
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
            console.log('  GET    /              - 首页信息');
            console.log('  POST   /init          - 初始化数据库');
            console.log('  GET    /users         - 获取所有用户');
            console.log('  GET    /users/:id     - 根据ID获取用户');
            console.log('  POST   /users         - 创建用户');
            console.log('  PUT    /users/:id     - 更新用户');
            console.log('  DELETE /users/:id     - 删除用户');
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