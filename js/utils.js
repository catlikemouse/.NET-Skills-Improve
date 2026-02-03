/**
 * Utility Functions
 * Shared helpers to reduce code duplication
 */

const Utils = {

    /**
     * Debounce function - delays execution until after wait milliseconds
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 500) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Clean AI response by removing settlement command JSON blocks
     * Extracts and returns both cleaned content and parsed command
     * @param {string} content - Raw AI response content
     * @returns {{cleanContent: string, command: object|null}} Cleaned content and parsed command
     */
    parseAIResponse(content) {
        let cleanContent = content;
        let command = null;

        // Match the LAST code block/JSON at the end of the message
        const lastBlockRegex = /(?:```(?:json)?\s*)?(\{[\s\S]*?\})\s*(?:```)?\s*$/i;
        const match = content.match(lastBlockRegex);

        if (match) {
            const blockText = match[1];
            // Must contain 'cmd' AND 'settle' to be recognized as system command
            if (blockText.includes('"cmd"') && blockText.includes('"settle"')) {
                try {
                    // Clean trailing commas before parsing
                    const jsonStr = blockText.replace(/,\s*}/g, '}');
                    command = JSON.parse(jsonStr);
                    // Remove the command block from display content
                    cleanContent = content.replace(match[0], '').trim();
                } catch (e) {
                    console.warn('Failed to parse AI command:', e);
                }
            }
        }

        return { cleanContent, command };
    },

    /**
     * Sanitize HTML content to prevent XSS attacks
     * Basic sanitization - removes script tags and event handlers
     * @param {string} html - HTML content to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html) {
        // If DOMPurify is available, use it
        if (window.DOMPurify) {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
                    'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div'
                ],
                ALLOWED_ATTR: ['href', 'target', 'class', 'id', 'style']
            });
        }

        // Fallback: Basic sanitization
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    },

    /**
     * Simple Base64 encode/decode for API key obfuscation
     * Note: This is NOT encryption, just basic obfuscation
     */
    obfuscate: {
        encode(str) {
            if (!str) return '';
            try {
                return btoa(encodeURIComponent(str));
            } catch (e) {
                return str;
            }
        },
        decode(str) {
            if (!str) return '';
            try {
                return decodeURIComponent(atob(str));
            } catch (e) {
                return str;
            }
        }
    },

    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

window.Utils = Utils;
