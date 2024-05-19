document.getElementById('register-button').addEventListener('click', async () => {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await window.electron.registerUser({ username, password });

    if (response.status === 'success') {
        localStorage.setItem('userId', response.userId);
        window.location.href = 'createPin.html';
    } else {
        alert('Registration failed');
    }
});

document.getElementById('login-button').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await window.electron.loginUser({ username, password });

    if (response.status === 'success') {
        localStorage.setItem('userId', response.userId);
        window.location.href = 'pin.html';
    } else {
        alert('Login failed: ' + response.message);
    }
});
