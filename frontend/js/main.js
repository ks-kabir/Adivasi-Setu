/**
 * ADIVASISETU - GLOBAL UTILITIES & CORE JS
 * Tagline: One Platform • Five Schemes • One Scholarship Journey
 */

const API_BASE = (window.ADIVASISETU_API_BASE || '/api').replace(/\/+$/, '');

function appPageUrl(path) {
  return `./${String(path).replace(/^\/+/, '')}`;
}

// Token & Session Storage
function getToken() {
  return localStorage.getItem('adivasisetu_token');
}

function setToken(token) {
  localStorage.setItem('adivasisetu_token', token);
}

function removeToken() {
  localStorage.removeItem('adivasisetu_token');
  localStorage.removeItem('adivasisetu_user');
}

function getCurrentUser() {
  const user = localStorage.getItem('adivasisetu_user');
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  localStorage.setItem('adivasisetu_user', JSON.stringify(user));
}

// Global API Request Helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  // Don't set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      && window.location.port !== '5000';
    const urls = [`${API_BASE}${endpoint}`];
    if (isLocalPreview) {
      urls.push(`http://localhost:5000/api${endpoint}`);
    }

    for (const [index, url] of urls.entries()) {
      let res;
      try {
        res = await fetch(url, { ...options, headers });
      } catch (fetchError) {
        if (index === 0 && urls.length > 1) continue;
        throw fetchError;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        if (index === 0 && urls.length > 1) continue;
        const message = window.location.hostname.endsWith('.github.io')
          ? 'Eligibility is unavailable on this GitHub Pages site because no backend API is configured. Set window.ADIVASISETU_API_BASE to your deployed API URL.'
          : 'The API returned a non-JSON response. Start the backend with `npm start` and open the app at http://localhost:5000.';
        throw new Error(message);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'An error occurred while processing your request.');
      }
      return data;
    }
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// Toast Notifications Helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  if (type === 'warning') icon = '🔔';

  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(1rem)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Formatting Helpers
function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'N/A';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getDaysRemaining(deadlineStr) {
  if (!deadlineStr) return 0;
  const deadline = new Date(deadlineStr);
  const diffTime = deadline - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// ============================================================================
// MOBILE NAVIGATION DRAWER CONTROLLER
// ============================================================================

function openMobileNav() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileNav() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Mobile Filter Toggle Helper for scholarships.html
function toggleMobileFilters() {
  const sidebar = document.querySelector('.filter-sidebar');
  const arrow = document.getElementById('mobile-filter-arrow');
  if (sidebar) {
    sidebar.classList.toggle('mobile-open');
    if (arrow) {
      arrow.textContent = sidebar.classList.contains('mobile-open') ? '▲' : '▼';
    }
  }
}

// ============================================================================
// NAVBAR & AUTH STATE SETUP
// ============================================================================

async function setupGlobalNavbar() {
  const navActions = document.getElementById('nav-actions');
  const user = getCurrentUser();
  const token = getToken();

  // Highlight active link in desktop navbar
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Ensure Mobile Hamburger Button Exists
  let toggleBtn = document.getElementById('mobile-menu-toggle');
  const navbarInner = document.querySelector('.navbar-inner');
  if (!toggleBtn && navbarInner) {
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.id = 'mobile-menu-toggle';
    toggleBtn.setAttribute('aria-label', 'Open mobile menu');
    toggleBtn.innerHTML = '☰';
    navbarInner.appendChild(toggleBtn);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', openMobileNav);
  }

  // Fetch unread notifications count if logged in
  let unreadCount = 0;
  if (token && user) {
    try {
      const notifRes = await apiRequest('/notifications');
      if (notifRes.success) {
        unreadCount = notifRes.unreadCount || 0;
      }
    } catch (e) { /* ignore */ }
  }

  // Render Desktop Navbar Actions
  if (navActions) {
    if (token && user) {
      const isStudent = user.role === 'student';
      const primaryLink = isStudent ? './dashboard.html' : './admin.html';
      const primaryLabel = isStudent ? 'Dashboard' : 'Admin Portal';

      navActions.innerHTML = `
        <a href="./notifications.html" class="nav-notification-btn" title="JAGO Notifications">
          🔔
          ${unreadCount > 0 ? `<span class="nav-notification-badge">${unreadCount}</span>` : ''}
        </a>
        <a href="${primaryLink}" class="btn btn-outline-primary btn-sm nav-hide-mobile">
          ${primaryLabel}
        </a>
        <div class="user-menu-pill nav-hide-mobile" id="user-profile-btn" onclick="window.location.href='${isStudent ? './profile.html' : './admin.html'}'">
          <div class="user-avatar-sm">${user.name.charAt(0).toUpperCase()}</div>
          <span class="user-name-text">${user.name.split(' ')[0]}</span>
        </div>
        <button class="btn btn-outline btn-sm nav-hide-mobile" onclick="logoutUser()" title="Logout">
          Sign Out
        </button>
      `;
    } else {
      navActions.innerHTML = `
        <a href="./login.html" class="btn btn-outline btn-sm">Sign In</a>
        <a href="./register.html" class="btn btn-primary btn-sm nav-hide-mobile">Get Started</a>
      `;
    }
  }

  // Build Mobile Drawer DOM
  buildMobileDrawer(user, token, unreadCount, currentPath);
}

function buildMobileDrawer(user, token, unreadCount, currentPath) {
  // Remove existing drawer if any
  const existingDrawer = document.getElementById('mobile-nav-drawer');
  const existingBackdrop = document.getElementById('mobile-nav-backdrop');
  if (existingDrawer) existingDrawer.remove();
  if (existingBackdrop) existingBackdrop.remove();

  // 1. Create Backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'mobile-nav-backdrop';
  backdrop.className = 'mobile-nav-backdrop';
  backdrop.onclick = closeMobileNav;
  document.body.appendChild(backdrop);

  // 2. Create Drawer
  const drawer = document.createElement('aside');
  drawer.id = 'mobile-nav-drawer';
  drawer.className = 'mobile-nav-drawer';

  const isStudent = user && user.role === 'student';
  const isAdmin = user && user.role === 'admin';

  let drawerContent = `
    <div class="mobile-drawer-header">
      <div class="brand-logo" style="gap: 0.5rem;">
        <div class="brand-icon" style="width: 2.25rem; height: 2.25rem; font-size: 1.15rem;">🏹</div>
        <div class="brand-text">
          <h1 style="font-size: 1.15rem; margin: 0;">AdivasiSetu</h1>
          <span style="font-size: 0.65rem;">Tribal Portal</span>
        </div>
      </div>
      <button class="mobile-drawer-close" onclick="closeMobileNav()" aria-label="Close menu">&times;</button>
    </div>
  `;

  if (token && user) {
    // User Info Banner
    drawerContent += `
      <div class="mobile-drawer-user">
        <div class="user-name">Johar, ${user.name}! 👋</div>
        <div class="user-sub">
          <span>${isAdmin ? '🛡️ Welfare Administrator' : '🏹 Verified ST Scholar'}</span>
          <span>•</span>
          <span>${user.email}</span>
        </div>
      </div>

      <ul class="mobile-drawer-links">
        ${isStudent ? `
          <li>
            <a href="./dashboard.html" class="mobile-drawer-link ${currentPath === 'dashboard.html' ? 'active' : ''}">
              <span class="icon">📊</span> Dashboard
            </a>
          </li>
          <li>
            <a href="./scholarships.html" class="mobile-drawer-link ${currentPath === 'scholarships.html' ? 'active' : ''}">
              <span class="icon">🔍</span> Find Scholarships
            </a>
          </li>
          <li>
            <a href="./eligibility.html" class="mobile-drawer-link ${currentPath === 'eligibility.html' ? 'active' : ''}">
              <span class="icon">🎯</span> Eligibility Engine
            </a>
          </li>
          <li>
            <a href="./documents.html" class="mobile-drawer-link ${currentPath === 'documents.html' ? 'active' : ''}">
              <span class="icon">📁</span> Document Vault
            </a>
          </li>
          <li>
            <a href="./applications.html" class="mobile-drawer-link ${currentPath === 'applications.html' ? 'active' : ''}">
              <span class="icon">📝</span> My Applications
            </a>
          </li>
          <li>
            <a href="./profile.html" class="mobile-drawer-link ${currentPath === 'profile.html' ? 'active' : ''}">
              <span class="icon">👤</span> My Profile
            </a>
          </li>
          <li>
            <a href="./notifications.html" class="mobile-drawer-link ${currentPath === 'notifications.html' ? 'active' : ''}">
              <span class="icon">🔔</span> Notifications ${unreadCount > 0 ? `<span class="badge" style="background: #ef4444; color: #fff; margin-left: auto;">${unreadCount}</span>` : ''}
            </a>
          </li>
        ` : `
          <li>
            <a href="./admin.html" class="mobile-drawer-link active">
              <span class="icon">🛡️</span> Admin Scrutiny Portal
            </a>
          </li>
          <li>
            <a href="./index.html" class="mobile-drawer-link">
              <span class="icon">🌐</span> View Student Portal
            </a>
          </li>
        `}
      </ul>

      <div class="mobile-drawer-footer">
        <button class="btn btn-outline btn-block" onclick="logoutUser()" style="color: #ef4444; border-color: #fca5a5;">
          Sign Out 🚪
        </button>
      </div>
    `;
  } else {
    // Guest Drawer
    drawerContent += `
      <div style="padding: 1.25rem; background: var(--bg-alt); border-bottom: 1px solid var(--border);">
        <h4 style="font-size: 1rem; margin-bottom: 0.25rem;">Tribal Scholarship Portal</h4>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">5 Schemes • One Simple Journey</p>
      </div>

      <ul class="mobile-drawer-links">
        <li>
          <a href="./index.html" class="mobile-drawer-link ${currentPath === 'index.html' ? 'active' : ''}">
            <span class="icon">🏠</span> Home
          </a>
        </li>
        <li>
          <a href="./scholarships.html" class="mobile-drawer-link ${currentPath === 'scholarships.html' ? 'active' : ''}">
            <span class="icon">🔍</span> Explore Scholarships
          </a>
        </li>
        <li>
          <a href="./eligibility.html" class="mobile-drawer-link ${currentPath === 'eligibility.html' ? 'active' : ''}">
            <span class="icon">🎯</span> Check Eligibility
          </a>
        </li>
        <li>
          <a href="./index.html#how-it-works" class="mobile-drawer-link" onclick="closeMobileNav()">
            <span class="icon">ℹ️</span> How It Works
          </a>
        </li>
        <li>
          <a href="./index.html#about" class="mobile-drawer-link" onclick="closeMobileNav()">
            <span class="icon">📖</span> About & FAQs
          </a>
        </li>
      </ul>

      <div class="mobile-drawer-footer">
        <a href="./login.html" class="btn btn-outline-primary btn-block">Sign In</a>
        <a href="./register.html" class="btn btn-primary btn-block">Get Started Free</a>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <button type="button" class="btn btn-outline btn-sm" style="flex: 1; font-size: 0.78rem;" onclick="quickDemoLogin('student')">
            Demo Student
          </button>
          <button type="button" class="btn btn-outline btn-sm" style="flex: 1; font-size: 0.78rem;" onclick="quickDemoLogin('admin')">
            Demo Admin
          </button>
        </div>
      </div>
    `;
  }

  drawer.innerHTML = drawerContent;
  document.body.appendChild(drawer);

  // Close drawer when any mobile nav link is clicked
  drawer.querySelectorAll('.mobile-drawer-link').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });
}

function logoutUser() {
  removeToken();
  showToast('You have been safely signed out.', 'info');
  setTimeout(() => {
    window.location.href = './login.html';
  }, 500);
}

// Global DOM Ready Handlers
document.addEventListener('DOMContentLoaded', () => {
  setupGlobalNavbar();

  // Close modals on backdrop click or close button
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  document.querySelectorAll('.modal-close-btn, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
});
