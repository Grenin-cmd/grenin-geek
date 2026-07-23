
  /* =========================================================
     CONFIGURAÇÃO RÁPIDA — edite só esta parte para atualizar
     o catálogo, sem mexer no design.
     ========================================================= */

  // Número de WhatsApp da loja (só números, com DDI 55 + DDD)
  const WHATSAPP_NUMBER = "5537999449137";

  // Categorias: cor e rótulo usados nas abas e nas bordas dos cards
  const CATEGORIES = {
    "pokemon-tcg":   { label: "Pokémon TCG",   color: "var(--type-electric)" },
    "mangas": { label: "Mangás", color: "var(--type-psychic)" },
    "colecionaveis": { label: "Colecionável",  color: "var(--type-fighting)" },
    "acessorios":    { label: "Acessório",     color: "var(--type-colorless)"}
  };

 
  /* =========================================================
     Renderização — normalmente não precisa mexer daqui pra baixo
     ========================================================= */

  const binder = document.getElementById("binder");
  const tabs = document.getElementById("tabs");
  const footerWhats = document.getElementById("footer-whats");
  footerWhats.textContent = "+" + WHATSAPP_NUMBER.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "$1 ($2) $3-$4");

  function priceToBRL(v){
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

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
      card.innerHTML = `
        <div class="card-top">
          <span class="type-label"><span class="dot"></span>${cat.label}</span>
        </div>
        <div class="card-img">Imagem do produto</div>
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
