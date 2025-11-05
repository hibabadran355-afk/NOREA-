// Skript fyrir einfalt notendaviðmót

document.addEventListener('DOMContentLoaded', ()=>{
  // (Old hamburger/sidebar behavior removed; storefront code follows)

  // New storefront logic: load products, render grid, and handle cart
  const productGrid = document.getElementById('productGrid');
  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartClose = document.getElementById('cartClose');
  const overlay = document.getElementById('overlay');
  const cartItemsEl = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const productModal = document.getElementById('productModal');
  const modalClose = document.getElementById('modalClose');
  const modalContent = document.getElementById('modalContent');

  let products = [];
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  function saveCart(){
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
  }

  function renderCart(){
    cartItemsEl.innerHTML = '';
    if(cart.length === 0){
      cartItemsEl.innerHTML = '<p class="muted">Your cart is empty.</p>';
      cartCount.textContent = '0';
      cartTotal.textContent = '$0.00';
      return;
    }
    let total = 0;
    cart.forEach(item=>{
      const line = document.createElement('div');
      line.className = 'cart-line';
      const subtotal = (item.price * item.qty);
      total += subtotal;
      line.innerHTML = `
        <div class="cart-line-left">
          <strong>${item.title}</strong>
          <div class="muted">$${item.price.toFixed(2)} × ${item.qty}</div>
        </div>
        <div class="cart-line-right">
          <button class="btn small" data-action="minus" data-id="${item.id}">-</button>
          <button class="btn small" data-action="plus" data-id="${item.id}">+</button>
          <button class="btn small" data-action="remove" data-id="${item.id}">Remove</button>
        </div>
      `;
      cartItemsEl.appendChild(line);
    });
    cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
  }

  function openCart(){
    document.body.classList.add('menu-open');
    cartDrawer.setAttribute('aria-hidden','false');
    overlay.hidden = false;
    renderCart();
  }
  function closeCart(){
    document.body.classList.remove('menu-open');
    cartDrawer.setAttribute('aria-hidden','true');
    overlay.hidden = true;
  }

  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  overlay.addEventListener('click', ()=>{ 
    closeCart(); 
    productModal.hidden = true;
    productModal.setAttribute('aria-hidden','true');
    overlay.hidden = true;
    document.body.classList.remove('menu-open');
  });

  // Load products.json
  fetch('products.json').then(r=>r.json()).then(data=>{
    products = data;
    renderProducts(products);
    renderCart();
  }).catch(err=>{
    productGrid.innerHTML = '<p class="muted">Failed to load products.</p>';
    console.error(err);
  });

  function renderProducts(list){
    productGrid.innerHTML = '';
    list.forEach(p=>{
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <button class="card-media" data-id="${p.id}"><img src="${p.image}" alt="${p.title}"></button>
        <div class="card-body">
          <h4>${p.title}</h4>
          <div class="muted">$${p.price.toFixed(2)}</div>
          <p class="desc">${p.description}</p>
          <div class="card-actions">
            <button class="btn" data-action="add" data-id="${p.id}">Add to cart</button>
            <button class="btn ghost" data-action="view" data-id="${p.id}">View</button>
          </div>
        </div>
      `;
      productGrid.appendChild(card);
    });
  }

  // Delegated clicks for cards and cart
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if(action === 'add'){
      const prod = products.find(x=>x.id===id);
      const existing = cart.find(i=>i.id===id);
      if(existing) existing.qty += 1; else cart.push({...prod, qty:1});
      saveCart();
      openCart();
    } else if(action === 'view'){ // open modal
      const prod = products.find(x=>x.id===id);
      openProductModal(prod);
    } else if(action === 'minus' || action === 'plus' || action === 'remove'){
      const idx = cart.findIndex(i=>i.id===id);
      if(idx === -1) return;
      if(action === 'remove') cart.splice(idx,1);
      else if(action === 'minus'){
        cart[idx].qty -= 1;
        if(cart[idx].qty <= 0) cart.splice(idx,1);
      } else if(action === 'plus') cart[idx].qty += 1;
      saveCart();
    }
  });

  function openProductModal(p){
    modalContent.innerHTML = `
      <div class="modal-product">
        <img src="${p.image}" alt="${p.title}">
        <div class="modal-info">
          <h3>${p.title}</h3>
          <p class="muted">$${p.price.toFixed(2)}</p>
          <p>${p.description}</p>
          <div class="modal-actions">
            <button class="btn" data-action="add" data-id="${p.id}">Add to cart</button>
            <button class="btn ghost" id="modalCloseBtn">Close</button>
          </div>
        </div>
      </div>
    `;
    productModal.hidden = false; overlay.hidden = false; productModal.setAttribute('aria-hidden','false');
  }

  modalClose.addEventListener('click', ()=>{ 
    productModal.hidden = true; 
    productModal.setAttribute('aria-hidden','true'); 
    overlay.hidden = true;
    document.body.classList.remove('menu-open');
  });

  checkoutBtn.addEventListener('click', ()=>{
    if(cart.length === 0) return alert('Cart is empty');
    // Mock checkout: clear cart and show thank you
    cart = [];
    saveCart();
    alert('Thank you — this is a demo checkout.');
    closeCart();
  });

  // Search & sort
  searchInput.addEventListener('input', ()=>{
    const q = searchInput.value.trim().toLowerCase();
    const filtered = products.filter(p=>p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    renderProducts(filtered);
  });
  sortSelect.addEventListener('change', ()=>{
    const v = sortSelect.value;
    let copy = [...products];
    if(v === 'price-asc') copy.sort((a,b)=>a.price-b.price);
    if(v === 'price-desc') copy.sort((a,b)=>b.price-a.price);
    renderProducts(copy);
  });

  // theme button: toggle dark mode quickly
  const themeBtn = document.getElementById('themeBtn');
  themeBtn.addEventListener('click', ()=>{ document.body.classList.toggle('dark'); });

});
