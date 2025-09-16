const { spawn } = require('child_process');

const CS2_SERVER_BIN = process.env.CS2_SERVER_BIN || 'cs2-server';
const CS2_INSTANCE = process.env.CS2_INSTANCE || '@lan01';
const CS2_WORKDIR = process.env.CS2_WORKDIR || undefined; // optional working directory for cs2-server script
const CS2_DEFAULT_MAP = process.env.CS2_DEFAULT_MAP || 'de_inferno';

// Map display names from lobby to CS map names
const LOBBY_TO_CS_MAP = {
    'Inferno': 'de_inferno',
    'Mirage': 'de_mirage',
    'Nuke': 'de_nuke',
    'Overpass': 'de_overpass',
    'Vertigo': 'de_vertigo',
    'Ancient': 'de_ancient',
    'Dust II': 'de_dust2',
    'Dust2': 'de_dust2'
};

function normalizeMapName(lobbyMapName) {
    if (!lobbyMapName) return CS2_DEFAULT_MAP;
    return LOBBY_TO_CS_MAP[lobbyMapName] || lobbyMapName;
}

function runCommand(args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(CS2_SERVER_BIN, [CS2_INSTANCE, ...args], {
            cwd: CS2_WORKDIR,
            env: { ...process.env, ...(options.env || {}) },
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });

        child.on('error', (err) => {
            reject(err);
        });

        child.on('close', (code) => {
            if (code === 0) resolve({ code, stdout, stderr });
            else reject(new Error(`cs2-server exited with code ${code}: ${stderr || stdout}`));
        });
    });
}

async function startInstance(initialMap) {
    const mapToUse = normalizeMapName(initialMap) || CS2_DEFAULT_MAP;
    // Pass MAP via env for startup
    return runCommand(['start'], { env: { MAP: mapToUse } });
}

async function stopInstance() {
    return runCommand(['stop']);
}

async function restartInstance(initialMap) {
    const mapToUse = normalizeMapName(initialMap) || CS2_DEFAULT_MAP;
    return runCommand(['restart'], { env: { MAP: mapToUse } });
}

async function changeLevel(mapName) {
    const normalized = normalizeMapName(mapName);
    // changelevel avoids full restart
    return runCommand(['exec', `changelevel ${normalized}`]);
}

module.exports = {
    startInstance,
    stopInstance,
    restartInstance,
    changeLevel,
    normalizeMapName
};


