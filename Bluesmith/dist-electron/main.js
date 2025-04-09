// Electron main process
import { app, BrowserWindow, session } from 'electron';
import { isDev, ipcHandle } from './util.js';
import { pullResources, getStaticData } from './resources.js';
import { getPreloadPath, getInterfacePath } from './resolver.js';
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
                    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
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
});
