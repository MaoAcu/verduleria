// Año automático
        document.getElementById('currentYear').textContent = new Date().getFullYear();

        // Productos
        let products = [
            { id: 1, name: 'Arandanos', description: 'Arandano Fresco', category: 'frutas', weight: '500g', price: 4500, stock: 15, featured: true, img: IMG_URL+'arandanos.webp' },
            { id: 2, name: 'Ciruela', description: 'Ciruela fresca', category: 'frutas', weight: '1kg', price: 3200, stock: 10, featured: true, img: IMG_URL+'ciruela.webp' },
            { id: 3, name: 'Kiwi', description: 'Kiwi', category: 'frutas', weight: '1kg', price: 2200, stock: 20, featured: true, img: IMG_URL+'kiwi.webp' },
            { id: 4, name: 'Mandarina', description: 'Mandarina Dulce', category: 'frutas', weight: '500g', price: 3800, stock: 8, featured: true, img: IMG_URL+'mandarina.webp' },
            { id: 5, name: 'Manzana', description: 'Manzana Pera', category: 'frutas', weight: '3 und', price: 5200, stock: 12, featured: true, img: IMG_URL+'arandanos.webp' },
            { id: 6, name: 'Leche Entera', description: 'Leche fresca', category: 'lacteos', weight: '1L', price: 4200, stock: 5, featured: true, img: IMG_URL+'arandanos.webp' },
            { id: 7, name: 'Queso Campesino', description: 'Queso fresco', category: 'lacteos', weight: '500g', price: 8500, stock: 7, featured: true, img: IMG_URL+'arandanos.webp' },
            { id: 8, name: 'Manzana Roja', description: 'Dulces', category: 'frutas', weight: '1kg', price: 3800, stock: 9, featured: true, img: IMG_URL+'arandanos.webp' },
            { id: 9, name: 'Pera', description: 'Jugosas', category: 'frutas', weight: '1kg', price: 4200, stock: 7, featured: false, img: IMG_URL+'arandanos.webp' },
            { id: 10, name: 'Zanahoria', description: 'Frescas', category: 'verduras', weight: '1kg', price: 1800, stock: 15, featured: false, img: IMG_URL+'arandanos.webp'},
            { id: 11, name: 'Cebolla', description: 'Cabezona', category: 'verduras', weight: '1kg', price: 2000, stock: 12, featured: false, img: IMG_URL+'arandanos.webp' },
            { id: 12, name: 'Yogurt', description: 'Natural', category: 'lacteos', weight: '500g', price: 3200, stock: 6, featured: false, img: IMG_URL+'arandanos.webp' }
        ];

        const complements = [
            { name: 'Achiote', price: 225, img: 'https://comedera.com/wp-content/uploads/sites/9/2021/03/shutterstock_375764773-achiote.jpg' },
            { name: 'Limón', price: 150, img: 'https://walmartcr.vtexassets.com/arquivos/ids/880950/20161_01.jpg?v=638762858471870000' },
            { name: 'Granadilla', price: 200, img: 'https://i.redd.it/xrrdynxghpv81.jpg' },
            { name: 'Apio', price: 200, img: 'https://agrosemval.com/wp-content/uploads/2020/05/apio-ventura-ipc-01.jpg' },
            { name: 'Banano', price: 75, img: 'https://agrotendencia.tv/wp-content/uploads/2018/12/AgenciaUN_0909_1_40-1080x675.jpg' }
        ];

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let currentProduct = null;
        let detailQty = 1;
        let currentCategory = 'all';
        let selectedService = 'local';

        // Variable para controlar si el menú está abierto
        let isMenuOpen = false;

        // Función para cerrar menú al hacer clic fuera (CORREGIDA)
        document.addEventListener('click', function(event) {
            const nav = document.getElementById('navContainer');
            const hamburger = document.getElementById('hamburgerBtn');
            
            // Solo proceder si el menú está abierto
            if (!nav.classList.contains('active')) return;
            
            // Verificar si el clic fue dentro del menú o en el botón hamburguesa
            const isClickInsideNav = nav.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);
            
            // Si el clic NO fue dentro del menú Y NO fue en el botón hamburguesa, cerrar menú
            if (!isClickInsideNav && !isClickOnHamburger) {
                closeMobileMenu();
            }
        });

        // Menú móvil - CORREGIDO: agregar event parameter y stopPropagation
        window.toggleMobileMenu = function(event) {
            if (event) {
                event.stopPropagation();
            }
            const nav = document.getElementById('navContainer');
            const hamburger = document.getElementById('hamburgerBtn');
            nav.classList.toggle('active');
            hamburger.classList.toggle('active');
        };

        window.closeMobileMenu = function() {
            const nav = document.getElementById('navContainer');
            const hamburger = document.getElementById('hamburgerBtn');
            nav.classList.remove('active');
            hamburger.classList.remove('active');
        };

        // Inicializar
        document.addEventListener('DOMContentLoaded', () => {
            renderProducts();
            updateCartCount();
            startAutoScroll();
            
            // Mostrar/ocultar carrito según dispositivo
            if (window.innerWidth <= 768) {
                document.querySelector('.mobile-only').style.display = 'flex';
                document.querySelector('.desktop-only').style.display = 'none';
            } else {
                document.querySelector('.mobile-only').style.display = 'none';
                document.querySelector('.desktop-only').style.display = 'flex';
            }
        });

        // Resto de funciones sin cambios...
        function renderProducts() {
            const grid = document.getElementById('productGrid');
            const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
            
            let filtered = products;
            if (currentCategory !== 'all') {
                filtered = filtered.filter(p => p.category === currentCategory);
            }
            if (searchTerm) {
                filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
            }
            
            grid.innerHTML = filtered.map(p => `
                <div class="product-card" onclick="openProductDetail(${p.id})">
                    <div class="product-image-container">
                        <img class="product-image" src="${p.img}" alt="${p.name}" loading="lazy">
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

        // Filtros
        window.filterByCategory = function(category, element) {
            currentCategory = category;
            document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
            element.classList.add('active');
            renderProducts();
        };

        window.filterProducts = function() {
            renderProducts();
        };

        window.quickAdd = function(id) {
            const prod = products.find(p => p.id === id);
            if (!prod) return;
            cart.push({ id: prod.id, name: prod.name, price: prod.price, weight: prod.weight, qty: 1 });
            updateCartCount();
            animateCart();
        };

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

        window.closeDetail = function() {
            document.getElementById('productDetail').classList.remove('active');
        };

        window.changeQty = function(delta) {
            detailQty = Math.max(1, detailQty + delta);
            document.getElementById('detailQty').innerText = detailQty;
        };

        window.addToCartFromDetail = function() {
            if (!currentProduct) return;
            cart.push({
                id: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                weight: currentProduct.weight,
                qty: detailQty,
                comment: document.getElementById('detailComment').value
            });
            updateCartCount();
            animateCart();
            closeDetail();
        };

        // Cart functions
        window.openCartModal = function() {
            renderCart();
            document.getElementById('cartModal').classList.add('active');
        };

        window.closeCartModal = function() {
            document.getElementById('cartModal').classList.remove('active');
        };

        function renderCart() {
            const list = document.getElementById('cartItemsList');
            let total = 0;
            list.innerHTML = '';
            cart.forEach((item, index) => {
                total += item.price * item.qty;
                list.innerHTML += `
                    <div class="cart-item">
                        <div><b>${item.qty}x</b> ${item.name}</div>
                        <div>
                            <span class="cart-item-price">₡${(item.price*item.qty).toLocaleString()}</span>
                            <span class="remove-item" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></span>
                        </div>
                    </div>
                `;
            });
            if (cart.length === 0) list.innerHTML = '<div style="text-align:center; padding:2rem;">Carrito vacío</div>';
            document.getElementById('cartTotal').innerText = '₡' + total.toLocaleString();

            const carousel = document.getElementById('complementCarousel');
            carousel.innerHTML = '';
            complements.forEach(c => {
                carousel.innerHTML += `
                    <div class="complement-card">
                        <img src="${c.img}" onerror="this.src='https://via.placeholder.com/60'">
                        <p>${c.name}</p>
                        <span style="font-size:0.7rem;">₡${c.price}</span>
                        <button class="add-complement" onclick="addComplement('${c.name}', ${c.price})">+</button>
                    </div>
                `;
            });
        }

        window.addComplement = function(name, price) {
            cart.push({ id: Date.now(), name, price, qty: 1 });
            updateCartCount();
            renderCart();
        };

        window.removeFromCart = function(index) {
            cart.splice(index, 1);
            updateCartCount();
            renderCart();
        };

        function startAutoScroll() {
            setInterval(() => {
                const track = document.getElementById('complementCarousel');
                if (track && document.getElementById('cartModal').classList.contains('active')) {
                    track.scrollBy({ left: 120, behavior: 'smooth' });
                    if (track.scrollLeft + track.clientWidth >= track.scrollWidth) {
                        track.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                }
            }, 3000);
        }

        window.scrollCarousel = function(direction) {
            const track = document.getElementById('complementCarousel');
            track.scrollBy({ left: direction * 150, behavior: 'smooth' });
        };

        window.setService = function(type, btn) {
            selectedService = type;
            document.querySelectorAll('.service-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };

        function updateCartCount() {
            const count = cart.reduce((acc, item) => acc + item.qty, 0);
            document.getElementById('cartCount').innerText = count;
            document.getElementById('cartCountMobile').innerText = count;
            localStorage.setItem('cart', JSON.stringify(cart));
        }

        function animateCart() {
            const cartIcon = document.querySelector('.cart-icon');
            cartIcon.style.transform = 'scale(1.2)';
            setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
        }

        window.sendOrder = function() {
            if (cart.length === 0) return alert('Carrito vacío');
            let message = "🍃 *Del Campo a su Casa* 🍃\n\n";
            let total = 0;
            cart.forEach(item => {
                total += item.price * item.qty;
                message += `• ${item.name} x${item.qty} - ₡${(item.price*item.qty).toLocaleString()}\n`;
            });
            message += `\n📦 Servicio: ${selectedService}\n💰 Total: ₡${total.toLocaleString()}`;
            window.open(`https://wa.me/50670134571?text=${encodeURIComponent(message)}`, '_blank');
        };

        window.navigateTo = function(section) {
   
            if (['frutas', 'verduras', 'lacteos'].includes(section)) {
                filterByCategory(section, document.querySelector(`.filter-chip[onclick*="${section}"]`));
         
                document.querySelector('.filters-section').scrollIntoView({ behavior: 'smooth' });
            } else if (section === 'inicio' || section === 'tienda') {
      
                currentCategory = 'all';
                renderProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            closeMobileMenu(); 
        };

        window.showClientView = function() {
            navigateTo('inicio');
        };