# PROYECTO: Optimizador de Red de Recolección y Asignación de Flota
## Sistema Integrado MST + Método Húngaro

---

## 📋 OBJETIVOS

### Objetivo General
Desarrollar un Sistema de Soporte a la Decisión (DSS) web que optimice la logística de recolección agrícola mediante dos fases:
1. **Fase Estratégica (MST)**: Diseñar la red óptima de rutas de recolección
2. **Fase Táctica (Húngaro)**: Asignar camiones a rutas minimizando costos de posicionamiento

### Objetivos Específicos
1. Implementar el algoritmo de Prim para calcular el Árbol de Expansión Mínima (MST)
2. Implementar el Método Húngaro para resolver el Problema de Asignación
3. Calcular matriz de costos de posicionamiento (deadheading)
4. Visualizar ambas soluciones integradas en un mapa interactivo
5. Calcular métricas de ahorro vs. solución ingenua

---

## 🎯 CASO DE ESTUDIO

**Contexto**: Empresa de logística agrícola en Santa Cruz, Bolivia que debe:
- Recolectar soya de N silos rurales
- Transportarla a un HUB central (planta procesadora)
- Usando N camiones estacionados en garajes distribuidos

**Decisiones a optimizar**:
1. ¿Qué rutas usar para conectar todos los silos al hub? (MST)
2. ¿Qué camión debe cubrir cada ruta? (Húngaro)

---

## 📐 MODELO MATEMÁTICO

### FASE 1: Árbol de Expansión Mínima (MST)

**Problema**: Conectar N silos + 1 hub con la menor distancia total

**Entrada**:
- G = (V, E): Grafo completo
  - V = {hub, silo₁, silo₂, ..., siloₙ}
  - E = todas las aristas posibles
  - w(u,v) = distancia euclidiana entre nodos u y v

**Modelo**:
```
Minimizar: Σ w(u,v) para todas las aristas (u,v) en el árbol T

Sujeto a:
- T es un árbol (N aristas, sin ciclos)
- T conecta todos los N+1 nodos
```

**Algoritmo**: Prim
- Complejidad: O(N² log N)
- JavaScript: Implementación custom

**Salida**:
- T = {(u₁,v₁), (u₂,v₂), ..., (uₙ,vₙ)}: Conjunto de N aristas
- Costo_Red = Σ w(uᵢ,vᵢ)

### FASE 2: Problema de Asignación (Método Húngaro)

**Problema**: Asignar N camiones a N rutas (silos) minimizando distancia de posicionamiento

**Entrada**:
- Agentes: C = {camión₁, camión₂, ..., camionₙ} con posiciones (lat,lng)
- Tareas: S = {silo₁, silo₂, ..., siloₙ} (puntos de inicio de rutas del MST)
- Matriz de Costos: C[i][j] = distancia(camión_i, silo_j)

**Modelo**:
```
Variables: xᵢⱼ ∈ {0,1} (camión i asignado a silo j)

Minimizar: Σᵢ Σⱼ C[i][j] * xᵢⱼ

Sujeto a:
- Σⱼ xᵢⱼ = 1  ∀i  (cada camión cubre exactamente 1 ruta)
- Σᵢ xᵢⱼ = 1  ∀j  (cada ruta es cubierta por exactamente 1 camión)
- xᵢⱼ ∈ {0,1}
```

**Algoritmo**: Húngaro (Kuhn-Munkres)
- Complejidad: O(N³)
- JavaScript: Implementación basada en munkres-js o custom

**Salida**:
- Asignación: {(camión₁ → silo_k), (camión₂ → silo_m), ...}
- Costo_Posicionamiento = Σ C[i][π(i)]

---

## 💻 ARQUITECTURA DEL SISTEMA

### Componentes

1. **Interfaz de Usuario** (HTML/CSS)
   - Panel de configuración (3 modos)
   - Lista de elementos por tipo
   - Panel de resultados con métricas

2. **Motor de Optimización** (JavaScript)
   - `mst.js`: Implementación del algoritmo de Prim
   - `hungarian.js`: Implementación del Método Húngaro
   - `optimizer.js`: Orquestador de las 2 fases

3. **Visualización** (Leaflet)
   - Capa de nodos (hub, silos, garajes)
   - Capa MST (red de recolección)
   - Capa de asignación (líneas de posicionamiento)
   - Capa de animación

### Flujo de Datos

```
Usuario Input → Validación → FASE 1: MST → FASE 2: Húngaro → Visualización
                                  ↓              ↓
                            Red Óptima    Asignación Óptima
                                  ↓              ↓
                              Métricas ← Cálculo de KPIs
```

---

## 📊 MÉTRICAS Y KPIs

### Métricas de Salida

1. **Costo de Red (MST)**
   - Distancia total de la red de recolección
   - En km

2. **Costo de Posicionamiento (Húngaro)**
   - Distancia total de deadheading
   - En km

3. **Costo Total Optimizado**
   - Costo_Red + Costo_Posicionamiento

4. **Línea Base (Baseline)**
   - Asignación ingenua: cada camión al silo más cercano
   - No garantiza asignación 1-1 óptima globalmente

5. **Ahorros**
   - % Ahorro = (Baseline - Optimizado) / Baseline * 100%
   - $ Ahorro = (Baseline - Optimizado) * costo_por_km

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Preparación
- [x] Revisar código actual
- [ ] Crear estructura de archivos
- [ ] Diseñar nueva interfaz

### Fase 2: Algoritmos Core
- [ ] Implementar algoritmo de Prim (MST)
- [ ] Implementar Método Húngaro
- [ ] Calcular matriz de costos
- [ ] Calcular línea base

### Fase 3: Integración
- [ ] Actualizar UI para 3 tipos de nodos
- [ ] Conectar algoritmos con visualización
- [ ] Agregar panel de métricas
- [ ] Implementar animación integrada

### Fase 4: Validación
- [ ] Casos de prueba con datos reales
- [ ] Verificar optimalidad de soluciones
- [ ] Documentar resultados

---

## 📈 RESULTADOS ESPERADOS

### Visualización
- Mapa con 3 capas claramente diferenciadas
- Distinción visual entre red de recolección y posicionamiento
- Animación mostrando ambas fases secuencialmente

### Métricas
- Demostracion cuantitativa del ahorro
- Comparación con solución ingenua
- Justificación del uso de IO

### Aprendizaje
- Comprensión profunda de MST y asignación
- Aplicación práctica de IO a problemas reales
- Experiencia en optimización multi-etapa

---

## 🎓 CONCLUSIONES (Esperadas)

1. **Validación del Modelo**:
   - La optimización de dos etapas reduce costos vs. enfoque ingenuo
   - El ahorro es cuantificable y relevante para decisiones empresariales

2. **Aplicabilidad**:
   - El modelo es escalable a casos reales (10-50 silos)
   - La implementación en JavaScript permite uso sin instalación

3. **Ventajas del Enfoque Integrado**:
   - Separar diseño estratégico (red) de asignación táctica (flota)
   - Permite análisis de sensibilidad independiente
   - Refleja proceso real de toma de decisiones

4. **Limitaciones y Futuro**:
   - Supuestos simplificadores (distancia euclidiana vs. vial)
   - Extensión futura: capacidades de camiones, ventanas de tiempo
   - Integración con sistemas ERP/TMS reales

---

## 📚 REFERENCIAS TÉCNICAS

### Algoritmos
- **Prim's Algorithm**: Complejidad O(V² log V) con heap binario
- **Hungarian Algorithm**: Complejidad O(V³) para asignación óptima

### Implementación
- **Leaflet**: Mapas interactivos
- **OSRM**: Distancias reales (opcional)
- **JavaScript**: Sin dependencias pesadas
