// ============================================================
// STORE — lógica da loja, carrinho e checkout
// ============================================================

let cart = [];
let activeCategory = 'todos';

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  bindFilters();
  bindCart();
  bindHeader();
});

// ── Header scroll effect ─────────────────────────────────────
function bindHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ── Filters ──────────────────────────────────────────────────
function bindFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      renderProducts();
    });
  });

  document.querySelectorAll('.nav a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const cat = a.dataset.cat;
      if (cat) {
        activeCategory = cat;
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === cat);
        });
        renderProducts();
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ── Products ─────────────────────────────────────────────────
async function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<p class="empty-state">A carregar...</p>';
  let products = await DB.getProducts();

  if (activeCategory !== 'todos') {
    products = products.filter(p => p.category === activeCategory);
  }

  if (!products.length) {
    grid.innerHTML = '<p class="empty-state">Nenhum artigo encontrado.</p>';
    return;
  }

  grid.innerHTML = products.map(p => productCard(p)).join('');

  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (!e.target.closest('.btn-add')) openProductModal(card.dataset.id);
    });
    card.querySelector('.btn-add').addEventListener('click', e => {
      e.stopPropagation();
      quickAdd(card.dataset.id);
    });
  });
}

function productCard(p) {
  const discount = p.originalPrice
    ? Math.round((1 - p.price / p.originalPrice) * 100)
    : null;

  // Se o produto tiver imagem usa-a; caso contrário usa o gradiente
  const imgArea = p.image
    ? `<img src="${p.image}" alt="${p.name}" class="product-img-photo" loading="lazy" onerror="imgFallback(this)">`
    : `<div class="product-img-label">${p.subtitle}</div>`;

  return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-img" style="background:${p.bg}">
        ${p.isNew ? '<span class="badge badge-new">Novo</span>' : ''}
        ${discount ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
        ${imgArea}
      </div>
      <div class="product-info">
        <div class="product-meta">
          <span class="product-cat">${catLabel(p.category)}</span>
        </div>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price">
          <span class="price-current">${fmt(p.price)}</span>
          ${p.originalPrice ? `<span class="price-original">${fmt(p.originalPrice)}</span>` : ''}
        </div>
        <button class="btn-add">Adicionar ao Carrinho</button>
      </div>
    </article>`;
}

function catLabel(cat) {
  const map = { corrida: 'Corrida', treino: 'Treino', futebol: 'Futebol', estilo: 'Estilo' };
  return map[cat] || cat;
}

function fmt(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

// ── Product Modal ─────────────────────────────────────────────
async function openProductModal(id) {
  const p = await DB.getProduct(id);
  if (!p) return;

  const discount = p.originalPrice
    ? Math.round((1 - p.price / p.originalPrice) * 100)
    : null;

  document.getElementById('productModal').innerHTML = `
    <button class="modal-close" onclick="closeProductModal()">✕</button>
    <div class="pm-img" style="background:${p.bg}">
      ${p.isNew ? '<span class="badge badge-new">Novo</span>' : ''}
      ${discount ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
      ${p.image ? `<img src="${p.image}" alt="${p.name}" class="pm-img-photo" onerror="imgFallback(this)">` : ''}
    </div>
    <div class="pm-info">
      <span class="product-cat">${catLabel(p.category)}</span>
      <h2>${p.name}</h2>
      <p class="pm-subtitle">${p.subtitle}</p>
      <div class="product-price" style="margin:1rem 0">
        <span class="price-current">${fmt(p.price)}</span>
        ${p.originalPrice ? `<span class="price-original">${fmt(p.originalPrice)}</span>` : ''}
      </div>
      <p class="pm-desc">${p.description}</p>
      <div class="pm-sizes">
        <p class="sizes-label">Selecciona o tamanho</p>
        <div class="sizes-grid">
          ${p.sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join('')}
        </div>
      </div>
      <button class="btn-primary btn-full" id="pmAddBtn" onclick="addFromModal('${p.id}')">
        Adicionar ao Carrinho
      </button>
    </div>`;

  document.getElementById('productModal').querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('productOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('productOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('productOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeProductModal();
});

async function addFromModal(id) {
  const size = document.querySelector('.size-btn.active')?.dataset.size;
  if (!size) {
    document.querySelector('.sizes-label').textContent = 'Por favor selecciona um tamanho';
    document.querySelector('.sizes-label').style.color = '#e5111b';
    return;
  }
  await quickAdd(id, size);
  closeProductModal();
}

// ── Cart ──────────────────────────────────────────────────────
function bindCart() {
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
}

async function quickAdd(id, size = null) {
  const p = await DB.getProduct(id);
  if (!p) return;

  const key = id + (size || '');
  const existing = cart.find(i => i.key === key);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ key, id, name: p.name, subtitle: p.subtitle, price: p.price, size, qty: 1 });
  }

  updateCartUI();
  flashCartBtn();
  openCart();
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartCount').style.display = count ? 'flex' : 'none';
  document.getElementById('cartTotal').textContent = fmt(total);

  const itemsEl = document.getElementById('cartItems');

  if (!cart.length) {
    itemsEl.innerHTML = `<div class="cart-empty">
      <p>O teu carrinho está vazio.</p>
      <button class="btn-secondary" onclick="closeCart()">Continuar a Comprar</button>
    </div>`;
    document.getElementById('checkoutBtn').disabled = true;
    return;
  }

  document.getElementById('checkoutBtn').disabled = false;

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <div class="ci-info">
        <p class="ci-name">${item.name}</p>
        <p class="ci-sub">${item.subtitle}${item.size ? ' · ' + item.size : ''}</p>
        <p class="ci-price">${fmt(item.price)}</p>
      </div>
      <div class="ci-controls">
        <button class="qty-btn" data-action="dec" data-key="${item.key}">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-key="${item.key}">+</button>
        <button class="qty-btn remove-btn" data-action="remove" data-key="${item.key}">✕</button>
      </div>
    </div>`).join('');

  itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const action = btn.dataset.action;
      const item = cart.find(i => i.key === key);
      if (!item) return;

      if (action === 'inc') item.qty++;
      if (action === 'dec') { item.qty--; if (item.qty <= 0) cart = cart.filter(i => i.key !== key); }
      if (action === 'remove') cart = cart.filter(i => i.key !== key);

      updateCartUI();
    });
  });
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateCartUI();
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function flashCartBtn() {
  const btn = document.getElementById('cartBtn');
  btn.classList.add('pulse');
  setTimeout(() => btn.classList.remove('pulse'), 600);
}

// ── Checkout ─────────────────────────────────────────────────
function openCheckout() {
  if (!cart.length) return;
  closeCart();

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = total >= 80 ? 0 : 4.99;

  document.getElementById('checkoutModal').innerHTML = `
    <button class="modal-close" onclick="closeCheckout()">✕</button>
    <div class="checkout-inner">
      <div class="checkout-form-col">
        <h2>Finalizar Compra</h2>

        <div class="form-section">
          <h3>Informações de Envio</h3>
          <div class="form-row">
            <div class="field">
              <label>Nome Completo</label>
              <input type="text" id="fName" placeholder="Adriano Silva" autocomplete="name">
            </div>
            <div class="field">
              <label>Email</label>
              <input type="email" id="fEmail" placeholder="adriano@email.pt" autocomplete="email">
            </div>
          </div>
          <div class="field">
            <label>Morada</label>
            <input type="text" id="fAddress" placeholder="Rua das Flores, 123" autocomplete="street-address">
          </div>
          <div class="form-row">
            <div class="field">
              <label>Código Postal</label>
              <input type="text" id="fZip" placeholder="1000-001" maxlength="8" autocomplete="postal-code">
            </div>
            <div class="field">
              <label>Cidade</label>
              <input type="text" id="fCity" placeholder="Lisboa" autocomplete="address-level2">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Pagamento</h3>
          <button class="btn-gpay" id="gpayBtn" onclick="processPayment()">
            <svg width="41" height="17" viewBox="0 0 41 17" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.62-1.488-.62h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.665-1.559.996-2.583.996h-2.485zm7.668 1.ST59c0 .47.112.843.336 1.117.237.274.56.41.971.41.476 0 .863-.175 1.16-.524.311-.349.468-.804.468-1.363v-.588l-1.464.048c-.913.029-1.471.412-1.471 1.1v-.2zm4.394 2.458h-1.411l-.083-.94c-.43.728-1.086 1.092-1.97 1.092-.727 0-1.313-.232-1.757-.696-.444-.476-.666-1.083-.666-1.82 0-.808.294-1.434.882-1.879.6-.456 1.393-.693 2.376-.708l1.465-.048v-.436c0-.76-.42-1.14-1.259-1.14-.736 0-1.13.282-1.18.845H28.38c.05-.713.352-1.283.906-1.71.554-.427 1.259-.64 2.116-.64.905 0 1.617.226 2.135.677.519.452.778 1.06.778 1.822v3.58zm3.88-8.563l-3.308 8.563h-1.536l1.044-2.617-2.232-5.946h1.596l1.38 3.942 1.42-3.942h1.636z" fill="#fff"/>
              <path d="M13.16 8.506c0-.41-.035-.82-.105-1.224H7.23v2.317h3.326c-.139.773-.576 1.466-1.228 1.913v1.574h1.984c1.16-1.07 1.83-2.645 1.83-4.58z" fill="#4285F4"/>
              <path d="M7.23 13.612c1.667 0 3.067-.549 4.089-1.526l-1.984-1.574c-.549.371-1.253.59-2.105.59-1.612 0-2.98-1.088-3.468-2.552H1.712v1.625A6.177 6.177 0 007.23 13.612z" fill="#34A853"/>
              <path d="M3.762 8.55c-.124-.371-.196-.765-.196-1.172 0-.407.072-.8.196-1.172V4.581H1.712A6.177 6.177 0 00.77 7.378c0 .998.24 1.944.663 2.797L3.762 8.55z" fill="#FBBC04"/>
              <path d="M7.23 4.826c.908 0 1.723.313 2.364.926l1.764-1.764C10.293 2.99 8.897 2.39 7.23 2.39a6.177 6.177 0 00-5.518 3.42l2.05 1.593C4.25 5.914 5.618 4.826 7.23 4.826z" fill="#EA4335"/>
            </svg>
            <span>Pagar com Google Pay</span>
          </button>
          <p class="payment-note">Pagamento seguro e encriptado</p>
        </div>
      </div>

      <div class="checkout-summary-col">
        <h3>Resumo da Encomenda</h3>
        <div class="order-items">
          ${cart.map(i => `
            <div class="order-item">
              <span>${i.name}${i.size ? ' (${i.size})' : ''} × ${i.qty}</span>
              <span>${fmt(i.price * i.qty)}</span>
            </div>`).join('')}
        </div>
        <div class="order-divider"></div>
        <div class="order-line">
          <span>Subtotal</span><span>${fmt(total)}</span>
        </div>
        <div class="order-line">
          <span>Envio</span>
          <span>${shipping === 0 ? '<span class="free-tag">Grátis</span>' : fmt(shipping)}</span>
        </div>
        ${shipping > 0 ? `<p class="free-shipping-note">Encomendas acima de 80,00 € têm envio grátis.</p>` : ''}
        <div class="order-divider"></div>
        <div class="order-line order-total-line">
          <span>Total</span><span>${fmt(total + shipping)}</span>
        </div>
      </div>
    </div>`;

  document.getElementById('checkoutOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('checkoutOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeCheckout();
});

function processPayment() {
  const name = document.getElementById('fName').value.trim();
  const email = document.getElementById('fEmail').value.trim();
  const address = document.getElementById('fAddress').value.trim();
  const zip = document.getElementById('fZip').value.trim();
  const city = document.getElementById('fCity').value.trim();

  if (!name || !email || !address || !zip || !city) {
    alert('Por favor preenche todos os campos de envio.');
    return;
  }

  const btn = document.getElementById('gpayBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span><span>A processar...</span>';

  setTimeout(async () => {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = total >= 80 ? 0 : 4.99;

    try {
      const order = await DB.saveOrder({ items: [...cart], total: total + shipping, customer: { name, email, address, zip, city } });

      cart = [];
      updateCartUI();

      document.getElementById('checkoutModal').innerHTML = `
        <div class="success-screen">
          <div class="success-icon">✓</div>
          <h2>Encomenda Confirmada!</h2>
          <p>Obrigado, <strong>${name}</strong>.</p>
          <p class="order-ref">Referência: <strong>${order.id}</strong></p>
          <p class="success-sub">Receberás um email de confirmação em <strong>${email}</strong>.</p>
          <button class="btn-primary" onclick="closeCheckout(); renderProducts()">Continuar a Comprar</button>
        </div>`;
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.innerHTML = '<span>Pagar com Google Pay</span>';
      alert('Não foi possível concluir a encomenda. Tenta novamente.');
    }
  }, 2200);
}

// ── Utilities ─────────────────────────────────────────────────
function scrollToProducts() {
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// Substitui imagem quebrada pelo fallback animado
function imgFallback(img) {
  const parent = img.parentElement;
  img.remove();
  const fallback = document.createElement('div');
  fallback.className = 'img-fallback';
  fallback.innerHTML = `
    <svg class="fallback-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 34 C10 28, 16 24, 24 26 C30 28, 36 24, 42 20" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 34 L10 38 L42 28 L42 20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="14" cy="37" r="3" stroke-width="2"/>
      <circle cx="34" cy="31" r="3" stroke-width="2"/>
    </svg>`;
  parent.appendChild(fallback);
}
