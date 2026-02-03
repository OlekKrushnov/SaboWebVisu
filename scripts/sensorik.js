/**
 * SENSORIK MODULE
 * Verwaltung von Bewegungsmeldern, Minuterien (Zeitschalter) und 
 * anderen Sensoren mit konfigurierbaren Parametern.
 */

/**
 * Sensor-Konfigurationsdaten
 * - minuterie: Zeitschalter (automatisches Ausschalten nach Zeit)
 * - motion: Bewegungsmelder (Zeit + Lux-Schwellwert)
 * - presence: Präsenzmelder
 */
const sensorConfig = {
    minuterien: [
        {
            id: 'flur-licht',
            name: 'Flur Licht',
            room: 'Flur',
            icon: '⏱️',
            duration: 180, // Sekunden
            minDuration: 30,
            maxDuration: 600
        },
        {
            id: 'eingang-licht',
            name: 'Eingang',
            room: 'Eingang',
            icon: '⏱️',
            duration: 120,
            minDuration: 30,
            maxDuration: 600
        },
        {
            id: 'garage-licht',
            name: 'Garage',
            room: 'Garage',
            icon: '⏱️',
            duration: 300,
            minDuration: 60,
            maxDuration: 900
        }
    ],
    motionSensors: [
        {
            id: 'wohnzimmer-bm',
            name: 'Wohnzimmer',
            room: 'wohnzimmer',
            icon: '👁️',
            timeout: 300,      // Sekunden bis Ausschalten
            luxThreshold: 200, // Lux-Schwellwert (unter diesem Wert aktiv)
            minTimeout: 60,
            maxTimeout: 900,
            minLux: 0,
            maxLux: 1000
        },
        {
            id: 'flur-bm',
            name: 'Flur',
            room: 'Flur',
            icon: '👁️',
            timeout: 180,
            luxThreshold: 100,
            minTimeout: 60,
            maxTimeout: 600,
            minLux: 0,
            maxLux: 500
        },
        {
            id: 'bad-bm',
            name: 'Bad',
            room: 'bad',
            icon: '👁️',
            timeout: 600,
            luxThreshold: 150,
            minTimeout: 120,
            maxTimeout: 1200,
            minLux: 0,
            maxLux: 500
        }
    ]
};

/**
 * Rendert die Sensorik-Einstellungsseite
 */
function renderSensorikPage() {
    const container = document.getElementById('sensorik-content');
    if (!container) return;

    container.innerHTML = `
        <section class="sensor-section fade-in">
            <h2 class="section-title">
                <span class="material-icons">timer</span>
                Minuterien
            </h2>
            <p class="section-desc">Zeitgesteuerte Ausschaltung nach Ablauf</p>
            <div class="sensor-grid" id="minuterie-grid"></div>
        </section>
        
        <section class="sensor-section fade-in">
            <h2 class="section-title">
                <span class="material-icons">sensors</span>
                Bewegungsmelder
            </h2>
            <p class="section-desc">Automatisches Schalten bei Bewegung</p>
            <div class="sensor-grid" id="motion-grid"></div>
        </section>
    `;

    renderMinuterien();
    renderMotionSensors();
}

/**
 * Rendert die Minuterien-Karten
 */
function renderMinuterien() {
    const grid = document.getElementById('minuterie-grid');
    if (!grid) return;

    sensorConfig.minuterien.forEach(sensor => {
        const card = createSensorCard(sensor, 'minuterie');
        grid.appendChild(card);
    });
}

/**
 * Rendert die Bewegungsmelder-Karten
 */
function renderMotionSensors() {
    const grid = document.getElementById('motion-grid');
    if (!grid) return;

    sensorConfig.motionSensors.forEach(sensor => {
        const card = createSensorCard(sensor, 'motion');
        grid.appendChild(card);
    });
}

/**
 * Erstellt eine Sensor-Konfigurationskarte
 */
function createSensorCard(sensor, type) {
    const card = document.createElement('div');
    card.className = 'sensor-card-glass fade-in';

    if (type === 'minuterie') {
        card.innerHTML = `
            <div class="sensor-card-bg"></div>
            <div class="sensor-card-content">
                <div class="sensor-header">
                    <span class="sensor-icon">${sensor.icon}</span>
                    <div class="sensor-info">
                        <h3 class="sensor-name">${sensor.name}</h3>
                        <span class="sensor-room">${sensor.room}</span>
                    </div>
                </div>
                <div class="sensor-control">
                    <label class="sensor-label">Nachlaufzeit</label>
                    <div class="sensor-slider-container">
                        <input type="range" 
                               class="sensor-slider" 
                               min="${sensor.minDuration}" 
                               max="${sensor.maxDuration}" 
                               value="${sensor.duration}"
                               oninput="updateMinuterieValue('${sensor.id}', this)">
                        <span class="sensor-value" id="val-${sensor.id}">${formatDuration(sensor.duration)}</span>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'motion') {
        card.innerHTML = `
            <div class="sensor-card-bg"></div>
            <div class="sensor-card-content">
                <div class="sensor-header">
                    <span class="sensor-icon">${sensor.icon}</span>
                    <div class="sensor-info">
                        <h3 class="sensor-name">${sensor.name}</h3>
                        <span class="sensor-room">${sensor.room}</span>
                    </div>
                </div>
                <div class="sensor-control">
                    <label class="sensor-label">Nachlaufzeit</label>
                    <div class="sensor-slider-container">
                        <input type="range" 
                               class="sensor-slider" 
                               min="${sensor.minTimeout}" 
                               max="${sensor.maxTimeout}" 
                               value="${sensor.timeout}"
                               oninput="updateMotionTimeout('${sensor.id}', this)">
                        <span class="sensor-value" id="timeout-${sensor.id}">${formatDuration(sensor.timeout)}</span>
                    </div>
                </div>
                <div class="sensor-control">
                    <label class="sensor-label">Lux-Schwellwert</label>
                    <div class="sensor-slider-container">
                        <input type="range" 
                               class="sensor-slider lux-slider" 
                               min="${sensor.minLux}" 
                               max="${sensor.maxLux}" 
                               value="${sensor.luxThreshold}"
                               oninput="updateMotionLux('${sensor.id}', this)">
                        <span class="sensor-value" id="lux-${sensor.id}">${sensor.luxThreshold} Lux</span>
                    </div>
                </div>
            </div>
        `;
    }

    return card;
}

/**
 * Formatiert Sekunden in lesbares Format (z.B. "2:30 min")
 */
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} Sek`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}:${String(sec).padStart(2, '0')} Min` : `${min} Min`;
}

/**
 * Update-Handler für Minuterien
 */
function updateMinuterieValue(sensorId, slider) {
    const value = parseInt(slider.value);
    const sensor = sensorConfig.minuterien.find(s => s.id === sensorId);
    if (sensor) {
        sensor.duration = value;
        document.getElementById(`val-${sensorId}`).textContent = formatDuration(value);
    }
}

/**
 * Update-Handler für Bewegungsmelder Timeout
 */
function updateMotionTimeout(sensorId, slider) {
    const value = parseInt(slider.value);
    const sensor = sensorConfig.motionSensors.find(s => s.id === sensorId);
    if (sensor) {
        sensor.timeout = value;
        document.getElementById(`timeout-${sensorId}`).textContent = formatDuration(value);
    }
}

/**
 * Update-Handler für Bewegungsmelder Lux-Schwellwert
 */
function updateMotionLux(sensorId, slider) {
    const value = parseInt(slider.value);
    const sensor = sensorConfig.motionSensors.find(s => s.id === sensorId);
    if (sensor) {
        sensor.luxThreshold = value;
        document.getElementById(`lux-${sensorId}`).textContent = `${value} Lux`;
    }
}
