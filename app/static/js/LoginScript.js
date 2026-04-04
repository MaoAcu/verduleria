 // Script para mostrar y ocultar contrasena
        const togglePassword = document.querySelector('#togglePassword');
        const passwordInput = document.querySelector('#password');

        togglePassword.addEventListener('click', function() {
            // Cambiar el tipo de input
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Cambiar el icono
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
            
            // Animacion sutil al hacer click
            this.style.transform = "scale(1.2)";
            setTimeout(() => {
                this.style.transform = "scale(1)";
            }, 200);
        });

        // Efecto visual simple al enviar 
        const loginBtn = document.querySelector('.login-btn');
        loginBtn.addEventListener('click', function() {
            if(passwordInput.value !== "" && document.querySelector('#usuario').value !== "") {
                this.innerHTML = '<span>Cargando...</span> <i class="fa-solid fa-circle-notch fa-spin"></i>';
            }
        });