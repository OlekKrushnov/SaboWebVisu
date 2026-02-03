// ============================================================================
// SPLASH SCREEN
// ============================================================================

/**
 * Initialisiert und steuert den Splash Screen
 * Dauer: 4 Sekunden, dann Animation des Logos zur Topbar
 */
function initSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const splashLogo = document.getElementById('splash-logo');
    const topbarLogo = document.getElementById('topbar-logo');

    if (!splashScreen || !splashLogo) {
        // Kein Splash Screen, direkt App starten
        document.body.classList.remove('app-loading');
        loadPage('home', document.querySelector('a[onclick*="home"]'));
        return;
    }

    // Phase 1: Splash anzeigen (3 Sekunden warten)
    setTimeout(() => {
        // Phase 2: Logo zur Topbar animieren
        splashLogo.classList.add('animate-to-topbar');

        // Text ausblenden
        const splashContent = document.querySelector('.splash-content');
        if (splashContent) {
            splashContent.querySelectorAll('p').forEach(p => {
                p.style.opacity = '0';
                p.style.transition = 'opacity 0.5s ease';
            });
        }

        // Phase 3: Nach Logo-Animation - Splash ausblenden und App freigeben
        setTimeout(() => {
            // Topbar-Logo sichtbar machen
            if (topbarLogo) {
                topbarLogo.style.opacity = '1';
            }

            // Splash ausblenden
            splashScreen.classList.add('hidden');

            // App-Interaktion freigeben
            document.body.classList.remove('app-loading');

            // Home-Seite laden
            loadPage('home', document.querySelector('a[onclick*="home"]'));

            // Splash nach Transition entfernen
            setTimeout(() => {
                splashScreen.remove();
            }, 1000);

        }, 1000); // 1 Sekunde für Logo-Animation

    }, 3000); // 3 Sekunden Splash-Anzeige
}

// Splash Screen beim Laden starten
document.addEventListener('DOMContentLoaded', initSplashScreen);

// ============================================================================
// MENU & NAVIGATION
// ============================================================================

function toggleMenu() {
    const menu = document.getElementById('side-menu');
    const icon = document.getElementById('burger-icon');
    menu.classList.toggle('open');
    icon.classList.toggle('open');
}

async function loadPage(pageName, element = null) {
    const mainContent = document.getElementById('main-content');
    const headerTitle = document.getElementById('fix-header-title');
    const bottomBar = document.getElementById('room-bottom-bar');

    const pageTitles = { 'home': 'Smart Home', 'raeume': 'Meine Räume', 'szenen': 'Meine Szenen', 'sensorik': 'Sensorik', 'cameras': 'Kameras' };

    // WICHTIG: Event Listener vom Temperatur-Slider aufräumen wenn man die Seite verlässt
    if (typeof cleanupSliderListeners === 'function') {
        cleanupSliderListeners();
    }

    // Reset Bottombar bei jedem Seitenwechsel
    if (bottomBar) bottomBar.classList.remove('visible');
    if (mainContent) mainContent.classList.remove('with-bottom-bar');

    try {
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) throw new Error('Seite nicht gefunden');
        const html = await response.text();

        mainContent.innerHTML = html;
        mainContent.className = 'container fade-in';
        if (pageName === 'raeume') {
            generateRoomGrid();
        }
        if (pageName === 'home') {
            updateWeatherWidget();
            updateGreeting();
            renderGlobalScenes();
        }
        if (pageName === 'settings') {
            renderSettingsEditor();
        }
        if (pageName === 'sensorik') {
            renderSensorikPage();
        }
        if (pageName === 'szenen') {
            renderSzenenPage();
        }

        if (headerTitle && pageTitles[pageName]) headerTitle.innerText = pageTitles[pageName];

        if (element) {
            document.querySelectorAll('#side-menu a').forEach(a => a.classList.remove('active'));
            element.classList.add('active');
            const menu = document.getElementById('side-menu');
            if (window.innerWidth <= 1024 && menu.classList.contains('open')) toggleMenu();
        }
        return true;
    } catch (error) {
        console.error("Fehler:", error);
        return false;
    }
}

/**
 * Zeitbasierte Begrüßung
 */
function updateGreeting() {
    const greetingEl = document.getElementById('greeting-text');
    const dateEl = document.getElementById('greeting-date');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting;
    let icon;

    if (hour >= 5 && hour < 12) {
        greeting = 'Guten Morgen';
        icon = '☀️';
    } else if (hour >= 12 && hour < 14) {
        greeting = 'Guten Mittag';
        icon = '🌤️';
    } else if (hour >= 14 && hour < 18) {
        greeting = 'Guten Nachmittag';
        icon = '🌅';
    } else if (hour >= 18 && hour < 22) {
        greeting = 'Guten Abend';
        icon = '🌆';
    } else {
        greeting = 'Gute Nacht';
        icon = '🌙';
    }

    greetingEl.innerHTML = `${icon} ${greeting}`;

    // Datum formatieren
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('de-DE', options);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Lade gespeicherte Dark Mode Präferenz
    loadThemePreference();

    setTimeout(() => {
        loadPage('home').then(() => {
            const homeLink = document.querySelector('#side-menu ul li a');
            if (homeLink) homeLink.classList.add('active');
        });
    }, 100);
});

/**
 * Erzeugt die Raum-Kacheln mit modernem Glassmorphism-Design
 * VERBESSERT: Lichter zeigen jetzt "3/4" wenn 3 von 4 an sind
 * VERBESSERT: Heizungs-Badge zeigt rot/blau wenn aktiv
 */
function generateRoomGrid() {
    const grid = document.getElementById('dynamic-room-grid');
    if (!grid) return;

    grid.innerHTML = '';

    Object.keys(roomData).forEach(key => {
        const room = roomData[key];

        // Zähle Lichter
        const allLights = room.controls.filter(c => c.type === 'light' || c.type === 'dimmer' || c.type === 'rgb');
        const lightsOn = allLights.filter(c => c.status === 1).length;
        const totalLights = allLights.length;
        const isAnyLightOn = lightsOn > 0;

        // Storen zählen
        const blindCount = room.controls.filter(c => c.type === 'blend').length;

        // Heizungs-Status prüfen
        const hasHeating = room.controls.some(c => c.type === 'heat');
        let heatingClass = '';
        if (hasHeating) {
            // Heizung ist aktiv wenn targetTemp > currentTemp (Heizen) oder targetTemp < currentTemp (Kühlen)
            if (systemConfig.mode) {
                // Heizmodus
                if (room.targetTemp > room.currentTemp) {
                    heatingClass = 'heat-active';
                }
            } else {
                // Kühlmodus
                if (room.targetTemp < room.currentTemp) {
                    heatingClass = 'cool-active';
                }
            }
        }

        const card = document.createElement('div');
        card.className = 'room-card-glass fade-in';
        card.onclick = () => renderRoomDetail(key);

        card.innerHTML = `
            <div class="room-card-bg"></div>
            <div class="room-card-content">
                <div class="room-header">
                    <div class="room-icon-wrapper">
                        <span class="room-icon-large">${room.icon}</span>
                        ${isAnyLightOn ? '<span class="light-glow"></span>' : ''}
                    </div>
                    <h3 class="room-title">${room.title}</h3>
                </div>
                
                <div class="room-climate">
                    <div class="climate-main">
                        <span class="temp-display">${room.currentTemp}°</span>
                        <span class="temp-unit">C</span>
                    </div>
                    <div class="climate-humidity">
                        <span class="material-icons humidity-icon">water_drop</span>
                        <span>${room.humidity}%</span>
                    </div>
                </div>
                
                <div class="room-devices">
                    ${totalLights > 0 ? `
                        <div class="device-badge ${isAnyLightOn ? 'light-active' : ''}">
                            <span class="material-icons">lightbulb</span>
                            <span>${lightsOn}/${totalLights}</span>
                        </div>
                    ` : ''}
                    ${blindCount > 0 ? `
                        <div class="device-badge">
                            <span class="material-icons">blinds</span>
                            <span>${blindCount}</span>
                        </div>
                    ` : ''}
                    ${hasHeating ? `
                        <div class="device-badge ${heatingClass}">
                            <span class="material-icons">thermostat</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

/**
 * Befüllt das Wetter-Widget mit Logik für Sonne/Mond, 
 * Himmelsrichtungen und Alarm-Farben.
 */
function updateWeatherWidget() {
    const tempEl = document.getElementById('out-temp');
    if (!tempEl) return;

    // 1. Temperatur inkl. Einheit °C
    const tempValue = weatherData.temperature;
    tempEl.innerText = tempValue.toFixed(1) + " °C"; // Einheit hier hinzufügen

    tempEl.classList.remove('temp-cold', 'temp-hot');
    if (weatherData.alarms.temp) {
        if (tempValue < 10) {
            tempEl.classList.add('temp-cold');
        } else {
            tempEl.classList.add('temp-hot');
        }
    }

    // 2. Windgeschwindigkeit inkl. Einheit m/s
    const windEl = document.getElementById('wind-value');
    // Wir setzen die Zahl und die Einheit mit einem Umbruch dazwischen
    windEl.innerHTML = `${weatherData.windSpeed.toFixed(1)}<br><span class="unit-text">m/s</span>`;

    if (weatherData.alarms.wind) {
        windEl.classList.add('alarm-active');
    } else {
        windEl.classList.remove('alarm-active');
    }

    // --- Rest der Funktion (Sonne/Mond/Himmelsrichtung) bleibt gleich ---
    const sunIcon = document.getElementById('sun-moon-icon');
    const sunText = document.getElementById('sun-pos-text');
    const elevation = weatherData.sunPosition.elevation;

    if (elevation < 0) {
        sunIcon.innerText = 'nightlight_round';
        sunText.innerText = '';
    } else {
        sunIcon.innerText = 'wb_sunny';
        sunText.innerText = getCardinalDirection(weatherData.sunPosition.azimuth);
    }

    document.getElementById('lux-value').innerText = weatherData.brightness.toLocaleString();
    const rainEl = document.getElementById('rain-status');
    rainEl.innerText = weatherData.isRaining ? "Es regnet" : "Trocken";
    rainEl.classList.toggle('rain-active', weatherData.isRaining);
}

/**
 * Hilfsfunktion zur Umrechnung von Grad in die 16-teilige Windrose
 * (22,5° Schritte für Werte wie Süd-Südost)
 */
function getCardinalDirection(angle) {
    // Die 16 Richtungen im Uhrzeigersinn
    const directions = [
        'Norden', 'Nord-Nordost', 'Nordost', 'Ost-Nordost',
        'Osten', 'Ost-Südost', 'Südost', 'Süd-Südost',
        'Süden', 'Süd-Südwest', 'Südwest', 'West-Südwest',
        'Westen', 'West-Nordwest', 'Nordwest', 'Nord-Nordwest'
    ];

    // 360 / 16 = 22.5 Grad pro Segment. 
    // Wir addieren 11.25 (halbes Segment), um die Werte um den Mittelpunkt zu runden.
    const index = Math.round(angle / 22.5) % 16;

    return directions[index];
}


function toggleDarkMode() {
    const body = document.body;
    const icon = document.querySelector('#theme-toggle .material-icons');

    // Toggle Dark Theme
    body.classList.toggle('dark-theme');

    // Speichere Präferenz in localStorage
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');

    // Icon Wechsel mit Animation
    icon.style.transition = 'transform 0.3s ease';
    icon.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        if (isDark) {
            icon.innerText = 'light_mode';
        } else {
            icon.innerText = 'dark_mode';
        }
        icon.style.transform = 'rotate(0deg)';
    }, 150);
}

// Lade gespeicherte Dark Mode Präferenz beim Start (Standard: Dark Mode)
function loadThemePreference() {
    const darkMode = localStorage.getItem('darkMode');
    const body = document.body;
    const icon = document.querySelector('#theme-toggle .material-icons');

    // Standard ist jetzt Dark Mode (wenn nichts gespeichert oder 'enabled')
    if (darkMode === 'disabled') {
        // Explizit Light Mode gewählt
        if (icon) icon.innerText = 'dark_mode';
    } else {
        // Dark Mode als Standard
        body.classList.add('dark-theme');
        if (icon) icon.innerText = 'light_mode';
    }
}
