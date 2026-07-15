-- ========================================================================
-- ADRIANO'S CLOSET — SETUP COMPLETO DO SUPABASE
-- Projeto: aminhaloja
-- Corre este ficheiro INTEIRO de uma vez no SQL Editor do Supabase
-- (Dashboard → SQL Editor → New query → cola tudo → Run)
-- ========================================================================

-- 1. EXTENSÕES ----------------------------------------------------------
create extension if not exists "pgcrypto";

-- 2. TABELAS --------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subtitle text,
  category_id uuid not null references categories(id),
  price numeric(10,2) not null check (price > 0),
  original_price numeric(10,2) check (original_price is null or original_price > price),
  bg text,
  image_path text,
  description text,
  sizes text[] not null default '{}',
  is_new boolean not null default false,
  featured boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_category on products(category_id);
create index idx_products_active on products(active);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  address text not null,
  zip text not null,
  city text not null,
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_id uuid not null references customers(id),
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'pago'
    check (status in ('pendente','pago','enviado','entregue','cancelado')),
  created_at timestamptz default now()
);

create sequence order_ref_seq;

create or replace function set_order_reference()
returns trigger as $$
begin
  new.reference := 'AC' || lpad(nextval('order_ref_seq')::text, 6, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_orders_reference
before insert on orders
for each row execute function set_order_reference();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  size text,
  unit_price numeric(10,2) not null,
  qty integer not null check (qty > 0)
);

create index idx_order_items_order on order_items(order_id);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create table job_applications (
  id uuid primary key default gen_random_uuid(),
  job_title text not null,
  name text not null,
  email text not null,
  phone text,
  message text,
  cv_path text,
  created_at timestamptz default now()
);

-- 3. ROW LEVEL SECURITY ---------------------------------------------------

alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table newsletter_subscribers enable row level security;
alter table job_applications enable row level security;

create policy "categorias visiveis a todos"
  on categories for select using (true);

create policy "categorias so admin escreve"
  on categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "produtos ativos visiveis a todos"
  on products for select
  using (active = true or auth.role() = 'authenticated');

create policy "produtos so admin insere"
  on products for insert
  with check (auth.role() = 'authenticated');

create policy "produtos so admin atualiza"
  on products for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "produtos so admin apaga"
  on products for delete
  using (auth.role() = 'authenticated');

create policy "qualquer um cria cliente no checkout"
  on customers for insert with check (true);

create policy "so admin le clientes"
  on customers for select
  using (auth.role() = 'authenticated');

create policy "qualquer um cria encomenda"
  on orders for insert with check (true);

create policy "so admin le encomendas"
  on orders for select
  using (auth.role() = 'authenticated');

create policy "so admin atualiza encomendas"
  on orders for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "qualquer um cria itens de encomenda"
  on order_items for insert with check (true);

create policy "so admin le itens de encomenda"
  on order_items for select
  using (auth.role() = 'authenticated');

create policy "qualquer um subscreve newsletter"
  on newsletter_subscribers for insert with check (true);

create policy "so admin le newsletter"
  on newsletter_subscribers for select
  using (auth.role() = 'authenticated');

create policy "qualquer um se candidata"
  on job_applications for insert with check (true);

create policy "so admin le candidaturas"
  on job_applications for select
  using (auth.role() = 'authenticated');

-- 4. CATEGORIAS (seed) ------------------------------------------------------

insert into categories (slug, label) values
  ('corrida', 'Corrida'),
  ('treino', 'Treino'),
  ('futebol', 'Futebol'),
  ('estilo', 'Estilo');

-- 5. PRODUTOS (seed — os 12 produtos atuais do site) ------------------------

insert into products (name, subtitle, category_id, price, original_price, bg, image_path, description, sizes, is_new, featured, stock) values
('ProRun Elite', 'Sapatilhas de Corrida', (select id from categories where slug='corrida'), 129.99, 159.99, 'linear-gradient(135deg,#d0e8ff,#a8d0f5)', 'assets/img/sapatilha-prorun.jpg', 'Sapatilhas de corrida de alto desempenho com amortecimento reativo e suporte superior. Ideais para longas distâncias e terreno urbano.', array['38','39','40','41','42','43','44','45'], false, true, 50),
('AeroStep Lite', 'Sapatilhas Leves', (select id from categories where slug='corrida'), 89.99, null, 'linear-gradient(135deg,#e0f7fa,#b2ebf2)', 'assets/img/sapatilha-aerostep-lite.jpg', 'Ultraligeiras e respiráveis. Perfeitas para treinos diários com máximo conforto e leveza excecional.', array['38','39','40','41','42','43','44'], true, false, 35),
('TrailMax Pro', 'Sapatilhas de Trail', (select id from categories where slug='corrida'), 149.99, null, 'linear-gradient(135deg,#e8f5e9,#a5d6a7)', 'assets/img/sapatilha-trailmax-pro.jpg', 'Construídas para o terreno mais exigente. Sola de alta aderência e proteção reforçada para trail running.', array['39','40','41','42','43','44','45'], true, false, 20),
('RunShield', 'Corta-Vento', (select id from categories where slug='corrida'), 79.99, 99.99, 'linear-gradient(135deg,#fce4ec,#f8bbd0)', 'assets/img/sapatilha-runshield.jpg', 'Corta-vento leve e compacto com tecnologia impermeável. Comprime para caber no bolso.', array['XS','S','M','L','XL','XXL'], false, false, 40),
('FlexFit Pro', 'Leggings de Treino', (select id from categories where slug='treino'), 54.99, null, 'linear-gradient(135deg,#f3e5f5,#ce93d8)', 'assets/img/sapatilha-flexfit-pro.jpg', 'Leggings de alta compressão com tecido respirável e bolso lateral seguro. Movimento total garantido.', array['XS','S','M','L','XL'], false, true, 60),
('PowerTee', 'T-Shirt Técnica', (select id from categories where slug='treino'), 34.99, null, 'linear-gradient(135deg,#fff8e1,#ffe082)', 'assets/img/sapatilha-powertee.jpg', 'T-shirt técnica de secagem rápida com tecnologia anti-odor. O essencial para qualquer treino.', array['XS','S','M','L','XL','XXL'], false, false, 80),
('CoreStrong', 'Calções de Treino', (select id from categories where slug='treino'), 44.99, 59.99, 'linear-gradient(135deg,#e8eaf6,#9fa8da)', 'assets/img/sapatilha-corestrong.jpg', 'Calções versáteis com forro interior e cós ajustável. Do ginásio à rua, sempre confortável.', array['XS','S','M','L','XL','XXL'], false, false, 55),
('Striker Elite', 'Sapatilhas de Futebol', (select id from categories where slug='futebol'), 119.99, null, 'linear-gradient(135deg,#fff3e0,#ffcc80)', 'assets/img/sapatilha-striker-elite.jpg', 'Chuteiras de alta precisão com palmilha ergonómica e sola de borracha para máxima tração no relvado.', array['38','39','40','41','42','43','44','45'], true, true, 30),
('Match Kit', 'Equipamento Completo', (select id from categories where slug='futebol'), 69.99, 89.99, 'linear-gradient(135deg,#fbe9e7,#ffab91)', 'assets/img/sapatilha-match-kit.jpg', 'Conjunto camisola + calções oficial. Tecido de alta performance com ventilação estratégica.', array['XS','S','M','L','XL','XXL'], false, false, 25),
('GoalPro', 'Luvas de Guarda-Redes', (select id from categories where slug='futebol'), 39.99, null, 'linear-gradient(135deg,#e0f2f1,#80cbc4)', 'assets/img/sapatilha-goalpro.jpg', 'Luvas profissionais com grip de látex e proteção reforçada nos dedos. Para cada defesa.', array['6','7','8','9','10','11'], false, false, 45),
('Urban Classic', 'Hoodie', (select id from categories where slug='estilo'), 89.99, null, 'linear-gradient(135deg,#212121,#424242)', 'assets/img/sapatilha-urban-classic.jpg', 'Hoodie premium de algodão orgânico. Corte relaxado e acabamento minimalista para o dia a dia.', array['XS','S','M','L','XL','XXL'], true, true, 40),
('Street Runner', 'Sapatilhas Lifestyle', (select id from categories where slug='estilo'), 99.99, 119.99, 'linear-gradient(135deg,#f5f5f5,#e0e0e0)', 'assets/img/sapatilha-street-runner.jpg', 'Sapatilhas com design retro e conforto moderno. Do treino à cidade — sempre com estilo.', array['38','39','40','41','42','43','44','45'], false, false, 35);

-- ========================================================================
-- FIM. Depois de correr isto, vai a Authentication → Users → Add user
-- para criares o login do admin (ver PARTE 5 do planeamento_basededados.txt
-- ou instrucoes_finais.txt).
-- ========================================================================
