/**
 * Application Constants
 * Centralized magic strings and configuration values
 */

const APP_CONSTANTS = {
    // Collection Names
    COLLECTIONS: {
        USERS: 'users',
        SESSIONS: 'sessions',
        LOGS: 'logs'
    },

    // User Keys
    USER: {
        CURRENT_USER_ID: 'current_user'
    },

    // Mode IDs
    MODES: {
        NOVICE: 'zone_novice',
        DUNGEON: 'zone_dungeon',
        TOWER: 'zone_tower',
        LIBRARY: 'mode_qa'
    },

    // LocalStorage Prefix
    DB_PREFIX: 'deepseek_db::',

    // API Configuration
    API: {
        DEEPSEEK_URL: 'https://api.deepseek.com/chat/completions',
        DEEPSEEK_MODEL: 'deepseek-chat',
        TEMPERATURE: 1.3
    },

    // Server Configuration
    SERVER: {
        PORT: 8000,
        LOCAL_API_URL: 'http://localhost:8000/api/save'
    },

    // Timing
    DEBOUNCE_MS: 500,
    STARTUP_ANIMATION_DELAY: 1500,
    STARTUP_TOTAL_DURATION: 4000
};

window.APP_CONSTANTS = APP_CONSTANTS;
