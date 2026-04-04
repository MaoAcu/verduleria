
        // Variables globales
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
            { id: "abarrotes", nombre: 'Abarrotes', icono: 'fa-bowl-food' }
        ];

        // ========== FUNCIÓN DE UTILIDAD PARA NORMALIZAR TEXTO ==========
        function normalizeText(str) {
            if (!str) return '';
            return str.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
                .replace(/[^\w\s]/g, ''); // Elimina caracteres especiales
        }

        // Inicialización
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

        // Event Listeners
        function setupEventListeners() {
            const menuToggle = document.getElementById('menuToggle');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            if (menuToggle) {
                menuToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sidebar.classList.toggle('active');
                    overlay.classList.toggle('active');
                });
            }
            
            if (overlay) {
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                });
            }
            
            document.querySelectorAll('.sidebar-nav a').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('active');
                        overlay.classList.remove('active');
                    }
                });
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeAllModals();
            });
        }

        // Carga de datos
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
                
                // IMPORTANTE: Adaptar los datos del backend al formato que espera el frontend
                complements = data && data.length > 0 ? data.map(item => ({
                    id: item.id,
                    name: item.nombre,
                    description: item.descripcion || 'Sin descripción',
                    price: item.precio,
                    stock: item.stock || 0,
                    popular: item.popular === 1, // Si no viene, será false
                    estado: item.estado === 1 ? 'active' : (item.estado === 0 ? 'inactive' : 'active'), // Si no viene estado, por defecto active
                    img: item.imagen_url || URL_IMG_DEFAULT
                })) : getBackupComplements();
                
                updateComplementCount();
                renderComplementsGrid();
                updateComplementStats();
            } catch (error) {
                console.error('Error:', error);
                complements = getBackupComplements();
                renderComplementsGrid();
                updateComplementStats();
            } finally {
                hideLoader();
            }
        }

        function getBackupComplements() {
            return [
                { id: 1, name: 'Achiote', description: 'Achiote fresco', price: 225, stock: 50, img: 'https://comedera.com/wp-content/uploads/sites/9/2021/03/shutterstock_375764773-achiote.jpg', estado: 'active', popular: true },
                { id: 2, name: 'Limón', description: 'Limón criollo', price: 150, stock: 30, img: 'https://walmartcr.vtexassets.com/arquivos/ids/880950/20161_01.jpg?v=638762858471870000', estado: 'active', popular: true },
                { id: 3, name: 'Granadilla', description: 'Granadilla dulce', price: 200, stock: 15, img: 'https://i.redd.it/xrrdynxghpv81.jpg', estado: 'active', popular: false },
                { id: 4, name: 'Apio', description: 'Apio fresco', price: 200, stock: 5, img: 'https://agrosemval.com/wp-content/uploads/2020/05/apio-ventura-ipc-01.jpg', estado: 'active', popular: false },
                { id: 5, name: 'Banano', description: 'Banano maduro', price: 75, stock: 10, img: 'https://agrotendencia.tv/wp-content/uploads/2018/12/AgenciaUN_0909_1_40-1080x675.jpg', estado: 'active', popular: false }
            ];
        }

        // Categorías
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
            `}).join('');
            
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
            `}).join('');
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
            
            renderProducts(categoryName);
            document.getElementById('sectionTitle').textContent = categoryName;
            document.getElementById('categoriasSection').style.display = 'none';
            document.getElementById('productosSection').style.display = 'block';
            document.getElementById('fabCategorias').style.display = 'block';
        }

        function switchSection(section) {
            document.getElementById('categoriasSection').style.display = 'none';
            document.getElementById('productosSection').style.display = 'none';
            document.getElementById('estadisticasSection').style.display = 'none';
            document.getElementById('configuracionSection').style.display = 'none';
            document.getElementById(section + 'Section').style.display = 'block';
            
            const titles = {
                'categorias': 'Gestionar Categorías',
                'estadisticas': 'Estadísticas',
                'configuracion': 'Configuración'
            };
            document.getElementById('sectionTitle').textContent = titles[section] || 'Dashboard';
            document.getElementById('fabCategorias').style.display = section === 'categorias' ? 'none' : 'block';
            
            if (section === 'estadisticas') {
                updateDashboardStats();
                updateStockTable();
            }
        }

        // Productos
        function renderProducts(category = null) {
            const section = document.getElementById('productosSection');
            if (!section) return;
            
            let filteredProducts = products;
            if (category && category !== 'all') {
                const categoryNorm = normalizeText(category);
                filteredProducts = products.filter(p => {
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
                        <p>No hay productos</p>
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
                        <div class="product-card ${p.estado === 'inactive' ? 'product-inactive' : ''}">
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
                    `}).join('')}
                </div>
            `;
        }

        function getStockClass(stock) {
            if (stock === 0) return 'stock-critico';
            if (stock < minStockAlert) return 'stock-bajo';
            return 'stock-normal';
        }

        function openAddProductModal(category = '') {
            document.getElementById('modalTitle').textContent = 'Nuevo Producto';
            document.getElementById('itemId').value = '';
            document.getElementById('itemName').value = '';
            document.getElementById('itemDescription').value = '';
            document.getElementById('itemPrice').value = '';
            document.getElementById('itemStock').value = '';
            document.getElementById('itemWeight').value = '';
            
            const select = document.getElementById('categoria');
            if (category && select) {
                Array.from(select.options).forEach(o => {
                    if (normalizeText(o.value) === normalizeText(category)) o.selected = true;
                });
            }
            
            resetItemForm();
            document.getElementById('editModal').style.display = 'flex';
        }

        function openEditProductModal(id) {
            const p = products.find(p => p.id == id);
            if (!p) return;
            
            document.getElementById('modalTitle').textContent = 'Editar Producto';
            document.getElementById('itemId').value = p.id;
            document.getElementById('itemName').value = p.name || '';
            document.getElementById('itemDescription').value = p.description || '';
            document.getElementById('itemPrice').value = p.price || '';
            document.getElementById('itemStock').value = p.stock || '';
            document.getElementById('itemWeight').value = p.weight || '';
            
            const select = document.getElementById('categoria');
            if (p.category && select) {
                Array.from(select.options).forEach(o => {
                    if (normalizeText(o.value) === normalizeText(p.category)) o.selected = true;
                });
            }
            
            const estrella = document.getElementById('estrellaSimple');
            const texto = document.getElementById('destacadoText');
            const input = document.getElementById('itemDestacado');
            
            if (p.featured) {
                estrella.classList.add('active');
                estrella.innerHTML = '<i class="fas fa-star"></i>';
                texto.textContent = 'Destacado';
                input.value = '1';
            } else {
                estrella.classList.remove('active');
                estrella.innerHTML = '<i class="far fa-star"></i>';
                texto.textContent = 'No destacado';
                input.value = '0';
            }
            
            setItemStatus(p.estado || 'active');
            
            if (p.img && p.img !== URL_IMG_DEFAULT) {
                document.getElementById('imagePreview').innerHTML = `<img src="${p.img}">`;
            }
            
            document.getElementById('editModal').style.display = 'flex';
        }

        function resetItemForm() {
            const estrella = document.getElementById('estrellaSimple');
            estrella.classList.remove('active');
            estrella.innerHTML = '<i class="far fa-star"></i>';
            document.getElementById('destacadoText').textContent = 'No destacado';
            document.getElementById('itemDestacado').value = '0';
            setItemStatus('active');
            document.getElementById('imagePreview').innerHTML = '';
            document.getElementById('imageFileName').textContent = '';
        }

        function setItemStatus(status) {
            document.getElementById('itemStatus').value = status;
            document.querySelectorAll('#itemForm .status-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.status === status);
            });
        }

        function toggleDestacado() {
            const btn = document.getElementById('estrellaSimple');
            const input = document.getElementById('itemDestacado');
            const text = document.getElementById('destacadoText');
            
            if (input.value === '1') {
                input.value = '0';
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-star"></i>';
                text.textContent = 'No destacado';
            } else {
                input.value = '1';
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-star"></i>';
                text.textContent = 'Destacado';
            }
        }

        async function saveProduct(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('id', document.getElementById('itemId').value);
            formData.append('nombre', document.getElementById('itemName').value);
            formData.append('descripcion', document.getElementById('itemDescription').value);
            formData.append('categoria', document.getElementById('categoria').value);
            formData.append('precio', document.getElementById('itemPrice').value);
            formData.append('stock', document.getElementById('itemStock').value);
            formData.append('peso', document.getElementById('itemWeight').value);
            formData.append('estado', document.getElementById('itemStatus').value === 'active' ? '1' : '0');
            formData.append('destacado', document.getElementById('itemDestacado').value);
            
            const file = document.getElementById('itemImageFile').files[0];
            if (file) formData.append('image', file);
            
            try {
                showLoader();
                const url = formData.get('id') ? '/producto/updateProductos' : '/producto/createItem';
                const res = await fetch(url, { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Error');
                await loadProducts();
                closeItemModal();
                showInfoModal('Éxito', 'Producto guardado', 'success');
            } catch (error) {
                showInfoModal('Error', 'No se pudo guardar', 'error');
            } finally {
                hideLoader();
            }
        }

        function closeItemModal() {
            document.getElementById('editModal').style.display = 'none';
        }

        // Complementos
        function openComplementosModal() {
            renderComplementsGrid();
            updateComplementStats();
            document.getElementById('complementosModal').style.display = 'flex';
        }

        function closeComplementosModal() {
            document.getElementById('complementosModal').style.display = 'none';
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
                        <div class="complement-price">${c.price?.toLocaleString() || 0}</div>
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
            `}).join('');
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
            document.getElementById('complementModalTitle').textContent = 'Nuevo Complemento';
            document.getElementById('complementId').value = '';
            document.getElementById('complementName').value = '';
            document.getElementById('complementDescription').value = '';
            document.getElementById('complementPrice').value = '';
            document.getElementById('complementStock').value = '';
            
            setComplementStatus('active');
            
            const btn = document.getElementById('complementPopular');
            btn.classList.remove('active');
            btn.innerHTML = '<i class="far fa-star"></i>';
            document.getElementById('complementPopularText').textContent = 'Normal';
            document.getElementById('complementIsPopular').value = '0';
            
            document.getElementById('complementImagePreview').innerHTML = '';
            document.getElementById('complementImageFileName').textContent = '';
            
            closeComplementosModal();
            document.getElementById('complementModal').style.display = 'flex';
        }

        function openEditComplementModal(id) {
            const c = complements.find(c => c.id == id);
            if (!c) return;
            
            document.getElementById('complementModalTitle').textContent = 'Editar Complemento';
            document.getElementById('complementId').value = c.id;
            document.getElementById('complementName').value = c.name || '';
            document.getElementById('complementDescription').value = c.description || '';
            document.getElementById('complementPrice').value = c.price || '';
            document.getElementById('complementStock').value = c.stock || '';
            
            setComplementStatus(c.estado || 'active');
            
            const btn = document.getElementById('complementPopular');
            const text = document.getElementById('complementPopularText');
            const input = document.getElementById('complementIsPopular');
            
            if (c.popular) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-star"></i>';
                text.textContent = 'Popular';
                input.value = '1';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-star"></i>';
                text.textContent = 'Normal';
                input.value = '0';
            }
            
            if (c.img && c.img !== URL_IMG_DEFAULT) {
                document.getElementById('complementImagePreview').innerHTML = `<img src="${c.img}">`;
            }
            
            closeComplementosModal();
            document.getElementById('complementModal').style.display = 'flex';
        }

        function setComplementStatus(status) {
            document.getElementById('complementStatus').value = status;
            document.querySelectorAll('#complementForm .status-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.status === status);
            });
        }

        function toggleComplementPopular() {
            const btn = document.getElementById('complementPopular');
            const input = document.getElementById('complementIsPopular');
            const text = document.getElementById('complementPopularText');
            
            if (input.value === '1') {
                input.value = '0';
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-star"></i>';
                text.textContent = 'Normal';
            } else {
                input.value = '1';
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-star"></i>';
                text.textContent = 'Popular';
            }
        }

        async function saveComplement(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('id', document.getElementById('complementId').value);
            formData.append('nombre', document.getElementById('complementName').value);
            formData.append('descripcion', document.getElementById('complementDescription').value);
            formData.append('precio', document.getElementById('complementPrice').value);
            formData.append('stock', document.getElementById('complementStock').value);
            formData.append('estado', document.getElementById('complementStatus').value === 'active' ? '1' : '0');
            formData.append('popular', document.getElementById('complementIsPopular').value);
            
            const file = document.getElementById('complementImageFile').files[0];
            if (file) formData.append('image', file);
            
            try {
                showLoader();
                const url = formData.get('id') ? '/producto/updateComplement' : '/producto/createComplement';
                const res = await fetch(url, { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Error');
                await loadComplements();
                closeComplementItemModal();
                openComplementosModal();
                showInfoModal('Éxito', 'Complemento guardado', 'success');
            } catch (error) {
                showInfoModal('Error', 'No se pudo guardar', 'error');
            } finally {
                hideLoader();
            }
        }

        function closeComplementItemModal() {
            document.getElementById('complementModal').style.display = 'none';
        }

        // Stock
        function openStockModal(id, name, stock) {
            document.getElementById('stockProductId').value = id;
            document.getElementById('stockProductName').textContent = name;
            document.getElementById('newStock').value = stock || 0;
            document.getElementById('addToCurrent').checked = false;
            document.getElementById('stockModal').style.display = 'flex';
        }

        function closeStockModal() {
            document.getElementById('stockModal').style.display = 'none';
        }

        async function updateStock(e) {
            e.preventDefault();
            
            const id = document.getElementById('stockProductId').value;
            const stock = parseInt(document.getElementById('newStock').value);
            const add = document.getElementById('addToCurrent').checked;
            
            try {
                showLoader();
                const res = await fetch('/producto/updateStock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, stock, addToCurrent: add })
                });
                if (!res.ok) throw new Error('Error');
                await loadProducts();
                await loadComplements();
                closeStockModal();
                showInfoModal('Éxito', 'Stock actualizado', 'success');
            } catch (error) {
                showInfoModal('Error', 'No se pudo actualizar', 'error');
            } finally {
                hideLoader();
            }
        }

        // Eliminar
        function openDeleteModal(tipo, id, nombre) {
            document.getElementById('deleteModalTitle').textContent = `¿Eliminar ${nombre}?`;
            document.getElementById('deleteModalMessage').textContent = `Este ${tipo} desaparecerá.`;
            document.getElementById('confirmDeleteBtn').onclick = () => deleteItem(tipo, id);
            document.getElementById('deleteModal').style.display = 'flex';
        }

        async function deleteItem(tipo, id) {
            try {
                showLoader();
                const url = tipo === 'producto' ? `/producto/delete/${id}` : `/producto/deleteComplement/${id}`;
                const res = await fetch(url, { method: 'DELETE' });
                if (!res.ok) throw new Error('Error');
                
                if (tipo === 'producto') await loadProducts();
                else await loadComplements();
                
                closeDeleteModal();
                showInfoModal('Éxito', `${tipo} eliminado`, 'success');
            } catch (error) {
                showInfoModal('Error', `No se pudo eliminar`, 'error');
            } finally {
                hideLoader();
            }
        }

        function closeDeleteModal() {
            document.getElementById('deleteModal').style.display = 'none';
        }

        // Categorías
        function openAddCategoriaModal() {
            document.getElementById('categoriaModalTitle').textContent = 'Nueva Categoría';
            document.getElementById('categoriaId').value = '';
            document.getElementById('categoriaNombre').value = '';
            document.getElementById('categoriaModal').style.display = 'flex';
        }

        function closeCategoriaModal() {
            document.getElementById('categoriaModal').style.display = 'none';
        }

        function saveCategoria(e) {
            e.preventDefault();
            const nombre = document.getElementById('categoriaNombre').value;
            const icono = document.getElementById('categoriaIcono').value;
            
            if (!nombre) {
                showInfoModal('Error', 'Nombre requerido', 'error');
                return;
            }
            
            categories.push({
                id: nombre.toLowerCase().replace(/\s+/g, ''),
                nombre: nombre,
                icono: icono
            });
            
            renderCategoriesSidebar();
            renderCategoriesGrid();
            populateCategorySelect();
            closeCategoriaModal();
            showInfoModal('Éxito', 'Categoría creada', 'success');
        }

        // Estadísticas
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
            
            const items = [
                ...products.map(p => ({...p, nombre: p.name, categoria: p.category})),
                ...complements.map(c => ({...c, nombre: c.name, categoria: 'Complemento'}))
            ].sort((a, b) => (a.stock || 0) - (b.stock || 0));
            
            tbody.innerHTML = items.map(item => {
                const name = item.nombre.replace(/'/g, "\\'");
                return `
                <tr>
                    <td>${item.nombre}</td>
                    <td>${item.categoria}</td>
                    <td>${item.stock || 0}</td>
                    <td>
                        <span class="stock-badge ${getStockBadgeClass(item.stock)}">
                            ${item.stock === 0 ? 'Agotado' : item.stock < minStockAlert ? 'Bajo' : 'Normal'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-stock" onclick='openStockModal(${item.id}, "${name}", ${item.stock})'>
                            <i class="fas fa-edit"></i> Actualizar
                        </button>
                    </td>
                </tr>
            `}).join('');
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
            const val = document.getElementById('minStockAlert').value;
            if (val) {
                minStockAlert = parseInt(val);
                checkLowStock();
                updateStockTable();
                showInfoModal('Éxito', 'Configuración guardada', 'success');
            }
        }

        // Utilidades
        function showLoader() {
            document.getElementById('loader').style.display = 'flex';
        }

        function hideLoader() {
            document.getElementById('loader').style.display = 'none';
        }

        function showInfoModal(title, msg, type = 'success') {
            document.getElementById('infoModalTitle').textContent = title;
            document.getElementById('infoModalMessage').textContent = msg;
            document.getElementById('infoModalIcon').innerHTML = type === 'success' 
                ? '<i class="fas fa-check-circle" style="color: #28a745;"></i>'
                : '<i class="fas fa-exclamation-circle" style="color: #dc3545;"></i>';
            document.getElementById('infoModal').style.display = 'flex';
        }

        function closeInfoModal() {
            document.getElementById('infoModal').style.display = 'none';
        }

        function closeAllModals() {
            document.querySelectorAll('.modal, .modal-overlay').forEach(m => m.style.display = 'none');
        }

        function previewImage(input, previewId, fileId) {
            const preview = document.getElementById(previewId);
            const fileName = document.getElementById(fileId);
            
            if (input.files?.[0]) {
                const reader = new FileReader();
                reader.onload = e => preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 120px;">`;
                reader.readAsDataURL(input.files[0]);
                fileName.textContent = input.files[0].name;
            }
        }

        async function logout() {
            try {
                const res = await fetch(URL_LOG);
                if (res.ok) window.location.href = '/login';
            } catch (error) {
                console.error('Error:', error);
            }
        }
 
