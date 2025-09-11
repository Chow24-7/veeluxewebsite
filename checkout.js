// Veeluxe Checkout System with Paystack Integration
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const checkoutItemsContainer = document.getElementById('checkout-items');
  const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
  const checkoutShippingEl = document.getElementById('checkout-shipping');
  const checkoutTotalEl = document.getElementById('checkout-total');
  const paystackButton = document.getElementById('paystack-button');
  const checkoutForm = document.getElementById('checkout-form');
  
  // Cart data
  let cart = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0
  };
  
  // Load cart from localStorage
  function loadCart() {
    const savedCart = localStorage.getItem('vlx_cart');
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
        renderCheckoutItems();
        updateSummary();
      } catch (e) {
        console.error('[Veeluxe] Error loading cart:', e);
        cart = { items: [], subtotal: 0, shipping: 0, total: 0 };
      }
    } else {
      // Redirect to cart page if cart is empty
      window.location.href = 'cart.html';
    }
  }
  
  // Format price
  function formatPrice(price) {
    return '₦' + price.toLocaleString();
  }
  
  // Render checkout items
  function renderCheckoutItems() {
    if (!checkoutItemsContainer) return;
    
    checkoutItemsContainer.innerHTML = '';
    
    cart.items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'd-flex justify-content-between align-items-center mb-2';
      itemEl.innerHTML = `
        <div>
          <span class="fw-bold">${item.name}</span>
          <small class="d-block text-muted">Qty: ${item.quantity}</small>
        </div>
        <span>${formatPrice(item.price * item.quantity)}</span>
      `;
      checkoutItemsContainer.appendChild(itemEl);
    });
  }
  
  // Update summary
  function updateSummary() {
    if (!checkoutSubtotalEl || !checkoutShippingEl || !checkoutTotalEl) return;
    
    checkoutSubtotalEl.textContent = formatPrice(cart.subtotal);
    checkoutShippingEl.textContent = formatPrice(cart.shipping);
    checkoutTotalEl.textContent = formatPrice(cart.total);
  }
  
  // Initialize Paystack payment
  function initializePaystack() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    if (!firstName || !lastName || !email || !phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Generate a unique reference
    const reference = 'VLX' + Math.floor(Math.random() * 1000000000 + 1) + Date.now();
    
    // Initialize Paystack
    const handler = PaystackPop.setup({
      key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your Paystack public key
      email: email,
      amount: cart.total * 100, // Amount in kobo
      currency: 'NGN',
      ref: reference,
      metadata: {
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: firstName + ' ' + lastName
          },
          {
            display_name: "Phone Number",
            variable_name: "phone_number",
            value: phone
          }
        ]
      },
      callback: function(response) {
        // Payment successful
        handleSuccessfulPayment(response);
      },
      onClose: function() {
        // Payment window closed
        console.log('Payment window closed');
      }
    });
    
    handler.openIframe();
  }
  
  // Handle successful payment
  function handleSuccessfulPayment(response) {
    // Save order details to localStorage
    const order = {
      reference: response.reference,
      items: cart.items,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
      customer: {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
      },
      date: new Date().toISOString(),
      status: 'paid'
    };
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('vlx_orders') || '[]');
    orders.push(order);
    localStorage.setItem('vlx_orders', JSON.stringify(orders));
    
    // Clear cart
    localStorage.removeItem('vlx_cart');
    localStorage.setItem('vlx_cart_count', '0');
    
    // Redirect to success page
    window.location.href = 'order-success.html?ref=' + response.reference;
  }
  
  // Event listeners
  if (paystackButton) {
    paystackButton.addEventListener('click', initializePaystack);
  }
  
  // Initialize
  loadCart();
});