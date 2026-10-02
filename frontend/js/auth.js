/**
 * ADIVASISETU - AUTHENTICATION & ONBOARDING JAVASCRIPT
 */

// Quick Demo Login Helper
async function quickDemoLogin(role = 'student') {
  try {
    const res = await apiRequest('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });

    if (res.success) {
      setToken(res.token);
      setCurrentUser(res.user);
      showToast(`Logged in as ${res.user.name} (${role.toUpperCase()})`, 'success');
      setTimeout(() => {
        window.location.href = appPageUrl(res.redirect || (role === 'admin' ? '/admin.html' : '/dashboard.html'));
      }, 600);
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Login Form Handler
async function handleLogin(e) {
  e.preventDefault();
  const loginId = document.getElementById('loginId')?.value.trim();
  const password = document.getElementById('password')?.value;
  const errorBox = document.getElementById('login-error');

  if (errorBox) errorBox.style.display = 'none';

  if (!loginId || !password) {
    showToast('Please enter both Email/Mobile and Password.', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Signing in...';

  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password })
    });

    if (res.success) {
      setToken(res.token);
      setCurrentUser(res.user);
      showToast('Welcome back, ' + res.user.name + '!', 'success');
      setTimeout(() => {
        window.location.href = appPageUrl(res.redirect || '/dashboard.html');
      }, 600);
    }
  } catch (error) {
    if (errorBox) {
      errorBox.textContent = error.message;
      errorBox.style.display = 'block';
    } else {
      showToast(error.message, 'error');
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Registration Form Handler
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const mobile = form.mobile.value.trim();
  const dob = form.dob.value;
  const gender = form.gender.value;
  const state = form.state.value;
  const district = form.district.value.trim();
  const villageTown = form.villageTown.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const terms = form.terms.checked;

  if (password !== confirmPassword) {
    showToast('Passwords do not match. Please verify.', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password should be at least 6 characters.', 'error');
    return;
  }

  if (!terms) {
    showToast('Please accept the Terms & Tribal Welfare Privacy Policy.', 'error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Creating Account...';

  try {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        mobile,
        dob,
        gender,
        state,
        district,
        villageTown,
        password,
        terms
      })
    });

    if (res.success) {
      setToken(res.token);
      setCurrentUser(res.user);
      showToast('Account created successfully! Starting student profile onboarding...', 'success');
      setTimeout(() => {
        window.location.href = './onboarding.html';
      }, 800);
    }
  } catch (error) {
    showToast(error.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// ============================================================================
// ONBOARDING WIZARD CONTROLLER (5 STEPS)
// ============================================================================

let currentStep = 1;
const totalSteps = 5;

function initOnboarding() {
  const token = getToken();
  if (!token) {
    window.location.href = './login.html';
    return;
  }

  // Pre-fill student info if already registered
  loadExistingProfileForOnboarding();
  updateWizardUI();
}

async function loadExistingProfileForOnboarding() {
  try {
    const res = await apiRequest('/students/profile');
    if (res.success && res.student) {
      const s = res.student;
      // Pre-fill personal
      if (s.personalDetails) {
        setVal('onb-name', s.personalDetails.fullName);
        setVal('onb-email', s.personalDetails.email);
        setVal('onb-mobile', s.personalDetails.mobile);
        setVal('onb-dob', s.personalDetails.dob);
        setVal('onb-gender', s.personalDetails.gender);
        setVal('onb-state', s.personalDetails.state);
        setVal('onb-district', s.personalDetails.district);
        setVal('onb-village', s.personalDetails.villageTown);
      }
      // Pre-fill academic
      if (s.academicDetails) {
        setVal('onb-edu-level', s.academicDetails.educationLevel);
        setVal('onb-course', s.academicDetails.course);
        setVal('onb-institution', s.academicDetails.collegeInstitution);
        setVal('onb-percentage', s.academicDetails.percentageCgpa);
        setVal('onb-year', s.academicDetails.yearSemester);
      }
      // Pre-fill category
      if (s.categoryDetails) {
        setVal('onb-community', s.categoryDetails.tribalCommunity);
        setVal('onb-st-cert', s.categoryDetails.certificateNumber);
      }
      // Pre-fill financial
      if (s.financialDetails) {
        setVal('onb-income', s.financialDetails.annualFamilyIncome);
        setVal('onb-income-cert', s.financialDetails.incomeCertificateNumber);
        setVal('onb-bpl', s.financialDetails.bplStatus);
      }
      updateCompletionMeter();
    }
  } catch (e) {
    console.warn('Could not pre-fetch profile:', e.message);
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.value = val;
}

function updateWizardUI() {
  // Toggle panes
  document.querySelectorAll('.wizard-step-pane').forEach((pane, idx) => {
    pane.classList.toggle('active', idx + 1 === currentStep);
  });

  // Toggle step pill tabs
  document.querySelectorAll('.wizard-step-tab').forEach((tab, idx) => {
    const stepNum = idx + 1;
    tab.classList.toggle('active', stepNum === currentStep);
    tab.classList.toggle('completed', stepNum < currentStep);
  });

  // Update Buttons
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');

  if (prevBtn) {
    prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  }

  if (nextBtn) {
    if (currentStep === totalSteps) {
      nextBtn.innerHTML = 'Complete & Find Scholarships 🚀';
      nextBtn.classList.remove('btn-primary');
      nextBtn.classList.add('btn-accent');
    } else {
      nextBtn.innerHTML = 'Save & Continue →';
      nextBtn.classList.remove('btn-accent');
      nextBtn.classList.add('btn-primary');
    }
  }

  updateCompletionMeter();
}

function nextOnboardingStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateWizardUI();
    window.scrollTo({ top: 120, behavior: 'smooth' });
  } else {
    submitOnboardingProfile();
  }
}

function prevOnboardingStep() {
  if (currentStep > 1) {
    currentStep--;
    updateWizardUI();
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }
}

function goToStep(stepNum) {
  if (stepNum >= 1 && stepNum <= totalSteps) {
    currentStep = stepNum;
    updateWizardUI();
  }
}

function updateCompletionMeter() {
  let score = 0;
  // Step 1: Personal
  const name = document.getElementById('onb-name')?.value;
  const state = document.getElementById('onb-state')?.value;
  if (name && state) score += 25;

  // Step 2: Academic
  const edu = document.getElementById('onb-edu-level')?.value;
  const course = document.getElementById('onb-course')?.value;
  if (edu && course) score += 25;

  // Step 3: Category
  const community = document.getElementById('onb-community')?.value;
  const cert = document.getElementById('onb-st-cert')?.value;
  if (community && cert) score += 25;

  // Step 4: Financial
  const income = document.getElementById('onb-income')?.value;
  if (income && Number(income) > 0) score += 25;

  const meterFill = document.getElementById('completion-meter-fill');
  const meterText = document.getElementById('completion-meter-text');

  if (meterFill) meterFill.style.width = score + '%';
  if (meterText) meterText.textContent = `${score}% Completed`;
}

// Onboarding Final Submission
async function submitOnboardingProfile() {
  const nextBtn = document.getElementById('wizard-next-btn');
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.innerHTML = 'Saving Profile...';
  }

  const payload = {
    personalDetails: {
      fullName: document.getElementById('onb-name')?.value.trim() || '',
      email: document.getElementById('onb-email')?.value.trim() || '',
      mobile: document.getElementById('onb-mobile')?.value.trim() || '',
      dob: document.getElementById('onb-dob')?.value || '',
      gender: document.getElementById('onb-gender')?.value || '',
      state: document.getElementById('onb-state')?.value || '',
      district: document.getElementById('onb-district')?.value.trim() || '',
      villageTown: document.getElementById('onb-village')?.value.trim() || ''
    },
    academicDetails: {
      educationLevel: document.getElementById('onb-edu-level')?.value || '',
      course: document.getElementById('onb-course')?.value.trim() || '',
      collegeInstitution: document.getElementById('onb-institution')?.value.trim() || '',
      percentageCgpa: Number(document.getElementById('onb-percentage')?.value || 0),
      yearSemester: document.getElementById('onb-year')?.value.trim() || ''
    },
    categoryDetails: {
      category: 'Scheduled Tribe (ST)',
      tribalCommunity: document.getElementById('onb-community')?.value.trim() || '',
      certificateNumber: document.getElementById('onb-st-cert')?.value.trim() || ''
    },
    financialDetails: {
      annualFamilyIncome: Number(document.getElementById('onb-income')?.value || 0),
      incomeCertificateNumber: document.getElementById('onb-income-cert')?.value.trim() || '',
      bplStatus: document.getElementById('onb-bpl')?.value || 'No'
    }
  };

  try {
    const res = await apiRequest('/students/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showToast('Student Profile completed successfully! Redirecting to Dashboard...', 'success');
      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 800);
    }
  } catch (error) {
    showToast(error.message, 'error');
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.innerHTML = 'Complete & Find Scholarships 🚀';
    }
  }
}
