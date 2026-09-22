/* =========================================================
   CONFIGURAÇÃO RÁPIDA — edite só esta parte para atualizar
   o catálogo, sem mexer no resto do código.
   ========================================================= */

// Número de WhatsApp da loja (só números, com DDI 55 + DDD)
const WHATSAPP_NUMBER = "5537999449137";

// Categorias: cor e rótulo usados nas abas e nas bordas dos cards
const CATEGORIES = {
  "pokemon-tcg":   { label: "Pokémon TCG",  color: "var(--type-electric)" },
  "mangas":        { label: "Mangás",       color: "var(--type-psychic)"  },
  "colecionaveis": { label: "Colecionável", color: "var(--type-fighting)" },
  "acessorios":    { label: "Acessório",    color: "var(--type-colorless)"}
};

// Lista de produtos — troque nome, categoria, preço, descrição e imagem.
// O campo "image" é opcional: se não tiver, aparece um placeholder colorido no lugar da foto.
// O campo "stock" é a quantidade em estoque: quando chegar a 0, o produto
// aparece com o selo "Esgotado" e o botão de adicionar ao carrinho é desativado.
let PRODUCTS = [
  { name: "Box Mega Luar Clefable", category: "pokemon-tcg", price: 125, desc: "Caixa fechada, 8 pacotes.", image: "assets/produtos/box-clefable.jpg", stock: 0 },
  { name: "Coleção Arco-Íris Evoluções Prismáticas", category: "pokemon-tcg", price: 210, desc: "Caixa fechada, 10 pacotes.", image: "assets/produtos/box-eevee.jpg", stock: 0 },
  { name: "Blister Triplo Escuridão Absoluta", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes.", image: "assets/produtos/triple-escuridão.jpg", stock: 0 },
  { name: "Blister Triplo Caos Ascendente", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes.", image: "assets/produtos/triple-caos.jpg", stock: 0 },
  { name: "Blister Unitário Equilíbrio Perfeito ", category: "pokemon-tcg", price: 13, desc: "Booster unico", image: "assets/produtos/buniequperf.jpg", stock: 1 },
  { name: "Blister Unitário Escuridão Absoluta ", category: "pokemon-tcg", price: 13, desc: "Booster unico", image: "assets/produtos/bunicoescabs.jpg", stock: 0 },
  { name: "Bleach Remix Vol. 2", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach2.jpg", stock: 1 },
  { name: "Bleach Remix Vol. 3", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach3.jpg", stock: 1 },
  { name: "Bleach Remix Vol. 4", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach4.jpg", stock: 1 },
  { name: "Bleach Remix Vol. 5", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach5.jpg", stock: 1 },
  { name: "Radiant Vol. 14", category: "mangas", price: 27, desc: "Usado.", image: "assets/produtos/radiand14.jpg", stock: 1 },
  { name: "Vagabond Vol. 1", category: "mangas", price: 36.50, desc: "Novo.", image: "assets/produtos/vagabond1.jpg", stock: 1 },
  { name: "Gantz Vol. 3", category: "mangas", price: 27, desc: "Novo.", image: "assets/produtos/gantz3.jpg", stock: 1 },
  { name: "Gantz Vol. 4", category: "mangas", price: 27, desc: "Novo.", image: "assets/produtos/gantz4.jpg", stock: 1 },
  { name: "Noragami Vol. 23", category: "mangas", price: 22.99, desc: "Usado.", image: "assets/produtos/noragami23.jpg", stock: 1 },
  { name: "Sleeves Central (100un)", category: "acessorios", price: 23, desc: "Tamanho padrão para cartas TCG.", image: "assets/produtos/sleevecentral.jpg", stock: 16 }
];

// Cupons de desconto — chave é o código (o cliente pode digitar em
// qualquer maiúscula/minúscula), valor é o percentual de desconto.
const COUPONS = {
  "GRENIN10": 0.10,
  "BEMVINDO5": 0.05,
   "MESTREDASEMANA": 0.15,
   "TREINADOR10": 0.10
};

/* =========================================================
   HELPERS — funções pequenas reutilizadas em vários lugares
   ========================================================= */

function formatBRL(value){
  return "R$ " + value.toFixed(2).replace(".", ",");
}

function whatsappLink(message){
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
}

// Remove acentos e deixa em minúsculas, pra "colecao" encontrar "Coleção", por exemplo.
function normalize(str){
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Cada produto ganha um "id" fixo baseado no nome — diferente da posição
// na lista (que muda toda vez que um produto novo é inserido no meio),
// o nome não muda, então é seguro usar como identidade no carrinho.
PRODUCTS.forEach((p) => { p.id = normalize(p.name); });
let PRODUCTS_BY_ID = {};
PRODUCTS.forEach((p) => { PRODUCTS_BY_ID[p.id] = p; });

const configuredApiUrl = window.GRENIN_API_URL || "";
const API_BASE = configuredApiUrl
  ? configuredApiUrl.replace(/\/$/, "")
  : window.location.protocol === "file:" || window.location.port === "8000"
  ? "http://localhost:3000/api"
  : "/api";
const SESSION_TOKEN_KEY = "grenin-session-token";

async function loadProducts(){
  const response = await fetch(`${API_BASE}/products`);
  if(!response.ok) throw new Error("Não foi possível carregar os produtos.");
  PRODUCTS = await response.json();
  PRODUCTS_BY_ID = {};
  PRODUCTS.forEach((product) => { PRODUCTS_BY_ID[product.id] = product; });
  cart = cart.filter((item) => PRODUCTS_BY_ID[item.id]);
  saveCart();
}

/* =========================================================
   CATÁLOGO
   ========================================================= */

const binder = document.getElementById("binder");
const tabs = document.getElementById("tabs");
const footerWhats = document.getElementById("footer-whats");
footerWhats.textContent = "+" + WHATSAPP_NUMBER.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "$1 ($2) $3-$4");

function knowMoreLink(productName){
  return whatsappLink(
    `Olá!\n\nTenho interesse em saber mais sobre:\n${productName}\n\nPode me passar mais informações?`
  );
}

let currentFilter = "all";
let currentSort = "default";

// Retorna os produtos na ordem certa, mas sempre lembrando o índice
// original — é esse índice original que identifica o produto no
// carrinho, então a ordenação na tela nunca pode bagunçar isso.
function getSortedProducts(){
  const withIndex = PRODUCTS.map((p, originalIndex) => ({ p, originalIndex }));

  if(currentSort === "price-asc"){
    withIndex.sort((a, b) => a.p.price - b.p.price);
  } else if(currentSort === "price-desc"){
    withIndex.sort((a, b) => b.p.price - a.p.price);
  }

  return withIndex;
}

function renderProducts(){
  binder.innerHTML = "";
  getSortedProducts().forEach(({ p }) => {
    const cat = CATEGORIES[p.category];
    const outOfStock = p.stock === 0;

    const card = document.createElement("article");
    card.className = "card" + (outOfStock ? " out-of-stock" : "");
    card.dataset.category = p.category;
    card.dataset.name = normalize(p.name);
    card.style.setProperty("--cardcolor", cat.color);

    const imageHtml = p.image
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
      : "Imagem do produto";

    const cardImgClass = "card-img" + (p.image ? " has-photo" : "");

    const stockBadgeHtml = outOfStock ? `<span class="stock-badge">Esgotado</span>` : "";

    const cartButtonHtml = outOfStock
      ? `<button type="button" class="btn-cart" disabled>Esgotado</button>`
      : `<button type="button" class="btn-cart" data-id="${p.id}">🛒 Adicionar ao Carrinho</button>`;

    card.innerHTML = `
      <div class="card-top">
        <span class="type-label"><span class="dot"></span>${cat.label}</span>
      </div>
      <div class="${cardImgClass}">${imageHtml}${stockBadgeHtml}</div>
      <h3>${p.name}</h3>
      <p class="desc">${p.desc}</p>
      <div class="card-stats">
        <span class="price"><small>R$</small> ${p.price.toFixed(2).replace(".", ",")}</span>
      </div>
      <div class="product-buttons">
        ${cartButtonHtml}
        <a class="btn-more" href="${knowMoreLink(p.name)}" target="_blank" rel="noopener">Saber Mais</a>
      </div>
    `;
    binder.appendChild(card);
  });

  initImageSkeletons();
  applyFilters();
}

// Assim que cada foto termina de carregar (ou dá erro), tira o efeito
// de "brilho passando" e mostra a imagem de verdade.
function initImageSkeletons(){
  document.querySelectorAll(".card-img.has-photo img").forEach((img) => {
    const wrapper = img.closest(".card-img");
    const markLoaded = () => wrapper.classList.add("is-loaded");

    if(img.complete && img.naturalWidth > 0){
      markLoaded();
    } else {
      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", markLoaded, { once: true });
    }
  });
}

let currentSearch = "";
const noResultsEl = document.getElementById("noResults");

function applyFilters(){
  let visibleCount = 0;

  document.querySelectorAll(".card").forEach((card) => {
    const matchesCategory = currentFilter === "all" || card.dataset.category === currentFilter;
    const matchesSearch = !currentSearch || card.dataset.name.includes(currentSearch);
    const show = matchesCategory && matchesSearch;
    card.classList.toggle("is-hidden", !show);
    if(show) visibleCount++;
  });

  noResultsEl.style.display = visibleCount === 0 ? "block" : "none";
}

tabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if(!btn) return;
  tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  currentFilter = btn.dataset.filter;
  applyFilters();
});

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", () => {
  currentSearch = normalize(searchInput.value.trim());
  applyFilters();
});

const sortSelect = document.getElementById("sortSelect");
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  renderProducts();
});

// Um único listener no container cuida de todos os botões "Adicionar ao Carrinho",
// mesmo que os cards sejam recriados — evita precisar de onclick="" inline.
binder.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-cart");
  if(!btn) return;
  addToCart(btn.dataset.id, btn);
});

/* =========================================================
   CARRINHO
   ========================================================= */

const CART_STORAGE_KEY = "grenin-cart";
let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

// Descarta qualquer item de carrinho salvo antes dessa correção (o sistema
// antigo guardava a posição do produto na lista, não o nome — se a lista
// mudar de ordem, essa posição vira referência de outro produto).
cart = cart.filter((item) => item && typeof item.id === "string" && PRODUCTS_BY_ID[item.id]);

const cartButton = document.getElementById("cartButton");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const closeCartBtn = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartDiscountRow = document.getElementById("cartDiscountRow");
const cartDiscountLabelEl = document.getElementById("cartDiscountLabel");
const cartDiscountValueEl = document.getElementById("cartDiscountValue");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const finishOrderBtn = document.getElementById("finishOrder");
const questionOrderBtn = document.getElementById("questionOrder");
const couponInput = document.getElementById("couponInput");
const applyCouponBtn = document.getElementById("applyCoupon");
const couponMessageEl = document.getElementById("couponMessage");

let appliedCoupon = null; // { code, percent } ou null se nenhum cupom aplicado

const accountButton = document.getElementById("accountButton");
const accountLabel = document.getElementById("accountLabel");
const accountModal = document.getElementById("accountModal");
const checkoutModal = document.getElementById("checkoutModal");
const authView = document.getElementById("authView");
const accountView = document.getElementById("accountView");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const accountSummary = document.getElementById("accountSummary");
const orderHistory = document.getElementById("orderHistory");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutTotal = document.getElementById("checkoutTotal");
const checkoutMessage = document.getElementById("checkoutMessage");
const adminPanel = document.getElementById("adminPanel");
const adminProducts = document.getElementById("adminProducts");
const adminMessage = document.getElementById("adminMessage");
const newProductForm = document.getElementById("newProductForm");

let sessionToken = localStorage.getItem(SESSION_TOKEN_KEY) || "";
let sessionUser = null;

async function apiRequest(endpoint, options = {}){
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if(sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch(error) {
    throw new Error("A API está desligada. Execute `npm start` no terminal e acesse http://localhost:3000.");
  }
  const data = await response.json().catch(() => ({}));
  if(!response.ok) throw new Error(data.error || data.message || "Não foi possível concluir a operação.");
  return data;
}

function normalizeCpf(cpf){
  return cpf.replace(/\D/g, "");
}

function currentUser(){
  return sessionUser;
}

function setMessage(element, message, type){
  element.textContent = message;
  element.className = "form-message" + (type ? " " + type : "");
}

function openModal(modal){
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modal){
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  if(!document.querySelector(".modal-backdrop.active")) document.body.style.overflow = "";
}

async function renderAccount(){
  const user = currentUser();
  accountLabel.textContent = user ? user.name.split(" ")[0] : "Entrar";
  authView.classList.toggle("is-hidden", Boolean(user));
  accountView.classList.toggle("is-hidden", !user);

  if(!user) return;
  accountSummary.innerHTML = `<strong>${user.name}</strong><span>CPF ${user.cpf}</span><small>${user.street}, ${user.number} · ${user.neighborhood} · CEP ${user.cep}</small>`;
  let orders = [];
  try {
    orders = await apiRequest("/orders");
  } catch(error) {
    orderHistory.innerHTML = `<p class="empty-history">Não foi possível carregar seu histórico agora.</p>`;
    return;
  }
  orderHistory.innerHTML = orders.length ? orders.slice().reverse().map((order) => `
    <article class="order-card"><div><strong>Pedido #${order.id}</strong><small>${order.date} · ${order.delivery === "shipping" ? "Envio" : "Retirada"}</small></div><b>${formatBRL(order.total)}</b><p>${order.items.map((item) => `${item.quantity}x ${item.name}`).join(" · ")}</p></article>
  `).join("") : `<p class="empty-history">Você ainda não fez nenhuma compra.</p>`;
  adminPanel.classList.toggle("is-hidden", !user.isAdmin);
  if(user.isAdmin) await renderAdminProducts();
}

async function renderAdminProducts(){
  try {
    const products = await apiRequest("/admin/products");
    adminProducts.innerHTML = products.map((product) => `
      <article class="admin-product ${product.active ? "" : "is-inactive"}" data-admin-product="${product.id}">
        <div><strong>${product.name}</strong><small>${product.active ? "Ativo" : "Desativado"} · ${product.id}</small></div>
        <label>Preço<input data-admin-price type="number" min="0" step="0.01" value="${product.price}"></label>
        <label>Estoque<input data-admin-stock type="number" min="0" step="1" value="${product.stock}"></label>
        <button type="button" data-admin-save>Salvar</button>
        ${product.active ? `<button type="button" class="admin-delete" data-admin-delete>Desativar</button>` : ""}
      </article>
    `).join("");
  } catch(error) {
    setMessage(adminMessage, error.message, "error");
  }
}

newProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(newProductForm);
  try {
    await apiRequest("/admin/products", { method: "POST", body: JSON.stringify(Object.fromEntries(data)) });
    newProductForm.reset();
    setMessage(adminMessage, "Produto adicionado.", "success");
    await loadProducts();
    renderProducts();
    await renderAdminProducts();
  } catch(error) {
    setMessage(adminMessage, error.message, "error");
  }
});

adminProducts.addEventListener("click", async (event) => {
  const productCard = event.target.closest("[data-admin-product]");
  if(!productCard) return;
  const id = productCard.dataset.adminProduct;
  try {
    if(event.target.closest("[data-admin-save]")){
      await apiRequest(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify({ price: Number(productCard.querySelector("[data-admin-price]").value), stock: Number(productCard.querySelector("[data-admin-stock]").value) }) });
      setMessage(adminMessage, "Produto atualizado.", "success");
      await loadProducts();
      renderProducts();
      await renderAdminProducts();
    }
    if(event.target.closest("[data-admin-delete]") && confirm("Desativar este produto do catálogo?")){
      await apiRequest(`/admin/products/${id}`, { method: "DELETE" });
      setMessage(adminMessage, "Produto desativado.", "success");
      await loadProducts();
      renderProducts();
      await renderAdminProducts();
    }
  } catch(error) {
    setMessage(adminMessage, error.message, "error");
  }
});

function openAccount(){
  renderAccount();
  openModal(accountModal);
}

accountButton.addEventListener("click", openAccount);
document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => closeModal(document.getElementById(button.dataset.closeModal)));
});
document.querySelectorAll(".modal-backdrop").forEach((modal) => {
  modal.addEventListener("click", (event) => { if(event.target === modal) closeModal(modal); });
});
document.querySelectorAll("[data-auth-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    loginForm.classList.toggle("is-hidden", button.dataset.authView !== "login");
    registerForm.classList.toggle("is-hidden", button.dataset.authView !== "register");
    setMessage(loginMessage, "", "");
    setMessage(registerMessage, "", "");
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  try {
    const result = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ cpf: data.get("cpf"), password: data.get("password") }) });
    sessionToken = result.token;
    sessionUser = result.user;
    localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    loginForm.reset();
    await renderAccount();
    setMessage(loginMessage, "", "");
  } catch(error) {
    setMessage(loginMessage, error.message, "error");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(registerForm);
  const cpf = normalizeCpf(data.get("cpf"));
  if(cpf.length !== 11){
    setMessage(registerMessage, "Digite um CPF válido com 11 números.", "error");
    return;
  }
  try {
    const result = await apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ name: data.get("name"), cpf, cep: data.get("cep"), street: data.get("street"), neighborhood: data.get("neighborhood"), number: data.get("number"), complement: data.get("complement"), password: data.get("password") }) });
    sessionToken = result.token;
    sessionUser = result.user;
    localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    registerForm.reset();
    await renderAccount();
  } catch(error) {
    setMessage(registerMessage, error.message || "Não foi possível criar a conta.", "error");
  }
});

document.getElementById("logoutButton").addEventListener("click", () => {
  sessionToken = "";
  sessionUser = null;
  localStorage.removeItem(SESSION_TOKEN_KEY);
  renderAccount();
});

function saveCart(){
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function openCart(){
  cartSidebar.classList.add("active");
  cartOverlay.classList.add("active");
}

function closeCart(){
  cartSidebar.classList.remove("active");
  cartOverlay.classList.remove("active");
}

cartButton.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

function bumpCartButton(){
  cartButton.classList.remove("bump");
  void cartButton.offsetWidth; // reinicia a animação mesmo em cliques seguidos
  cartButton.classList.add("bump");
}

function getCartQuantity(id){
  const item = cart.find((i) => i.id === id);
  return item ? item.quantity : 0;
}

function addToCart(id, btnEl){
  const product = PRODUCTS_BY_ID[id];
  const currentQty = getCartQuantity(id);

  // Não deixa adicionar além do que existe em estoque
  if(currentQty >= product.stock){
    if(btnEl){
      const original = btnEl.textContent;
      btnEl.classList.add("limit");
      btnEl.textContent = "Limite em estoque!";
      setTimeout(() => {
        btnEl.classList.remove("limit");
        btnEl.textContent = original;
      }, 1200);
    }
    return;
  }

  const existing = cart.find((item) => item.id === id);

  if(existing){
    existing.quantity += 1;
  } else {
    cart.push({ id: id, quantity: 1 });
  }

  saveCart();
  updateCart();
  bumpCartButton();
  openCart();

  if(btnEl){
    const original = btnEl.textContent;
    btnEl.classList.add("added");
    btnEl.textContent = "✓ Adicionado";
    setTimeout(() => {
      btnEl.classList.remove("added");
      btnEl.textContent = original;
    }, 900);
  }
}

function changeQuantity(id, delta){
  const item = cart.find((i) => i.id === id);
  if(!item) return;

  const product = PRODUCTS_BY_ID[item.id];

  // Não deixa aumentar além do que existe em estoque
  if(delta > 0 && item.quantity >= product.stock){
    return;
  }

  item.quantity += delta;
  if(item.quantity <= 0){
    cart = cart.filter((i) => i.id !== id);
  }

  saveCart();
  updateCart();
}

function removeFromCart(id){
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCart();
}

// Delegação de eventos: um listener só, cuida de +, − e remover em qualquer item
cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if(!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if(action === "inc") changeQuantity(id, 1);
  if(action === "dec") changeQuantity(id, -1);
  if(action === "remove") removeFromCart(id);
});

function cartSubtotal(){
  return cart.reduce((sum, item) => sum + PRODUCTS_BY_ID[item.id].price * item.quantity, 0);
}

function updateCart(){
  if(cart.length === 0){
    cartItemsEl.innerHTML = `<p class="cart-empty">Seu carrinho está vazio.<br>Adicione produtos do catálogo para começar.</p>`;
    cartSubtotalEl.textContent = formatBRL(0);
    cartDiscountRow.classList.remove("show");
    cartTotalEl.textContent = formatBRL(0);
    cartCountEl.textContent = "0";
    return;
  }

  let count = 0;

  cartItemsEl.innerHTML = cart.map((item) => {
    const product = PRODUCTS_BY_ID[item.id];
    const subtotal = product.price * item.quantity;
    count += item.quantity;

    const imageHtml = product.image
      ? `<img src="${product.image}" alt="${product.name}">`
      : "";

    const atLimit = item.quantity >= product.stock;
    const limitMessage = atLimit ? `<p class="cart-item-limit">Limite em estoque atingido</p>` : "";

    return `
      <div class="cart-item">
        ${imageHtml}
        <div class="cart-info">
          <h4>${product.name}</h4>
          <p>${formatBRL(product.price)} cada</p>
          <div class="cart-controls">
            <button type="button" data-action="dec" data-id="${item.id}" aria-label="Diminuir quantidade">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="inc" data-id="${item.id}" aria-label="Aumentar quantidade" ${atLimit ? "disabled" : ""}>+</button>
            <button type="button" data-action="remove" data-id="${item.id}" aria-label="Remover item">🗑️</button>
          </div>
          ${limitMessage}
        </div>
      </div>
    `;
  }).join("");

  const subtotal = cartSubtotal();
  const discount = appliedCoupon ? subtotal * appliedCoupon.percent : 0;
  const total = subtotal - discount;

  cartSubtotalEl.textContent = formatBRL(subtotal);
  cartCountEl.textContent = String(count);

  if(appliedCoupon){
    cartDiscountRow.classList.add("show");
    cartDiscountLabelEl.textContent = appliedCoupon.code;
    cartDiscountValueEl.textContent = "- " + formatBRL(discount);
  } else {
    cartDiscountRow.classList.remove("show");
  }

  cartTotalEl.textContent = formatBRL(total);
}

applyCouponBtn.addEventListener("click", () => {
  const code = couponInput.value.trim().toUpperCase();

  if(!code){
    couponMessageEl.textContent = "Digite um código de cupom.";
    couponMessageEl.className = "coupon-message error";
    return;
  }

  if(COUPONS[code]){
    appliedCoupon = { code: code, percent: COUPONS[code] };
    couponMessageEl.textContent = `Cupom aplicado! ${Math.round(COUPONS[code] * 100)}% de desconto.`;
    couponMessageEl.className = "coupon-message success";
  } else {
    appliedCoupon = null;
    couponMessageEl.textContent = "Cupom inválido.";
    couponMessageEl.className = "coupon-message error";
  }

  updateCart();
});

function orderTotals(delivery = "pickup"){
  const subtotal = cartSubtotal();
  const discount = appliedCoupon ? subtotal * appliedCoupon.percent : 0;
  return { subtotal, discount, shipping: 0, total: subtotal - discount };
}

function openCheckout(){
  if(cart.length === 0){
    alert("Seu carrinho está vazio!");
    return;
  }
  if(!currentUser()){
    openAccount();
    setMessage(loginMessage, "Entre ou crie sua conta para finalizar a compra.", "error");
    return;
  }
  checkoutMessage.textContent = "";
  checkoutTotal.textContent = formatBRL(orderTotals().total);
  openModal(checkoutModal);
}

finishOrderBtn.addEventListener("click", openCheckout);
document.querySelectorAll("input[name=delivery]").forEach((input) => {
  input.addEventListener("change", () => {
    checkoutTotal.textContent = formatBRL(orderTotals(input.value).total);
  });
});

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = currentUser();
  if(!user){
    closeModal(checkoutModal);
    openAccount();
    return;
  }
  const delivery = new FormData(checkoutForm).get("delivery");
  const totals = orderTotals(delivery);
  try {
    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify({ delivery, items: cart.map((item) => ({ id: item.id, quantity: item.quantity })) })
    });
  } catch(error) {
    setMessage(checkoutMessage, error.message, "error");
    return;
  }
  const lines = cart.map((item) => {
    const product = PRODUCTS_BY_ID[item.id];
    return `${item.quantity}x ${product.name} - ${formatBRL(product.price * item.quantity)}`;
  }).join("\n");
  let message = `Olá! Gostaria de fazer um pedido na Grenin Geek Store:\n\n${lines}\n\nSubtotal: ${formatBRL(totals.subtotal)}`;
  if(appliedCoupon) message += `\nCupom ${appliedCoupon.code}: - ${formatBRL(totals.discount)}`;
  message += delivery === "shipping" ? "\nForma de recebimento: Envio\nA taxa de envio poderá ser cobrada." : "\nForma de recebimento: Retirada na loja";
  message += `\nTotal: ${formatBRL(totals.total)}\n\nCliente: ${user.name}\nCPF: ${user.cpf}\nEndereço: ${user.street}, ${user.number}, ${user.neighborhood}, CEP ${user.cep}. ${user.complement}`;

  cart = [];
  saveCart();
  updateCart();
  closeModal(checkoutModal);
  closeCart();
  renderAccount();
  window.open(whatsappLink(message), "_blank", "noopener");
});

questionOrderBtn.addEventListener("click", () => {
  if(cart.length === 0){
    alert("Seu carrinho está vazio! Adicione produtos para tirar dúvidas sobre eles.");
    return;
  }

  const lines = cart.map((item) => "- " + PRODUCTS_BY_ID[item.id].name).join("\n");
  const message =
    `Olá! Tenho dúvidas sobre os seguintes produtos:\n${lines}`;

  window.open(whatsappLink(message), "_blank", "noopener");
});

/* =========================================================
   ZOOM NA IMAGEM (LIGHTBOX)
   ========================================================= */

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox(src, alt){
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox(){
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

// Clique em qualquer foto de produto dentro do catálogo abre o zoom
binder.addEventListener("click", (e) => {
  const img = e.target.closest(".card-img img");
  if(!img) return;
  openLightbox(img.src, img.alt);
});

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if(e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeLightbox();
});

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function initializeStore(){
  try {
    await loadProducts();
  } catch(error) {
    console.error(error);
  }
  if(sessionToken){
    try {
      const result = await apiRequest("/me");
      sessionUser = result.user;
    } catch(error) {
      sessionToken = "";
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }
  renderProducts();
  updateCart();
  await renderAccount();
}

initializeStore();
