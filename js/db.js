// ============================================================
// DATABASE — camada de acesso ao Supabase (Postgres)
// ============================================================

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    category: row.categories ? row.categories.slug : row.category_id,
    price: Number(row.price),
    originalPrice: row.original_price !== null ? Number(row.original_price) : null,
    bg: row.bg,
    image: row.image_path,
    description: row.description,
    sizes: row.sizes || [],
    isNew: row.is_new,
    featured: row.featured,
    stock: row.stock,
    active: row.active
  };
}

const DB = {
  async getProducts({ includeInactive = false } = {}) {
    let query = supabaseClient.from('products').select('*, categories(slug,label)').order('created_at');
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return data.map(mapProduct);
  },

  async getProduct(id) {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*, categories(slug,label)')
      .eq('id', id)
      .single();
    if (error) return null;
    return mapProduct(data);
  },

  async saveProduct(product) {
    const { data: cat, error: catError } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('slug', product.category)
      .single();
    if (catError || !cat) throw new Error('Categoria inválida.');

    const row = {
      name: product.name,
      subtitle: product.subtitle,
      category_id: cat.id,
      price: product.price,
      original_price: product.originalPrice,
      bg: product.bg,
      image_path: product.image,
      description: product.description,
      sizes: product.sizes,
      is_new: product.isNew,
      featured: product.featured,
      stock: product.stock
    };

    if (product.id) {
      const { data, error } = await supabaseClient
        .from('products').update(row).eq('id', product.id)
        .select('*, categories(slug,label)').single();
      if (error) throw error;
      return mapProduct(data);
    } else {
      const { data, error } = await supabaseClient
        .from('products').insert(row)
        .select('*, categories(slug,label)').single();
      if (error) throw error;
      return mapProduct(data);
    }
  },

  async deleteProduct(id) {
    // soft-delete: mantém o histórico em order_items
    const { error } = await supabaseClient.from('products').update({ active: false }).eq('id', id);
    if (error) throw error;
  },

  async saveOrder(order) {
    const { customer, items, total } = order;
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = total - subtotal;

    const { data: customerRow, error: customerError } = await supabaseClient
      .from('customers')
      .insert({
        name: customer.name, email: customer.email,
        address: customer.address, zip: customer.zip, city: customer.city
      })
      .select().single();
    if (customerError) throw customerError;

    const { data: orderRow, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        customer_id: customerRow.id,
        subtotal, shipping, total
      })
      .select().single();
    if (orderError) throw orderError;

    const orderItems = items.map(i => ({
      order_id: orderRow.id,
      product_id: i.id,
      product_name: i.name,
      size: i.size,
      unit_price: i.price,
      qty: i.qty
    }));
    const { error: itemsError } = await supabaseClient.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return { id: orderRow.reference, date: orderRow.created_at };
  },

  async getOrders() {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*, customers(*), order_items(*)')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data;
  }
};
