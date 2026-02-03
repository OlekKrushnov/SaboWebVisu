/**
 * API ABSTRACTION LAYER
 * 
 * Diese Datei abstrahiert alle Datenspeicherungs- und Kommunikationsoperationen.
 * Aktuell: LocalStorage
 * Später: REST API + WebSocket zu Node-RED
 * 
 * KONFIGURATION:
 * - USE_API = false: LocalStorage (GitHub Pages / Offline)
 * - USE_API = true:  REST API + WebSocket (Raspberry Pi mit Node-RED)
 */

const API_CONFIG = {
    USE_API: false,                    // Auf true setzen wenn Node-RED Backend aktiv
    API_BASE_URL: '/api',              // REST API Basis-URL
    WS_URL: 'ws://localhost:1880/ws',  // WebSocket URL für Echtzeit-Updates
};

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

const Storage = {
    /**
     * Speichert Daten (Key-Value)
     * @param {string} key - Schlüssel
     * @param {any} data - Daten (wird zu JSON serialisiert)
     * @returns {Promise<boolean>} Erfolg
     */
    async save(key, data) {
        if (API_CONFIG.USE_API) {
            return await this._apiSave(key, data);
        } else {
            return this._localSave(key, data);
        }
    },

    /**
     * Lädt Daten
     * @param {string} key - Schlüssel
     * @param {any} defaultValue - Standardwert falls nicht vorhanden
     * @returns {Promise<any>} Geladene Daten oder defaultValue
     */
    async load(key, defaultValue = null) {
        if (API_CONFIG.USE_API) {
            return await this._apiLoad(key, defaultValue);
        } else {
            return this._localLoad(key, defaultValue);
        }
    },

    /**
     * Löscht Daten
     * @param {string} key - Schlüssel
     * @returns {Promise<boolean>} Erfolg
     */
    async remove(key) {
        if (API_CONFIG.USE_API) {
            return await this._apiRemove(key);
        } else {
            return this._localRemove(key);
        }
    },

    // --- LocalStorage Implementation ---
    _localSave(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('LocalStorage save error:', e);
            return false;
        }
    },

    _localLoad(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('LocalStorage load error:', e);
            return defaultValue;
        }
    },

    _localRemove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('LocalStorage remove error:', e);
            return false;
        }
    },

    // --- REST API Implementation (für später) ---
    async _apiSave(key, data) {
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/storage/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (e) {
            console.error('API save error:', e);
            // Fallback auf LocalStorage
            return this._localSave(key, data);
        }
    },

    async _apiLoad(key, defaultValue) {
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/storage/${key}`);
            if (response.ok) {
                return await response.json();
            }
            return defaultValue;
        } catch (e) {
            console.error('API load error:', e);
            // Fallback auf LocalStorage
            return this._localLoad(key, defaultValue);
        }
    },

    async _apiRemove(key) {
        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/storage/${key}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (e) {
            console.error('API remove error:', e);
            return this._localRemove(key);
        }
    }
};

// ============================================================================
// WEBSOCKET MANAGER (für Echtzeit-Updates von Node-RED)
// ============================================================================

const RealtimeConnection = {
    socket: null,
    listeners: new Map(),
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,

    /**
     * Verbindet zum WebSocket Server
     */
    connect() {
        if (!API_CONFIG.USE_API) {
            console.log('WebSocket: API-Modus deaktiviert, keine Verbindung');
            return;
        }

        try {
            this.socket = new WebSocket(API_CONFIG.WS_URL);

            this.socket.onopen = () => {
                console.log('WebSocket: Verbunden');
                this.reconnectAttempts = 0;
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this._handleMessage(message);
                } catch (e) {
                    console.error('WebSocket: Parse error', e);
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket: Verbindung geschlossen');
                this._attemptReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket: Fehler', error);
            };

        } catch (e) {
            console.error('WebSocket: Konnte nicht verbinden', e);
        }
    },

    /**
     * Sendet eine Nachricht an Node-RED
     * @param {string} type - Nachrichtentyp
     * @param {any} payload - Daten
     */
    send(type, payload) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        }
    },

    /**
     * Registriert einen Listener für einen Nachrichtentyp
     * @param {string} type - Nachrichtentyp (z.B. 'deviceUpdate', 'sceneExecuted')
     * @param {function} callback - Callback-Funktion
     */
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    },

    /**
     * Verarbeitet eingehende Nachrichten
     */
    _handleMessage(message) {
        const { type, payload } = message;

        // Allgemeine Listener benachrichtigen
        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => callback(payload));
        }

        // Spezielle Handler für bekannte Nachrichtentypen
        switch (type) {
            case 'deviceUpdate':
                // Gerätezustand von SPS aktualisiert
                this._updateDeviceState(payload);
                break;
            case 'weatherUpdate':
                // Wetterdaten aktualisiert
                this._updateWeatherData(payload);
                break;
        }
    },

    /**
     * Aktualisiert Gerätezustand in data.js
     */
    _updateDeviceState(payload) {
        const { roomId, deviceName, property, value } = payload;
        if (roomData[roomId]) {
            const device = roomData[roomId].controls.find(d => d.name === deviceName);
            if (device) {
                device[property] = value;
                // UI-Update triggern wenn nötig
                if (typeof filterRoomDevices === 'function' && currentRoomId === roomId) {
                    // Aktuellen Tab beibehalten
                }
            }
        }
    },

    /**
     * Aktualisiert Wetterdaten
     */
    _updateWeatherData(payload) {
        Object.assign(weatherData, payload);
        if (typeof updateWeatherWidget === 'function') {
            updateWeatherWidget();
        }
    },

    /**
     * Reconnect-Logik
     */
    _attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`WebSocket: Reconnect-Versuch ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), 3000);
        }
    }
};

// ============================================================================
// SPS KOMMUNIKATION (über Node-RED)
// ============================================================================

const SPS = {
    /**
     * Schreibt einen Wert an die SPS (via Node-RED)
     * @param {string} variable - ADS-Variablenname (z.B. 'GVL.bLight_Kitchen')
     * @param {any} value - Zu schreibender Wert
     */
    async write(variable, value) {
        if (!API_CONFIG.USE_API) {
            console.log(`SPS.write (simuliert): ${variable} = ${value}`);
            return true;
        }

        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/sps/write`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variable, value })
            });
            return response.ok;
        } catch (e) {
            console.error('SPS write error:', e);
            return false;
        }
    },

    /**
     * Liest einen Wert von der SPS
     * @param {string} variable - ADS-Variablenname
     * @returns {Promise<any>} Gelesener Wert
     */
    async read(variable) {
        if (!API_CONFIG.USE_API) {
            console.log(`SPS.read (simuliert): ${variable}`);
            return null;
        }

        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/sps/read/${variable}`);
            if (response.ok) {
                const data = await response.json();
                return data.value;
            }
            return null;
        } catch (e) {
            console.error('SPS read error:', e);
            return null;
        }
    },

    /**
     * Führt eine Szene auf der SPS aus
     * @param {string} sceneId - Szenen-ID
     */
    async executeScene(sceneId) {
        if (!API_CONFIG.USE_API) {
            console.log(`SPS.executeScene (simuliert): ${sceneId}`);
            return true;
        }

        try {
            const response = await fetch(`${API_CONFIG.API_BASE_URL}/sps/scene/${sceneId}`, {
                method: 'POST'
            });
            return response.ok;
        } catch (e) {
            console.error('SPS executeScene error:', e);
            return false;
        }
    }
};

// ============================================================================
// INITIALISIERUNG
// ============================================================================

// WebSocket-Verbindung starten wenn API-Modus aktiv
if (API_CONFIG.USE_API) {
    document.addEventListener('DOMContentLoaded', () => {
        RealtimeConnection.connect();
    });
}

console.log(`API Layer initialisiert (Modus: ${API_CONFIG.USE_API ? 'API' : 'LocalStorage'})`);
