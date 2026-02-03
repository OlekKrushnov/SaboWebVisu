/**
 * SCENE MODULE
 * Zentrale Szenen-Verwaltung für globale und raumspezifische Szenen.
 * Szenen sind vordefinierte Gerätezustände, die auf Knopfdruck aktiviert werden.
 */

/**
 * Globale Szenen - verfügbar auf der Home-Seite
 */
const globalScenes = [
    {
        id: 'alles-aus',
        name: 'Alles Aus',
        icon: '🌙',
        description: 'Schaltet alle Lichter aus',
        actions: [
            { room: '*', deviceType: 'light', property: 'status', value: 0 },
            { room: '*', deviceType: 'dimmer', property: 'status', value: 0 },
            { room: '*', deviceType: 'rgb', property: 'status', value: 0 }
        ]
    },
    {
        id: 'willkommen',
        name: 'Willkommen',
        icon: '🏠',
        description: 'Eingangsbeleuchtung an',
        actions: [
            { room: 'wohnzimmer', device: 'Deckenlicht', property: 'status', value: 1 },
            { room: 'wohnzimmer', device: 'Deckenlicht', property: 'dimmer', value: 180 }
        ]
    },
    {
        id: 'gute-nacht',
        name: 'Gute Nacht',
        icon: '😴',
        description: 'Alles aus, Schlafzimmer gedimmt',
        actions: [
            { room: '*', deviceType: 'light', property: 'status', value: 0 },
            { room: '*', deviceType: 'dimmer', property: 'status', value: 0 },
            { room: 'schlafzimmer', device: 'Nachttisch', property: 'status', value: 1 }
        ]
    },
    {
        id: 'storen-auf',
        name: 'Storen Auf',
        icon: '☀️',
        description: 'Alle Storen hochfahren',
        actions: [
            { room: '*', deviceType: 'blend', property: 'position', value: 0 }
        ]
    },
    {
        id: 'storen-zu',
        name: 'Storen Zu',
        icon: '🌑',
        description: 'Alle Storen schließen',
        actions: [
            { room: '*', deviceType: 'blend', property: 'position', value: 100 }
        ]
    }
];

/**
 * Raumspezifische Szenen - pro Raum individuell
 */
const roomScenes = {
    'wohnzimmer': [
        {
            id: 'film',
            name: 'Film',
            icon: '🎬',
            description: 'Ambiente gedimmt, Storen zu',
            actions: [
                { device: 'Deckenlicht', property: 'status', value: 0 },
                { device: 'Ambiente', property: 'status', value: 1 },
                { device: 'Ambiente', property: 'dimmer', value: 60 },
                { device: 'Ambiente', property: 'r', value: 255 },
                { device: 'Ambiente', property: 'g', value: 100 },
                { device: 'Ambiente', property: 'b', value: 50 },
                { device: 'Storen West', property: 'position', value: 100 },
                { device: 'Storen Süd', property: 'position', value: 100 }
            ]
        },
        {
            id: 'entspannen',
            name: 'Entspannen',
            icon: '🧘',
            description: 'Warmes, gedimmtes Licht',
            actions: [
                { device: 'Stehlampe', property: 'status', value: 1 },
                { device: 'Deckenlicht', property: 'status', value: 1 },
                { device: 'Deckenlicht', property: 'dimmer', value: 80 },
                { device: 'Ambiente2', property: 'status', value: 1 },
                { device: 'Ambiente2', property: 'dimmer', value: 100 }
            ]
        },
        {
            id: 'hell',
            name: 'Hell',
            icon: '💡',
            description: 'Maximale Helligkeit',
            actions: [
                { device: 'Stehlampe', property: 'status', value: 1 },
                { device: 'Deckenlicht', property: 'status', value: 1 },
                { device: 'Deckenlicht', property: 'dimmer', value: 255 }
            ]
        }
    ],
    'kueche': [
        {
            id: 'kochen',
            name: 'Kochen',
            icon: '👨‍🍳',
            description: 'Volle Beleuchtung',
            actions: [
                { device: 'Hauptlicht', property: 'status', value: 1 }
            ]
        }
    ],
    'schlafzimmer': [
        {
            id: 'lesen',
            name: 'Lesen',
            icon: '📖',
            description: 'Nachttischlampe an',
            actions: [
                { device: 'Nachttisch', property: 'status', value: 1 }
            ]
        },
        {
            id: 'schlafen',
            name: 'Schlafen',
            icon: '💤',
            description: 'Alles aus',
            actions: [
                { device: 'Nachttisch', property: 'status', value: 0 }
            ]
        }
    ],
    'bad': [
        {
            id: 'morgen',
            name: 'Morgen',
            icon: '🌅',
            description: 'Helle Spiegelbeleuchtung',
            actions: [
                { device: 'Spiegel', property: 'status', value: 1 }
            ]
        }
    ]
};

/**
 * Führt eine Szene aus und aktualisiert alle betroffenen Geräte in data.js
 * @param {Object} scene - Das Szenen-Objekt
 * @param {string} roomId - Optional: Room-ID für raumspezifische Szenen
 */
function executeScene(scene, roomId = null) {
    scene.actions.forEach(action => {
        if (action.room === '*') {
            // Globale Aktion: Alle Räume betroffen
            Object.keys(roomData).forEach(rId => {
                applyActionToRoom(rId, action);
            });
        } else if (action.room) {
            // Spezifischer Raum in globaler Szene
            applyActionToRoom(action.room, action);
        } else if (roomId) {
            // Raumspezifische Szene
            applyActionToRoom(roomId, action);
        }
    });

    // Visuelles Feedback
    showSceneToast(scene.name);
}

/**
 * Wendet eine Aktion auf einen Raum an
 */
function applyActionToRoom(roomId, action) {
    const room = roomData[roomId];
    if (!room) return;

    room.controls.forEach(device => {
        // Nach Gerätetyp filtern
        if (action.deviceType && device.type !== action.deviceType) return;
        // Nach Gerätename filtern
        if (action.device && device.name !== action.device) return;

        // Eigenschaft setzen
        if (action.property in device || action.property === 'status') {
            device[action.property] = action.value;
        }
    });
}

/**
 * Zeigt eine Toast-Benachrichtigung für ausgeführte Szenen
 */
function showSceneToast(sceneName) {
    // Bestehenden Toast entfernen
    const existing = document.querySelector('.scene-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'scene-toast';
    toast.innerHTML = `
        <span class="material-icons">check_circle</span>
        <span>${sceneName} aktiviert</span>
    `;
    document.body.appendChild(toast);

    // Animation: Einblenden
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Nach 2 Sekunden ausblenden
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/**
 * Rendert globale Szenen-Karten für die Home-Seite
 */
function renderGlobalScenes() {
    const container = document.getElementById('global-scenes-grid');
    if (!container) return;

    container.innerHTML = '';

    globalScenes.forEach(scene => {
        const card = document.createElement('div');
        card.className = 'scene-card-glass fade-in';
        card.onclick = () => executeScene(scene);

        card.innerHTML = `
            <div class="scene-card-bg"></div>
            <div class="scene-card-content">
                <span class="scene-icon">${scene.icon}</span>
                <span class="scene-name">${scene.name}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

/**
 * Rendert raumspezifische Szenen für die Raum-Detailansicht
 */
function renderRoomScenes(roomId) {
    const grid = document.getElementById('dynamic-controls');
    if (!grid) return;

    // Vordefinierte + User-Szenen kombinieren
    const predefinedScenes = roomScenes[roomId] || [];
    const userScenes = userRoomScenes[roomId] || [];
    const allScenes = [...predefinedScenes, ...userScenes];

    grid.innerHTML = '';

    allScenes.forEach(scene => {
        const isUserScene = userScenes.includes(scene);
        const card = document.createElement('div');
        card.className = 'scene-card-glass scene-card-room fade-in';
        card.onclick = () => {
            executeScene(scene, roomId);
            // Nach Ausführung kurz warten und UI aktualisieren
            setTimeout(() => filterRoomDevices('light'), 100);
        };

        card.innerHTML = `
            <div class="scene-card-bg"></div>
            <div class="scene-card-content">
                <div class="scene-header">
                    <span class="scene-icon-large">${scene.icon}</span>
                    <div class="scene-info">
                        <h3 class="scene-title">${scene.name}</h3>
                        <p class="scene-desc">${scene.description || ''}</p>
                    </div>
                </div>
                ${isUserScene ? `
                    <button class="scene-delete-btn" onclick="event.stopPropagation(); deleteUserScene('${scene.id}', '${roomId}')">
                        <span class="material-icons">delete</span>
                    </button>
                ` : ''}
            </div>
        `;

        grid.appendChild(card);
    });

    // "Neue Szene" Button am Ende
    const addCard = document.createElement('div');
    addCard.className = 'scene-card-glass scene-card-room add-scene-card fade-in';
    addCard.onclick = () => openSceneEditor(roomId);
    addCard.innerHTML = `
        <div class="scene-card-bg"></div>
        <div class="scene-card-content add-scene-content">
            <span class="material-icons add-scene-icon">add</span>
            <span class="add-scene-text">Neue Szene</span>
        </div>
    `;
    grid.appendChild(addCard);
}

// ============================================================================
// USER SCENES - LocalStorage Persistenz
// ============================================================================

/**
 * Benutzerdefinierte Szenen (werden über Storage API geladen)
 */
let userGlobalScenes = [];
let userRoomScenes = {};

/**
 * Lädt User-Szenen über Storage API
 */
async function loadUserScenes() {
    try {
        const globalData = await Storage.load('userGlobalScenes', []);
        const roomData = await Storage.load('userRoomScenes', {});

        userGlobalScenes = globalData;
        userRoomScenes = roomData;
    } catch (e) {
        console.error('Fehler beim Laden der User-Szenen:', e);
    }
}

/**
 * Speichert User-Szenen über Storage API
 */
async function saveUserScenes() {
    try {
        await Storage.save('userGlobalScenes', userGlobalScenes);
        await Storage.save('userRoomScenes', userRoomScenes);
    } catch (e) {
        console.error('Fehler beim Speichern der User-Szenen:', e);
    }
}

/**
 * Fügt eine neue User-Szene hinzu
 * @param {Object} scene - Das Szenen-Objekt
 * @param {string|null} roomId - null = global, sonst Raum-ID
 */
async function addUserScene(scene, roomId = null) {
    scene.id = 'user_' + Date.now();

    if (roomId) {
        if (!userRoomScenes[roomId]) userRoomScenes[roomId] = [];
        userRoomScenes[roomId].push(scene);
    } else {
        userGlobalScenes.push(scene);
    }

    await saveUserScenes();
}

/**
 * Löscht eine User-Szene
 */
async function deleteUserScene(sceneId, roomId = null) {
    if (roomId) {
        if (userRoomScenes[roomId]) {
            userRoomScenes[roomId] = userRoomScenes[roomId].filter(s => s.id !== sceneId);
            await saveUserScenes();
            renderRoomScenes(roomId);
        }
    } else {
        userGlobalScenes = userGlobalScenes.filter(s => s.id !== sceneId);
        await saveUserScenes();
        renderSzenenPage();
    }
    showSceneToast('Szene gelöscht');
}

// User-Szenen beim Start laden
loadUserScenes();

// ============================================================================
// SZENEN-SEITE (Globale Szenen)
// ============================================================================

/**
 * Rendert die globale Szenen-Seite
 */
function renderSzenenPage() {
    const container = document.getElementById('szenen-page-grid');
    if (!container) return;

    container.innerHTML = '';

    // Vordefinierte Szenen
    globalScenes.forEach(scene => {
        container.appendChild(createGlobalSceneCard(scene, false));
    });

    // User-Szenen
    userGlobalScenes.forEach(scene => {
        container.appendChild(createGlobalSceneCard(scene, true));
    });

    // "Neue Szene" Button am Ende
    const addCard = document.createElement('div');
    addCard.className = 'scene-card-glass add-scene-card fade-in';
    addCard.onclick = () => openSceneEditor(null);
    addCard.innerHTML = `
        <div class="scene-card-bg"></div>
        <div class="scene-card-content add-scene-content">
            <span class="material-icons add-scene-icon">add</span>
            <span class="add-scene-text">Neue Szene</span>
        </div>
    `;
    container.appendChild(addCard);
}

/**
 * Erstellt eine Szenen-Karte für die globale Seite
 */
function createGlobalSceneCard(scene, isUserScene) {
    const card = document.createElement('div');
    card.className = 'scene-card-glass fade-in';
    card.onclick = () => executeScene(scene);

    card.innerHTML = `
        <div class="scene-card-bg"></div>
        <div class="scene-card-content">
            <span class="scene-icon">${scene.icon}</span>
            <span class="scene-name">${scene.name}</span>
            ${scene.description ? `<span class="scene-desc-small">${scene.description}</span>` : ''}
            ${isUserScene ? `
                <button class="scene-delete-btn" onclick="event.stopPropagation(); deleteUserScene('${scene.id}', null)">
                    <span class="material-icons">delete</span>
                </button>
            ` : ''}
        </div>
    `;

    return card;
}

// ============================================================================
// SZENEN-EDITOR MODAL
// ============================================================================

let currentEditorRoomId = null;
const availableIcons = ['🎬', '🌙', '💡', '🎉', '🌅', '🏠', '😴', '☀️', '🧘', '📖', '👨‍🍳', '💤', '🔆', '🌈'];

/**
 * Öffnet den Szenen-Editor
 * @param {string|null} roomId - null = globale Szene
 */
function openSceneEditor(roomId = null) {
    currentEditorRoomId = roomId;

    // Verfügbare Geräte sammeln
    let devices = [];
    if (roomId) {
        // Nur Geräte aus diesem Raum
        const room = roomData[roomId];
        if (room) {
            devices = room.controls
                .filter(d => ['light', 'dimmer', 'rgb'].includes(d.type))
                .map(d => ({ ...d, roomId, roomTitle: room.title }));
        }
    } else {
        // Alle Geräte aus allen Räumen (für globale Szenen)
        Object.keys(roomData).forEach(rId => {
            const room = roomData[rId];
            room.controls
                .filter(d => ['light', 'dimmer', 'rgb'].includes(d.type))
                .forEach(d => {
                    devices.push({ ...d, roomId: rId, roomTitle: room.title });
                });
        });
    }

    // Modal erstellen
    const modal = document.createElement('div');
    modal.className = 'scene-editor-modal';
    modal.id = 'scene-editor-modal';
    modal.onclick = (e) => { if (e.target === modal) closeSceneEditor(); };

    modal.innerHTML = `
        <div class="scene-editor-content">
            <div class="scene-editor-header">
                <h2>${roomId ? 'Raum-Szene erstellen' : 'Globale Szene erstellen'}</h2>
                <button class="scene-editor-close" onclick="closeSceneEditor()">
                    <span class="material-icons">close</span>
                </button>
            </div>
            
            <div class="scene-editor-body">
                <div class="editor-field">
                    <label>Name</label>
                    <input type="text" id="scene-name-input" placeholder="Meine Szene" maxlength="30">
                </div>
                
                <div class="editor-field">
                    <label>Icon</label>
                    <div class="icon-selector" id="icon-selector">
                        ${availableIcons.map((icon, i) => `
                            <span class="icon-option ${i === 0 ? 'selected' : ''}" data-icon="${icon}" onclick="selectSceneIcon(this)">${icon}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="editor-field">
                    <label>Geräte auswählen</label>
                    <div class="device-selector" id="device-selector">
                        ${devices.map((d, i) => `
                            <div class="device-selector-item" data-index="${i}">
                                <label class="device-checkbox-label">
                                    <input type="checkbox" class="device-checkbox" data-device="${d.name}" data-room="${d.roomId}" data-type="${d.type}"
                                           onchange="toggleDeviceConfig(this)">
                                    <span class="device-checkbox-icon">${d.icon}</span>
                                    <span class="device-checkbox-name">${d.name}</span>
                                    ${!roomId ? `<span class="device-checkbox-room">${d.roomTitle}</span>` : ''}
                                </label>
                                <div class="device-config hidden" id="config-${i}">
                                    <div class="config-row">
                                        <label>Status:</label>
                                        <select class="config-status">
                                            <option value="1">An</option>
                                            <option value="0">Aus</option>
                                        </select>
                                    </div>
                                    ${d.type === 'dimmer' || d.type === 'rgb' ? `
                                        <div class="config-row">
                                            <label>Helligkeit:</label>
                                            <input type="range" min="0" max="255" value="128" class="config-dimmer">
                                            <span class="config-dimmer-value">50%</span>
                                        </div>
                                    ` : ''}
                                    ${d.type === 'rgb' ? `
                                        <div class="config-row">
                                            <label>Farbe:</label>
                                            <input type="color" value="#ff6600" class="config-color">
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="scene-editor-footer">
                <button class="btn-cancel" onclick="closeSceneEditor()">Abbrechen</button>
                <button class="btn-save" onclick="saveSceneFromEditor()">Szene speichern</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Dimmer Slider Event Listener
    modal.querySelectorAll('.config-dimmer').forEach(slider => {
        slider.oninput = () => {
            const valueSpan = slider.nextElementSibling;
            valueSpan.textContent = Math.round(slider.value / 255 * 100) + '%';
        };
    });

    // Animation
    requestAnimationFrame(() => modal.classList.add('show'));
}

/**
 * Schließt den Szenen-Editor
 */
function closeSceneEditor() {
    const modal = document.getElementById('scene-editor-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Icon im Editor auswählen
 */
function selectSceneIcon(el) {
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
}

/**
 * Zeigt/versteckt Geräte-Konfiguration
 */
function toggleDeviceConfig(checkbox) {
    const item = checkbox.closest('.device-selector-item');
    const config = item.querySelector('.device-config');
    config.classList.toggle('hidden', !checkbox.checked);
}

/**
 * Speichert die Szene aus dem Editor
 */
function saveSceneFromEditor() {
    const name = document.getElementById('scene-name-input').value.trim();
    if (!name) {
        showSceneToast('Bitte einen Namen eingeben');
        return;
    }

    const selectedIcon = document.querySelector('.icon-option.selected');
    const icon = selectedIcon ? selectedIcon.dataset.icon : '🎬';

    const actions = [];
    document.querySelectorAll('.device-checkbox:checked').forEach(checkbox => {
        const item = checkbox.closest('.device-selector-item');
        const deviceName = checkbox.dataset.device;
        const roomId = checkbox.dataset.room;
        const deviceType = checkbox.dataset.type;

        const statusSelect = item.querySelector('.config-status');
        const status = parseInt(statusSelect.value);

        // Status-Aktion
        if (currentEditorRoomId) {
            actions.push({ device: deviceName, property: 'status', value: status });
        } else {
            actions.push({ room: roomId, device: deviceName, property: 'status', value: status });
        }

        // Dimmer-Aktion
        const dimmerSlider = item.querySelector('.config-dimmer');
        if (dimmerSlider) {
            const dimValue = parseInt(dimmerSlider.value);
            if (currentEditorRoomId) {
                actions.push({ device: deviceName, property: 'dimmer', value: dimValue });
            } else {
                actions.push({ room: roomId, device: deviceName, property: 'dimmer', value: dimValue });
            }
        }

        // RGB-Aktion
        const colorInput = item.querySelector('.config-color');
        if (colorInput && deviceType === 'rgb') {
            const hex = colorInput.value;
            const r = parseInt(hex.substr(1, 2), 16);
            const g = parseInt(hex.substr(3, 2), 16);
            const b = parseInt(hex.substr(5, 2), 16);

            if (currentEditorRoomId) {
                actions.push({ device: deviceName, property: 'r', value: r });
                actions.push({ device: deviceName, property: 'g', value: g });
                actions.push({ device: deviceName, property: 'b', value: b });
            } else {
                actions.push({ room: roomId, device: deviceName, property: 'r', value: r });
                actions.push({ room: roomId, device: deviceName, property: 'g', value: g });
                actions.push({ room: roomId, device: deviceName, property: 'b', value: b });
            }
        }
    });

    if (actions.length === 0) {
        showSceneToast('Bitte mindestens ein Gerät auswählen');
        return;
    }

    const scene = {
        name,
        icon,
        description: '',
        actions
    };

    addUserScene(scene, currentEditorRoomId);
    closeSceneEditor();

    // UI aktualisieren
    if (currentEditorRoomId) {
        renderRoomScenes(currentEditorRoomId);
    } else {
        renderSzenenPage();
    }

    showSceneToast('Szene erstellt');
}

