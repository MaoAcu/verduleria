const inputs = document.querySelectorAll('.otp-input');
        const fullCodeInput = document.querySelector('#codigo');

        inputs.forEach((input, index) => {
            
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

            input.addEventListener('input', (e) => {
                if (e.target.value.length > 1) e.target.value = e.target.value.slice(0, 1);
                if (e.target.value !== "" && index < inputs.length - 1) inputs[index + 1].focus();
                updateFullCode();
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === "Backspace" && e.target.value === "" && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        function updateFullCode() {
            let code = "";
            inputs.forEach(input => code += input.value);
            fullCodeInput.value = code;
        }

        // Permitir solo números
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (!/[0-9]/.test(e.key)) e.preventDefault();
            });
        });
document.addEventListener('DOMContentLoaded', () => {
    const otpForm = document.getElementById('otp-form');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');

    otpForm.addEventListener('submit', function() {
        // 1. Desactivar el botón para evitar que el usuario haga doble clic
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";
        submitBtn.style.cursor = "not-allowed";

        // 2. Cambiar el texto y mostrar el loader (el emoji o el icono)
        btnText.textContent = "VERIFICANDO...";
        loader.style.display = "inline-block";

        
    });
});