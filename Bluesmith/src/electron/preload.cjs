const electron = require('electron');

electron.contextBridge.exposeInMainWorld("electron", {
    subscribeStatisttics: (callback) => {
        ipcOn('statistics', (data) => {
            callback(data)
        });
    },
    getStaticData: async () => {
        return await ipcInvoke('getStaticData');
    },
});

function ipcInvoke(key) {
    return new Promise((resolve, reject) => {
        electron.ipcRenderer.invoke(key).then((data) => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        });
    });
};

function ipcOn(key, callback) {
    electron.ipcRenderer.on(key, (_, data) => {
        callback(data);
    });
}
