/* ========================================
   WEYZ E-COMMERCE - SHARED JAVASCRIPT
   ======================================== */

// --- PRODUCT DATA ---
const PRODUCTS = {
    p1: {
        name: "Ultra Mohair Beige",
        price: 84.95,
        sizes: ['S', 'M', 'L'],
        stock: { S: 5, M: 12, L: 2, XL: 0 },
        image: "https://weyzclothing.com/cdn/shop/files/beige-ultra-mohair-knit-weyz-01.jpg?v=1765374015"
    },
    p2: {
        name: "UNBROKEN Pull Pink",
        price: 84.95,
        sizes: ['S', 'M', 'L', 'XL'],
        stock: { S: 10, M: 8, L: 15, XL: 4 },
        image: "images/unbroken-pink-knit.png"
    }
};

// --- STATE ---
let cart = [];
let state = {
    currentSelection: null,
    isCartOpen: false,
    bundleSize1: null,
    bundleSize2: null
};

// --- CART FUNCTIONS ---
// Stripe Checkout - Configuration avec Price IDs réels
const STRIPE_PRODUCTS = {
    p1: {
        name: "ULTRA Pull Mohair Beige",
        price: 8495, // en centimes
        priceId: "price_1Sq7AwRxBBzO6509ZQh8uVzi",
        image: "https://weyzclothing.com/cdn/shop/files/beige-ultra-mohair-knit-weyz-01.jpg?v=1765374015"
    },
    p2: {
        name: "UNBROKEN Pull Pink",
        price: 8495, // en centimes
        priceId: "price_1Sq7BQRxBBzO6509zJgSZzc9",
        image: "images/unbroken-pink-knit.png"
    },
    bundle: {
        name: "UNBROKEN Pull Pink + ULTRA Pull Mohair Beige",
        price: 11995, // en centimes
        priceId: "price_1Sq7CARxBBzO6509gyFDch9T",
        image: "https://weyzclothing.com/cdn/shop/files/beige-ultra-mohair-knit-weyz-01.jpg?v=1765374015"
    }
};

function addToCart(pid, size) {
    // Si pas de params, récupérer depuis la page produit
    if (!pid) {
        pid = 'p1';
        const selectedSize = document.querySelector('input[name="size"]:checked');
        size = selectedSize ? selectedSize.value : 'M';
    }

    const product = PRODUCTS[pid];
    if (!product) return;

    cart.push({
        ...product,
        selectedSize: size,
        cartId: Date.now(),
        pid: pid
    });
    updateCartUI();
    showToast(`Ajouté : ${product.name} (${size})`);

    // Ouvrir panier
    setTimeout(() => {
        if (!state.isCartOpen) {
            toggleCart();
        }
    }, 300);

    if (state.currentSelection) {
        closeBottomSheet();
    }
}

// Redirection vers Stripe Checkout
async function goToCheckout() {
    if (cart.length === 0) {
        showToast("Ton panier est vide !");
        return;
    }

    // Rediriger vers la page checkout
    window.location.href = 'checkout.html';
}

function addToCartFromSticky() {
    const stickySelect = document.getElementById('sticky-size');
    if (stickySelect) {
        const size = stickySelect.value;
        addToCart('p1', size);
    }
}

function removeFromCart(cartId) {
    cart = cart.filter(i => i.cartId !== cartId);
    updateCartUI();
}

function updateCartUI() {
    // Save cart to localStorage for checkout page
    localStorage.setItem('weyz_cart', JSON.stringify(cart));

    // Update count badges
    const countElements = document.querySelectorAll('#cart-count, .cart-count-product');
    countElements.forEach(el => {
        if (el) el.innerText = cart.length;
    });

    // Update cart items
    const container = document.getElementById('cart-items');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="cart-empty">Ton panier est vide pour le moment.</p>';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-img" style="background-image: url('${item.image}'); background-size: cover;"></div>
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-size">TAILLE: ${item.selectedSize}</p>
                    <p class="cart-item-price">${item.price.toFixed(2)} €</p>
                </div>
                <button onclick="removeFromCart(${item.cartId})" class="cart-item-remove">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    // Update total
    const total = cart.reduce((acc, item) => acc + item.price, 0);
    const totalEl = document.getElementById('cart-total');
    if (totalEl) {
        totalEl.innerText = `${total.toFixed(2)} €`;
    }
}

function toggleCart() {
    state.isCartOpen = !state.isCartOpen;
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active', state.isCartOpen);
    }
}

// --- BOTTOM SHEET (Mobile) ---
function openBottomSheet(pid) {
    state.currentSelection = pid;
    const product = PRODUCTS[pid];
    if (!product) return;

    const titleEl = document.getElementById('bs-title');
    if (titleEl) titleEl.innerText = product.name;

    const sizesContainer = document.getElementById('bs-sizes');
    if (sizesContainer) {
        const allSizes = ['S', 'M', 'L', 'XL'];
        sizesContainer.innerHTML = allSizes.map(size => {
            const isAvailable = product.sizes.includes(size) && product.stock[size] > 0;
            const isLowStock = product.stock[size] > 0 && product.stock[size] < 5;
            return `
                <div class="bs-size-option">
                    <input type="radio" name="bs-size" id="size-${size}" value="${size}" 
                           class="bs-size-input" ${!isAvailable ? 'disabled' : ''}>
                    <label for="size-${size}" class="bs-size-label ${isLowStock ? 'stock-low' : ''}">
                        ${size}
                    </label>
                </div>
            `;
        }).join('');
    }

    const overlay = document.getElementById('bottom-sheet');
    if (overlay) {
        overlay.classList.add('active');
    }

    const submitBtn = document.getElementById('bs-submit');
    if (submitBtn) {
        submitBtn.onclick = () => {
            const selected = document.querySelector('input[name="bs-size"]:checked');
            if (selected) {
                addToCart(pid, selected.value);
            }
        };
    }
}

function closeBottomSheet() {
    const overlay = document.getElementById('bottom-sheet');
    if (overlay) {
        overlay.classList.remove('active');
    }
    state.currentSelection = null;
}

// --- BUNDLE MODAL ---
function openBundleModal() {
    const modal = document.getElementById('bundle-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeBundleModal() {
    const modal = document.getElementById('bundle-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    state.bundleSize1 = null;
    state.bundleSize2 = null;
}

function addBundleToCart() {
    const size1 = state.bundleSize1 || 'M';
    const size2 = state.bundleSize2 || 'L';

    // Add bundle items with discounted total
    const bundleItem1 = {
        ...PRODUCTS.p1,
        name: PRODUCTS.p1.name + " (Bundle -30%)",
        price: 59.975, // Discounted price (119.95 / 2)
        selectedSize: size1,
        cartId: Date.now(),
        pid: 'p1'
    };

    const bundleItem2 = {
        ...PRODUCTS.p2,
        name: PRODUCTS.p2.name + " (Bundle -30%)",
        price: 59.975, // Discounted price (119.95 / 2)
        selectedSize: size2,
        cartId: Date.now() + 1,
        pid: 'p2'
    };

    cart.push(bundleItem1, bundleItem2);
    updateCartUI();
    showToast("✅ Pack Bundle ajouté - 119,95€ !");
    closeBundleModal();

    setTimeout(() => {
        toggleCart();
    }, 500);
}

// --- TOAST NOTIFICATIONS ---
function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = "toast";
    toast.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        ${msg}
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        toast.style.transition = "all 0.4s ease";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// --- SOCIAL PROOF ---
function initSocialProof() {
    const names = ["Lucas P. (Paris)", "Sarah M. (Lyon)", "Thomas R. (Marseille)", "Kevin D. (Lille)", "Amine B. (Bordeaux)"];
    setInterval(() => {
        if (Math.random() > 0.7) {
            const name = names[Math.floor(Math.random() * names.length)];
            showToast(`${name} vient de valider son Pack Combo`);
        }
    }, 15000);
}

// --- PRODUCT PAGE SPECIFIC ---
function initProductPage() {
    // Carousel
    const mediaList = document.getElementById('main-media-list');
    const dots = document.querySelectorAll('#carousel-dots .dot');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (mediaList) {
        const updateDots = () => {
            const scrollIndex = Math.round(mediaList.scrollLeft / mediaList.clientWidth);
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === scrollIndex);
            });
        };

        mediaList.addEventListener('scroll', updateDots);

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                mediaList.scrollBy({ left: -mediaList.clientWidth, behavior: 'smooth' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                mediaList.scrollBy({ left: mediaList.clientWidth, behavior: 'smooth' });
            });
        }
    }

    // Sticky Buy Bar
    const stickyBar = document.getElementById('sticky-buy-bar');
    const mainAtcBtn = document.getElementById('main-atc-btn');

    if (stickyBar && mainAtcBtn) {
        window.addEventListener('scroll', () => {
            const atcPosition = mainAtcBtn.getBoundingClientRect().bottom;
            stickyBar.classList.toggle('visible', atcPosition < 0);
        });
    }

    // Main Add to Cart button - handled by onclick attribute in HTML
    // (No duplicate listener needed here)

    // Size Calculator Modal
    const openCalcBtn = document.getElementById('open-size-calculator');
    const closeCalcBtn = document.getElementById('close-size-calculator');
    const calcModal = document.getElementById('size-modal');
    const runCalcBtn = document.getElementById('run-calculation');
    const resultZone = document.getElementById('size-result');
    const resultSpan = document.getElementById('recommended-size');

    if (openCalcBtn && calcModal) {
        openCalcBtn.addEventListener('click', () => {
            calcModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeCalcBtn && calcModal) {
        closeCalcBtn.addEventListener('click', () => {
            calcModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            if (resultZone) resultZone.classList.remove('active');
        });
    }

    if (calcModal) {
        calcModal.addEventListener('click', (e) => {
            if (e.target === calcModal && closeCalcBtn) {
                closeCalcBtn.click();
            }
        });
    }

    if (runCalcBtn && resultZone && resultSpan) {
        runCalcBtn.addEventListener('click', () => {
            const h = parseInt(document.getElementById('input-height')?.value);
            const w = parseInt(document.getElementById('input-weight')?.value);
            if (h && w) {
                let size = "M";
                if (h > 185 || w > 85) size = "XL";
                else if (h > 178 || w > 75) size = "L";
                else if (h < 170 || w < 60) size = "S";
                resultSpan.innerText = size;
                resultZone.classList.add('active');
            }
        });
    }

    // Bundle Card (Product Page)
    const bundleCard = document.getElementById('open-bundle-modal');
    if (bundleCard) {
        bundleCard.addEventListener('click', openBundleModal);
    }
}

// --- BUNDLE SIZE SELECTION ---
function initBundleSizes() {
    document.querySelectorAll('#bundle-size-1 .bundle-size-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.parentElement.querySelectorAll('.bundle-size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.bundleSize1 = this.dataset.size;
        });
    });

    document.querySelectorAll('#bundle-size-2 .bundle-size-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.parentElement.querySelectorAll('.bundle-size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.bundleSize2 = this.dataset.size;
        });
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function () {
    // Init bundle size buttons
    initBundleSizes();

    // Init social proof on homepage
    if (document.querySelector('.split-container')) {
        initSocialProof();
    }

    // Init product page features
    if (document.querySelector('.product-container')) {
        initProductPage();
    }

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBundleModal();
            closeBottomSheet();
            toggleCart();
        }
    });
});
