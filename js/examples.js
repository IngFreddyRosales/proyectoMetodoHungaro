// Pre-configured Example Scenarios for Demo

const exampleScenarios = {
    small: {
        name: "Pequeño (3 Silos)",
        hub: { lat: -17.783375, lng: -63.182061 },
        silos: [
            { lat: -17.790000, lng: -63.170000 },
            { lat: -17.775000, lng: -63.175000 },
            { lat: -17.795000, lng: -63.195000 }
        ],
        trucks: [
            { lat: -17.788000, lng: -63.168000 },
            { lat: -17.772000, lng: -63.180000 },
            { lat: -17.798000, lng: -63.190000 }
        ]
    },
    
    medium: {
        name: "Mediano (5 Silos)",
        hub: { lat: -17.783375, lng: -63.182061 },
        silos: [
            { lat: -17.790000, lng: -63.170000 },
            { lat: -17.775000, lng: -63.175000 },
            { lat: -17.795000, lng: -63.195000 },
            { lat: -17.770000, lng: -63.185000 },
            { lat: -17.800000, lng: -63.178000 }
        ],
        trucks: [
            { lat: -17.788000, lng: -63.168000 },
            { lat: -17.772000, lng: -63.180000 },
            { lat: -17.798000, lng: -63.190000 },
            { lat: -17.768000, lng: -63.188000 },
            { lat: -17.802000, lng: -63.175000 }
        ]
    },
    
    large: {
        name: "Grande (8 Silos - Real Santa Cruz)",
        hub: { lat: -17.783375, lng: -63.182061 }, // Centro de Santa Cruz
        silos: [
            { lat: -17.750000, lng: -63.150000 }, // Norte
            { lat: -17.820000, lng: -63.140000 }, // Sur-Oeste
            { lat: -17.760000, lng: -63.220000 }, // Este
            { lat: -17.800000, lng: -63.200000 }, // Sur-Este
            { lat: -17.770000, lng: -63.160000 }, // Norte-Oeste
            { lat: -17.790000, lng: -63.170000 }, // Centro-Oeste
            { lat: -17.795000, lng: -63.210000 }, // Sur-Este 2
            { lat: -17.765000, lng: -63.190000 }  // Norte-Este
        ],
        trucks: [
            { lat: -17.755000, lng: -63.155000 },
            { lat: -17.815000, lng: -63.145000 },
            { lat: -17.765000, lng: -63.215000 },
            { lat: -17.805000, lng: -63.195000 },
            { lat: -17.775000, lng: -63.165000 },
            { lat: -17.785000, lng: -63.175000 },
            { lat: -17.800000, lng: -63.205000 },
            { lat: -17.770000, lng: -63.185000 }
        ]
    },
    
    asymmetric: {
        name: "Asimétrico (Prueba de Optimización)",
        hub: { lat: -17.783375, lng: -63.182061 },
        silos: [
            { lat: -17.750000, lng: -63.150000 }, // Muy lejos norte
            { lat: -17.785000, lng: -63.180000 }, // Muy cerca
            { lat: -17.820000, lng: -63.210000 }, // Lejos sur-este
            { lat: -17.775000, lng: -63.185000 }  // Cerca
        ],
        trucks: [
            { lat: -17.820000, lng: -63.150000 }, // Lejos de su silo ideal
            { lat: -17.750000, lng: -63.210000 }, // Opuesto
            { lat: -17.788000, lng: -63.175000 }, // Centro
            { lat: -17.770000, lng: -63.190000 }  // Centro-Este
        ]
    }
};

/**
 * Carga un escenario de ejemplo
 * @param {string} scenarioName - Nombre del escenario
 */
function loadExampleScenario(scenarioName) {
    const scenario = exampleScenarios[scenarioName];
    if (!scenario) {
        console.error('Escenario no encontrado:', scenarioName);
        return;
    }
    
    console.log(`Cargando escenario: ${scenario.name}`);
    
    // Clear current state
    clearAll();
    
    // Set hub
    setHub(scenario.hub.lat, scenario.hub.lng);
    
    // Add silos
    setMode('silos');
    scenario.silos.forEach(silo => {
        addSilo(silo.lat, silo.lng);
    });
    
    // Add trucks
    setMode('trucks');
    scenario.trucks.forEach(truck => {
        addTruck(truck.lat, truck.lng);
    });
    
    // Fit map to show all points
    const allPoints = [
        scenario.hub,
        ...scenario.silos,
        ...scenario.trucks
    ];
    
    const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
    
    // Update UI
    updateStatus();
    updateItemsList();
    checkOptimizeEnabled();
    
    // Show notification
    showNotification(`Escenario "${scenario.name}" cargado exitosamente`);
}

/**
 * Muestra notificación temporal
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
