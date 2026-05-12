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
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function () {
            validatePassword(this.value);
            updatePasswordStrength(this.value);
            checkFormValidity();
        });
    }

    // Validación de confirmación de contraseña
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function () {
            validateConfirmPassword(this.value);
            checkFormValidity();
        });
    }
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
        if (element) {
            const icon = element.querySelector('.requirement-icon');
            if (icon) {
                if (requirements[req]) {
                    icon.classList.remove('requirement-pending');
                    icon.classList.add('requirement-met');
                    icon.textContent = '✓';
                } else {
                    icon.classList.remove('requirement-met');
                    icon.classList.add('requirement-pending');
                    icon.textContent = '✗';
                }
            }
        }
    });

    const allMet = Object.values(requirements).every(req => req);
    const passwordInput = document.getElementById('newPassword');
    const errorMessage = document.getElementById('passwordError');
    const successMessage = document.getElementById('passwordSuccess');

    if (!passwordInput) return allMet;

    if (password.length === 0) {
        passwordInput.classList.remove('error', 'success');
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
    } else if (allMet) {
        passwordInput.classList.add('success');
        passwordInput.classList.remove('error');
        if (successMessage) {
            successMessage.textContent = '✓ Contraseña segura';
            successMessage.style.display = 'block';
        }
        if (errorMessage) errorMessage.style.display = 'none';
    } else {
        passwordInput.classList.add('error');
        passwordInput.classList.remove('success');
        if (errorMessage) {
            errorMessage.textContent = '❌ La contraseña no cumple todos los requisitos';
            errorMessage.style.display = 'block';
        }
        if (successMessage) successMessage.style.display = 'none';
    }

    return allMet;
}

// Actualizar indicador de fortaleza
function updatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('strengthText');

    if (!strengthIndicator || !strengthBar) return;

    if (!password) {
        strengthIndicator.style.display = 'none';
        if (strengthText) strengthText.textContent = '';
        return;
    }

    strengthIndicator.style.display = 'block';

    const metRequirements = Object.values(passwordRequirements).filter(req => req).length;
    const percentage = (metRequirements / 5) * 100;

    strengthBar.style.width = percentage + '%';
    strengthBar.className = 'password-strength-bar';

    if (strengthText) {
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
}

// Validar confirmación de contraseña
function validateConfirmPassword(confirmPassword) {
    const newPassword = document.getElementById('newPassword');
    const confirmInput = document.getElementById('confirmPassword');
    const errorMessage = document.getElementById('confirmError');
    const successMessage = document.getElementById('confirmSuccess');

    if (!newPassword || !confirmInput) return false;

    if (!confirmPassword) {
        confirmInput.classList.remove('error', 'success');
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
        return false;
    }

    if (confirmPassword !== newPassword.value) {
        confirmInput.classList.add('error');
        confirmInput.classList.remove('success');
        if (errorMessage) {
            errorMessage.textContent = '❌ Las contraseñas no coinciden';
            errorMessage.style.display = 'block';
        }
        if (successMessage) successMessage.style.display = 'none';
        return false;
    }

    confirmInput.classList.add('success');
    confirmInput.classList.remove('error');
    if (successMessage) {
        successMessage.textContent = '✓ Las contraseñas coinciden';
        successMessage.style.display = 'block';
    }
    if (errorMessage) errorMessage.style.display = 'none';
    return true;
}

// Verificar validez del formulario
function checkFormValidity() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const resetBtn = document.getElementById('resetBtn');

    if (!newPassword || !confirmPassword || !resetBtn) return;

    const passwordValid = Object.values(passwordRequirements).every(req => req);
    const confirmValid = newPassword.value === confirmPassword.value && confirmPassword.value.length > 0;

    resetBtn.disabled = !(passwordValid && confirmValid);
}

// --- ENVÍO DEL FORMULARIO (CORREGIDO) ---
const resetForm = document.getElementById('resetForm');
if (resetForm) {
    resetForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword');
        const resetBtn = document.getElementById('resetBtn');
        
        if (!newPassword) return;
        
        // Deshabilitar botón mientras se procesa
        resetBtn.disabled = true;
        resetBtn.textContent = 'ACTUALIZANDO...';

        // ✅ CORREGIDO: Agregado prefijo /verdureria y credentials
        fetch('/verdureria/crede/update_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',  // ← Importante para la sesión
            body: JSON.stringify({ new_password: newPassword.value })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // ✅ CORREGIDO: Usar la URL con prefijo
                showModal('¡Contraseña actualizada!', 'Tu contraseña se cambió correctamente. Serás redirigido al login.', 'success', '/verdureria/login');
                
                setTimeout(() => {
                    window.location.href = '/verdureria/login';  // ← CORREGIDO
                }, 3000);
            } else {
                showModal('¡Algo salió mal!', data.message, 'error');
                resetBtn.disabled = false;
                resetBtn.textContent = 'Restablecer Contraseña';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al comunicar con el servidor. Intenta nuevamente.');
            resetBtn.disabled = false;
            resetBtn.textContent = 'Restablecer Contraseña';
        });
    });
}

// Toggle password visibility
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input && icon) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }
}

const toggleNew = document.getElementById('toggleNewPassword');
const toggleConfirm = document.getElementById('toggleConfirmPassword');

if (toggleNew) {
    toggleNew.addEventListener('click', function() {
        togglePasswordVisibility('newPassword', 'toggleNewPassword');
    });
}

if (toggleConfirm) {
    toggleConfirm.addEventListener('click', function() {
        togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword');
    });
}