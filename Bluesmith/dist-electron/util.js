import { ipcMain } from 'electron';
import process from 'process';
import { pathToFileURL } from 'url';
import { getInterfacePath } from './resolver.js';

export function isDev() {
    return process.env.NODE_ENV === 'development'
}

export function validateEventFrame(sender) {
    const frameUrl = sender.getURL();

    if (isDev()) {
        if (new URL(frameUrl).host === 'localhost:5173') {
            return;
        }
    }

    const expectedUrl = pathToFileURL(getInterfacePath()).toString();
    if (frameUrl !== expectedUrl) {
        throw new Error('Invalid frame origin');
    }
}

export function ipcHandle(key, handler) {
    ipcMain.handle(key, async (event, ...args) => {
        try {
            validateEventFrame(event.sender);
            const result = await handler(...args);
            return result;
        } catch (error) {
            console.error(`IPC handler error for ${key}:`, error);
            throw error;
        }
    });
}

export function ipcWebContentsSend(key, mainWindow, data) {
    if (!mainWindow?.webContents) {
        throw new Error('Invalid window reference');
    }
    validateEventFrame(mainWindow.webContents);
    mainWindow.send(key, data);
}
