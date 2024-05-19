document.getElementById('pin-button').addEventListener('click', async () => {
    const pin = document.getElementById('pin-code').value;
    const userId = localStorage.getItem('userId');

    const response = await window.electron.authenticatePin({ userId, pin });

    if (response.status === 'success') {
        window.location.href = 'home.html';
    } else {
        alert('Invalid PIN');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await window.electron.authenticateTouchID();

        if (response.status === 'success') {
            window.location.href = 'home.html';
        }
    } catch (error) {
        console.error('Touch ID authentication error:', error);
    }
});
