// Datos compartidos (desde localStorage)
let products = JSON.parse(localStorage.getItem('mercadoFrescoProducts')) || [];

// Carrito de compras
let cart = JSON.parse(localStorage.getItem('mercadoFrescoCart')) || [];

let currentView = 'inicio';

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (products.length === 0) {
        // Si no hay productos en localStorage, cargar los predeterminados
        products = [
            { id: 1, name: 'Fresas Frescas', description: 'Fresas rojas y jugosas, perfectas para postre', category: 'frutas', weight: '500G', price: 4500, stock: 15, featured: true },
            { id: 2, name: 'Mango', description: 'Mangos dulces y carnosos de la mejor cosecha', category: 'frutas', weight: '1KG', price: 3200, stock: 10, featured: true },
            { id: 3, name: 'Tomates', description: 'Tomates rojos y firmes, ideales para ensaladas', category: 'verduras', weight: '1KG', price: 2200, stock: 20, featured: true },
            { id: 4, name: 'Brócoli Orgánico', description: 'Brócoli verde y fresco, rico en nutrientes', category: 'verduras', weight: '500G', price: 3800, stock: 8, featured: true },
            { id: 5, name: 'Aguacate Hass', description: 'Aguacates cremosos y en su punto perfecto', category: 'frutas', weight: '3 UNIDADES', price: 5200, stock: 12, featured: true },
            { id: 6, name: 'Leche de Vaca', description: 'Leche fresca pasteurizada del día', category: 'lacteos', weight: '1 LITRO', price: 4200, stock: 5, featured: true },
            { id: 7, name: 'Queso Maduro', description: 'Queso artesanal fresco, suave y cremoso', category: 'lacteos', weight: '500G', price: 8500, stock: 7, featured: true },
            { id: 8, name: 'Manzana Roja', description: 'Manzanas dulces y crujientes', category: 'frutas', weight: '1KG', price: 3800, stock: 0, featured: false },
            { id: 9, name: 'Zanahoria', description: 'Zanahorias frescas y tiernas', category: 'verduras', weight: '1KG', price: 1800, stock: 25, featured: false },
            { id: 10, name: 'Yogurt Natural', description: 'Yogurt cremoso sin azúcar', category: 'lacteos', weight: '1L', price: 5200, stock: 0, featured: false }
        ];
        localStorage.setItem('mercadoFrescoProducts', JSON.stringify(products));
    }
    updateClientProducts();
    updateCartCount();
});

// Navegación
function navigateTo(section) {
    currentView = section;
    
    // Ocultar todas las secciones
    const hero = document.getElementById('hero');
    const benefits = document.querySelector('.benefits');
    const categories = document.querySelector('.categories');
    const products = document.getElementById('client-products');
    const about = document.getElementById('about-section');
    
    if (hero) hero.style.display = 'none';
    if (benefits) benefits.style.display = 'none';
    if (categories) categories.style.display = 'none';
    if (products) products.style.display = 'none';
    if (about) about.style.display = 'none';
    
    // Mostrar sección correspondiente
    if (section === 'inicio') {
        if (hero) hero.style.display = 'block';
        if (benefits) benefits.style.display = 'grid';
        if (categories) categories.style.display = 'block';
        if (products) products.style.display = 'block';
    } else if (section === 'tienda') {
        if (products) products.style.display = 'block';
    } else if (section === 'frutas' || section === 'verduras' || section === 'lacteos') {
        if (products) products.style.display = 'block';
    } else if (section === 'about') {
        if (about) about.style.display = 'block';
    }
    
    updateClientProducts();
    closeMenu();
}

function showClientView() {
    navigateTo('inicio');
}

function showAllProducts() {
    navigateTo('tienda');
}

function showCategory(category) {
    navigateTo(category);
}

// Menú hamburguesa
function toggleMenu() {
    const navContainer = document.getElementById('navContainer');
    const hamburger = document.querySelector('.hamburger');
    if (navContainer && hamburger) {
        navContainer.classList.toggle('active');
        hamburger.classList.toggle('active');
    }
}

function closeMenu() {
    const navContainer = document.getElementById('navContainer');
    const hamburger = document.querySelector('.hamburger');
    if (navContainer && hamburger) {
        navContainer.classList.remove('active');
        hamburger.classList.remove('active');
    }
}

// Actualizar productos cliente
function updateClientProducts() {
    const grid = document.getElementById('client-product-grid');
    if (!grid) return;
    
    let filteredProducts = products;

    if (currentView !== 'all' && currentView !== 'inicio' && currentView !== 'tienda') {
        filteredProducts = products.filter(p => p.category === currentView);
    }

    grid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-badge">${product.featured ? '⭐ Destacado' : '🆕 Nuevo'}</div>
            <div class="product-weight">${product.weight}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-stock ${getStockClass(product.stock)}">
                ${product.stock > 0 ? `📦 ${product.stock} disponibles` : '❌ Agotado'}
            </div>
            <div class="product-footer">
                <span class="product-price">₡${product.price.toLocaleString()}</span>
                <button class="add-btn" ${product.stock === 0 ? 'disabled' : ''} 
                        onclick="addToCart(${product.id}, this)">+</button>
            </div>
        </div>
    `).join('');
}

function getStockClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock < 5) return 'low-stock';
    return '';
}

// Función para actualizar contadores del carrito
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    
    const mobileCount = document.getElementById('cartCountMobile');
    const desktopCount = document.getElementById('cartCountDesktop');
    const originalCount = document.getElementById('cartCount');
    
    if (mobileCount) mobileCount.textContent = count;
    if (desktopCount) desktopCount.textContent = count;
    if (originalCount) originalCount.textContent = count;
    
    // Guardar carrito en localStorage
    localStorage.setItem('mercadoFrescoCart', JSON.stringify(cart));
}

// Función para animar ambos carritos
function animateCartIcons() {
    const mobileCart = document.querySelector('.mobile-cart');
    const desktopCart = document.querySelector('.desktop-cart');
    const originalCart = document.querySelector('.cart-icon:not(.mobile-cart):not(.desktop-cart)');
    
    if (mobileCart) {
        mobileCart.classList.add('cart-bounce');
        setTimeout(() => mobileCart.classList.remove('cart-bounce'), 500);
    }
    
    if (desktopCart) {
        desktopCart.classList.add('cart-bounce');
        setTimeout(() => desktopCart.classList.remove('cart-bounce'), 500);
    }
    
    if (originalCart) {
        originalCart.classList.add('cart-bounce');
        setTimeout(() => originalCart.classList.remove('cart-bounce'), 500);
    }
}

// Función para agregar al carrito
function addToCart(productId, button) {
    const product = products.find(p => p.id === productId);
    
    if (!product || product.stock === 0) return;
    
    // Efecto visual en el botón
    button.classList.add('added');
    setTimeout(() => button.classList.remove('added'), 500);
    
    // Animar carritos
    animateCartIcons();
    
    // Agregar al carrito
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('No hay suficiente stock disponible');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            weight: product.weight,
            quantity: 1,
            maxStock: product.stock
        });
    }
    
    updateCartCount();
}

// Función para abrir el carrito
function openCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        updateCartModal();
        modal.classList.add('active');
    }
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.classList.remove('active');
}

function updateCartModal() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        cartTotal.querySelector('span:last-child').textContent = '$0';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.weight} x${item.quantity}</p>
                </div>
                <div class="cart-item-price">₡${itemTotal.toLocaleString()}</div>
                <div class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.querySelector('span:last-child').textContent = `₡${total.toLocaleString()}`;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    updateCartModal();
}

function sendOrder() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    let total = 0;
    let message = "🍃 *Nuevo Pedido - Mercado Fresco* 🍃\n\n";
    message += "*Productos solicitados:*\n";
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `• ${item.name} (${item.weight}) x${item.quantity} - $${itemTotal.toLocaleString()}\n`;
    });
    
    message += `\n*Total: ₡${total.toLocaleString()}*`;
    message += "\n\n¡Gracias por tu compra! Te contactaremos pronto.";
    
    const phoneNumber = "+50687922758";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    
    cart = [];
    updateCartCount();
    closeCartModal();
}

// Cerrar menú al hacer click fuera
document.addEventListener('click', (e) => {
    const navContainer = document.getElementById('navContainer');
    const hamburger = document.querySelector('.hamburger');
    
    if (navContainer && hamburger && !navContainer.contains(e.target) && !hamburger.contains(e.target)) {
        navContainer.classList.remove('active');
        hamburger.classList.remove('active');
    }
});