// Find optimal visiting order using Nearest Neighbor Heuristic
// Returns ordered waypoints for TSP (Traveling Salesman Problem)
// Route: Start -> Visit all orders -> Return to Start

function findOptimalOrder(startDepot, orders) {
    // Clone orders to not mutate state
    let unvisited = [...orders];
    const waypoints = [startDepot]; // Start at the start depot
    const orderSequence = [];

    let current = startDepot;

    // Visit all orders using nearest neighbor heuristic (using straight-line distance)
    while (unvisited.length > 0) {
        let nearest = null;
        let minDist = Infinity;
        let nearestIndex = -1;

        for (let i = 0; i < unvisited.length; i++) {
            const dist = calculateDistance(current, unvisited[i]);
            if (dist < minDist) {
                minDist = dist;
                nearest = unvisited[i];
                nearestIndex = i;
            }
        }

        if (nearest) {
            current = nearest;
            waypoints.push(current);
            orderSequence.push(`Pedido #${current.id}`);
            unvisited.splice(nearestIndex, 1);
        }
    }

    // Return to start depot (complete the cycle - TSP)
    waypoints.push(startDepot);

    return {
        waypoints: waypoints,
        orderSequence: orderSequence
    };
}

// Haversine formula for distance in km
function calculateDistance(p1, p2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(p2.lat - p1.lat);
    const dLon = deg2rad(p2.lng - p1.lng);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(p1.lat)) * Math.cos(deg2rad(p2.lat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}
