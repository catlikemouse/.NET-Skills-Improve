class StateManager {
    constructor() {
        this.db = window.JsonDB;
        this.listeners = [];

        // Load User
        this.user = this.db.collection('users').findOne({ _id: 'current_user' });
        if (!this.user) {
            this.user = this.getInitialUser();
            this.db.collection('users').insert(this.user);
        }

        // Current Runtime State (not persistent in DB directly, but linked)
        this.currentSessionId = null;

        // Ensure we have a session
        this.ensureSession();
    }

    getInitialUser() {
        return {
            _id: 'current_user',
            username: "Guest",
            level: 1,
            title: "初级修行者",
            xp: 0,
            nextLevelXp: 100,
            unlockedSkills: [],
            completedScenarios: [],
            apiKey: "",
            currentMode: "mode_basic"
        };
    }

    // --- Session Management ---
    ensureSession() {
        // Find latest session or create new
        const sessions = this.db.collection('sessions').find();
        if (sessions.length > 0) {
            // Sort by created_at descending to get latest
            sessions.sort((a, b) => (b._created_at || 0) - (a._created_at || 0));
            this.currentSessionId = sessions[0]._id;
        } else {
            this.startNewSession();
        }
    }

    startNewSession() {
        // Create new session doc
        const doc = {
            title: "新的修行 (New Session)",
            mode: this.user.currentMode
        };
        this.db.collection('sessions').insert(doc);
        this.currentSessionId = doc._id; // insert adds _id
        this.notifyListeners();
    }

    // --- Getters ---
    get state() {
        // Compatibility layer: mapping DB user to old "state" object for components
        return {
            ...this.user,
            chatHistory: this.getChatHistory() // Dynamic fetch
        };
    }

    // --- Actions ---

    saveUser() {
        this.db.collection('users').update({ _id: 'current_user' }, this.user);
        this.notifyListeners();
    }

    addXp(amount) {
        // Anti-Farming Logic
        const modeId = this.user.currentMode;
        const mode = window.SYSTEM_DATA.modes.find(m => m.id === modeId);

        let actualXp = amount;
        let msg = "";

        if (mode && mode.levelCap > 0 && this.user.level > mode.levelCap) {
            actualXp = 0;
            msg = `(等级压制: Lv.${this.user.level} > Lv.${mode.levelCap})`;
            amount = 0; // Prevent addition
        }

        this.user.xp += actualXp;
        this.checkLevelUp();
        this.saveUser();

        return { actualXp, msg };
    }

    checkLevelUp() {
        let leveledUp = false;
        while (this.user.xp >= this.user.nextLevelXp) {
            this.user.xp -= this.user.nextLevelXp;
            this.user.level++;
            this.user.nextLevelXp = Math.floor(this.user.nextLevelXp * 1.5);
            leveledUp = true;
        }
        if (leveledUp) this.updateTitle();
    }

    updateTitle() {
        if (this.user.level >= 20) this.user.title = "传奇架构宗师";
        else if (this.user.level >= 10) this.user.title = ".NET 架构师";
        else if (this.user.level >= 5) this.user.title = "高级开发";
        else this.user.title = "初级修行者";
    }

    unlockSkill(skillId) {
        if (!this.user.unlockedSkills.includes(skillId)) {
            this.user.unlockedSkills.push(skillId);
            this.saveUser();
        }
    }

    completeScenario(scenarioId) {
        if (!this.user.completedScenarios.includes(scenarioId)) {
            this.user.completedScenarios.push(scenarioId);
            this.saveUser();
        }
    }

    setApiKey(key) {
        this.user.apiKey = key;
        this.saveUser();
    }

    getApiKey() {
        return this.user.apiKey;
    }

    setMode(modeId) {
        this.user.currentMode = modeId;
        this.saveUser();

        // Also update current session mode
        if (this.currentSessionId) {
            this.db.collection('sessions').update({ _id: this.currentSessionId }, { mode: modeId });
        }
    }

    getMode() {
        return this.user.currentMode;
    }

    // --- Chat History (Logged to 'logs' collection) ---
    addChatMessage(role, content) {
        this.db.collection('logs').insert({
            sessionId: this.currentSessionId,
            role: role,
            content: content
        });
        this.notifyListeners(); // Refresh UI
    }

    getChatHistory() {
        if (!this.currentSessionId) return [];
        // Find logs for current session
        const logs = this.db.collection('logs').find({ sessionId: this.currentSessionId });
        // Sort chronologically
        return logs.sort((a, b) => a._created_at - b._created_at);
    }

    clearHistory() {
        // Only clear for current session
        if (this.currentSessionId) {
            this.db.collection('logs').delete({ sessionId: this.currentSessionId });
        }
        this.notifyListeners();
    }

    // --- DB Export ---
    downloadData() {
        this.db.downloadBackup();
    }

    // --- Subscriptions ---
    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.state);
    }

    notifyListeners() {
        const s = this.state;
        this.listeners.forEach(cb => cb(s));
    }
}

window.appState = new StateManager();
