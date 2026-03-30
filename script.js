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

  // --- Cart Functionality ---
  let cart = JSON.parse(localStorage.getItem('vlx_cart') || '{"items":[], "subtotal":0, "shipping":0, "total":0}');
  const cartCounts = document.querySelectorAll('.cart-count');

  function updateCartBadge() {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cartCounts.forEach(count => {
      count.textContent = totalItems;
      count.style.display = totalItems > 0 ? 'inline-block' : 'none';
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

      const existingItem = cart.items.find(item => item.name === name);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({ name, price, img, quantity: 1 });
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
    cart.shipping = cart.subtotal > 0 ? 2500 : 0; // Fixed shipping for now
    cart.total = cart.subtotal + cart.shipping;
  }

  function saveCart() {
    localStorage.setItem('vlx_cart', JSON.stringify(cart));
  }

  // --- Cart Page Rendering ---
  const cartContainer = document.getElementById('cart-items-container');
  const emptyMessage = document.getElementById('empty-cart-message');
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  function renderCart() {
    if (!cartContainer) return;

    if (cart.items.length === 0) {
      cartContainer.innerHTML = '';
      cartContainer.appendChild(emptyMessage);
      emptyMessage.style.display = 'block';
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      if (emptyMessage) emptyMessage.style.display = 'none';
      cartContainer.innerHTML = '';
      const template = document.getElementById('cart-item-template');

      cart.items.forEach((item, index) => {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.cart-item').dataset.index = index;
        clone.querySelector('img').src = item.img;
        clone.querySelector('.product-name').textContent = item.name;
        clone.querySelector('.price').textContent = `₦${item.price.toLocaleString()}`;
        clone.querySelector('.quantity-input').value = item.quantity;
        clone.querySelector('.item-total').textContent = `₦${(item.price * item.quantity).toLocaleString()}`;

        // Listeners for quantity and remove
        clone.querySelector('.decrease-btn').onclick = () => updateQuantity(index, -1);
        clone.querySelector('.increase-btn').onclick = () => updateQuantity(index, 1);
        clone.querySelector('.remove-item').onclick = () => removeItem(index);
        clone.querySelector('.quantity-input').onchange = (e) => setQuantity(index, parseInt(e.target.value));

        cartContainer.appendChild(clone);
      });
      if (checkoutBtn) checkoutBtn.disabled = false;
    }

    if (subtotalEl) subtotalEl.textContent = `₦${cart.subtotal.toLocaleString()}`;
    if (shippingEl) shippingEl.textContent = `₦${cart.shipping.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `₦${cart.total.toLocaleString()}`;
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
