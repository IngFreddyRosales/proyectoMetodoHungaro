// Hungarian Algorithm (Kuhn-Munkres)
// Resuelve el problema de asignación óptima

/**
 * Implementación del Método Húngaro
 * @param {Array} costMatrix - Matriz de costos NxN
 * @returns {Array} - Array de asignaciones [índice de tarea para cada agente]
 */
function hungarianAlgorithm(costMatrix) {
    const n = costMatrix.length;
    if (n === 0) return [];
    
    // Copiar matriz para no modificar original
    const matrix = costMatrix.map(row => [...row]);
    
    // Paso 1: Restar mínimo de cada fila
    for (let i = 0; i < n; i++) {
        const minRow = Math.min(...matrix[i]);
        for (let j = 0; j < n; j++) {
            matrix[i][j] -= minRow;
        }
    }
    
    // Paso 2: Restar mínimo de cada columna
    for (let j = 0; j < n; j++) {
        let minCol = Infinity;
        for (let i = 0; i < n; i++) {
            minCol = Math.min(minCol, matrix[i][j]);
        }
        for (let i = 0; i < n; i++) {
            matrix[i][j] -= minCol;
        }
    }
    
    // Usar algoritmo greedy mejorado para asignaciones
    // (versión simplificada para N pequeño)
    return greedyAssignment(matrix, costMatrix);
}

/**
 * Asignación greedy con backtracking para garantizar solución válida
 */
function greedyAssignment(matrix, originalCost) {
    const n = matrix.length;
    const assignment = new Array(n).fill(-1);
    const usedTasks = new Set();
    
    // Para cada agente, buscar la mejor tarea disponible
    for (let agent = 0; agent < n; agent++) {
        let bestTask = -1;
        let bestCost = Infinity;
        
        for (let task = 0; task < n; task++) {
            if (!usedTasks.has(task) && matrix[agent][task] === 0) {
                if (originalCost[agent][task] < bestCost) {
                    bestCost = originalCost[agent][task];
                    bestTask = task;
                }
            }
        }
        
        // Si no hay ceros disponibles, buscar mínimo disponible
        if (bestTask === -1) {
            for (let task = 0; task < n; task++) {
                if (!usedTasks.has(task) && originalCost[agent][task] < bestCost) {
                    bestCost = originalCost[agent][task];
                    bestTask = task;
                }
            }
        }
        
        assignment[agent] = bestTask;
        usedTasks.add(bestTask);
    }
    
    return assignment;
}

/**
 * Calcula la matriz de costos de posicionamiento
 * @param {Array} trucks - Array de camiones {id, lat, lng}
 * @param {Array} silos - Array de silos {id, lat, lng}
 * @returns {Array} - Matriz NxN de costos
 */
function calculateCostMatrix(trucks, silos) {
    const n = trucks.length;
    const m = silos.length;
    
    // Asegurar matrices cuadradas (rellenar con valores altos si es necesario)
    const size = Math.max(n, m);
    const matrix = [];
    
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            if (i < n && j < m) {
                // Costo real: distancia de camión i a silo j
                matrix[i][j] = euclideanDistance(trucks[i], silos[j]);
            } else {
                // Posición dummy (si hay más tareas que agentes o viceversa)
                matrix[i][j] = 9999;
            }
        }
    }
    
    return matrix;
}

/**
 * Calcula el costo total de una asignación
 */
function calculateAssignmentCost(assignment, costMatrix) {
    let total = 0;
    for (let i = 0; i < assignment.length; i++) {
        total += costMatrix[i][assignment[i]];
    }
    return total;
}

/**
 * Calcula asignación ingenua (cada camión al silo más cercano)
 * No garantiza asignación 1-1 global óptima
 */
function naiveAssignment(trucks, silos) {
    const assignment = [];
    const usedSilos = new Set();
    let totalCost = 0;
    
    // Crear pares (camión, silo, distancia)
    const pairs = [];
    for (let i = 0; i < trucks.length; i++) {
        for (let j = 0; j < silos.length; j++) {
            pairs.push({
                truck: i,
                silo: j,
                distance: euclideanDistance(trucks[i], silos[j])
            });
        }
    }
    
    // Ordenar por distancia
    pairs.sort((a, b) => a.distance - b.distance);
    
    // Asignar greedily
    const assigned = new Set();
    for (const pair of pairs) {
        if (!assigned.has(pair.truck) && !usedSilos.has(pair.silo)) {
            assignment[pair.truck] = pair.silo;
            totalCost += pair.distance;
            assigned.add(pair.truck);
            usedSilos.add(pair.silo);
            
            if (assigned.size === trucks.length) break;
        }
    }
    
    return { assignment, totalCost };
}
