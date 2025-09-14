"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../database/db"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const users = await db_1.default.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({
            success: true,
            data: users,
            message: '获取用户列表成功'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '获取用户列表失败: ' + error.message
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const users = await db_1.default.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        const user = users[0];
        res.json({
            success: true,
            data: user,
            message: '获取用户信息成功'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '获取用户信息失败: ' + error.message
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, email, age } = req.body;
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: '姓名和邮箱不能为空'
            });
        }
        const result = await db_1.default.query('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', [name, email, age || 0]);
        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                name,
                email,
                age: age || 0
            },
            message: '创建用户成功'
        });
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: '邮箱已存在'
            });
        }
        res.status(500).json({
            success: false,
            message: '创建用户失败: ' + error.message
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, age } = req.body;
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: '姓名和邮箱不能为空'
            });
        }
        const existingUsers = await db_1.default.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        const existingUser = existingUsers[0];
        const result = await db_1.default.query('UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?', [name, email, age, id]);
        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: '更新失败'
            });
        }
        res.json({
            success: true,
            data: {
                id: parseInt(id),
                name,
                email,
                age
            },
            message: '更新用户成功'
        });
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: '邮箱已存在'
            });
        }
        res.status(500).json({
            success: false,
            message: '更新用户失败: ' + error.message
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db_1.default.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在或删除失败'
            });
        }
        res.json({
            success: true,
            message: '删除用户成功'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '删除用户失败: ' + error.message
        });
    }
});
exports.default = router;
