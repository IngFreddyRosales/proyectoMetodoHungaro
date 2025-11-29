# Cómo Obtener tu API Key de Google Maps

Para que la aplicación funcione con Google Maps, necesitas una clave API gratuita:

## Paso 1: Crear/Acceder a Google Cloud Console
1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google

## Paso 2: Crear un Proyecto
1. Haz clic en el menú desplegable del proyecto (arriba)
2. Clic en "Nuevo Proyecto"
3. Ponle un nombre como "Optimizador Rutas"
4. Clic en "Crear"

## Paso 3: Habilitar APIs
1. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
2. Busca y habilita estas APIs:
   - **Maps JavaScript API**
   - **Directions API**
   - **Geocoding API** (opcional)

## Paso 4: Crear API Key
1. Ve a "APIs y servicios" > "Credenciales"
2. Clic en "+ CREAR CREDENCIALES" > "Clave de API"
3. Copia la clave que aparece

## Paso 5: Configurar la Clave en tu Proyecto
1. Abre el archivo `index.html`
2. Busca la línea que dice:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&callback=initMap&libraries=geometry&v=weekly" defer></script>
   ```
3. Reemplaza `TU_API_KEY` con tu clave real

**Ejemplo:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBXXXXXXXXXXXXXXXXXXXXX&callback=initMap&libraries=geometry&v=weekly" defer></script>
```

## Paso 6 (Opcional): Restringir la API Key
Por seguridad, puedes restringir tu clave:
1. En Google Cloud Console, ve a "Credenciales"
2. Haz clic en tu API Key
3. En "Restricciones de aplicación", selecciona:
   - **Sitios web** y agrega: `file:///*` (para desarrollo local)
4. En "Restricciones de API", selecciona las APIs habilitadas

## Nota sobre el Plan Gratuito
- Google Maps ofrece **$200 USD de crédito gratis mensual**
- Esto equivale a ~28,000 cargas de mapa al mes
- Para un proyecto escolar/PYME es más que suficiente
- NO necesitas ingresar tarjeta de crédito para empezar (pero tiene límites menores sin ella)

## ¿Problemas?
Si ves el mensaje "For development purposes only" en el mapa:
- Es normal si no has configurado facturación
- El mapa funcionará igual para desarrollo
- Para producción necesitarás activar facturación (pero el crédito gratis cubre uso normal)
