// Veeluxe Checkout System with Flutterwave Integration
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
  
  // Initialize Flutterwave payment
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
    const tx_ref = 'VLX-' + Math.floor(Math.random() * 1000000000 + 1) + '-' + Date.now();
    
    // Initialize Flutterwave
    FlutterwaveCheckout({
      public_key: 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X', // Replace with your Flutterwave public key
      tx_ref: tx_ref,
      amount: cart.total,
      currency: 'NGN',
      payment_options: 'card, banktransfer, ussd',
      customer: {
        email: email,
        phone_number: phone,
        name: firstName + ' ' + lastName,
      },
      customizations: {
        title: 'Veeluxe Skincare',
        description: 'Payment for luxury skincare products',
        logo: 'https://veeluxe.com/images/logowb.png',
      },
      callback: function(data) {
        // Payment successful on frontend
        // Send to backend for verification
        verifyTransactionOnBackend(data, {
          tx_ref: tx_ref,
          amount: cart.total,
          email: email,
          customer_name: firstName + ' ' + lastName,
          items: cart.items
        });
      },
      onclose: function() {
        // Payment window closed
        console.log('Payment window closed');
      },
    });
  }
  
  // Verify transaction on backend
  async function verifyTransactionOnBackend(flwResponse, orderDetails) {
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
          transaction_id: flwResponse.transaction_id,
          tx_ref: orderDetails.tx_ref,
          amount: orderDetails.amount,
          email: orderDetails.email,
          customer_name: orderDetails.customer_name,
          items: orderDetails.items
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Payment verified!
        triggerOrderAnimation(flwResponse.tx_ref);
      } else {
        alert('Payment verification failed: ' + result.message);
        payButton.disabled = false;
        payButton.textContent = 'Pay with Flutterwave';
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('An error occurred during payment verification. Please contact support.');
      payButton.disabled = false;
      payButton.textContent = 'Pay with Flutterwave';
    }
  }

  // Trigger Order Confirmation Animation
  function triggerOrderAnimation(reference) {
    // Show overlay
    orderOverlay.classList.remove('d-none');
    
    // The animation is handled by CSS (3 seconds)
    
    // After 3.5 seconds (animation + small buffer), clear cart and redirect
    setTimeout(() => {
      // Clear cart
      localStorage.removeItem('vlx_cart');
      localStorage.setItem('vlx_cart_count', '0');
      
      // Save order to history
      const order = {
        reference: reference,
        items: cart.items,
        total: cart.total,
        date: new Date().toISOString(),
        status: 'completed'
      };
      const orders = JSON.parse(localStorage.getItem('vlx_orders') || '[]');
      orders.push(order);
      localStorage.setItem('vlx_orders', JSON.stringify(orders));

      // Redirect to success page
      window.location.href = 'order-success.html?ref=' + reference;
    }, 3500);
  }
  
  // Event listeners
  if (payButton) {
    payButton.addEventListener('click', makePayment);
  }
  
  // Initialize
  loadCart();
});
