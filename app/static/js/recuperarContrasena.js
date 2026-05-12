document.addEventListener('DOMContentLoaded', function() {
    const procesarBtn = document.getElementById('procesarBtn');
    const usuarioInput = document.getElementById('usuario'); 
    const emailError = document.getElementById('emailError'); 
    
    // Eliminado TIPO_RECUPERACION y localStorage.removeItem

    // Manejar el clic del botón
    procesarBtn.addEventListener('click', function() {
        const usuario = usuarioInput.value.trim();

        if (!usuario) {
            emailError.innerHTML = `<div class="error-text">❌ Por favor ingresa tu correo electrónico</div>`;
            return;
        }

        // Validar formato de email
        if (!isValidEmail(usuario)) {
            emailError.innerHTML = `<div class="error-text">❌ Por favor ingresa un correo electrónico válido</div>`;
            return;
        }

        // Estilo de carga
        procesarBtn.innerHTML = '⏳ ENVIANDO CÓDIGO...';
        procesarBtn.disabled = true;
        procesarBtn.style.opacity = "0.7";
        emailError.innerHTML = ''; 

        // Hacer fetch al backend
        fetch('/crede/validar_usuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                usuario: usuario
                // Eliminado 'tipo'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                 
                window.location.href = URL_VERIFICAR_CODE; 
            } else {
                emailError.innerHTML = `<div class="error-text">❌ ${data.message}</div>`;
                resetButton();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            emailError.innerHTML = '<div class="error-text">❌ Error de conexión con el servidor</div>';
            resetButton();
        });
    });

    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Función para resetear botón
    function resetButton() {
        procesarBtn.innerHTML = 'ENVIAR CÓDIGO';
        procesarBtn.disabled = false;
        procesarBtn.style.opacity = "1";
    }

    // Permitir enviar con Enter
    usuarioInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            procesarBtn.click();
        }
    });
});