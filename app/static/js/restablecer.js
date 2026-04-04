// Variables globales
let passwordRequirements = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
};

// Inicializar cuando la página cargue
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Validación en tiempo real de la nueva contraseña
    newPasswordInput.addEventListener('input', function () {
        validatePassword(this.value);
        updatePasswordStrength(this.value);
        checkFormValidity();
    });

    // Validación de confirmación de contraseña
    confirmPasswordInput.addEventListener('input', function () {
        validateConfirmPassword(this.value);
        checkFormValidity();
    });
}

// Validar contraseña
function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    passwordRequirements = requirements;

    // Actualizar indicadores visuales
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        const icon = element.querySelector('.requirement-icon');

        if (requirements[req]) {
            icon.classList.remove('requirement-pending');
            icon.classList.add('requirement-met');
            icon.textContent = '✓';
        } else {
            icon.classList.remove('requirement-met');
            icon.classList.add('requirement-pending');
            icon.textContent = '✗';
        }
    });

    const allMet = Object.values(requirements).every(req => req);
    const passwordInput = document.getElementById('newPassword');
    const errorMessage = document.getElementById('passwordError');
    const successMessage = document.getElementById('passwordSuccess');

    if (password.length === 0) {
        passwordInput.classList.remove('error', 'success');
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    } else if (allMet) {
        passwordInput.classList.add('success');
        passwordInput.classList.remove('error');
        successMessage.textContent = 'Contraseña segura';
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    } else {
        passwordInput.classList.add('error');
        passwordInput.classList.remove('success');
        errorMessage.textContent = 'La contraseña no cumple todos los requisitos';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    return allMet;
}

// Actualizar indicador de fortaleza
function updatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('strengthText');

    if (!password) {
        strengthIndicator.style.display = 'none';
        strengthText.textContent = '';
        return;
    }

    strengthIndicator.style.display = 'block';

    const metRequirements = Object.values(passwordRequirements).filter(req => req).length;
    const percentage = (metRequirements / 5) * 100;

    strengthBar.style.width = percentage + '%';
    strengthBar.className = 'password-strength-bar';

    if (metRequirements <= 2) {
        strengthBar.classList.add('strength-weak');
        strengthText.textContent = 'Débil';
        strengthText.style.color = '#E74C3C';
    } else if (metRequirements <= 3) {
        strengthBar.classList.add('strength-medium');
        strengthText.textContent = 'Media';
        strengthText.style.color = '#F39C12';
    } else {
        strengthBar.classList.add('strength-strong');
        strengthText.textContent = 'Fuerte';
        strengthText.style.color = '#7ED321';
    }
}

// Validar confirmación de contraseña
function validateConfirmPassword(confirmPassword) {
    const newPassword = document.getElementById('newPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    const errorMessage = document.getElementById('confirmError');
    const successMessage = document.getElementById('confirmSuccess');

    if (!confirmPassword) {
        confirmInput.classList.remove('error', 'success');
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        return false;
    }

    if (confirmPassword !== newPassword) {
        confirmInput.classList.add('error');
        confirmInput.classList.remove('success');
        errorMessage.textContent = 'Las contraseñas no coinciden';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        return false;
    }

    confirmInput.classList.add('success');
    confirmInput.classList.remove('error');
    successMessage.textContent = 'Las contraseñas coinciden';
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    return true;
}

// Verificar validez del formulario
function checkFormValidity() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const resetBtn = document.getElementById('resetBtn');

    const passwordValid = Object.values(passwordRequirements).every(req => req);
    const confirmValid = newPassword === confirmPassword && confirmPassword.length > 0;

    resetBtn.disabled = !(passwordValid && confirmValid);
}
document.getElementById('resetForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    


    fetch('/crede/update_password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_password: newPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
             
            showModal('¡Contraseña actualizada!', 'Tu contraseña se cambió correctamente. Serás redirigido al login.', 'success', '/login');

           
            
            setTimeout(() => {
                window.location.href = REDIREC_UTL
            }, 3000);
           
        } else {
            showModal('¡Algo salio mal!', data.message,'error');

            
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al comunicar con el servidor. Intenta nuevamente.');
    });
});
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

document.getElementById('toggleNewPassword').addEventListener('click', function() {
    togglePasswordVisibility('newPassword', 'toggleNewPassword');
});

document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
    togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword');
});