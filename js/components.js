const Components = {

    updateSidebar: (state) => {
        // Character Card Data
        if (document.getElementById('user-name')) {
            document.getElementById('user-name').textContent = state.username || "Architect";
            document.getElementById('user-title').textContent = state.title;
            document.getElementById('level-display').textContent = state.level;

            // XP Logic
            const xpPercent = Math.min(100, Math.floor((state.xp / state.nextLevelXp) * 100));
            document.getElementById('xp-display').textContent = `${state.xp}/${state.nextLevelXp}`;
            document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;

            // Skill Badges (Simple dot indicators for now)
            const skillsContainer = document.getElementById('skill-badges');
            if (skillsContainer) {
                skillsContainer.innerHTML = state.unlockedSkills.map(s =>
                    `<span style="width:8px; height:8px; background:var(--accent-secondary); border-radius:50%; display:inline-block;" title="${s}"></span>`
                ).join('');

                // Add Upgrade Text if available
                if (state.unlockedSkills.length === 0) {
                    skillsContainer.innerHTML = `<span style="font-size:0.7rem; color:#ccc;">暂无技能 (No Skills)</span>`;
                }
            }
        }

        // Update API Status
        const apiStat = document.getElementById('api-status-indicator');
        if (state.apiKey) {
            apiStat.textContent = "● 灵脉已通 (Connected)";
            apiStat.className = "connected";
        } else {
            apiStat.textContent = "○ 灵脉阻断 (Disconnected)";
            apiStat.className = "disconnected";
        }

        // Highlight Active Mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            if (btn.dataset.id === state.currentMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    renderModeList: () => {
        const container = document.getElementById('mode-list-container');
        if (!container) return;

        container.innerHTML = '';
        window.SYSTEM_DATA.modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'menu-btn mode-btn';
            btn.dataset.id = mode.id;
            btn.innerHTML = `<i class="fa-solid ${mode.icon}"></i> ${mode.title}`;

            btn.addEventListener('click', () => {
                window.appState.setMode(mode.id);
                // Trigger a system message about mode switch
                window.Components.renderChatBubble(`模式已切换：**${mode.title}**\n${mode.desc}`, "system");
            });

            container.appendChild(btn);
        });
    },

    renderChatBubble: (content, type = 'agent') => {
        const feed = document.getElementById('chat-feed');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;

        if (type === 'agent') {
            // Visualize JSON Cleaning (for history)
            // Strip any JSON-like command blocks: ```json { ... } ``` or just { "cmd": ... }
            let cleanContent = content;
            cleanContent = cleanContent.replace(/```json\s*(\{[\s\S]*?"cmd"[\s\S]*?\})\s*```/gi, "");
            cleanContent = cleanContent.replace(/```\s*(\{[\s\S]*?"cmd"[\s\S]*?\})\s*```/gi, "");
            cleanContent = cleanContent.replace(/(\{[\s\S]*?"cmd"\s*:\s*"settle"[\s\S]*?\})\s*$/gi, "");

            bubble.innerHTML = marked.parse(cleanContent);
        } else {
            bubble.innerHTML = content; // User/System
        }

        feed.appendChild(bubble);
        feed.scrollTop = feed.scrollHeight;
        return bubble;
    },

    renderSettingsModal: (state) => {
        return `
            <h2 style="font-family:var(--font-serif); color:var(--text-ink); margin-bottom:1rem;">系统配置 (Config)</h2>
            <div style="margin-bottom:1rem;">
                <label style="display:block; color:var(--text-muted); font-size:0.8rem; margin-bottom:5px;">DeepSeek API Key</label>
                <input type="password" id="modal-api-key" value="${state.apiKey || ''}" 
                    style="width:100%; padding:10px; background:#fdfbf7; border:1px solid #ccc; color:#333; font-family:monospace; border-radius:8px;">
                <p style="font-size:0.75rem; color:#999; margin-top:5px;">密钥仅保存在本地。</p>
            </div>
            <div style="margin-bottom:1rem; padding:10px; background:#f9f9f9; border-radius:8px; font-size:0.8rem; color:#666;">
                <strong>Data Storage:</strong> JsonDB (NoSQL Sim) <br>
                Records saved in LocalStorage.
            </div>
            
            <button id="modal-export-db" class="menu-btn" style="width:100%; justify-content:center; border:1px solid #ddd; margin-bottom:5px; background:#fff; color:var(--text-ink);">
                <i class="fa-solid fa-download"></i> 导出数据库 (Export JSON)
            </button>

             <button id="modal-clear-history" class="menu-btn" style="width:100%; justify-content:center; border:1px solid #eee; margin-bottom:10px; color:#c0392b;">
                清除历史记录
            </button>
            <button id="modal-save-btn" class="menu-btn" style="width:100%; justify-content:center; background:var(--accent-primary); color:white;">
                保存配置
            </button>
        `;
    }
};

window.Components = Components;
