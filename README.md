# Node.js Express MySQL CRUD 后端

一个基于Express框架的Node.js MySQL增删改查后端服务。

## 项目结构

```
nodejs/
├── config/
│   └── config.json         # 数据库配置文件
├── database/
│   └── db.js              # 数据库连接模块
├── routes/
│   └── userRoutes.js      # Express用户路由模块
├── init.sql               # 数据库初始化SQL文件
├── index.js               # 主服务器文件
├── package.json           # 项目配置
└── README.md              # 说明文档
```

## Express 重构特性

✅ **模块化路由** - 使用Express Router将路由逻辑分离到独立模块
✅ **中间件支持** - 自动JSON解析、CORS处理、错误处理
✅ **简化代码** - 去除原生HTTP模块的复杂性，代码更简洁
✅ **更好的错误处理** - 统一的错误处理中间件
✅ **RESTful API** - 标准的HTTP状态码和响应格式

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

### 4. 启动服务器
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 5. 初始化数据库（推荐）
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

#### 1. 获取首页信息
```
GET /
```

#### 2. 初始化数据库
```
POST /init
```

#### 3. 获取所有用户
```
GET /users
```

#### 4. 根据ID获取用户
```
GET /users/:id
```

#### 5. 创建用户
```
POST /users
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "age": 25
}
```

#### 6. 更新用户
```
PUT /users/:id
Content-Type: application/json

{
  "name": "李四",
  "email": "lisi@example.com",
  "age": 30
}
```

#### 7. 删除用户
```
DELETE /users/:id
```

## 测试示例

使用curl测试API：

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

## 注意事项

1. 请确保MySQL服务已启动
2. 根据实际情况修改 `config/config.json` 中的数据库连接信息
3. 首次运行建议先访问 `POST /init` 接口初始化数据库
4. 所有API返回的都是JSON格式数据

## 错误处理

所有API都会返回统一格式的响应：
```json
{
  "success": true/false,
  "data": {},
  "message": "操作结果描述"
}
```
