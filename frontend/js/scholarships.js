let allScholarships = [];
let activeFilters = {
  q: '',
  scheme: 'All',
  educationLevel: 'All',
  maxIncome: '',
  state: 'All',
  gender: 'All',
  sort: 'deadline-soon'
};

// Initialize Discovery Page
async function initScholarshipsPage() {
  setupFilterListeners();
  await fetchScholarships();
}

function setupFilterListeners() {
  const searchInput = document.getElementById('search-query');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        activeFilters.q = e.target.value.trim();
        fetchScholarships();
      }, 350);
    });
  }

  const schemeFilter = document.getElementById('filter-scheme');
  if (schemeFilter) {
    schemeFilter.addEventListener('change', (e) => {
      activeFilters.scheme = e.target.value;
      fetchScholarships();
    });
  }

  const eduFilter = document.getElementById('filter-edu');
  if (eduFilter) {
    eduFilter.addEventListener('change', (e) => {
      activeFilters.educationLevel = e.target.value;
      fetchScholarships();
    });
  }

  const incomeFilter = document.getElementById('filter-income');
  if (incomeFilter) {
    incomeFilter.addEventListener('change', (e) => {
      activeFilters.maxIncome = e.target.value;
      fetchScholarships();
    });
  }

  const stateFilter = document.getElementById('filter-state');
  if (stateFilter) {
    stateFilter.addEventListener('change', (e) => {
      activeFilters.state = e.target.value;
      fetchScholarships();
    });
  }

  const sortFilter = document.getElementById('filter-sort');
  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      activeFilters.sort = e.target.value;
      fetchScholarships();
    });
  }
}

function resetAllFilters() {
  activeFilters = {
    q: '',
    scheme: 'All',
    educationLevel: 'All',
    maxIncome: '',
    state: 'All',
    gender: 'All',
    sort: 'deadline-soon'
  };

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setEl('search-query', '');
  setEl('filter-scheme', 'All');
  setEl('filter-edu', 'All');
  setEl('filter-income', '');
  setEl('filter-state', 'All');
  setEl('filter-sort', 'deadline-soon');

  fetchScholarships();
}

async function fetchScholarships() {
  const grid = document.getElementById('scholarships-grid');
  const countEl = document.getElementById('scholarships-count');
  if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><p>Loading scholarship schemes...</p></div>`;

  const queryParams = new URLSearchParams();
  if (activeFilters.q) queryParams.append('q', activeFilters.q);
  if (activeFilters.scheme !== 'All') queryParams.append('scheme', activeFilters.scheme);
  if (activeFilters.educationLevel !== 'All') queryParams.append('educationLevel', activeFilters.educationLevel);
  if (activeFilters.maxIncome) queryParams.append('maxIncome', activeFilters.maxIncome);
  if (activeFilters.state !== 'All') queryParams.append('state', activeFilters.state);
  if (activeFilters.sort) queryParams.append('sort', activeFilters.sort);

  try {
    const res = await apiRequest(`/scholarships?${queryParams.toString()}`);
    if (res.success) {
      allScholarships = res.scholarships;
      if (countEl) countEl.textContent = `${res.count} Schemes Found`;
      renderScholarshipCards(allScholarships);
      renderActiveTagPills();
    }
  } catch (error) {
    if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; color: #ef4444; padding: 2rem;">Error: ${error.message}</div>`;
  }
}

function renderActiveTagPills() {
  const container = document.getElementById('active-tags-bar');
  if (!container) return;

  const tags = [];
  if (activeFilters.q) tags.push({ key: 'q', label: `Keyword: "${activeFilters.q}"` });
  if (activeFilters.scheme !== 'All') tags.push({ key: 'scheme', label: `Scheme: ${activeFilters.scheme}` });
  if (activeFilters.educationLevel !== 'All') tags.push({ key: 'educationLevel', label: `Level: ${activeFilters.educationLevel}` });
  if (activeFilters.maxIncome) tags.push({ key: 'maxIncome', label: `Income ≤ ₹${Number(activeFilters.maxIncome).toLocaleString('en-IN')}` });
  if (activeFilters.state !== 'All') tags.push({ key: 'state', label: `State: ${activeFilters.state}` });

  if (tags.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = tags.map(tag => `
    <span class="tag-pill">
      ${tag.label}
      <button class="tag-remove-btn" onclick="removeActiveFilter('${tag.key}')">×</button>
    </span>
  `).join('') + `<button class="btn btn-outline btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onclick="resetAllFilters()">Clear All</button>`;
}

function removeActiveFilter(key) {
  if (key === 'q') {
    activeFilters.q = '';
    const el = document.getElementById('search-query');
    if (el) el.value = '';
  } else if (key === 'scheme') {
    activeFilters.scheme = 'All';
    const el = document.getElementById('filter-scheme');
    if (el) el.value = 'All';
  } else if (key === 'educationLevel') {
    activeFilters.educationLevel = 'All';
    const el = document.getElementById('filter-edu');
    if (el) el.value = 'All';
  } else if (key === 'maxIncome') {
    activeFilters.maxIncome = '';
    const el = document.getElementById('filter-income');
    if (el) el.value = '';
  } else if (key === 'state') {
    activeFilters.state = 'All';
    const el = document.getElementById('filter-state');
    if (el) el.value = 'All';
  }
  fetchScholarships();
}

function renderScholarshipCards(scholarships) {
  const grid = document.getElementById('scholarships-grid');
  if (!grid) return;

  if (scholarships.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <h3>No scholarships found matching your filters</h3>
        <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem;">Try relaxing your filter criteria or search terms.</p>
        <button class="btn btn-primary btn-sm" onclick="resetAllFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = scholarships.map(sch => {
    const daysLeft = getDaysRemaining(sch.deadline);
    const hasMatchScore = sch.matchScore !== null && sch.matchScore !== undefined;
    const matchClass = hasMatchScore ? (sch.matchScore >= 80 ? 'high' : (sch.matchScore >= 50 ? 'medium' : 'low')) : '';

    return `
      <div class="scholarship-card">
        <div>
          <div class="sch-top">
            <span class="badge badge-scheme">${sch.scheme}</span>
            <button class="sch-save-btn ${sch.isSaved ? 'saved' : ''}" onclick="toggleSaveScholarship('${sch._id}', this)" title="${sch.isSaved ? 'Remove from Saved' : 'Save Scholarship'}">
              ${sch.isSaved ? '❤️' : '🤍'}
            </button>
          </div>

          <h3 class="sch-title">
            <a href="./scholarship-details.html?id=${sch._id}">${sch.name}</a>
          </h3>
          <div class="sch-provider">🏛️ ${sch.provider}</div>
          <p class="sch-desc">${sch.description}</p>

          <div class="sch-badges-row">
            ${hasMatchScore ? `
              <div class="match-score-badge ${matchClass}" title="Platform-Generated Match Score">
                🎯 ${sch.matchScore}% Platform Match
              </div>
            ` : `
              <span class="badge" style="background-color: #f1f5f9; color: var(--text-muted);">Open for ST Students</span>
            `}
            <span class="badge" style="background-color: #f1f5f9; color: var(--text-body);">
              ${sch.eligibility?.eligibleStates?.includes('All India') ? 'Pan-India' : sch.eligibility?.eligibleStates?.join(', ')}
            </span>
          </div>

          <div class="sch-key-metrics">
            <div class="sch-metric-item">
              <span class="label">Award Benefit</span>
              <span class="val">${sch.benefits?.amount || 'Full Fee Cover'}</span>
            </div>
            <div class="sch-metric-item">
              <span class="label">Closing Date</span>
              <span class="val">${daysLeft}d left (${formatDate(sch.deadline)})</span>
            </div>
          </div>
        </div>

        <div class="sch-card-footer">
          <a href="./scholarship-details.html?id=${sch._id}" class="btn btn-outline-primary btn-sm">
            View Details
          </a>
          <a href="./scholarship-details.html?id=${sch._id}&action=apply" class="btn btn-primary btn-sm">
            Apply Now →
          </a>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleSaveScholarship(schId, btnElement) {
  const token = getToken();
  if (!token) {
    showToast('Please sign in to save scholarships.', 'warning');
    setTimeout(() => { window.location.href = './login.html'; }, 1000);
    return;
  }

  try {
    const res = await apiRequest(`/students/save-scholarship/${schId}`, { method: 'POST' });
    if (res.success) {
      if (res.saved) {
        btnElement.classList.add('saved');
        btnElement.innerHTML = '❤️';
        showToast(res.message, 'success');
      } else {
        btnElement.classList.remove('saved');
        btnElement.innerHTML = '🤍';
        showToast(res.message, 'info');
      }
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// SCHOLARSHIP DETAILS PAGE LOGIC

let currentScholarship = null;

async function loadScholarshipDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const schId = urlParams.get('id');

  if (!schId) {
    window.location.href = './scholarships.html';
    return;
  }

  try {
    const res = await apiRequest(`/scholarships/${schId}`);
    if (!res.success) throw new Error(res.message);

    currentScholarship = res.scholarship;
    const sch = currentScholarship;

    // Set page titles
    document.title = `${sch.name} | AdivasiSetu`;
    setElText('details-scheme-badge', sch.scheme);
    setElText('details-name', sch.name);
    setElText('details-provider', `🏛️ ${sch.provider} • (${sch.providerType || 'Government'})`);
    setElText('details-overview', sch.description);

    // Key stats
    setElText('details-amount', sch.benefits?.amount || 'Comprehensive Support');
    setElText('details-duration', sch.benefits?.duration || 'Course Duration');
    setElText('details-deadline', `${formatDate(sch.deadline)} (${getDaysRemaining(sch.deadline)} days remaining)`);
    setElText('details-slots', `${sch.totalSlots ? sch.totalSlots.toLocaleString('en-IN') : 'Unlimited'} Slots`);

    // Match breakdown widget
    renderDetailsMatchScore(sch);

    // Eligibility criteria lists
    renderEligibilityDetails(sch.eligibility);

    // Benefits list
    renderBenefitsDetails(sch.benefits);

    // Required documents list
    renderDocumentsDetails(sch.documents);

    // Save button state
    const saveBtn = document.getElementById('details-save-btn');
    if (saveBtn) {
      if (sch.isSaved) {
        saveBtn.classList.add('saved');
        saveBtn.innerHTML = '❤️ Saved in Bookmarks';
      }
      saveBtn.onclick = () => toggleSaveScholarship(sch._id, saveBtn);
    }

    // Auto open apply modal if ?action=apply
    if (urlParams.get('action') === 'apply') {
      openApplyModal();
    }

  } catch (error) {
    console.error('Error loading scholarship details:', error);
    showToast(error.message, 'error');
  }
}

function renderDetailsMatchScore(sch) {
  const container = document.getElementById('details-match-widget');
  if (!container) return;

  if (sch.matchScore === null || sch.matchScore === undefined) {
    container.innerHTML = `
      <div class="card" style="background: #f8fafc; text-align: center; padding: 1.5rem;">
        <h4>Platform Match Score</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 1rem;">
          Sign in to automatically evaluate your ST profile against this scholarship's rules.
        </p>
        <a href="./login.html" class="btn btn-outline-primary btn-sm">Sign In to Check Match</a>
      </div>
    `;
    return;
  }

  const matchClass = sch.matchScore >= 80 ? 'high' : (sch.matchScore >= 50 ? 'medium' : 'low');
  const b = sch.breakdown || {};

  container.innerHTML = `
    <div class="card" style="border: 2px solid ${sch.matchScore >= 80 ? '#86efac' : '#fde68a'};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">
            Platform-Generated Match
          </span>
          <h4 style="font-size: 1.4rem; color: var(--text-main);">${sch.matchScore}% Match</h4>
        </div>
        <div class="match-score-badge ${matchClass}">
          ${sch.matchCategory}
        </div>
      </div>

      <div style="font-size: 0.82rem; margin-bottom: 1rem;">
        <div style="margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
          <span>Category Eligibility:</span>
          <strong>${b.category?.status === 'Pass' ? '✅ Pass (20/20)' : '❌ Incomplete (0/20)'}</strong>
        </div>
        <div style="margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
          <span>Education Level:</span>
          <strong>${b.education?.status === 'Pass' ? '✅ Pass (20/20)' : `⚠️ ${b.education?.status} (${b.education?.score}/20)`}</strong>
        </div>
        <div style="margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
          <span>Family Income:</span>
          <strong>${b.income?.status === 'Pass' ? '✅ Pass (20/20)' : `⚠️ ${b.income?.status} (${b.income?.score}/20)`}</strong>
        </div>
        <div style="margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
          <span>Academic Marks:</span>
          <strong>${b.academic?.status === 'Pass' ? '✅ Pass (15/15)' : `⚠️ ${b.academic?.status} (${b.academic?.score}/15)`}</strong>
        </div>
        <div style="margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
          <span>State Domicile:</span>
          <strong>${b.state?.status === 'Pass' ? '✅ Pass (10/10)' : `⚠️ ${b.state?.status} (${b.state?.score}/10)`}</strong>
        </div>
        <div style="margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
          <span>Documents Attached:</span>
          <strong>${b.documents?.status === 'Pass' ? '✅ Ready (15/15)' : `⚠️ Partial (${b.documents?.score}/15)`}</strong>
        </div>
      </div>

      <div class="disclaimer-box" style="margin: 0; background: #f8fafc; color: var(--text-muted); border-color: var(--border);">
        <small><strong>Note:</strong> This score is platform-generated guidance based on published rules. Final sanction rests with the Ministry/State Tribal Welfare Department.</small>
      </div>
    </div>
  `;
}

function renderEligibilityDetails(eligibility) {
  const container = document.getElementById('details-eligibility-list');
  if (!container || !eligibility) return;

  const items = [
    `<strong>Community / Category:</strong> Open strictly to <em>${(eligibility.category || ['Scheduled Tribe (ST)']).join(', ')}</em> students.`,
    `<strong>Academic Education Level:</strong> ${eligibility.educationLevels?.join(', ') || 'All Higher Education Courses'}.`,
    `<strong>Family Annual Income Limit:</strong> Annual household income must be ≤ <strong>₹${Number(eligibility.maxFamilyIncome || 250000).toLocaleString('en-IN')}</strong>.`,
    `<strong>Minimum Qualifying Marks:</strong> At least <strong>${eligibility.minPercentage || 50}%</strong> in previous qualifying board/degree exam.`,
    `<strong>Eligible States / Regions:</strong> ${eligibility.eligibleStates?.join(', ') || 'All India'}.`
  ];

  if (eligibility.otherConditions && eligibility.otherConditions.length > 0) {
    eligibility.otherConditions.forEach(cond => {
      items.push(`<strong>Additional Norm:</strong> ${cond}`);
    });
  }

  container.innerHTML = items.map(item => `
    <li>
      <span class="criteria-icon">✓</span>
      <div>${item}</div>
    </li>
  `).join('');
}

function renderBenefitsDetails(benefits) {
  const container = document.getElementById('details-benefits-list');
  if (!container || !benefits) return;

  let html = `<p style="margin-bottom: 1rem; font-size: 0.92rem;">${benefits.description || 'Full financial scholarship assistance.'}</p>`;
  if (benefits.allowances && benefits.allowances.length > 0) {
    html += `
      <ul class="criteria-list">
        ${benefits.allowances.map(a => `
          <li><span class="criteria-icon">🎁</span> <div><strong>${a}</strong></div></li>
        `).join('')}
      </ul>
    `;
  }
  container.innerHTML = html;
}

function renderDocumentsDetails(documents) {
  const container = document.getElementById('details-documents-list');
  if (!container || !documents) return;

  container.innerHTML = documents.map(doc => `
    <div class="doc-pill-item">
      <span>📄 ${doc}</span>
      <span class="badge" style="background-color: var(--primary-light); color: var(--primary-dark);">Mandatory</span>
    </div>
  `).join('');
}

// Open Application Submission Modal
function openApplyModal() {
  const token = getToken();
  if (!token) {
    showToast('Please log in as a student to apply.', 'warning');
    setTimeout(() => {
      window.location.href = `./login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }, 800);
    return;
  }

  if (!currentScholarship) return;
  const sch = currentScholarship;

  // Set modal header details
  setElText('modal-apply-scheme-badge', sch.scheme || 'Scholarship Scheme');
  setElText('modal-apply-sch-name', sch.name || 'Scholarship');
  setElText('modal-apply-provider', `🏛️ ${sch.provider || 'Ministry of Tribal Affairs'} (${sch.providerType || 'Government'})`);

  // Financial Benefits & Allowances
  const benefitsText = document.getElementById('modal-apply-benefits-text');
  if (benefitsText) {
    benefitsText.textContent = `Grant Value: ${sch.benefits?.amount || 'Full Tuition Coverage'} (${sch.benefits?.duration || 'Course Duration'})`;
  }

  const allowancesContainer = document.getElementById('modal-apply-allowances-list');
  if (allowancesContainer) {
    if (sch.benefits?.allowances && sch.benefits.allowances.length > 0) {
      allowancesContainer.innerHTML = sch.benefits.allowances.map(a => `<div>• 🎁 ${a}</div>`).join('');
    } else {
      allowancesContainer.innerHTML = '<div>• Direct Benefit Transfer (DBT) credit to Aadhaar-linked bank account</div>';
    }
  }

  // Eligibility Criteria List
  const elList = document.getElementById('modal-apply-eligibility-list');
  if (elList && sch.eligibility) {
    const el = sch.eligibility;
    const items = [
      `Category: <strong>${(el.category || ['Scheduled Tribe (ST)']).join(', ')}</strong>`,
      `Income Ceiling: <strong>≤ ₹${Number(el.maxFamilyIncome || 250000).toLocaleString('en-IN')}/year</strong>`,
      `Academic Level: <strong>${(el.educationLevels || ['Higher Education']).join(', ')}</strong>`,
      `Min Qualifying Marks: <strong>≥ ${el.minPercentage || 50}%</strong>`,
      `Domicile Region: <strong>${(el.eligibleStates || ['All India']).join(', ')}</strong>`
    ];
    elList.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }

  // Documents List
  const docsList = document.getElementById('modal-apply-docs-list');
  if (docsList && sch.documents) {
    docsList.innerHTML = sch.documents.map(doc => `
      <span class="doc-pill-item" style="padding: 0.25rem 0.6rem; font-size: 0.78rem;">
        📄 ${doc}
      </span>
    `).join('');
  }

  openModal('apply-confirmation-modal');
}

// Submit Application
async function submitScholarshipApplication() {
  if (!currentScholarship) return;

  const submitBtn = document.getElementById('confirm-apply-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting Application...';
  }

  try {
    const res = await apiRequest('/applications', {
      method: 'POST',
      body: JSON.stringify({ scholarshipId: currentScholarship._id })
    });

    if (res.success) {
      closeModal('apply-confirmation-modal');
      showToast(`Application successfully filed! ID: ${res.applicationId}`, 'success');
      setTimeout(() => {
        window.location.href = `./application-details.html?id=${res.application._id}`;
      }, 1000);
    }
  } catch (error) {
    showToast(error.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Confirm & Submit Application';
    }
  }
}
