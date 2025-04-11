const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    subscribeStatisttics: (callback) => {
        ipcOn('statistics', (data) => {
            callback(data)
        });
    },
    getStaticData: async () => {
        return await ipcInvoke('getStaticData');
    },
    bluetooth: {
        getDevices: () => ipcRenderer.invoke('bluetooth:getDevices'),
        getPairedDevices: () => ipcRenderer.invoke('bluetooth:getPairedDevices'),
        getAttachedDevices: () => ipcRenderer.invoke('bluetooth:getAttachedDevices'),
        startScan: () => ipcRenderer.invoke('bluetooth:startScan'),
        stopScan: () => ipcRenderer.invoke('bluetooth:stopScan'),
        onNewDevice: (callback) => {
            ipcRenderer.on('bluetooth:newDevice', (_, device) => callback(device));
        },
        removeDevice: (deviceId) => ipcRenderer.invoke('bluetooth:removeDevice', deviceId),
        pairDevice: (deviceId) => ipcRenderer.invoke('bluetooth:pairDevice', deviceId),
        unpairDevice: (deviceId) => ipcRenderer.invoke('bluetooth:unpairDevice', deviceId),
        connectDevice: (deviceId) => ipcRenderer.invoke('bluetooth:connectDevice', deviceId)
    }
});

function ipcInvoke(key) {
    return new Promise((resolve, reject) => {
        ipcRenderer.invoke(key).then((data) => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        });
    });
};

function ipcOn(key, callback) {
    ipcRenderer.on(key, (_, data) => {
        callback(data);
    });
}
