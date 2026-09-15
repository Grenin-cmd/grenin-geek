const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const Database = require("better-sqlite3");

const PORT = process.env.PORT || 3000;
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "grenin.sqlite");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new Database(databasePath);
database.pragma("journal_mode = WAL");

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    cep TEXT NOT NULL,
    street TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL CHECK (price >= 0),
    description TEXT NOT NULL,
    image TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    delivery TEXT NOT NULL CHECK (delivery IN ('pickup', 'shipping')),
    total REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL
  );
`);

try {
  database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");
} catch (error) {
  if (!error.message.includes("duplicate column name")) throw error;
}
database.prepare("UPDATE users SET role = 'admin' WHERE cpf = ?").run("14517447650");

const products = [
  ["box-mega-luar-clefable", "Box Mega Luar Clefable", "pokemon-tcg", 125, "Caixa fechada, 8 pacotes.", "assets/produtos/box-clefable.jpg", 1],
  ["colecao-arco-iris-evolucoes-prismaticas", "Coleção Arco-Íris Evoluções Prismáticas", "pokemon-tcg", 210, "Caixa fechada, 10 pacotes.", "assets/produtos/box-eevee.jpg", 1],
  ["blister-triplo-escuridao-absoluta", "Blister Triplo Escuridão Absoluta", "pokemon-tcg", 42.5, "3 pacotes.", "assets/produtos/triple-escuridão.jpg", 2],
  ["blister-triplo-caos-ascendente", "Blister Triplo Caos Ascendente", "pokemon-tcg", 42.5, "3 pacotes.", "assets/produtos/triple-caos.jpg", 2],
  ["blister-unitario-equilibrio-perfeito", "Blister Unitário Equilíbrio Perfeito", "pokemon-tcg", 13, "Booster unico", "assets/produtos/buniequperf.jpg", 2],
  ["blister-unitario-escuridao-absoluta", "Blister Unitário Escuridão Absoluta", "pokemon-tcg", 13, "Booster unico", "assets/produtos/bunicoescabs.jpg", 2],
  ["bleach-remix-vol-2", "Bleach Remix Vol. 2", "mangas", 45, "Usado.", "assets/produtos/bleach2.jpg", 1],
  ["bleach-remix-vol-3", "Bleach Remix Vol. 3", "mangas", 45, "Usado.", "assets/produtos/bleach3.jpg", 1],
  ["bleach-remix-vol-4", "Bleach Remix Vol. 4", "mangas", 45, "Usado.", "assets/produtos/bleach4.jpg", 1],
  ["bleach-remix-vol-5", "Bleach Remix Vol. 5", "mangas", 45, "Usado.", "assets/produtos/bleach5.jpg", 1],
  ["radiant-vol-14", "Radiant Vol. 14", "mangas", 27, "Usado.", "assets/produtos/radiand14.jpg", 1],
  ["vagabond-vol-1", "Vagabond Vol. 1", "mangas", 36.5, "Novo.", "assets/produtos/vagabond1.jpg", 1],
  ["gantz-vol-3", "Gantz Vol. 3", "mangas", 27, "Novo.", "assets/produtos/gantz3.jpg", 1],
  ["gantz-vol-4", "Gantz Vol. 4", "mangas", 27, "Novo.", "assets/produtos/gantz4.jpg", 1],
  ["noragami-vol-23", "Noragami Vol. 23", "mangas", 22.99, "Usado.", "assets/produtos/noragami23.jpg", 1],
  ["sleeves-central-100un", "Sleeves Central (100un)", "acessorios", 23, "Tamanho padrão para cartas TCG.", "assets/produtos/sleevecentral.jpg", 18]
];
const insertProduct = database.prepare(`INSERT OR IGNORE INTO products (id, name, category, price, description, image, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const seedProducts = database.transaction(() => products.forEach((product) => insertProduct.run(...product)));
seedProducts();

const app = express();
app.use((request, response, next) => {
  const origin = request.get("origin");
  const allowedOrigins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    process.env.FRONTEND_ORIGIN
  ].filter(Boolean);
  if (allowedOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname, {
  setHeaders: (response) => response.setHeader("Cache-Control", "no-store")
}));

function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, derivedKey) => error ? reject(error) : resolve(`${salt}:${derivedKey.toString("hex")}`)));
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
function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  database.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(tokenHash, userId, expiresAt);
  return token;
}
function auth(request, response, next) {
  const token = request.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return response.status(401).json({ error: "Faça login para continuar." });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const session = database.prepare("SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > datetime('now')").get(tokenHash);
  if (!session) return response.status(401).json({ error: "Sessão expirada. Faça login novamente." });
  request.user = database.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id);
  next();
}
function adminAuth(request, response, next) {
  auth(request, response, () => {
    if (request.user.role !== "admin") return response.status(403).json({ error: "Acesso restrito ao administrador." });
    next();
  });
}
function validateCustomer(body) {
  const required = ["name", "cpf", "cep", "street", "neighborhood", "number"];
  return required.every((field) => String(body[field] || "").trim()) && normalizeCpf(body.cpf).length === 11;
}

app.get("/api/products", (request, response) => {
  response.json(database.prepare("SELECT id, name, category, price, description AS desc, image, stock FROM products WHERE active = 1 ORDER BY rowid").all());
});

app.get("/api/admin/products", adminAuth, (request, response) => {
  response.json(database.prepare("SELECT id, name, category, price, description AS desc, image, stock, active FROM products ORDER BY rowid").all());
});

app.patch("/api/admin/products/:id", adminAuth, (request, response) => {
  const { price, stock } = request.body;
  if (!Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) return response.status(400).json({ error: "Preço ou estoque inválido." });
  const result = database.prepare("UPDATE products SET price = ?, stock = ? WHERE id = ?").run(Number(price), Number(stock), request.params.id);
  if (!result.changes) return response.status(404).json({ error: "Produto não encontrado." });
  response.json({ success: true });
});

app.post("/api/admin/products", adminAuth, (request, response) => {
  const { id, name, category, price, desc, image, stock } = request.body;
  if (!id || !name || !category || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) return response.status(400).json({ error: "Preencha os dados do produto corretamente." });
  try {
    database.prepare("INSERT INTO products (id, name, category, price, description, image, stock) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, name.trim(), category, Number(price), String(desc || "").trim(), String(image || "").trim(), Number(stock));
    response.status(201).json({ success: true });
  } catch (error) {
    response.status(error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" ? 409 : 400).json({ error: error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" ? "Já existe um produto com esse ID." : "Não foi possível adicionar o produto." });
  }
});

app.delete("/api/admin/products/:id", adminAuth, (request, response) => {
  const result = database.prepare("UPDATE products SET active = 0 WHERE id = ?").run(request.params.id);
  if (!result.changes) return response.status(404).json({ error: "Produto não encontrado." });
  response.json({ success: true });
});

app.post("/api/auth/register", async (request, response) => {
  if (!validateCustomer(request.body) || String(request.body.password || "").length < 4) return response.status(400).json({ error: "Preencha os dados obrigatórios e uma senha de pelo menos 4 caracteres." });
  const data = request.body;
  const cpf = normalizeCpf(data.cpf);
  try {
    const passwordHash = await hashPassword(data.password);
    const result = database.prepare(`INSERT INTO users (name, cpf, cep, street, neighborhood, number, complement, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(data.name.trim(), cpf, data.cep.trim(), data.street.trim(), data.neighborhood.trim(), data.number.trim(), String(data.complement || "").trim(), passwordHash);
    const user = database.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    response.status(201).json({ user: publicUser(user), token: createSession(user.id) });
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    const duplicateCpf = error.code === "SQLITE_CONSTRAINT_UNIQUE";
    response.status(duplicateCpf ? 409 : 500).json({ error: duplicateCpf ? "Este CPF já possui uma conta." : `Não foi possível criar a conta: ${error.message}` });
  }
});

app.post("/api/auth/login", async (request, response) => {
  const cpf = normalizeCpf(request.body.cpf);
  const user = database.prepare("SELECT * FROM users WHERE cpf = ?").get(cpf);
  if (!user || !(await verifyPassword(String(request.body.password || ""), user.password_hash))) return response.status(401).json({ error: "CPF ou senha não encontrados." });
  response.json({ user: publicUser(user), token: createSession(user.id) });
});

app.get("/api/me", auth, (request, response) => response.json({ user: publicUser(request.user) }));

app.get("/api/orders", auth, (request, response) => {
  const orders = database.prepare("SELECT id, delivery, total, strftime('%d/%m/%Y', created_at) AS date FROM orders WHERE user_id = ? ORDER BY id DESC").all(request.user.id);
  const itemQuery = database.prepare("SELECT product_name AS name, quantity FROM order_items WHERE order_id = ?");
  response.json(orders.map((order) => ({ ...order, items: itemQuery.all(order.id) })));
});

app.post("/api/orders", auth, (request, response) => {
  const { delivery, items } = request.body;
  if (!["pickup", "shipping"].includes(delivery) || !Array.isArray(items) || items.length === 0) return response.status(400).json({ error: "Pedido inválido." });
  const getProduct = database.prepare("SELECT id, name, price, stock FROM products WHERE id = ? AND active = 1");
  const normalizedItems = [];
  let total = 0;
  for (const item of items) {
    const product = getProduct.get(item.id);
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) return response.status(400).json({ error: "Produto sem estoque ou quantidade inválida." });
    normalizedItems.push({ ...product, quantity });
    total += product.price * quantity;
  }
  const createOrder = database.transaction(() => {
    const orderResult = database.prepare("INSERT INTO orders (user_id, delivery, total) VALUES (?, ?, ?)").run(request.user.id, delivery, total);
    const addItem = database.prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
    const reduceStock = database.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    normalizedItems.forEach((item) => { addItem.run(orderResult.lastInsertRowid, item.id, item.name, item.quantity, item.price); reduceStock.run(item.quantity, item.id); });
    return orderResult.lastInsertRowid;
  });
  response.status(201).json({ orderId: createOrder() });
});

app.listen(PORT, () => console.log(`Grenin Geek Store: http://localhost:${PORT}`));
