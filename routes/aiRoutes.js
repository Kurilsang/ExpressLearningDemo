const express = require('express');
const router = express.Router();
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { loadSummarizationChain } = require('langchain/chains');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { Document } = require('langchain/document');

// 内存存储对话历史（简单实现，生产环境建议使用数据库）
const conversationHistory = new Map();

// LangChain.js 示例路由

// 获取AI功能列表
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'LangChain.js AI功能',
        features: {
            'POST /ai/chat': '简单对话功能',
            'POST /ai/chat-context': '上下文对话功能',
            'POST /ai/clear-context': '清空对话历史',
            'POST /ai/summarize': '文本摘要功能',
            'GET /ai/config': 'AI配置信息'
        },
        frontend: {
            'GET /chat.html': '对话调试页面'
        },
        note: '需要配置API密钥才能使用AI功能'
    });
});

// 带上下文的对话功能
router.post('/chat', async (req, res) => {
    try {
        const { message, history = [], sessionId = 'default' } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: '请提供消息内容'
            });
        }

        // 检查API密钥是否配置
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: '未配置OPENAI_API_KEY环境变量'
            });
        }

        // 获取或创建会话历史
        let sessionHistory = conversationHistory.get(sessionId) || [];
        
        // 如果前端传来了历史记录，使用前端的历史
        if (history && history.length > 0) {
            sessionHistory = history;
        }

        // 使用LangChain ChatOpenAI
        const chat = new ChatOpenAI({ 
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.7,
            configuration: {
                baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
            }
        });
        
        // 构建消息历史
        const messages = [];
        
        // 添加系统提示
        messages.push(new SystemMessage('你是一个友好、有帮助的AI助手。你能记住之前的对话内容，并基于上下文进行回答。'));
        
        // 添加历史对话
        sessionHistory.forEach(msg => {
            if (msg.type === 'human') {
                messages.push(new HumanMessage(msg.content));
            } else if (msg.type === 'ai') {
                messages.push(new AIMessage(msg.content));
            }
        });
        
        // 添加当前用户消息
        messages.push(new HumanMessage(message));
        
        // 调用AI
        const response = await chat.invoke(messages);
        
        // 更新会话历史
        sessionHistory.push({ type: 'human', content: message });
        sessionHistory.push({ type: 'ai', content: response.content });
        
        // 限制历史长度（保留最近20条消息）
        if (sessionHistory.length > 20) {
            sessionHistory = sessionHistory.slice(-20);
        }
        
        // 保存到内存
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
        
    } catch (error) {
        console.error('AI对话错误:', error);
        res.status(500).json({
            success: false,
            message: 'AI对话失败: ' + error.message
        });
    }
});

// 上下文对话功能
router.post('/chat-context', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: '请提供消息内容'
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: '请提供会话ID'
            });
        }

        // 检查API密钥是否配置
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: '未配置OPENAI_API_KEY环境变量'
            });
        }

        // 创建LangChain ChatOpenAI实例
        const chat = new ChatOpenAI({ 
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.7,
            configuration: {
                baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
            }
        });

        // 获取或创建对话历史
        if (!conversationHistory.has(sessionId)) {
            conversationHistory.set(sessionId, [
                new SystemMessage("你是一个友善、乐于助人的AI助手。请保持对话的连贯性，记住之前的对话内容。")
            ]);
        }

        const history = conversationHistory.get(sessionId);
        
        // 添加用户消息到历史
        history.push(new HumanMessage(message));

        // 限制历史长度（保留系统消息 + 最近20条对话）
        if (history.length > 21) {
            const systemMsg = history[0];
            const recentMessages = history.slice(-20);
            conversationHistory.set(sessionId, [systemMsg, ...recentMessages]);
        }

        // 发送包含历史的消息给AI
        const updatedHistory = conversationHistory.get(sessionId);
        const response = await chat.invoke(updatedHistory);

        // 添加AI回复到历史
        updatedHistory.push(new AIMessage(response.content));

        res.json({
            success: true,
            data: {
                sessionId: sessionId,
                userMessage: message,
                aiResponse: response.content,
                historyCount: updatedHistory.length - 1, // 减去系统消息
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                timestamp: new Date().toISOString()
            },
            message: '上下文对话成功'
        });
        
    } catch (error) {
        console.error('上下文对话错误:', error);
        res.status(500).json({
            success: false,
            message: '上下文对话失败: ' + error.message
        });
    }
});

// 清空对话历史
router.post('/clear-context', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: '请提供会话ID'
            });
        }

        // 删除对话历史
        if (conversationHistory.has(sessionId)) {
            conversationHistory.delete(sessionId);
        }

        res.json({
            success: true,
            data: {
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            },
            message: '对话历史已清空'
        });
        
    } catch (error) {
        console.error('清空对话历史错误:', error);
        res.status(500).json({
            success: false,
            message: '清空对话历史失败: ' + error.message
        });
    }
});

// 文本摘要功能
router.post('/summarize', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                message: '请提供要摘要的文本'
            });
        }

        // 检查API密钥是否配置
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: '未配置OPENAI_API_KEY环境变量'
            });
        }

        // 使用LangChain进行文本摘要
        const chat = new ChatOpenAI({ 
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.3,
            configuration: {
                baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
            }
        });

        // 如果文本较长，可以先分割
        const textSplitter = new RecursiveCharacterTextSplitter({ 
            chunkSize: 3000,
            chunkOverlap: 200
        });
        
        if (text.length > 3000) {
            // 对于长文本使用摘要链
            const docs = await textSplitter.createDocuments([text]);
            const chain = loadSummarizationChain(chat, { type: "map_reduce" });
            const result = await chain.invoke({ input_documents: docs });
            
            res.json({
                success: true,
                data: {
                    originalText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                    summary: result.text,
                    originalLength: text.length,
                    method: 'map_reduce_chain',
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    timestamp: new Date().toISOString()
                },
                message: '长文本摘要成功'
            });
        } else {
            // 对于短文本直接使用聊天模型
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
        
    } catch (error) {
        console.error('文本摘要错误:', error);
        res.status(500).json({
            success: false,
            message: '文本摘要失败: ' + error.message
        });
    }
});

// 配置信息
router.get('/config', (req, res) => {
    res.json({
        success: true,
        message: 'LangChain.js 配置信息',
        configuration: {
            apiKeyConfigured: !!process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            nodeEnv: process.env.NODE_ENV || 'development'
        },
        requirements: {
            nodeVersion: 'Node.js 18+',
            langchainVersion: '^0.1.25',
            dotenvVersion: '^16.3.1'
        },
        currentStatus: {
            envFileExists: process.env.OPENAI_API_KEY ? '已配置' : '未配置',
            apiEndpoint: process.env.OPENAI_BASE_URL || 'default',
            ready: !!process.env.OPENAI_API_KEY
        },
        documentation: {
            langchain: 'https://js.langchain.com/',
            yunwuAI: 'https://yunwu.ai'
        }
    });
});

module.exports = router;
