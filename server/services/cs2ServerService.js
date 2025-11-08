const { spawn } = require('child_process');

const CS2_SERVER_BIN = process.env.CS2_SERVER_BIN || 'cs2-server';
const CS2_INSTANCE = process.env.CS2_INSTANCE || '@lol01';
const CS2_WORKDIR = process.env.CS2_WORKDIR || undefined; // optional working directory for cs2-server script
const CS2_DEFAULT_MAP = process.env.CS2_DEFAULT_MAP || 'de_inferno';

// Available CS2 server instances to check
// Can be configured via CS2_INSTANCES env var (comma-separated) or defaults to single instance
const CS2_INSTANCES = process.env.CS2_INSTANCES 
    ? process.env.CS2_INSTANCES.split(',').map(i => i.trim())
    : [CS2_INSTANCE];

// Track which instance is assigned to which lobby
const instanceAssignments = new Map(); // instanceName => lobbyId

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

function runCommand(args, instanceName, options = {}) {
    // Executes: cs2-server <instanceName> <args>
    // Example: spawn('cs2-server', ['@lol01', 'start'])
    const instance = instanceName || CS2_INSTANCE;
    return new Promise((resolve, reject) => {
        const child = spawn(CS2_SERVER_BIN, [instance, ...args], {
            cwd: CS2_WORKDIR,
            env: { ...process.env, ...(options.env || {}) },
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });

        child.on('error', (err) => {
            // Log spawn errors (like ENOENT when command not found)
            console.error(`[CS2] Spawn error for command: ${CS2_SERVER_BIN} ${instance} ${args.join(' ')}`);
            console.error(`[CS2] Error: ${err.message || err.toString()}, Code: ${err.code || 'NO_CODE'}`);
            reject(err);
        });

        child.on('close', (code) => {
            if (code === 0) resolve({ code, stdout, stderr });
            else reject(new Error(`cs2-server exited with code ${code}: ${stderr || stdout}`));
        });
    });
}

/**
 * Check if an instance is running/active
 * CLI Command: cs2-server <instance> status
 */
async function checkInstanceStatus(instanceName) {
    try {
        const result = await runCommand(['status'], instanceName);
        // If status command succeeds, instance exists (may be running or stopped)
        // Parse stdout to determine if it's actually running
        const output = result.stdout.toLowerCase();
        const isRunning = output.includes('running') || output.includes('active') || output.includes('started');
        return { available: !isRunning, status: isRunning ? 'running' : 'stopped', instance: instanceName };
    } catch (err) {
        // If status check fails, assume instance is available (not running)
        return { available: true, status: 'stopped', instance: instanceName };
    }
}

/**
 * Find the first available (free) instance
 * Returns the instance name or null if none available
 */
async function findFreeInstance() {
    for (const instance of CS2_INSTANCES) {
        // Check if instance is already assigned to a lobby
        if (instanceAssignments.has(instance)) {
            continue; // Skip if already assigned
        }

        // Check instance status
        const status = await checkInstanceStatus(instance);
        if (status.available) {
            return instance;
        }
    }
    return null; // No free instances
}

/**
 * Start a CS2 server instance
 * If instanceName is not provided, finds a free instance automatically
 * @param {string} initialMap - Map to start with
 * @param {string} instanceName - Optional specific instance to use
 * @param {string} lobbyId - Optional lobby ID to track assignment
 */
async function startInstance(initialMap, instanceName = null, lobbyId = null) {
    const mapToUse = normalizeMapName(initialMap) || CS2_DEFAULT_MAP;
    
    try {
        // Find free instance if not specified
        let instanceToUse = instanceName;
        if (!instanceToUse) {
            console.log(`[CS2] Finding free instance for lobby ${lobbyId || 'unknown'}...`);
            instanceToUse = await findFreeInstance();
            if (!instanceToUse) {
                throw new Error('No free CS2 server instances available');
            }
            console.log(`[CS2] Found free instance: ${instanceToUse}`);
        }

        // Check if instance is already in use
        if (instanceAssignments.has(instanceToUse)) {
            throw new Error(`Instance ${instanceToUse} is already assigned to lobby ${instanceAssignments.get(instanceToUse)}`);
        }

        // CLI Command: cs2-server <instance> start
        // Environment: MAP=de_inferno (or specified map)
        console.log(`[CS2] Starting instance ${instanceToUse} with map ${mapToUse} for lobby ${lobbyId || 'unknown'}...`);
        const result = await runCommand(['start'], instanceToUse, { env: { MAP: mapToUse } });
        
        // Track assignment if lobbyId provided
        if (lobbyId) {
            instanceAssignments.set(instanceToUse, lobbyId);
            console.log(`[CS2] Instance ${instanceToUse} assigned to lobby ${lobbyId}`);
        }

        return { ...result, instance: instanceToUse };
    } catch (err) {
        const errorMsg = err.message || err.toString() || 'Unknown error';
        const errorCode = err.code || 'NO_CODE';
        console.error(`[CS2] Error in startInstance for lobby ${lobbyId || 'unknown'}:`, errorMsg);
        console.error(`[CS2] Error code: ${errorCode}`);
        throw err; // Re-throw to be caught by caller
    }
}

/**
 * Stop a CS2 server instance
 * @param {string} instanceName - Instance to stop (defaults to CS2_INSTANCE)
 * @param {string} lobbyId - Optional lobby ID to release assignment
 */
async function stopInstance(instanceName = null, lobbyId = null) {
    const instance = instanceName || CS2_INSTANCE;
    // CLI Command: cs2-server <instance> stop
    const result = await runCommand(['stop'], instance);
    
    // Release assignment if lobbyId matches
    if (lobbyId && instanceAssignments.get(instance) === lobbyId) {
        instanceAssignments.delete(instance);
    }
    
    return result;
}

/**
 * Restart a CS2 server instance
 * @param {string} initialMap - Map to restart with
 * @param {string} instanceName - Instance to restart (defaults to CS2_INSTANCE)
 */
async function restartInstance(initialMap, instanceName = null) {
    const mapToUse = normalizeMapName(initialMap) || CS2_DEFAULT_MAP;
    const instance = instanceName || CS2_INSTANCE;
    // CLI Command: cs2-server <instance> restart
    // Environment: MAP=de_inferno (or specified map)
    return runCommand(['restart'], instance, { env: { MAP: mapToUse } });
}

/**
 * Change map level without restarting server
 * @param {string} mapName - Map to change to
 * @param {string} instanceName - Instance to change map on (defaults to CS2_INSTANCE)
 */
async function changeLevel(mapName, instanceName = null) {
    const normalized = normalizeMapName(mapName);
    const instance = instanceName || CS2_INSTANCE;
    // CLI Command: cs2-server <instance> exec changelevel de_inferno
    // changelevel avoids full restart (just changes map without restarting server)
    return runCommand(['exec', `changelevel ${normalized}`], instance);
}

/**
 * Get status of all instances
 * Returns array of instance statuses
 */
async function getAllInstanceStatuses() {
    const statuses = [];
    for (const instance of CS2_INSTANCES) {
        const status = await checkInstanceStatus(instance);
        status.lobbyId = instanceAssignments.get(instance) || null;
        statuses.push(status);
    }
    return statuses;
}

/**
 * Release instance assignment (when lobby ends)
 * @param {string} instanceName - Instance to release
 * @param {string} lobbyId - Lobby ID to verify before releasing
 */
function releaseInstance(instanceName, lobbyId) {
    if (instanceAssignments.get(instanceName) === lobbyId) {
        instanceAssignments.delete(instanceName);
        return true;
    }
    return false;
}

module.exports = {
    startInstance,
    stopInstance,
    restartInstance,
    changeLevel,
    normalizeMapName,
    checkInstanceStatus,
    findFreeInstance,
    getAllInstanceStatuses,
    releaseInstance
};


