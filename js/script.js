/* =========================================================
   CONFIGURAÇÃO RÁPIDA — edite só esta parte para atualizar
   o catálogo, sem mexer no design.
   ========================================================= */

// Número de WhatsApp da loja (só números, com DDI 55 + DDD)
const WHATSAPP_NUMBER = "5537999449137";

// Categorias: cor e rótulo usados nas abas e nas bordas dos cards
const CATEGORIES = {
  "pokemon-tcg":  { label: "Pokémon TCG", color: "var(--type-electric)" },
  "mangas":       { label: "Mangás",      color: "var(--type-psychic)"  },
  "colecionaveis":{ label: "Colecionável",color: "var(--type-fighting)" },
  "acessorios":   { label: "Acessório",   color: "var(--type-colorless)"}
};

// Lista de produtos — troque nome, categoria, preço, descrição e imagem.
// O campo "image" é opcional: se não tiver, aparece um placeholder no lugar da foto.
const PRODUCTS = [
  { name: "Box Mega Luar Clefable", category: "pokemon-tcg", price: 125, desc: "Caixa fechada, 8 pacotes.", image: "assets/box-clefable.jpg" },
  { name: "Coleção Arco-Íris Evoluções Prismáticas", category: "pokemon-tcg", price: 210, desc: "Caixa fechada, 10 pacotes." },
  { name: "Blister Triplo Escuridão Absoluta", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes." },
  { name: "Blister Triplo Caos Ascendente", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes." },
  { name: "Bleach Remix Volume 2", category: "mangas", price: 45, desc: "Usado." },
  { name: "Bleach Remix Volume 3", category: "mangas", price: 45, desc: "Usado." },
  { name: "Sleeves Central (100un)", category: "acessorios", price: 23, desc: "Tamanho padrão para cartas TCG." }
];

/* =========================================================
   Renderização — normalmente não precisa mexer daqui pra baixo
   ========================================================= */

const binder = document.getElementById("binder");
const tabs = document.getElementById("tabs");
const footerWhats = document.getElementById("footer-whats");
footerWhats.textContent = "+" + WHATSAPP_NUMBER.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "$1 ($2) $3-$4");

function whatsappLink(productName){
  const msg = encodeURIComponent("Olá! Tenho interesse no produto: " + productName);
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + msg;
}

function renderProducts(){
  binder.innerHTML = "";
  PRODUCTS.forEach((p) => {
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
      <a class="buy" href="${whatsappLink(p.name)}" target="_blank" rel="noopener">Comprar via WhatsApp</a>
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

renderProducts();
