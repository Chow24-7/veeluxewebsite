// Veeluxe Core Script
document.addEventListener('DOMContentLoaded', () => {
  // --- Search Functionality ---
  const searchInput = document.querySelector('.nav-search input');
  const searchSuggestions = document.createElement('div');
  searchSuggestions.className = 'search-suggestions';
  if (searchInput) {
    searchInput.parentElement.appendChild(searchSuggestions);

    const products = [
      { name: "Luxe Face Set", price: 17250, img: "images/luxefs.jpg" },
      { name: "Luxe Body Butter (150ml)", price: 6450, img: "images/slbb.jpg" },
      { name: "Luxe Black Body Soap", price: 6550, img: "images/black body soap.jpg" },
      { name: "Big Luxe Body Butter (250ml)", price: 8750, img: "images/blbb.jpg" },
      { name: "Luxe Face Cream", price: 6000, img: "images/vfc.jpg" },
      { name: "Luxe Glow Oil", price: 5100, img: "images/Luxe glow oil .jpg" },
      { name: "Luxe Face Soap", price: 4250, img: "images/lfs.jpg" },
      { name: "Luxe Face Cleanser", price: 7000, img: "images/lfc.jpg" },
      { name: "Radiance Face Cleanser", price: 7000, img: "images/Radiance face cleanser .jpg" },
      { name: "Glow Illuminating Scrub", price: 6000, img: "images/Glow illuminating scrub .JPG" },
      { name: "Lipcare Set", price: 10000, img: "images/Lipcare .jpg" },
      { name: "Luxe Body Lotion", price: 11500, img: "images/Luxe body lotion .jpg" },
      { name: "Acne Face Cream", price: 9000, img: "images/Acnefacecream.jpg" },
      { name: "Brightening Body Lotion", price: 13500, img: "images/Brighteningbodylotion.jpg" },
      { name: "Brightening Face Cream", price: 10500, img: "images/Brighteningfacecream.jpg" },
      { name: "Glow Boost Serum", price: 8500, img: "images/Glowboostserum.jpg" },
      { name: "Glow et Gleam Oil", price: 6500, img: "images/Glowetgleamoil.jpg" },
      { name: "Intense Glow Lightening Lotion", price: 15000, img: "images/Intenseglowlighteninglotion.jpg" },
      { name: "Intense Glow Lightening Face Cream", price: 12500, img: "images/Intenseglowlighteningfacecream.jpg" },
      { name: "Lightening Oil", price: 9500, img: "images/Lighteningoil.jpg" },
      { name: "Rose Essence Toner", price: 8500, img: "images/Roseessencetoner.jpg" },
      { name: "Tumeric x Goatmilk Bar", price: 5550, img: "images/TumericxGoatmilkbar.jpg" },
      { name: "Face Mask", price: 1000, img: "images/Face mask .jpg" }
    ];

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (term.length < 2) {
        searchSuggestions.style.display = 'none';
        return;
      }

      const matches = products.filter(p => p.name.toLowerCase().includes(term));
      if (matches.length > 0) {
        searchSuggestions.innerHTML = matches.map(p => `
          <a href="products.html" class="search-suggestion-item">
            <img src="${p.img}" alt="${p.name}">
            <div class="info">
              <span class="name">${p.name}</span>
              <span class="price">₦${p.price.toLocaleString()}</span>
            </div>
          </a>
        `).join('');
        searchSuggestions.style.display = 'block';
      } else {
        searchSuggestions.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
        searchSuggestions.style.display = 'none';
      }
    });
  }

  // --- Navbar Toggle ---
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = navToggle.querySelector('i');
      if (navMenu.classList.contains('active')) {
        icon.className = 'ri-close-line';
      } else {
        icon.className = 'ri-menu-line';
      }
    });
  }

  // --- Backend Connection Configuration ---
  const BACKEND_URL = 'http://localhost:5000';

  // --- Contact Form Integration ---
  const contactForms = document.querySelectorAll('.footer-col form');
  contactForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button');
      const originalText = submitBtn.textContent;
      
      const name = form.querySelector('input[placeholder="Your Name"]').value;
      const email = form.querySelector('input[placeholder="Your Email"]').value;
      const message = form.querySelector('textarea[placeholder="Message"]').value;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const response = await fetch(`${BACKEND_URL}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        const result = await response.json();
        if (result.status === 'success') {
          alert('Message sent successfully! ✅');
          form.reset();
        } else {
          alert('Failed to send message: ' + result.message);
        }
      } catch (error) {
        console.error('Contact form error:', error);
        alert('An error occurred. Please check your connection to the server.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  });

  // --- Wishlist Functionality ---
  let wishlist = JSON.parse(localStorage.getItem('vlx_wishlist') || '[]');
  const wishlistCounts = document.querySelectorAll('.wishlist-count');

  function updateWishlistBadge() {
    const totalWishlist = wishlist.length;
    wishlistCounts.forEach(count => {
      count.textContent = totalWishlist;
      count.style.display = totalWishlist > 0 ? 'flex' : 'none';
    });
  }

  function toggleWishlist(product) {
    const index = wishlist.findIndex(item => item.name === product.name);
    if (index > -1) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(product);
    }
    localStorage.setItem('vlx_wishlist', JSON.stringify(wishlist));
    updateWishlistBadge();
    updateWishlistUI();
    
    if (document.getElementById('wishlist-items-container')) {
      renderWishlist();
    }
  }

  function updateWishlistUI() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const card = btn.closest('.product-card');
      const name = card.querySelector('.product-name').textContent;
      if (wishlist.find(item => item.name === name)) {
        btn.classList.add('active');
        btn.querySelector('i').className = 'ri-heart-fill';
      } else {
        btn.classList.remove('active');
        btn.querySelector('i').className = 'ri-heart-line';
      }
    });
  }

  // Handle Wishlist button clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.wishlist-btn');
    if (btn) {
      const card = btn.closest('.product-card');
      const name = card.querySelector('.product-name').textContent;
      const priceStr = card.querySelector('.price').textContent.replace('₦', '').replace(',', '');
      const price = parseFloat(priceStr);
      const img = card.querySelector('img').src;
      
      toggleWishlist({ name, price, img });
    }
  });

  // --- Wishlist Page Rendering ---
  const wishlistContainer = document.getElementById('wishlist-items-container');
  const emptyWishlistMessage = document.getElementById('empty-wishlist-message');

  function renderWishlist() {
    if (!wishlistContainer) return;

    if (wishlist.length === 0) {
      wishlistContainer.innerHTML = '';
      if (emptyWishlistMessage) {
        wishlistContainer.appendChild(emptyWishlistMessage);
        emptyWishlistMessage.style.display = 'block';
      }
    } else {
      if (emptyWishlistMessage) emptyWishlistMessage.style.display = 'none';
      wishlistContainer.innerHTML = '';
      
      wishlist.forEach((item, index) => {
        const itemCol = document.createElement('div');
        itemCol.className = 'wishlist-item-col';
        itemCol.innerHTML = `
          <div class="wishlist-card">
            <div class="wishlist-card-img-wrapper">
              <img src="${item.img}" alt="${item.name}" class="wishlist-card-img">
              <button class="wishlist-btn active" onclick="event.stopPropagation(); window.toggleWishlistFromPage('${item.name}')">
                <i class="ri-heart-fill"></i>
              </button>
            </div>
            <div class="wishlist-card-body">
              <h5 class="product-name">${item.name}</h5>
              <div class="price">₦${item.price.toLocaleString()}</div>
              <div class="saved-label">Saved to your wishlist</div>
              <div class="card-actions">
                <button class="btn-move-to-cart" onclick="window.moveToCart(${index})">
                  Move to Cart
                </button>
                <button class="btn-remove" onclick="window.toggleWishlistFromPage('${item.name}')">
                  Remove
                </button>
              </div>
            </div>
          </div>
        `;
        wishlistContainer.appendChild(itemCol);
      });
    }
  }

  // Expose functions to window for onclick handlers
  window.toggleWishlistFromPage = (name) => {
    const product = wishlist.find(item => item.name === name);
    if (product) toggleWishlist(product);
  };

  window.moveToCart = (index) => {
    const item = wishlist[index];
    
    // Add to cart logic
    const existingItem = cart.items.find(cartItem => cartItem.name === item.name);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({ 
        name: item.name, 
        price: item.price, 
        img: item.img, 
        quantity: 1, 
        stock: 10 
      });
    }
    
    calculateCart();
    saveCart();
    updateCartBadge();
    
    alert(`${item.name} added to cart! 🛒`);
  };

  // Initialize wishlist UI
  updateWishlistBadge();
  updateWishlistUI();
  renderWishlist();

  // --- Cart Functionality ---
  // Cookie Helper
  const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  };

  const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // Assign unique cart_id cookie on first page load
  let cartId = getCookie('vlx_cart_id');
  if (!cartId) {
    cartId = 'cart_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    setCookie('vlx_cart_id', cartId, 30);
  }

  // Load cart from cookie or localStorage (Redundancy)
  let cart = JSON.parse(localStorage.getItem('vlx_cart') || getCookie('vlx_cart') || '{"items":[], "subtotal":0, "shipping":0, "total":0}');
  const cartCounts = document.querySelectorAll('.cart-count');

  function updateCartBadge() {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cartCounts.forEach(count => {
      count.textContent = totalItems;
      count.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    localStorage.setItem('vlx_cart_count', totalItems);
  }

  // Initial badge update
  updateCartBadge();

  // Add to Cart
  const addToCartBtns = document.querySelectorAll('.btn-cart');
  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      const name = card.querySelector('.product-name').textContent;
      const priceStr = card.querySelector('.price').textContent.replace('₦', '').replace(',', '');
      const price = parseFloat(priceStr);
      const imgEl = card.querySelector('img');
      const img = imgEl.src;
      
      // Stock logic (mocked for now, but following rules)
      const stock = 10; // Default stock

      const existingItem = cart.items.find(item => item.name === name);
      if (existingItem) {
        if (existingItem.quantity < stock) {
          existingItem.quantity += 1;
        } else {
          alert('Out of stock!');
          return;
        }
      } else {
        cart.items.push({ 
          name, 
          price, 
          img, 
          quantity: 1, 
          stock: stock,
          sale_price: price * 0.9, // Mocking sale price for demo
          original_price: price
        });
      }

      calculateCart();
      saveCart();
      updateCartBadge();
      
      // Fly to Cart Animation
      flyToCart(imgEl);
      
      // Simple feedback
      const originalText = btn.textContent;
      btn.textContent = 'Added! ✅';
      btn.style.backgroundColor = '#28a745';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
      }, 1500);
    });
  });

  function flyToCart(imgEl) {
    const cartIcon = document.querySelector('.cart-icon');
    if (!cartIcon || !imgEl) return;

    const imgRect = imgEl.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    const clone = imgEl.cloneNode(true);
    Object.assign(clone.style, {
      position: 'fixed',
      left: imgRect.left + 'px',
      top: imgRect.top + 'px',
      width: imgRect.width + 'px',
      height: imgRect.height + 'px',
      margin: 0,
      zIndex: 10000,
      pointerEvents: 'none',
      borderRadius: '8px',
      transition: 'all 0.8s cubic-bezier(0.42, 0, 0.58, 1)'
    });
    document.body.appendChild(clone);

    // Force reflow
    clone.offsetWidth;

    Object.assign(clone.style, {
      left: (cartRect.left + cartRect.width / 2) + 'px',
      top: (cartRect.top + cartRect.height / 2) + 'px',
      width: '20px',
      height: '20px',
      opacity: '0.4'
    });

    setTimeout(() => {
      clone.remove();
      cartIcon.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.2)' },
        { transform: 'scale(1)' }
      ], { duration: 200 });
    }, 800);
  }

  function calculateCart() {
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.savings = cart.items.reduce((sum, item) => {
      if (item.original_price && item.price < item.original_price) {
        return sum + ((item.original_price - item.price) * item.quantity);
      }
      return sum;
    }, 0);
    cart.shipping = cart.subtotal > 0 ? 2500 : 0; 
    cart.total = cart.subtotal + cart.shipping;
  }

  function saveCart() {
    const cartStr = JSON.stringify(cart);
    localStorage.setItem('vlx_cart', cartStr);
    setCookie('vlx_cart', cartStr, 30); // Persist for 30 days
  }

  // --- Cart Page Rendering ---
  const cartContainer = document.getElementById('cart-items-container');
  const emptyMessage = document.getElementById('empty-cart-message');
  const subtotalEl = document.getElementById('cart-subtotal');
  const savingsEl = document.getElementById('cart-savings');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  function renderCart() {
    if (!cartContainer) return;

    if (cart.items.length === 0) {
      cartContainer.innerHTML = '';
      if (emptyMessage) {
        cartContainer.appendChild(emptyMessage);
        emptyMessage.style.display = 'block';
      }
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      if (emptyMessage) emptyMessage.style.display = 'none';
      cartContainer.innerHTML = '';
      const template = document.getElementById('cart-item-template');

      cart.items.forEach((item, index) => {
        const clone = template.content.cloneNode(true);
        const itemRoot = clone.querySelector('.cart-item');
        itemRoot.dataset.index = index;
        clone.querySelector('img').src = item.img;
        clone.querySelector('.product-name').textContent = item.name;
        
        // Unit price (smaller muted font, appears ONCE)
        const unitPriceEl = clone.querySelector('.unit-price');
        unitPriceEl.textContent = `₦${item.price.toLocaleString()}`;
        
        // Stock status
        const stockStatusEl = clone.querySelector('.stock-status');
        if (item.stock < 5) {
          stockStatusEl.innerHTML = `<span class="text-danger fw-bold small">Only ${item.stock} left!</span>`;
        } else {
          stockStatusEl.innerHTML = `<span class="text-success small">In Stock</span>`;
        }

        // Line total (unit price x quantity, bold, far right)
        clone.querySelector('.item-total').textContent = `₦${(item.price * item.quantity).toLocaleString()}`;

        // Event Listeners
        clone.querySelector('.btn-save-later').onclick = () => saveForLater(index);
        clone.querySelector('.decrease-btn').onclick = () => updateQuantity(index, -1);
        clone.querySelector('.increase-btn').onclick = () => updateQuantity(index, 1);
        clone.querySelector('.remove-item').onclick = () => removeItem(index);
        clone.querySelector('.quantity-input').onchange = (e) => setQuantity(index, parseInt(e.target.value));
        clone.querySelector('.quantity-input').value = item.quantity;

        cartContainer.appendChild(clone);
      });
      if (checkoutBtn) checkoutBtn.disabled = false;
    }

    if (subtotalEl) subtotalEl.textContent = `₦${cart.subtotal.toLocaleString()}`;
    if (savingsEl) {
      savingsEl.textContent = `₦${(cart.savings || 0).toLocaleString()}`;
      savingsEl.parentElement.style.display = cart.savings > 0 ? 'flex' : 'none';
    }
    if (shippingEl) shippingEl.textContent = `₦${cart.shipping.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `₦${cart.total.toLocaleString()}`;
  }

  function saveForLater(index) {
    const item = cart.items[index];
    addToWishlist(item);
    removeItem(index);
  }

  function addToWishlist(product) {
    let wishlist = JSON.parse(localStorage.getItem('vlx_wishlist') || '[]');
    if (!wishlist.find(item => item.name === product.name)) {
      wishlist.push(product);
      localStorage.setItem('vlx_wishlist', JSON.stringify(wishlist));
      alert(`${product.name} saved to wishlist! ❤️`);
      updateWishlistBadge();
      updateWishlistUI();
    }
  }

  // Cart Merging Logic (Placeholder for future authentication system)
  function mergeCarts(accountCart) {
    // Rule: Silently merge guest cart with account cart, keeping highest quantity if duplicates exist
    cart.items.forEach(guestItem => {
      const accountItem = accountCart.items.find(item => item.name === guestItem.name);
      if (accountItem) {
        accountItem.quantity = Math.max(accountItem.quantity, guestItem.quantity);
      } else {
        accountCart.items.push(guestItem);
      }
    });
    cart = accountCart;
    calculateCart();
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function updateQuantity(index, delta) {
    cart.items[index].quantity += delta;
    if (cart.items[index].quantity < 1) cart.items[index].quantity = 1;
    updateCartAll();
  }

  function setQuantity(index, val) {
    if (isNaN(val) || val < 1) val = 1;
    cart.items[index].quantity = val;
    updateCartAll();
  }

  function removeItem(index) {
    cart.items.splice(index, 1);
    updateCartAll();
  }

  function updateCartAll() {
    calculateCart();
    saveCart();
    updateCartBadge();
    renderCart();
  }

  // Initial render if on cart page
  renderCart();

  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      window.location.href = 'checkout.html';
    };
  }

  // --- Back to Top ---
  const backToTop = document.querySelector('.back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTop.style.display = 'flex';
    } else {
      backToTop.style.display = 'none';
    }
  });

  backToTop.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});
