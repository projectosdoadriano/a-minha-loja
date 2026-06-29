// ============================================================
// ADMIN — operações CRUD sobre os produtos
// ============================================================

let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  renderStats();
  renderProductsTable();
  bindAdminEvents();
});

// ── Stats ─────────────────────────────────────────────────────
function renderStats() {
  const products = DB.getProducts();
  const orders = DB.getOrders();
  const revenue = orders.reduce((s, o) => s + o.total, 0);

  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statRevenue').textContent = revenue.toFixed(2).replace('.', ',') + ' €';
  document.getElementById('statStock').textContent = products.reduce((s, p) => s + (p.stock || 0), 0);
}

// ── Table ─────────────────────────────────────────────────────
function renderProductsTable() {
  const products = DB.getProducts();
  const tbody = document.getElementById('productsTable');

  tbody.innerHTML = products.map(p => {
    const discount = p.originalPrice
      ? Math.round((1 - p.price / p.originalPrice) * 100)
      : null;

    return `
      <tr>
        <td>
          ${p.image
            ? `<img src="${p.image}" alt="${p.name}" class="t-thumb-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
            : ''}
          <div class="t-thumb" style="background:${p.bg};${p.image ? 'display:none' : ''}"></div>
        </td>
        <td>
          <p class="t-name">${p.name}</p>
          <p class="t-sub">${p.subtitle}</p>
        </td>
        <td><span class="t-cat">${catLabel(p.category)}</span></td>
        <td>
          <p class="t-price">${fmt(p.price)}</p>
          ${p.originalPrice ? `<p class="t-original">${fmt(p.originalPrice)}</p>` : ''}
          ${discount ? `<span class="t-badge-sale">-${discount}%</span>` : ''}
        </td>
        <td>${p.stock}</td>
        <td>
          <div class="t-flags">
            ${p.isNew ? '<span class="t-badge-new">Novo</span>' : ''}
            ${p.featured ? '<span class="t-badge-feat">Destaque</span>' : ''}
          </div>
        </td>
        <td>
          <div class="t-actions">
            <button class="btn-edit" onclick="openEdit('${p.id}')">Editar</button>
            <button class="btn-delete" onclick="deleteProduct('${p.id}')">Eliminar</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Modal open/close ──────────────────────────────────────────
function bindAdminEvents() {
  document.getElementById('addProductBtn').addEventListener('click', () => openEdit(null));
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('productForm').addEventListener('submit', saveProduct);

  document.getElementById('btnResetDB').addEventListener('click', () => {
    if (confirm('Tens a certeza que queres repor os dados originais? Esta acção é irreversível.')) {
      DB.resetToSeed();
      renderStats();
      renderProductsTable();
    }
  });
}

function openEdit(id) {
  editingId = id;
  const modal = document.getElementById('productFormModal');
  const title = document.getElementById('modalTitle');

  if (id) {
    const p = DB.getProduct(id);
    if (!p) return;
    title.textContent = 'Editar Produto';
    document.getElementById('fName').value = p.name;
    document.getElementById('fSubtitle').value = p.subtitle;
    document.getElementById('fCategory').value = p.category;
    document.getElementById('fPrice').value = p.price;
    document.getElementById('fOriginalPrice').value = p.originalPrice || '';
    document.getElementById('fImage').value = p.image || '';
    document.getElementById('imgPreview').src = p.image || '';
    document.getElementById('imgPreview').style.display = p.image ? 'block' : 'none';
    document.getElementById('fBg').value = p.bg;
    document.getElementById('fDescription').value = p.description;
    document.getElementById('fSizes').value = p.sizes.join(', ');
    document.getElementById('fStock').value = p.stock;
    document.getElementById('fIsNew').checked = !!p.isNew;
    document.getElementById('fFeatured').checked = !!p.featured;
  } else {
    title.textContent = 'Adicionar Produto';
    document.getElementById('productForm').reset();
    document.getElementById('imgPreview').style.display = 'none';
    document.getElementById('fBg').value = 'linear-gradient(135deg,#f5f5f5,#e0e0e0)';
  }

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  editingId = null;
}

// ── Save ──────────────────────────────────────────────────────
function saveProduct(e) {
  e.preventDefault();

  const price = parseFloat(document.getElementById('fPrice').value);
  const origRaw = document.getElementById('fOriginalPrice').value.trim();
  const origPrice = origRaw ? parseFloat(origRaw) : null;

  if (isNaN(price) || price <= 0) {
    alert('Por favor indica um preço válido.'); return;
  }
  if (origPrice !== null && origPrice <= price) {
    alert('O preço original deve ser superior ao preço actual.'); return;
  }

  const sizesRaw = document.getElementById('fSizes').value;
  const sizes = sizesRaw.split(',').map(s => s.trim()).filter(Boolean);

  const imageVal = document.getElementById('fImage').value.trim();

  const product = {
    id: editingId || null,
    name: document.getElementById('fName').value.trim(),
    subtitle: document.getElementById('fSubtitle').value.trim(),
    category: document.getElementById('fCategory').value,
    price,
    originalPrice: origPrice,
    image: imageVal || null,
    bg: document.getElementById('fBg').value.trim() || 'linear-gradient(135deg,#f5f5f5,#e0e0e0)',
    description: document.getElementById('fDescription').value.trim(),
    sizes,
    stock: parseInt(document.getElementById('fStock').value) || 0,
    isNew: document.getElementById('fIsNew').checked,
    featured: document.getElementById('fFeatured').checked
  };

  DB.saveProduct(product);
  closeModal();
  renderStats();
  renderProductsTable();
}

// ── Delete ────────────────────────────────────────────────────
function deleteProduct(id) {
  const p = DB.getProduct(id);
  if (!p) return;
  if (!confirm(`Eliminar "${p.name}"? Esta acção não pode ser desfeita.`)) return;
  DB.deleteProduct(id);
  renderStats();
  renderProductsTable();
}

// ── Helpers ───────────────────────────────────────────────────
function catLabel(cat) {
  const map = { corrida: 'Corrida', treino: 'Treino', futebol: 'Futebol', estilo: 'Estilo' };
  return map[cat] || cat;
}

function fmt(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}
