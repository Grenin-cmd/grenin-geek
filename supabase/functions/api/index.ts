import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("STORE_SERVICE_ROLE_KEY")!
);
const adminCpf = "14517447650";
const cardConditions = new Set(["NM", "SP", "MP", "HP", "DMG"]);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function normalizeCpf(value: unknown) { return String(value || "").replace(/\D/g, ""); }
function bytesToBase64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function base64ToBytes(value: string) { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); }
async function passwordHash(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return `pbkdf2:100000:${bytesToBase64(salt)}:${bytesToBase64(new Uint8Array(bits))}`;
}
async function verifyPassword(password: string, stored: string) {
  const [, iterations, salt, expected] = stored.split(":");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: base64ToBytes(salt), iterations: Number(iterations), hash: "SHA-256" }, key, 256);
  return bytesToBase64(new Uint8Array(bits)) === expected;
}
async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function publicUser(user: Record<string, unknown>) {
  return { id: user.id, name: user.name, cpf: user.cpf, cep: user.cep, street: user.street, neighborhood: user.neighborhood, number: user.number, complement: user.complement, isAdmin: user.role === "admin" };
}
async function createSession(userId: number) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const { error } = await supabase.from("sessions").insert({ token_hash: await tokenHash(token), user_id: userId, expires_at: new Date(Date.now() + 30 * 86400000).toISOString() });
  if (error) throw error;
  return token;
}
async function authenticate(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabase.from("sessions").select("user_id, users(*)").eq("token_hash", await tokenHash(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  return data?.users || null;
}
function route(request: Request) {
  return new URL(request.url).pathname
    .replace(/^\/functions\/v1\/api\/?/, "")
    .replace(/^\/api\/?/, "")
    .replace(/^\/?/, "");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const path = route(request);
    const body = request.method === "GET" ? {} : await request.json().catch(() => ({}));

    if (request.method === "GET" && path === "products") {
      const { data, error } = await supabase.from("products").select("id,name,category,price,desc:description,image,stock,is_preorder,condition:card_condition").eq("active", true).order("id");
      if (error) throw error;
      return json(data?.map((product) => ({ ...product, price: Number(product.price) })) || []);
    }

    if (path === "auth/register" && request.method === "POST") {
      const cpf = normalizeCpf(body.cpf);
      if (!body.name || cpf.length !== 11 || !body.cep || !body.street || !body.neighborhood || !body.number || String(body.password || "").length < 4) return json({ error: "Preencha os dados obrigatórios e uma senha de pelo menos 4 caracteres." }, 400);
      const { data: user, error } = await supabase.from("users").insert({ name: body.name.trim(), cpf, cep: body.cep.trim(), street: body.street.trim(), neighborhood: body.neighborhood.trim(), number: body.number.trim(), complement: String(body.complement || "").trim(), password_hash: await passwordHash(body.password), role: cpf === adminCpf ? "admin" : "customer" }).select().single();
      if (error) {
        console.error("REGISTER_ERROR", error);
        return json({ error: error.code === "23505" ? "Este CPF já possui uma conta." : "Não foi possível criar a conta." }, error.code === "23505" ? 409 : 500);
      }
      return json({ user: publicUser(user), token: await createSession(user.id) }, 201);
    }

    if (path === "auth/login" && request.method === "POST") {
      const { data: user } = await supabase.from("users").select().eq("cpf", normalizeCpf(body.cpf)).maybeSingle();
      if (!user || !(await verifyPassword(String(body.password || ""), user.password_hash))) return json({ error: "CPF ou senha não encontrados." }, 401);
      return json({ user: publicUser(user), token: await createSession(user.id) });
    }

    const user = await authenticate(request);
    if (["me", "orders", "coupons", "admin/products"].some((item) => path === item || path.startsWith(`${item}/`)) && !user) return json({ error: "Faça login para continuar." }, 401);
    if (path.startsWith("admin/") && user.role !== "admin") return json({ error: "Acesso restrito ao administrador." }, 403);

    if (path === "me" && request.method === "GET") return json({ user: publicUser(user) });
    const couponCode = path.match(/^coupons\/([^/]+)$/)?.[1];
    if (couponCode && request.method === "GET") {
      const normalizedCode = decodeURIComponent(couponCode).trim().toUpperCase();
      const { data: coupon, error } = await supabase.from("coupons").select("code,percent_off,starts_at,expires_at").eq("code", normalizedCode).maybeSingle();
      if (error) throw error;
      if (!coupon) return json({ error: "Cupom inválido." }, 404);
      const now = Date.now();
      if (new Date(coupon.starts_at).getTime() > now || new Date(coupon.expires_at).getTime() <= now) return json({ error: "Este cupom expirou ou ainda não está disponível." }, 400);
      const { data: redemption, error: redemptionError } = await supabase.from("coupon_redemptions").select("coupon_code").eq("coupon_code", coupon.code).eq("user_id", user.id).maybeSingle();
      if (redemptionError) throw redemptionError;
      if (redemption) return json({ error: "Este cupom já foi utilizado nesta conta." }, 409);
      return json({ code: coupon.code, percent: Number(coupon.percent_off) });
    }
    if (path === "orders" && request.method === "GET") {
      const { data: orders, error } = await supabase.from("orders").select("id,delivery,total,created_at,order_items(name:product_name,quantity)").eq("user_id", user.id).order("id", { ascending: false });
      if (error) throw error;
      return json(orders?.map((order) => ({ ...order, total: Number(order.total), date: new Date(order.created_at).toLocaleDateString("pt-BR"), items: order.order_items })) || []);
    }
    if (path === "orders" && request.method === "POST") {
      const { data: orderId, error } = await supabase.rpc("create_store_order", {
        p_user_id: user.id,
        p_delivery: body.delivery,
        p_items: body.items,
        p_coupon_code: typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() || null : null
      });
      if (error) return json({ error: error.message }, 400);
      return json({ orderId }, 201);
    }

    if (path === "admin/products" && request.method === "GET") {
      const { data, error } = await supabase.from("products").select("id,name,category,price,desc:description,image,stock,is_preorder,active,condition:card_condition").order("id");
      if (error) throw error;
      return json(data?.map((product) => ({ ...product, price: Number(product.price) })) || []);
    }
    const productId = path.match(/^admin\/products\/(.+)$/)?.[1];
    if (productId && request.method === "PATCH") {
      const name = String(body.name || "").trim();
      const category = String(body.category || "");
      const cardCondition = String(body.condition || "");
      if (!name || !Number.isFinite(Number(body.price)) || Number(body.price) < 0 || !Number.isInteger(Number(body.stock)) || Number(body.stock) < 0 || (category === "cartas" && !cardConditions.has(cardCondition))) return json({ error: "Revise os dados do produto e a conservação da carta." }, 400);
      const { data, error } = await supabase.from("products").update({ name, category, price: Number(body.price), stock: Number(body.stock), description: String(body.desc || "").trim(), image: String(body.image || "").trim() || null, active: body.active === true, is_preorder: body.is_preorder === true, card_condition: category === "cartas" ? cardCondition : null }).eq("id", productId).select().maybeSingle();
      if (error || !data) return json({ error: "Produto não encontrado ou dados inválidos." }, 400);
      return json({ success: true });
    }
    if (productId && request.method === "DELETE") {
      const { error } = await supabase.from("products").update({ active: false }).eq("id", productId);
      if (error) throw error;
      return json({ success: true });
    }
    if (path === "admin/products" && request.method === "POST") {
      const category = String(body.category || "");
      const cardCondition = String(body.condition || "");
      if (!body.id || !String(body.name || "").trim() || !Number.isFinite(Number(body.price)) || Number(body.price) < 0 || !Number.isInteger(Number(body.stock)) || Number(body.stock) < 0 || (category === "cartas" && !cardConditions.has(cardCondition))) return json({ error: "Revise os dados do produto e a conservação da carta." }, 400);
      const { error } = await supabase.from("products").insert({ id: body.id, name: String(body.name).trim(), category, price: Number(body.price), description: String(body.desc || "").trim(), image: String(body.image || "").trim() || null, stock: Number(body.stock), is_preorder: body.is_preorder === true, active: body.active !== false, card_condition: category === "cartas" ? cardCondition : null });
      if (error) return json({ error: error.code === "23505" ? "Já existe um produto com esse ID." : "Não foi possível adicionar o produto." }, 400);
      return json({ success: true }, 201);
    }
    return json({ error: "Rota não encontrada." }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: "Erro interno do servidor." }, 500);
  }
});
