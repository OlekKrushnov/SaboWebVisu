/**
 * ROOM CONTROLLER
 * Verwaltet die Anzeige der einzelnen Räume, das Filtern von Geräten 
 * und fungiert als Fabrik (Factory) für die Geräte-Kacheln.
 */
let currentRoomId = null;

/**
 * Lädt die Detailansicht eines Raumes.
 * @param {string} roomId - ID des Raumes aus data.js (z.B. 'livingroom').
 */
async function renderRoomDetail(roomId) {
    currentRoomId = roomId;
    const success = await loadPage('raum');
    if (!success) return;

    // Timeout stellt sicher, dass das DOM fertig geladen ist
    setTimeout(() => {
        const room = roomData[roomId];
        const headerTitle = document.getElementById('fix-header-title');
        const bottomBar = document.getElementById('room-bottom-bar');
        const mainContainer = document.getElementById('main-content');

        if (!room) return;

        // Header anpassen (Icon + Name)
        headerTitle.innerText = `${room.icon} ${room.title}`;

        // UI-Elemente für Raum-Modus einblenden
        bottomBar.classList.add('visible');
        mainContainer.classList.add('with-bottom-bar');

        // Standardmäßig die Licht-Kategorie anzeigen
        filterRoomDevices('light');
    }, 50);
}

/**
 * Filtert die Geräte eines Raumes nach Kategorie (Licht, Storen, Heizung).
 */
function filterRoomDevices(category) {
    const room = roomData[currentRoomId];
    const grid = document.getElementById('dynamic-controls');
    if (!room || !grid) return;

    // Aktiven Tab in der Bottom-Bar markieren
    document.querySelectorAll('.bottom-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`tab-${category}`)?.classList.add('active');

    grid.innerHTML = '';

    // Spezialfall: Szenen
    if (category === 'scene') {
        renderRoomScenes(currentRoomId);
        return;
    }

    if (category === 'heat') {
        // Spezialfall: Heizung nutzt oft ein ganz eigenes Layout (Circular Slider)
        // WICHTIG: roomId übergeben, damit die Temperatur richtig gespeichert wird
        renderCircularHeat(grid, room, currentRoomId);
    } else {
        // Kategorien-Mapping (z.B. 'light' beinhaltet auch Dimmer und RGB)
        let typesToFilter = (category === 'light') ? ['light', 'dimmer', 'rgb'] : [category];
        const devices = room.controls.filter(d => typesToFilter.includes(d.type));

        if (devices.length > 0) {
            // Für jedes gefundene Gerät eine Kachel erstellen
            devices.forEach(device => grid.appendChild(createDeviceCard(device)));
        } else {
            // Leer-Zustand anzeigen
            grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#888;"><p>Keine Geräte vorhanden.</p></div>`;
        }
    }
}

/**
 * Die "Factory"-Funktion: Erstellt das HTML-Grundgerüst für eine Kachel 
 * und delegiert die Fachlogik an die entsprechenden Module (Light, Blind, etc.).
 */
function createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'device-card-glass';
    card.dataset.type = device.type;

    // Animation nur einmal abspielen, dann Klasse entfernen
    card.classList.add('fade-in');
    card.addEventListener('animationend', () => {
        card.classList.remove('fade-in');
    }, { once: true });

    let controlHTML = '';

    // --- LICHT-LOGIK (LIGHT, DIMMER, RGB) ---
    if (device.type === 'light' || device.type === 'dimmer' || device.type === 'rgb') {
        // Licht-Logik initialisieren
        if (device.type === 'dimmer') {
            controlHTML = `
                <div class="device-controls">
                    <input type="range" min="0" max="255" value="${device.dimmer || 0}" 
                           class="modern-slider dimmer-slider" 
                           oninput="handleDimmerInput(event, this, '${device.name}')" 
                           onclick="event.stopPropagation()">
                    <div class="slider-label">Helligkeit</div>
                </div>`;
        } else if (device.type === 'rgb') {
            const initialHue = rgbToHue(device.r, device.g, device.b);
            // Helligkeitsslider bekommt die aktuelle RGB-Farbe als Gradient
            const rgbColor = `rgb(${device.r}, ${device.g}, ${device.b})`;
            controlHTML = `
                <div class="device-controls">
                    <input type="range" min="0" max="360" value="${initialHue}" 
                           class="modern-slider rgb-slider" 
                           oninput="handleRGBInput(event, this, '${device.name}')" 
                           onclick="event.stopPropagation()">
                    <div class="slider-label">Farbe</div>
                    <input type="range" min="0" max="255" value="${device.dimmer || 0}" 
                           class="modern-slider dimmer-slider rgb-dimmer-slider" 
                           style="background: linear-gradient(to right, rgba(0,0,0,0.3) 0%, ${rgbColor} 100%);"
                           oninput="handleDimmerInput(event, this, '${device.name}')" 
                           onclick="event.stopPropagation()">
                    <div class="slider-label">Helligkeit</div>
                </div>`;
        }
        // Übergabe an das Light-Modul für Event-Handling & Initialisierung
        initLightCard(card, device);

        // --- STOREN-LOGIK (BLIND) ---
    } else if (device.type === 'blend') {
        card.style.setProperty('--pos', `${device.position}%`);
        // Tages- oder Nachtzeit für Himmel-Darstellung
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 20;

        controlHTML = `
            <div class="blend-container-modern" onclick="event.stopPropagation()">
                <div class="blind-visual ${isNight ? 'night' : 'day'}">
                    <div class="window-sky"></div>
                    <div class="celestial-body"></div>
                    <div class="window-landscape"></div>
                    <div class="window-frame"></div>
                    <div class="blind-overlay"></div>
                </div>
                <div class="blend-controls-modern">
                    <button class="btn-modern btn-down">
                        <span class="material-icons">expand_more</span>
                        <span>Ab</span>
                    </button>
                    <button class="btn-modern btn-stop">
                        <span class="material-icons">stop</span>
                        <span>Stop</span>
                    </button>
                    <button class="btn-modern btn-up">
                        <span class="material-icons">expand_less</span>
                        <span>Auf</span>
                    </button>
                </div>
            </div>`;
    }

    // Grundgerüst zusammenbauen mit Glassmorphism
    card.innerHTML = `
        <div class="device-card-bg"></div>
        <div class="device-card-content">
            <div class="device-header">
                <div class="device-icon-wrapper">
                    <span class="device-icon">${device.icon}</span>
                </div>
                <h3 class="device-name">${device.name}</h3>
            </div>
            ${controlHTML}
        </div>`;

    if (device.type === 'blend') {
        setupStoreLogic(card, device);
    }

    return card;
}
