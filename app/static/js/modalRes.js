function showModal(title, message, type = 'success', redirect = null) {
    const modal = document.getElementById('successModal');
    const icon = modal.querySelector('.modal-icon');
    const titleEl = modal.querySelector('h2');
    const messageEl = modal.querySelector('p');

    // Cambiar colores e iconos según el tipo
    if (type === 'success') {
        icon.textContent = '✅';
        icon.style.color = '#7ED321';
    } else if (type === 'error') {
        icon.textContent = '❌';
        icon.style.color = '#E74C3C';
    } else if (type === 'warning') {
        icon.textContent = '⚠️';
        icon.style.color = '#F39C12';
    } else {
        icon.textContent = 'ℹ️';
        icon.style.color = '#3498DB';
    }

    titleEl.textContent = title;
    messageEl.textContent = message;

    modal.style.display = 'flex';
    modal.querySelector('.close').onclick = () => modal.style.display = 'none';

    // Si hay redirección, espera 2.5s
    if (redirect) {
        setTimeout(() => { window.location.href = redirect; }, 2500);
    }
}
