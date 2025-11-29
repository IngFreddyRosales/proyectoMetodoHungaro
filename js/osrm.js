// OSRM Integration for Real Road Distances
// Calcula distancias usando rutas reales en lugar de euclidiana

/**
 * Calcula distancia real por carretera entre dos puntos usando OSRM
 * @param {Object} from - {lat, lng}
 * @param {Object} to - {lat, lng}
 * @returns {Promise<number>} - Distancia en km
 */
async function getOSRMDistance(from, to) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            return data.routes[0].distance / 1000; // Convert to km
        }
        
        // Fallback to euclidean if OSRM fails
        console.warn('OSRM failed, using euclidean distance');
        return euclideanDistance(from, to);
    } catch (error) {
        console.error('OSRM API Error:', error);
        return euclideanDistance(from, to);
    }
}

/**
 * Calcula matriz de distancias usando OSRM (optimizado para múltiples puntos)
 * @param {Array} sources - Array de puntos origen
 * @param {Array} destinations - Array de puntos destino
 * @returns {Promise<Array>} - Matriz de distancias
 */
async function getOSRMDistanceMatrix(sources, destinations) {
    // OSRM Table API permite calcular matriz completa en una sola llamada
    const allPoints = [...sources, ...destinations];
    const coords = allPoints.map(p => `${p.lng},${p.lat}`).join(';');
    
    const sourceIndices = sources.map((_, i) => i).join(';');
    const destIndices = destinations.map((_, i) => i + sources.length).join(';');
    
    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=${sourceIndices}&destinations=${destIndices}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.distances) {
            // Convert meters to km
            return data.distances.map(row => row.map(d => d / 1000));
        }
        
        // Fallback to individual requests
        console.warn('OSRM Table API failed, using individual requests');
        return await getDistanceMatrixFallback(sources, destinations);
    } catch (error) {
        console.error('OSRM Matrix Error:', error);
        return await getDistanceMatrixFallback(sources, destinations);
    }
}

/**
 * Fallback: calcula matriz una distancia a la vez
 */
async function getDistanceMatrixFallback(sources, destinations) {
    const matrix = [];
    
    for (let i = 0; i < sources.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < destinations.length; j++) {
            const dist = await getOSRMDistance(sources[i], destinations[j]);
            matrix[i][j] = dist;
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return matrix;
}

/**
 * Calcula todas las distancias para MST usando OSRM
 * @param {Array} nodes - Todos los nodos (hub + silos)
 * @returns {Promise<Object>} - Mapa de distancias {nodeId1_nodeId2: distance}
 */
async function calculateMSTDistancesOSRM(nodes) {
    const distances = {};
    const n = nodes.length;
    
    console.log(`Calculando ${n*(n-1)/2} distancias con OSRM...`);
    
    // Calcular distancias solo para pares únicos
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const key = `${i}_${j}`;
            const dist = await getOSRMDistance(nodes[i], nodes[j]);
            distances[key] = dist;
            
            // Small delay to be nice to OSRM server
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    return distances;
}

/**
 * Versión modificada de Prim que usa distancias pre-calculadas
 */
function primMSTWithDistances(nodes, hub, distanceMap) {
    if (nodes.length === 0) return { edges: [], totalCost: 0 };
    
    const allNodes = [{ id: 'hub', ...hub, type: 'hub' }, ...nodes];
    const n = allNodes.length;
    
    // Helper para obtener distancia del mapa
    const getDistance = (i, j) => {
        const minIdx = Math.min(i, j);
        const maxIdx = Math.max(i, j);
        const key = `${minIdx}_${maxIdx}`;
        return distanceMap[key] || Infinity;
    };
    
    const inMST = new Array(n).fill(false);
    const key = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);
    
    key[0] = 0;
    
    const edges = [];
    let totalCost = 0;
    
    for (let count = 0; count < n; count++) {
        let minKey = Infinity;
        let minIndex = -1;
        
        for (let v = 0; v < n; v++) {
            if (!inMST[v] && key[v] < minKey) {
                minKey = key[v];
                minIndex = v;
            }
        }
        
        if (minIndex === -1) break;
        
        inMST[minIndex] = true;
        
        if (parent[minIndex] !== -1) {
            const edge = {
                from: allNodes[parent[minIndex]],
                to: allNodes[minIndex],
                cost: key[minIndex]
            };
            edges.push(edge);
            totalCost += key[minIndex];
        }
        
        for (let v = 0; v < n; v++) {
            if (!inMST[v]) {
                const dist = getDistance(minIndex, v);
                if (dist < key[v]) {
                    key[v] = dist;
                    parent[v] = minIndex;
                }
            }
        }
    }
    
    return {
        edges: edges,
        totalCost: totalCost,
        tree: parent
    };
}
