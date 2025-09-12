const express = require('express');
const router = express.Router();
const db = require('../database/db');

// 获取所有用户
router.get('/', async (req, res) => {
    try {
        const users = await db.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({
            success: true,
            data: users,
            message: '获取用户列表成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取用户列表失败: ' + error.message
        });
    }
});

// 根据ID获取用户
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const users = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            data: users[0],
            message: '获取用户信息成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取用户信息失败: ' + error.message
        });
    }
});

// 创建用户
router.post('/', async (req, res) => {
    try {
        const { name, email, age } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: '姓名和邮箱不能为空'
            });
        }

        const result = await db.query(
            'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
            [name, email, age || 0]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId, name, email, age: age || 0 },
            message: '创建用户成功'
        });
    } catch (error) {
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

// 更新用户
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
        
        // 先检查用户是否存在
        const existingUser = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const result = await db.query(
            'UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?',
            [name, email, age, id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: '更新失败'
            });
        }

        res.json({
            success: true,
            data: { id: parseInt(id), name, email, age },
            message: '更新用户成功'
        });
    } catch (error) {
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

// 删除用户
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
        
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
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除用户失败: ' + error.message
        });
    }
});

module.exports = router;
