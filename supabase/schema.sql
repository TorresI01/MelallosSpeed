-- Melallos Speed: esquema inicial para Supabase/PostgreSQL.
-- Ejecútalo en Supabase > SQL Editor. No pegues claves secret/service_role en el sitio.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('integrales', 'abiertos', 'otros')),
  brand text,
  sku text unique,
  description text not null default '',
  price_cop numeric(14, 2) check (price_cop is null or price_cop >= 0),
  cost_cop numeric(14, 2) check (cost_cop is null or cost_cop >= 0),
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  image_path text not null default '',
  image_style text not null default 'contain' check (image_style in ('contain', 'cover')),
  visor text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null default '',
  email text,
  address text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text not null default '',
  email text,
  address text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  product_name text not null,
  reference text,
  size text,
  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado', 'cotizado', 'pedido', 'cerrado', 'cancelado')),
  consent_given boolean not null default false check (consent_given),
  source text not null default 'sitio_web',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default current_date,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null default '',
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cop numeric(14, 2) not null check (unit_price_cop >= 0),
  total_cop numeric(14, 2) generated always as (quantity * unit_price_cop) stored,
  payment_method text not null default 'por_confirmar'
    check (payment_method in ('efectivo', 'transferencia', 'credito', 'por_confirmar', 'otro')),
  payment_status text not null default 'pendiente'
    check (payment_status in ('pendiente', 'parcial', 'pagado', 'reembolsado')),
  paid_cop numeric(14, 2) not null default 0 check (paid_cop >= 0),
  check (paid_cop <= quantity * unit_price_cop),
  status text not null default 'confirmada' check (status in ('confirmada', 'anulada')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null,
  description text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  amount_cop numeric(14, 2) not null check (amount_cop > 0),
  payment_method text not null default 'por_confirmar'
    check (payment_method in ('efectivo', 'transferencia', 'credito', 'por_confirmar', 'otro')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  movement_type text not null check (movement_type in ('entrada', 'salida', 'ajuste')),
  quantity integer not null check (quantity > 0),
  reason text not null,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and public.is_site_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and public.is_site_admin())
with check (bucket_id = 'product-images' and public.is_site_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and public.is_site_admin());

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists sales_sale_date_idx on public.sales (sale_date desc);
create index if not exists expenses_expense_date_idx on public.expenses (expense_date desc);
create index if not exists inventory_product_created_idx on public.inventory_movements (product_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists suppliers_updated_at on public.suppliers;
create trigger suppliers_updated_at before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists inquiries_updated_at on public.inquiries;
create trigger inquiries_updated_at before update on public.inquiries
for each row execute function public.set_updated_at();

create or replace function public.log_product_stock_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stock is distinct from old.stock then
    insert into public.inventory_movements (
      product_id, product_name, movement_type, quantity, reason
    ) values (
      new.id,
      new.name,
      case
        when current_setting('melallos.inventory_reason', true) like 'Venta registrada %' then 'salida'
        when current_setting('melallos.inventory_reason', true) like 'Anulación de venta %' then 'entrada'
        else 'ajuste'
      end,
      abs(new.stock - old.stock),
      coalesce(
        nullif(current_setting('melallos.inventory_reason', true), ''),
        'Ajuste de inventario desde el panel de administración'
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists products_stock_change on public.products;
create trigger products_stock_change after update of stock on public.products
for each row execute function public.log_product_stock_change();

create or replace function public.apply_sale_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.product_id is distinct from old.product_id
      or new.quantity is distinct from old.quantity
      or new.unit_price_cop is distinct from old.unit_price_cop then
      raise exception 'Para corregir producto, cantidad o precio, anula esta venta y registra una nueva';
    end if;
    if new.status is not distinct from old.status then
      return new;
    end if;
    if old.status = 'confirmada' and new.status = 'anulada' then
      if old.product_id is not null then
        perform set_config('melallos.inventory_reason', 'Anulación de venta ' || new.id::text, true);
        update public.products set stock = stock + old.quantity where id = old.product_id;
        if not found then
          raise exception 'No se pudo devolver el producto al inventario';
        end if;
        perform set_config('melallos.inventory_reason', '', true);
      end if;
      return new;
    end if;
  end if;

  if new.status = 'confirmada' and new.product_id is not null then
    perform set_config('melallos.inventory_reason', 'Venta registrada ' || new.id::text, true);
    update public.products
    set stock = stock - new.quantity
    where id = new.product_id and active and stock >= new.quantity;
    if not found then
      raise exception 'Producto inactivo o inventario insuficiente para registrar la venta';
    end if;
    perform set_config('melallos.inventory_reason', '', true);
  end if;
  return new;
end;
$$;

drop trigger if exists sales_update_inventory on public.sales;
create trigger sales_update_inventory before insert or update on public.sales
for each row execute function public.apply_sale_inventory();

create or replace function public.prevent_sale_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Las ventas no se eliminan; cambia su estado a anulada para conservar el historial';
end;
$$;

drop trigger if exists sales_no_delete on public.sales;
create trigger sales_no_delete before delete on public.sales
for each row execute function public.prevent_sale_delete();

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.inquiries enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "Admins can view admin allowlist" on public.admin_users;
create policy "Admins can view admin allowlist" on public.admin_users
for select to authenticated using (public.is_site_admin());

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products
for select to anon, authenticated
using ((auth.role() = 'anon' and active) or public.is_site_admin());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products
for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Admins can manage customers" on public.customers;
create policy "Admins can manage customers" on public.customers
for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Admins can manage suppliers" on public.suppliers;
create policy "Admins can manage suppliers" on public.suppliers
for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Visitors can submit authorized inquiries" on public.inquiries;
create policy "Visitors can submit authorized inquiries" on public.inquiries
for insert to anon, authenticated
with check (
  consent_given
  and length(trim(customer_name)) between 2 and 120
  and length(trim(phone)) between 7 and 40
  and length(trim(product_name)) between 2 and 200
  and status = 'nuevo'
  and notes = ''
  and source = 'sitio_web'
);

drop policy if exists "Admins can manage inquiries" on public.inquiries;
create policy "Admins can manage inquiries" on public.inquiries
for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Admins can manage sales" on public.sales;
create policy "Admins can manage sales" on public.sales
for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Admins can manage expenses" on public.expenses;
create policy "Admins can manage expenses" on public.expenses
for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Admins can view inventory movements" on public.inventory_movements;
create policy "Admins can view inventory movements" on public.inventory_movements
for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create or replace function public.admin_dashboard_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_site_admin() then
    raise exception 'Acceso de administrador requerido';
  end if;

  select jsonb_build_object(
    'active_products', (select count(*) from public.products where active),
    'stock_units', (select coalesce(sum(stock), 0) from public.products where active),
    'low_stock_products', (select count(*) from public.products where active and stock <= min_stock),
    'open_inquiries', (select count(*) from public.inquiries where status in ('nuevo', 'contactado', 'cotizado', 'pedido')),
    'sales_total_cop', (select coalesce(sum(total_cop), 0) from public.sales where status = 'confirmada' and payment_status <> 'reembolsado'),
    'expenses_total_cop', (select coalesce(sum(amount_cop), 0) from public.expenses),
    'balance_cop',
      (select coalesce(sum(total_cop), 0) from public.sales where status = 'confirmada' and payment_status <> 'reembolsado')
      - (select coalesce(sum(amount_cop), 0) from public.expenses),
    'receivables_cop',
      (select coalesce(sum(greatest(total_cop - paid_cop, 0)), 0)
       from public.sales where status = 'confirmada' and payment_status <> 'reembolsado')
  ) into result;
  return result;
end;
$$;

create or replace function public.admin_monthly_report()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_site_admin() then
    raise exception 'Acceso de administrador requerido';
  end if;

  select coalesce(jsonb_agg(month_row order by month_start), '[]'::jsonb)
  into result
  from (
    select
      month_start,
      jsonb_build_object(
        'month', to_char(month_start, 'YYYY-MM'),
        'sales_cop', coalesce((
          select sum(s.total_cop) from public.sales s
          where s.sale_date >= month_start
            and s.sale_date < month_start + interval '1 month'
            and s.status = 'confirmada'
            and s.payment_status <> 'reembolsado'
        ), 0),
        'expenses_cop', coalesce((
          select sum(e.amount_cop) from public.expenses e
          where e.expense_date >= month_start
            and e.expense_date < month_start + interval '1 month'
        ), 0),
        'balance_cop',
          coalesce((
            select sum(s.total_cop) from public.sales s
            where s.sale_date >= month_start
              and s.sale_date < month_start + interval '1 month'
              and s.status = 'confirmada'
              and s.payment_status <> 'reembolsado'
          ), 0)
          - coalesce((
            select sum(e.amount_cop) from public.expenses e
            where e.expense_date >= month_start
              and e.expense_date < month_start + interval '1 month'
          ), 0)
      ) as month_row
    from generate_series(
      date_trunc('month', current_date) - interval '11 months',
      date_trunc('month', current_date),
      interval '1 month'
    ) as series(month_start)
  ) month_rows;
  return result;
end;
$$;

revoke all on public.products from anon;
grant select (id, name, category, brand, description, price_cop, image_path, image_style, visor, active)
  on public.products to anon;
grant select on public.products to authenticated;
grant insert on public.inquiries to anon, authenticated;
grant select, insert, update, delete on public.products, public.customers, public.suppliers,
  public.inquiries, public.sales, public.expenses, public.inventory_movements to authenticated;
grant select on public.admin_users to authenticated;
revoke all on public.admin_users, public.customers, public.suppliers, public.sales, public.expenses,
  public.inventory_movements from anon;
revoke all on public.inquiries from anon;
grant insert on public.inquiries to anon;
revoke all on function public.admin_dashboard_summary() from public, anon;
revoke all on function public.admin_monthly_report() from public, anon;
grant execute on function public.admin_dashboard_summary() to authenticated;
grant execute on function public.admin_monthly_report() to authenticated;

-- Catálogo inicial del sitio. El stock se deja en cero hasta que se confirme el inventario real.
insert into public.products (
  name, category, brand, description, price_cop, image_path, image_style, visor, active
) select seed.name, seed.category, seed.brand, seed.description, seed.price_cop,
  seed.image_path, seed.image_style, seed.visor, seed.active
from (values
  ('Blanco con visor iridiscente', 'integrales', 'Arai', 'Acabado blanco liso con visor iridiscente. Un diseño limpio que combina con cualquier moto.', 850000, 'assets/images/arai-01.jpg', 'contain', 'Iridiscente dorado', true),
  ('Gráfico rojo, negro y azul', 'integrales', 'Arai', 'Diseño deportivo en rojo, negro y azul con detalles dorados y visor ahumado.', 850000, 'assets/images/arai-02.jpg', 'contain', 'Ahumado', true),
  ('Samurái dorado y negro', 'integrales', 'Arai', 'Gráfico de samurái al atardecer en negro, dorado y amarillo, con visor iridiscente.', 850000, 'assets/images/arai-03.jpg', 'contain', 'Iridiscente dorado', true),
  ('Estrellas y franjas rojo y azul', 'integrales', 'Arai', 'Diseño de estrellas y franjas en rojo, blanco y azul, con visor iridiscente multicolor.', 850000, 'assets/images/arai-04.jpg', 'contain', 'Iridiscente multicolor', true),
  ('Cromo negro', 'integrales', 'Arai', 'Acabado cromado oscuro tipo espejo con visor ahumado. Discreto y llamativo a la vez.', 850000, 'assets/images/arai-05.jpg', 'contain', 'Ahumado', true),
  ('Grulla y flores de cerezo', 'integrales', 'Arai', 'Gráfico artístico de una grulla con flores de cerezo en blanco, dorado y azul, con visor iridiscente rojo.', 850000, 'assets/images/arai-06.jpg', 'contain', 'Iridiscente rojo', true),
  ('Gráfico japonés rojo y blanco', 'integrales', 'Arai', 'Diseño oriental muy colorido en rojo, blanco y dorado, con visor iridiscente verde.', 850000, 'assets/images/arai-07.jpg', 'contain', 'Iridiscente verde', true),
  ('Llamas rojas', 'integrales', 'Arai', 'Llamas rojas y negras sobre fondo blanco, con visor iridiscente.', 850000, 'assets/images/arai-08.jpg', 'contain', 'Iridiscente dorado', true),
  ('Gráfico rojo, blanco y negro', 'integrales', 'Arai', 'Trazos geométricos en rojo, blanco y negro con visor ahumado. Look deportivo de competición.', 850000, 'assets/images/arai-09.jpg', 'contain', 'Ahumado', true),
  ('Negro mate edición Red Bull', 'integrales', 'Arai', 'Negro mate con gráficos de Red Bull en rojo y amarillo, y detalles en azul turquesa.', 850000, 'assets/images/arai-10.jpg', 'contain', 'Ahumado', true),
  ('Edición Isle of Man TT', 'integrales', 'Arai', 'Gráfico de la carrera Isle of Man Tourist Trophy en naranja, azul y rojo.', 850000, 'assets/images/arai-11.jpg', 'contain', 'Iridiscente dorado', true),
  ('Estrellas y barras', 'integrales', 'Arai', 'Diseño de estrellas y barras en rojo, blanco y azul, con detalles verdes y visor iridiscente.', 850000, 'assets/images/arai-12.jpg', 'contain', 'Iridiscente multicolor', true),
  ('Blanco con flores de cerezo', 'integrales', 'Arai', 'Blanco con flores de cerezo rosadas y base celeste, con visor iridiscente.', 850000, 'assets/images/arai-13.jpg', 'contain', 'Iridiscente dorado', true),
  ('Blanco y negro con visor transparente', 'integrales', 'Arai', 'Gráfico geométrico en blanco y negro con visor transparente.', 850000, 'assets/images/arai-14.jpg', 'contain', 'Transparente', true),
  ('Blanco con visor azul', 'integrales', 'Shoei', 'Casco blanco liso con visor iridiscente azul.', 850000, 'assets/images/shoei-blanco-integral.jpg', 'cover', 'Iridiscente azul', true),
  ('Gráficos de competición', 'integrales', 'AGV', 'Gráficos coloridos de competición con visor iridiscente.', 850000, 'assets/images/agv-sandia-integral.jpg', 'cover', 'Iridiscente multicolor', true),
  ('Gráfico de puntos de colores', 'integrales', 'AGV', 'Gráfico de puntos de colores sobre fondo azul, con visor iridiscente.', 850000, 'assets/images/agv-lentejuelas-integral.jpg', 'cover', 'Iridiscente azul y violeta', true),
  ('Blanco con visor iridiscente', 'abiertos', 'Shoei', 'Casco abierto blanco con visor iridiscente. Ligero y cómodo para la ciudad.', 650000, 'assets/images/shoei-blanco-abierto.jpg', 'cover', 'Iridiscente', true),
  ('Casco abierto Arai', 'abiertos', 'Arai', 'Casco abierto Arai. Escríbenos para conocer los diseños y tallas disponibles.', 650000, '', 'contain', null, true),
  ('Accesorio para motociclista', 'otros', null, 'Accesorios para tu casco y tu moto. Pregúntanos qué tenemos disponible.', null, '', 'contain', null, true)
) as seed(name, category, brand, description, price_cop, image_path, image_style, visor, active)
where not exists (
  select 1
  from public.products existing
  where existing.name = seed.name
    and existing.category = seed.category
    and existing.brand is not distinct from seed.brand
);

-- Después de crear el usuario en Authentication > Users, agrega aquí su email:
-- insert into public.admin_users (email) values (lower('TU_CORREO_ADMIN'));
