// Minimum Spanning Tree (Prim's Algorithm)
// Calcula el árbol de expansión mínima para conectar todos los silos al hub

/**
 * Calcula la distancia euclidiana entre dos puntos
 */
function euclideanDistance(p1, p2) {
    const dx = p2.lat - p1.lat;
    const dy = p2.lng - p1.lng;
    return Math.sqrt(dx * dx + dy * dy) * 111; // Aproximación a km
}

/**
 * Implementación del algoritmo de Prim para MST
 * @param {Array} nodes - Array de nodos {id, lat, lng, type}
 * @param {Object} hub - Nodo hub {lat, lng}
 * @returns {Object} - {edges: [], totalCost: number}
 */
function primMST(nodes, hub) {
    if (nodes.length === 0) return { edges: [], totalCost: 0 };
    
    // Incluir hub en los nodos
    const allNodes = [{ id: 'hub', ...hub, type: 'hub' }, ...nodes];
    const n = allNodes.length;
    
    // Inicialización
    const inMST = new Array(n).fill(false);
    const key = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);
    
    // Empezar desde el hub
    key[0] = 0;
    
    const edges = [];
    let totalCost = 0;
    
    // Construir el MST
    for (let count = 0; count < n; count++) {
        // Encontrar el nodo con key mínima no incluido en MST
        let minKey = Infinity;
        let minIndex = -1;
        
        for (let v = 0; v < n; v++) {
            if (!inMST[v] && key[v] < minKey) {
                minKey = key[v];
                minIndex = v;
            }
        }
        
        if (minIndex === -1) break;
        
        // Agregar nodo al MST
        inMST[minIndex] = true;
        
        // Agregar arista al resultado (excepto el primer nodo)
        if (parent[minIndex] !== -1) {
            const edge = {
                from: allNodes[parent[minIndex]],
                to: allNodes[minIndex],
                cost: key[minIndex]
            };
            edges.push(edge);
            totalCost += key[minIndex];
        }
        
        // Actualizar keys de nodos adyacentes
        for (let v = 0; v < n; v++) {
            if (!inMST[v]) {
                const dist = euclideanDistance(allNodes[minIndex], allNodes[v]);
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

/**
 * Extrae los puntos de inicio de ruta del MST (silos)
 */
function extractRouteStarts(mstResult, silos) {
    // Los puntos de inicio son todos los silos
    return silos.map(silo => ({
        id: silo.id,
        lat: silo.lat,
        lng: silo.lng
    }));
}
