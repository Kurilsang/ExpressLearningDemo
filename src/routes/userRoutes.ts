import express, { Request, Response } from 'express';
import { RowDataPacket, OkPacket } from 'mysql2/promise';
import db from '../database/db';

const router = express.Router();

// 用户数据类型定义
interface User {
    id: number;
    name: string;
    email: string;
    age: number;
    created_at: Date;
    updated_at: Date;
}

interface CreateUserRequest extends Request {
    body: {
        name: string;
        email: string;
        age?: number;
    };
}

interface UpdateUserRequest extends Request {
    params: {
        id: string;
    };
    body: {
        name: string;
        email: string;
        age?: number;
    };
}

// 获取所有用户
router.get('/', async (req: Request, res: Response) => {
    try {
        const users = await db.query('SELECT * FROM users ORDER BY created_at DESC') as User[];
        res.json({
            success: true,
            data: users,
            message: '获取用户列表成功'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: '获取用户列表失败: ' + error.message
        });
    }
});

// 根据ID获取用户
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const users = await db.query('SELECT * FROM users WHERE id = ?', [id]) as User[];
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const user: User = users[0];
        res.json({
            success: true,
            data: user,
            message: '获取用户信息成功'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: '获取用户信息失败: ' + error.message
        });
    }
});

// 创建用户
router.post('/', async (req: CreateUserRequest, res: Response) => {
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
        ) as OkPacket;

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
    } catch (error: any) {
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
router.put('/:id', async (req: UpdateUserRequest, res: Response) => {
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
        const existingUsers = await db.query('SELECT * FROM users WHERE id = ?', [id]) as User[];
        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const existingUser: User = existingUsers[0];

        const result = await db.query(
            'UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?',
            [name, email, age, id]
        ) as OkPacket;

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
    } catch (error: any) {
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
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM users WHERE id = ?', [id]) as OkPacket;
        
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
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: '删除用户失败: ' + error.message
        });
    }
});

export default router;
