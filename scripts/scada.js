// SpiderControl Initialisierung
var scada;

// Warten bis SpiderControl geladen ist
window.addEventListener('load', function() {
    try {
        // SpiderControl SCADA Objekt erstellen
        scada = new ScadaWebAPI();
        
        // Verbindung herstellen
        scada.onConnectionChanged = function(connected) {
            if (connected) {
                document.getElementById('connection-status').textContent = 'Verbunden';
                console.log('SpiderControl verbunden');
                // Werte lesen starten
                startReadingValues();
            } else {
                document.getElementById('connection-status').textContent = 'Getrennt';
                console.log('SpiderControl getrennt');
            }
        };
        
        // Verbindung aufbauen
        scada.connect();
        
    } catch(e) {
        console.error('Fehler beim Initialisieren von SpiderControl:', e);
        document.getElementById('connection-status').textContent = 'Fehler';
    }
})