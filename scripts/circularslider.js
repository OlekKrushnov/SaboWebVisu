/**
 * Rendert das Heizungs-Dashboard mit 0,1°C Präzision
 */
function renderCircularHeat(container, room, roomId) {
    const heatDevice = room.controls.find(d => d.type === 'heat');
    if (!heatDevice) return;

    // WICHTIG: targetTemp kommt von room.targetTemp
    const targetTemp = room.targetTemp ? room.targetTemp.toFixed(1) : "21.0";
    const istTemp = room.currentTemp ? room.currentTemp.toFixed(1) : "--";
    const aussenTemp = weatherData.temperature ? weatherData.temperature.toFixed(1) : "--";
    const feuchte = room.humidity || "--";
    const modeText = systemConfig.mode ? 'Heizen' : 'Kühlen';
    const modeClass = systemConfig.mode ? 'mode-heat' : 'mode-cool';

    container.innerHTML = `
        <div class="heat-dashboard-wrapper fade-in">
            <div class="heat-container">
                <div class="slider">
                    <div class="knob">
                        <div class="rotator">
                            <div class="text" id="temp-val">${targetTemp}<span>°C</span></div>
                            <div class="status-icons">
                                <div id="flame-status" class="flame-icon">🔥</div>
                                <div id="snow-status" class="snow-icon">❄️</div>
                            </div>
                        </div>
                        <div class="pointer"><span class="material-icons">play_arrow</span></div>
                    </div>
                    <svg width="300" height="300">
                        <circle class="progress-circle" cx="150" cy="150" r="140"></circle>
                        <circle id="circle2" class="progress-circle" cx="150" cy="150" r="140" 
                                style="stroke: url(#heatGradient); stroke-width: 16px;"></circle>
                        <defs>
                            <linearGradient id="heatGradient" gradientUnits="userSpaceOnUse"
                                x1="0" y1="0" x2="100%" y2="0"
                                gradientTransform="rotate(220, 220, 0)">
                                <stop offset="0%" stop-color="#0000ff" />
                                <stop offset="100%" stop-color="#ff0000" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>

            <div class="heat-info-grid">
                <div class="info-box">
                    <span class="label">Ist-Temp</span>
                    <span class="value">${istTemp}°C</span>
                </div>
                <div class="info-box">
                    <span class="label">Aussen</span>
                    <span class="value">${aussenTemp}°C</span>
                </div>
                <div class="info-box">
                    <span class="label">Feuchte</span>
                    <span class="value">${feuchte}%</span>
                </div>
                <div class="info-box ${modeClass}">
                    <span class="label">Modus</span>
                    <span class="value">${modeText}</span>
                </div>
            </div>
        </div>`;

    initCircularSlider(roomId);
}

// KRITISCH: Globale Variablen für Event Listener Management
let isRotating = false;
let currentSliderRoomId = null;
let sliderMouseMoveHandler = null;
let sliderTouchMoveHandler = null;
let sliderMouseUpHandler = null;
let sliderTouchEndHandler = null;

/**
 * WICHTIG: Diese Funktion räumt alte Event Listener auf
 */
function cleanupSliderListeners() {
    if (sliderMouseMoveHandler) {
        window.removeEventListener("mousemove", sliderMouseMoveHandler);
        sliderMouseMoveHandler = null;
    }
    if (sliderTouchMoveHandler) {
        window.removeEventListener("touchmove", sliderTouchMoveHandler);
        sliderTouchMoveHandler = null;
    }
    if (sliderMouseUpHandler) {
        window.removeEventListener("mouseup", sliderMouseUpHandler);
        sliderMouseUpHandler = null;
    }
    if (sliderTouchEndHandler) {
        window.removeEventListener("touchend", sliderTouchEndHandler);
        sliderTouchEndHandler = null;
    }
    isRotating = false;
}

function initCircularSlider(roomId) {
    // KRITISCH: Zuerst alle alten Event Listener entfernen!
    cleanupSliderListeners();
    
    // Setze die aktuelle Raum-ID
    currentSliderRoomId = roomId;
    
    const knob = document.querySelector(".knob");
    const circle = document.getElementById("circle2");
    const pointer = document.querySelector(".pointer");
    const text = document.getElementById("temp-val");
    const flame = document.getElementById("flame-status");
    const snow = document.getElementById("snow-status");

    const minT = 15;
    const maxT = 25;

    const updateUI = (temp) => {
        // Mathematisch auf 0.1 runden
        const safeTemp = Math.min(Math.max(temp, minT), maxT);
        const percent = (safeTemp - minT) / (maxT - minT);
        
        const rotationAngle = percent * 270;
        pointer.style.transform = `rotate(${rotationAngle - 45}deg)`;
        circle.style.strokeDashoffset = 880 - (660 * percent);
        
        // Anzeige mit genau einer Nachkommastelle
        text.innerHTML = `${safeTemp.toFixed(1)}<span>°C</span>`;
        
        flame.classList.remove('flame-active');
        snow.classList.remove('snow-active');

        // Zugriff auf globales roomData Objekt
        const currentRoom = roomData[currentSliderRoomId];
        if (systemConfig.mode) { 
            if (safeTemp > currentRoom.currentTemp) flame.classList.add('flame-active');
        } else { 
            if (safeTemp < currentRoom.currentTemp) snow.classList.add('snow-active');
        }
    };

    // Initialisierung mit gespeicherter Temperatur
    updateUI(roomData[roomId].targetTemp || 21.0);

    // KRITISCH: handleRotate wird als Closure gespeichert mit der richtigen roomId
    const handleRotate = (e) => {
        // Nur rotieren wenn dieser Slider aktiv ist
        if (!isRotating || currentSliderRoomId !== roomId) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = knob.getBoundingClientRect();
        
        let angleRad = Math.atan2(clientY - (rect.top + rect.height / 2), clientX - (rect.left + rect.width / 2));
        let angleDeg = (angleRad * 180) / Math.PI;
        let rotationAngle = (angleDeg - 135 + 360) % 360;

        if (rotationAngle <= 270) {
            // Berechnung der Temperatur in 0.1 Schritten
            const rawTemp = minT + (rotationAngle / 270) * (maxT - minT);
            
            // KRITISCH: Direkt in das globale roomData Objekt schreiben
            // Verwende currentSliderRoomId statt roomId aus dem Closure
            roomData[currentSliderRoomId].targetTemp = Math.round(rawTemp * 10) / 10;
            
            updateUI(roomData[currentSliderRoomId].targetTemp);
        }
    };

    // Mouse/Touch Start Handler
    const handleStart = () => {
        isRotating = true;
    };

    const handleTouchStart = (e) => {
        isRotating = true;
        e.preventDefault();
    };

    // Mouse/Touch End Handler
    const handleEnd = () => {
        isRotating = false;
    };

    // Event Listener auf dem Knob (diese werden automatisch entfernt wenn der Knob aus dem DOM entfernt wird)
    knob.addEventListener("mousedown", handleStart);
    knob.addEventListener("touchstart", handleTouchStart, {passive: false});

    // KRITISCH: Diese Handler werden auf window registriert und müssen manuell entfernt werden
    sliderMouseMoveHandler = handleRotate;
    sliderTouchMoveHandler = handleRotate;
    sliderMouseUpHandler = handleEnd;
    sliderTouchEndHandler = handleEnd;

    window.addEventListener("mousemove", sliderMouseMoveHandler);
    window.addEventListener("touchmove", sliderTouchMoveHandler, {passive: false});
    window.addEventListener("mouseup", sliderMouseUpHandler);
    window.addEventListener("touchend", sliderTouchEndHandler);
}
