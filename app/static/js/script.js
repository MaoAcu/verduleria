 
let products = [];
let complements = [];
let cart = [];
let currentProduct = null;
let detailQty = 1;
let currentCategory = 'all';
let selectedService = 'Envio';
let isLoading = false;
// Variables para el carrusel móvil
let mobileCurrentPage = 0;
let mobileGroups = [];
const ITEMS_PER_PAGE = 8;
 
// Variable para controlar si el menú está abierto
let isMenuOpen = false;
 
// Año automático
document.getElementById('currentYear').textContent = new Date().getFullYear();

function showGlobalLoader(show) {
    let loader = document.getElementById('globalLoader');
    
    if (!loader && show) {
        // Crear loader si no existe
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="spinner"></div>
                <p>Procesando pedido...</p>
            </div>
        `;
        document.body.appendChild(loader);
        loader = document.getElementById('globalLoader');
    }
    
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

 
// Cargar productos desde el backend
async function loadProducts() {
    try {
        showLoading();
        
        const response = await fetch('/producto/getproducto');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Productos cargados:', data);
        
        // Transformar los datos del backend al formato esperado
        products = data
            .filter(item => item.stock > 0)   
            .map(item => ({
                id: item.id,
                name: item.nombre,
                description: item.descripcion,
                category: item.categoria,
                weight: item.peso || '1 unidad',
                price: item.precio,
                stock: item.stock,
                featured: item.destacado || false,
                estado: item.estado === 1 ? 'active' : 'inactive',
                img: item.imagen ? `${URL_IMG_BASE}${item.imagen}` : URL_IMG_DEFAULT
        }));
     
        // Renderizar después de cargar los datos
        renderProducts();
         
        updateCartCount();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showErrorMessage('No se pudieron cargar los productos. Por favor, intenta de nuevo más tarde.');
    }
}

// Cargar complementos desde el backend
async function loadComplements() {
    try {
        const response = await fetch('/producto/getComplements');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Complementos cargados:', data);
        
        // Si hay datos del backend, úsalos; si no, usa los de respaldo
        if (data && data.length > 0) {
            complements = data.map(item => ({
                id: item.id,
                name: item.nombre,
                price: item.precio,
                img: item.imagen_url || URL_IMG_BASE  
            }));
        } else {
            // Datos de respaldo en caso de que no haya complementos en la BD
            complements = [
                { name: 'Achiote', price: 225, img: 'https://comedera.com/wp-content/uploads/sites/9/2021/03/shutterstock_375764773-achiote.jpg' },
                { name: 'Limón', price: 150, img: 'https://walmartcr.vtexassets.com/arquivos/ids/880950/20161_01.jpg?v=638762858471870000' },
                { name: 'Granadilla', price: 200, img: 'https://i.redd.it/xrrdynxghpv81.jpg' },
                { name: 'Apio', price: 200, img: 'https://agrosemval.com/wp-content/uploads/2020/05/apio-ventura-ipc-01.jpg' },
                { name: 'Banano', price: 75, img: 'https://agrotendencia.tv/wp-content/uploads/2018/12/AgenciaUN_0909_1_40-1080x675.jpg' }
            ];
        }
        
        // Si el carrito modal está abierto, actualizar la vista
        if (document.getElementById('cartModal').classList.contains('active')) {
            renderCart();
        }
        
    } catch (error) {
        console.error('Error loading complements:', error);
        // Usar datos de respaldo en caso de error
        complements = [
            { name: 'Achiote', price: 225, img: 'https://comedera.com/wp-content/uploads/sites/9/2021/03/shutterstock_375764773-achiote.jpg' },
            { name: 'Limón', price: 150, img: 'https://walmartcr.vtexassets.com/arquivos/ids/880950/20161_01.jpg?v=638762858471870000' },
            { name: 'Granadilla', price: 200, img: 'https://i.redd.it/xrrdynxghpv81.jpg' },
            { name: 'Apio', price: 200, img: 'https://agrosemval.com/wp-content/uploads/2020/05/apio-ventura-ipc-01.jpg' },
            { name: 'Banano', price: 75, img: 'https://agrotendencia.tv/wp-content/uploads/2018/12/AgenciaUN_0909_1_40-1080x675.jpg' }
        ];
    }
}

// Función para mostrar loading
function showLoading() {
    const grid = document.getElementById('productGrid');
    if (grid && products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #4CAF50;"></i>
                <p style="color: #666; margin-top: 10px;">Cargando productos...</p>
            </div>
        `;
    }
}

// Función para mostrar mensaje de error
function showErrorMessage(message) {
    const grid = document.getElementById('productGrid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 10px;"></i>
                <p style="color: #666;">${message}</p>
                <button onclick="loadProducts()" style="margin-top: 15px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

 

 
// Renderizar productos
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    
    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-box-open" style="font-size: 3rem; color: #ccc;"></i>
                <p style="color: #666; margin-top: 10px;">No hay productos disponibles</p>
            </div>
        `;
        return;
    }
    
    let filtered = products.filter(p => p.estado === 'active');
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    // Búsqueda en tiempo real
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            (p.description && p.description.toLowerCase().includes(searchTerm)) ||
            (p.category && p.category.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc;"></i>
                <p style="color: #666; margin-top: 10px;">No se encontraron productos</p>
            </div>
        `;
        return;
    }
    
    
    grid.innerHTML = filtered.map(p => `
        <div class="product-card" onclick="openProductDetail(${p.id})">
            <div class="product-image-container">
                <img class="product-image" src="${p.img}" alt="${p.name}" loading="lazy" 
                     onerror="this.src='${URL_IMG_DEFAULT}'">
                ${p.featured ? '<span class="product-badge">🌟</span>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${p.name}</div>
                <span class="product-weight">${p.weight}</span>
                <div class="product-footer">
                    <span class="product-price">₡${p.price.toLocaleString()}</span>
                    <button class="add-btn" onclick="event.stopPropagation(); quickAdd(${p.id})">+</button>
                </div>
            </div>
        </div>
    `).join('');
}


// Renderizar carrito
function renderCart() {
    const list = document.getElementById('cartItemsList');
    let total = 0;
    
    if (!list) return;
    
    list.innerHTML = '';
    
    if (cart.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:2rem;">Carrito vacío</div>';
        document.getElementById('cartTotal').innerText = '₡0';
        return;
    }
    
    cart.forEach((item, index) => {
        total += item.price * (item.qty || 1);
        list.innerHTML += `
            <div class="cart-item">
                <div>
                    <b>${item.qty || 1}x</b> ${item.name}
                    ${item.comment ? `<br><small style="color:#666;">"${item.comment}"</small>` : ''}
                </div>
                <div>
                    <span class="cart-item-price">₡${((item.price * (item.qty || 1))).toLocaleString()}</span>
                    <span class="remove-item" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></span>
                </div>
            </div>
        `;
    });
    
    document.getElementById('cartTotal').innerText = '₡' + total.toLocaleString();
    
    // Renderizar complementos en el carrito
    renderComplementsInCart();
}

// Renderizar complementos dentro del carrito
function renderComplementsInCart() {
    const carousel = document.getElementById('complementCarousel');
    if (!carousel) return;
    
    carousel.innerHTML = '';
    
    if (!complements || complements.length === 0) {
        carousel.innerHTML = '<div style="text-align:center; padding:1rem;">No hay complementos disponibles</div>';
        return;
    }
    
    complements.forEach(c => {
        // Escapar comillas simples en el nombre para evitar errores
        const escapedName = c.name.replace(/'/g, "\\'");
        
        carousel.innerHTML += `
            <div class="complement-card">
                <img src="${c.img}" onerror="this.src='${URL_IMG_DEFAULT}'" alt="${c.name}">
                <p>${c.name}</p>
                <span style="font-size:0.7rem;">₡${c.price}</span>
                <button class="add-complement" onclick="addComplement(${c.id}, '${escapedName}', ${c.price}, '${c.img}')">
                    +
                </button>
            </div>
        `;
    });
}

 

// Añadir producto rápido
window.quickAdd = function(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    
    cart.push({ 
        id: prod.id, 
        name: prod.name, 
        price: prod.price, 
        weight: prod.weight, 
        qty: 1,
        comment: ''
    });
    
    updateCartCount();
    animateCart();
    showNotification(`${prod.name} añadido al carrito`);
};

// Abrir detalle de producto
window.openProductDetail = function(id) {
    currentProduct = products.find(p => p.id === id);
    if (!currentProduct) return;
    
    detailQty = 1;
    
    document.getElementById('detailQty').innerText = detailQty;
    document.getElementById('detailName').innerText = currentProduct.name;
    document.getElementById('detailImg').src = currentProduct.img;
    document.getElementById('detailCategory').innerText = currentProduct.category;
    document.getElementById('detailPrice').innerText = `₡${currentProduct.price.toLocaleString()}`;
    document.getElementById('detailWeight').innerText = currentProduct.weight;
    document.getElementById('detailDesc').innerText = currentProduct.description;
     
    document.getElementById('productDetail').classList.add('active');
};

// Cerrar detalle
window.closeDetail = function() {
    document.getElementById('productDetail').classList.remove('active');
};

// Cambiar cantidad en detalle
window.changeQty = function(delta) {
    detailQty = Math.max(1, detailQty + delta);
    document.getElementById('detailQty').innerText = detailQty;
};

// Añadir al carrito desde detalle
window.addToCartFromDetail = function() {
    if (!currentProduct) return;
    
    cart.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        weight: currentProduct.weight,
        qty: detailQty, 
    });
    
    updateCartCount();
    animateCart();
    closeDetail();
    showNotification(`${currentProduct.name} añadido al carrito`);
};

 

// Actualizar contador del carrito
function updateCartCount() {
    const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
    
    const cartCountElement = document.getElementById('cartCount');
    const cartCountMobileElement = document.getElementById('cartCountMobile');
    
    if (cartCountElement) cartCountElement.innerText = count;
    if (cartCountMobileElement) cartCountMobileElement.innerText = count;
}

// Animar carrito
function animateCart() {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
    }
}

// Mostrar notificación
function showNotification(message) {
    // Crear elemento de notificación si no existe
    let notification = document.querySelector('.notification-toast');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification-toast';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Abrir modal del carrito
window.openCartModal = function() {
    renderCart();
    document.getElementById('cartModal').classList.add('active');
};

// Cerrar modal del carrito
window.closeCartModal = function() {
    document.getElementById('cartModal').classList.remove('active');
};

// Añadir complemento
window.addComplement = function(id,name, price, img) {
    cart.push({ 
        id: id, 
        name: name, 
        price: price, 
        qty: 1,
        comment: '',
        isComplement: true
    });
    
    updateCartCount();
    renderCart();
    animateCart();
    showNotification(`${name} añadido al carrito`);
};

// Eliminar del carrito
window.removeFromCart = function(index) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    updateCartCount();
    renderCart();
    showNotification(`${itemName} eliminado del carrito`);
};

// Vaciar carrito
window.clearCart = function() {
    if (cart.length === 0) return;
    
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
        cart = [];
        updateCartCount();
        renderCart();
        showNotification('Carrito vaciado');
    }
};

 

// Filtrar por categoría
window.filterByCategory = function(category, element) {
    currentCategory = category;
    
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    
    mobileCurrentPage = 0;
    renderProducts();
    renderMobileCarousel();
};

// Filtrar productos por búsqueda
window.filterProducts = function() {
    mobileCurrentPage = 0;
    renderProducts();
    renderMobileCarousel();
};

 

// Agrupar productos para móvil
function groupProductsForMobile(productsList) {
    const groups = [];
    const totalGroups = Math.ceil(productsList.length / ITEMS_PER_PAGE);
    
    for (let i = 0; i < totalGroups; i++) {
        const start = i * ITEMS_PER_PAGE;
        const end = Math.min(start + ITEMS_PER_PAGE, productsList.length);
        groups.push(productsList.slice(start, end));
    }
    return groups;
}

// Actualizar controles del carrusel móvil
function updateMobileControls() {
    const prevBtn = document.getElementById('prevMobileBtn');
    const nextBtn = document.getElementById('nextMobileBtn');
    const indicators = document.getElementById('mobileCarouselIndicators');
    const pageInfo = document.getElementById('mobilePageInfo');
    const track = document.getElementById('mobileCarouselTrack');
    
    if (prevBtn) prevBtn.disabled = mobileCurrentPage === 0;
    if (nextBtn) nextBtn.disabled = mobileCurrentPage === mobileGroups.length - 1;
    
    // Actualizar posición del carrusel
    if (track) {
        track.style.transform = `translateX(-${mobileCurrentPage * 100}%)`;
    }
    
    // Actualizar indicadores
    if (indicators && mobileGroups.length > 0) {
        indicators.innerHTML = mobileGroups.map((_, index) => `
            <span class="carousel-dot ${index === mobileCurrentPage ? 'active' : ''}" 
                  onclick="goToMobilePage(${index})"></span>
        `).join('');
    }
    
    // Actualizar información de página
    if (pageInfo && mobileGroups.length > 0) {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        
        let filtered = products;
        if (currentCategory !== 'all') {
            filtered = filtered.filter(p => p.category === currentCategory);
        }
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
        }
        
        const startItem = mobileCurrentPage * ITEMS_PER_PAGE + 1;
        const endItem = Math.min((mobileCurrentPage + 1) * ITEMS_PER_PAGE, filtered.length);
        pageInfo.innerHTML = `${startItem}-${endItem} de ${filtered.length}`;
    }
}

// Mover carrusel móvil
window.moveMobileCarousel = function(direction) {
    const newPage = mobileCurrentPage + direction;
    if (newPage >= 0 && newPage < mobileGroups.length) {
        mobileCurrentPage = newPage;
        updateMobileControls();
    }
};

// Ir a página específica del carrusel móvil
window.goToMobilePage = function(page) {
    if (page >= 0 && page < mobileGroups.length) {
        mobileCurrentPage = page;
        updateMobileControls();
    }
};

// Inicializar swipe táctil
function initMobileSwipe() {
    const track = document.getElementById('mobileCarouselTrack');
    if (!track) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                moveMobileCarousel(1);
            } else {
                moveMobileCarousel(-1);
            }
        }
    }, { passive: true });
}
 
function clearCartAfterOrder() {
    // Vaciar el array del carrito
    cart = [];
    
    // Actualizar el contador del carrito en la UI
    updateCartCount();
    
    // Actualizar la vista del carrito si está abierta
    renderCart();
    
    // Cerrar el modal del carrito si está abierto
    const cartModal = document.getElementById('cartModal');
    if (cartModal && cartModal.classList.contains('active')) {
        cartModal.classList.remove('active');
    }
    
    // Limpiar localStorage si lo usas
    localStorage.removeItem('shoppingCart');
    
    // Nota: No mostrar notificación aquí porque ya se muestra en sendOrder
}
// Seleccionar tipo de servicio
window.setService = function(type, btn) {
    selectedService = type;
    
    document.querySelectorAll('.service-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
};
function agregarComplementoAlCarrito(complemento) {
    cart.push({
        id: complemento.id,
        name: complemento.nombre,
        price: complemento.precio,
        qty: 1,
        type: 'complemento',   
        isComplement: true, 
        comment: null
    });
}

async function verificarStockDisponible(allItems) {
    console.log('=== VERIFICANDO STOCK ===');
    console.log('Items a verificar:', allItems);
    
    // Agrupar items por tipo
    const productosIds = [];
    const complementosIds = [];
    
    for (const item of allItems) {
        const tipo = item.type || (item.isComplement ? 'complemento' : 'producto');
        console.log(`Item: ${item.name}, Tipo: ${tipo}, Cantidad: ${item.qty || 1}, ID: ${item.id}`);
        
        if (tipo === 'producto') {
            productosIds.push({ id: item.id, cantidad: item.qty || 1, nombre: item.name });
        } else {
            complementosIds.push({ id: item.id, cantidad: item.qty || 1, nombre: item.name });
        }
    }
    
    // Verificar stock de productos
    if (productosIds.length > 0) {
        console.log('Verificando productos:', productosIds);
        
        const response = await fetch('/pedidos/verificar-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: productosIds, tipo: 'producto' })
        });
        
        const result = await response.json();
        console.log('Respuesta verificación productos:', result);
        
        if (!result.success) {
            console.log('  Error en productos:', result.error);
            return { success: false, error: result.error };
        }
    }
    
    // Verificar stock de complementos
    if (complementosIds.length > 0) {
        console.log('Verificando complementos:', complementosIds);
        
        const response = await fetch('/pedidos/verificar-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: complementosIds, tipo: 'complemento' })
        });
        
        const result = await response.json();
        console.log('Respuesta verificación complementos:', result);
        
        if (!result.success) {
            console.log('  Error en complementos:', result.error);
            return { success: false, error: result.error };
        }
    }
    
    console.log('✅ Stock verificado correctamente');
    return { success: true };
}

window.sendOrder = async function() {
    // Combinar productos y complementos del carrito
    const allItems = [...cart];
    if (typeof complementsCart !== 'undefined' && complementsCart.length > 0) {
        allItems.push(...complementsCart);
    }
    
    if (allItems.length === 0) {
        showNotification('🛒 Carrito vacío');
        return;
    }
    
    // Mostrar loader global
    showGlobalLoader(true);
    
    try {
        // ✅ PASO 1: Verificar stock disponible ANTES de enviar
        const stockCheck = await verificarStockDisponible(allItems);
        
        if (!stockCheck.success) {
            showNotification(`❌ ${stockCheck.error}`, 'error');
            showGlobalLoader(false);
            return;
        }
        
        // Calcular total
        let total = 0;
        allItems.forEach(item => {
            total += item.price * (item.qty || 1);
        });
        
        // Preparar datos para el backend
        const pedidoData = {
            productos: allItems.map(item => ({
                id: item.id,
                nombre: item.name,
                cantidad: item.qty || 1,
                precio: item.price,
                tipo: item.type || (item.isComplement ? 'complemento' : 'producto'),
                comentario: item.comment || null
            })),
            servicio: selectedService,
            total: total
        };
        
        // Enviar al backend
        const response = await fetch('/pedidos/HacerPedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedidoData)
        });
        
        const result = await response.json();
        
        // Preparar mensaje de WhatsApp
        let message = "🍃 *Frutas de Altura* 🍃\n\n";
        
        const productos = allItems.filter(item => (item.type === 'producto' || (!item.type && !item.isComplement)));
        const complementos = allItems.filter(item => (item.type === 'complemento' || item.isComplement === true));
        
        if (productos.length > 0) {
            message += "📦 *PRODUCTOS:*\n";
            productos.forEach(item => {
                const itemTotal = item.price * (item.qty || 1);
                message += `• ${item.name} x${item.qty || 1} - ₡${itemTotal.toLocaleString()}\n`;
                if (item.comment) {
                    message += `  _Nota: ${item.comment}_\n`;
                }
            });
            message += "\n";
        }
        
        if (complementos.length > 0) {
            message += "➕ *COMPLEMENTOS:*\n";
            complementos.forEach(item => {
                const itemTotal = item.price * (item.qty || 1);
                message += `• ${item.name} x${item.qty || 1} - ₡${itemTotal.toLocaleString()}\n`;
                if (item.comment) {
                    message += `  _Nota: ${item.comment}_\n`;
                }
            });
            message += "\n";
        }
        
        message += `📦 *Servicio:* ${selectedService}\n`;
        message += `💰 *Total:* ₡${total.toLocaleString()}`;
        
        // Abrir WhatsApp
        const whatsappNumber = '50687922758';
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        // Limpiar carrito
        clearCartAfterOrder();
        if (typeof clearComplementsCart === 'function') {
            clearComplementsCart();
        }
        
        // Recargar productos para actualizar stock
        await loadProducts();
        if (typeof loadComplements === 'function') {
            await loadComplements();
        }
        
        if (result.success) {
            showNotification('✅ Pedido enviado correctamente');
        } else {
            showNotification('⚠️ Pedido enviado, pero hubo un error en el registro');
        }
        
    } catch (error) {
        console.error('Error:', error);
        
        // Fallback: enviar solo WhatsApp
        let message = "🍃 *Del Campo a su Casa* 🍃\n\n";
        let total = 0;
        
        const productos = allItems.filter(item => (item.type === 'producto' || (!item.type && !item.isComplement)));
        const complementos = allItems.filter(item => (item.type === 'complemento' || item.isComplement === true));
        
        if (productos.length > 0) {
            message += "📦 *PRODUCTOS:*\n";
            productos.forEach(item => {
                const itemTotal = item.price * (item.qty || 1);
                total += itemTotal;
                message += `• ${item.name} x${item.qty || 1} - ₡${itemTotal.toLocaleString()}\n`;
                if (item.comment) {
                    message += `  _Nota: ${item.comment}_\n`;
                }
            });
            message += "\n";
        }
        
        if (complementos.length > 0) {
            message += "➕ *COMPLEMENTOS:*\n";
            complementos.forEach(item => {
                const itemTotal = item.price * (item.qty || 1);
                total += itemTotal;
                message += `• ${item.name} x${item.qty || 1} - ₡${itemTotal.toLocaleString()}\n`;
                if (item.comment) {
                    message += `  _Nota: ${item.comment}_\n`;
                }
            });
            message += "\n";
        }
        
        message += `📦 *Servicio:* ${selectedService}\n`;
        message += `💰 *Total:* ₡${total.toLocaleString()}`;
        
        const whatsappNumber = '50687922758';
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        clearCartAfterOrder();
        if (typeof clearComplementsCart === 'function') {
            clearComplementsCart();
        }
        
        await loadProducts();
        if (typeof loadComplements === 'function') {
            await loadComplements();
        }
        
        showNotification('Pedido enviado por WhatsApp');
        
    } finally {
        showGlobalLoader(false);
    }
};

function actualizarStockMultiple(items) {
    fetch('/producto/updateStock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: items })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Stock actualizado:', data);
    })
    .catch(error => {
        console.error('Error actualizando stock:', error);
    });
}
function clearCartArterOrder() {
    // Vacia el carrito
    cart.length = 0; 
    
    
    
    // Actualiza el contador del carrito  
    updateCartCount();
    
    // Actualiza la vista del carrito 
    renderCart();
    
    
}
// Navegar a sección
window.navigateTo = function(section) {
    if (['frutas', 'verduras', 'lacteos'].includes(section)) {
        const filterChip = document.querySelector(`.filter-chip[onclick*="${section}"]`);
        if (filterChip) {
            filterByCategory(section, filterChip);
            document.querySelector('.filters-section').scrollIntoView({ behavior: 'smooth' });
        }
    } else if (section === 'inicio' || section === 'tienda') {
        currentCategory = 'all';
        
        // Desactivar todos los chips de filtro
        document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
        
        // Activar el chip "Todos"
        const allChip = document.querySelector(`.filter-chip[onclick*="all"]`);
        if (allChip) allChip.classList.add('active');
        
        renderProducts();
        renderMobileCarousel();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    closeMobileMenu();
};

// Mostrar vista de cliente
window.showClientView = function() {
    navigateTo('inicio');
};

// Alternar menú móvil
window.toggleMobileMenu = function(event) {
    if (event) event.stopPropagation();
    
    const nav = document.getElementById('navContainer');
    const hamburger = document.getElementById('hamburgerBtn');
    
    nav.classList.toggle('active');
    hamburger.classList.toggle('active');
};

// Cerrar menu movil
window.closeMobileMenu = function() {
    const nav = document.getElementById('navContainer');
    const hamburger = document.getElementById('hamburgerBtn');
    
    nav.classList.remove('active');
    hamburger.classList.remove('active');
};

 

// Iniciar auto-scroll de complementos
function startAutoScroll() {
    setInterval(() => {
        const track = document.getElementById('complementCarousel');
        const modal = document.getElementById('cartModal');
        
        if (track && modal && modal.classList.contains('active')) {
            track.scrollBy({ left: 120, behavior: 'smooth' });
            
            if (track.scrollLeft + track.clientWidth >= track.scrollWidth) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }
    }, 3000);
}

// Scroll manual de complementos
window.scrollCarousel = function(direction) {
    const track = document.getElementById('complementCarousel');
    if (track) {
        track.scrollBy({ left: direction * 150, behavior: 'smooth' });
    }
};



// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(event) {
    const nav = document.getElementById('navContainer');
    const hamburger = document.getElementById('hamburgerBtn');
    
    if (!nav || !hamburger) return;
    if (!nav.classList.contains('active')) return;
    
    const isClickInsideNav = nav.contains(event.target);
    const isClickOnHamburger = hamburger.contains(event.target);
    
    if (!isClickInsideNav && !isClickOnHamburger) {
        closeMobileMenu();
    }
});
// Configurar búsqueda en tiempo real
function setupRealTimeSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                mobileCurrentPage = 0;
                renderProducts();
                renderMobileCarousel();
            }, 300);
        });
    }
}
// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando aplicación...');
    
    // Mostrar loading
    showLoading();
    
    // Cargar datos
    loadProducts();
    loadComplements();
    
    // Inicializar otras funciones
    updateCartCount();
    startAutoScroll();
    initMobileSwipe();
    setupRealTimeSearch();
    
    // Manejar responsive
    const mobileOnly = document.querySelector('.mobile-only');
    const desktopOnly = document.querySelector('.desktop-only');
    
    if (window.innerWidth <= 768) {
        if (mobileOnly) mobileOnly.style.display = 'flex';
        if (desktopOnly) desktopOnly.style.display = 'none';
    } else {
        if (mobileOnly) mobileOnly.style.display = 'none';
        if (desktopOnly) desktopOnly.style.display = 'flex';
    }
    
    // Event listener para resize
    window.addEventListener('resize', function() {
        const mobileOnly = document.querySelector('.mobile-only');
        const desktopOnly = document.querySelector('.desktop-only');
        
        if (window.innerWidth <= 768) {
            if (mobileOnly) mobileOnly.style.display = 'flex';
            if (desktopOnly) desktopOnly.style.display = 'none';
        } else {
            if (mobileOnly) mobileOnly.style.display = 'none';
            if (desktopOnly) desktopOnly.style.display = 'flex';
        }
    });
});

// Función para recargar productos
window.reloadProducts = function() {
    showLoading();
    loadProducts();
};

// Función para recargar complementos
window.reloadComplements = function() {
    loadComplements();
};