/**
 * SMART HOME DATA CONFIGURATION
 * Dieses File fungiert als zentrale Datenbank (State Management) der Anwendung.
 * Alle Zustände der Geräte werden hier initial definiert und zur Laufzeit aktualisiert.
 */

/**
 * Globale System-Konfiguration
 * @property {number} minDimLevel - Schwellenwert: Verhindert, dass Lichter beim Einschalten auf 0% (dunkel) stehen.
 * @property {number} mode - Aktueller Heizungs-Betriebsmodus
 */
const systemConfig = {
    mode: true, // 0 = Cooling, 1 = Heating (Global für alle Räume)
    minDimLevel: 25, // Standard-Helligkeit beim Einschalten (0-255)
};

const roomData = {
    'wohnzimmer': {
        title: 'Wohnzimmer',
        icon: '🛋️',
        currentTemp: 22,
        targetTemp: 23,
        humidity: 45,
        controls: [
            { name: 'Stehlampe', type: 'light', icon: '💡', status: 0 }, // Einfaches Licht
            { name: 'Deckenlicht', type: 'dimmer', icon: '💡', status: 1, dimmer: 128},  // Dimmbares Licht
            { name: 'Ambiente', type: 'rgb', icon: '🌈', status: 0, dimmer: 200, r: 255, g: 0, b: 0},
            { name: 'Ambiente2', type: 'rgb', icon: '🌈', status: 1, dimmer: 150, r: 100, g: 200, b: 70},
            { name: 'Storen West', type: 'blend', icon: '🪟', duration: 25, position: 0 },
            { name: 'Storen Süd', type: 'blend', icon: '🪟', duration: 40, position: 0 },
            { name: 'Heizung', type: 'heat', icon: '🌡️' }
            
        ]
    },
    'kueche': {
        title: 'Küche',
        icon: '🍳',
        currentTemp: 22,
        targetTemp: 23,
        humidity: 50,
        controls: [
            { name: 'Hauptlicht', type: 'light', icon: '💡', status: 1},
            { name: 'Heizung', type: 'heat', icon: '🌡️' }
        ]
    },
    'schlafzimmer': {
        title: 'Schlafzimmer',
        icon: '🛏️',
        currentTemp: 22,
        targetTemp: 23,
        humidity: 60,
        controls: [
            { name: 'Nachttisch', type: 'light', icon: '💡', status: 0 },
            { name: 'Heizung', type: 'heat', icon: '🌡️' }
        ]
    },
    'bad': {
        title: 'Bad',
        icon: '🚿',
        currentTemp: 24,
        targetTemp: 23,
        humidity: 48,
        controls: [
            { name: 'Spiegel', type: 'light', icon: '💡', status: 0},
            { name: 'Heizung', type: 'heat', icon: '🌡️' }
        ]
    },

};

/**
 * WETTERSTATION DATA (KNX Hager TXE531)
 * Enthält alle Messwerte der externen Sensoren.
 */
const weatherData = {
    temperature: 4.5,        // Außentemperatur in °C
    brightness: 15000,      // Helligkeit in Lux (0..100.000)
    windSpeed: 3.2,         // Windgeschwindigkeit in m/s
    isRaining: false,       // Regensensor (True/False)
    dawn: 450,              // Dämmerungswert in Lux
    gps: {
        latitude: 47.05,    // Breitengrad
        longitude: 8.43,    // Längengrad
        altitude: 435       // Höhe über Meer
    },
    sunPosition: {
        azimuth: 112.5,       // Sonnenstand Horizontal (0-360°)
        elevation: 20       // Sonnenstand Vertikal (-90 bis +90°)
    },
    alarms: {
        wind: true,        // Windalarm (Schutz für Storen)
        temp: true,        // Temperaturalarm
        rain: false         // Regenalarm
    }
};