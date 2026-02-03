/**
 * LIGHT MODULE
 * Zuständig für die Initialisierung und Steuerung von Lichtquellen.
 * Unterstützt: Standard-Licht (An/Aus), Dimmer (0-255) und RGB (Farbton & Helligkeit).
 */

/**
 * Initialisiert eine Licht-Kachel mit Status, Klick-Events und Mindestwerten.
 * @param {HTMLElement} card - Das DOM-Element der Kachel.
 * @param {Object} device - Das Daten-Objekt aus data.js.
 */
function initLightCard(card, device) {
    // Falls das Gerät laut Daten eingeschaltet ist, visuelle Klassen setzen
    if (device.status === 1) {
        card.classList.add('is-on');
        // Bei Dimmer/RGB die Deckkraft (Opacity) basierend auf dem Dimmwert setzen
        if (device.type === 'dimmer' || device.type === 'rgb') {
            updateCardBrightness(card, device.dimmer);
        }
        // Bei RGB die gespeicherten R-G-B Werte als CSS-Variablen setzen
        if (device.type === 'rgb') {
            updateCardRGBColor(card, device.r, device.g, device.b);
        }
    }

    /**
     * Klick-Logik: Schaltet das Gerät um und prüft Mindest-Dimmwerte.
     */
    card.onclick = function () {
        const isCurrentlyOn = device.status === 1;

        if (isCurrentlyOn) {
            // Ausschalten
            device.status = 0;
            this.classList.remove('is-on');

            if (device.type === 'dimmer' || device.type === 'rgb') {
                updateCardBrightness(this, 0);
            }
        } else {
            // Einschalten
            device.status = 1;
            this.classList.add('is-on');

            // "Smart-On": Wenn Dimmer auf 0 steht -> auf Mindestwert springen
            if ((device.type === 'dimmer' || device.type === 'rgb') && device.dimmer === 0) {
                device.dimmer = systemConfig.minDimLevel || 25;
                const sliders = this.querySelectorAll('.dimmer-slider');
                sliders.forEach(slider => slider.value = device.dimmer);
            }

            // Visuelle Updates der Kachelfarbe/Helligkeit
            if (device.type === 'dimmer' || device.type === 'rgb') {
                updateCardBrightness(this, device.dimmer);
            }
            if (device.type === 'rgb') {
                updateCardRGBColor(this, device.r, device.g, device.b);
            }
        }
    };
}

/**
 * Setzt die CSS-Variable für die Deckkraft (Opacity) der Kachel-Hintergrundfarbe.
 * @param {HTMLElement} card - Die zu aktualisierende Kachel.
 * @param {number} val - Dimmwert von 0 bis 255.
 */
function updateCardBrightness(card, val) {
    const opacity = val / 255;
    card.style.setProperty('--dim-opacity', opacity);
}

/**
 * Setzt die RGB-Variablen im CSS, damit der Rahmen und Hintergrund leuchten.
 */
function updateCardRGBColor(card, r, g, b) {
    card.style.setProperty('--r', r);
    card.style.setProperty('--g', g);
    card.style.setProperty('--b', b);
}

/**
 * Event-Handler für den Dimmer-Slider.
 * VERBESSERT: Status wird auf 0 gesetzt wenn Dimmer auf 0, auf 1 wenn > 0
 */
function handleDimmerInput(event, slider, deviceName) {
    const val = parseInt(slider.value);
    const card = slider.closest('.device-card-glass');
    const room = roomData[currentRoomId];
    const device = room.controls.find(d => d.name === deviceName);

    if (!device) return;
    device.dimmer = val; // Wert in data.js persistent speichern

    // WICHTIG: Status basierend auf Slider-Wert setzen
    if (val > 0) {
        device.status = 1;
        card.classList.add('is-on');
    } else {
        // Bei 0 → Ausschalten
        device.status = 0;
        card.classList.remove('is-on');
    }

    updateCardBrightness(card, val);
}

/**
 * Event-Handler für den RGB-Farb-Slider (Hue).
 */
function handleRGBInput(event, slider, deviceName) {
    const hue = parseInt(slider.value);
    const card = slider.closest('.device-card-glass');
    const controlsContainer = slider.closest('.device-controls');
    const room = roomData[currentRoomId];
    const device = room.controls.find(d => d.name === deviceName);

    if (!device) return;

    // Umrechnung des Farbtons (Hue) in echte RGB-Werte für die Speicherung
    const rgb = hslToRgb(hue / 360, 1, 0.5);
    device.r = rgb[0];
    device.g = rgb[1];
    device.b = rgb[2];

    // RGB-Slider schaltet das Licht ein
    device.status = 1;
    card.classList.add('is-on');

    updateCardRGBColor(card, device.r, device.g, device.b);
    updateCardBrightness(card, device.dimmer);

    // Aktualisiere den Helligkeitsslider mit der neuen Farbe
    // Suche im gleichen Controls-Container nach dem Dimmer-Slider
    const dimmerSlider = controlsContainer.querySelector('.rgb-dimmer-slider');
    if (dimmerSlider) {
        const rgbColor = `rgb(${device.r}, ${device.g}, ${device.b})`;
        dimmerSlider.style.background = `linear-gradient(to right, rgba(0,0,0,0.3) 0%, ${rgbColor} 100%)`;
    }
}

// --- Farbumrechnungs-Algorithmen (Mathematik) ---

/**
 * Konvertiert HSL-Werte in RGB (Array [r, g, b]).
 * Notwendig, da Slider mit Hue (Farbkreis) arbeiten, Lampen aber oft RGB benötigen.
 */
function hslToRgb(h, s, l) {
    let r, g, b;
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Berechnet den Hue-Wert (0-360) aus RGB. 
 * Wird beim Laden der Seite genutzt, um den Slider-Knopf an die richtige Farb-Position zu setzen.
 */
function rgbToHue(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h;
    const d = max - min;
    if (max === min) h = 0;
    else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return Math.round(h * 360);
}
