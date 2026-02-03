/**
 * Lightweight JSON NoSQL Database Engine
 * Simulates a Document-Oriented Database (like MongoDB) via LocalStorage
 * Optimized with debounce for better performance
 */

class Collection {
    constructor(name, db) {
        this.name = name;
        this.db = db;
        this.data = this._load();
        this._pendingSync = false;

        // Create debounced sync function
        this._debouncedSync = window.Utils ?
            window.Utils.debounce(() => this._performSync(), window.APP_CONSTANTS?.DEBOUNCE_MS || 500) :
            () => this._performSync();
    }

    _load() {
        const json = localStorage.getItem(this.db._getKey(this.name));
        return json ? JSON.parse(json) : [];
    }

    _save() {
        // Always save to localStorage immediately
        localStorage.setItem(this.db._getKey(this.name), JSON.stringify(this.data));
        // Trigger debounced server sync
        this._pendingSync = true;
        this._debouncedSync();
    }

    _performSync() {
        if (this._pendingSync && this.db._syncToServer) {
            this.db._syncToServer(this.name, this.data);
            this._pendingSync = false;
        }
    }

    // --- CRUD ---

    insert(doc) {
        if (!doc._id) {
            doc._id = window.Utils ? window.Utils.generateId() : Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        doc._created_at = Date.now();
        this.data.push(doc);
        this._save();
        return doc;
    }

    find(query = {}) {
        return this.data.filter(item => {
            for (let key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        });
    }

    findOne(query = {}) {
        return this.find(query)[0] || null;
    }

    update(query, updates) {
        let count = 0;
        this.data = this.data.map(item => {
            let match = true;
            for (let key in query) {
                if (item[key] !== query[key]) match = false;
            }
            if (match) {
                Object.assign(item, updates);
                item._updated_at = Date.now();
                count++;
            }
            return item;
        });
        this._save();
        return count;
    }

    upsert(query, doc) {
        const existing = this.findOne(query);
        if (existing) {
            this.update(query, doc);
            return { op: 'update', doc: this.findOne(query) };
        } else {
            // Merge query into doc if creating new
            const newDoc = { ...query, ...doc };
            this.insert(newDoc);
            return { op: 'insert', doc: newDoc };
        }
    }

    delete(query) {
        const initialLen = this.data.length;
        this.data = this.data.filter(item => {
            for (let key in query) {
                if (item[key] === query[key]) return false; // Remove matches
            }
            return true;
        });
        const count = initialLen - this.data.length;
        this._save();
        return count;
    }

    // For bulk replacement (e.g. restoring state)
    _setData(newData) {
        this.data = newData;
        this._save();
    }
}

class JsonDB {
    constructor(prefix) {
        this.prefix = prefix || (window.APP_CONSTANTS?.DB_PREFIX) || 'deepseek_db::';
        this.collections = {};
    }

    _getKey(name) {
        return this.prefix + name;
    }

    collection(name) {
        if (!this.collections[name]) {
            this.collections[name] = new Collection(name, this);
        }
        return this.collections[name];
    }

    // --- IO ---

    async _syncToServer(collectionName, data) {
        // Map collection names to files for better organization
        const fileMap = {
            'logs': 'chat_logs.json',
            'users': 'user_profile.json',
            'sessions': 'sessions.json'
        };

        // If collectionName is missing (e.g. manual export), default to db_index
        const filename = collectionName ? (fileMap[collectionName] || `${collectionName}.json`) : 'db_index.json';
        const content = data ? data : this.exportToJson(true);

        const payload = {
            filename: filename,
            content: content
        };

        // Determine API URL
        let apiUrl = '/api/save';
        if (window.location.protocol === 'file:') {
            apiUrl = 'http://localhost:8000/api/save'; // Fallback for direct file opening
            console.warn("⚠️ You are opening via file://. Please use http://localhost:8000 for best results.");
        }

        try {
            await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log(`[JsonDB] Synced ${filename} to server.`);
        } catch (e) {
            console.error(`[JsonDB] Sync failed for ${filename}. Is server.py running?`, e);
        }
    }

    exportToJson(asObject = false) {
        const dump = {};
        // We need to know generic known collections, or scan local storage
        // For simplicity, we define the known ones or just scan our instantiated ones.
        // Use constants for collection names
        const collectionNames = window.APP_CONSTANTS ?
            Object.values(window.APP_CONSTANTS.COLLECTIONS) :
            ['users', 'sessions', 'logs'];
        collectionNames.forEach(name => {
            dump[name] = this.collection(name).data;
        });

        return JSON.stringify(dump, null, 2);
    }

    downloadBackup() {
        const json = this.exportToJson();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deepseek_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

window.JsonDB = new JsonDB();
