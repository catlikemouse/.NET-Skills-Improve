class StateManager {
    constructor() {
        this.db = window.JsonDB;
        this.listeners = [];
        this.CONST = window.APP_CONSTANTS || {};

        // Load User
        const userId = this.CONST.USER?.CURRENT_USER_ID || 'current_user';
        this.user = this.db.collection(this.CONST.COLLECTIONS?.USERS || 'users').findOne({ _id: userId });
        if (!this.user) {
            this.user = this.getInitialUser();
            this.db.collection(this.CONST.COLLECTIONS?.USERS || 'users').insert(this.user);
        }

        // Current Runtime State (not persistent in DB directly, but linked)
        this.currentSessionId = null;

        // Ensure we have a session
        this.ensureSession();
    }

    getInitialUser() {
        const userId = this.CONST.USER?.CURRENT_USER_ID || 'current_user';
        return {
            _id: userId,
            username: "Guest",
            level: 1,
            title: "初级修行者",
            xp: 0,
            nextLevelXp: 100,
            unlockedSkills: [],
            completedScenarios: [],
            apiKey: "",
            currentMode: "mode_basic",
            consecutiveFailures: 0
        };
    }

    // --- Session Management ---
    ensureSession() {
        // Find latest session or create new
        const sessions = this.db.collection(this.CONST.COLLECTIONS?.SESSIONS || 'sessions').find();
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
        this.db.collection(this.CONST.COLLECTIONS?.SESSIONS || 'sessions').insert(doc);
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
        const userId = this.CONST.USER?.CURRENT_USER_ID || 'current_user';
        this.db.collection(this.CONST.COLLECTIONS?.USERS || 'users').update({ _id: userId }, this.user);
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
        // Obfuscate API key before storing (basic protection)
        this.user.apiKey = window.Utils ? window.Utils.obfuscate.encode(key) : key;
        this.saveUser();
    }

    getApiKey() {
        // Decode obfuscated API key
        const stored = this.user.apiKey;
        return window.Utils ? window.Utils.obfuscate.decode(stored) : stored;
    }

    setMode(modeId) {
        this.user.currentMode = modeId;
        this.saveUser();

        // Also update current session mode
        if (this.currentSessionId) {
            this.db.collection(this.CONST.COLLECTIONS?.SESSIONS || 'sessions').update({ _id: this.currentSessionId }, { mode: modeId });
        }
    }

    getMode() {
        return this.user.currentMode;
    }

    // --- Failure Tracking (3 Strikes Rule) ---
    recordFailure() {
        this.user.consecutiveFailures = (this.user.consecutiveFailures || 0) + 1;
        this.saveUser();
        return this.user.consecutiveFailures;
    }

    resetFailures() {
        if (this.user.consecutiveFailures > 0) {
            this.user.consecutiveFailures = 0;
            this.saveUser();
        }
    }

    getFailures() {
        return this.user.consecutiveFailures || 0;
    }

    // --- Chat History (Logged to 'logs' collection) ---
    addChatMessage(role, content) {
        this.db.collection(this.CONST.COLLECTIONS?.LOGS || 'logs').insert({
            sessionId: this.currentSessionId,
            role: role,
            content: content
        });
        this.notifyListeners(); // Refresh UI
    }

    getChatHistory() {
        if (!this.currentSessionId) return [];
        // Find logs for current session
        const logs = this.db.collection(this.CONST.COLLECTIONS?.LOGS || 'logs').find({ sessionId: this.currentSessionId });
        // Sort chronologically
        return logs.sort((a, b) => a._created_at - b._created_at);
    }

    clearHistory() {
        // Only clear for current session
        if (this.currentSessionId) {
            this.db.collection(this.CONST.COLLECTIONS?.LOGS || 'logs').delete({ sessionId: this.currentSessionId });
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
