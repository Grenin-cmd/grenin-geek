const crypto = require("node:crypto");
const express = require("express");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("Defina SUPABASE_DB_URL ou DATABASE_URL com a conexão do Supabase.");

const database = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("supabase") ? { rejectUnauthorized: false } : undefined
});

const products = [
  ["box-mega-luar-clefable", "Box Mega Luar Clefable", "pokemon-tcg", 125, "Caixa fechada, 8 pacotes.", "assets/produtos/box-clefable.jpg", 1],
  ["colecao-arco-iris-evolucoes-prismaticas", "Coleção Arco-Íris Evoluções Prismáticas", "pokemon-tcg", 210, "Caixa fechada, 10 pacotes.", "assets/produtos/box-eevee.jpg", 1],
  ["blister-triplo-escuridao-absoluta", "Blister Triplo Escuridão Absoluta", "pokemon-tcg", 42.5, "3 pacotes.", "assets/produtos/triple-escuridão.jpg", 2],
  ["blister-triplo-caos-ascendente", "Blister Triplo Caos Ascendente", "pokemon-tcg", 42.5, "3 pacotes.", "assets/produtos/triple-caos.jpg", 2],
  ["blister-unitario-equilibrio-perfeito", "Blister Unitário Equilíbrio Perfeito", "pokemon-tcg", 13, "Booster unico", "assets/produtos/buniequperf.jpg", 2],
  ["blister-unitario-escuridao-absoluta", "Blister Unitário Escuridão Absoluta", "pokemon-tcg", 13, "Booster unico", "assets/produtos/bunicoescabs.jpg", 1],
  ["bleach-remix-vol-2", "Bleach Remix Vol. 2", "mangas", 45, "Usado.", "assets/produtos/bleach2.jpg", 1],
  ["bleach-remix-vol-3", "Bleach Remix Vol. 3", "mangas", 45, "Usado.", "assets/produtos/bleach3.jpg", 1],
  ["bleach-remix-vol-4", "Bleach Remix Vol. 4", "mangas", 45, "Usado.", "assets/produtos/bleach4.jpg", 1],
  ["bleach-remix-vol-5", "Bleach Remix Vol. 5", "mangas", 45, "Usado.", "assets/produtos/bleach5.jpg", 1],
  ["radiant-vol-14", "Radiant Vol. 14", "mangas", 27, "Usado.", "assets/produtos/radiand14.jpg", 1],
  ["vagabond-vol-1", "Vagabond Vol. 1", "mangas", 36.5, "Novo.", "assets/produtos/vagabond1.jpg", 1],
  ["gantz-vol-3", "Gantz Vol. 3", "mangas", 27, "Novo.", "assets/produtos/gantz3.jpg", 1],
  ["gantz-vol-4", "Gantz Vol. 4", "mangas", 27, "Novo.", "assets/produtos/gantz4.jpg", 1],
  ["noragami-vol-23", "Noragami Vol. 23", "mangas", 22.99, "Usado.", "assets/produtos/noragami23.jpg", 1],
  ["sleeves-central-100un", "Sleeves Central (100un)", "acessorios", 23, "Tamanho padrão para cartas TCG.", "assets/produtos/sleevecentral.jpg", 16]
];

async function initializeDatabase() {
  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, cpf TEXT NOT NULL UNIQUE,
      cep TEXT NOT NULL, street TEXT NOT NULL, neighborhood TEXT NOT NULL,
      number TEXT NOT NULL, complement TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), description TEXT NOT NULL DEFAULT '',
      image TEXT, stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), active BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id),
      delivery TEXT NOT NULL CHECK (delivery IN ('pickup', 'shipping')),
      total NUMERIC(10, 2) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id),
      product_id TEXT NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price NUMERIC(10, 2) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), expires_at TIMESTAMPTZ NOT NULL
    );
  `);
  await database.query("UPDATE users SET role = 'admin' WHERE cpf = $1", ["14517447650"]);
  for (const product of products) {
    await database.query(`INSERT INTO products (id, name, category, price, description, image, stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`, product);
  }
}

const app = express();
app.use((request, response, next) => {
  const origin = request.get("origin");
  const allowedOrigins = ["http://localhost:8000", "http://127.0.0.1:8000", process.env.FRONTEND_ORIGIN].filter(Boolean);
  if (allowedOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  }
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname, { setHeaders: (response) => response.setHeader("Cache-Control", "no-store") }));

function normalizeCpf(value) { return String(value || "").replace(/\D/g, ""); }
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(`${salt}:${key.toString("hex")}`)));
}
function verifyPassword(password, stored) {
  const [salt, key] = stored.split(":");
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, derivedKey) => {
    if (error) return reject(error);
    resolve(crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey));
  }));
}
function publicUser(user) {
  return { id: user.id, name: user.name, cpf: user.cpf, cep: user.cep, street: user.street, neighborhood: user.neighborhood, number: user.number, complement: user.complement, isAdmin: user.role === "admin" };
}
async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await database.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')", [tokenHash, userId]);
  return token;
}
async function auth(request, response, next) {
  try {
    const token = request.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return response.status(401).json({ error: "Faça login para continuar." });
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const result = await database.query("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW()", [tokenHash]);
    if (!result.rows[0]) return response.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    request.user = result.rows[0];
    next();
  } catch (error) { next(error); }
}
function adminAuth(request, response, next) {
  auth(request, response, () => request.user.role === "admin" ? next() : response.status(403).json({ error: "Acesso restrito ao administrador." }));
}
function validateCustomer(body) {
  return ["name", "cpf", "cep", "street", "neighborhood", "number"].every((field) => String(body[field] || "").trim()) && normalizeCpf(body.cpf).length === 11;
}

app.get("/api/products", async (request, response, next) => {
  try { response.json((await database.query("SELECT id, name, category, price::float8 AS price, description AS desc, image, stock FROM products WHERE active = TRUE ORDER BY id")).rows); } catch (error) { next(error); }
});
app.get("/api/admin/products", adminAuth, async (request, response, next) => {
  try { response.json((await database.query("SELECT id, name, category, price::float8 AS price, description AS desc, image, stock, active FROM products ORDER BY id")).rows); } catch (error) { next(error); }
});
app.patch("/api/admin/products/:id", adminAuth, async (request, response, next) => {
  const { price, stock } = request.body;
  if (!Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) return response.status(400).json({ error: "Preço ou estoque inválido." });
  try {
    const result = await database.query("UPDATE products SET price = $1, stock = $2 WHERE id = $3", [Number(price), Number(stock), request.params.id]);
    if (!result.rowCount) return response.status(404).json({ error: "Produto não encontrado." });
    response.json({ success: true });
  } catch (error) { next(error); }
});
app.post("/api/admin/products", adminAuth, async (request, response, next) => {
  const { id, name, category, price, desc, image, stock } = request.body;
  if (!id || !name || !category || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) return response.status(400).json({ error: "Preencha os dados do produto corretamente." });
  try {
    await database.query("INSERT INTO products (id, name, category, price, description, image, stock) VALUES ($1, $2, $3, $4, $5, $6, $7)", [id, name.trim(), category, Number(price), String(desc || "").trim(), String(image || "").trim(), Number(stock)]);
    response.status(201).json({ success: true });
  } catch (error) { response.status(error.code === "23505" ? 409 : 400).json({ error: error.code === "23505" ? "Já existe um produto com esse ID." : "Não foi possível adicionar o produto." }); }
});
app.delete("/api/admin/products/:id", adminAuth, async (request, response, next) => {
  try {
    const result = await database.query("UPDATE products SET active = FALSE WHERE id = $1", [request.params.id]);
    if (!result.rowCount) return response.status(404).json({ error: "Produto não encontrado." });
    response.json({ success: true });
  } catch (error) { next(error); }
});

app.post("/api/auth/register", async (request, response) => {
  if (!validateCustomer(request.body) || String(request.body.password || "").length < 4) return response.status(400).json({ error: "Preencha os dados obrigatórios e uma senha de pelo menos 4 caracteres." });
  const data = request.body;
  try {
    const passwordHash = await hashPassword(data.password);
    const result = await database.query(`INSERT INTO users (name, cpf, cep, street, neighborhood, number, complement, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [data.name.trim(), normalizeCpf(data.cpf), data.cep.trim(), data.street.trim(), data.neighborhood.trim(), data.number.trim(), String(data.complement || "").trim(), passwordHash]);
    response.status(201).json({ user: publicUser(result.rows[0]), token: await createSession(result.rows[0].id) });
  } catch (error) { response.status(error.code === "23505" ? 409 : 500).json({ error: error.code === "23505" ? "Este CPF já possui uma conta." : "Não foi possível criar a conta." }); }
});
app.post("/api/auth/login", async (request, response) => {
  try {
    const result = await database.query("SELECT * FROM users WHERE cpf = $1", [normalizeCpf(request.body.cpf)]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(String(request.body.password || ""), user.password_hash))) return response.status(401).json({ error: "CPF ou senha não encontrados." });
    response.json({ user: publicUser(user), token: await createSession(user.id) });
  } catch (error) { response.status(500).json({ error: "Não foi possível fazer login." }); }
});
app.get("/api/me", auth, (request, response) => response.json({ user: publicUser(request.user) }));
app.get("/api/orders", auth, async (request, response, next) => {
  try {
    const orders = (await database.query("SELECT id, delivery, total, TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') AS date FROM orders WHERE user_id = $1 ORDER BY id DESC", [request.user.id])).rows;
    const items = orders.length ? (await database.query("SELECT order_id, product_name AS name, quantity FROM order_items WHERE order_id = ANY($1::bigint[])", [orders.map((order) => order.id)])).rows : [];
    response.json(orders.map((order) => ({ ...order, items: items.filter((item) => String(item.order_id) === String(order.id)) })));
  } catch (error) { next(error); }
});
app.post("/api/orders", auth, async (request, response) => {
  const { delivery, items } = request.body;
  if (!["pickup", "shipping"].includes(delivery) || !Array.isArray(items) || items.length === 0) return response.status(400).json({ error: "Pedido inválido." });
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const normalizedItems = [];
    let total = 0;
    for (const item of items) {
      const result = await client.query("SELECT id, name, price, stock FROM products WHERE id = $1 AND active = TRUE FOR UPDATE", [item.id]);
      const product = result.rows[0];
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) throw new Error("Produto sem estoque ou quantidade inválida.");
      normalizedItems.push({ ...product, quantity });
      total += Number(product.price) * quantity;
    }
    const order = await client.query("INSERT INTO orders (user_id, delivery, total) VALUES ($1, $2, $3) RETURNING id", [request.user.id, delivery, total]);
    for (const item of normalizedItems) {
      await client.query("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES ($1, $2, $3, $4, $5)", [order.rows[0].id, item.id, item.name, item.quantity, item.price]);
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.id]);
    }
    await client.query("COMMIT");
    response.status(201).json({ orderId: order.rows[0].id });
  } catch (error) {
    await client.query("ROLLBACK");
    response.status(400).json({ error: error.message });
  } finally { client.release(); }
});

app.use((error, request, response, next) => { console.error(error); response.status(500).json({ error: "Erro interno do servidor." }); });
initializeDatabase().then(() => app.listen(PORT, () => console.log(`Grenin Geek Store: http://localhost:${PORT}`))).catch((error) => { console.error("Não foi possível conectar ao Supabase:", error.message); process.exit(1); });
