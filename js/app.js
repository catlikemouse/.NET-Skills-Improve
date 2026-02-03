document.addEventListener('DOMContentLoaded', () => {

    const state = window.appState;
    const components = window.Components;
    const api = window.deepSeekApi;

    // --- Refs ---
    const startupLayer = document.getElementById('startup-sequence');
    const mainInterface = document.getElementById('main-interface');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.querySelector('.close-modal');

    // --- STARTUP SEQUENCE (Tai Chi) ---
    const startupScreen = document.getElementById('startup-sequence');

    // Trigger Dissolve & Smoke Explosion (T + 1.5s)
    setTimeout(() => {
        if (startupScreen) {
            // Screen Blur
            startupScreen.classList.add('smoke-dissolve');

            // Generate Particle Explosion
            const centerW = window.innerWidth / 2;
            const centerH = window.innerHeight / 2;

            for (let i = 0; i < 40; i++) {
                const p = document.createElement('div');
                p.className = 'smoke-particle';

                // Random Size
                const size = Math.random() * 100 + 50; // 50-150px
                p.style.width = `${size}px`;
                p.style.height = `${size}px`;

                // Center Start
                p.style.left = `${centerW - size / 2}px`;
                p.style.top = `${centerH - size / 2}px`;

                // Random Trajectory
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 300 + 100; // Fly 100-400px
                const tx = Math.cos(angle) * dist;
                const ty = Math.sin(angle) * dist;
                const rot = Math.random() * 360;

                p.style.setProperty('--tx', `${tx}px`);
                p.style.setProperty('--ty', `${ty}px`);
                p.style.setProperty('--r', `${rot}deg`);

                // Staggered Animation
                p.style.animation = `puffOut 2s ease-out forwards ${Math.random() * 0.5}s`;

                startupScreen.appendChild(p);
            }
        }
    }, 1500);

    setTimeout(() => {
        // Cleanup
        if (startupScreen) startupScreen.remove();
        document.getElementById('main-interface').classList.remove('hidden');

        // Initial History Render
        const history = state.getChatHistory();
        const feed = document.getElementById('chat-feed');
        if (history.length > 0) {
            feed.innerHTML = '';
            history.forEach(msg => {
                components.renderChatBubble(msg.content, msg.role);
            });
            feed.scrollTop = feed.scrollHeight;
        } else {
            // Welcome
            components.renderChatBubble("道友请留步。我是 DeepSeek 架构师系统。\n当前处于 **新手村**，请问有什么可以帮你？", "agent");
        }

        // Initial UI Render
        components.renderModeList();
        components.updateSidebar(state.state);

    }, 4000); // 1.5s + 2.5s fade

    state.subscribe((currentState) => {
        components.updateSidebar(currentState);
    });

    // --- Modal Logic ---
    function openModal(contentHtml) {
        modalContent.innerHTML = contentHtml;
        modalOverlay.classList.remove('hidden');
    }

    closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
    });

    // Settings / Config
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            openModal(components.renderSettingsModal(state.state));

            setTimeout(() => {
                const saveBtn = document.getElementById('modal-save-btn');
                const clearBtn = document.getElementById('modal-clear-history');
                const keyInput = document.getElementById('modal-api-key');

                if (saveBtn && keyInput) {
                    saveBtn.addEventListener('click', () => {
                        const newKey = keyInput.value.trim();
                        state.setApiKey(newKey);
                        modalOverlay.classList.add('hidden');
                        components.renderChatBubble("灵脉连接配置已更新。", "system");
                    });
                }

                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        if (confirm("确定要焚毁所有修行记录吗？")) {
                            state.clearHistory();
                            document.getElementById('chat-feed').innerHTML = '';
                            components.renderChatBubble("记录已焚毁。", "system");
                            modalOverlay.classList.add('hidden');
                        }
                    });
                }
            }, 100);
        });
    }

    // --- Chat Logic ---
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';

        // --- LOCAL COMMANDS ---
        if (text.startsWith('/') || text === '查询状态' || text === '系统状态') {
            const cmd = text.toLowerCase().split(' ')[0];

            if (cmd === '/status' || text === '查询状态' || text === '系统状态') {
                const s = state.state;
                const statusMsg = `
### 👤 宿主档案 (User Profile)
*   **称号**: ${s.title}
*   **等级**: Lv.${s.level} (XP: ${s.xp}/${s.nextLevelXp})
*   **当前区域**: ${window.SYSTEM_DATA.modes.find(m => m.id === s.currentMode)?.title || '未知'}

### 🔮 已习得技能 (Unlocked Skills)
${s.unlockedSkills.length > 0 ? s.unlockedSkills.map(sk => `*   ✨ ${sk}`).join('\n') : '*   (暂无技能)'}

### 🎒 背包物品
*   API Key: ${s.apiKey ? '已配置 (Configured)' : '未配置 (Missing)'}
*   Session ID: \`${state.currentSessionId}\`
`;
                state.addChatMessage("system", statusMsg);
                components.renderChatBubble(statusMsg, "system");
                return; // Stop processing
            }

            if (cmd === '/clear') {
                state.clearHistory();
                document.getElementById('chat-feed').innerHTML = '';
                components.renderChatBubble("修行记录已清空。", "system");
                return;
            }
        }

        // --- AI REQUEST ---
        // 1. Render & Save User Message
        components.renderChatBubble(text, 'user');
        state.addChatMessage("user", text);

        // 2. Prepare AI Context based on MODE
        const currentModeId = state.getMode();
        const modeData = window.SYSTEM_DATA.modes.find(m => m.id === currentModeId);
        let systemPrompt = modeData ? modeData.prompt : "You are a helpful assistant.";

        // INJECT KNOWLEDGE BASE + USER PROFILE
        const contextData = {
            system: window.SYSTEM_DATA.context,
            user_profile: {
                level: state.state.level,
                title: state.state.title,
                xp: state.state.xp,
                skills: state.state.unlockedSkills
            }
        };
        const contextString = JSON.stringify(contextData, null, 2);
        systemPrompt += `\n\n[CURRENT CONTEXT]:\n${contextString}`;

        const messages = [
            { role: "system", content: systemPrompt }
        ];

        // Send recent history
        const historyContext = state.getChatHistory().slice(-5);
        historyContext.forEach(h => {
            // Avoid adding the just-added user message twice if state updates fast, 
            // but here we just added it to state, so it IS in history. 
            // Logic: slice(-5) includes the one we just pushed? Yes.
            // We need to avoid duplicating it if we manually add it at the end?
            // Simplest: Just use history, but careful with system prompts.
            if (h.role === 'user' || h.role === 'agent') {
                messages.push({ role: h.role === 'agent' ? 'assistant' : 'user', content: h.content });
            }
        });

        // If history didn't capture the latest (race condition?), force it.
        // Actually state.addChatMessage is sync. So slice(-1) should be the user message.
        // But to be safe against duplication or missing:
        // We typically reconstruct prompt from: System + History (excluding last) + New Message.
        // Let's rely on history being correct.

        // 3. Render Agent Placeholder
        const agentBubble = components.renderChatBubble('', 'agent');
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        agentBubble.appendChild(cursor);

        let fullResponse = "";

        await api.streamChat(
            messages,
            (chunk) => {
                cursor.before(chunk);
                fullResponse += chunk;
                const feed = document.getElementById('chat-feed');
                feed.scrollTop = feed.scrollHeight;
            },
            () => {
                cursor.remove();

                // --- Use shared utility for parsing AI response ---
                const { cleanContent, command } = window.Utils ?
                    window.Utils.parseAIResponse(fullResponse) :
                    { cleanContent: fullResponse, command: null };

                let cleanResponse = cleanContent;

                // Process settlement command if found
                if (command && command.cmd === "settle") {
                    try {
                        const cmdData = command;
                        // Execute Rewards
                        let xpResult = { actualXp: 0, msg: "" };

                        if (cmdData.xp > 0) {
                            // SUCCESS
                            xpResult = state.addXp(cmdData.xp);
                            state.resetFailures(); // Reset counter on success
                            if (cmdData.skill) state.unlockSkill(cmdData.skill);
                        } else {
                            // FAILURE (XP = 0)
                            const failCount = state.recordFailure();
                            console.log("Failure detected. Current strikes:", failCount);

                            // 3 Strikes Rule
                            if (failCount >= 3) {
                                // Trigger Punishment
                                setTimeout(() => {
                                    const libraryModeId = window.APP_CONSTANTS?.MODES?.LIBRARY || 'mode_qa';
                                    state.setMode(libraryModeId); // Send to Library
                                    state.resetFailures();

                                    const punishMsg = "🛑 **道心不稳 (Defeated)**\n你已连续失败 3 次。请前往 **悟道阁 (Library)** 查阅文档，静修之后再来挑战！";
                                    components.renderChatBubble(punishMsg, "system");
                                    state.addChatMessage("system", punishMsg);
                                }, 1000);
                            }
                        }

                        // Visual Feedback
                        let sysMsg = `System Log: ${cmdData.msg}`;
                        if (cmdData.xp > 0) {
                            sysMsg += ` (XP +${xpResult.actualXp}${xpResult.msg})`;
                        } else {
                            const currentFails = state.getFailures();
                            sysMsg += ` (XP +0) [失败次数: ${currentFails}/3]`;
                        }

                        components.renderChatBubble(sysMsg, "system");
                        state.addChatMessage("system", sysMsg);
                    } catch (e) {
                        console.error("Command Parse Error", e);
                    }
                }

                // Update the bubble with the CLEANED and SANITIZED response
                const parsedHtml = marked.parse(cleanResponse);
                agentBubble.innerHTML = window.Utils ?
                    window.Utils.sanitizeHTML(parsedHtml) :
                    parsedHtml;

                // Save cleaned response to chat history
                state.addChatMessage("agent", cleanResponse);
            },
            (err) => {
                cursor.remove();
                agentBubble.textContent = "[连接中断] " + err;
            }
        );
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

});
