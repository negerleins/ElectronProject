// Electron main process
import { app, BrowserWindow, session } from 'electron';
import { isDev, ipcHandle } from './util.js';
import { pullResources, getStaticData } from './resources.js';
import { getPreloadPath, getInterfacePath } from './resolver.js';
import {
    getDevices,
    startScan,
    stopScan,
    removeDevice,
    getPairedDevices,
    getAttachedDevices,
    unpairDevice,
    pairDevice,
    connectDevice
} from './bluetooth.js';
import process from 'process';

app.on('ready', async () => {
    if (isDev()) {
        try {
            await session.defaultSession.loadExtension(
                `${process.env.HOME}/.config/chromium/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi`
            );
            console.log('Added React DevTools');
        } catch (e) {
            console.warn('Could not add React DevTools:', e.message);
        }
    }

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
        },
    });

    // Set CSP headers
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    isDev()
                    ? "default-src 'self';" +
                      "script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
                      "style-src 'self' 'unsafe-inline';" +
                      "img-src 'self' data:;" +
                      "connect-src 'self' ws://localhost:5173;" +
                      "worker-src 'self';" +
                      "font-src 'self' data:;"
                    : "default-src 'self';" +
                      "script-src 'self';" +
                      "style-src 'self' 'unsafe-inline';" +
                      "img-src 'self' data:;" +
                      "connect-src 'self';" +
                      "worker-src 'self';" +
                      "font-src 'self' data:;"
                ]
            }
        });
    });

    if (isDev()) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(
            getInterfacePath() + '/index.html'
        );
    };

    pullResources(mainWindow);

    ipcHandle('getStaticData', async () => {
        return await getStaticData();
    });

    // Add Bluetooth IPC handlers
    ipcHandle('bluetooth:getDevices', async () => {
        try {
            const response = await getDevices();
            console.log('Main process devices response:', response);

            if (!response.success) {
                throw new Error(response.error || 'Failed to get devices');
            }

            return response; // Contains { success: true, devices: [] }
        } catch (error) {
            console.error('Failed to get devices:', error);
            return {
                success: false,
                error: error.message,
                devices: []
            };
        }
    });

    let scanWebContents = null;

    ipcHandle('bluetooth:startScan', async ({ sender }) => {
        try {
            if (!sender || sender.isDestroyed()) {
                throw new Error('Invalid or destroyed sender');
            }

            scanWebContents = sender;
            const result = await startScan((newDevice) => {
                if (scanWebContents && !scanWebContents.isDestroyed()) {
                    scanWebContents.send('bluetooth:newDevice', newDevice);
                }
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            scanWebContents = null;
            console.error('Failed to start scan:', error);
            throw error;
        }
    });

    ipcHandle('bluetooth:stopScan', async () => {
        try {
            const result = await stopScan();
            scanWebContents = null;
            return result;
        } catch (error) {
            console.error('Failed to stop scan:', error);
            throw error;
        } finally {
            scanWebContents = null;
        }
    });

    ipcHandle('bluetooth:removeDevice', async ({ sender }, deviceId) => {
        try {
            if (!deviceId || typeof deviceId !== 'string') {
                throw new Error('Invalid device ID');
            }
            const result = await removeDevice(deviceId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        } catch (error) {
            console.error('Failed to remove device:', error);
            throw error;
        }
    });

    ipcHandle('bluetooth:getPairedDevices', async () => {
        try {
            const response = await getPairedDevices();
            console.log('Main process paired devices response:', response);
            return response;
        } catch (error) {
            console.error('Failed to get paired devices:', error);
            throw error;
        }
    });

    ipcHandle('bluetooth:getAttachedDevices', async () => {
        try {
            const response = await getAttachedDevices();
            console.log('Main process attached devices response:', response);
            return response;
        } catch (error) {
            console.error('Failed to get attached devices:', error);
            throw error;
        }
    });

    ipcHandle('bluetooth:pairDevice', async ({ sender }, deviceId) => {
        try {
            if (!deviceId || typeof deviceId !== 'string') {
                throw new Error('Invalid device ID');
            }
            const result = await pairDevice(deviceId);
            if (!result.success) {
                throw new Error(result.error);
            }
            // After successful pairing, try to connect
            const connectResult = await connectDevice(deviceId);
            if (!connectResult.success) {
                console.warn('Failed to connect after pairing:', connectResult.error);
            }
            return result;
        } catch (error) {
            console.error('Failed to pair device:', error);
            throw error;
        }
    });

    ipcHandle('bluetooth:unpairDevice', async (_, deviceId) => {
        try {
            const result = await unpairDevice(deviceId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        } catch (error) {
            console.error('Failed to unpair device:', error);
            throw error;
        }
    });

    ipcHandle('bluetooth:connectDevice', async ({ sender }, deviceId) => {
        try {
            if (!deviceId || typeof deviceId !== 'string') {
                throw new Error('Invalid device ID');
            }
            const result = await connectDevice(deviceId);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        } catch (error) {
            console.error('Failed to connect device:', error);
            throw error;
        }
    });
});
