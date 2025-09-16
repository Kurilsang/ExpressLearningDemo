import express, { Request, Response } from 'express';
import prismaService from '../database/prisma';

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
        const users = await prismaService.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
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
        const user = await prismaService.user.findUnique(parseInt(id));
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
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

        const user = await prismaService.user.create({
            name,
            email,
            age: age || 0
        });

        res.status(201).json({
            success: true,
            data: user,
            message: '创建用户成功'
        });
    } catch (error: any) {
        if (error.code === 'P2002') { // Prisma unique constraint error
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
        const existingUser = await prismaService.user.findUnique(parseInt(id));
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const updatedUser = await prismaService.user.update(parseInt(id), {
            name,
            email,
            age
        });

        res.json({
            success: true,
            data: updatedUser,
            message: '更新用户成功'
        });
    } catch (error: any) {
        if (error.code === 'P2002') { // Prisma unique constraint error
            return res.status(400).json({
                success: false,
                message: '邮箱已存在'
            });
        }
        if (error.code === 'P2025') { // Record not found
            return res.status(404).json({
                success: false,
                message: '用户不存在'
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
        await prismaService.user.delete(parseInt(id));

        res.json({
            success: true,
            message: '删除用户成功'
        });
    } catch (error: any) {
        if (error.code === 'P2025') { // Record not found
            return res.status(404).json({
                success: false,
                message: '用户不存在或删除失败'
            });
        }
        res.status(500).json({
            success: false,
            message: '删除用户失败: ' + error.message
        });
    }
});

export default router;
