const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

// Carpeta actual donde está menu.js y los scripts
const scriptsFolder = __dirname;

// Leer los archivos .js del directorio, excluyendo menu.js
const archivos = fs.readdirSync(scriptsFolder)
    .filter(file => file.endsWith('.js') && file !== 'Menu.js');

// Mostrar menú
console.log('Selecciona el script que deseas ejecutar:\n');
archivos.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
});

// Leer entrada del usuario
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\nIngresa el número del script: ', (numero) => {
    const index = parseInt(numero) - 1;

    if (index >= 0 && index < archivos.length) {
        const script = archivos[index];
        console.log(`\nEjecutando: ${script}...\n`);

        // Ejecutar el script en la misma carpeta
        exec(`node "${path.join(scriptsFolder, script)}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            console.log(`Salida:\n${stdout}`);
            rl.close();
        });
    } else {
        console.log('Opción no válida.');
        rl.close();
    }
});
