# Plan de refactorización de `public/js/app.js`

## Objetivo

Separar `public/js/app.js` en varios módulos más pequeños y coherentes, sin cambiar el comportamiento actual de la aplicación.

---

## 1. Nueva estructura de archivos JS

En `public/js/` se crearán los siguientes archivos:

- `app-core.js` → inicialización general y utilidades compartidas
- `app-generador.js` → lógica del formulario Generador
- `app-consulta.js` → lógica del Buscador / Consulta
- `app-historial.js` → lógica de Historial
- `app-editor.js` → lógica del Editor de JS
- `app-init.js` → punto único de inicialización (se carga de último)

En `public/index.html`, al final del `<body>`, se reemplazará el script único por:

```html
<script src="/js/app-core.js"></script>
<script src="/js/app-generador.js"></script>
<script src="/js/app-consulta.js"></script>
<script src="/js/app-historial.js"></script>
<script src="/js/app-editor.js"></script>
<script src="/js/app-init.js"></script>
```

- **Orden de carga**: este orden garantiza que las funciones estén definidas antes de usarse.
- **Regla del plan**: el `DOMContentLoaded` vive únicamente en `app-init.js` para evitar dependencias frágiles entre archivos.

---

## 2. Agrupación de funciones existentes

Tomando el `public/js/app.js` actual, se agrupan las funciones así:

### 2.1. Core / compartidas (`app-core.js`)

- **Variables globales (única fuente de verdad)**:
  - `let modoActual = 'prueba';`
  - `let areaCount = 0;`
  - `let reglamentariosFiles = [];`
  - `let editorAreaCount = 0;`
  - `let editorCurrentFile = '';`
- **Funciones**:
  - `setModo(modo)`
  - `showToast(type, title, body)`
  - `hideToast()`
  - `autoCompletarReferencia(id, el, prefix = '')`
  - `loadScripts()`

> Nota: `app-core.js` **no** debe ejecutar lógica al cargar (sin `DOMContentLoaded`). Solo define estado y utilidades.

### 2.2. Generador (`app-generador.js`)

Funciones relacionadas con el formulario de generación de scripts y áreas:

- **Manejo de áreas**:
  - `agregarArea()`
  - `eliminarArea(id)`
  - `actualizarContador()`
- **Importación desde Excel**:
  - `procesarExcel(id, inputEl)`
- **Cliente / documentos**:
  - `getClienteNombre()`
  - `verificarDocumentosReglamentarios(inputEl)`
  - `renderizarListaReglamentarios()`
  - `removerArchivoReg(index)`
- **Lógica principal de generación**:
  - `generar()`

**Dependencias**:
- Usa variables de core (`modoActual`, `reglamentariosFiles`)
- Usa utilidades de core (`showToast`, `hideToast`, `autoCompletarReferencia`)

### 2.3. Consulta (`app-consulta.js`)

- **Funciones**:
  - `consultar()`
  - `renderizarResultados(resultados)`

**Dependencias**:
- `showToast`, `hideToast`
- Clases CSS (`results-table`, `badge-found`, `badge-missing`) ya definidas en `styles.css`

### 2.4. Historial (`app-historial.js`)

- **Funciones**:
  - `cargarHistorial()`

**Dependencias**:
- Acceso al DOM (`#historial-body`)
- (Opcional) `showToast` para errores (si se decide añadirlo)

### 2.5. Editor (`app-editor.js`)

Funciones de manejo del editor de archivos JS:

- **Carga de archivos y áreas**:
  - `editorCargarListaArchivos()`
  - `editorCargarAreas()`
- **Manejo de tarjetas de área del editor**:
  - `editorCrearAreaCard(nombre, referencia, celdas)`
  - `editorEliminarArea(id)`
  - `editorAgregarArea()`
  - `editorActualizarContador()`
- **Importar desde Excel en el editor**:
  - `editorProcesarExcel(id, inputEl)`
- **Guardado de cambios**:
  - `editorGuardar()`

**Dependencias**:
- Variables de core (`editorAreaCount`, `editorCurrentFile`)
- Utilidades (`autoCompletarReferencia`, `showToast`, `hideToast`)

### 2.6. Inicialización (`app-init.js`)

Único lugar donde se “arranca” la UI.

- En `DOMContentLoaded`:
  - Registrar `change` en `#clienteSeleccionado` (mostrar/ocultar `#clienteNuevo`).
  - Llamar a `loadScripts()`.
  - Llamar a `agregarArea()` para crear el Área #1 por defecto.

---

## 3. Pasos concretos de refactorización

1. **Crear un backup** del archivo actual:
   - Guardar `public/js/app.js` como `public/js/app.backup.js`.
2. **Crear `app-core.js`**:
   - Mover variables globales y utilidades compartidas:
     - `setModo`, `showToast`, `hideToast`, `autoCompletarReferencia`, `loadScripts`.
3. **Crear `app-generador.js`**:
   - Mover la lógica de áreas, Excel, documentos y `generar()`.
4. **Crear `app-consulta.js`**:
   - Mover `consultar()` y `renderizarResultados()`.
5. **Crear `app-historial.js`**:
   - Mover `cargarHistorial()`.
6. **Crear `app-editor.js`**:
   - Mover todas las funciones `editor*`.
7. **Crear `app-init.js`**:
   - Colocar allí el `DOMContentLoaded` y las llamadas de arranque.
8. **Actualizar `public/index.html`**:
   - Eliminar `<script src="/js/app.js"></script>`.
   - Añadir los nuevos `<script>` en el orden de la sección 1.
9. **Eliminar el antiguo `app.js`** (opcional):
   - Solo después de comprobar que todo funciona.
   - Mantener `app.backup.js` como referencia histórica durante un tiempo.

---

## 4. Plan de pruebas después del refactor

### 4.1. Generador

- Abrir la app en el navegador.
- Verificar que:
  - Se crea automáticamente el Área #1.
  - El select de scripts base se llena (`/api/scripts`).
  - Se puede:
    - Añadir/eliminar áreas.
    - Pegar celdas y que se autocomplete la referencia.
    - Importar desde Excel un área.
    - Hacer clic en “Generar Script” y recibir el toast de éxito o error.
    - Subir documentos reglamentarios y por área y que el flujo siga funcionando.

### 4.2. Consulta

- Cambiar al modo “Buscador / Consulta”.
- Pegar varios términos separados por saltos de línea o comas.
- Verificar que:
  - Se llama `/api/consultar`.
  - Se muestran los resultados correctamente en la tabla.

### 4.3. Historial

- Cambiar al modo “Historial de Auditoría”.
- Verificar que:
  - Se llama `/api/historial`.
  - La tabla se llena.
  - Los botones de exportar Excel/CSV navegan a las URLs correctas.

### 4.4. Editor

- Cambiar al modo “Editor de JS”.
- Verificar que:
  - Se carga la lista de archivos (`/api/editor/list-js`).
  - Al elegir uno, se cargan las áreas (`/api/editor/get-areas/...`).
  - Se pueden agregar y eliminar áreas.
  - Se puede guardar (`/api/editor/save-areas`) y que se limpian los inputs de archivos.

### 4.5. Consola del navegador

- Durante todas las pruebas:
  - Verificar que no aparecen errores de:
    - `ReferenceError: X is not defined`
    - `TypeError: ... is not a function`
  - Si aparecen, revisar:
    - Orden de los `<script>`.
    - Que la función/variable esté en el archivo correcto y cargado antes.

---

## 5. Mejoras futuras (opcional)

- Migrar a módulos ES (`import`/`export`) y usar un bundler (Vite, Webpack, etc.).
- Separar aún más por responsabilidad:
  - `app-generador-areas.js`
  - `app-generador-docs.js`
  - `app-editor-docs.js`
- Añadir tests de integración para las llamadas a los endpoints del backend.