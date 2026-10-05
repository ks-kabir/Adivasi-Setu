async function loadStudentDashboard() {
  const token = getToken();
  if (!token) {
    window.location.href = './login.html';
    return;
  }

  try {
    const res = await apiRequest('/students/dashboard-summary');
    if (!res.success) throw new Error(res.message);

    const { student, stats, recommendedScholarships, applicationsOverview, recentNotifications, upcomingDeadlines } = res;

    // 1. Render Greeting
    const greetingNameEl = document.getElementById('dash-student-name');
    const greetingTribalEl = document.getElementById('dash-tribal-badge');
    const greetingSubEl = document.getElementById('dash-greeting-sub');

    if (greetingNameEl) {
      greetingNameEl.textContent = student.personalDetails?.fullName || 'Tribal Scholar';
    }
    if (greetingTribalEl) {
      const community = student.categoryDetails?.tribalCommunity || 'Scheduled Tribe';
      const state = student.personalDetails?.state || 'India';
      greetingTribalEl.textContent = `🏹 ${community} Tribe • ${state}`;
    }
    if (greetingSubEl) {
      greetingSubEl.textContent = `${student.academicDetails?.course || 'Higher Education'} • ${student.academicDetails?.collegeInstitution || 'Recognized Institute'}`;
    }

    // 2. Render Journey Progress
    renderJourneyProgress(stats.currentJourneyStage || 2);

    // 3. Render Metric Stats
    setElText('stat-eligible-count', stats.eligibleScholarshipsCount || 0);
    setElText('stat-applications-count', stats.applicationsCount || 0);
    setElText('stat-docs-verified', stats.verifiedDocsCount || 0);
    setElText('stat-deadlines-count', (upcomingDeadlines || []).length);

    // 4. Render Recommended Scholarships
    renderRecommendedScholarships(recommendedScholarships || []);

    // 5. Render Recent Applications Overview
    renderApplicationsOverview(applicationsOverview || []);

    // 6. Render Upcoming Deadlines Widget
    renderUpcomingDeadlines(upcomingDeadlines || []);

    // 7. Render Notifications Preview
    renderDashboardNotifications(recentNotifications || []);

  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast(error.message, 'error');
  }
}

function renderJourneyProgress(stageIndex) {
  const steps = document.querySelectorAll('.journey-step');
  const progressLine = document.getElementById('journey-line-progress');

  steps.forEach((step, idx) => {
    const stepNum = idx + 1;
    step.classList.toggle('completed', stepNum < stageIndex);
    step.classList.toggle('active', stepNum === stageIndex);
  });

  if (progressLine) {
    const percentage = Math.min(100, Math.max(0, ((stageIndex - 1) / (steps.length - 1)) * 100));
    progressLine.style.width = percentage + '%';
  }
}

function renderRecommendedScholarships(scholarships) {
  const container = document.getElementById('dash-recommended-container');
  if (!container) return;

  if (scholarships.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <p style="color: var(--text-muted); margin-bottom: 1rem;">No matching scholarships found for current criteria.</p>
        <a href="./eligibility.html" class="btn btn-outline-primary btn-sm">Update Eligibility Criteria</a>
      </div>
    `;
    return;
  }

  container.innerHTML = scholarships.map(sch => {
    const matchClass = sch.matchScore >= 80 ? 'high' : (sch.matchScore >= 50 ? 'medium' : 'low');
    const daysLeft = getDaysRemaining(sch.deadline);

    // Build "Why you match" items
    const breakdown = sch.breakdown || {};
    const matchReasons = [];
    if (breakdown.category?.status === 'Pass') {
      matchReasons.push(`<li class="why-match-item pass">✓ Category: ${breakdown.category.reason}</li>`);
    }
    if (breakdown.education?.status === 'Pass') {
      matchReasons.push(`<li class="why-match-item pass">✓ Academic Level: ${breakdown.education.reason}</li>`);
    }
    if (breakdown.income?.status === 'Pass') {
      matchReasons.push(`<li class="why-match-item pass">✓ Family Income: ${breakdown.income.reason}</li>`);
    }
    if (breakdown.academic?.status === 'Pass') {
      matchReasons.push(`<li class="why-match-item pass">✓ Qualifying Marks: ${breakdown.academic.reason}</li>`);
    }

    return `
      <div class="rec-scholarship-card">
        <div class="rec-card-header">
          <div class="rec-title-wrap">
            <span class="badge badge-scheme" style="margin-bottom: 0.35rem;">${sch.scheme}</span>
            <h4><a href="./scholarship-details.html?id=${sch._id}">${sch.name}</a></h4>
            <div class="rec-provider">🏛️ ${sch.provider}</div>
          </div>
          <div class="match-score-badge ${matchClass}" title="Platform-Generated Match Score">
            🎯 ${sch.matchScore}% Match
          </div>
        </div>

        <div class="rec-card-meta">
          <div class="rec-meta-item">
            <span>💰 Amount:</span>
            <strong>${sch.benefits?.amount || 'Full Support'}</strong>
          </div>
          <div class="rec-meta-item">
            <span>⏳ Closes in:</span>
            <strong>${daysLeft} Days (${formatDate(sch.deadline)})</strong>
          </div>
        </div>

        <div class="why-match-box">
          <div class="why-match-title">💡 Why you match:</div>
          <ul class="why-match-list">
            ${matchReasons.slice(0, 3).join('') || '<li class="why-match-item pass">✓ Basic tribal student criteria match</li>'}
          </ul>
        </div>

        <div class="rec-card-actions">
          <a href="./scholarship-details.html?id=${sch._id}" class="btn btn-outline-primary btn-sm">
            View Details & Criteria
          </a>
          <a href="./scholarship-details.html?id=${sch._id}&action=apply" class="btn btn-primary btn-sm">
            Apply Now →
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function renderApplicationsOverview(applications) {
  const container = document.getElementById('dash-applications-container');
  if (!container) return;

  if (applications.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <p>You haven't submitted any scholarship applications yet.</p>
        <a href="./scholarships.html" class="btn btn-primary btn-sm">Discover Scholarships</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Application ID</th>
            <th>Scholarship Scheme</th>
            <th>Submission Date</th>
            <th>Current Status</th>
            <th>Tracker</th>
          </tr>
        </thead>
        <tbody>
          ${applications.map(app => {
            const badgeClass = getStatusBadgeClass(app.status);
            return `
              <tr>
                <td><strong>${app.applicationId}</strong></td>
                <td>${app.scholarshipId?.name || 'Scholarship Scheme'}</td>
                <td>${formatDate(app.submittedAt)}</td>
                <td><span class="badge ${badgeClass}">${app.status}</span></td>
                <td>
                  <a href="./application-details.html?id=${app._id}" class="btn btn-outline btn-sm">
                    Track Journey →
                  </a>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderUpcomingDeadlines(deadlines) {
  const container = document.getElementById('dash-deadlines-container');
  if (!container) return;

  if (deadlines.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No impending scheme deadlines in the next 30 days.</p>`;
    return;
  }

  container.innerHTML = deadlines.map(sch => {
    const daysLeft = getDaysRemaining(sch.deadline);
    return `
      <div class="deadline-item">
        <div class="deadline-info">
          <h5><a href="./scholarship-details.html?id=${sch._id}">${sch.name}</a></h5>
          <span>Last date: ${formatDate(sch.deadline)}</span>
        </div>
        <div class="deadline-days">
          ${daysLeft}d remaining
        </div>
      </div>
    `;
  }).join('');
}

function renderDashboardNotifications(notifications) {
  const container = document.getElementById('dash-notifications-container');
  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No recent notifications.</p>`;
    return;
  }

  container.innerHTML = notifications.map(n => `
    <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
        <span class="badge ${n.type === 'JAGO' ? 'badge-jago' : 'badge-scheme'}" style="font-size: 0.68rem;">${n.badgeText || n.type}</span>
        <span style="font-size: 0.72rem; color: var(--text-muted);">${formatDate(n.createdAt)}</span>
      </div>
      <h5 style="font-size: 0.88rem; margin-bottom: 0.15rem;"><a href="${n.link || '#'}">${n.title}</a></h5>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">${n.message}</p>
    </div>
  `).join('');
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Approved': return 'badge-approved';
    case 'Under Review': return 'badge-review';
    case 'Rejected': return 'badge-rejected';
    case 'Submitted': return 'badge-submitted';
    default: return 'badge-draft';
  }
}
