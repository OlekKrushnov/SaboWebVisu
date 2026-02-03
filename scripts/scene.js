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

    const scenes = roomScenes[roomId] || [];

    grid.innerHTML = '';

    if (scenes.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:50px; color:#888;">
                <p>Keine Szenen für diesen Raum definiert.</p>
            </div>
        `;
        return;
    }

    scenes.forEach(scene => {
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
                        <p class="scene-desc">${scene.description}</p>
                    </div>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}
