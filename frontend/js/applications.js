let allApplications = [];
let currentFilterTab = 'All';

async function initApplicationsPage() {
  const token = getToken();
  if (!token) {
    window.location.href = './login.html';
    return;
  }
  setupApplicationTabListeners();
  await fetchApplications();
}

function setupApplicationTabListeners() {
  document.querySelectorAll('.app-filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.app-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilterTab = tab.getAttribute('data-status') || 'All';
      renderApplicationsList();
    });
  });
}

async function fetchApplications() {
  const container = document.getElementById('applications-list-container');
  if (container) {
    container.innerHTML = `<div style="text-align: center; padding: 3rem;"><p>Loading your applications...</p></div>`;
  }

  try {
    const res = await apiRequest('/applications');
    if (res.success) {
      allApplications = res.applications;
      renderApplicationsList();
    }
  } catch (error) {
    if (container) {
      container.innerHTML = `<div style="color: #ef4444; padding: 2rem;">Error: ${error.message}</div>`;
    }
  }
}

function renderApplicationsList() {
  const container = document.getElementById('applications-list-container');
  if (!container) return;

  const filtered = currentFilterTab === 'All'
    ? allApplications
    : allApplications.filter(a => a.status === currentFilterTab);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📂</span>
        <h3>No applications in "${currentFilterTab}"</h3>
        <p style="color: var(--text-muted); margin: 0.5rem 0 1.5rem;">
          ${currentFilterTab === 'All' ? 'You have not submitted any applications yet.' : `There are no applications currently marked as ${currentFilterTab}.`}
        </p>
        <a href="./scholarships.html" class="btn btn-primary btn-sm">Find Scholarships to Apply</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(app => {
    const sch = app.scholarshipId || {};
    const badgeClass = getAppBadgeClass(app.status);

    return `
      <div class="card" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span class="badge badge-scheme">${sch.scheme || 'Scholarship Scheme'}</span>
              <span class="badge ${badgeClass}">${app.status}</span>
            </div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.25rem;">
              <a href="./application-details.html?id=${app._id}">${sch.name || 'Scholarship'}</a>
            </h3>
            <div style="font-size: 0.84rem; color: var(--text-muted);">🏛️ ${sch.provider || 'Ministry of Tribal Affairs'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.78rem; color: var(--text-muted);">Application ID:</div>
            <strong style="font-size: 1rem; color: var(--text-main);">${app.applicationId}</strong>
          </div>
        </div>

        <div style="background-color: var(--bg-alt); border-radius: var(--radius-md); padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0; font-size: 0.86rem;">
          <div>
            <span>Submitted On: <strong>${formatDate(app.submittedAt)}</strong></span>
          </div>
          <div>
            <span>Current Stage: <strong style="color: var(--primary);">${app.currentTimelineStage || 'Under Verification'}</strong></span>
          </div>
          <div>
            <span>Match at Submission: <strong>${app.matchScoreAtSubmission || 90}%</strong></span>
          </div>
        </div>

        ${app.adminRemarks ? `
          <div style="font-size: 0.82rem; color: var(--text-body); background: #f8fafc; border-left: 3px solid var(--primary); padding: 0.5rem 0.75rem; margin-bottom: 1rem;">
            <strong>Latest Remarks:</strong> ${app.adminRemarks}
          </div>
        ` : ''}

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
          <a href="./scholarship-details.html?id=${sch._id}" class="btn btn-outline btn-sm">Scheme Info</a>
          <a href="./application-details.html?id=${app._id}" class="btn btn-primary btn-sm">Track Application Journey →</a>
        </div>
      </div>
    `;
  }).join('');
}

function getAppBadgeClass(status) {
  switch (status) {
    case 'Approved': return 'badge-approved';
    case 'Under Review': return 'badge-review';
    case 'Rejected': return 'badge-rejected';
    case 'Submitted': return 'badge-submitted';
    default: return 'badge-draft';
  }
}

// APPLICATION DETAILS & TRACKER PAGE

async function loadApplicationTracker() {
  const urlParams = new URLSearchParams(window.location.search);
  const appId = urlParams.get('id');

  if (!appId) {
    window.location.href = './applications.html';
    return;
  }

  try {
    const res = await apiRequest(`/applications/${appId}`);
    if (!res.success) throw new Error(res.message);

    const { application, studentDocuments } = res;
    const sch = application.scholarshipId || {};
    const stu = application.studentId || {};

    // Header Details
    setElText('app-id-display', application.applicationId);
    setElText('app-sch-name', sch.name || 'Scholarship Scheme');
    setElText('app-provider', sch.provider || 'Ministry of Tribal Affairs');
    setElText('app-submitted-date', formatDate(application.submittedAt));
    setElText('app-student-name', stu.personalDetails?.fullName || 'Student');
    setElText('app-student-id', stu.studentId || 'STU-000');
    setElText('app-course', stu.academicDetails?.course || 'Higher Education');
    setElText('app-institute', stu.academicDetails?.collegeInstitution || 'Institute');

    const statusBadgeEl = document.getElementById('app-status-badge');
    if (statusBadgeEl) {
      statusBadgeEl.className = `badge ${getAppBadgeClass(application.status)}`;
      statusBadgeEl.textContent = application.status;
    }

    // Render 6-Stage Timeline
    renderSixStageTimeline(application.timeline || [], application.status);

    // Render Submitted Documents
    renderApplicationDocuments(application.documents || studentDocuments || []);

    // Admin Remarks Box
    const remarksBox = document.getElementById('app-admin-remarks-box');
    if (remarksBox) {
      if (application.adminRemarks) {
        remarksBox.innerHTML = `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: var(--radius-md); padding: 1rem 1.25rem;">
            <h4 style="color: #166534; font-size: 0.95rem; margin-bottom: 0.35rem;">Official Welfare Desk Communication</h4>
            <p style="color: #14532d; font-size: 0.88rem; margin: 0;">${application.adminRemarks}</p>
          </div>
        `;
      } else {
        remarksBox.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No action notes issued by review desk at this time.</p>`;
      }
    }

  } catch (error) {
    console.error('Error loading application tracker:', error);
    showToast(error.message, 'error');
  }
}

// Profile Completed -> Documents Submitted -> Application Submitted -> Under Verification -> Final Decision -> Scholarship Received
function renderSixStageTimeline(timeline, overallStatus) {
  const container = document.getElementById('tracker-timeline-container');
  if (!container) return;

  const defaultStages = [
    { stage: 'Profile Completed', icon: '👤', desc: '100% verified student profile' },
    { stage: 'Documents Submitted', icon: '📁', desc: 'All mandatory certificates verified' },
    { stage: 'Application Submitted', icon: '📝', desc: 'Application filed online on portal' },
    { stage: 'Under Verification', icon: '🔍', desc: 'Administrative officer desk scrutiny' },
    { stage: 'Final Decision', icon: '⚖️', desc: 'Tribal Welfare Board sanction review' },
    { stage: 'Scholarship Received', icon: '💳', desc: 'Direct Benefit Transfer (DBT) to bank' }
  ];

  container.innerHTML = defaultStages.map((def, idx) => {
    // Find matching stage in timeline array
    const stageData = timeline.find(t => t.stage === def.stage) || {};
    const status = stageData.status || (idx === 0 || idx === 1 || idx === 2 ? 'Completed' : 'Pending');
    const isCompleted = status === 'Completed';
    const isInProgress = status === 'In Progress';
    const isRejected = status === 'Rejected';

    let statusClass = 'pending';
    let statusText = 'Pending';
    let circleColor = '#cbd5e1';

    if (isCompleted) {
      statusClass = 'completed';
      statusText = 'Completed';
      circleColor = '#10b981';
    } else if (isInProgress) {
      statusClass = 'active';
      statusText = 'In Progress';
      circleColor = '#f59e0b';
    } else if (isRejected) {
      statusClass = 'rejected';
      statusText = 'Rejected';
      circleColor = '#ef4444';
    }

    return `
      <div style="display: flex; gap: 1.5rem; position: relative; padding-bottom: 2rem;">
        <!-- Left indicator circle and connecting line -->
        <div style="display: flex; flex-direction: column; align-items: center; width: 2.5rem;">
          <div style="width: 2.5rem; height: 2.5rem; border-radius: var(--radius-full); background-color: ${circleColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; z-index: 2; box-shadow: 0 0 0 3px rgba(255,255,255,0.8);">
            ${isCompleted ? '✓' : (isInProgress ? '⏳' : (isRejected ? '✕' : idx + 1))}
          </div>
          ${idx < defaultStages.length - 1 ? `
            <div style="width: 3px; height: 100%; background-color: ${isCompleted ? '#10b981' : '#e2e8f0'}; position: absolute; top: 2.5rem; bottom: 0; left: 1.15rem; z-index: 1;"></div>
          ` : ''}
        </div>

        <!-- Stage details content -->
        <div style="flex: 1; padding-top: 0.2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
            <h4 style="font-size: 1.05rem; color: ${isInProgress ? 'var(--primary)' : 'var(--text-main)'};">
              ${def.stage}
            </h4>
            <span class="badge ${isCompleted ? 'badge-approved' : (isInProgress ? 'badge-review' : (isRejected ? 'badge-rejected' : 'badge-draft'))}">
              ${statusText}
            </span>
          </div>

          <p style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 0.35rem;">
            ${stageData.remarks || def.desc}
          </p>

          ${stageData.completedAt ? `
            <small style="font-size: 0.75rem; color: #15803d; font-weight: 600;">
              Completed on ${formatDate(stageData.completedAt)}
            </small>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderApplicationDocuments(docs) {
  const container = document.getElementById('app-documents-container');
  if (!container) return;

  if (docs.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No documents attached.</p>`;
    return;
  }

  container.innerHTML = docs.map(doc => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: var(--bg-alt); border-radius: var(--radius-md); margin-bottom: 0.5rem; font-size: 0.85rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>📄</span>
        <strong>${doc.documentType || doc.fileName}</strong>
      </div>
      <span class="badge ${doc.status === 'Verified' ? 'badge-approved' : 'badge-review'}">
        ${doc.status || 'Verified'}
      </span>
    </div>
  `).join('');
}
