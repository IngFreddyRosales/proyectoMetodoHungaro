// State
const state = {
    orders: [],
    startDepot: null,
    mode: 'start', // 'start' or 'orders'
    vehicleCapacity: 10,
    animation: {
        isRunning: false,
        currentIndex: 0,
        marker: null,
        intervalId: null
    }
};

// Map Initialization
const map = L.map('map').setView([-17.78337545862481, -63.182061518083216], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Icons
const startIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const orderIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const vehicleIcon = L.icon({
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

document.getElementById('optimize-btn').addEventListener('click', optimizeRoute);
document.getElementById('clear-btn').addEventListener('click', clearAll);

// Functions
function handleMapClick(lat, lng) {
    if (state.mode === 'start') {
        setStartDepot(lat, lng);
    } else if (state.mode === 'orders') {
        addOrder(lat, lng);
    }
}

function setStartDepot(lat, lng) {
    if (state.startDepot && state.startDepot.marker) {
        map.removeLayer(state.startDepot.marker);
    }
    
    const marker = L.marker([lat, lng], { icon: startIcon }).addTo(map);
    marker.bindPopup('Punto de Inicio (Depósito)').openPopup();
    
    state.startDepot = { lat, lng, marker };
    state.mode = 'orders';
    updateInstructions();
}

function addOrder(lat, lng) {
    const id = state.orders.length + 1;
    const order = { id, lat, lng };
    
    state.orders.push(order);
    
    const marker = L.marker([lat, lng], { icon: orderIcon }).addTo(map);
    marker.bindPopup(`Pedido #${id}`).openPopup();
    order.marker = marker;

    updateOrdersList();
}

function updateInstructions() {
    const instructionsText = {
        'start': '1️⃣ Haz clic en el mapa para establecer el DEPÓSITO/INICIO (verde)',
        'orders': '2️⃣ Haz clic en el mapa para agregar PEDIDOS (azul)'
    };
    
    const list = document.getElementById('orders-list');
    const instruction = instructionsText[state.mode];
    
    let html = `<div class="instruction">${instruction}</div>`;
    
    if (state.startDepot) {
        html += `<div class="depot-info">✅ Depósito establecido</div>`;
    }
    
    if (state.orders.length > 0) {
        html += '<h3>Pedidos</h3>';
        state.orders.forEach(order => {
            html += `
                <div class="order-item">
                    <span>Pedido #${order.id}</span>
                    <small>${order.lat.toFixed(4)}, ${order.lng.toFixed(4)}</small>
                </div>
            `;
        });
    }
    
    list.innerHTML = html;
}

function updateOrdersList() {
    updateInstructions();
}

function clearAll() {
    if (state.startDepot && state.startDepot.marker) {
        map.removeLayer(state.startDepot.marker);
    }
    state.orders.forEach(order => map.removeLayer(order.marker));
    
    state.startDepot = null;
    state.orders = [];
    state.mode = 'start';
    
    if (window.routeLayer) {
        map.removeLayer(window.routeLayer);
    }
    
    if (state.animation.marker) {
        map.removeLayer(state.animation.marker);
        state.animation.marker = null;
    }
    
    updateInstructions();
    document.getElementById('results').classList.add('hidden');
}

async function optimizeRoute() {
    if (!state.startDepot) {
        alert("Debes establecer un DEPÓSITO/INICIO (verde).");
        return;
    }
    if (state.orders.length === 0) {
        alert("Agrega al menos 1 pedido para calcular una ruta.");
        return;
    }

    const btn = document.getElementById('optimize-btn');
    btn.disabled = true;
    btn.textContent = "Calculando...";

    try {
        const optimalOrder = findOptimalOrder(state.startDepot, state.orders);
        const routeData = await fetchRealRoute(optimalOrder.waypoints);
        
        if (routeData) {
            drawRoute(routeData);
            showResults(routeData, optimalOrder.orderSequence);
            window.currentRoute = routeData;
        } else {
            alert("No se pudo calcular la ruta. Intenta con otros puntos.");
        }
    } catch (error) {
        console.error(error);
        alert("Error al calcular la ruta: " + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Calcular Ruta Óptima";
    }
}

async function fetchRealRoute(waypoints) {
    const coordinates = waypoints.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
                distance: route.distance / 1000,
                duration: route.duration / 60
            };
        }
        return null;
    } catch (error) {
        console.error('OSRM API Error:', error);
        return null;
    }
}

function drawRoute(routeData) {
    if (window.routeLayer) {
        map.removeLayer(window.routeLayer);
    }

    window.routeLayer = L.polyline(routeData.coordinates, { 
        color: '#2563eb', 
        weight: 4,
        opacity: 0.7 
    }).addTo(map);
    map.fitBounds(window.routeLayer.getBounds());
}

function showResults(routeData, orderSequence) {
    const resultsPanel = document.getElementById('results');
    const details = document.getElementById('route-details');
    
    resultsPanel.classList.remove('hidden');
    details.innerHTML = `
        <p><strong>Distancia Total:</strong> ${routeData.distance.toFixed(2)} km</p>
        <p><strong>Tiempo Estimado:</strong> ${routeData.duration.toFixed(1)} min</p>
        <p><strong>Ruta:</strong> Depósito → ${orderSequence.join(' → ')} → Depósito</p>
        <button id="animate-btn" class="btn-primary" style="margin-top: 1rem;">▶️ Ver Animación</button>
    `;
    
    document.getElementById('animate-btn').addEventListener('click', startAnimation);
}

// Initialize
updateInstructions();
