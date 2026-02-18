// Datos compartidos (deberían venir de localStorage o API)
let products = JSON.parse(localStorage.getItem('mercadoFrescoProducts')) || [
    { id: 1, name: 'Fresas Frescas', description: 'Fresas rojas y jugosas, perfectas para postre', category: 'frutas', weight: '500G', price: 4500, stock: 15, featured: true },
    { id: 2, name: 'Mango Tommy', description: 'Mangos dulces y carnosos de la mejor cosecha', category: 'frutas', weight: '1KG', price: 3200, stock: 10, featured: true },
    { id: 3, name: 'Tomates Chonto', description: 'Tomates rojos y firmes, ideales para ensaladas', category: 'verduras', weight: '1KG', price: 2200, stock: 20, featured: true },
    { id: 4, name: 'Brócoli Orgánico', description: 'Brócoli verde y fresco, rico en nutrientes', category: 'verduras', weight: '500G', price: 3800, stock: 8, featured: true },
    { id: 5, name: 'Aguacate Hass', description: 'Aguacates cremosos y en su punto perfecto', category: 'frutas', weight: '3 UNIDADES', price: 5200, stock: 12, featured: true },
    { id: 6, name: 'Leche Entera Fresca', description: 'Leche fresca pasteurizada del día', category: 'lacteos', weight: '1 LITRO', price: 4200, stock: 5, featured: true },
    { id: 7, name: 'Queso Campesino', description: 'Queso artesanal fresco, suave y cremoso', category: 'lacteos', weight: '500G', price: 8500, stock: 7, featured: true },
    { id: 8, name: 'Manzana Roja', description: 'Manzanas dulces y crujientes', category: 'frutas', weight: '1KG', price: 3800, stock: 0, featured: false },
    { id: 9, name: 'Zanahoria', description: 'Zanahorias frescas y tiernas', category: 'verduras', weight: '1KG', price: 1800, stock: 25, featured: false },
    { id: 10, name: 'Yogurt Natural', description: 'Yogurt cremoso sin azúcar', category: 'lacteos', weight: '1L', price: 5200, stock: 0, featured: false }
];

let productToDelete = null;

// Guardar productos en localStorage
function saveProductsToStorage() {
    localStorage.setItem('mercadoFrescoProducts', JSON.stringify(products));
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
    updateAdminDashboard();
});

// Actualizar dashboard
function updateAdminDashboard() {
    updateAdminStats();
    updateAdminProductsTable();
}

// Actualizar estadísticas
function updateAdminStats() {
    const statsElement = document.getElementById('admin-stats');
    if (!statsElement) return;
    
    const totalProducts = products.length;
    const available = products.filter(p => p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const featured = products.filter(p => p.featured).length;

    statsElement.innerHTML = `
        <div class="stat-card">
            <h3>${totalProducts}</h3>
            <p>Total Productos</p>
        </div>
        <div class="stat-card">
            <h3>${available}</h3>
            <p>Disponibles</p>
        </div>
        <div class="stat-card">
            <h3>${outOfStock}</h3>
            <p>Agotados</p>
        </div>
        <div class="stat-card">
            <h3>${featured}</h3>
            <p>Destacados</p>
        </div>
    `;
}

// Obtener clase de stock
function getStockClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock < 5) return 'low-stock';
    return '';
}

// Actualizar tabla de productos
function updateAdminProductsTable() {
    const tbody = document.getElementById('admin-products-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><strong>${product.name}</strong><br><small>${product.weight}</small></td>
            <td>${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</td>
            <td>$${product.price.toLocaleString()}</td>
            <td class="${getStockClass(product.stock)}">${product.stock}</td>
            <td>${product.featured ? '✅' : '❌'}</td>
            <td class="action-buttons">
                <button class="btn-icon btn-edit" onclick="openEditProductModal(${product.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-icon btn-delete" onclick="openDeleteModal(${product.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal funciones
function openAddProductModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    
    document.getElementById('modal-title').textContent = 'Agregar Producto';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    modal.classList.add('active');
}

function openEditProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-weight').value = product.weight;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-featured').checked = product.featured;

    document.getElementById('product-modal').classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('active');
}

function saveProduct(event) {
    event.preventDefault();

    const productData = {
        id: document.getElementById('product-id').value ? parseInt(document.getElementById('product-id').value) : Date.now(),
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        category: document.getElementById('product-category').value,
        weight: document.getElementById('product-weight').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        featured: document.getElementById('product-featured').checked
    };

    if (document.getElementById('product-id').value) {
        // Editar producto existente
        const index = products.findIndex(p => p.id === productData.id);
        if (index !== -1) {
            products[index] = productData;
        }
    } else {
        // Agregar nuevo producto
        products.push(productData);
    }
    
    saveProductsToStorage();
    closeModal();
    updateAdminDashboard();
}

// Delete functions
function openDeleteModal(id) {
    productToDelete = id;
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.add('active');
}

function closeDeleteModal() {
    productToDelete = null;
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.remove('active');
}

function confirmDelete() {
    if (productToDelete) {
        products = products.filter(p => p.id !== productToDelete);
        saveProductsToStorage();
        closeDeleteModal();
        updateAdminDashboard();
    }
}