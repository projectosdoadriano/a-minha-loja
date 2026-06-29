// ============================================================
// DATABASE — localStorage como base de dados embutida
// ============================================================

const SEED_PRODUCTS = [
  {
    id: '1', name: 'ProRun Elite', subtitle: 'Sapatilhas de Corrida',
    category: 'corrida', price: 129.99, originalPrice: 159.99,
    bg: 'linear-gradient(135deg,#d0e8ff,#a8d0f5)',
    image: 'assets/img/sapatilha-prorun.jpg',
    description: 'Sapatilhas de corrida de alto desempenho com amortecimento reativo e suporte superior. Ideais para longas distâncias e terreno urbano.',
    sizes: ['38','39','40','41','42','43','44','45'], featured: true, isNew: false, stock: 50
  },
  {
    id: '2', name: 'AeroStep Lite', subtitle: 'Sapatilhas Leves',
    category: 'corrida', price: 89.99, originalPrice: null,
    bg: 'linear-gradient(135deg,#e0f7fa,#b2ebf2)',
    image: 'assets/img/sapatilha-aerostep-lite.jpg',
    description: 'Ultraligeiras e respiráveis. Perfeitas para treinos diários com máximo conforto e leveza excecional.',
    sizes: ['38','39','40','41','42','43','44'], featured: false, isNew: true, stock: 35
  },
  {
    id: '3', name: 'TrailMax Pro', subtitle: 'Sapatilhas de Trail',
    category: 'corrida', price: 149.99, originalPrice: null,
    bg: 'linear-gradient(135deg,#e8f5e9,#a5d6a7)',
    image: 'assets/img/sapatilha-trailmax-pro.jpg',
    description: 'Construídas para o terreno mais exigente. Sola de alta aderência e proteção reforçada para trail running.',
    sizes: ['39','40','41','42','43','44','45'], featured: false, isNew: true, stock: 20
  },
  {
    id: '4', name: 'RunShield', subtitle: 'Corta-Vento',
    category: 'corrida', price: 79.99, originalPrice: 99.99,
    bg: 'linear-gradient(135deg,#fce4ec,#f8bbd0)',
    image: 'assets/img/sapatilha-runshield.jpg',
    description: 'Corta-vento leve e compacto com tecnologia impermeável. Comprime para caber no bolso.',
    sizes: ['XS','S','M','L','XL','XXL'], featured: false, isNew: false, stock: 40
  },
  {
    id: '5', name: 'FlexFit Pro', subtitle: 'Leggings de Treino',
    category: 'treino', price: 54.99, originalPrice: null,
    bg: 'linear-gradient(135deg,#f3e5f5,#ce93d8)',
    image: 'assets/img/sapatilha-flexfit-pro.jpg',
    description: 'Leggings de alta compressão com tecido respirável e bolso lateral seguro. Movimento total garantido.',
    sizes: ['XS','S','M','L','XL'], featured: true, isNew: false, stock: 60
  },
  {
    id: '6', name: 'PowerTee', subtitle: 'T-Shirt Técnica',
    category: 'treino', price: 34.99, originalPrice: null,
    bg: 'linear-gradient(135deg,#fff8e1,#ffe082)',
    image: 'assets/img/sapatilha-powertee.jpg',
    description: 'T-shirt técnica de secagem rápida com tecnologia anti-odor. O essencial para qualquer treino.',
    sizes: ['XS','S','M','L','XL','XXL'], featured: false, isNew: false, stock: 80
  },
  {
    id: '7', name: 'CoreStrong', subtitle: 'Calções de Treino',
    category: 'treino', price: 44.99, originalPrice: 59.99,
    bg: 'linear-gradient(135deg,#e8eaf6,#9fa8da)',
    image: 'assets/img/sapatilha-corestrong.jpg',
    description: 'Calções versáteis com forro interior e cós ajustável. Do ginásio à rua, sempre confortável.',
    sizes: ['XS','S','M','L','XL','XXL'], featured: false, isNew: false, stock: 55
  },
  {
    id: '8', name: 'Striker Elite', subtitle: 'Sapatilhas de Futebol',
    category: 'futebol', price: 119.99, originalPrice: null,
    bg: 'linear-gradient(135deg,#fff3e0,#ffcc80)',
    image: 'assets/img/sapatilha-striker-elite.jpg',
    description: 'Chuteiras de alta precisão com palmilha ergonómica e sola de borracha para máxima tração no relvado.',
    sizes: ['38','39','40','41','42','43','44','45'], featured: true, isNew: true, stock: 30
  },
  {
    id: '9', name: 'Match Kit', subtitle: 'Equipamento Completo',
    category: 'futebol', price: 69.99, originalPrice: 89.99,
    bg: 'linear-gradient(135deg,#fbe9e7,#ffab91)',
    image: 'assets/img/sapatilha-match-kit.jpg',
    description: 'Conjunto camisola + calções oficial. Tecido de alta performance com ventilação estratégica.',
    sizes: ['XS','S','M','L','XL','XXL'], featured: false, isNew: false, stock: 25
  },
  {
    id: '10', name: 'GoalPro', subtitle: 'Luvas de Guarda-Redes',
    category: 'futebol', price: 39.99, originalPrice: null,
    bg: 'linear-gradient(135deg,#e0f2f1,#80cbc4)',
    image: 'assets/img/sapatilha-goalpro.jpg',
    description: 'Luvas profissionais com grip de látex e proteção reforçada nos dedos. Para cada defesa.',
    sizes: ['6','7','8','9','10','11'], featured: false, isNew: false, stock: 45
  },
  {
    id: '11', name: 'Urban Classic', subtitle: 'Hoodie',
    category: 'estilo', price: 89.99, originalPrice: null,
    bg: 'linear-gradient(135deg,#212121,#424242)',
    image: 'assets/img/sapatilha-urban-classic.jpg',
    description: 'Hoodie premium de algodão orgânico. Corte relaxado e acabamento minimalista para o dia a dia.',
    sizes: ['XS','S','M','L','XL','XXL'], featured: true, isNew: true, stock: 40
  },
  {
    id: '12', name: 'Street Runner', subtitle: 'Sapatilhas Lifestyle',
    category: 'estilo', price: 99.99, originalPrice: 119.99,
    bg: 'linear-gradient(135deg,#f5f5f5,#e0e0e0)',
    image: 'assets/img/sapatilha-street-runner.jpg',
    description: 'Sapatilhas com design retro e conforto moderno. Do treino à cidade — sempre com estilo.',
    sizes: ['38','39','40','41','42','43','44','45'], featured: false, isNew: false, stock: 35
  }
];

const DB_VERSION = '2'; // incrementa sempre que o seed mudar

const DB = {
  KEYS: { PRODUCTS: 'ac_products', ORDERS: 'ac_orders', VERSION: 'ac_version' },

  init() {
    // Re-seed automático quando a versão da BD muda
    if (localStorage.getItem(this.KEYS.VERSION) !== DB_VERSION) {
      localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
      localStorage.setItem(this.KEYS.VERSION, DB_VERSION);
    }
  },

  getProducts() {
    return JSON.parse(localStorage.getItem(this.KEYS.PRODUCTS) || '[]');
  },

  getProduct(id) {
    return this.getProducts().find(p => p.id === id) || null;
  },

  saveProduct(product) {
    const list = this.getProducts();
    const idx = list.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      product.id = Date.now().toString();
      list.push(product);
    }
    localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(list));
    return product;
  },

  deleteProduct(id) {
    const list = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(list));
  },

  resetToSeed() {
    localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  },

  saveOrder(order) {
    const orders = JSON.parse(localStorage.getItem(this.KEYS.ORDERS) || '[]');
    order.id = 'AC' + Date.now().toString().slice(-6);
    order.date = new Date().toISOString();
    orders.unshift(order);
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
    return order;
  },

  getOrders() {
    return JSON.parse(localStorage.getItem(this.KEYS.ORDERS) || '[]');
  }
};
