// Orquestador del Sistema MST + Húngaro (Con OSRM)
// Integra las dos fases de optimización usando distancias reales

/**
 * Ejecuta el sistema completo de optimización de dos etapas
 * @param {Object} hub - {lat, lng}
 * @param {Array} silos - [{id, lat, lng}, ...]
 * @param {Array} trucks - [{id, lat, lng}, ...]
 * @param {boolean} useOSRM - Si true, usa OSRM. Si false, usa euclidiana
 * @returns {Promise<Object>} - Solución completa con métricas
 */
async function optimizeTwoStage(hub, silos, trucks, useOSRM = true) {
    // Validar entrada
    if (!hub || silos.length === 0 || trucks.length === 0) {
        throw new Error('Se requiere hub, silos y camiones');
    }
    
    if (silos.length !== trucks.length) {
        throw new Error(`Número de silos (${silos.length}) debe igual camiones (${trucks.length})`);
    }
    
    console.log('=== FASE 1: MST ===');
    console.log(`Usando distancias: ${useOSRM ? 'OSRM (reales)' : 'Euclidianas'}`);
    
    let mstResult;
    
    if (useOSRM) {
        // Calcular todas las distancias con OSRM
        const allNodes = [hub, ...silos];
        const distanceMap = await calculateMSTDistancesOSRM(allNodes);
        
        // Calcular MST con distancias pre-calculadas
        mstResult = primMSTWithDistances(silos, hub, distanceMap);
    } else {
        // Usar algoritmo original con distancia euclidiana
        mstResult = primMST(silos, hub);
    }
    
    console.log(`Red MST: ${mstResult.edges.length} aristas, Costo: ${mstResult.totalCost.toFixed(2)} km`);
    
    console.log('=== FASE 2: HÚNGARO ===');
    
    // Extraer puntos de inicio de ruta (silos)
    const routeStarts = extractRouteStarts(mstResult, silos);
    
    // Calcular matriz de costos de posicionamiento
    let costMatrix;
    
    if (useOSRM) {
        console.log('Calculando matriz de costos con OSRM...');
        costMatrix = await getOSRMDistanceMatrix(trucks, routeStarts);
    } else {
        costMatrix = calculateCostMatrix(trucks, routeStarts);
    }
    
    console.log('Matriz de costos calculada:', costMatrix.length + 'x' + costMatrix[0].length);
    
    // Resolver con Método Húngaro
    const optimalAssignment = hungarianAlgorithm(costMatrix);
    const optimalCost = calculateAssignmentCost(optimalAssignment, costMatrix);
    console.log(`Asignación óptima, Costo: ${optimalCost.toFixed(2)} km`);
    
    // BASELINE: Asignación ingenua para comparación
    const naiveResult = naiveAssignment(trucks, routeStarts);
    console.log(`Asignación ingenua, Costo: ${naiveResult.totalCost.toFixed(2)} km`);
    
    // Calcular métricas
    const totalOptimized = mstResult.totalCost + optimalCost;
    const totalBaseline = mstResult.totalCost + naiveResult.totalCost;
    const savings = totalBaseline - totalOptimized;
    const savingsPercent = (savings / totalBaseline) * 100;
    
    // Construir resultado
    const result = {
        phase1: {
            type: 'MST',
            edges: mstResult.edges,
            cost: mstResult.totalCost
        },
        phase2: {
            type: 'Hungarian',
            assignment: optimalAssignment.map((siloIdx, truckIdx) => ({
                truck: trucks[truckIdx],
                silo: routeStarts[siloIdx],
                cost: costMatrix[truckIdx][siloIdx]
            })),
            cost: optimalCost,
            costMatrix: costMatrix,
            optimalAssignment: optimalAssignment
        },
        baseline: {
            assignment: naiveResult.assignment,
            cost: naiveResult.totalCost
        },
        metrics: {
            networkCost: mstResult.totalCost,
            positioningCost: optimalCost,
            totalOptimized: totalOptimized,
            totalBaseline: totalBaseline,
            savings: savings,
            savingsPercent: savingsPercent
        }
    };
    
    console.log('=== RESUMEN ===');
    console.log(`Costo Total Optimizado: ${totalOptimized.toFixed(2)} km`);
    console.log(`Costo Total Baseline: ${totalBaseline.toFixed(2)} km`);
    console.log(`Ahorros: ${savings.toFixed(2)} km (${savingsPercent.toFixed(1)}%)`);
    
    return result;
}

/**
 * Renderiza la matriz de costos en HTML
 */
function renderCostMatrix(costMatrix, assignment, trucks, silos) {
    const container = document.getElementById('cost-matrix-container');
    
    let html = '<table class="cost-matrix"><thead><tr><th></th>';
    
    // Headers de columnas (Silos)
    silos.forEach((silo, i) => {
        html += `<th>Silo #${silo.id}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Filas (Camiones)
    trucks.forEach((truck, i) => {
        html += `<tr><th>Cam #${truck.id}</th>`;
        
        silos.forEach((silo, j) => {
            const cost = costMatrix[i][j];
            const isAssigned = assignment[i] === j;
            const className = isAssigned ? 'assigned' : '';
            
            html += `<td class="${className}">${cost.toFixed(2)}</td>`;
        });
        
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    container.innerHTML = html;
}

/**
 * Extrae coordenadas para visualización en el mapa
 */
function getVisualizationData(solution) {
    return {
        mstEdges: solution.phase1.edges.map(edge => ({
            from: [edge.from.lat, edge.from.lng],
            to: [edge.to.lat, edge.to.lng],
            cost: edge.cost
        })),
        assignments: solution.phase2.assignment.map(a => ({
            from: [a.truck.lat, a.truck.lng],
            to: [a.silo.lat, a.silo.lng],
            truckId: a.truck.id,
            siloId: a.silo.id,
            cost: a.cost
        }))
    };
}

