/**
 * ADIVASISETU - ELIGIBILITY ENGINE JS
 * Section 10 & 11: 6-factor explainable algorithm & interactive criteria evaluator
 */

async function initEligibilityPage() {
  await prefillStudentEligibilityInputs();
  await runEligibilityCheck();
}

async function prefillStudentEligibilityInputs() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await apiRequest('/students/profile');
    if (res.success && res.student) {
      const s = res.student;
      if (s.personalDetails?.state) {
        setVal('el-state', s.personalDetails.state);
      }
      if (s.academicDetails?.educationLevel) {
        setVal('el-edu-level', s.academicDetails.educationLevel);
      }
      if (s.academicDetails?.percentageCgpa) {
        setVal('el-percentage', s.academicDetails.percentageCgpa);
        const marksDisplay = document.getElementById('marks-display');
        if (marksDisplay) marksDisplay.textContent = s.academicDetails.percentageCgpa + '%';
      }
      if (s.financialDetails?.annualFamilyIncome) {
        setVal('el-income', s.financialDetails.annualFamilyIncome);
        const incomeDisplay = document.getElementById('income-display');
        if (incomeDisplay) incomeDisplay.textContent = formatCurrency(s.financialDetails.annualFamilyIncome);
      }
      if (s.categoryDetails?.tribalCommunity) {
        setVal('el-community', s.categoryDetails.tribalCommunity);
      }
    }
  } catch (e) {
    console.warn('Could not prefetch profile for eligibility:', e.message);
  }
}

async function runEligibilityCheck() {
  const state = document.getElementById('el-state')?.value || 'Jharkhand';
  const category = document.getElementById('el-category')?.value || 'Scheduled Tribe (ST)';
  const tribalCommunity = document.getElementById('el-community')?.value || 'Santhal';
  const educationLevel = document.getElementById('el-edu-level')?.value || 'Undergraduate (UG)';
  const percentageCgpa = Number(document.getElementById('el-percentage')?.value || 75);
  const annualFamilyIncome = Number(document.getElementById('el-income')?.value || 180000);

  // Checked documents
  const docsChecked = [];
  document.querySelectorAll('input[name="el-docs"]:checked').forEach(cb => {
    docsChecked.push(cb.value);
  });

  const checkBtn = document.getElementById('run-check-btn');
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.innerHTML = 'Evaluating Rules...';
  }

  const resultsArea = document.getElementById('eligibility-results-area');
  if (resultsArea) {
    resultsArea.innerHTML = `<div style="text-align: center; padding: 2rem;"><p>Calculating 6-factor match scores...</p></div>`;
  }

  try {
    const res = await apiRequest('/eligibility/check', {
      method: 'POST',
      body: JSON.stringify({
        state,
        category,
        tribalCommunity,
        educationLevel,
        percentageCgpa,
        annualFamilyIncome,
        documentsUploaded: docsChecked.length > 0 ? docsChecked : ['Aadhaar Card', 'ST Community Certificate', 'Income Certificate', 'Marksheet']
      })
    });

    if (res.success) {
      renderEligibilityResults(res);
    }
  } catch (error) {
    if (resultsArea) {
      resultsArea.innerHTML = `<div style="color: #ef4444; padding: 1.5rem;">Error evaluating eligibility: ${error.message}</div>`;
    }
  } finally {
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.innerHTML = 'Recalculate Eligibility Match 🎯';
    }
  }
}

function renderEligibilityResults(data) {
  const resultsArea = document.getElementById('eligibility-results-area');
  if (!resultsArea) return;

  const { counts, results } = data;

  let html = `
    <!-- Top Match Summary Counter -->
    <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
      <div class="card" style="flex: 1; min-width: 180px; text-align: center; border-left: 4px solid #10b981;">
        <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">HIGHLY MATCHED</span>
        <h3 style="font-size: 1.8rem; color: #166534; margin: 0.2rem 0;">${counts.highlyMatched} Schemes</h3>
        <small style="color: var(--text-muted);">Score ≥ 80%</small>
      </div>
      <div class="card" style="flex: 1; min-width: 180px; text-align: center; border-left: 4px solid #f59e0b;">
        <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">POTENTIAL MATCH</span>
        <h3 style="font-size: 1.8rem; color: #b45309; margin: 0.2rem 0;">${counts.potentialMatch} Schemes</h3>
        <small style="color: var(--text-muted);">Score 50% - 79%</small>
      </div>
      <div class="card" style="flex: 1; min-width: 180px; text-align: center; border-left: 4px solid #ef4444;">
        <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">NEEDS VERIFICATION</span>
        <h3 style="font-size: 1.8rem; color: #991b1b; margin: 0.2rem 0;">${counts.needsVerification} Schemes</h3>
        <small style="color: var(--text-muted);">Score < 50%</small>
      </div>
    </div>
  `;

  // Render Each Scheme Result Card with 6-factor Explainability
  html += `<h3 style="margin-bottom: 1.25rem;">Evaluated Scholarship Results (${results.all.length})</h3>`;

  html += results.all.map(item => {
    const sch = item.scholarship;
    const matchClass = item.matchScore >= 80 ? 'high' : (item.matchScore >= 50 ? 'medium' : 'low');
    const b = item.breakdown || {};

    return `
      <div class="card" style="margin-bottom: 1.75rem; border: 1px solid ${item.matchScore >= 80 ? '#86efac' : 'var(--border)'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
          <div>
            <span class="badge badge-scheme" style="margin-bottom: 0.4rem;">${sch.scheme}</span>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">
              <a href="./scholarship-details.html?id=${sch._id}">${sch.name}</a>
            </h3>
            <div style="font-size: 0.82rem; color: var(--text-muted);">🏛️ ${sch.provider}</div>
          </div>
          <div style="text-align: right;">
            <div class="match-score-badge ${matchClass}" style="font-size: 1rem; padding: 0.4rem 1rem;">
              🎯 ${item.matchScore}% Match
            </div>
            <div style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted); margin-top: 0.25rem;">
              ${item.matchCategory}
            </div>
          </div>
        </div>

        <!-- 6-Criterion Breakdown Grid (Explainability) -->
        <div class="criteria-breakdown-row">
          <div class="criteria-cell">
            <div class="criteria-cell-header">
              <span class="criteria-cell-title">1. ST Category (20%)</span>
              <span class="criteria-cell-score" style="color: ${b.category?.score > 0 ? '#166534' : '#b91c1c'};">${b.category?.score}/20</span>
            </div>
            <p>${b.category?.reason || ''}</p>
          </div>

          <div class="criteria-cell">
            <div class="criteria-cell-header">
              <span class="criteria-cell-title">2. Academic Level (20%)</span>
              <span class="criteria-cell-score" style="color: ${b.education?.score === 20 ? '#166534' : '#b45309'};">${b.education?.score}/20</span>
            </div>
            <p>${b.education?.reason || ''}</p>
          </div>

          <div class="criteria-cell">
            <div class="criteria-cell-header">
              <span class="criteria-cell-title">3. Family Income (20%)</span>
              <span class="criteria-cell-score" style="color: ${b.income?.score === 20 ? '#166534' : '#b91c1c'};">${b.income?.score}/20</span>
            </div>
            <p>${b.income?.reason || ''}</p>
          </div>

          <div class="criteria-cell">
            <div class="criteria-cell-header">
              <span class="criteria-cell-title">4. Qualifying Marks (15%)</span>
              <span class="criteria-cell-score" style="color: ${b.academic?.score === 15 ? '#166534' : '#b91c1c'};">${b.academic?.score}/15</span>
            </div>
            <p>${b.academic?.reason || ''}</p>
          </div>

          <div class="criteria-cell">
            <div class="criteria-cell-header">
              <span class="criteria-cell-title">5. State Domicile (10%)</span>
              <span class="criteria-cell-score" style="color: ${b.state?.score === 10 ? '#166534' : '#b45309'};">${b.state?.score}/10</span>
            </div>
            <p>${b.state?.reason || ''}</p>
          </div>

          <div class="criteria-cell">
            <div class="criteria-cell-header">
              <span class="criteria-cell-title">6. Documents Ready (15%)</span>
              <span class="criteria-cell-score" style="color: ${b.documents?.score >= 10 ? '#166534' : '#b45309'};">${b.documents?.score}/15</span>
            </div>
            <p>${b.documents?.reason || ''}</p>
          </div>
        </div>

        ${item.missingRequirements?.length > 0 ? `
          <div style="background-color: #fffbeb; border-left: 3px solid #f59e0b; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 1.25rem;">
            <strong>Missing or Unverified Items:</strong>
            <ul style="margin: 0.25rem 0 0 1.25rem;">
              ${item.missingRequirements.map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 0.75rem;">
          <div style="font-size: 0.86rem;">
            <span>Benefit: <strong>${sch.benefits?.amount}</strong></span> • 
            <span>Deadline: <strong>${formatDate(sch.deadline)}</strong></span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="./scholarship-details.html?id=${sch._id}" class="btn btn-outline btn-sm">View Details</a>
            <a href="./documents.html" class="btn btn-outline-primary btn-sm">Manage Documents</a>
            <a href="./scholarship-details.html?id=${sch._id}&action=apply" class="btn btn-primary btn-sm">Apply Now →</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Disclaimer box at end of results
  html += `
    <div class="disclaimer-box" style="margin-top: 2rem;">
      <strong>Official Guidance Disclaimer:</strong> ${data.disclaimer}
    </div>
  `;

  resultsArea.innerHTML = html;
}
