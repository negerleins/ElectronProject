import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let scanProcess = null;
let isScanning = false;

export async function checkBluetoothStatus() {
    try {
        const { stdout } = await execAsync("bluetoothctl show");
        const powered = stdout.includes("Powered: yes");
        if (!powered) {
            await execAsync("bluetoothctl power on");
        }
        return { success: true, powered };
    } catch (error) {
        console.error('Bluetooth status check error:', error);
        return { success: false, error: error.message };
    }
}

export async function getDevices() {
    try {
        // First check if bluetooth is powered on
        const { stdout: status } = await execAsync("bluetoothctl show");
        if (!status.includes("Powered: yes")) {
            await execAsync("bluetoothctl power on");
        }

        // Only get paired/known devices
        const { stdout } = await execAsync("bluetoothctl devices");
        const devices = parseDevices(stdout);

        return {
            success: true,
            devices: devices
        };
    } catch (error) {
        console.error('Bluetooth getDevices error:', error);
        return {
            success: false,
            error: 'Failed to fetch devices: ' + error.message,
            devices: []
        };
    }
}

export async function getPairedDevices() {
    try {
        const { stdout } = await execAsync("bluetoothctl devices");
        const devices = parseDevices(stdout);
        return {
            success: true,
            devices: devices
        };
    } catch (error) {
        console.error('Bluetooth getPairedDevices error:', error);
        return {
            success: false,
            error: 'Failed to fetch paired devices: ' + error.message,
            devices: []
        };
    }
}

export async function getAttachedDevices() {
    try {
        const { stdout } = await execAsync("bluetoothctl devices Connected");
        const devices = parseDevices(stdout);
        return {
            success: true,
            devices: devices
        };
    } catch (error) {
        console.error('Bluetooth getAttachedDevices error:', error);
        return {
            success: false,
            error: 'Failed to fetch attached devices: ' + error.message,
            devices: []
        };
    }
}

export async function startScan(callback) {
    try {
        if (isScanning || scanProcess) {
            return {
                success: false,
                error: 'Scan already in progress'
            };
        }

        await execAsync("bluetoothctl power on");
        scanProcess = spawn('bluetoothctl');
        isScanning = true;

        let buffer = '';

        scanProcess.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                // Handle new devices
                if (line.includes('[NEW] Device')) {
                    const match = line.match(/\[NEW\] Device ([0-9A-F:]+) (.+)/i);
                    if (match) {
                        const id = match[1];
                        const name = match[2].trim();

                        // Skip devices where name is just the MAC address in different format
                        if (isNameJustMacAddress(id, name)) {
                            continue;
                        }

                        callback({
                            id,
                            name,
                            paired: false,
                            new: true,
                            rssi: null
                        });
                    }
                }
                // Handle RSSI updates only for devices we care about
                else if (line.includes('RSSI:')) {
                    const match = line.match(/Device ([0-9A-F:]+) RSSI: (0x[0-9a-f]+|-?\d+)/i);
                    if (match) {
                        const rssi = match[2].startsWith('0x') ?
                            parseInt(match[2], 16) :
                            parseInt(match[2]);
                        callback({
                            id: match[1],
                            rssi: rssi < 0 ? rssi : -rssi,
                            rssiUpdate: true
                        });
                    }
                }
            }
        });

        scanProcess.stdin.write('scan on\n');
        return { success: true };
    } catch (error) {
        isScanning = false;
        if (scanProcess) {
            scanProcess.kill();
            scanProcess = null;
        }
        return {
            success: false,
            error: 'Failed to start scan: ' + error.message
        };
    }
}

export async function stopScan() {
    try {
        if (!isScanning && !scanProcess) {
            return { success: true, message: 'No scan in progress' };
        }

        if (scanProcess) {
            scanProcess.stdin.write('scan off\n');
            scanProcess.kill();
            scanProcess = null;
        }

        isScanning = false;
        return { success: true };
    } catch (error) {
        console.error('Bluetooth stop scan error:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        isScanning = false;
        scanProcess = null;
    }
}

export async function removeDevice(deviceId) {
    try {
        if (typeof deviceId !== 'string') {
            throw new Error('Invalid device ID');
        }
        await execAsync(`bluetoothctl remove ${deviceId}`);
        return { success: true };
    } catch (error) {
        console.error('Bluetooth remove error:', error);
        return {
            success: false,
            error: 'Failed to remove device: ' + error.message
        };
    }
}

export async function pairDevice(deviceId) {
    try {
        if (typeof deviceId !== 'string') {
            throw new Error('Invalid device ID');
        }
        await execAsync(`bluetoothctl pair ${deviceId}`);
        // Wait for pairing to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        await execAsync(`bluetoothctl trust ${deviceId}`);
        return { success: true };
    } catch (error) {
        console.error('Bluetooth pair error:', error);
        return {
            success: false,
            error: 'Failed to pair device: ' + error.message
        };
    }
}

export async function connectDevice(deviceId) {
    try {
        if (typeof deviceId !== 'string') {
            throw new Error('Invalid device ID');
        }
        await execAsync(`bluetoothctl connect ${deviceId}`);
        return { success: true };
    } catch (error) {
        console.error('Bluetooth connect error:', error);
        return {
            success: false,
            error: 'Failed to connect device: ' + error.message
        };
    }
}

export async function unpairDevice(deviceId) {
    try {
        if (typeof deviceId !== 'string') {
            throw new Error('Invalid device ID');
        }
        await execAsync(`bluetoothctl untrust ${deviceId}`);
        await execAsync(`bluetoothctl remove ${deviceId}`);
        return { success: true };
    } catch (error) {
        console.error('Bluetooth unpair error:', error);
        return {
            success: false,
            error: 'Failed to unpair device: ' + error.message,
        };
    }
}

// Helper function to check if a device name is just its MAC address in a different format
function isNameJustMacAddress(macAddress, name) {
    // Remove all common separators from both strings
    const cleanMac = macAddress.replace(/[:\-]/g, '').toLowerCase();
    const cleanName = name.replace(/[:\-]/g, '').toLowerCase();

    // Check if the name is just the MAC in different format
    if (cleanMac === cleanName) return true;

    // Check if name matches MAC-like patterns
    const macPattern = /^([0-9A-Fa-f]{2}[:\-]?){6}$/;
    if (macPattern.test(name.replace(/\s+/g, ''))) return true;

    return false;
}

// Update parseDevices to also filter out MAC-like names
function parseDevices(output) {
    if (!output) return [];

    const devices = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
        if (line.startsWith('Device ')) {
            const match = line.match(/Device ([0-9A-F:]+) (.+)/i);
            if (match) {
                const id = match[1];
                const name = match[2].trim();

                // Only add devices with proper names
                if (!isNameJustMacAddress(id, name)) {
                    devices.push({
                        id,
                        name: name || 'Unknown Device',
                        paired: false,
                        rssi: null
                    });
                }
            }
        }
    }

    return devices;
}
