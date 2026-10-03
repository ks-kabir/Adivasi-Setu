/**
 * AdivasiSetu - Eligibility Engine
 *
 * Weights:
 * - Category: 20%
 * - Education: 20%
 * - Income: 20%
 * - Academic: 15%
 * - State: 10%
 * - Documents: 15%
 * Total: 100%
 * 
 */

function evaluateEligibility(student, scholarship, uploadedDocuments = []) {
  const breakdown = {
    category: { weight: 20, score: 0, matched: false, reason: '', status: 'Fail' },
    education: { weight: 20, score: 0, matched: false, reason: '', status: 'Fail' },
    income: { weight: 20, score: 0, matched: false, reason: '', status: 'Fail' },
    academic: { weight: 15, score: 0, matched: false, reason: '', status: 'Fail' },
    state: { weight: 10, score: 0, matched: false, reason: '', status: 'Fail' },
    documents: { weight: 15, score: 0, matched: false, reason: '', status: 'Fail' }
  };

  const missingRequirements = [];
  const actionItems = [];

  // Safe accessor helpers
  const personal = student?.personalDetails || {};
  const academic = student?.academicDetails || {};
  const categoryDet = student?.categoryDetails || {};
  const financial = student?.financialDetails || {};
  const schEligibility = scholarship?.eligibility || {};

  // 1. CATEGORY EVALUATION (20%)
  const studentCategory = categoryDet.category || 'Scheduled Tribe (ST)';
  const schCategories = schEligibility.category && schEligibility.category.length > 0
    ? schEligibility.category
    : ['Scheduled Tribe (ST)'];

  if (schCategories.some(c => c.toLowerCase().includes('st') || c.toLowerCase().includes('scheduled tribe') || c.toLowerCase() === studentCategory.toLowerCase())) {
    breakdown.category.score = 20;
    breakdown.category.matched = true;
    breakdown.category.status = 'Pass';
    breakdown.category.reason = `Verified ST Category (${categoryDet.tribalCommunity || 'Tribal Community'} community)`;
  } else {
    breakdown.category.score = 0;
    breakdown.category.matched = false;
    breakdown.category.status = 'Fail';
    breakdown.category.reason = `Scholarship requires ${schCategories.join(', ')}`;
    missingRequirements.push('Valid Scheduled Tribe (ST) category certification required');
  }

  // 2. EDUCATION LEVEL EVALUATION (20%)
  const studentEdu = (academic.educationLevel || '').toLowerCase();
  const schEdus = (schEligibility.educationLevels || []).map(e => e.toLowerCase());

  if (schEdus.length === 0 || schEdus.includes('all') || schEdus.some(e => studentEdu.includes(e) || e.includes(studentEdu))) {
    breakdown.education.score = 20;
    breakdown.education.matched = true;
    breakdown.education.status = 'Pass';
    breakdown.education.reason = `Current academic level (${academic.educationLevel || 'Eligible Level'}) matches scheme scope`;
  } else if (!academic.educationLevel) {
    breakdown.education.score = 10; // Partial score if profile incomplete
    breakdown.education.matched = false;
    breakdown.education.status = 'Partial';
    breakdown.education.reason = `Education level not specified in profile. Required: ${schEligibility.educationLevels?.join(', ')}`;
    missingRequirements.push('Specify education level in student profile');
    actionItems.push('Update academic details in Profile');
  } else {
    breakdown.education.score = 0;
    breakdown.education.matched = false;
    breakdown.education.status = 'Fail';
    breakdown.education.reason = `Requires level: ${schEligibility.educationLevels?.join(', ')}. Your profile: ${academic.educationLevel}`;
    missingRequirements.push(`Scheme is designed for ${schEligibility.educationLevels?.join(', ')}`);
  }

  // 3. INCOME EVALUATION (20%)
  const studentIncome = Number(financial.annualFamilyIncome || 0);
  const maxIncome = Number(schEligibility.maxFamilyIncome || 250000);

  if (studentIncome > 0 && studentIncome <= maxIncome) {
    breakdown.income.score = 20;
    breakdown.income.matched = true;
    breakdown.income.status = 'Pass';
    breakdown.income.reason = `Annual income (₹${studentIncome.toLocaleString('en-IN')}) is within ceiling (₹${maxIncome.toLocaleString('en-IN')})`;
  } else if (studentIncome === 0 && !financial.incomeCertificateNumber) {
    // If not set yet
    breakdown.income.score = 10;
    breakdown.income.matched = false;
    breakdown.income.status = 'Needs Verification';
    breakdown.income.reason = `Income certificate details pending. Max permitted: ₹${maxIncome.toLocaleString('en-IN')}`;
    missingRequirements.push('Family annual income must be specified and below ₹' + maxIncome.toLocaleString('en-IN'));
    actionItems.push('Provide Annual Family Income & Certificate in Financial Details');
  } else if (studentIncome > maxIncome) {
    breakdown.income.score = 0;
    breakdown.income.matched = false;
    breakdown.income.status = 'Fail';
    breakdown.income.reason = `Reported family income (₹${studentIncome.toLocaleString('en-IN')}) exceeds max cap of ₹${maxIncome.toLocaleString('en-IN')}`;
    missingRequirements.push(`Income exceeds ceiling limit of ₹${maxIncome.toLocaleString('en-IN')}`);
  } else {
    // Within limit
    breakdown.income.score = 20;
    breakdown.income.matched = true;
    breakdown.income.status = 'Pass';
    breakdown.income.reason = `Annual income is within eligible limit (≤ ₹${maxIncome.toLocaleString('en-IN')})`;
  }

  // 4. ACADEMIC PERFORMANCE EVALUATION (15%)
  const studentMarks = Number(academic.percentageCgpa || 0);
  const minMarks = Number(schEligibility.minPercentage || 50);

  if (studentMarks >= minMarks) {
    breakdown.academic.score = 15;
    breakdown.academic.matched = true;
    breakdown.academic.status = 'Pass';
    breakdown.academic.reason = `Aggregate score (${studentMarks}%) satisfies requirement (min ${minMarks}%)`;
  } else if (studentMarks === 0) {
    breakdown.academic.score = 8;
    breakdown.academic.matched = false;
    breakdown.academic.status = 'Partial';
    breakdown.academic.reason = `Percentage not entered. Minimum required: ${minMarks}%`;
    missingRequirements.push(`Minimum ${minMarks}% required in previous qualifying exam`);
    actionItems.push('Enter qualifying exam marks/CGPA');
  } else {
    breakdown.academic.score = 0;
    breakdown.academic.matched = false;
    breakdown.academic.status = 'Fail';
    breakdown.academic.reason = `Qualifying score is ${studentMarks}%, below required ${minMarks}%`;
    missingRequirements.push(`Qualifying score below scheme minimum of ${minMarks}%`);
  }

  // 5. STATE RESIDENCE / DOMICILE (10%)
  const studentState = (personal.state || '').trim().toLowerCase();
  const eligibleStates = schEligibility.eligibleStates || ['All India'];
  const isAllIndia = eligibleStates.some(s => s.toLowerCase().includes('all india') || s.toLowerCase() === 'all');

  if (isAllIndia || eligibleStates.some(s => s.toLowerCase() === studentState)) {
    breakdown.state.score = 10;
    breakdown.state.matched = true;
    breakdown.state.status = 'Pass';
    breakdown.state.reason = isAllIndia
      ? 'Centrally sponsored pan-India scheme (All ST students nationwide)'
      : `State domicile (${personal.state}) is in designated state list`;
  } else if (!personal.state) {
    breakdown.state.score = 5;
    breakdown.state.matched = false;
    breakdown.state.status = 'Partial';
    breakdown.state.reason = 'State of domicile not recorded in profile';
    missingRequirements.push('State domicile must be declared');
  } else {
    breakdown.state.score = 0;
    breakdown.state.matched = false;
    breakdown.state.status = 'Fail';
    breakdown.state.reason = `Restricted to states: ${eligibleStates.join(', ')}`;
    missingRequirements.push(`Domicile not in scheme coverage states (${eligibleStates.join(', ')})`);
  }

  // 6. DOCUMENTS READINESS (15%)
  const requiredDocs = scholarship?.documents || ['ST Community Certificate', 'Income Certificate', 'Marksheet'];
  // Match uploaded docs against required
  const uploadedTypes = uploadedDocuments
    .filter(d => d.status === 'Verified' || d.status === 'Uploaded' || d.status === 'Under Verification')
    .map(d => (d.documentType || '').toLowerCase());

  let docMatchedCount = 0;
  const missingDocs = [];

  requiredDocs.forEach(req => {
    const reqLower = req.toLowerCase();
    const hasDoc = uploadedTypes.some(u =>
      u.includes(reqLower) ||
      reqLower.includes(u) ||
      (reqLower.includes('st') && u.includes('st')) ||
      (reqLower.includes('income') && u.includes('income')) ||
      (reqLower.includes('marksheet') && u.includes('mark')) ||
      (reqLower.includes('aadhaar') && u.includes('aadhaar')) ||
      (reqLower.includes('bank') && u.includes('bank')) ||
      (reqLower.includes('admission') && u.includes('admission'))
    );

    if (hasDoc) {
      docMatchedCount++;
    } else {
      missingDocs.push(req);
    }
  });

  const docRatio = requiredDocs.length > 0 ? (docMatchedCount / requiredDocs.length) : 1;
  const docScore = Math.round(docRatio * 15);
  breakdown.documents.score = docScore;
  breakdown.documents.matched = docRatio >= 0.7;
  breakdown.documents.status = docRatio === 1 ? 'Pass' : (docRatio > 0 ? 'Partial' : 'Missing');
  breakdown.documents.reason = `${docMatchedCount} of ${requiredDocs.length} required documents uploaded and ready`;

  if (missingDocs.length > 0) {
    missingRequirements.push(`Missing documents: ${missingDocs.slice(0, 3).join(', ')}`);
    actionItems.push(`Upload pending documents in Document Center: ${missingDocs.slice(0, 2).join(', ')}`);
  }

  // TOTAL SCORE
  const totalScore = Math.min(
    100,
    breakdown.category.score +
    breakdown.education.score +
    breakdown.income.score +
    breakdown.academic.score +
    breakdown.state.score +
    breakdown.documents.score
  );

  // RESULT CATEGORY
  let matchCategory = 'Needs Verification';
  if (totalScore >= 80) {
    matchCategory = 'Highly Matched';
  } else if (totalScore >= 50) {
    matchCategory = 'Potential Match';
  } else {
    matchCategory = 'Needs Verification';
  }

  return {
    scholarshipId: scholarship._id,
    scholarshipCode: scholarship.scholarshipId,
    scholarshipName: scholarship.name,
    scheme: scholarship.scheme,
    matchScore: totalScore,
    matchCategory,
    breakdown,
    missingRequirements,
    actionItems,
    isEligible: totalScore >= 50,
    disclaimer: 'This match score is platform-generated guidance calculated from published criteria and your profile. It does not constitute official approval or guarantee of award by the Ministry of Tribal Affairs or implementing state authorities.'
  };
}

module.exports = {
  evaluateEligibility
};
