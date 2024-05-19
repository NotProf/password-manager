document.getElementById('pin-button').addEventListener('click', async () => {
    const pin = document.getElementById('pin-code').value;
    const pinConfirm = document.getElementById('pin-confirm').value;
    const userId = localStorage.getItem('userId');

    if (pin !== pinConfirm) {
        alert('PINs do not match');
        return;
    }

    const response = await window.electron.setPin({ userId, pin });

    if (response.status === 'success') {
        window.location.href = 'home.html';
    } else {
        alert('Failed to set PIN');
    }
});
