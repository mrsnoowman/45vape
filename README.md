# 45 Vape — Next.js + MySQL

Toko vape online dengan alur profesional (guest cart → login merge → profile → checkout → orders).

## Database (MySQL lokal)

- Host: `127.0.0.1`
- User: `root`
- Password: _(kosong)_
- Database: `45vape_next`

```bash
# pastikan MySQL XAMPP sudah running, lalu:
npm run db:migrate
npm run db:seed
```

### Akun admin

Seed hanya membuat akun admin (tanpa produk dummy). Email/password dari `.env`:

- `ADMIN_EMAIL` (default: `admin@45vape.test`)
- `ADMIN_PASSWORD` (default: `admin123`)

Produk diinput lewat `/admin/products`.

## Menjalankan

```bash
cd 45vape-next
npm install
npm run dev
```

Buka http://localhost:3000

## Alur belanja

1. Guest boleh **add to cart** (tersimpan di MySQL via cookie guest)
2. Klik checkout → jika belum login, diarahkan ke **login/register**
3. Saat login/register, **keranjang guest digabung** ke akun
4. Jika profil belum lengkap → **lengkapi alamat pengiriman**
5. Checkout membuat **order** + mengurangi stok + kosongkan cart
6. Pantau di halaman **Status Pesanan**

## Struktur tabel

`users`, `products`, `product_variants`, `cart_items`, `orders`, `order_items`
