/**
 * ADIVASISETU - ADMIN PORTAL & ANALYTICS JS
 * Section 22 to 26: Administrative Dashboard, CRUD Scholarships, Application Review, Analytics
 */

let adminStats = {};
let adminAnalytics = {};
let adminScholarships = [];
let adminApplications = [];
let selectedApplication = null;

async function initAdminPortal() {
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user || user.role !== 'admin') {
    showToast('Administrator privileges required. Please sign in as admin.', 'warning');
    setTimeout(() => {
      window.location.href = './login.html';
    }, 800);
    return;
  }

  setupAdminTabs();
  await loadAdminDashboardData();
}

function setupAdminTabs() {
  document.querySelectorAll('.admin-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-pane').forEach(p => p.style.display = 'none');

      tab.classList.add('active');
      const targetPaneId = tab.getAttribute('data-target');
      const targetPane = document.getElementById(targetPaneId);
      if (targetPane) targetPane.style.display = 'block';

      if (targetPaneId === 'admin-pane-scholarships') {
        loadAdminScholarships();
      } else if (targetPaneId === 'admin-pane-applications') {
        loadAdminApplications();
      } else if (targetPaneId === 'admin-pane-analytics') {
        renderAnalyticsBars();
      }
    });
  });
}

async function loadAdminDashboardData() {
  try {
    // 1. Stats
    const statsRes = await apiRequest('/admin/dashboard-stats');
    if (statsRes.success) {
      adminStats = statsRes.stats;
      setElText('admin-stat-students', adminStats.totalStudents || 0);
      setElText('admin-stat-scholarships', adminStats.totalScholarships || 0);
      setElText('admin-stat-applications', adminStats.totalApplications || 0);
      setElText('admin-stat-pending', adminStats.pendingVerification || 0);
    }

    // 2. Analytics
    const analyticsRes = await apiRequest('/admin/analytics');
    if (analyticsRes.success) {
      adminAnalytics = analyticsRes.analytics;
      renderAnalyticsBars();
    }

    // 3. Applications default preview
    await loadAdminApplications();

  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    showToast(error.message, 'error');
  }
}

// ============================================================================
// SCHOLARSHIP MANAGEMENT (SECTION 23 & 24)
// ============================================================================

async function loadAdminScholarships() {
  const container = document.getElementById('admin-scholarships-table-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading scholarship schemes...</td></tr>`;

  try {
    const res = await apiRequest('/scholarships?status=All');
    if (res.success) {
      adminScholarships = res.scholarships;
      renderAdminScholarshipsTable();
    }
  } catch (error) {
    container.innerHTML = `<tr><td colspan="6" style="color: #ef4444; padding: 2rem;">Error: ${error.message}</td></tr>`;
  }
}

function renderAdminScholarshipsTable() {
  const tbody = document.getElementById('admin-scholarships-table-body');
  if (!tbody) return;

  if (adminScholarships.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No schemes configured.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminScholarships.map(sch => {
    const isActive = sch.status === 'Active';
    return `
      <tr>
        <td><strong>${sch.name}</strong></td>
        <td><span class="badge badge-scheme">${sch.scheme}</span></td>
        <td>${formatCurrency(sch.benefits?.amountPerYear || 0)} / yr</td>
        <td>${formatDate(sch.deadline)}</td>
        <td>
          <span class="badge ${isActive ? 'badge-approved' : 'badge-draft'}">
            ${sch.status}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" onclick="toggleScholarshipStatus('${sch._id}', '${isActive ? 'Disabled' : 'Active'}')">
              ${isActive ? 'Disable' : 'Enable'}
            </button>
            <button class="btn btn-outline-primary btn-sm" onclick="openEditScholarshipModal('${sch._id}')">
              Edit
            </button>
            <button class="btn btn-outline btn-sm" style="color: #ef4444;" onclick="deleteScholarshipScheme('${sch._id}')">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleScholarshipStatus(id, newStatus) {
  try {
    const res = await apiRequest(`/scholarships/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      showToast(res.message, 'success');
      await loadAdminScholarships();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteScholarshipScheme(id) {
  if (!confirm('Are you sure you want to delete this scholarship scheme?')) return;

  try {
    const res = await apiRequest(`/scholarships/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast(res.message, 'info');
      await loadAdminScholarships();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function openAddScholarshipModal() {
  const form = document.getElementById('scholarship-form');
  if (form) form.reset();
  document.getElementById('modal-sch-id').value = '';
  document.getElementById('modal-sch-title-text').textContent = 'Add New Scholarship Scheme';
  openModal('admin-scholarship-modal');
}

function openEditScholarshipModal(id) {
  const sch = adminScholarships.find(s => s._id === id);
  if (!sch) return;

  document.getElementById('modal-sch-id').value = sch._id;
  document.getElementById('modal-sch-title-text').textContent = 'Edit Scholarship Scheme';
  setVal('modal-sch-name', sch.name);
  setVal('modal-sch-scheme', sch.scheme);
  setVal('modal-sch-provider', sch.provider);
  setVal('modal-sch-amount', sch.benefits?.amount);
  setVal('modal-sch-amount-year', sch.benefits?.amountPerYear);
  setVal('modal-sch-income', sch.eligibility?.maxFamilyIncome);
  setVal('modal-sch-marks', sch.eligibility?.minPercentage);
  setVal('modal-sch-desc', sch.description);

  openModal('admin-scholarship-modal');
}

async function handleSaveScholarship(e) {
  e.preventDefault();
  const id = document.getElementById('modal-sch-id')?.value;
  const name = document.getElementById('modal-sch-name')?.value.trim();
  const scheme = document.getElementById('modal-sch-scheme')?.value;
  const provider = document.getElementById('modal-sch-provider')?.value.trim();
  const amount = document.getElementById('modal-sch-amount')?.value.trim();
  const amountPerYear = Number(document.getElementById('modal-sch-amount-year')?.value || 0);
  const maxFamilyIncome = Number(document.getElementById('modal-sch-income')?.value || 250000);
  const minPercentage = Number(document.getElementById('modal-sch-marks')?.value || 50);
  const description = document.getElementById('modal-sch-desc')?.value.trim();

  const payload = {
    name,
    scheme,
    provider,
    description,
    benefits: {
      amount,
      amountPerYear,
      duration: 'Per Academic Year'
    },
    eligibility: {
      maxFamilyIncome,
      minPercentage,
      category: ['Scheduled Tribe (ST)'],
      eligibleStates: ['All India']
    },
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
  };

  try {
    let res;
    if (id) {
      res = await apiRequest(`/scholarships/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      res = await apiRequest('/scholarships', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    if (res.success) {
      closeModal('admin-scholarship-modal');
      showToast(res.message, 'success');
      await loadAdminScholarships();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ============================================================================
// APPLICATION MANAGEMENT (SECTION 25)
// ============================================================================

async function loadAdminApplications() {
  const tbody = document.getElementById('admin-applications-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading applications...</td></tr>`;

  try {
    const res = await apiRequest('/applications');
    if (res.success) {
      adminApplications = res.applications;
      renderAdminApplicationsTable();
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #ef4444; padding: 2rem;">Error: ${error.message}</td></tr>`;
  }
}

function renderAdminApplicationsTable() {
  const tbody = document.getElementById('admin-applications-table-body');
  if (!tbody) return;

  if (adminApplications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No applications received yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminApplications.map(app => {
    const stu = app.studentId || {};
    const sch = app.scholarshipId || {};
    const badgeClass = getAppBadgeClass(app.status);

    return `
      <tr>
        <td>
          <strong>${app.applicationId}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(app.submittedAt)}</div>
        </td>
        <td>
          <strong>${stu.personalDetails?.fullName || stu.userId?.name || 'Student'}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${stu.personalDetails?.state || 'ST Domicile'}</div>
        </td>
        <td>${sch.name || 'Scholarship Scheme'}</td>
        <td>
          <div class="match-score-badge ${app.matchScoreAtSubmission >= 80 ? 'high' : 'medium'}" style="font-size: 0.75rem;">
            ${app.matchScoreAtSubmission || 85}%
          </div>
        </td>
        <td><span class="badge ${badgeClass}">${app.status}</span></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="openReviewApplicationModal('${app._id}')">
            Review / Update ✍️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openReviewApplicationModal(appId) {
  selectedApplication = adminApplications.find(a => a._id === appId);
  if (!selectedApplication) return;

  const app = selectedApplication;
  const stu = app.studentId || {};
  const sch = app.scholarshipId || {};

  setElText('rev-app-id', app.applicationId);
  setElText('rev-student-name', stu.personalDetails?.fullName || stu.userId?.name || 'Student');
  setElText('rev-student-meta', `${stu.categoryDetails?.tribalCommunity || 'ST'} • ${stu.academicDetails?.course || ''} • ${stu.personalDetails?.state || ''}`);
  setElText('rev-sch-name', sch.name || 'Scholarship');
  setElText('rev-income', formatCurrency(stu.financialDetails?.annualFamilyIncome || 0));

  const statusSelect = document.getElementById('rev-status-select');
  if (statusSelect) statusSelect.value = app.status;

  const remarksInput = document.getElementById('rev-remarks-input');
  if (remarksInput) remarksInput.value = app.adminRemarks || '';

  // Render documents preview
  const docsList = document.getElementById('rev-docs-list');
  if (docsList) {
    const docs = app.documents || [];
    docsList.innerHTML = docs.length > 0
      ? docs.map(d => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-alt); border-radius: var(--radius-sm); margin-bottom: 0.35rem; font-size: 0.82rem;">
          <span>📄 <strong>${d.documentType}</strong> (${d.fileName || 'file'})</span>
          <span class="badge ${d.status === 'Verified' ? 'badge-approved' : 'badge-review'}">${d.status || 'Verified'}</span>
        </div>
      `).join('')
      : '<p style="color: var(--text-muted); font-size: 0.8rem;">No documents attached.</p>';
  }

  openModal('admin-review-modal');
}

async function submitApplicationStatusUpdate() {
  if (!selectedApplication) return;

  const status = document.getElementById('rev-status-select')?.value;
  const adminRemarks = document.getElementById('rev-remarks-input')?.value.trim();

  const submitBtn = document.getElementById('confirm-review-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Updating Status...';
  }

  try {
    const res = await apiRequest(`/applications/${selectedApplication._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminRemarks })
    });

    if (res.success) {
      closeModal('admin-review-modal');
      showToast(`Application ${selectedApplication.applicationId} updated to ${status}. Notification dispatched to student!`, 'success');
      await loadAdminDashboardData();
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Decision & Notify Student';
    }
  }
}

// ============================================================================
// ANALYTICS BARS (SECTION 26)
// ============================================================================

function renderAnalyticsBars() {
  if (!adminAnalytics || !adminAnalytics.applicationsByScheme) return;

  // 1. Applications by Scheme
  const schemeBox = document.getElementById('analytics-schemes-box');
  if (schemeBox) {
    const schemes = adminAnalytics.applicationsByScheme;
    const maxScheme = Math.max(...Object.values(schemes), 1);
    const colors = ['teal', 'amber', 'blue', 'green', 'purple'];

    schemeBox.innerHTML = Object.entries(schemes).map(([name, count], idx) => {
      const pct = Math.round((count / maxScheme) * 100);
      const color = colors[idx % colors.length];
      return `
        <div class="bar-item">
          <div class="bar-meta">
            <span>${name}</span>
            <span>${count} Applications</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${color}" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Status Distribution
  const statusBox = document.getElementById('analytics-status-box');
  if (statusBox) {
    const statuses = adminAnalytics.applicationsByStatus || {};
    const total = Object.values(statuses).reduce((a, b) => a + b, 0) || 1;

    statusBox.innerHTML = Object.entries(statuses).map(([st, count]) => {
      const pct = Math.round((count / total) * 100);
      let color = 'teal';
      if (st === 'Approved') color = 'green';
      if (st === 'Under Review') color = 'amber';
      if (st === 'Rejected') color = 'purple';

      return `
        <div class="bar-item">
          <div class="bar-meta">
            <span>${st}</span>
            <span>${count} (${pct}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${color}" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}
