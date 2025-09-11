// Reveal testimonials on scroll
document.addEventListener("DOMContentLoaded", () => {
  const testimonialCards = document.querySelectorAll(".testimonial-card");

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target); // reveal once, then stop watching
      }
    });
  }, {
    threshold: 0.2 // 20% of card visible
  });

  testimonialCards.forEach(card => observer.observe(card));
});
// Veeluxe: Cart System + fly-to-cart + back-to-top (Bootstrap friendly)
document.addEventListener('DOMContentLoaded', () => {
  const cartIcon = document.querySelector('.cart-icon');
  const cartCountEl = document.querySelector('.cart-count');
  const isCartPage = window.location.pathname.includes('cart.html');

  // --- Cart Data Structure ---
  let cart = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0
  };

  // --- Load cart from localStorage ---
  function loadCart() {
    const savedCart = localStorage.getItem('vlx_cart');
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (e) {
        console.error('[Veeluxe] Error loading cart:', e);
        cart = { items: [], subtotal: 0, shipping: 0, total: 0 };
      }
    }
    updateCartCount();
    if (isCartPage) {
      renderCart();
    }
  }

  // --- Save cart to localStorage ---
  function saveCart() {
    localStorage.setItem('vlx_cart', JSON.stringify(cart));
    updateCartCount();
  }

  // --- Update cart count ---
  function updateCartCount() {
    const count = cart.items.reduce((total, item) => total + item.quantity, 0);
    // Update all cart count elements on the page
    const allCartCountElements = document.querySelectorAll('.cart-count');
    allCartCountElements.forEach(element => {
      element.textContent = count.toString();
    });
    localStorage.setItem('vlx_cart_count', count.toString());
  }

  // --- Calculate cart totals ---
  function calculateTotals() {
    cart.subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    cart.shipping = cart.subtotal > 0 ? 1500 : 0; // ₦1,500 shipping if cart has items
    cart.total = cart.subtotal + cart.shipping;
    saveCart();
  }

  // --- Format price ---
  function formatPrice(price) {
    return '₦' + price.toLocaleString();
  }

  // --- Add item to cart ---
  function addToCart(productData) {
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.id === productData.id);
    
    if (existingItemIndex >= 0) {
      // Item already in cart, just update quantity
      cart.items[existingItemIndex].quantity += 1;
      alert('This item is already in your cart. Quantity has been updated.');
    } else {
      // Add new item to cart
      cart.items.push({
        ...productData,
        quantity: 1
      });
    }
    
    calculateTotals();
    saveCart();
    return existingItemIndex >= 0;
  }

  // --- Remove item from cart ---
  function removeFromCart(productId) {
    cart.items = cart.items.filter(item => item.id !== productId);
    calculateTotals();
    saveCart();
    if (isCartPage) {
      renderCart();
    }
  }

  // --- Update item quantity ---
  function updateQuantity(productId, quantity) {
    const itemIndex = cart.items.findIndex(item => item.id === productId);
    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity = Math.max(1, Math.min(10, quantity));
      calculateTotals();
      saveCart();
      if (isCartPage) {
        renderCart();
      }
    }
  }

  // --- Cart bounce ---
  function bounceCart() {
    if (!cartIcon) return;
    cartIcon.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
      { duration: 300, easing: 'ease-out' }
    );
  }

  // --- Fly image to cart ---
  function flyToCart(imgEl) {
    if (!imgEl || !cartIcon) return;

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
      zIndex: 9999,
      pointerEvents: 'none',
      borderRadius: getComputedStyle(imgEl).borderRadius || '8px'
    });
    document.body.appendChild(clone);

    const dx = (cartRect.left + cartRect.width / 2) - (imgRect.left + imgRect.width / 2);
    const dy = (cartRect.top + cartRect.height / 2) - (imgRect.top + imgRect.height / 2);

    clone.animate(
      [
        { transform: `translate(0,0) scale(1)`, opacity: 1, offset: 0 },
        { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(0.6)`, opacity: 0.7, offset: 0.6 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.1)`, opacity: 0.2, offset: 1 }
      ],
      { duration: 800, easing: 'cubic-bezier(.25,.46,.45,.94)' }
    ).onfinish = () => clone.remove();
  }

  // --- Handle add-to-cart buttons ---
  document.querySelectorAll('.btn-cart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const card = btn.closest('.product-card, .card, .item, .product');
      if (!card) {
        console.warn('[Veeluxe] Product card not found for this button.');
        return;
      }

      const img = card.querySelector('.product-img, .img-fluid, img');
      const name = card.querySelector('.product-name').textContent;
      const priceEl = card.querySelector('.price');
      const price = parseInt(priceEl.textContent.replace(/[^\d]/g, ''));
      
      // Generate a unique ID from the product name
      const productId = name.toLowerCase().replace(/\s+/g, '-');
      
      const productData = {
        id: productId,
        name: name,
        price: price,
        image: img.src
      };
      
      const isExisting = addToCart(productData);
      
      if (!isExisting) {
        flyToCart(img);
        bounceCart();
      }
    }, { passive: false });
  });

  // --- Render cart page ---
  function renderCart() {
    if (!isCartPage) return;
    
    const container = document.getElementById('cart-items-container');
    const emptyMessage = document.getElementById('empty-cart-message');
    const template = document.getElementById('cart-item-template');
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (!container || !emptyMessage || !template || !subtotalEl || !shippingEl || !totalEl) {
      console.warn('[Veeluxe] One or more cart page elements not found.');
      return;
    }
    
    // Clear previous items
    const existingItems = container.querySelectorAll('.cart-item');
    existingItems.forEach(item => {
      if (!item.closest('template')) {
        item.remove();
      }
    });
    
    // Show/hide empty cart message
    if (cart.items.length === 0) {
      emptyMessage.style.display = 'block';
      checkoutBtn.disabled = true;
    } else {
      emptyMessage.style.display = 'none';
      checkoutBtn.disabled = false;
      
      // Render each cart item
      cart.items.forEach(item => {
        const clone = template.content.cloneNode(true);
        const cartItem = clone.querySelector('.cart-item');
        
        cartItem.dataset.productId = item.id;
        cartItem.querySelector('img').src = item.image;
        cartItem.querySelector('img').alt = item.name;
        cartItem.querySelector('.product-name').textContent = item.name;
        cartItem.querySelector('.price').textContent = formatPrice(item.price);
        cartItem.querySelector('.quantity-input').value = item.quantity;
        cartItem.querySelector('.item-total').textContent = formatPrice(item.price * item.quantity);
        
        // Add event listeners
        cartItem.querySelector('.remove-item').addEventListener('click', () => {
          removeFromCart(item.id);
        });
        
        cartItem.querySelector('.decrease-btn').addEventListener('click', () => {
          updateQuantity(item.id, item.quantity - 1);
        });
        
        cartItem.querySelector('.increase-btn').addEventListener('click', () => {
          updateQuantity(item.id, item.quantity + 1);
        });
        
        cartItem.querySelector('.quantity-input').addEventListener('change', (e) => {
          updateQuantity(item.id, parseInt(e.target.value) || 1);
        });
        
        container.appendChild(clone);
      });
    }
    
    // Update summary
    subtotalEl.textContent = formatPrice(cart.subtotal);
    shippingEl.textContent = formatPrice(cart.shipping);
    totalEl.textContent = formatPrice(cart.total);
    
    // Add checkout button event listener
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        window.location.href = 'checkout.html';
      });
    }
  }
  
  // Initialize cart
  loadCart();

  // --- Back to Top ---
  let backToTopBtn = document.querySelector('.back-to-top');
  
  // If button doesn't exist in the DOM or is in the wrong place, create it
  if (!backToTopBtn || (backToTopBtn.parentElement && backToTopBtn.parentElement.tagName === 'HEAD')) {
    // Remove any existing button to avoid duplicates
    backToTopBtn?.remove();
    
    // Create new button
    backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.innerHTML = '↑';
    
    // Add styles if not already in CSS
    Object.assign(backToTopBtn.style, {
      position: 'fixed',
      right: '20px',
      bottom: '30px',
      backgroundColor: 'var(--brand-color, #FF5722)',
      color: '#fff',
      border: 'none',
      borderRadius: '50%',
      padding: '0.6rem 0.8rem',
      fontSize: '1.25rem',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      opacity: '0.85',
      display: 'none',
      zIndex: '999'
    });
    
    document.body.appendChild(backToTopBtn);
  }

  // Show/hide button based on scroll position
  const toggleBackBtn = () => {
    backToTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
  };
  
  window.addEventListener('scroll', toggleBackBtn, { passive: true });
  toggleBackBtn(); // Initial check
  
  // Scroll to top when clicked
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});