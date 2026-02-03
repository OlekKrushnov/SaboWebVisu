/**
 * BLIND MODULE
 * Zuständig für die Steuerung der Beschattung (Rolladen/Storen).
 * Nutzt CSS-Variables (--pos), um die Lamellen-Position visuell darzustellen.
 */

/**
 * Initialisiert die Logik für eine Storen-Kachel.
 * @param {HTMLElement} card - Das Kachel-Element im DOM.
 * @param {Object} device - Das Storen-Objekt aus data.js.
 */
function setupStoreLogic(card, device) {
    const btnDown = card.querySelector('.btn-down');
    const btnUp = card.querySelector('.btn-up');
    const btnStop = card.querySelector('.btn-stop');
    const blindVisual = card.querySelector('.blind-visual');

    if (device.position === undefined) device.position = 0;
    if (!device.duration || device.duration <= 0) device.duration = 20;

    // Slats und Positionsanzeige dynamisch generieren
    generateSlats(card, device);
    updatePositionIndicator(card, device.position);
    updateBlindVisual(card, device.position);

    let pressTimer;
    let isLongPress = false;
    let driveInterval = null;
    let activeBtn = null;

    const updatePosition = (direction) => {
        const currentPos = parseFloat(device.position);
        const duration = parseFloat(device.duration);
        const step = (100 / duration) / 10;

        let newPos = (direction === 'ab') ?
            Math.min(100, currentPos + step) :
            Math.max(0, currentPos - step);

        device.position = newPos;
        card.style.setProperty('--pos', `${newPos}%`);

        // Update alle visuellen Elemente
        updateBlindVisual(card, newPos);
        updatePositionIndicator(card, newPos);

        if (newPos <= 0 || newPos >= 100) stopMoving();
    };

    const startMoving = (direction) => {
        if (driveInterval) stopMoving();
        activeBtn = (direction === 'ab') ? btnDown : btnUp;
        activeBtn.classList.add('is-driving');

        // Visual Feedback: Rahmen animieren
        if (blindVisual) blindVisual.classList.add('is-moving');

        driveInterval = setInterval(() => updatePosition(direction), 100);
    };

    const stopMoving = () => {
        clearTimeout(pressTimer);
        if (driveInterval) {
            clearInterval(driveInterval);
            driveInterval = null;
        }
        if (activeBtn) {
            activeBtn.classList.remove('is-driving');
            activeBtn = null;
        }
        // Visual Feedback entfernen
        if (blindVisual) blindVisual.classList.remove('is-moving');
    };

    const handlePressStart = (direction) => {
        isLongPress = false;
        startMoving(direction);
        pressTimer = setTimeout(() => { isLongPress = true; }, 1000);
    };

    const handlePressEnd = () => { if (!isLongPress) stopMoving(); };

    // Events
    btnDown.addEventListener('mousedown', () => handlePressStart('ab'));
    btnDown.addEventListener('mouseup', handlePressEnd);
    btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); handlePressStart('ab'); }, { passive: false });
    btnDown.addEventListener('touchend', handlePressEnd);

    btnUp.addEventListener('mousedown', () => handlePressStart('auf'));
    btnUp.addEventListener('mouseup', handlePressEnd);
    btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); handlePressStart('auf'); }, { passive: false });
    btnUp.addEventListener('touchend', handlePressEnd);

    btnStop.addEventListener('click', () => { isLongPress = false; stopMoving(); });
}

/**
 * Generiert die visuellen Lamellen im Fenster
 */
function generateSlats(card, device) {
    const blindVisual = card.querySelector('.blind-visual');
    if (!blindVisual) return;

    // Slats Container hinzufügen
    let slatsContainer = blindVisual.querySelector('.blind-slats');
    if (!slatsContainer) {
        slatsContainer = document.createElement('div');
        slatsContainer.className = 'blind-slats';

        // Genug Lamellen für volle Abdeckung generieren
        for (let i = 0; i < 16; i++) {
            const slat = document.createElement('div');
            slat.className = 'blind-slat';
            slatsContainer.appendChild(slat);
        }

        blindVisual.appendChild(slatsContainer);
    }

    // Positionsanzeige hinzufügen
    let indicator = blindVisual.querySelector('.blind-position-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'blind-position-indicator';
        blindVisual.appendChild(indicator);
    }
}

/**
 * Aktualisiert den Positionsindikator
 */
function updatePositionIndicator(card, position) {
    const indicator = card.querySelector('.blind-position-indicator');
    if (indicator) {
        indicator.textContent = `${Math.round(position)}%`;
    }
}

/**
 * Aktualisiert alle visuellen Blind-Elemente
 */
function updateBlindVisual(card, position) {
    // Overlay-Höhe
    const overlay = card.querySelector('.blind-overlay');
    if (overlay) {
        overlay.style.height = `${position}%`;
    }

    // Slats-Container-Höhe
    const slatsContainer = card.querySelector('.blind-slats');
    if (slatsContainer) {
        slatsContainer.style.height = `${position}%`;
    }

    // CSS Variable für Sonnenlicht-Effekt
    const blindVisual = card.querySelector('.blind-visual');
    if (blindVisual) {
        blindVisual.style.setProperty('--pos-factor', position / 100);
    }
}