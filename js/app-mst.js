// Application State for MST + Hungarian System
const state = {
    hub: null,
    silos: [],
    trucks: [],
    mode: 'hub', // 'hub', 'silos', 'trucks'
    solution: null,
    layers: {
        mst: null,
        assignments: null
    }
};

// Map Initialization
const map = L.map('map').setView([-17.78337545862481, -63.182061518083216], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Icons
const hubIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const siloIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const truckIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Event Listeners
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    handleMapClick(lat, lng);
});

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        setMode(mode);
    });
});

document.getElementById('optimize-btn').addEventListener('click', runOptimization);
document.getElementById('clear-btn').addEventListener('click', clearAll);

// Example loading
const exampleSelect = document.getElementById('example-select');
const loadExampleBtn = document.getElementById('load-example-btn');

exampleSelect.addEventListener('change', () => {
    loadExampleBtn.disabled = !exampleSelect.value;
});

loadExampleBtn.addEventListener('click', () => {
    const scenarioName = exampleSelect.value;
    if (scenarioName) {
        loadExampleScenario(scenarioName);
        exampleSelect.value = '';
        loadExampleBtn.disabled = true;
    }
});

// Functions
function setMode(mode) {
    state.mode = mode;
    
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Update instructions
    updateInstructions();
}

function handleMapClick(lat, lng) {
    if (state.mode === 'hub') {
        setHub(lat, lng);
    } else if (state.mode === 'silos') {
        addSilo(lat, lng);
    } else if (state.mode === 'trucks') {
        addTruck(lat, lng);
    }
    
    updateStatus();
    updateItemsList();
    checkOptimizeEnabled();
}

function setHub(lat, lng) {
    // Remove old hub if exists
    if (state.hub && state.hub.marker) {
        map.removeLayer(state.hub.marker);
    }
    
    const marker = L.marker([lat, lng], { icon: hubIcon }).addTo(map);
    marker.bindPopup('🏭 HUB Central').openPopup();
    
    state.hub = { lat, lng, marker };
}

function addSilo(lat, lng) {
    const id = state.silos.length + 1;
    const marker = L.marker([lat, lng], { icon: siloIcon }).addTo(map);
    marker.bindPopup(`🌾 Silo #${id}`).openPopup();
    
    state.silos.push({ id, lat, lng, marker });
}

function addTruck(lat, lng) {
    const id = state.trucks.length + 1;
    const marker = L.marker([lat, lng], { icon: truckIcon }).addTo(map);
    marker.bindPopup(`🚚 Camión #${id}`).openPopup();
    
    state.trucks.push({ id, lat, lng, marker });
}

function updateStatus() {
    document.getElementById('hub-status').textContent = state.hub ? '✅ Establecido' : '❌ No establecido';
    document.getElementById('silos-status').textContent = state.silos.length;
    document.getElementById('trucks-status').textContent = state.trucks.length;
}

function updateInstructions() {
    const instructions = {
        'hub': '🏭 Haz clic en el mapa para colocar el HUB (Centro de Acopio)',
        'silos': '🌾 Haz clic en el mapa para agregar SILOS de recolección',
        'trucks': '🚚 Haz clic en el mapa para colocar GARAJES de camiones'
    };
    
    document.getElementById('instructions').textContent = instructions[state.mode];
}

function updateItemsList() {
    const container = document.getElementById('items-list');
    let html = '';
    
    if (state.silos.length > 0) {
        html += '<div class="item-group"><h4>Silos</h4>';
        state.silos.forEach(s => {
            html += `<div class="item">Silo #${s.id} <small>${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</small></div>`;
        });
        html += '</div>';
    }
    
    if (state.trucks.length > 0) {
        html += '<div class="item-group"><h4>Camiones</h4>';
        state.trucks.forEach(t => {
            html += `<div class="item">Camión #${t.id} <small>${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}</small></div>`;
        });
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function checkOptimizeEnabled() {
    const canOptimize = state.hub && 
                        state.silos.length > 0 && 
                        state.trucks.length > 0 &&
                        state.silos.length === state.trucks.length;
    
    document.getElementById('optimize-btn').disabled = !canOptimize;
}

function clearAll() {
    // Remove markers
    if (state.hub && state.hub.marker) {
        map.removeLayer(state.hub.marker);
    }
    state.silos.forEach(s => map.removeLayer(s.marker));
    state.trucks.forEach(t => map.removeLayer(t.marker));
    
    // Clear solution layers
    if (state.layers.mst) {
        state.layers.mst.forEach(layer => map.removeLayer(layer));
    }
    if (state.layers.assignments) {
        state.layers.assignments.forEach(layer => map.removeLayer(layer));
    }
    
    // Reset state
    state.hub = null;
    state.silos = [];
    state.trucks = [];
    state.solution = null;
    state.layers = { mst: null, assignments: null };
    
    updateStatus();
    updateItemsList();
    checkOptimizeEnabled();
    document.getElementById('results').classList.add('hidden');
}

async function runOptimization() {
    const btn = document.getElementById('optimize-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Optimizando con OSRM...';
    
    try {
        // Run two-stage optimization with OSRM
        console.log('Iniciando optimización con rutas reales (OSRM)...');
        const solution = await optimizeTwoStage(state.hub, state.silos, state.trucks, true);
        state.solution = solution;
        
        // Show cost matrix
        renderCostMatrix(
            solution.phase2.costMatrix,
            solution.phase2.optimalAssignment,
            state.trucks,
            state.silos
        );
        document.getElementById('cost-matrix-panel').classList.remove('hidden');
        
        // Visualize solution
        visualizeSolution(solution);
        
        // Show results
        showResults(solution);
        
    } catch (error) {
        console.error('Error en optimización:', error);
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '⚡ Optimizar Red + Asignación';
    }
}

function visualizeSolution(solution) {
    // Clear old layers
    if (state.layers.mst) {
        state.layers.mst.forEach(layer => map.removeLayer(layer));
    }
    if (state.layers.assignments) {
        state.layers.assignments.forEach(layer => map.removeLayer(layer));
    }
    
    const mstLayers = [];
    const assignmentLayers = [];
    
    // Draw MST edges (green solid lines)
    solution.phase1.edges.forEach(edge => {
        const line = L.polyline(
            [[edge.from.lat, edge.from.lng], [edge.to.lat, edge.to.lng]],
            { 
                color: '#10b981', 
                weight: 4, 
                opacity: 0.8 
            }
        ).addTo(map);
        
        line.bindPopup(`Red MST: ${edge.cost.toFixed(2)} km`);
        mstLayers.push(line);
    });
    
    // Draw assignment edges (blue dashed lines)
    solution.phase2.assignment.forEach(a => {
        const line = L.polyline(
            [[a.truck.lat, a.truck.lng], [a.silo.lat, a.silo.lng]],
            { 
                color: '#3b82f6', 
                weight: 3, 
                opacity: 0.6,
                dashArray: '10, 10'
            }
        ).addTo(map);
        
        line.bindPopup(`Camión #${a.truck.id} → Silo #${a.silo.id}: ${a.cost.toFixed(2)} km`);
        assignmentLayers.push(line);
    });
    
    state.layers.mst = mstLayers;
    state.layers.assignments = assignmentLayers;
}

function showResults(solution) {
    const panel = document.getElementById('results');
    panel.classList.remove('hidden');
    
    // Update metrics
    document.getElementById('mst-cost').textContent = solution.metrics.networkCost.toFixed(2) + ' km';
    document.getElementById('hungarian-cost').textContent = solution.metrics.positioningCost.toFixed(2) + ' km';
    document.getElementById('total-optimized').textContent = solution.metrics.totalOptimized.toFixed(2) + ' km';
    document.getElementById('total-baseline').textContent = solution.metrics.totalBaseline.toFixed(2) + ' km';
    document.getElementById('savings').textContent = 
        `${solution.metrics.savings.toFixed(2)} km (${solution.metrics.savingsPercent.toFixed(1)}%)`;
    
    // Show assignment details
    let html = '<h4 style="font-size: 0.75rem; margin-bottom: 0.5rem; font-weight: 600;">Asignaciones Óptimas</h4>';
    solution.phase2.assignment.forEach(a => {
        html += `
            <div class="assignment-item">
                🚚 Camión #${a.truck.id} → 🌾 Silo #${a.silo.id}
                <small style="color: #64748b;">(${a.cost.toFixed(2)} km)</small>
            </div>
        `;
    });
    document.getElementById('assignment-details').innerHTML = html;
}

// Initialize
updateInstructions();
updateStatus();
