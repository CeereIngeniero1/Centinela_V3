# Centinela Script Generator ⚡

![Centinela Web](public/favicon.ico) *Interfaz Web de Generación y Consulta de Scripts para Automatización RPA.*

---

## 📖 Introducción
El **Centinela Script Generator** es una interfaz web desarrollada a medida para el equipo, diseñada para eliminar la necesidad de editar código JavaScript manualmente antes de cada ejecución del bot. 

Al proporcionar una interfaz gráfica intuitiva, cualquier miembro del equipo puede configurar scripts para "Prueba/Monitoreo" o "Radicación Real" en segundos, asegurando el cumplimiento estricto del estándar **SOP-IT-1000**.

---

## 🏗️ Arquitectura del Sistema
El proyecto consta de una arquitectura ligera y autónoma construida sobre Node.js (Compatible con v12+ debido a dependencias del ecosistema RPA subyacente de Puppeteer y nut-js):

- **Backend (`server.js`):** Servidor Express.js responsable de procesar las solicitudes de generación de scripts, aplicar expresiones regulares para inyectar áreas y modificar la lógica de los `.js` base según las reglas del SOP.
- **Frontend (`public/index.html`):** Interfaz SPA (Single Page Application) responsiva en HTML/CSS/JS nativo. No requiere frameworks externos, optimizando la velocidad y facilidad de mantenimiento.
- **Lanzador (`INICIAR_GENERADOR.bat`):** Script de terminal que automatiza la limpieza de puertos (Port 3001) y el inicio del servidor, ofreciendo una experiencia de un solo clic.

---

## 🎮 Modos de Operación

La aplicación se divide en 3 modos principales:

### 1. 🧪 Modo Monitoreo / Prueba
Diseñado para correr el bot de forma segura extra trayendo información sin generar radicaciones reales en las plataformas mineras.
**Reglas Automáticas Aplicadas (SOP-IT-1000):**
- **Regla 1:** Redirige todos los correos electrónicos (`mailOptions.to`) exclusivamente a `Soporte2ceere@gmail.com`.
- **Regla 2:** Identifica y elimina por completo el bloque de código responsable del clic final de radicación (desde `const continPag` hasta `//CORREO RADICACION`).
- **Regla 3:** Desactiva los temporizadores automáticos de recarga (`RadiPrimero` y `Radisegundo`).
- **Regla 4:** Inyecta de forma dinámica las áreas a monitorear al inicio del arreglo `const Areas`.

### 2. 🚀 Modo Radicación Real
Diseñado para la ejecución en Producción.
- Mantiene intacta toda la lógica de correos electrónicos originales y el proceso de radicación.
- Únicamente inyecta la información de las nuevas áreas y celdas al inicio del arreglo `const Areas`.

### 3. 🔎 Modo Consulta
Una herramienta de auditoría rápida para el repositorio de código.
- Permite pegar listas masivas de celdas o números de áreas.
- Escanea a nivel de texto todos los archivos `.js` ubicados en la raíz del proyecto.
- Retorna un informe detallado indicando exactamente en qué scripts (ej: `Freeport.js`, `Monitor_Lunes.js`) existe cada término buscado, o si el término es completamente nuevo.

---

## ✨ Funcionalidades "Premium" (Quality of Life)

Pensando en la velocidad de uso diario, el frontend incluye lógicas avanzadas:

*   **Soporte Multi-área Dinámico:** Permite agregar un número ilimitado de "Tarjetas de Área" (Nombre, Referencia, Celdas) en una sola generación. El servidor se encarga de inyectarlas en el orden correcto dentro del script.
*   **Auto-formateo Inteligente de Celdas:** Si el usuario pega una lista de celdas directamente desde una columna de Excel o un PDF (con saltos de línea, tabuladores o espacios irregulares), el campo lo formatea instantáneamente a una cadena limpia separada por comas (`Celda1, Celda2, Celda3`).
*   **Auto-población de Celda de Referencia:** Al pegar una lista de múltiples celdas, el sistema extrae automáticamente la primera de la lista y la asigna como la "Celda de Referencia" del área correspondiente, ahorrando clicks y copypastes redundantes.

---

## 🚀 Cómo Iniciar el Proyecto

1. Haz doble clic en el archivo **`INICIAR_GENERADOR.bat`**.
2. Una ventana negra de consola se abrirá. Si el puerto 3001 estaba ocupado por una sesión anterior, el script lo cerrará primero de forma segura.
3. Abre tu navegador favorito y visita: `http://localhost:3001`
4. Selecciona el script base, el modo, configura tus áreas y haz clic en "Generar Script".
5. Una vez generado, ve a tu terminal habitual y ejecuta el bot pasándole tu nuevo archivo `.js`.
