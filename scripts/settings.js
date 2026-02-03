/**
 * Erzeugt Eingabefelder für alle Parameter in systemConfig und weatherData
 */
function renderSettingsEditor() {
    const systemContainer = document.getElementById('system-config-editor');
    const weatherContainer = document.getElementById('weather-data-editor');

    if (!systemContainer || !weatherContainer) return;

    // 1. System Config rendern
    systemContainer.innerHTML = generateInputs(systemConfig, 'systemConfig');

    // 2. Wetter Daten rendern (flache Struktur + Alarme)
    weatherContainer.innerHTML = generateInputs(weatherData, 'weatherData');
}

/**
 * Hilfsfunktion zum Generieren der HTML-Inputs
 */
function generateInputs(obj, objName) {
    let html = '';
    for (let key in obj) {
        const value = obj[key];
        
        // Behandlung von verschachtelten Objekten (wie alarms, gps, sunPosition)
        if (typeof value === 'object' && value !== null) {
            html += `<div class="sub-section"><h4>${key}</h4>`;
            for (let subKey in value) {
                html += createInputRow(`${objName}.${key}.${subKey}`, subKey, value[subKey]);
            }
            html += `</div>`;
        } else {
            html += createInputRow(`${objName}.${key}`, key, value);
        }
    }
    return html;
}

function createInputRow(path, label, value) {
    // Erkennt automatisch boolean (true/false)
    const isBool = typeof value === 'boolean';
    const inputType = isBool ? 'checkbox' : 'number';
    const checked = isBool && value ? 'checked' : '';
    
    return `
        <div class="setting-row">
            <label>${label}</label>
            <input type="${inputType}" ${checked} 
                   value="${isBool ? '' : value}" 
                   onchange="updateGlobalState('${path}', this)">
        </div>
    `;
}

/**
 * Schreibt geänderte Werte direkt zurück in die data.js (globaler State)
 */
function updateGlobalState(path, input) {
    const keys = path.split('.');
    const rootKey = keys[0];
    
    // WICHTIG: Wenn es eine Checkbox ist, nimm .checked (boolean)
    // Wenn es ein Text/Zahlenfeld ist, nimm parseFloat
    let newValue;
    if (input.type === 'checkbox') {
        newValue = input.checked; 
    } else {
        newValue = parseFloat(input.value);
    }

    let targetObj = (rootKey === 'systemConfig') ? systemConfig : weatherData;

    let current = targetObj;
    for (let i = 1; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = newValue;
    console.log(`✅ State Update: ${path} =`, newValue);
}