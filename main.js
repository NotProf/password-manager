const { app, BrowserWindow, ipcMain, systemPreferences } = require('electron');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-256-cbc';
const secretKey = crypto.createHash('sha256').update('my_static_secret_key').digest();
const iv = Buffer.alloc(16, 0); // Initialization vector

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    if (isLoggedIn()) {
        mainWindow.loadFile('pin.html');
    } else {
        mainWindow.loadFile('index.html');
    }
});

ipcMain.handle('register-user', async (event, userData) => {
    const userId = generateUserId();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const users = getUsers();
    users[userId] = { username: userData.username, password: hashedPassword };
    saveUsers(users);
    return { status: 'success', userId };
});

ipcMain.handle('set-pin', async (event, { userId, pin }) => {
    const users = getUsers();
    users[userId].pin = await bcrypt.hash(pin, 10);
    saveUsers(users);
    return { status: 'success' };
});

ipcMain.handle('login-user', async (event, loginData) => {
    const users = getUsers();
    const user = Object.values(users).find(user => user.username === loginData.username);

    if (user && await bcrypt.compare(loginData.password, user.password)) {
        const token = jwt.sign({ userId: getUserIdByUsername(loginData.username) }, 'your_jwt_secret');
        saveToken(token);
        return { status: 'success', userId: getUserIdByUsername(loginData.username) };
    } else {
        return { status: 'error', message: 'Invalid username or password' };
    }
});

ipcMain.handle('authenticate-touch-id', async () => {
    if (systemPreferences?.canPromptTouchID()) {
        try {
            await systemPreferences.promptTouchID('Authenticate to unlock passwords');
            return { status: 'success' };
        } catch (error) {
            return { status: 'error', message: 'Touch ID authentication failed' };
        }
    } else {
        return { status: 'error', message: 'Touch ID not available' };
    }
});

ipcMain.handle('get-secrets', (event, userId) => {
    const secrets = getSecrets(userId);
    return secrets.map(secret => ({
        ...secret,
        secret: decrypt(secret.secret)
    }));
});

ipcMain.handle('save-secret', (event, { userId, secret }) => {
    const secrets = getSecrets(userId);
    secrets.push({
        ...secret,
        secret: encrypt(secret.secret)
    });
    saveSecrets(userId, secrets);
    return { status: 'success' };
});

ipcMain.handle('delete-secret', (event, { userId, secretIndex }) => {
    const secrets = getSecrets(userId);
    secrets.splice(secretIndex, 1);
    saveSecrets(userId, secrets);
    return { status: 'success' };
});

ipcMain.handle('save-secrets', (event, { userId, secrets }) => {
    const encryptedSecrets = secrets.map(secret => ({
        ...secret,
        secret: encrypt(secret.secret)
    }));
    saveSecrets(userId, encryptedSecrets);
    return { status: 'success' };
});

function saveToken(token) {
    fs.writeFileSync('session.json', JSON.stringify({ token }));
}

function isLoggedIn() {
    try {
        const session = JSON.parse(fs.readFileSync('session.json'));
        const decoded = jwt.verify(session.token, 'your_jwt_secret');
        return !!decoded.userId;
    } catch (error) {
        return false;
    }
}

function generateUserId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function getUsers() {
    if (!fs.existsSync('users.json')) return {};
    return JSON.parse(fs.readFileSync('users.json'));
}

function saveUsers(users) {
    fs.writeFileSync('users.json', JSON.stringify(users));
}

function getUserIdByUsername(username) {
    const users = getUsers();
    return Object.keys(users).find(userId => users[userId].username === username);
}

function getSecrets(userId) {
    const secretsFile = `secrets_${userId}.json`;
    if (!fs.existsSync(secretsFile)) return [];
    return JSON.parse(fs.readFileSync(secretsFile));
}

function saveSecrets(userId, secrets) {
    const secretsFile = `secrets_${userId}.json`;
    fs.writeFileSync(secretsFile, JSON.stringify(secrets));
}

function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(text) {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
