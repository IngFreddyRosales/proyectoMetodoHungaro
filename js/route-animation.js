// Route Animation System - Sequential truck movement following real streets
// Anima camiones uno por uno siguiendo rutas reales de OSRM

const animationState = {
    routes: [], // Array de rutas con coordenadas OSRM
    currentTruckIndex: 0,
    isPlaying: false,
    isPaused: false,
    speed: 1, // 1x, 2x, 5x
    intervalId: null,
    currentMarker: null,
    // Timer properties
    startTime: null,
    elapsedTime: 0,
    pausedTime: 0
};

/**
 * Obtiene la ruta completa de OSRM para un camión específico
 * @param {Object} from - {lat, lng} posición inicial
 * @param {Object} to - {lat, lng} posición final
 * @returns {Promise<Array>} - Array de coordenadas [lat, lng]
 */
async function fetchTruckRoute(from, to) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // Convertir coordenadas de [lng, lat] a [lat, lng]
            const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
            return {
                coordinates: coordinates,
                distance: route.distance / 1000,
                duration: route.duration
            };
        }
        
        // Fallback: línea recta si OSRM falla
        console.warn('OSRM failed, using straight line');
        return {
            coordinates: [[from.lat, from.lng], [to.lat, to.lng]],
            distance: euclideanDistance(from, to),
            duration: 0
        };
    } catch (error) {
        console.error('OSRM Route Error:', error);
        return {
            coordinates: [[from.lat, from.lng], [to.lat, to.lng]],
            distance: euclideanDistance(from, to),
            duration: 0
        };
    }
}

/**
 * Prepara todas las rutas para la animación (completas: garaje → silo → hub)
 * Usa las rutas del MST guardadas para el trayecto silo→hub
 * @param {Array} assignments - Asignaciones del optimizador
 * @param {Object} hub - Posición del hub
 * @param {Object} solution - Solución completa con rutas MST
 * @returns {Promise<Array>} - Array de objetos de ruta
 */
async function prepareAllRoutes(assignments, hub, solution) {
    console.log('Preparando rutas completas para animación...');
    const routes = [];
    
    for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        
        console.log(`Obteniendo ruta ${i+1}/${assignments.length}: Camión #${assignment.truck.id}`);
        
        // PARTE 1: Garaje → Silo (posicionamiento vacío)
        const toSiloRoute = await fetchTruckRoute(assignment.truck, assignment.silo);
        
        // PARTE 2: Silo → Hub (siguiendo rutas del MST)
        const mstPath = findMSTPathToHub(assignment.silo, hub, solution.phase1.edgeRoutes);
        
        // Combinar ambas rutas
        const fullCoordinates = [
            ...toSiloRoute.coordinates,
            ...mstPath.coordinates
        ];
        
        routes.push({
            truckId: assignment.truck.id,
            truckPos: assignment.truck,
            siloId: assignment.silo.id,
            siloPos: assignment.silo,
            hubPos: hub,
            // Coordenadas completas del viaje
            coordinates: fullCoordinates,
            // Índice donde termina la primera parte (garaje → silo)
            siloArrivalIndex: toSiloRoute.coordinates.length,
            // Distancias
            distanceToSilo: toSiloRoute.distance,
            distanceToHub: mstPath.distance,
            totalDistance: toSiloRoute.distance + mstPath.distance,
            // Duraciones (en segundos)
            durationToSilo: toSiloRoute.duration || 0,
            durationToHub: mstPath.duration || 0,
            totalDuration: (toSiloRoute.duration || 0) + (mstPath.duration || 0),
            currentIndex: 0,
            phase: 'to-silo' // 'to-silo' o 'to-hub'
        });
        
        // Pequeña pausa para no saturar OSRM
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Todas las rutas completas cargadas (usando MST)');
    return routes;
}

/**
 * Encuentra el camino en el MST desde un silo hasta el hub
 * @param {Object} silo - Nodo de inicio
 * @param {Object} hub - Nodo destino
 * @param {Array} edgeRoutes - Rutas de las aristas del MST con coordenadas
 * @returns {Object} - {coordinates: Array, distance: number}
 */
function findMSTPathToHub(silo, hub, edgeRoutes) {
    // El MST es un árbol, así que hay un único camino de silo a hub
    // Necesitamos encontrar las aristas que conectan este silo al hub
    
    const path = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let currentNode = silo;
    const visited = new Set();
    
    // Búsqueda del camino en el árbol MST
    while (currentNode.id !== 'hub' && !visited.has(currentNode.id)) {
        visited.add(currentNode.id);
        
        // Buscar arista que conecta currentNode con siguiente nodo hacia el hub
        let found = false;
        
        for (const edgeRoute of edgeRoutes) {
            // Verificar si esta arista conecta con el nodo actual
            if (nodesMatch(edgeRoute.from, currentNode)) {
                path.push(edgeRoute);
                totalDistance += edgeRoute.distance;
                totalDuration += edgeRoute.duration || 0;
                currentNode = edgeRoute.to;
                found = true;
                break;
            } else if (nodesMatch(edgeRoute.to, currentNode)) {
                // Arista en dirección inversa, invertir coordenadas
                path.push({
                    ...edgeRoute,
                    coordinates: [...edgeRoute.coordinates].reverse()
                });
                totalDistance += edgeRoute.distance;
                totalDuration += edgeRoute.duration || 0;
                currentNode = edgeRoute.from;
                found = true;
                break;
            }
        }
        
        if (!found) {
            console.error('No se encontró camino en MST para silo', silo);
            // Fallback: retornar coordenadas directas
            return {
                coordinates: [[silo.lat, silo.lng], [hub.lat, hub.lng]],
                distance: euclideanDistance(silo, hub)
            };
        }
    }
    
    // Combinar todas las coordenadas del camino
    const allCoordinates = [];
    for (const segment of path) {
        allCoordinates.push(...segment.coordinates);
    }
    
    return {
        coordinates: allCoordinates,
        distance: totalDistance,
        duration: totalDuration
    };
}

/**
 * Verifica si dos nodos son el mismo
 */
function nodesMatch(node1, node2) {
    if (node1.type === 'hub' && node2.type === 'hub') return true;
    if (node1.type === 'hub' || node2.type === 'hub') return false;
    return node1.id === node2.id;
}

/**
 * Inicia la animación secuencial
 */
async function startSequentialAnimation() {
    if (!state.solution || !state.solution.phase2.assignment) {
        alert('Primero debes optimizar la ruta');
        return;
    }
    
    // Limpiar animación anterior si existe
    stopAnimation();
    
    // Deshabilitar botón y mostrar loading
    const btn = document.getElementById('animate-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Cargando rutas...';
    
    try {
        // Preparar todas las rutas (ahora sigue MST para silo→hub)
        animationState.routes = await prepareAllRoutes(
            state.solution.phase2.assignment,
            state.hub,
            state.solution
        );
        animationState.currentTruckIndex = 0;
        animationState.isPlaying = true;
        animationState.isPaused = false;
        
        // Mostrar controles
        document.getElementById('animation-controls').classList.remove('hidden');
        updateAnimationUI();
        
        // Iniciar animación del primer camión
        animateCurrentTruck();
        
    } catch (error) {
        console.error('Error preparando animación:', error);
        alert('Error al preparar rutas: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

/**
 * Anima el camión actual (garaje → silo → hub)
 */
function animateCurrentTruck() {
    if (!animationState.isPlaying || animationState.isPaused) return;
    
    const route = animationState.routes[animationState.currentTruckIndex];
    
    if (!route) {
        console.log('No hay más camiones para animar');
        finishAnimation();
        return;
    }
    
    // Crear marcador si no existe
    if (!animationState.currentMarker) {
        const truckMarkerIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        animationState.currentMarker = L.marker(route.coordinates[0], { 
            icon: truckMarkerIcon,
            zIndexOffset: 1000
        }).addTo(map);
        
        animationState.currentMarker.bindPopup(
            `🚚 Camión #${route.truckId}<br>→ Silo #${route.siloId} (vacío)`
        ).openPopup();
        
        // Centrar mapa en el camión
        map.setView(route.coordinates[0], 14);
        
        // Iniciar cronómetro
        animationState.startTime = Date.now();
        animationState.elapsedTime = 0;
    }
    
    // Animar paso a paso (velocidad reducida)
    const stepInterval = 50 / animationState.speed; // ms por paso (aumentado de 30 a 50)
    
    animationState.intervalId = setInterval(() => {
        if (animationState.isPaused) {
            clearInterval(animationState.intervalId);
            return;
        }
        
        route.currentIndex++;
        
        // Actualizar tiempo transcurrido
        animationState.elapsedTime = (Date.now() - animationState.startTime) / 1000; // en segundos
        updateTimer(animationState.elapsedTime, route.totalDuration);
        
        // Verificar si llegó al silo (cambio de fase)
        if (route.currentIndex === route.siloArrivalIndex && route.phase === 'to-silo') {
            route.phase = 'to-hub';
            
            // Cambiar marcador a verde (con carga)
            const loadedIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            
            animationState.currentMarker.setIcon(loadedIcon);
            animationState.currentMarker.bindPopup(
                `🚚 Camión #${route.truckId}<br>→ Hub (con carga 🌾)`
            ).openPopup();
            
            console.log(`Camión #${route.truckId} recogió carga en Silo #${route.siloId}`);
        }
        
        if (route.currentIndex < route.coordinates.length) {
            // Mover marcador
            const pos = route.coordinates[route.currentIndex];
            animationState.currentMarker.setLatLng(pos);
            
            // Actualizar progreso
            const progress = Math.round((route.currentIndex / route.coordinates.length) * 100);
            updateProgressBar(progress);
            
        } else {
            // Camión actual llegó al hub
            clearInterval(animationState.intervalId);
            
            console.log(`Camión #${route.truckId} completó entrega al Hub en ${formatTime(animationState.elapsedTime)}`);
            
            // Pequeña pausa antes del siguiente
            setTimeout(() => {
                // Remover marcador actual
                if (animationState.currentMarker) {
                    map.removeLayer(animationState.currentMarker);
                    animationState.currentMarker = null;
                }
                
                // Reset timer
                animationState.startTime = null;
                animationState.elapsedTime = 0;
                
                // Siguiente camión
                animationState.currentTruckIndex++;
                
                if (animationState.currentTruckIndex < animationState.routes.length) {
                    updateAnimationUI();
                    animateCurrentTruck();
                } else {
                    finishAnimation();
                }
            }, 1000);
        }
    }, stepInterval);
}

/**
 * Actualiza el display del cronómetro
 */
function updateTimer(elapsed, estimated) {
    const timerDisplay = document.getElementById('animation-timer');
    if (timerDisplay) {
        timerDisplay.textContent = `⏱️ ${formatTime(elapsed)}`;
        
        if (estimated > 0) {
            const estimatedEl = document.getElementById('animation-estimated');
            if (estimatedEl) {
                estimatedEl.textContent = `Estimado: ${formatTime(estimated / animationState.speed)}`;
            }
        }
    }
}

/**
 * Formatea segundos a MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Pausa la animación
 */
function pauseAnimation() {
    animationState.isPaused = true;
    if (animationState.intervalId) {
        clearInterval(animationState.intervalId);
    }
    updateAnimationUI();
}

/**
 * Resume la animación
 */
function resumeAnimation() {
    animationState.isPaused = false;
    animateCurrentTruck();
    updateAnimationUI();
}

/**
 * Detiene completamente la animación
 */
function stopAnimation() {
    animationState.isPlaying = false;
    animationState.isPaused = false;
    
    if (animationState.intervalId) {
        clearInterval(animationState.intervalId);
    }
    
    if (animationState.currentMarker) {
        map.removeLayer(animationState.currentMarker);
        animationState.currentMarker = null;
    }
    
    animationState.currentTruckIndex = 0;
    animationState.routes = [];
    
    document.getElementById('animation-controls').classList.add('hidden');
}

/**
 * Finaliza la animación
 */
function finishAnimation() {
    animationState.isPlaying = false;
    
    if (animationState.currentMarker) {
        map.removeLayer(animationState.currentMarker);
        animationState.currentMarker = null;
    }
    
    showNotification('✅ Animación completada');
    updateAnimationUI();
}

/**
 * Cambia la velocidad de animación
 */
function setAnimationSpeed(speed) {
    animationState.speed = speed;
    updateAnimationUI();
}

/**
 * Actualiza la UI de controles
 */
function updateAnimationUI() {
    const current = animationState.currentTruckIndex + 1;
    const total = animationState.routes.length;
    
    document.getElementById('animation-status').textContent = 
        `Camión ${current} de ${total}`;
    
    const playBtn = document.getElementById('play-animation-btn');
    const pauseBtn = document.getElementById('pause-animation-btn');
    
    if (animationState.isPaused) {
        playBtn.textContent = '▶️ Continuar';
        playBtn.disabled = false;
        pauseBtn.disabled = true;
    } else if (animationState.isPlaying) {
        playBtn.disabled = true;
        pauseBtn.disabled = false;
    } else {
        playBtn.textContent = '▶️ Reproducir';
        playBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}

/**
 * Actualiza la barra de progreso
 */
function updateProgressBar(progress) {
    const progressBar = document.getElementById('animation-progress-bar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
}
