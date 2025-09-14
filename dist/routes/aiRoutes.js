"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const router = express_1.default.Router();
const conversationHistory = new Map();
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'LangChain.js AI功能 (TypeScript)',
        features: {
            'POST /ai/chat': '智能对话功能(支持上下文)',
            'POST /ai/summarize': '文本摘要功能',
            'GET /ai/config': 'AI配置信息'
        },
        frontend: {
            'GET /chat': '对话调试页面'
        },
        note: '需要配置API密钥才能使用AI功能',
        tech: 'TypeScript + LangChain.js + OpenAI'
    });
});
router.post('/chat', async (req, res) => {
    try {
        const { message, history = [], sessionId = 'default' } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: '请提供消息内容'
            });
        }
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: '未配置OPENAI_API_KEY环境变量'
            });
        }
        let sessionHistory = conversationHistory.get(sessionId) || [];
        if (history && history.length > 0) {
            sessionHistory = history;
        }
        const chat = new openai_1.ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.7,
            configuration: {
                baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
            }
        });
        const messages = [];
        messages.push(new messages_1.SystemMessage('你是一个友好、有帮助的AI助手。你能记住之前的对话内容，并基于上下文进行回答。'));
        sessionHistory.forEach(msg => {
            if (msg.type === 'human') {
                messages.push(new messages_1.HumanMessage(msg.content));
            }
            else if (msg.type === 'ai') {
                messages.push(new messages_1.AIMessage(msg.content));
            }
        });
        messages.push(new messages_1.HumanMessage(message));
        const response = await chat.invoke(messages);
        sessionHistory.push({ type: 'human', content: message });
        sessionHistory.push({ type: 'ai', content: response.content });
        if (sessionHistory.length > 20) {
            sessionHistory = sessionHistory.slice(-20);
        }
        conversationHistory.set(sessionId, sessionHistory);
        res.json({
            success: true,
            data: {
                userMessage: message,
                aiResponse: response.content,
                history: sessionHistory,
                sessionId: sessionId,
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                timestamp: new Date().toISOString()
            },
            message: '对话成功'
        });
    }
    catch (error) {
        console.error('AI对话错误:', error);
        res.status(500).json({
            success: false,
            message: 'AI对话失败: ' + error.message
        });
    }
});
router.post('/summarize', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({
                success: false,
                message: '请提供要摘要的文本'
            });
        }
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: '未配置OPENAI_API_KEY环境变量'
            });
        }
        const chat = new openai_1.ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.3,
            configuration: {
                baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
            }
        });
        if (text.length > 3000) {
            const chunks = [];
            for (let i = 0; i < text.length; i += 2000) {
                chunks.push(text.substring(i, i + 2000));
            }
            const summaries = [];
            for (const chunk of chunks) {
                const prompt = `请为以下文本段落生成简洁摘要：\n\n${chunk}`;
                const response = await chat.invoke(prompt);
                summaries.push(response.content);
            }
            const finalPrompt = `请将以下摘要合并为一个完整的摘要：\n\n${summaries.join('\n\n')}`;
            const finalResponse = await chat.invoke(finalPrompt);
            res.json({
                success: true,
                data: {
                    originalText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                    summary: finalResponse.content,
                    originalLength: text.length,
                    method: 'chunk_summarize',
                    chunksProcessed: chunks.length,
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    timestamp: new Date().toISOString()
                },
                message: '长文本摘要成功'
            });
        }
        else {
            const prompt = `请为以下文本生成一个简洁的摘要：\n\n${text}`;
            const response = await chat.invoke(prompt);
            res.json({
                success: true,
                data: {
                    originalText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                    summary: response.content,
                    originalLength: text.length,
                    method: 'direct_chat',
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    timestamp: new Date().toISOString()
                },
                message: '文本摘要成功'
            });
        }
    }
    catch (error) {
        console.error('文本摘要错误:', error);
        res.status(500).json({
            success: false,
            message: '文本摘要失败: ' + error.message
        });
    }
});
router.post('/clear', async (req, res) => {
    try {
        const { sessionId = 'default' } = req.body;
        conversationHistory.delete(sessionId);
        res.json({
            success: true,
            message: '对话历史已清空',
            sessionId: sessionId
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: '清空失败: ' + error.message
        });
    }
});
router.get('/config', (req, res) => {
    res.json({
        success: true,
        message: 'LangChain.js 配置信息 (TypeScript)',
        configuration: {
            apiKeyConfigured: !!process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            nodeEnv: process.env.NODE_ENV || 'development'
        },
        requirements: {
            nodeVersion: 'Node.js 18+',
            langchainVersion: '^0.1.25',
            typescriptVersion: '^5.0.0'
        },
        currentStatus: {
            envFileExists: process.env.OPENAI_API_KEY ? '已配置' : '未配置',
            apiEndpoint: process.env.OPENAI_BASE_URL || 'default',
            ready: !!process.env.OPENAI_API_KEY,
            sessionsActive: conversationHistory.size
        },
        documentation: {
            langchain: 'https://js.langchain.com/',
            yunwuAI: 'https://yunwu.ai',
            typescript: 'https://www.typescriptlang.org/'
        }
    });
});
exports.default = router;
