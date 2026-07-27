/* =========================================================
   CONFIGURAÇÃO RÁPIDA — edite só esta parte para atualizar
   o catálogo, sem mexer no design.
   ========================================================= */
console.log("JS carregou");
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
  { name: "Box Mega Luar Clefable", category: "pokemon-tcg", price: 125, desc: "Caixa fechada, 8 pacotes.", image: "assets/produtos/box-clefable.jpg" },
  { name: "Coleção Arco-Íris Evoluções Prismáticas", category: "pokemon-tcg", price: 210, desc: "Caixa fechada, 10 pacotes.", image:"assets/produtos/box-eevee.jpg" },
  { name: "Blister Triplo Escuridão Absoluta", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes.", image:"assets/produtos/triple-escuridão.jpg"},
  { name: "Blister Triplo Caos Ascendente", category: "pokemon-tcg", price: 42.50, desc: "3 pacotes.", image:"assets/produtos/triple-caos.jpg" },
  { name: "Bleach Remix Vol. 2", category: "mangas", price: 45, desc: "Usado.", image:"assets/produtos/bleach2.jpg" },
  { name: "Bleach Remix Vol. 3", category: "mangas", price: 45, desc: "Usado.",image:"assets/produtos/bleach3.jpg" },
   { name: "Bleach Remix Vol. 4", category: "mangas", price: 45, desc: "Usado.",image:"assets/produtos/bleach4.jpg" },
{ name: "Bleach Remix Vol. 5", category: "mangas", price: 45, desc: "Usado.",image:"assets/produtos/bleach5.jpg" },
{ name: "Radiant Vol. 14", category: "mangas", price: 27, desc: "Usado.", image:"assets/produtos/radiand14.jpg" },
{ name: "Vagabond Vol. 1", category: "mangas", price: 36.50, desc: "Novo.", image:"assets/produtos/vagabond1.jpg" },
{ name: "Gantz Vol. 3", category: "mangas", price: 27, desc: "Novo.", image:"assets/produtos/gantz3.jpg" },
{ name: "Gantz Vol. 4", category: "mangas", price: 45, desc: "Novo.", image:"assets/produtos/gantz4.jpg" },
{ name: "Noragami Vol. 23", category: "mangas", price: 22.99, desc: "Usado.", image:"assets/produtos/noragami23.jpg" },
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

    const msg = encodeURIComponent(

`Olá!

Tenho interesse em saber mais sobre:

${productName}

Pode me passar mais informações?`

    );

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;

}
/* ===========================================
                CARRINHO
=========================================== */

let cart = JSON.parse(localStorage.getItem("grenin-cart")) || [];

const cartButton = document.getElementById("cartButton");
const cartSidebar = document.getElementById("cartSidebar");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

cartButton.addEventListener("click", () => {

    cartSidebar.classList.add("active");
    cartOverlay.classList.add("active");

});

closeCart.addEventListener("click", () => {

    cartSidebar.classList.remove("active");
    cartOverlay.classList.remove("active");

});

cartOverlay.addEventListener("click", () => {

    cartSidebar.classList.remove("active");
    cartOverlay.classList.remove("active");

});

function saveCart(){

    localStorage.setItem("grenin-cart", JSON.stringify(cart));

}
function addToCart(index){

    const product = PRODUCTS[index];

    const existing = cart.find(item => item.name === product.name);

    if(existing){

        existing.quantity++;

    }else{

        cart.push({

            name: product.name,
            price: product.price,
            image: product.image,
            desc: product.desc,
            quantity: 1

        });

    }

    saveCart();

    updateCart();

    cartSidebar.classList.add("active");
    cartOverlay.classList.add("active");

}
function updateCart(){

    cartItems.innerHTML = "";

    let total = 0;
    let count = 0;

    cart.forEach((item, index) => {

        total += item.price * item.quantity;
        count += item.quantity;

        const div = document.createElement("div");

        div.className = "cart-item";

        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}">

            <div class="cart-info">

                <h4>${item.name}</h4>

                <p>
                    R$ ${item.price.toFixed(2).replace(".",",")}
                </p>

                <div class="cart-controls">

                    <button onclick="changeQuantity(${index}, -1)">
                        -
                    </button>

                    <span>${item.quantity}</span>

                    <button onclick="changeQuantity(${index}, 1)">
                        +
                    </button>

                    <button onclick="removeCart(${index})">
                        🗑️
                    </button>

                </div>

            </div>
        `;

        cartItems.appendChild(div);

    });

    cartTotal.textContent =
        "R$ " + total.toFixed(2).replace(".",",");

    cartCount.textContent = count;

    saveCart();

}
function removeCart(index){

    cart.splice(index, 1);

    saveCart();

    updateCart();

}

console.log("renderizando produtos");
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
      <div class="product-buttons">

    <button
        class="btn-cart"
        onclick="addToCart(${PRODUCTS.indexOf(p)})">

        🛒 Adicionar ao Carrinho

    </button>

    <a
        class="btn-more"
        href="${whatsappLink(p.name)}"
        target="_blank"
        rel="noopener">

        Saber Mais

    </a>

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

renderProducts();
const finishOrder = document.getElementById("finishOrder");
console.log("Botão finalizar:", finishOrder);
if(finishOrder){

    finishOrder.addEventListener("click", () => {

        if(cart.length === 0){

            alert("Seu carrinho está vazio!");

            return;

        }


        let message = `Olá! Gostaria de fazer um pedido na Grenin Geek Store:\n\n`;


        let total = 0;


        cart.forEach(item => {

            const subtotal = item.price * item.quantity;

            total += subtotal;


            message += `${item.quantity}x ${item.name} - R$ ${subtotal.toFixed(2).replace(".",",")}\n`;

        });


        message += `\nTotal: R$ ${total.toFixed(2).replace(".",",")}`;


        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;


        window.open(url, "_blank");


    });

}
const questionOrder = document.getElementById("questionOrder");

console.log("Botão dúvidas:", questionOrder);

if(questionOrder){

    questionOrder.addEventListener("click", () => {

        alert("clicou no dúvidas");

    });

}
function removeCart(index){

    cart.splice(index, 1);

    saveCart();

    updateCart();

}
