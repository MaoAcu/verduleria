document.addEventListener('DOMContentLoaded', function() {
    const codeForm = document.getElementById('codeForm');
    const verificationInput = document.getElementById('verificationCode');
    const codeError = document.getElementById('codeError');
    const submitBtn = document.querySelector('.btn-login');
    const resendBtn = document.getElementById('resendCode');

    // --- MANEJO DEL FORMULARIO ---
    codeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const codigo = verificationInput.value.trim();

        if (codigo.length !== 6) {
            showError("El código debe tener 6 dígitos.");
            return;
        }

        submitBtn.innerHTML = '⏳ VERIFICANDO...';
        submitBtn.disabled = true;
        codeError.style.display = 'none';

        fetch('crede/validate_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirección inmediata según el backend
                window.location.href = data.redirect_url || "/nueva-contrasena"; 
            } else {
                showError(data.message || "Código incorrecto. Intente de nuevo.");
                resetButton();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError("Error de conexión con el servidor.");
            resetButton();
        });
    });

    // --- REENVIAR CÓDIGO (Dentro del DOMContentLoaded) ---
    resendBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Cambiamos el texto sutilmente para dar feedback
        const originalText = resendBtn.innerHTML;
        resendBtn.innerHTML = "Enviando...";
        resendBtn.style.pointerEvents = "none";

        fetch('/api/resend-recovery-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Usamos la función del modal que definimos antes
                mostrarExito('¡Enviado!', 'Se ha reenviado un nuevo código a tu correo.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError("No se pudo reenviar el código.");
        })
        .finally(() => {
            resendBtn.innerHTML = originalText;
            resendBtn.style.pointerEvents = "auto";
        });
    });

    
    function showError(msg) {
        codeError.style.display = 'block';
        codeError.querySelector('.error-text').innerHTML = `❌ ${msg}`;
    }

    function resetButton() {
        submitBtn.innerHTML = 'VERIFICAR CÓDIGO';
        submitBtn.disabled = false;
    }

    // Funcion para el modal de exito 
    function mostrarExito(titulo, mensaje) {
        const modal = document.getElementById('successModal');
        if(modal) {
            document.getElementById('modalTitle').innerText = titulo;
            document.getElementById('modalMessage').innerText = mensaje;
            modal.style.display = 'block';
            
            // Se cierra solo tras 3 segundos
            setTimeout(() => { modal.style.display = 'none'; }, 3000);
        } else {
            alert(mensaje); 
        }
    }
});