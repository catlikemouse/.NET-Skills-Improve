/**
 * DeepSeek API Client
 * Handles communication with DeepSeek chat API with streaming support
 * Optimized with AbortController for request cancellation
 */
class DeepSeekAPI {
    constructor() {
        const config = window.APP_CONSTANTS?.API || {};
        this.baseUrl = config.DEEPSEEK_URL || "https://api.deepseek.com/chat/completions";
        this.model = config.DEEPSEEK_MODEL || "deepseek-chat";
        this.temperature = config.TEMPERATURE || 1.3;
        this.currentController = null; // For request cancellation
    }

    /**
     * Abort any ongoing request
     */
    abort() {
        if (this.currentController) {
            this.currentController.abort();
            this.currentController = null;
            console.log("[DeepSeekAPI] Request aborted");
        }
    }

    /**
     * Stream chat completion from DeepSeek API
     * @param {Array} messages - Array of message objects with role and content
     * @param {Function} onChunk - Callback for each streamed chunk
     * @param {Function} onComplete - Callback when streaming completes
     * @param {Function} onError - Callback for error handling
     */
    async streamChat(messages, onChunk, onComplete, onError) {
        const apiKey = window.appState.getApiKey();

        if (!apiKey) {
            onError("请先在左侧配置 DeepSeek API Key (Settings -> Config)");
            return;
        }

        // Abort any previous request
        this.abort();

        // Create new abort controller for this request
        this.currentController = new AbortController();
        const signal = this.currentController.signal;

        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                mode: "cors",
                signal: signal, // Add abort signal
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: true,
                    temperature: this.temperature
                })
            });

            if (!response.ok) {
                const err = await response.text();
                if (response.status === 401) {
                    throw new Error("API Key 无效，请检查配置。");
                }
                throw new Error(`API 请求失败: ${response.status} - ${err}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === "data: [DONE]") continue;

                    if (trimmed.startsWith("data: ")) {
                        try {
                            const json = JSON.parse(trimmed.slice(6));
                            const content = json.choices[0].delta.content;
                            if (content) {
                                onChunk(content);
                            }
                        } catch (e) {
                            // Skip malformed JSON chunks
                        }
                    }
                }
            }

            this.currentController = null;
            if (onComplete) onComplete();

        } catch (error) {
            this.currentController = null;

            // Handle abort error silently
            if (error.name === 'AbortError') {
                console.log("[DeepSeekAPI] Request was cancelled");
                return;
            }

            console.error("DeepSeek API Error:", error);
            if (error.message.includes("Failed to fetch")) {
                onError("无法连接到 DeepSeek 服务器。\n可能的解决方案：\n1. 检查网络连接。\n2. 如果你直接打开了 HTML 文件，浏览器可能会拦截请求 (CORS)。请尝试搭建本地服务器 (Localhost) 运行。");
            } else {
                onError(error.message);
            }
        }
    }
}

window.deepSeekApi = new DeepSeekAPI();
