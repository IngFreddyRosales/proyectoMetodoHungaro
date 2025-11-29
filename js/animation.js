// Animation functions for delivery route
function startAnimation() {
    if (!window.currentRoute || !window.currentRoute.coordinates) {
        alert('Primero calcula una ruta.');
        return;
    }
    
    stopAnimation();
    
    if (!state.animation.marker) {
        state.animation.marker = L.marker(
            window.currentRoute.coordinates[0],
            { icon: vehicleIcon }
        ).addTo(map);
        state.animation.marker.bindPopup('🚗 Repartidor').openPopup();
    }
    
    state.animation.currentIndex = 0;
    state.animation.isRunning = true;
    
    const btn = document.getElementById('animate-btn');
    btn.textContent = '⏸️ Pausar Animación';
    btn.onclick = pauseAnimation;
    
    animateStep();
}

function animateStep() {
    if (!state.animation.isRunning) return;
    
    const coordinates = window.currentRoute.coordinates;
    const speed = 50;
    
    if (state.animation.currentIndex < coordinates.length) {
        const currentPos = coordinates[state.animation.currentIndex];
        state.animation.marker.setLatLng(currentPos);
        
        state.animation.currentIndex++;
        state.animation.intervalId = setTimeout(animateStep, speed);
    } else {
        stopAnimation();
        const btn = document.getElementById('animate-btn');
        btn.textContent = '🔄 Repetir Animación';
        btn.onclick = startAnimation;
    }
}

function pauseAnimation() {
    state.animation.isRunning = false;
    if (state.animation.intervalId) {
        clearTimeout(state.animation.intervalId);
    }
    
    const btn = document.getElementById('animate-btn');
    btn.textContent = '▶️ Continuar';
    btn.onclick = resumeAnimation;
}

function resumeAnimation() {
    state.animation.isRunning = true;
    
    const btn = document.getElementById('animate-btn');
    btn.textContent = '⏸️ Pausar Animación';
    btn.onclick = pauseAnimation;
    
    animateStep();
}

function stopAnimation() {
    state.animation.isRunning = false;
    if (state.animation.intervalId) {
        clearTimeout(state.animation.intervalId);
        state.animation.intervalId = null;
    }
}
