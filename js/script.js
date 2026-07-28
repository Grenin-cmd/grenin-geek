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
const PRODUCTS = [
  { name: "Box Mega Luar Clefable", category: "pokemon-tcg", price: 125, desc: "Caixa fechada, 8 pacotes.", image: "assets/produtos/box-clefable.jpg" },
  { name: "Coleção Arco-Íris Evoluções Prismáticas", category: "pokemon-tcg", price: 210, desc: "Caixa fechada, 10 pacotes.", image: "assets/produtos/box-eevee.jpg" },
  { name: "Blister Triplo Escuridão Absoluta", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes.", image: "assets/produtos/triple-escuridão.jpg" },
  { name: "Blister Triplo Caos Ascendente", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes.", image: "assets/produtos/triple-caos.jpg" },
  { name: "Bleach Remix Vol. 2", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach2.jpg" },
  { name: "Bleach Remix Vol. 3", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach3.jpg" },
  { name: "Bleach Remix Vol. 4", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach4.jpg" },
  { name: "Bleach Remix Vol. 5", category: "mangas", price: 45, desc: "Usado.", image: "assets/produtos/bleach5.jpg" },
  { name: "Radiant Vol. 14", category: "mangas", price: 27, desc: "Usado.", image: "assets/produtos/radiand14.jpg" },
  { name: "Vagabond Vol. 1", category: "mangas", price: 36.50, desc: "Novo.", image: "assets/produtos/vagabond1.jpg" },
  { name: "Gantz Vol. 3", category: "mangas", price: 27, desc: "Novo.", image: "assets/produtos/gantz3.jpg" },
  { name: "Gantz Vol. 4", category: "mangas", price: 45, desc: "Novo.", image: "assets/produtos/gantz4.jpg" },
  { name: "Noragami Vol. 23", category: "mangas", price: 22.99, desc: "Usado.", image: "assets/produtos/noragami23.jpg" },
  { name: "Sleeves Central (100un)", category: "acessorios", price: 23, desc: "Tamanho padrão para cartas TCG." }
];

/* =========================================================
   HELPERS — funções pequenas reutilizadas em vários lugares
   ========================================================= */

function formatBRL(value){
  return "R$ " + value.toFixed(2).replace(".", ",");
}

function whatsappLink(message){
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
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

function renderProducts(){
  binder.innerHTML = "";
  PRODUCTS.forEach((p, index) => {
    const cat = CATEGORIES[p.category];
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.category = p.category;
    card.style.setProperty("--cardcolor", cat.color);

    const imageHtml = p.image
      ? `<img src="${p.image}" alt="${p.name}">`
      : "Imagem do produto";

    card.innerHTML = `
      <div class="card-top">
        <span class="type-label"><span class="dot"></span>${cat.label}</span>
      </div>
      <div class="card-img">${imageHtml}</div>
      <h3>${p.name}</h3>
      <p class="desc">${p.desc}</p>
      <div class="card-stats">
        <span class="price"><small>R$</small> ${p.price.toFixed(2).replace(".", ",")}</span>
      </div>
      <div class="product-buttons">
        <button type="button" class="btn-cart" data-index="${index}">🛒 Adicionar ao Carrinho</button>
        <a class="btn-more" href="${knowMoreLink(p.name)}" target="_blank" rel="noopener">Saber Mais</a>
      </div>
    `;
    binder.appendChild(card);
  });
}

function applyFilter(filter){
  document.querySelectorAll(".card").forEach((card) => {
    const show = filter === "all" || card.dataset.category === filter;
    card.classList.toggle("is-hidden", !show);
  });
}

tabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if(!btn) return;
  tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  applyFilter(btn.dataset.filter);
});

// Um único listener no container cuida de todos os botões "Adicionar ao Carrinho",
// mesmo que os cards sejam recriados — evita precisar de onclick="" inline.
binder.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-cart");
  if(!btn) return;
  addToCart(Number(btn.dataset.index), btn);
});

/* =========================================================
   CARRINHO
   ========================================================= */

const CART_STORAGE_KEY = "grenin-cart";
let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

const cartButton = document.getElementById("cartButton");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const closeCartBtn = document.getElementById("closeCart");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const finishOrderBtn = document.getElementById("finishOrder");
const questionOrderBtn = document.getElementById("questionOrder");

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

function addToCart(index, btnEl){
  const product = PRODUCTS[index];
  const existing = cart.find((item) => item.index === index);

  if(existing){
    existing.quantity += 1;
  } else {
    cart.push({ index: index, quantity: 1 });
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

function changeQuantity(index, delta){
  const item = cart.find((i) => i.index === index);
  if(!item) return;

  item.quantity += delta;
  if(item.quantity <= 0){
    cart = cart.filter((i) => i.index !== index);
  }

  saveCart();
  updateCart();
}

function removeFromCart(index){
  cart = cart.filter((i) => i.index !== index);
  saveCart();
  updateCart();
}

// Delegação de eventos: um listener só, cuida de +, − e remover em qualquer item
cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if(!btn) return;
  const index = Number(btn.dataset.index);
  const action = btn.dataset.action;
  if(action === "inc") changeQuantity(index, 1);
  if(action === "dec") changeQuantity(index, -1);
  if(action === "remove") removeFromCart(index);
});

function updateCart(){
  if(cart.length === 0){
    cartItemsEl.innerHTML = `<p class="cart-empty">Seu carrinho está vazio.<br>Adicione produtos do catálogo para começar.</p>`;
    cartTotalEl.textContent = formatBRL(0);
    cartCountEl.textContent = "0";
    return;
  }

  let total = 0;
  let count = 0;

  cartItemsEl.innerHTML = cart.map((item) => {
    const product = PRODUCTS[item.index];
    const subtotal = product.price * item.quantity;
    total += subtotal;
    count += item.quantity;

    const imageHtml = product.image
      ? `<img src="${product.image}" alt="${product.name}">`
      : "";

    return `
      <div class="cart-item">
        ${imageHtml}
        <div class="cart-info">
          <h4>${product.name}</h4>
          <p>${formatBRL(product.price)} cada</p>
          <div class="cart-controls">
            <button type="button" data-action="dec" data-index="${item.index}" aria-label="Diminuir quantidade">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="inc" data-index="${item.index}" aria-label="Aumentar quantidade">+</button>
            <button type="button" data-action="remove" data-index="${item.index}" aria-label="Remover item">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  cartTotalEl.textContent = formatBRL(total);
  cartCountEl.textContent = String(count);
}

finishOrderBtn.addEventListener("click", () => {
  if(cart.length === 0){
    alert("Seu carrinho está vazio!");
    return;
  }

  let total = 0;
  const lines = cart.map((item) => {
    const product = PRODUCTS[item.index];
    const subtotal = product.price * item.quantity;
    total += subtotal;
    return `${item.quantity}x ${product.name} - ${formatBRL(subtotal)}`;
  }).join("\n");

  const message =
    `Olá! Gostaria de fazer um pedido na Grenin Geek Store:\n\n${lines}\n\nTotal: ${formatBRL(total)}`;

  window.open(whatsappLink(message), "_blank", "noopener");
});

questionOrderBtn.addEventListener("click", () => {
  if(cart.length === 0){
    alert("Seu carrinho está vazio! Adicione produtos para tirar dúvidas sobre eles.");
    return;
  }

  const lines = cart.map((item) => "- " + PRODUCTS[item.index].name).join("\n");
  const message =
    `Olá! Tenho dúvidas sobre os seguintes produtos:\n${lines}`;

  window.open(whatsappLink(message), "_blank", "noopener");
});

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

renderProducts();
updateCart();
