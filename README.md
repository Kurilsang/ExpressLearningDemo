# Node.js Express MySQL CRUD + LangChain.js 后端

一个集成了LangChain.js AI功能的Express框架Node.js后端服务，支持数据库CRUD操作和AI功能。

## 项目结构

```
nodejs/
├── config/
│   ├── config.json         # 数据库配置文件
│   └── env.example         # 环境变量配置示例
├── database/
│   └── db.js              # 数据库连接模块
├── routes/
│   ├── userRoutes.js      # Express用户路由模块
│   └── aiRoutes.js        # LangChain.js AI功能路由
├── init.sql               # 数据库初始化SQL文件
├── index.js               # 主服务器文件
├── package.json           # 项目配置
└── README.md              # 说明文档
```

## 🚀 功能特性

### Express 框架特性
✅ **模块化路由** - 使用Express Router将路由逻辑分离到独立模块
✅ **中间件支持** - 自动JSON解析、CORS处理、错误处理
✅ **简化代码** - 去除原生HTTP模块的复杂性，代码更简洁
✅ **更好的错误处理** - 统一的错误处理中间件
✅ **RESTful API** - 标准的HTTP状态码和响应格式

### LangChain.js AI 功能
🤖 **智能对话** - 集成大语言模型的对话功能
📝 **文本摘要** - 自动生成文本摘要
🔧 **模块化设计** - AI功能独立路由，易于扩展
🌐 **多模型支持** - 支持OpenAI、Anthropic、Google等多种LLM
⚙️ **配置灵活** - 通过环境变量配置API密钥

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
编辑 `config/config.json` 文件，修改数据库连接信息：
```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "123456",
    "database": "test_db",
    "charset": "utf8mb4"
  },
  "server": {
    "port": 3000
  }
}
```

### 3. 手动初始化数据库（可选）
如果想手动创建数据库，可以在MySQL中执行 `init.sql` 文件：
```bash
mysql -u root -p < init.sql
```

### 4. 配置AI功能（必需）
为了使用AI功能，需要配置环境变量：

**方法1：使用.env文件（推荐）**
```bash
# .env文件已经自动创建，包含以下配置：
# OPENAI_API_KEY=sk-Z6K1lJbIhibBudBKwzAlSrZNsBdGFbkXVseWx8sWdkh9L8O1
# OPENAI_BASE_URL=https://yunwu.ai
# OPENAI_MODEL=gpt-4o-mini
```

**方法2：直接设置环境变量**
```bash
# Windows
set OPENAI_API_KEY=sk-Z6K1lJbIhibBudBKwzAlSrZNsBdGFbkXVseWx8sWdkh9L8O1
set OPENAI_BASE_URL=https://yunwu.ai
set OPENAI_MODEL=gpt-4o-mini

# Linux/Mac
export OPENAI_API_KEY=sk-Z6K1lJbIhibBudBKwzAlSrZNsBdGFbkXVseWx8sWdkh9L8O1
export OPENAI_BASE_URL=https://yunwu.ai
export OPENAI_MODEL=gpt-4o-mini
```

### 5. 启动服务器
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 6. 初始化数据库（推荐）
服务器启动后，访问以下接口一键创建数据库和表：
```bash
curl -X POST http://localhost:3000/init
```

## API 接口

### 基础信息
- **基础URL**: `http://localhost:3000`
- **数据格式**: JSON
- **字符编码**: UTF-8

### 接口列表

#### 基础接口

**1. 获取首页信息**
```
GET /
```

**2. 初始化数据库**
```
POST /init
```

#### 用户管理接口

**3. 获取所有用户**
```
GET /users
```

**4. 根据ID获取用户**
```
GET /users/:id
```

**5. 创建用户**
```
POST /users
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "age": 25
}
```

**6. 更新用户**
```
PUT /users/:id
Content-Type: application/json

{
  "name": "李四",
  "email": "lisi@example.com",
  "age": 30
}
```

**7. 删除用户**
```
DELETE /users/:id
```

#### AI功能接口 (LangChain.js)

**8. 获取AI功能列表**
```
GET /ai
```

**9. AI对话功能**
```
POST /ai/chat
Content-Type: application/json

{
  "message": "你好，请介绍一下LangChain"
}
```

**10. 文本摘要功能**
```
POST /ai/summarize
Content-Type: application/json

{
  "text": "这里是要摘要的长文本内容..."
}
```

**11. 获取AI配置信息**
```
GET /ai/config
```

## 测试示例

使用curl测试API：

### 数据库相关测试

```bash
# 1. 初始化数据库
curl -X POST http://localhost:3000/init

# 2. 获取所有用户
curl http://localhost:3000/users

# 3. 创建用户
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户","email":"test@example.com","age":25}'

# 4. 获取指定用户
curl http://localhost:3000/users/1

# 5. 更新用户
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"更新用户","email":"updated@example.com","age":30}'

# 6. 删除用户
curl -X DELETE http://localhost:3000/users/1
```

### AI功能测试

```bash
# 1. 检查AI配置状态
curl http://localhost:3000/ai/config

# 2. AI对话测试
curl -X POST http://localhost:3000/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好，请介绍一下LangChain.js"}'

# 3. 文本摘要测试（短文本）
curl -X POST http://localhost:3000/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"LangChain.js是一个用于构建大语言模型应用的JavaScript框架。它提供了丰富的工具和组件，帮助开发者轻松集成各种LLM服务。通过模块化设计，开发者可以快速构建聊天机器人、文本摘要、问答系统等AI应用。"}'

# 4. 文本摘要测试（长文本）
curl -X POST http://localhost:3000/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"这里可以放一段很长的文本，LangChain.js会自动使用map-reduce方法进行摘要..."}'

# 5. 获取AI功能列表
curl http://localhost:3000/ai
```

## 数据库表结构

### users 表
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '用户姓名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱地址',
    age INT DEFAULT 0 COMMENT '年龄',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);
```

## 环境变量配置

项目使用 `dotenv` 管理环境变量，相关配置文件：

- **`.env`** - 主环境变量文件（已自动创建）
- **`env.txt`** - 环境变量模板文件
- **`config/env.example`** - 环境变量示例文件

### 重要环境变量

| 变量名 | 描述 | 默认值 | 是否必需 |
|--------|------|--------|----------|
| `OPENAI_API_KEY` | OpenAI API密钥 | - | 是（AI功能） |
| `OPENAI_BASE_URL` | API基础URL | https://api.openai.com/v1 | 否 |
| `OPENAI_MODEL` | 使用的模型 | gpt-4o-mini | 否 |
| `PORT` | 服务器端口 | 3000 | 否 |
| `NODE_ENV` | 运行环境 | development | 否 |

## 注意事项

1. **MySQL数据库**: 请确保MySQL服务已启动
2. **数据库配置**: 根据实际情况修改 `config/config.json` 中的数据库连接信息
3. **数据库初始化**: 首次运行建议先访问 `POST /init` 接口初始化数据库
4. **AI功能**: 需要有效的API密钥才能使用AI相关功能
5. **API格式**: 所有API返回的都是JSON格式数据
6. **云雾AI**: 当前配置使用云雾AI代理服务([yunwu.ai](https://yunwu.ai))
7. **Node.js版本**: 建议使用Node.js 18+以获得最佳兼容性

## 错误处理

所有API都会返回统一格式的响应：
```json
{
  "success": true/false,
  "data": {},
  "message": "操作结果描述"
}
```
