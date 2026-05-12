window.addEventListener('DOMContentLoaded', (event) => {
    const flashes = document.querySelectorAll('.flash');
    
    flashes.forEach(flash => {
        // Desaparece después de 3 segundos
        setTimeout(() => {
            flash.classList.add('hide');
        }, 3000);

        // Elimina del DOM después de la animación
        flash.addEventListener('animationend', () => {
            flash.remove();
        });
    });
});
