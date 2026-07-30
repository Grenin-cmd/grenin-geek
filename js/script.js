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
const PRODUCTS = [
  { name: "Box Mega Luar Clefable", category: "pokemon-tcg", price: 125, desc: "Caixa fechada, 8 pacotes.", image: "assets/produtos/box-clefable.jpg", stock: 1 },
  { name: "Coleção Arco-Íris Evoluções Prismáticas", category: "pokemon-tcg", price: 210, desc: "Caixa fechada, 10 pacotes.", image: "assets/produtos/box-eevee.jpg", stock: 1 },
  { name: "Blister Triplo Escuridão Absoluta", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes.", image: "assets/produtos/triple-escuridão.jpg", stock: 2 },
  { name: "Blister Triplo Caos Ascendente", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes.", image: "assets/produtos/triple-caos.jpg", stock: 2 },
  { name: "Blister Unitário Equilíbrio Perfeito ", category: "pokemon-tcg", price: 13, desc: "Booster unico", image: "assets/produtos/buniequperf.jpg", stock: 2 },
  { name: "Blister Unitário Escuridão Absoluta ", category: "pokemon-tcg", price: 13, desc: "Booster unico", image: "assets/produtos/bunicoescabs.jpg", stock: 2 },
  { name: "Bleach Remix Vol. 2", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach2.jpg", stock: 1 },
  { name: "Bleach Remix Vol. 3", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach3.jpg", stock: 1 },
  { name: "Bleach Remix Vol. 4", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach4.jpg", stock: 1 },
  { name: "Bleach Remix Vol. 5", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach5.jpg", stock: 1 },
  { name: "Radiant Vol. 14", category: "mangas", price: 27, desc: "Usado.", image: "assets/produtos/radiand14.jpg", stock: 1 },
  { name: "Vagabond Vol. 1", category: "mangas", price: 36.50, desc: "Novo.", image: "assets/produtos/vagabond1.jpg", stock: 1 },
  { name: "Gantz Vol. 3", category: "mangas", price: 27, desc: "Novo.", image: "assets/produtos/gantz3.jpg", stock: 1 },
  { name: "Gantz Vol. 4", category: "mangas", price: 45, desc: "Novo.", image: "assets/produtos/gantz4.jpg", stock: 1 },
  { name: "Noragami Vol. 23", category: "mangas", price: 22.99, desc: "Usado.", image: "assets/produtos/noragami23.jpg", stock: 1 },
  { name: "Sleeves Central (100un)", category: "acessorios", price: 23, desc: "Tamanho padrão para cartas TCG.", image: "assets/produtos/sleevecentral.jpg", stock: 18 }
];

// Cupons de desconto — chave é o código (o cliente pode digitar em
// qualquer maiúscula/minúscula), valor é o percentual de desconto.
const COUPONS = {
  "GRENIN10": 0.10,
  "BEMVINDO5": 0.05
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
const PRODUCTS_BY_ID = {};
PRODUCTS.forEach((p) => { PRODUCTS_BY_ID[p.id] = p; });

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

finishOrderBtn.addEventListener("click", () => {
  if(cart.length === 0){
    alert("Seu carrinho está vazio!");
    return;
  }

  const lines = cart.map((item) => {
    const product = PRODUCTS_BY_ID[item.id];
    const subtotal = product.price * item.quantity;
    return `${item.quantity}x ${product.name} - ${formatBRL(subtotal)}`;
  }).join("\n");

  const subtotal = cartSubtotal();
  const discount = appliedCoupon ? subtotal * appliedCoupon.percent : 0;
  const total = subtotal - discount;

  let message = `Olá! Gostaria de fazer um pedido na Grenin Geek Store:\n\n${lines}\n\nSubtotal: ${formatBRL(subtotal)}`;

  if(appliedCoupon){
    message += `\nCupom ${appliedCoupon.code}: - ${formatBRL(discount)}`;
  }

  message += `\nTotal: ${formatBRL(total)}`;

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

renderProducts();
updateCart();
