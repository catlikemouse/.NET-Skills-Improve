class DeepSeekAPI {
    constructor() {
        // Updated to explicit v1 endpoint
        this.baseUrl = "https://api.deepseek.com/chat/completions";
        this.model = "deepseek-chat";
    }

    async streamChat(messages, onChunk, onComplete, onError) {
        const apiKey = window.appState.getApiKey();

        if (!apiKey) {
            onError("请先在左侧配置 DeepSeek API Key (Settings -> Config)");
            return;
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                mode: "cors", // Explicitly request CORS
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: true,
                    temperature: 1.3
                })
            });

            if (!response.ok) {
                const err = await response.text();
                // Handle 401 specifically
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
                            // console.error("Parse error", e);
                        }
                    }
                }
            }

            if (onComplete) onComplete();

        } catch (error) {
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
