import express, { Request, Response } from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
// import { loadSummarizationChain } from 'langchain/chains';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const router = express.Router();

// 对话历史类型定义
interface ConversationMessage {
    type: 'human' | 'ai';
    content: string;
}

interface ChatRequest extends Request {
    body: {
        message: string;
        history?: ConversationMessage[];
        sessionId?: string;
    };
}

interface SummarizeRequest extends Request {
    body: {
        text: string;
    };
}

// 内存存储对话历史（简单实现，生产环境建议使用数据库）
const conversationHistory = new Map<string, ConversationMessage[]>();

// 获取AI功能列表
router.get('/', (req: Request, res: Response) => {
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

// 带上下文的对话功能
router.post('/chat', async (req: ChatRequest, res: Response) => {
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
        sessionHistory.push({ type: 'ai', content: response.content as string });
        
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
                aiResponse: response.content as string,
                history: sessionHistory,
                sessionId: sessionId,
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                timestamp: new Date().toISOString()
            },
            message: '对话成功'
        });
        
    } catch (error: any) {
        console.error('AI对话错误:', error);
        res.status(500).json({
            success: false,
            message: 'AI对话失败: ' + error.message
        });
    }
});

// 文本摘要功能
router.post('/summarize', async (req: SummarizeRequest, res: Response) => {
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

        // 如果文本较长，分段处理
        if (text.length > 3000) {
            // 对于长文本，分段处理
            const chunks = [];
            for (let i = 0; i < text.length; i += 2000) {
                chunks.push(text.substring(i, i + 2000));
            }
            
            const summaries = [];
            for (const chunk of chunks) {
                const prompt = `请为以下文本段落生成简洁摘要：\n\n${chunk}`;
                const response = await chat.invoke(prompt);
                summaries.push(response.content as string);
            }
            
            // 合并摘要
            const finalPrompt = `请将以下摘要合并为一个完整的摘要：\n\n${summaries.join('\n\n')}`;
            const finalResponse = await chat.invoke(finalPrompt);
            
            res.json({
                success: true,
                data: {
                    originalText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                    summary: finalResponse.content as string,
                    originalLength: text.length,
                    method: 'chunk_summarize',
                    chunksProcessed: chunks.length,
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
                    summary: response.content as string,
                    originalLength: text.length,
                    method: 'direct_chat',
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    timestamp: new Date().toISOString()
                },
                message: '文本摘要成功'
            });
        }
        
    } catch (error: any) {
        console.error('文本摘要错误:', error);
        res.status(500).json({
            success: false,
            message: '文本摘要失败: ' + error.message
        });
    }
});

// 清空对话历史
router.post('/clear', async (req: Request, res: Response) => {
    try {
        const { sessionId = 'default' } = req.body;
        
        conversationHistory.delete(sessionId);
        
        res.json({
            success: true,
            message: '对话历史已清空',
            sessionId: sessionId
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: '清空失败: ' + error.message
        });
    }
});

// 获取配置信息
router.get('/config', (req: Request, res: Response) => {
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

export default router;
