document.getElementById('add-secret-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('secret-name').value;
    const description = document.getElementById('secret-description').value;
    const secret = document.getElementById('secret-value').value;
    const index = document.getElementById('secret-index').value;
    const userId = localStorage.getItem('userId');

    const secretData = { name, description, secret };
    if (index) {
        const secrets = await window.electron.getSecrets(userId);
        secrets[parseInt(index)] = secretData;
        await window.electron.saveSecrets({ userId, secrets });
    } else {
        await window.electron.saveSecret({ userId, secret: secretData });
    }

    displaySecrets();
    document.getElementById('add-secret-form').reset();
    document.getElementById('secret-index').value = '';
    bootstrap.Modal.getInstance(document.getElementById('addSecretModal')).hide();
});

async function displaySecrets() {
    const userId = localStorage.getItem('userId');
    const secrets = await window.electron.getSecrets(userId);
    const secretsList = document.getElementById('secrets-list');
    secretsList.innerHTML = '';

    if (secrets.length === 0) {
        secretsList.innerHTML = '<tr><td colspan="5" class="text-center" id="no-secrets">No secrets yet</td></tr>';
    } else {
        secrets.forEach((secret, index) => {
            const secretElement = document.createElement('tr');
            secretElement.innerHTML = `
        <th scope="row">${index + 1}</th>
        <td>${secret.name}</td>
        <td>${secret.description}</td>
        <td>
          <span id="secret-${index}" class="d-none">${secret.secret}</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="showSecret(${index})">Show</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="copySecret(${index})">Copy</button>
        </td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteSecret(${index})">Remove</button>
          <button class="btn btn-secondary btn-sm" onclick="editSecret(${index})">Edit</button>
        </td>
      `;
            secretsList.appendChild(secretElement);
        });
    }
}

function showSecret(index) {
    const secretSpan = document.getElementById(`secret-${index}`);
    if (secretSpan.classList.contains('d-none')) {
        secretSpan.classList.remove('d-none');
    } else {
        secretSpan.classList.add('d-none');
    }
}

function copySecret(index) {
    const secret = document.getElementById(`secret-${index}`).textContent;
    navigator.clipboard.writeText(secret).then(() => {
        alert('Secret copied to clipboard');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

async function deleteSecret(index) {
    const userId = localStorage.getItem('userId');
    const response = await window.electron.deleteSecret({ userId, secretIndex: index });

    if (response.status === 'success') {
        displaySecrets();
    } else {
        alert('Failed to delete secret');
    }
}

async function editSecret(index) {
    const userId = localStorage.getItem('userId');
    const secrets = await window.electron.getSecrets(userId);
    const secret = secrets[index];

    document.getElementById('secret-name').value = secret.name;
    document.getElementById('secret-description').value = secret.description;
    document.getElementById('secret-value').value = secret.secret;
    document.getElementById('secret-index').value = index;

    bootstrap.Modal.getInstance(document.getElementById('addSecretModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
    displaySecrets();
});
