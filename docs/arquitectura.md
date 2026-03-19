## Arquitectura general de Centinela

Este documento resume cómo se conectan el frontend, el backend y el sistema de archivos en la aplicación Centinela (Generador de Scripts, Buscador, Historial, Editor de JS y módulo Git).

### Diagrama de alto nivel

```mermaid
flowchart LR
  user["Usuario en navegador"]

  subgraph frontend ["Frontend (public/)"]
    html["index.html"]
    css["css/styles.css"]
    jsCore["js/app-core.js"]
    jsGenerador["js/app-generador.js"]
    jsConsulta["js/app-consulta.js"]
    jsHistorial["js/app-historial.js"]
    jsEditor["js/app-editor.js"]
    jsGit["js/app-git.js"]
    jsInit["js/app-init.js"]
  end

  subgraph backend ["Backend Node/Express (server.js)"]
    apiScripts["GET /api/scripts"]
    apiGenerar["POST /api/generar"]
    apiConsultar["POST /api/consultar"]
    apiHistorial["GET /api/historial\nGET /api/historial/exportar"]
    apiLeerExcel["POST /api/leer-excel"]
    apiVerificarDoc["POST /api/verificar-documento"]
    apiSubirDocs["POST /api/subir-documentos"]
    apiEditorList["GET /api/editor/list-js"]
    apiEditorGet["GET /api/editor/get-areas/:filename"]
    apiEditorSave["POST /api/editor/save-areas"]
    apiGitStatus["GET /api/git/status"]
    apiGitPull["POST /api/git/pull"]
    apiGitPush["POST /api/git/push"]
    apiGitInstall["POST /api/git/install-deps"]
  end

  subgraph filesystem ["Sistema de archivos"]
    scriptsRoot["*.js raíz del proyecto\n(Collective.js, Freeport..., etc.)"]
    historialJson["historial.json"]
    documentos["Documentos/"]
    documentosCliente["Documentos/<Cliente>/..."]
    gitCreds["config/git-credentials.txt (local)"]
  end

  user --> html
  html --> jsInit

  jsInit --> jsCore
  jsInit --> jsGenerador
  jsInit --> jsConsulta
  jsInit --> jsHistorial
  jsInit --> jsEditor
  jsInit --> jsGit

  %% Frontend -> Backend
  jsCore --> apiScripts
  jsGenerador --> apiGenerar
  jsGenerador --> apiLeerExcel
  jsGenerador --> apiVerificarDoc
  jsGenerador --> apiSubirDocs
  jsConsulta --> apiConsultar
  jsHistorial --> apiHistorial
  jsEditor --> apiEditorList
  jsEditor --> apiEditorGet
  jsEditor --> apiEditorSave
  jsEditor --> apiSubirDocs
  jsGit --> apiGitStatus
  jsGit --> apiGitPull
  jsGit --> apiGitPush
  jsGit --> apiGitInstall

  %% Backend -> Filesystem
  apiScripts --> scriptsRoot
  apiGenerar --> scriptsRoot
  apiHistorial --> historialJson
  apiHistorial --> scriptsRoot
  apiLeerExcel --> filesystem
  apiVerificarDoc --> documentosCliente
  apiSubirDocs --> documentosCliente
  apiEditorList --> scriptsRoot
  apiEditorGet --> scriptsRoot
  apiEditorSave --> scriptsRoot
  apiGitStatus --> scriptsRoot
  apiGitPull --> scriptsRoot
  apiGitPush --> scriptsRoot
  apiGitPush --> gitCreds
  apiGitInstall --> scriptsRoot
```

### Resumen por capas

- **Frontend (`public/`)**
  - `index.html`: estructura de la interfaz (sidebar, formularios de Generador, Consulta, Historial, Editor de JS y Git).
  - `css/styles.css`: estilos visuales.
  - `js/app-core.js`: estado global (modo actual, contadores), toasts y utilidades compartidas (`loadScripts`, `loadClientes`, `autoCompletarReferencia`, etc.).
  - `js/app-generador.js`: lógica del formulario Generador (áreas, Excel, cliente, documentos y llamada a `/api/generar` y `/api/subir-documentos`).
  - `js/app-consulta.js`: Buscador / Consulta, llama a `/api/consultar` y pinta la tabla de resultados.
  - `js/app-historial.js`: vista de Historial, consume `/api/historial` y muestra la tabla.
  - `js/app-editor.js`: Editor de JS (lista scripts, carga áreas de `const Areas`, permite editar y guardar, y subir documentos por área).
  - `js/app-git.js`: lógica del panel Git (estado del repo, pull con opción forzada, push y ejecución de `npm install` con confirmaciones).
  - `js/app-init.js`: punto de arranque (`DOMContentLoaded`), registra listeners y llama a `loadScripts()`, `loadClientes()` y `agregarArea()`.

- **Backend (`server.js`)**
  - Servidor Express en `http://localhost:3001`.
  - Endpoints:
    - Generador: `/api/scripts`, `/api/generar`.
    - Consulta: `/api/consultar`.
    - Historial: `/api/historial`, `/api/historial/exportar`.
    - Excel: `/api/leer-excel`.
    - Documentos: `/api/verificar-documento`, `/api/subir-documentos`.
    - Editor de JS: `/api/editor/list-js`, `/api/editor/get-areas/:filename`, `/api/editor/save-areas`.
    - Git: `/api/git/status`, `/api/git/pull`, `/api/git/push`, `/api/git/install-deps`.

- **Sistema de archivos**
  - Raíz del proyecto: scripts `.js` (Collective, Freeport, etc.) que sirven como base o destino del generador y editor.
  - `historial.json`: registro estructurado de las generaciones, consumido por la vista Historial y las exportaciones.
  - `config/git-credentials.txt` (opcional/local): credenciales para `git push` desde la web, ignoradas por `.gitignore`.
  - `Documentos/`:
    - Subcarpeta por cliente (`Documentos/<Cliente>`).
    - Dentro de cada cliente: `DocumentosReglamentarios/`, `CertificadoAmbiental/`, `Sheips/`, donde se guardan los archivos subidos desde la app.

