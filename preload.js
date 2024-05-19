const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    registerUser: (userData) => ipcRenderer.invoke('register-user', userData),
    loginUser: (loginData) => ipcRenderer.invoke('login-user', loginData),
    setPin: (data) => ipcRenderer.invoke('set-pin', data),
    authenticatePin: (data) => ipcRenderer.invoke('authenticate-pin', data),
    getSecrets: (userId) => ipcRenderer.invoke('get-secrets', userId),
    saveSecret: (data) => ipcRenderer.invoke('save-secret', data),
    deleteSecret: (data) => ipcRenderer.invoke('delete-secret', data),
    saveSecrets: (data) => ipcRenderer.invoke('save-secrets', data)
});
