const API = '';
const TAX_RATE = 0.08;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const page = document.body.dataset.page;

const state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null')
};

const request = async (url, options = {}) => {
  const headers = {};
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${API}${url}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const setSession = ({ user, token }) => {
  state.user = user;
  state.token = token;
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
  updateNav();
};

const clearSession = () => {
  state.user = null;
  state.token = null;
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  location.href = '/login.html';
};

const requireAuth = () => {
  if (!state.token) location.href = '/login.html';
};

const requireAdmin = () => {
  requireAuth();
  if (state.user?.role !== 'admin') location.href = '/dashboard.html';
};

const flash = (target, message, ok = false) => {
  if (!target) return;
  target.innerHTML = message ? `<div class="notice ${ok ? 'success' : ''}">${message}</div>` : '';
};

const updateNav = () => {
  const nav = $('#navLinks');
  if (!nav) return;
  nav.innerHTML = `
    <a href="/index.html">Home</a>
    <a href="/products.html">Products</a>
    <a href="/cart.html">Cart</a>
    ${
      state.user
        ? `<a href="/dashboard.html">Dashboard</a>${state.user.role === 'admin' ? '<a href="/admin.html">Admin</a>' : ''}<button class="ghost-btn" id="logoutBtn">Logout</button>`
        : '<a href="/login.html">Login</a>'
    }
  `;
  $('#logoutBtn')?.addEventListener('click', clearSession);
  $$('a', nav).forEach((link) => {
    if (location.pathname.endsWith(link.getAttribute('href'))) link.classList.add('active');
  });
};

const imageOf = (product) => product?.images?.[0] || 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=900&q=80';
const ratingOf = (product) => product.averageRating || 0;

const productCard = (product) => `
  <article class="card product-card">
    <a href="/product.html?id=${product._id}"><img src="${imageOf(product)}" alt="${product.name}"></a>
    <div class="product-body">
      <span class="badge">${product.category}</span>
      <h3 class="product-title"><a href="/product.html?id=${product._id}">${product.name}</a></h3>
      <p class="muted">${product.description.slice(0, 86)}...</p>
      <div class="price-row"><span>${money(product.price)}</span><span>★ ${ratingOf(product)}</span></div>
      <button class="btn add-cart" data-id="${product._id}" ${product.stock < 1 ? 'disabled' : ''}>Add to Cart</button>
    </div>
  </article>
`;

const bindAddCart = () => {
  $$('.add-cart').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!state.token) return (location.href = '/login.html');
      try {
        await request('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify({ productId: button.dataset.id, qty: 1 })
        });
        button.textContent = 'Added';
        setTimeout(() => (button.textContent = 'Add to Cart'), 1200);
      } catch (error) {
        alert(error.message);
      }
    });
  });
};

const loadCategories = async (selects = []) => {
  const data = await request('/api/products?limit=1');
  selects.forEach((select) => {
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">All categories</option>' + data.categories.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
    select.value = current;
  });
  return data.categories;
};

const initHome = async () => {
  const grid = $('#featuredGrid');
  const categoryBar = $('#categoryBar');
  const data = await request('/api/products?limit=8&sort=rating');
  grid.innerHTML = data.products.map(productCard).join('');
  categoryBar.innerHTML = ['All', ...data.categories].map((cat) => `<button class="btn secondary small category-btn" data-category="${cat === 'All' ? '' : cat}">${cat}</button>`).join('');
  $$('.category-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const next = await request(`/api/products?limit=8&category=${encodeURIComponent(button.dataset.category)}`);
      grid.innerHTML = next.products.map(productCard).join('') || '<div class="empty">No products in this category.</div>';
      bindAddCart();
    });
  });
  bindAddCart();
};

const initProducts = async () => {
  const form = $('#filterForm');
  const grid = $('#productsGrid');
  const meta = $('#productMeta');
  const pageInput = $('#pageInput');
  await loadCategories([$('#category')]);

  const load = async () => {
    const params = new URLSearchParams(new FormData(form));
    const data = await request(`/api/products?${params.toString()}`);
    grid.innerHTML = data.products.map(productCard).join('') || '<div class="empty">No products found.</div>';
    meta.textContent = `${data.total} products · page ${data.page} of ${data.pages}`;
    pageInput.value = data.page;
    $('#prevPage').disabled = data.page <= 1;
    $('#nextPage').disabled = data.page >= data.pages;
    bindAddCart();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    pageInput.value = 1;
    load();
  });
  $('#prevPage').addEventListener('click', () => {
    pageInput.value = Math.max(Number(pageInput.value) - 1, 1);
    load();
  });
  $('#nextPage').addEventListener('click', () => {
    pageInput.value = Number(pageInput.value) + 1;
    load();
  });
  load();
};

const initProductDetail = async () => {
  const id = new URLSearchParams(location.search).get('id');
  const root = $('#productDetail');
  if (!id) {
    root.innerHTML = '<div class="empty">Product not found.</div>';
    return;
  }
  const { product, related } = await request(`/api/products/${id}`);
  root.innerHTML = `
    <div>
      <img class="detail-main-image" id="mainImage" src="${imageOf(product)}" alt="${product.name}">
      <div class="thumbs">${product.images.map((img, index) => `<img class="${index === 0 ? 'active' : ''}" src="${img}" alt="${product.name} thumbnail">`).join('')}</div>
    </div>
    <div class="panel stack">
      <span class="badge">${product.category}</span>
      <h1 class="page-title">${product.name}</h1>
      <p>${product.description}</p>
      <div class="price-row"><span>${money(product.price)}</span><span>★ ${ratingOf(product)}</span></div>
      <p class="muted">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
      <label>Quantity <input id="detailQty" type="number" min="1" max="${product.stock}" value="1"></label>
      <button class="btn add-cart-detail" ${product.stock < 1 ? 'disabled' : ''}>Add to Cart</button>
    </div>
  `;
  $$('.thumbs img').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      $('#mainImage').src = thumb.src;
      $$('.thumbs img').forEach((item) => item.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
  $('.add-cart-detail').addEventListener('click', async () => {
    if (!state.token) return (location.href = '/login.html');
    await request('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId: product._id, qty: Number($('#detailQty').value) })
    });
    location.href = '/cart.html';
  });
  $('#relatedGrid').innerHTML = related.map(productCard).join('') || '<div class="empty">No related products yet.</div>';
  bindAddCart();
};

const cartTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const taxes = subtotal * TAX_RATE;
  return { subtotal, taxes, total: subtotal + taxes };
};

const initCart = async () => {
  requireAuth();
  const root = $('#cartItems');
  const summary = $('#cartSummary');
  const cart = await request('/api/cart');
  const items = cart.items.filter((item) => item.product);
  if (!items.length) {
    root.innerHTML = '<div class="empty">Your cart is empty.</div>';
    summary.innerHTML = '';
    return;
  }
  root.innerHTML = items
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${imageOf(item.product)}" alt="${item.product.name}">
        <div><strong>${item.product.name}</strong><p class="muted">${money(item.product.price)} · ${item.product.stock} available</p></div>
        <div class="stack">
          <input class="qty-control cart-qty" data-id="${item.product._id}" type="number" min="1" max="${item.product.stock}" value="${item.qty}">
          <button class="btn danger small remove-cart" data-id="${item.product._id}">Remove</button>
        </div>
      </div>`
    )
    .join('');
  const totals = cartTotals(items);
  summary.innerHTML = `
    <h2>Order Summary</h2>
    <div class="row"><span>Subtotal</span><strong>${money(totals.subtotal)}</strong></div>
    <div class="row"><span>Taxes</span><strong>${money(totals.taxes)}</strong></div>
    <div class="row"><span>Total</span><strong>${money(totals.total)}</strong></div>
    <a class="btn" href="/checkout.html">Proceed to Checkout</a>
  `;
  $$('.cart-qty').forEach((input) => {
    input.addEventListener('change', async () => {
      await request('/api/cart/update', { method: 'PUT', body: JSON.stringify({ productId: input.dataset.id, qty: Number(input.value) }) });
      initCart();
    });
  });
  $$('.remove-cart').forEach((button) => {
    button.addEventListener('click', async () => {
      await request(`/api/cart/remove/${button.dataset.id}`, { method: 'DELETE' });
      initCart();
    });
  });
};

const initCheckout = async () => {
  requireAuth();
  const cart = await request('/api/cart');
  const items = cart.items.filter((item) => item.product);
  const totals = cartTotals(items);
  $('#checkoutSummary').innerHTML = items.length
    ? items.map((item) => `<div class="row"><span>${item.product.name} × ${item.qty}</span><strong>${money(item.product.price * item.qty)}</strong></div>`).join('') + `<hr><div class="row"><span>Total</span><strong>${money(totals.total)}</strong></div>`
    : '<div class="empty">Your cart is empty.</div>';
  $('#checkoutForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const shippingAddress = Object.fromEntries(new FormData(event.target));
      const order = await request('/api/orders', { method: 'POST', body: JSON.stringify({ shippingAddress }) });
      flash($('#checkoutMessage'), `Order placed successfully. Order ID: ${order._id}`, true);
      setTimeout(() => (location.href = '/dashboard.html'), 1200);
    } catch (error) {
      flash($('#checkoutMessage'), error.message);
    }
  });
};

const initAuth = () => {
  $('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = await request('/api/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      setSession(data);
      location.href = data.user.role === 'admin' ? '/admin.html' : '/dashboard.html';
    } catch (error) {
      flash($('#loginMessage'), error.message);
    }
  });
  $('#registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = await request('/api/auth/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      setSession(data);
      location.href = '/dashboard.html';
    } catch (error) {
      flash($('#registerMessage'), error.message);
    }
  });
};

const initDashboard = async () => {
  requireAuth();
  const profile = await request('/api/auth/profile');
  $('#profileName').value = profile.user.name;
  $('#profileEmail').value = profile.user.email;
  $('#profileForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = await request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      state.user = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      updateNav();
      flash($('#profileMessage'), 'Profile updated successfully.', true);
    } catch (error) {
      flash($('#profileMessage'), error.message);
    }
  });
  $('#passwordForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await request('/api/auth/password', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      event.target.reset();
      flash($('#passwordMessage'), 'Password changed successfully.', true);
    } catch (error) {
      flash($('#passwordMessage'), error.message);
    }
  });
  const orders = await request('/api/orders/myorders');
  $('#orderHistory').innerHTML = orders.length
    ? orders.map((order) => `<div class="panel stack"><div class="row"><strong>${order._id}</strong><span class="badge">${order.status}</span></div><p class="muted">${new Date(order.createdAt).toLocaleString()} · ${money(order.totalAmount)}</p>${order.items.map((item) => `<div class="order-item"><img src="${item.image}" alt="${item.name}"><div>${item.name}<p class="muted">Qty ${item.qty} · ${money(item.price)}</p></div></div>`).join('')}</div>`).join('')
    : '<div class="empty">No orders yet.</div>';
};

const productFormValues = (form) => {
  const data = new FormData(form);
  if (!data.get('productImages')?.name) data.delete('productImages');
  return data;
};

const initAdmin = async () => {
  requireAdmin();
  const productForm = $('#productForm');
  await loadCategories([$('#adminCategoryFilter')]);

  const loadProducts = async () => {
    const category = $('#adminCategoryFilter').value;
    const data = await request(`/api/products?limit=48&category=${encodeURIComponent(category)}`);
    $('#adminProducts').innerHTML = data.products
      .map(
        (product) => `
        <div class="admin-row">
          <img src="${imageOf(product)}" alt="${product.name}">
          <div><strong>${product.name}</strong><p class="muted">${product.category} · ${money(product.price)} · stock ${product.stock}</p></div>
          <div class="row">
            <button class="btn secondary small edit-product" data-product='${JSON.stringify(product).replace(/'/g, '&apos;')}'>Edit</button>
            <button class="btn danger small delete-product" data-id="${product._id}">Delete</button>
          </div>
        </div>`
      )
      .join('');
    bindAdminProductActions();
  };

  const loadOrders = async () => {
    const orders = await request('/api/orders');
    $('#adminOrders').innerHTML = orders.length
      ? `<div class="table-scroll"><table><thead><tr><th>Order</th><th>User</th><th>Total</th><th>Status</th><th>Update</th></tr></thead><tbody>${orders
          .map(
            (order) => `<tr><td>${order._id}<br><span class="muted">${new Date(order.createdAt).toLocaleDateString()}</span></td><td>${order.user?.name || 'User'}<br><span class="muted">${order.user?.email || ''}</span></td><td>${money(order.totalAmount)}</td><td><span class="badge">${order.status}</span></td><td><select class="order-status" data-id="${order._id}">${['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></td></tr>`
          )
          .join('')}</tbody></table></div>`
      : '<div class="empty">No orders yet.</div>';
    $$('.order-status').forEach((select) => {
      select.addEventListener('change', async () => {
        await request(`/api/orders/${select.dataset.id}/status`, { method: 'PUT', body: JSON.stringify({ status: select.value }) });
        loadOrders();
      });
    });
  };

  const bindAdminProductActions = () => {
    $$('.edit-product').forEach((button) => {
      button.addEventListener('click', () => {
        const product = JSON.parse(button.dataset.product.replace(/&apos;/g, "'"));
        productForm.elements.productId.value = product._id;
        productForm.elements.name.value = product.name;
        productForm.elements.description.value = product.description;
        productForm.elements.price.value = product.price;
        productForm.elements.category.value = product.category;
        productForm.elements.stock.value = product.stock;
        productForm.elements.imagesText.value = product.images.join(',');
        $('#productSubmit').textContent = 'Update Product';
        scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    $$('.delete-product').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!confirm('Delete this product?')) return;
        await request(`/api/products/${button.dataset.id}`, { method: 'DELETE' });
        loadProducts();
      });
    });
  };

  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = productFormValues(productForm);
      data.set('images', productForm.elements.imagesText.value);
      const id = productForm.elements.productId.value;
      await request(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PUT' : 'POST', body: data });
      productForm.reset();
      productForm.elements.productId.value = '';
      $('#productSubmit').textContent = 'Save Product';
      flash($('#adminMessage'), 'Product saved successfully.', true);
      await loadCategories([$('#adminCategoryFilter')]);
      loadProducts();
    } catch (error) {
      flash($('#adminMessage'), error.message);
    }
  });
  $('#resetProductForm').addEventListener('click', () => {
    productForm.reset();
    productForm.elements.productId.value = '';
    $('#productSubmit').textContent = 'Save Product';
  });
  $('#adminCategoryFilter').addEventListener('change', loadProducts);
  loadProducts();
  loadOrders();
};

document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  const initializers = {
    home: initHome,
    products: initProducts,
    product: initProductDetail,
    cart: initCart,
    checkout: initCheckout,
    auth: initAuth,
    dashboard: initDashboard,
    admin: initAdmin
  };
  initializers[page]?.().catch((error) => {
    const target = $('#pageMessage') || $('.container');
    flash(target, error.message);
  });
});
