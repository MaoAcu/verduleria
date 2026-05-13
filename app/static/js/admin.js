// ==================== VARIABLES GLOBALES ====================
let products = [];
let complements = [];
let categories = [];
let currentCategory = 'all';
let minStockAlert = 5;
 
 
// Categorías disponibles
const availableCategories = [
    { id: "frutas", nombre: 'Frutas', icono: 'fa-apple-whole' },
    { id: "verduras", nombre: 'Verduras', icono: 'fa-carrot' },
    { id: "lacteos", nombre: 'Lácteos', icono: 'fa-cheese' },
    { id: "abarrotes", nombre: 'Abarrotes', icono: 'fa-bowl-food' },
     { id: "organicos", nombre: 'Organicos', icono: 'fa-bowl-food' }
];

// ==================== FUNCIONES DE UTILIDAD ====================
function normalizeText(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, '');
}

 

function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

function showInfoModal(title, msg, type = 'success') {
    const modal = document.getElementById('infoModal');
    const titleEl = document.getElementById('infoModalTitle');
    const messageEl = document.getElementById('infoModalMessage');
    const iconEl = document.getElementById('infoModalIcon');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = msg;
    if (iconEl) {
        iconEl.innerHTML = type === 'success' 
            ? '<i class="fas fa-check-circle" style="color: #28a745;"></i>'
            : '<i class="fas fa-exclamation-circle" style="color: #dc3545;"></i>';
    }
    if (modal) modal.style.display = 'flex';
    
    setTimeout(() => {
        if (modal) modal.style.display = 'none';
    }, 3000);
}

function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) modal.style.display = 'none';
}

function closeAllModals() {
    document.querySelectorAll('.modal, .modal-overlay').forEach(m => m.style.display = 'none');
}

function previewImage(input, previewId, fileId) {
    const preview = document.getElementById(previewId);
    const fileName = document.getElementById(fileId);
    
    if (input.files?.[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            if (preview) preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 120px;">`;
        };
        reader.readAsDataURL(input.files[0]);
        if (fileName) fileName.textContent = input.files[0].name;
    }
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    showLoader();
    categories = [...availableCategories];
    loadProducts();
    loadComplements();
    renderCategoriesSidebar();
    renderCategoriesGrid();
    populateCategorySelect();
    setupEventListeners();
    checkLowStock();
});

function setupEventListeners() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar) sidebar.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });
    }
    
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                if (sidebar) sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            }
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });
}

// ==================== CARGA DE DATOS ====================
async function loadProducts() {
    try {
        const response = await fetch('/producto/getproducto');
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        
        products = Array.isArray(data) ? data.map(item => ({
            id: item.id,
            name: item.nombre,
            description: item.descripcion || '',
            category: item.categoria,
            weight: item.peso || '1 unidad',
            price: item.precio,
            stock: item.stock || 0,
            featured: item.destacado === 1,
            estado: item.estado === 1 ? 'active' : 'inactive',
            img: item.imagen ? `${URL_IMG_BASE}${item.imagen}` : URL_IMG_DEFAULT
        })) : [];
        
        updateDashboardStats();
        updateStockTable();
        checkLowStock();
        renderCategoriesSidebar();
        renderProducts(currentCategory);
    } catch (error) {
        console.error('Error:', error);
        showInfoModal('Error', 'No se pudieron cargar productos', 'error');
    } finally {
        hideLoader();
    }
}

async function loadComplements() {
    try {
        const response = await fetch('/producto/getComplements');
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        
        complements = data && data.length > 0 ? data.map(item => ({
            id: item.id,
            name: item.nombre,
            description: item.descripcion || 'Sin descripción',
            price: item.precio,
            stock: item.stock || 0,
            popular: item.popular === 1,
            estado: 'active',
            img: item.imagen_url ? `${URL_IMG_BASE}${item.imagen_url}` : URL_IMG_DEFAULT
        })) : [];
        
        updateComplementCount();
        renderComplementsGrid();
        updateComplementStats();
    } catch (error) {
        console.error('Error:', error);
        complements = [];
        renderComplementsGrid();
        updateComplementStats();
    }
}

// ==================== CATEGORÍAS ====================
function renderCategoriesSidebar() {
    const list = document.getElementById('categoriasList');
    if (!list) return;
    
    list.innerHTML = categories.map(cat => {
        const count = products.filter(p => {
            if (!p.category) return false;
            return normalizeText(p.category) === normalizeText(cat.nombre);
        }).length;
        
        return `
            <li>
                <a href="#" onclick="selectCategory('${cat.nombre}')">
                    <i class="fas ${cat.icono || 'fa-tag'}"></i>
                    <span>${cat.nombre}</span>
                    <span class="category-count">${count}</span>
                </a>
            </li>
        `;
    }).join('');
    
    addComplementsToSidebar();
}

function addComplementsToSidebar() {
    const list = document.getElementById('categoriasList');
    if (!list || document.querySelector('[onclick="openComplementosModal()"]')) return;
    
    const item = document.createElement('li');
    item.innerHTML = `
        <a href="#" onclick="openComplementosModal()">
            <i class="fas fa-pizza-slice"></i>
            <span>Complementos</span>
            <span class="category-count" id="complementCount">${complements.length}</span>
        </a>
    `;
    list.appendChild(item);
}

function renderCategoriesGrid() {
    const grid = document.getElementById('categoriasGrid');
    if (!grid) return;
    
    grid.innerHTML = categories.map(cat => {
        const count = products.filter(p => {
            if (!p.category) return false;
            return normalizeText(p.category) === normalizeText(cat.nombre);
        }).length;
        
        return `
            <div class="categoria-card" onclick="selectCategory('${cat.nombre}')">
                <div class="categoria-icon">
                    <i class="fas ${cat.icono || 'fa-tag'}"></i>
                </div>
                <h3>${cat.nombre}</h3>
                <p>${count} productos</p>
            </div>
        `;
    }).join('');
}

function populateCategorySelect() {
    const select = document.getElementById('categoria');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar</option>' +
        categories.map(cat => `<option value="${cat.nombre}">${cat.nombre}</option>`).join('');
}

function selectCategory(categoryName) {
    currentCategory = categoryName;
    
 
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    if (event?.currentTarget) event.currentTarget.classList.add('active');
    
    // OCULTAR TODAS LAS SECCIONES
    const sections = ['categorias', 'productos', 'estadisticas', 'configuracion', 'mensajes'];
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if (el) el.style.display = 'none';
    });
    
    // MOSTRAR SOLO LA SECCIÓN DE PRODUCTOS
    const productosSection = document.getElementById('productosSection');
    if (productosSection) {
        productosSection.style.display = 'block';
    }
    
    // Renderizar productos
    renderProducts(categoryName);
    
    // Actualizar título
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) sectionTitle.textContent = categoryName;
    
    // Mostrar FAB
    const fabCategorias = document.getElementById('fabCategorias');
    if (fabCategorias) fabCategorias.style.display = 'block';
}
function switchSection(section) {
    const sections = ['categorias', 'productos', 'estadisticas', 'configuracion', 'mensajes'];
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        if (el) el.style.display = 'none';
    });
    
    const activeSection = document.getElementById(section + 'Section');
    if (activeSection) activeSection.style.display = 'block';
    
    const titles = {
        'categorias': 'Gestionar Categorías',
        'estadisticas': 'Estadísticas',
        'configuracion': 'Configuración',
        'mensajes': 'Mensajes'
    };
    
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) sectionTitle.textContent = titles[section] || 'Dashboard';
    
    const fabCategorias = document.getElementById('fabCategorias');
    if (fabCategorias) fabCategorias.style.display = section === 'categorias' ? 'none' : 'block';
    
    if (section === 'estadisticas') {
        updateDashboardStats();
        updateStockTable();
    }
    if (section === 'mensajes' && typeof cargarMensajes === 'function') {
        cargarMensajes();
    }
}

// ==================== PRODUCTOS ====================
function renderProducts(category = null) {
    const section = document.getElementById('productosSection');
    if (!section) return;
    
    let filteredProducts = products;
    
    // Filtrar solo productos ACTIVOS
    filteredProducts = filteredProducts.filter(p => p.estado === 'active');
    
    // Filtrar por categoría
    if (category && category !== 'all') {
        const categoryNorm = normalizeText(category);
        filteredProducts = filteredProducts.filter(p => {
            if (!p.category) return false;
            return normalizeText(p.category) === categoryNorm;
        });
    }
    
    if (filteredProducts.length === 0) {
        section.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-box"></i> ${category || 'Todos'}</h2>
                <button class="btn-add-item" onclick="openAddProductModal('${category || ''}')">
                    <i class="fas fa-plus"></i> <span>Nuevo</span>
                </button>
            </div>
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No hay productos activos</p>
            </div>
        `;
        return;
    }
    
    section.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-box"></i> ${category || 'Todos'}</h2>
            <button class="btn-add-item" onclick="openAddProductModal('${category || ''}')">
                <i class="fas fa-plus"></i> <span>Nuevo</span>
            </button>
        </div>
        <div class="products-grid">
            ${filteredProducts.map(p => {
                const name = p.name.replace(/'/g, "\\'");
                return `
                    <div class="product-card">
                        <div class="product-image">
                            <img src="${p.img}" alt="${p.name}" onerror="this.src='${URL_IMG_DEFAULT}'">
                            ${p.featured ? '<span class="product-badge">🌟</span>' : ''}
                        </div>
                        <div class="product-info">
                            <h3>${p.name}</h3>
                            <p class="product-desc">${p.description || ''}</p>
                            <div class="product-details">
                                <span class="product-price">₡${p.price?.toLocaleString() || 0}</span>
                                <span class="product-weight">${p.weight}</span>
                            </div>
                            <div class="product-stock ${getStockClass(p.stock)}">
                                <i class="fas fa-boxes"></i> Stock: ${p.stock || 0}
                            </div>
                            <div class="product-actions">
                                <button class="btn-icon" onclick='openEditProductModal(${p.id})' title="Editar">
                                    <i class="fas fa-edit"></i><span> Editar</span>
                                </button>
                                <button class="btn-icon" onclick='openStockModal(${p.id}, "${name}", ${p.stock})' title="Stock">
                                    <i class="fas fa-boxes"></i><span> Stock</span>
                                </button>
                                <button class="btn-icon delete" onclick='openDeleteModal("producto", ${p.id}, "${name}")' title="Eliminar">
                                    <i class="fas fa-trash"></i><span> Eliminar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getStockClass(stock) {
    if (stock === 0) return 'stock-critico';
    if (stock < minStockAlert) return 'stock-bajo';
    return 'stock-normal';
}

function openAddProductModal(category = '') {
    const modalTitle = document.getElementById('modalTitle');
    const itemId = document.getElementById('itemId');
    const itemName = document.getElementById('itemName');
    const itemDescription = document.getElementById('itemDescription');
    const itemPrice = document.getElementById('itemPrice');
    const itemStock = document.getElementById('itemStock');
    const itemWeight = document.getElementById('itemWeight');
    const select = document.getElementById('categoria');
    
    if (modalTitle) modalTitle.textContent = 'Nuevo Producto';
    if (itemId) itemId.value = '';
    if (itemName) itemName.value = '';
    if (itemDescription) itemDescription.value = '';
    if (itemPrice) itemPrice.value = '';
    if (itemStock) itemStock.value = '';
    if (itemWeight) itemWeight.value = '';
    
    if (category && select) {
        Array.from(select.options).forEach(o => {
            if (normalizeText(o.value) === normalizeText(category)) o.selected = true;
        });
    }
    
    resetItemForm();
    const editModal = document.getElementById('editModal');
    if (editModal) editModal.style.display = 'flex';
}

function openEditProductModal(id) {
    const p = products.find(p => p.id == id);
    if (!p) return;
    
    const modalTitle = document.getElementById('modalTitle');
    const itemId = document.getElementById('itemId');
    const itemName = document.getElementById('itemName');
    const itemDescription = document.getElementById('itemDescription');
    const itemPrice = document.getElementById('itemPrice');
    const itemStock = document.getElementById('itemStock');
    const itemWeight = document.getElementById('itemWeight');
    const select = document.getElementById('categoria');
    const estrella = document.getElementById('estrellaSimple');
    const texto = document.getElementById('destacadoText');
    const input = document.getElementById('itemDestacado');
    
    if (modalTitle) modalTitle.textContent = 'Editar Producto';
    if (itemId) itemId.value = p.id;
    if (itemName) itemName.value = p.name || '';
    if (itemDescription) itemDescription.value = p.description || '';
    if (itemPrice) itemPrice.value = p.price || '';
    if (itemStock) itemStock.value = p.stock || '';
    if (itemWeight) itemWeight.value = p.weight || '';
    
    if (p.category && select) {
        Array.from(select.options).forEach(o => {
            if (normalizeText(o.value) === normalizeText(p.category)) o.selected = true;
        });
    }
    
    if (p.featured) {
        if (estrella) {
            estrella.classList.add('active');
            estrella.innerHTML = '<i class="fas fa-star"></i>';
        }
        if (texto) texto.textContent = 'Destacado';
        if (input) input.value = '1';
    } else {
        if (estrella) {
            estrella.classList.remove('active');
            estrella.innerHTML = '<i class="far fa-star"></i>';
        }
        if (texto) texto.textContent = 'No destacado';
        if (input) input.value = '0';
    }
    
    setItemStatus(p.estado || 'active');
    
    const imagePreview = document.getElementById('imagePreview');
    if (p.img && p.img !== URL_IMG_DEFAULT && imagePreview) {
        imagePreview.innerHTML = `<img src="${p.img}">`;
    }
    
    const editModal = document.getElementById('editModal');
    if (editModal) editModal.style.display = 'flex';
}

function resetItemForm() {
    const estrella = document.getElementById('estrellaSimple');
    const texto = document.getElementById('destacadoText');
    const input = document.getElementById('itemDestacado');
    const imagePreview = document.getElementById('imagePreview');
    const fileName = document.getElementById('imageFileName');
    
    if (estrella) {
        estrella.classList.remove('active');
        estrella.innerHTML = '<i class="far fa-star"></i>';
    }
    if (texto) texto.textContent = 'No destacado';
    if (input) input.value = '0';
    if (imagePreview) imagePreview.innerHTML = '';
    if (fileName) fileName.textContent = '';
    setItemStatus('active');
}

function setItemStatus(status) {
    // Actualizar el campo oculto
    const statusInput = document.getElementById('itemStatus');
    if (statusInput) {
        statusInput.value = status;
        console.log('Estado establecido a:', status); // Para depuración
    }
    
    // Actualizar los botones visuales
    const statusButtons = document.querySelectorAll('#itemForm .status-btn');
    console.log('Botones encontrados:', statusButtons.length); // Para depuración
    
    statusButtons.forEach(btn => {
        const btnStatus = btn.getAttribute('data-status');
        console.log('Botón status:', btnStatus, 'Comparando con:', status); // Para depuración
        
        if (btnStatus === status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
function toggleDestacado() {
    const btn = document.getElementById('estrellaSimple');
    const input = document.getElementById('itemDestacado');
    const text = document.getElementById('destacadoText');
    
    if (input && input.value === '1') {
        if (input) input.value = '0';
        if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="far fa-star"></i>';
        }
        if (text) text.textContent = 'No destacado';
    } else {
        if (input) input.value = '1';
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-star"></i>';
        }
        if (text) text.textContent = 'Destacado';
    }
}

async function saveProduct(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const id = document.getElementById('itemId')?.value || '';
    const pesoInput = document.getElementById('itemWeight')?.value || '';
    const priceType = document.querySelector('input[name="priceType"]:checked')?.value || 'peso';
    
    // Construir el peso con el tipo
    let pesoFinal = pesoInput;
    if (pesoInput && !pesoInput.match(/(kg|unidad|pieza|g)/i)) {
        pesoFinal = priceType === 'peso' ? `${pesoInput} kg` : `${pesoInput} unidad(es)`;
    }
    
    formData.append('nombre', document.getElementById('itemName')?.value || '');
    formData.append('descripcion', document.getElementById('itemDescription')?.value || '');
    formData.append('categoria', document.getElementById('categoria')?.value || '');
    formData.append('precio', document.getElementById('itemPrice')?.value || '0');
    formData.append('stock', document.getElementById('itemStock')?.value || '0');
    formData.append('peso', pesoFinal);  
    formData.append('estado', document.getElementById('itemStatus')?.value === 'active' ? '1' : '0');
    formData.append('destacado', document.getElementById('itemDestacado')?.value || '0');

    const fileInput = document.getElementById('itemImageFile');
    if (fileInput && fileInput.files[0]) formData.append('image', fileInput.files[0]);
    
    try {
        showLoader();
        
        let url, method;
        if (id) {
            url = `/producto/updateProductos/${id}`;
            method = 'PUT';
        } else {
            url = '/producto/createItem';
            method = 'POST';
        }
        
        const res = await fetch(url, { method: method, body: formData });
        if (!res.ok) throw new Error('Error');
        
        await loadProducts();
        closeItemModal();
        showInfoModal('Éxito', 'Producto guardado', 'success');
    } catch (error) {
        console.error('Error:', error);
        showInfoModal('Error', 'No se pudo guardar', 'error');
    } finally {
        hideLoader();
    }
}

function closeItemModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
}

//  COMPLEMENTOS  
function openComplementosModal() {
    renderComplementsGrid();
    updateComplementStats();
    const modal = document.getElementById('complementosModal');
    if (modal) modal.style.display = 'flex';
}

function closeComplementosModal() {
    const modal = document.getElementById('complementosModal');
    if (modal) modal.style.display = 'none';
}

function renderComplementsGrid(filter = '') {
    const grid = document.getElementById('complementosGrid');
    if (!grid) return;
    
    let filtered = complements;
    if (filter) {
        filtered = complements.filter(c => 
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(filter.toLowerCase()))
        );
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pizza-slice"></i>
                <p>No hay complementos</p>
                <button class="btn-add-item" onclick="openAddComplementModal()">
                    <i class="fas fa-plus"></i> Agregar
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filtered.map(c => {
        const name = c.name.replace(/'/g, "\\'");
        const isActive = c.estado === undefined || c.estado === 'active';
        const isPopular = c.popular === true;
        
        return `
            <div class="complement-card ${!isActive ? 'inactive' : ''} ${isPopular ? 'popular' : ''}">
                <img src="${c.img}" alt="${c.name}" class="complement-image" onerror="this.src='${URL_IMG_DEFAULT}'">
                <div class="complement-info">
                    <div class="complement-name">${c.name}</div>
                    ${c.description ? `<div class="complement-description">${c.description}</div>` : ''}
                    <div class="complement-price">₡${c.price?.toLocaleString() || 0}</div>
                    <div class="complement-stock ${getComplementStockClass(c.stock)}">
                        <i class="fas fa-boxes"></i> Stock: ${c.stock || 0}
                    </div>
                    <div class="complement-actions">
                        <button class="btn-edit-complement" onclick='openEditComplementModal(${c.id})' title="Editar">
                            <i class="fas fa-edit"></i><span> Editar</span>
                        </button>
                        <button class="btn-stock-complement" onclick='openStockModal(${c.id}, "${name}", ${c.stock})' title="Stock">
                            <i class="fas fa-boxes"></i><span> Stock</span>
                        </button>
                        <button class="btn-delete-complement" onclick='openDeleteModal("complemento", ${c.id}, "${name}")' title="Eliminar">
                            <i class="fas fa-trash"></i><span> Eliminar</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterComplements() {
    const text = document.getElementById('complementSearch')?.value || '';
    renderComplementsGrid(text);
}

function getComplementStockClass(stock) {
    if (stock === 0) return 'critico';
    if (stock < 5) return 'bajo';
    return 'normal';
}

function updateComplementCount() {
    const el = document.getElementById('complementCount');
    if (el) el.textContent = complements.length;
}

function updateComplementStats() {
    const stats = document.getElementById('complementosStats');
    if (!stats) return;
    
    const total = complements.length;
    const disponibles = complements.filter(c => c.estado === undefined || c.estado === 'active').length;
    const populares = complements.filter(c => c.popular === true).length;
    const bajo = complements.filter(c => c.stock > 0 && c.stock < 5).length;
    const agotados = complements.filter(c => c.stock === 0).length;
    
    stats.innerHTML = `
        <div class="complement-stat-card">
            <i class="fas fa-pizza-slice"></i>
            <div class="stat-number">${total}</div>
            <div class="stat-label">Total</div>
        </div>
        <div class="complement-stat-card">
            <i class="fas fa-check-circle"></i>
            <div class="stat-number">${disponibles}</div>
            <div class="stat-label">Disponibles</div>
        </div>
        <div class="complement-stat-card">
            <i class="fas fa-star"></i>
            <div class="stat-number">${populares}</div>
            <div class="stat-label">Populares</div>
        </div>
        <div class="complement-stat-card">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="stat-number">${bajo}</div>
            <div class="stat-label">Stock Bajo</div>
        </div>
        <div class="complement-stat-card">
            <i class="fas fa-times-circle"></i>
            <div class="stat-number">${agotados}</div>
            <div class="stat-label">Agotados</div>
        </div>
    `;
}

function openAddComplementModal() {
    const title = document.getElementById('complementModalTitle');
    const id = document.getElementById('complementId');
    const name = document.getElementById('complementName');
    const description = document.getElementById('complementDescription');
    const price = document.getElementById('complementPrice');
    const stock = document.getElementById('complementStock');
    const preview = document.getElementById('complementImagePreview');
    const fileName = document.getElementById('complementImageFileName');
    
    if (title) title.textContent = 'Nuevo Complemento';
    if (id) id.value = '';
    if (name) name.value = '';
    if (description) description.value = '';
    if (price) price.value = '';
    if (stock) stock.value = '';
    
    setComplementStatus('active');
    
    const btn = document.getElementById('complementPopular');
    const text = document.getElementById('complementPopularText');
    const input = document.getElementById('complementIsPopular');
    
    if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="far fa-star"></i>';
    }
    if (text) text.textContent = 'Normal';
    if (input) input.value = '0';
    
    if (preview) preview.innerHTML = '';
    if (fileName) fileName.textContent = '';
    
    closeComplementosModal();
    const modal = document.getElementById('complementModal');
    if (modal) modal.style.display = 'flex';
}

function openEditComplementModal(id) {
    const c = complements.find(c => c.id == id);
    if (!c) return;
    
    const title = document.getElementById('complementModalTitle');
    const idInput = document.getElementById('complementId');
    const name = document.getElementById('complementName');
    const description = document.getElementById('complementDescription');
    const price = document.getElementById('complementPrice');
    const stock = document.getElementById('complementStock');
    
    if (title) title.textContent = 'Editar Complemento';
    if (idInput) idInput.value = c.id;
    if (name) name.value = c.name || '';
    if (description) description.value = c.description || '';
    if (price) price.value = c.price || '';
    if (stock) stock.value = c.stock || '';
    
    setComplementStatus(c.estado || 'active');
    
    const btn = document.getElementById('complementPopular');
    const text = document.getElementById('complementPopularText');
    const input = document.getElementById('complementIsPopular');
    
    if (c.popular) {
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-star"></i>';
        }
        if (text) text.textContent = 'Popular';
        if (input) input.value = '1';
    } else {
        if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="far fa-star"></i>';
        }
        if (text) text.textContent = 'Normal';
        if (input) input.value = '0';
    }
    
    const preview = document.getElementById('complementImagePreview');
    if (c.img && c.img !== URL_IMG_DEFAULT && preview) {
        preview.innerHTML = `<img src="${c.img}">`;
    }
    
    closeComplementosModal();
    const modal = document.getElementById('complementModal');
    if (modal) modal.style.display = 'flex';
}

function setComplementStatus(status) {
    const statusInput = document.getElementById('complementStatus');
    if (statusInput) statusInput.value = status;
    
    document.querySelectorAll('#complementForm .status-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === status);
    });
}

function toggleComplementPopular() {
    const btn = document.getElementById('complementPopular');
    const input = document.getElementById('complementIsPopular');
    const text = document.getElementById('complementPopularText');
    
    if (input && input.value === '1') {
        if (input) input.value = '0';
        if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="far fa-star"></i>';
        }
        if (text) text.textContent = 'Normal';
    } else {
        if (input) input.value = '1';
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-star"></i>';
        }
        if (text) text.textContent = 'Popular';
    }
}

async function saveComplement(e) {
    e.preventDefault();
    
     const formData = new FormData();
    const id = document.getElementById('complementId')?.value || '';
    
    formData.append('nombre', document.getElementById('complementName')?.value || '');
    formData.append('descripcion', document.getElementById('complementDescription')?.value || '');
    formData.append('precio', document.getElementById('complementPrice')?.value || '0');
    formData.append('stock', document.getElementById('complementStock')?.value || '0');
    formData.append('popular', document.getElementById('complementIsPopular')?.value || '0');  // ← AGREGAR
    formData.append('estado', document.getElementById('complementStatus')?.value || 'active');  // ← AGREGAR
    
    const fileInput = document.getElementById('complementImageFile');
    if (fileInput && fileInput.files[0]) formData.append('image', fileInput.files[0]);
    try {
        showLoader();
        
        let url, method;
        if (id) {
            url = `/producto/updateComplemento/${id}`;
            method = 'PUT';
        } else {
            url = '/producto/createComplemento';
            method = 'POST';
        }
        
        const res = await fetch(url, { method: method, body: formData });
        if (!res.ok) throw new Error('Error');
        
        await loadComplements();
        closeComplementItemModal();
        openComplementosModal();
        showInfoModal('Éxito', 'Complemento guardado', 'success');
    } catch (error) {
        console.error('Error:', error);
        showInfoModal('Error', 'No se pudo guardar', 'error');
    } finally {
        hideLoader();
    }
}

function closeComplementItemModal() {
    const modal = document.getElementById('complementModal');
    if (modal) modal.style.display = 'none';
}

// ==================== STOCK ====================
function openStockModal(id, name, stock, tipo = 'producto') {
    const idInput = document.getElementById('stockProductId');
    const nameSpan = document.getElementById('stockProductName');
    const stockInput = document.getElementById('newStock');
    const addCheck = document.getElementById('addToCurrent');
    const tipoInput = document.getElementById('stockItemType');  // ← Agregar esta línea
    
    if (idInput) idInput.value = id;
    if (nameSpan) nameSpan.textContent = name;
    if (stockInput) stockInput.value = stock || 0;
    if (addCheck) addCheck.checked = false;
    if (tipoInput) tipoInput.value = tipo;  // ← Agregar esta línea
    
    console.log('Stock Modal - ID:', id, 'Nombre:', name, 'Tipo:', tipo); // Debug
    
    const modal = document.getElementById('stockModal');
    if (modal) modal.style.display = 'flex';
}
function closeStockModal() {
    const modal = document.getElementById('stockModal');
    if (modal) modal.style.display = 'none';
}

async function updateStock(e) {
    e.preventDefault();
    
    const id = document.getElementById('stockProductId')?.value;
    const stock = parseInt(document.getElementById('newStock')?.value || '0');
    const add = document.getElementById('addToCurrent')?.checked || false;
    const tipo = document.getElementById('stockItemType')?.value || 'producto'; // ← Leer tipo
    
    console.log('UpdateStock - Tipo enviado:', tipo); // Debug
    
    try {
        showLoader();
        
        const res = await fetch('/producto/updateStock', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                items: [{ 
                    id: parseInt(id), 
                    stock: stock, 
                    addToCurrent: add,
                    tipo: tipo  // ← Enviar tipo
                }] 
            })
        });
        
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || 'Error');
        
        await loadProducts();      
        await loadComplements();   
        
         
        updateDashboardStats();   
        updateStockTable();        
        checkLowStock(); 
        closeStockModal();
        showInfoModal('Éxito', 'Stock actualizado', 'success');
    } catch (error) {
        console.error('Error:', error);
        showInfoModal('Error', error.message, 'error');
    } finally {
        hideLoader();
    }
}

// ==================== ELIMINAR ====================
function openDeleteModal(tipo, id, nombre) {
    const title = document.getElementById('deleteModalTitle');
    const message = document.getElementById('deleteModalMessage');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    if (title) title.textContent = `¿Eliminar ${nombre}?`;
    if (message) message.textContent = `Este ${tipo} desaparecerá.`;
    if (confirmBtn) confirmBtn.onclick = () => deleteItem(tipo, id);
    
    const modal = document.getElementById('deleteModal');
    if (modal) modal.style.display = 'flex';
}

async function deleteItem(tipo, id) {
    try {
        showLoader();
        
        let url;
        if (tipo === 'producto') {
            url = `/producto/deleteProducto/${id}`;
        } else {
            url = `/producto/deleteComplemento/${id}`;
        }
        
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error');
        
        if (tipo === 'producto') {
            await loadProducts();
        } else {
            await loadComplements();
        }
        
        closeDeleteModal();
        showInfoModal('Éxito', `${tipo} eliminado`, 'success');
    } catch (error) {
        console.error('Error:', error);
        showInfoModal('Error', `No se pudo eliminar`, 'error');
    } finally {
        hideLoader();
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.style.display = 'none';
}

 
function openAddCategoriaModal() {
    const title = document.getElementById('categoriaModalTitle');
    const id = document.getElementById('categoriaId');
    const nombre = document.getElementById('categoriaNombre');
    
    if (title) title.textContent = 'Nueva Categoría';
    if (id) id.value = '';
    if (nombre) nombre.value = '';
    
    const modal = document.getElementById('categoriaModal');
    if (modal) modal.style.display = 'flex';
}

function closeCategoriaModal() {
    const modal = document.getElementById('categoriaModal');
    if (modal) modal.style.display = 'none';
}

function saveCategoria(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('categoriaNombre')?.value;
    const icono = document.getElementById('categoriaIcono')?.value;
    
    if (!nombre) {
        showInfoModal('Error', 'Nombre requerido', 'error');
        return;
    }
    
    categories.push({
        id: nombre.toLowerCase().replace(/\s+/g, ''),
        nombre: nombre,
        icono: icono || 'fa-tag'
    });
    
    renderCategoriesSidebar();
    renderCategoriesGrid();
    populateCategorySelect();
    closeCategoriaModal();
    showInfoModal('Éxito', 'Categoría creada', 'success');
}

// ==================== ESTADÍSTICAS ====================
function updateDashboardStats() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    
    const total = products.length;
    const complementos = complements.length;
    const bajo = products.filter(p => p.stock > 0 && p.stock < minStockAlert).length;
    const agotados = products.filter(p => p.stock === 0).length;
    const disponibles = products.filter(p => p.estado === 'active').length;
    
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-box"></i></div>
            <div class="stat-info">
                <h3>${total}</h3>
                <p>Productos</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-pizza-slice"></i></div>
            <div class="stat-info">
                <h3>${complementos}</h3>
                <p>Complementos</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
            <div class="stat-info">
                <h3>${disponibles}</h3>
                <p>Disponibles</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="stat-info">
                <h3>${bajo}</h3>
                <p>Stock Bajo</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
            <div class="stat-info">
                <h3>${agotados}</h3>
                <p>Agotados</p>
            </div>
        </div>
    `;
}

function updateStockTable() {
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;
    
    // Agregar el tipo a cada item
    const items = [
        ...products.map(p => ({...p, nombre: p.name, categoria: p.category, tipo: 'producto'})),
        ...complements.map(c => ({...c, nombre: c.name, categoria: 'Complemento', tipo: 'complemento'}))
    ].sort((a, b) => (a.stock || 0) - (b.stock || 0));
    
    tbody.innerHTML = items.map(item => {
        const name = item.nombre.replace(/'/g, "\\'");
        // Agregar un indicador visual para complementos
        const nombreConIcono = item.tipo === 'complemento' ? `➕ ${item.nombre}` : item.nombre;
        
        return `
            <tr>
                <td>${nombreConIcono}</td>
                <td>${item.categoria}</td>
                <td>${item.stock || 0}</td>
                <td>
                    <span class="stock-badge ${getStockBadgeClass(item.stock)}">
                        ${item.stock === 0 ? 'Agotado' : item.stock < minStockAlert ? 'Bajo' : 'Normal'}
                    </span>
                </td>
                <td>
                    <button class="btn-stock" onclick='openStockModal(${item.id}, "${name}", ${item.stock}, "${item.tipo}")'>
                        <i class="fas fa-edit"></i> Actualizar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStockBadgeClass(stock) {
    if (stock === 0) return 'critico';
    if (stock < minStockAlert) return 'bajo';
    return 'normal';
}

function checkLowStock() {
    const bajo = products.filter(p => p.stock > 0 && p.stock < minStockAlert).length;
    const alerta = document.getElementById('stockAlert');
    const contador = document.getElementById('stockAlertCount');
    
    if (bajo > 0 && alerta) {
        alerta.style.display = 'flex';
        if (contador) contador.textContent = bajo;
    } else if (alerta) {
        alerta.style.display = 'none';
    }
}

function saveConfig() {
    const val = document.getElementById('minStockAlert')?.value;
    if (val) {
        minStockAlert = parseInt(val);
        checkLowStock();
        updateStockTable();
        showInfoModal('Éxito', 'Configuración guardada', 'success');
    }
}
 
// ==================== LOGOUT ====================
async function logout() {
    try {
        const res = await fetch(URL_LOG);
        if (res.ok) window.location.href = '/login';
    } catch (error) {
        console.error('Error:', error);
    }
}