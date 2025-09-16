"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../database/prisma"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
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
        const user = await prisma_1.default.user.findUnique(parseInt(id));
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
        const user = await prisma_1.default.user.create({
            name,
            email,
            age: age || 0
        });
        res.status(201).json({
            success: true,
            data: user,
            message: '创建用户成功'
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
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
        const existingUser = await prisma_1.default.user.findUnique(parseInt(id));
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        const updatedUser = await prisma_1.default.user.update(parseInt(id), {
            name,
            email,
            age
        });
        res.json({
            success: true,
            data: updatedUser,
            message: '更新用户成功'
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: '邮箱已存在'
            });
        }
        if (error.code === 'P2025') {
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
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.user.delete(parseInt(id));
        res.json({
            success: true,
            message: '删除用户成功'
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
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
exports.default = router;
