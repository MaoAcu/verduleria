let mensajesData = [];
let lastCheckedCount = 0;

 

// Mostrar modal de confirmación
function showConfirmModal(options) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalConfirm');
        const icon = document.getElementById('confirmIcon');
        const title = document.getElementById('confirmTitle');
        const message = document.getElementById('confirmMessage');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const okBtn = document.getElementById('confirmOkBtn');
        
        if (!modal) {
            console.error('Modal de confirmación no encontrado');
            resolve(confirm(options.message || '¿Estás seguro?'));
            return;
        }
        
        // Configurar según opciones
        title.textContent = options.title || 'Confirmar';
        message.textContent = options.message || '¿Estás seguro?';
        
        // Configurar icono y color del botón
        if (options.type === 'danger') {
            icon.className = 'modal-confirm-icon error';
            icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            okBtn.classList.add('danger');
        } else if (options.type === 'warning') {
            icon.className = 'modal-confirm-icon warning';
            icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            okBtn.classList.remove('danger');
        } else {
            icon.className = 'modal-confirm-icon info';
            icon.innerHTML = '<i class="fas fa-question-circle"></i>';
            okBtn.classList.remove('danger');
        }
        
        // Mostrar modal
        modal.classList.add('active');
        
        // Manejar eventos
        const handleConfirm = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            okBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        // Remover eventos anteriores para evitar duplicados
        okBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        
        okBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        
        // Cerrar al hacer clic fuera
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                handleCancel();
                modal.removeEventListener('click', handleOutsideClick);
            }
        };
        modal.addEventListener('click', handleOutsideClick);
    });
}

// Mostrar modal de alerta
function showAlertModal(options) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalAlert');
        const icon = document.getElementById('alertIcon');
        const title = document.getElementById('alertTitle');
        const message = document.getElementById('alertMessage');
        const okBtn = document.getElementById('alertOkBtn');
        
        if (!modal) {
            console.error('Modal de alerta no encontrado');
            alert(options.message || 'Operación completada');
            resolve(true);
            return;
        }
        
        // Configurar según opciones
        title.textContent = options.title || 'Éxito';
        message.textContent = options.message || 'Operación completada';
        
        // Configurar icono
        if (options.type === 'success') {
            icon.className = 'modal-alert-icon success';
            icon.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else if (options.type === 'error') {
            icon.className = 'modal-alert-icon error';
            icon.innerHTML = '<i class="fas fa-times-circle"></i>';
        } else if (options.type === 'warning') {
            icon.className = 'modal-alert-icon warning';
            icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        } else {
            icon.className = 'modal-alert-icon info';
            icon.innerHTML = '<i class="fas fa-info-circle"></i>';
        }
        
        // Mostrar modal
        modal.classList.add('active');
        
        // Manejar evento
        const handleOk = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(true);
        };
        
        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
        };
        
        okBtn.removeEventListener('click', handleOk);
        okBtn.addEventListener('click', handleOk);
        
        // Cerrar al hacer clic fuera
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                handleOk();
                modal.removeEventListener('click', handleOutsideClick);
            }
        };
        modal.addEventListener('click', handleOutsideClick);
        
        // Auto cerrar después de 2.5 segundos para modales de éxito
        if (options.type === 'success' && options.autoClose !== false) {
            setTimeout(() => {
                if (modal.classList.contains('active')) {
                    handleOk();
                }
            }, 2500);
        }
    });
}

// ==================== FUNCIONES DE MENSAJERÍA ====================

// Cargar solo mensajes pendientes desde el servidor
async function cargarMensajes() {
    try {
        const response = await fetch('/mensajeria/pendientes');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            mensajesData = data.mensajes;
            actualizarBadgePendientes();
            renderizarMensajes();
        }
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        await showAlertModal({
            title: 'Error',
            message: 'No se pudieron cargar los pedidos pendientes',
            type: 'error'
        });
    }
}

// Actualizar badge de pendientes
function actualizarBadgePendientes() {
    const pendientesCount = document.getElementById('pendientesCount');
    const sidebarBadge = document.getElementById('sidebarMensajesBadge');
    
    const count = mensajesData.length;
    
    if (pendientesCount) pendientesCount.textContent = count;
    
    if (sidebarBadge) {
        if (count > 0) {
            sidebarBadge.textContent = count;
            sidebarBadge.style.display = 'inline';
        } else {
            sidebarBadge.style.display = 'none';
        }
    }
}

// Renderiza los mensajes pendientes
function renderizarMensajes() {
    const container = document.getElementById('mensajesGrid');
    if (!container) return;
    
    if (mensajesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>✨ No hay pedidos pendientes</p>
                <small>Todos los pedidos han sido procesados</small>
            </div>
        `;
        return;
    }
    
    const sortedMensajes = [...mensajesData].sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
    );
    
    container.innerHTML = sortedMensajes.map(mensaje => `
        <div class="mensaje-card pendiente">
            <div class="mensaje-header">
                <div class="mensaje-cliente">
                    <i class="fas fa-shopping-cart"></i>
                    <div>
                        <strong>Pedido #${mensaje.id}</strong>
                    </div>
                </div>
                <div class="mensaje-fecha">
                    <i class="far fa-calendar-alt"></i> ${formatearFecha(mensaje.fecha)}
                </div>
            </div>
            
            <div class="mensaje-productos">
                <strong>📦 Productos solicitados:</strong>
                ${mensaje.productos.map(p => `
                    <div class="producto-item">
                        <span>• ${escapeHtml(p.nombre)} x ${p.cantidad}</span>
                        <span>₡${(p.precio * p.cantidad).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="mensaje-total">
                Total: ₡${mensaje.total.toLocaleString()}
            </div>
            
            <div class="mensaje-actions">
                <button class="btn-confirmar" onclick="confirmarPedido(${mensaje.id})">
                    <i class="fas fa-check"></i> Confirmar Pedido
                </button>
                <button class="btn-rechazar" onclick="rechazarPedido(${mensaje.id})">
                    <i class="fas fa-times"></i> Rechazar
                </button>
            </div>
        </div>
    `).join('');
}

// Confirmar el pedido (usando modal personalizado)
async function confirmarPedido(mensajeId) {
    const confirmed = await showConfirmModal({
        title: 'Confirmar Pedido',
        message: '¿Estás seguro de confirmar este pedido? Esto descontará del inventario.',
        type: 'warning'
    });
    
    if (!confirmed) return;
    
    try {
        const response = await fetch('/mensajeria/confirmar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mensajeId: mensajeId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await showAlertModal({
                title: 'Éxito',
                message: 'Pedido confirmado y stock actualizado correctamente',
                type: 'success'
            });
            await cargarMensajes();
            if (typeof cargarProductos === 'function') {
                await cargarProductos();
            }
            if (typeof currentSection !== 'undefined' && currentSection === 'estadisticas') {
                if (typeof cargarEstadisticas === 'function') cargarEstadisticas();
                if (typeof cargarStockTable === 'function') cargarStockTable();
            }
        } else {
            await showAlertModal({
                title: 'Error',
                message: data.error || 'Error al confirmar el pedido',
                type: 'error'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        await showAlertModal({
            title: 'Error',
            message: 'Error al procesar la solicitud',
            type: 'error'
        });
    }
}

// Rechazar el pedido (usando modal personalizado)
async function rechazarPedido(mensajeId) {
    const confirmed = await showConfirmModal({
        title: 'Rechazar Pedido',
        message: '¿Estás seguro de rechazar este pedido? Esta acción no se puede deshacer.',
        type: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
        const response = await fetch('/mensajeria/rechazar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mensajeId: mensajeId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await showAlertModal({
                title: 'Éxito',
                message: 'Pedido rechazado correctamente',
                type: 'success'
            });
            await cargarMensajes();
        } else {
            await showAlertModal({
                title: 'Error',
                message: data.error || 'Error al rechazar el pedido',
                type: 'error'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        await showAlertModal({
            title: 'Error',
            message: 'Error al procesar la solicitud',
            type: 'error'
        });
    }
}

// Verificar nuevos pedidos (polling)
async function checkNewMessages() {
    try {
        const response = await fetch('/mensajeria/pendientes/count');
        
        if (!response.ok) {
            console.error('Error HTTP:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            const currentCount = data.count;
            
            if (currentCount > lastCheckedCount && currentCount > 0) {
                const newCount = currentCount - lastCheckedCount;
                
                // Mostrar notificación solo si hay nuevos pedidos
                if (newCount > 0) {
                    await showAlertModal({
                        title: '📦 Nuevos Pedidos',
                        message: `Tienes ${newCount} ${newCount === 1 ? 'nuevo pedido pendiente' : 'nuevos pedidos pendientes'}`,
                        type: 'warning',
                        autoClose: true
                    });
                }
                await cargarMensajes();
            }
            
            lastCheckedCount = currentCount;
        }
    } catch (error) {
        console.error('Error verificando mensajes:', error);
    }
}

// Formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    try {
        const date = new Date(fecha);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return fecha;
    }
}

// Escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

 
setInterval(checkNewMessages, 10000);

// Cargar mensajes al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarMensajes();
});