const fs = require('fs');
const path = require('path');

// Directorio raíz del proyecto (un nivel arriba de scripts/)
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Configuración de elementos a limpiar
const CONFIG = {
    // Artefactos generados por compilación o pruebas
    build: [
        'dist',
        'coverage',
        'tsconfig.tsbuildinfo'
    ],
    // Dependencias instaladas
    modules: [
        'node_modules'
    ],
    // Bloqueos de versiones
    lock: [
        'package-lock.json'
    ]
};

/**
 * Elimina de forma segura un archivo o directorio.
 * @param {string} relativePath Ruta relativa a la raíz del proyecto
 */
function removeTarget(relativePath) {
    const targetPath = path.join(PROJECT_ROOT, relativePath);

    if (!fs.existsSync(targetPath)) {
        return;
    }

    try {
        const stats = fs.lstatSync(targetPath);
        const type = stats.isDirectory() ? 'directory' : 'file';
        console.log(`Deleting ${type} "${relativePath}"...`);

        fs.rmSync(targetPath, {
            recursive: true,
            force: true,
            maxRetries: 3,
            retryDelay: 100
        });
    } catch (err) {
        console.error(`Error deleting "${relativePath}":`, err.message);
    }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node ./scripts/clean.js [opciones]

Opciones:
  (sin opciones)    Limpia artefactos de compilación (${CONFIG.build.join(', ')})
  --all, -a         Limpia todo (build, node_modules y package-lock.json)
  --modules, -m     Limpia únicamente node_modules
  --lock, -l        Limpia únicamente package-lock.json
  --help, -h        Muestra esta ayuda
`);
    process.exit(0);
}

const cleanAll = args.includes('--all') || args.includes('-a');
const cleanModules = cleanAll || args.includes('--modules') || args.includes('-m');
const cleanLock = cleanAll || args.includes('--lock') || args.includes('-l');

console.log('Cleaning working tree...');

// 1. Limpieza estándar (artefactos de build)
CONFIG.build.forEach(removeTarget);

// 2. Limpieza de dependencias si se solicita
if (cleanModules) {
    CONFIG.modules.forEach(removeTarget);
}

// 3. Limpieza de lockfile si se solicita
if (cleanLock) {
    CONFIG.lock.forEach(removeTarget);
}

console.log('Successfully cleaned working tree!');