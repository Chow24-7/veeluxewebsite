// Veeluxe Checkout System with Paystack Integration
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const checkoutItemsContainer = document.getElementById('checkout-items');
  const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
  const checkoutShippingEl = document.getElementById('checkout-shipping');
  const checkoutTotalEl = document.getElementById('checkout-total');
  const payButton = document.getElementById('pay-button');
  const checkoutForm = document.getElementById('checkout-form');
  const orderOverlay = document.getElementById('order-confirmation-overlay');
  
  // Backend URL (Update this in production)
  const BACKEND_URL = 'http://localhost:5000';
  
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
  function makePayment() {
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    if (!firstName || !lastName || !email || !phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Generate a unique reference
    const reference = 'VLX-' + Math.floor(Math.random() * 1000000000 + 1) + '-' + Date.now();
    
    // Initialize Paystack
    const handler = PaystackPop.setup({
      key: 'pk_test_6a6da4aceb683e3a0b782bc07ecff05154133efd', // Replace with your Paystack public key
      email: email,
      amount: cart.total * 100, // Paystack expects amount in kobo
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
        // Payment successful on frontend
        // Send to backend for verification
        verifyTransactionOnBackend(response, {
          reference: reference,
          amount: cart.total,
          email: email,
          customer_name: firstName + ' ' + lastName,
          items: cart.items
        });
      },
      onClose: function() {
        // Payment window closed
        console.log('Payment window closed');
      },
    });
    
    handler.openIframe();
  }
  
  // Verify transaction on backend
  async function verifyTransactionOnBackend(paystackResponse, orderDetails) {
    // Show loading state if needed
    payButton.disabled = true;
    payButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';

    try {
      const response = await fetch(`${BACKEND_URL}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: paystackResponse.reference,
          amount: orderDetails.amount,
          email: orderDetails.email,
          customer_name: orderDetails.customer_name,
          items: orderDetails.items
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Payment verified!
        triggerOrderAnimation(paystackResponse.reference);
      } else {
        alert('Payment verification failed: ' + result.message);
        payButton.disabled = false;
        payButton.textContent = 'Pay with Paystack';
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        alert('Could not connect to the server. Please ensure the backend server is running on http://localhost:5000');
      } else {
        alert('An error occurred during payment verification: ' + error.message);
      }
      payButton.disabled = false;
      payButton.textContent = 'Pay with Paystack';
    }
  }

  // Trigger Order Confirmation Animation
  function triggerOrderAnimation(reference) {
    // Save state to sessionStorage to prevent re-playing animation on refresh
    sessionStorage.setItem('vlx_order_anim_played', 'true');
    
    // Show overlay
    orderOverlay.classList.remove('d-none');
    
    // Populate details
    document.getElementById('display-order-id').textContent = reference;
    document.getElementById('display-total-paid').textContent = formatPrice(cart.total);
    
    const itemsList = document.getElementById('confirmation-items-list');
    itemsList.innerHTML = cart.items.map(item => `
      <div class="d-flex justify-content-between small mb-1">
        <span>${item.name} x ${item.quantity}</span>
        <span>${formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');

    // Clear cart
    localStorage.removeItem('vlx_cart');
    localStorage.setItem('vlx_cart_count', '0');
    
    // Save order to history with status "Payment Confirmed"
    const order = {
      reference: reference,
      items: cart.items,
      total: cart.total,
      date: new Date().toISOString(),
      status: 'Payment Confirmed' // Rule: 2. Payment Confirmed
    };
    const orders = JSON.parse(localStorage.getItem('vlx_orders') || '[]');
    orders.push(order);
    localStorage.setItem('vlx_orders', JSON.stringify(orders));

    // Post-order prompt for registration
    setTimeout(() => {
      const prompt = document.createElement('div');
      prompt.className = 'post-order-registration mt-4 p-3 border rounded bg-white shadow-sm';
      prompt.innerHTML = `
        <p class="mb-2"><strong>Want faster checkout next time?</strong></p>
        <p class="small text-muted mb-3">Create an account with one click — your order details are already saved.</p>
        <ul class="small text-start mb-3" style="list-style-type: none; padding-left: 0;">
          <li><i class="ri-history-line text-primary"></i> View order history</li>
          <li><i class="ri-heart-line text-primary"></i> Save your wishlist</li>
          <li><i class="ri-notification-3-line text-primary"></i> Restock alerts</li>
          <li><i class="ri-vip-diamond-line text-primary"></i> Exclusive member deals</li>
          <li><i class="ri-magic-line text-primary"></i> Skincare routine tracking</li>
        </ul>
        <button class="btn btn-outline-primary btn-sm w-100" onclick="alert('Account creation coming soon!')">Create My Account</button>
      `;
      document.querySelector('.confirmation-message-container').appendChild(prompt);
    }, 4500); // Show after animation and message fade-in
  }
  
  // Check if animation was already played (for refresh/back navigation)
  function checkOrderAnimState() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    
    if (ref && sessionStorage.getItem('vlx_order_anim_played') === 'true') {
      // If ref exists but anim already played, show confirmation directly without animation
      orderOverlay.classList.remove('d-none');
      const truckAnim = document.querySelector('.truck-animation-container');
      const messageContainer = document.querySelector('.confirmation-message-container');
      
      if (truckAnim) truckAnim.style.display = 'none';
      if (messageContainer) {
        messageContainer.style.opacity = '1';
        messageContainer.style.animation = 'none';
      }
      
      // Populate details from history
      const orders = JSON.parse(localStorage.getItem('vlx_orders') || '[]');
      const order = orders.find(o => o.reference === ref);
      if (order) {
        document.getElementById('display-order-id').textContent = order.reference;
        document.getElementById('display-total-paid').textContent = formatPrice(order.total);
        const itemsList = document.getElementById('confirmation-items-list');
        itemsList.innerHTML = order.items.map(item => `
          <div class="d-flex justify-content-between small mb-1">
            <span>${item.name} x ${item.quantity}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
          </div>
        `).join('');
      }
    }
  }
  
  // Event listeners
  if (payButton) {
    payButton.addEventListener('click', makePayment);
  }
  
  // Initialize
  loadCart();
  checkOrderAnimState();
});
