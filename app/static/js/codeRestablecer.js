document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const otpForm = document.getElementById('otp-form');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const inputs = document.querySelectorAll('.otp-input');
    const fullCodeInput = document.querySelector('#codigo');
    const resendLink = document.querySelector('.resend-link');
    
    // Funcion para actualizar el codigo completo
    function updateFullCode() {
        let code = "";
        inputs.forEach(input => code += input.value);
        fullCodeInput.value = code;
    }
    
    // Funcion para mostrar error
    function showError(msg) {
        let errorDiv = document.querySelector('.code-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'code-error';
            errorDiv.style.cssText = 'color: #d32f2f; text-align: center; margin-top: 15px; padding: 10px; background: #ffebee; border-radius: 8px; font-size: 14px;';
            otpForm.appendChild(errorDiv);
        }
        errorDiv.innerHTML = `❌ ${msg}`;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 3000);
    }
    
    // Funcion para resetear boton
    function resetButton() {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
        btnText.textContent = "VERIFICAR CÓDIGO";
        loader.style.display = "none";
    }
    
    // --- LOGICA DE INPUTS OTP ---
    inputs.forEach((input, index) => {
        // Pegar codigo
        input.addEventListener('paste', (e) => {
            const data = e.clipboardData.getData('text').slice(0, 6);
            if (!/^\d+$/.test(data)) return;  
            const digits = data.split('');
            digits.forEach((digit, i) => {
                if (inputs[i]) inputs[i].value = digit;
            });
            inputs[Math.min(digits.length, inputs.length - 1)].focus();
            updateFullCode();
        });

        // Escribir
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 1) e.target.value = e.target.value.slice(0, 1);
            if (e.target.value !== "" && index < inputs.length - 1) inputs[index + 1].focus();
            updateFullCode();
        });

        // Backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && e.target.value === "" && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        // Solo numeros
        input.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key)) e.preventDefault();
        });
    });
    
    // --- ENVIO DEL FORMULARIO ---
    otpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const codigo = fullCodeInput.value;
        
        if (codigo.length !== 6) {
            showError("El código debe tener 6 dígitos.");
            return;
        }
        
        // Activar loader
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";
        submitBtn.style.cursor = "not-allowed";
        btnText.textContent = "VERIFICANDO...";
        loader.style.display = "inline-block";
        
        // Enviar al backend
        fetch('/verdureria/crede/validate_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ codigo: codigo })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url || "/nueva-contrasena";
            } else {
                showError(data.message || "Código incorrecto. Intente de nuevo.");
                resetButton();
                // Limpiar inputs
                inputs.forEach(input => input.value = '');
                fullCodeInput.value = '';
                inputs[0].focus();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError("Error de conexión con el servidor.");
            resetButton();
        });
    });
    
    // --- REENVIAR CODIGO ---
    if (resendLink) {
        resendLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const originalText = resendLink.innerHTML;
            resendLink.innerHTML = "Enviando...";
            resendLink.style.pointerEvents = "none";
            
            fetch('/api/resend-recovery-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showError("✓ Nuevo código enviado a tu correo");
                } else {
                    showError(data.message || "No se pudo reenviar el código");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError("Error al reenviar el código");
            })
            .finally(() => {
                resendLink.innerHTML = originalText;
                resendLink.style.pointerEvents = "auto";
            });
        });
    }
});