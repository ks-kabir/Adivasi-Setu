const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const Document = require('../models/Document');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adivasisetu';

const scholarshipsData = [
  {
    scholarshipId: 'SCH-PRE-01',
    name: 'Pre-Matric Scholarship for ST Students (Class 9 & 10)',
    scheme: 'Pre-Matric Scholarship',
    provider: 'Ministry of Tribal Affairs & State Tribal Welfare Department',
    providerType: 'Centrally Sponsored Scheme',
    description: 'Provides financial support to Scheduled Tribe students studying in classes IX and X in government and recognized schools to minimize dropout rates and foster higher secondary continuation.',
    eligibility: {
      category: ['Scheduled Tribe (ST)'],
      educationLevels: ['Class 9-10 (Pre-Matric)'],
      courses: ['Class IX', 'Class X', 'Secondary Schooling'],
      maxFamilyIncome: 250000,
      minPercentage: 45,
      eligibleStates: ['All India'],
      minAge: 12,
      maxAge: 18,
      gender: 'All',
      otherConditions: ['Must be a regular full-time student in an approved government or recognized secondary school.']
    },
    benefits: {
      amount: '₹3,500 - ₹7,000 per year',
      amountPerYear: 7000,
      duration: '10 Months per Academic Year',
      description: 'Day scholars receive ₹3,500/year; hostellers receive ₹7,000/year plus ad-hoc book grant of ₹1,000.',
      allowances: ['Hostel Subsidy', 'Books & Stationery Grant', 'Disability Support Allowance']
    },
    documents: [
      'Aadhaar Card',
      'ST Community Certificate',
      'Income Certificate (Issued by competent authority)',
      'Previous Class Marksheet',
      'Active Bank Account Passbook (Aadhaar Seeded)',
      'Bonafide Student Certificate / School Admission Proof'
    ],
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    openingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: 'Active',
    totalSlots: 150000,
    applicationCount: 4120
  },
  {
    scholarshipId: 'SCH-POST-02',
    name: 'Post-Matric Scholarship for ST Students (PMS-ST)',
    scheme: 'Post-Matric Scholarship',
    provider: 'Ministry of Tribal Affairs, Government of India',
    providerType: 'Central & State Joint Sponsorship',
    description: 'Comprehensive financial assistance for ST students studying at post-matriculation or post-secondary stages (Classes XI-XII, Diploma, ITI, Degree, Post-Graduate, Medical, Engineering) to complete higher education.',
    eligibility: {
      category: ['Scheduled Tribe (ST)'],
      educationLevels: [
        'Class 11-12 (Higher Secondary)',
        'Diploma / Polytechnic',
        'Undergraduate (UG)',
        'Postgraduate (PG)'
      ],
      courses: ['B.A.', 'B.Sc.', 'B.Com.', 'B.Tech', 'MBBS', 'B.Ed', 'Polytechnic Diploma', 'Class XI', 'Class XII', 'M.A.', 'M.Sc.'],
      maxFamilyIncome: 250000,
      minPercentage: 50,
      eligibleStates: ['All India'],
      minAge: 15,
      maxAge: 32,
      gender: 'All',
      otherConditions: ['All recognized higher education courses. Only one awardee per family allowed for certain degree programs unless female student.']
    },
    benefits: {
      amount: 'Full Tuition Fee + ₹13,500/year Maintenance',
      amountPerYear: 38000,
      duration: 'Entire Duration of Course',
      description: '100% compulsory non-refundable tuition fees reimbursed directly to institution or student + monthly maintenance allowance up to ₹1,350/month for hostellers.',
      allowances: ['Full Tuition Fee Reimbursement', 'Monthly Maintenance Allowance', 'Study Tour Allowance', 'Thesis Typing Charges']
    },
    documents: [
      'Aadhaar Card',
      'ST Community Certificate',
      'Income Certificate (under ₹2.5 Lakh/annum)',
      'Class 10th / 12th Marksheet',
      'Fee Receipt / College Bonafide Letter',
      'Bank Passbook Linked with Aadhaar'
    ],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    openingDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    status: 'Active',
    totalSlots: 200000,
    applicationCount: 8940
  },
  {
    scholarshipId: 'SCH-TOP-03',
    name: 'National Scholarship for Higher Education (Top Class Education) for ST Students',
    scheme: 'Top Class Scholarship',
    provider: 'Ministry of Tribal Affairs (Central Sector Scheme)',
    providerType: 'Central Sector Scheme (100% Central Funding)',
    description: 'Aimed at encouraging meritorious ST students who secure admission in notified premier institutions across India including IITs, IIMs, NITs, AIIMS, National Law Universities, and premier central institutions.',
    eligibility: {
      category: ['Scheduled Tribe (ST)'],
      educationLevels: ['Undergraduate (UG)', 'Postgraduate (PG)'],
      courses: ['B.Tech / B.E.', 'MBBS', 'MBA / PGDM', 'B.A. LL.B (Hons)', 'M.Tech', 'MD / MS'],
      maxFamilyIncome: 600000, // Top class limit is 6.0 Lakh
      minPercentage: 60,
      eligibleStates: ['All India'],
      minAge: 17,
      maxAge: 30,
      gender: 'All',
      otherConditions: ['Must have secured admission in any of the notified 260+ premier institutes (IITs, IIMs, NITs, IIITs, NLUs, etc.).']
    },
    benefits: {
      amount: 'Full Tuition Fees + ₹86,000/year Allowances',
      amountPerYear: 286000,
      duration: 'Full Duration of the Degree Program',
      description: 'Covers full tuition fees up to ₹2.0 Lakhs in private or actuals in Govt institutes + ₹45,000 computer grant + ₹3,000/month living expenses + ₹3,000/year books & stationery.',
      allowances: ['Full Tuition Fee Waiver', 'One-time ₹45,000 Laptop/PC Grant', 'Living Expenses ₹3,000/month', 'Books & Stationery ₹3,000/year']
    },
    documents: [
      'Aadhaar Card',
      'ST Caste Certificate issued by SDM/Tehsildar',
      'Family Income Certificate (below ₹6.0 Lakh)',
      'Admission Letter / Allotment Order from Premier Institute',
      'Fee Structure Verification Document',
      'Bank Account Details (Aadhaar Enabled)'
    ],
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
    openingDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    status: 'Active',
    totalSlots: 1000,
    applicationCount: 650
  },
  {
    scholarshipId: 'SCH-NFST-04',
    name: 'National Fellowship and Scholarship for Higher Education of ST Students (NFST)',
    scheme: 'NFST',
    provider: 'Ministry of Tribal Affairs & UGC / University Desks',
    providerType: 'Central Fellowship',
    description: 'Empowers ST research scholars pursuing M.Phil and Ph.D. degrees in Sciences, Humanities, Engineering & Technology across Indian universities and institutes of national importance.',
    eligibility: {
      category: ['Scheduled Tribe (ST)'],
      educationLevels: ['M.Phil / Ph.D. / Research'],
      courses: ['Ph.D.', 'M.Phil', 'Integrated Ph.D.', 'Postdoctoral Research'],
      maxFamilyIncome: 600000,
      minPercentage: 55, // In Master's degree
      eligibleStates: ['All India'],
      minAge: 21,
      maxAge: 36,
      gender: 'All',
      otherConditions: ['Must have confirmed registration / admission in M.Phil or Ph.D. in a recognized university. UGC-NET or GATE qualification is given preference.']
    },
    benefits: {
      amount: '₹37,000/month (JRF) & ₹42,000/month (SRF) + HRA',
      amountPerYear: 444000,
      duration: 'Up to 5 Years (JRF 2 yrs + SRF 3 yrs)',
      description: 'Junior Research Fellowship (JRF) of ₹37,000/month + Contingency grant of ₹10,000/year for Humanities and ₹12,000 for Science + House Rent Allowance (HRA) as per Govt rules.',
      allowances: ['Monthly Fellowship ₹37,000 - ₹42,000', 'Annual Contingency Grant', 'HRA Subsidy (8% - 27%)', 'Escorts/Reader Assistance for PwD']
    },
    documents: [
      'Aadhaar Card',
      'ST Community Certificate',
      'Post-Graduation Degree & Consolidated Marksheets',
      'Ph.D. / M.Phil Admission & Registration Letter',
      'Research Proposal Synopsis approved by Guide',
      'Bank Passbook Linked with Aadhaar'
    ],
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    openingDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    status: 'Active',
    totalSlots: 750,
    applicationCount: 480
  },
  {
    scholarshipId: 'SCH-NOS-05',
    name: 'National Overseas Scholarship for ST Candidates (NOS-ST)',
    scheme: 'National Overseas Scholarship',
    provider: 'Ministry of Tribal Affairs, Government of India',
    providerType: 'Central Sector Scheme for International Studies',
    description: 'Enables meritorious tribal students to pursue higher studies abroad (Master’s Level Courses and Ph.D. degrees) in top 500 QS world-ranked universities in disciplines like Engineering, Pure Sciences, Medicine, Humanities and Social Sciences.',
    eligibility: {
      category: ['Scheduled Tribe (ST)'],
      educationLevels: ['Overseas Studies (Master/PhD)'],
      courses: ['Master of Science (M.S.)', 'Master of Arts (M.A.)', 'Master of Laws (LL.M.)', 'Ph.D. Abroad'],
      maxFamilyIncome: 800000, // Ceiling is 8.0 Lakh
      minPercentage: 60, // Minimum 60% in previous degree
      eligibleStates: ['All India'],
      minAge: 20,
      maxAge: 35,
      gender: 'All',
      otherConditions: ['Unconditional offer letter from any university in top 500 QS World University Rankings. Maximum 2 children from same family eligible.']
    },
    benefits: {
      amount: '100% Tuition Fees + $15,400 / £9,900 Annual Living Allowance',
      amountPerYear: 2400000,
      duration: 'Course Duration (1-3 yrs for Masters, up to 4 yrs for Ph.D.)',
      description: 'Complete tuition fees paid directly to international university + Annual living allowance ($15,400 for USA / £9,900 for UK) + Contingency allowance, airfare, medical insurance and visa fees.',
      allowances: ['100% Foreign University Tuition Cover', 'Annual Living Maintenance', 'Round-trip Economy Airfare', 'Mandatory Medical Insurance & Visa Charges']
    },
    documents: [
      'Aadhaar Card & Valid Indian Passport',
      'ST Caste Certificate (Valid Central Format)',
      'Family Income Certificate (below ₹8.0 Lakh)',
      'Unconditional Offer Letter from Top 500 QS University',
      'GRE / GMAT / IELTS / TOEFL Scorecard (if applicable)',
      'All Academic Degree Certificates and Transcripts'
    ],
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days
    openingDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    status: 'Active',
    totalSlots: 20,
    applicationCount: 112
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected successfully.');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Scholarship.deleteMany({});
    await Application.deleteMany({});
    await Document.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Create Admin User
    const adminUser = await User.create({
      name: 'Dr. Rameshwar Munda',
      email: 'admin@adivasisetu.in',
      phone: '9876543210',
      password: 'Admin@123',
      role: 'admin'
    });
    console.log('Admin user created:', adminUser.email);

    // 2. Create Student User
    const studentUser = await User.create({
      name: 'Birsa Soren',
      email: 'student@adivasisetu.in',
      phone: '9812345678',
      password: 'Student@123',
      role: 'student'
    });
    console.log('Demo Student user created:', studentUser.email);

    // 3. Insert Scholarships
    const createdScholarships = await Scholarship.insertMany(scholarshipsData);
    console.log(`Inserted ${createdScholarships.length} official ST scholarship schemes.`);

    // 4. Create Student Profile
    const studentProfile = new Student({
      userId: studentUser._id,
      personalDetails: {
        fullName: 'Birsa Soren',
        dob: '2004-03-15',
        gender: 'Male',
        mobile: '9812345678',
        email: 'student@adivasisetu.in',
        state: 'Jharkhand',
        district: 'Ranchi',
        villageTown: 'Khunti Sub-district',
        aadhaarNumber: 'XXXX-XXXX-4921'
      },
      academicDetails: {
        educationLevel: 'Undergraduate (UG)',
        course: 'B.Tech in Computer Engineering',
        yearSemester: '3rd Year (Semester 5)',
        collegeInstitution: 'National Institute of Technology (NIT) Jamshedpur',
        universityBoard: 'NIT Council / Autonomous',
        percentageCgpa: 82.5,
        admissionYear: 2024
      },
      categoryDetails: {
        category: 'Scheduled Tribe (ST)',
        tribalCommunity: 'Santhal',
        certificateNumber: 'JH/ST/2022/94821',
        isStVerified: true
      },
      financialDetails: {
        annualFamilyIncome: 180000,
        incomeCertificateNumber: 'INC/JH/2026/049182',
        bplStatus: 'No',
        familyOccupation: 'Agriculture & Forest Produce Cooperative',
        incomeRange: '₹1.5 Lakh - ₹2.5 Lakh'
      },
      savedScholarships: [createdScholarships[1]._id, createdScholarships[2]._id],
      onboardingCompleted: true
    });
    studentProfile.calculateCompletion();
    await studentProfile.save();
    console.log('Demo Student profile created with completion:', studentProfile.profileCompletion + '%');

    // 5. Create Documents for Student
    const sampleDocs = [
      {
        studentId: studentProfile._id,
        category: 'Identity',
        documentType: 'Aadhaar Card',
        fileName: 'aadhaar_birsa_soren.pdf',
        originalName: 'Aadhaar_Card_Birsa.pdf',
        fileUrl: '/uploads/sample_aadhaar.pdf',
        fileSize: 1024 * 450, // 450 KB
        mimeType: 'application/pdf',
        status: 'Verified',
        verifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        studentId: studentProfile._id,
        category: 'Category',
        documentType: 'ST Community Certificate',
        fileName: 'st_certificate_santhal.pdf',
        originalName: 'ST_Certificate_Govt_Jharkhand.pdf',
        fileUrl: '/uploads/sample_st_cert.pdf',
        fileSize: 1024 * 720,
        mimeType: 'application/pdf',
        status: 'Verified',
        verifiedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        studentId: studentProfile._id,
        category: 'Income',
        documentType: 'Income Certificate',
        fileName: 'income_cert_2026.pdf',
        originalName: 'Revenue_Income_Cert_2026.pdf',
        fileUrl: '/uploads/sample_income.pdf',
        fileSize: 1024 * 512,
        mimeType: 'application/pdf',
        status: 'Verified',
        verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        studentId: studentProfile._id,
        category: 'Academic',
        documentType: 'Previous Year Marksheet',
        fileName: 'marksheet_sem4.pdf',
        originalName: 'NIT_Jamshedpur_Sem4_Marksheet.pdf',
        fileUrl: '/uploads/sample_marksheet.pdf',
        fileSize: 1024 * 890,
        mimeType: 'application/pdf',
        status: 'Verified',
        verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        studentId: studentProfile._id,
        category: 'Bank',
        documentType: 'Bank Details',
        fileName: 'sbi_passbook.pdf',
        originalName: 'SBI_Aadhaar_Linked_Passbook.pdf',
        fileUrl: '/uploads/sample_bank.pdf',
        fileSize: 1024 * 380,
        mimeType: 'application/pdf',
        status: 'Verified',
        verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        studentId: studentProfile._id,
        category: 'Admission',
        documentType: 'Admission Proof',
        fileName: 'nit_admission_bonafide.pdf',
        originalName: 'NIT_Bonafide_Student_Cert.pdf',
        fileUrl: '/uploads/sample_bonafide.pdf',
        fileSize: 1024 * 610,
        mimeType: 'application/pdf',
        status: 'Under Verification',
        verifiedAt: null
      }
    ];
    await Document.insertMany(sampleDocs);
    console.log('Sample documents inserted.');

    // 6. Create Demo Applications for Student
    // Application 1: Top Class Scholarship (Under Review - stage 4)
    const app1 = new Application({
      applicationId: 'AS-2026-ST-40912',
      studentId: studentProfile._id,
      scholarshipId: createdScholarships[2]._id, // Top Class
      status: 'Under Review',
      currentTimelineStage: 'Under Verification',
      matchScoreAtSubmission: 95,
      adminRemarks: 'Application scrutinized. Premier institution admission verified from NIT Jamshedpur registrar. Domicile and ST verification passed. Pending final committee sign-off.',
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      timeline: [
        { stage: 'Profile Completed', status: 'Completed', completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), remarks: 'Profile completed with 100% data fidelity' },
        { stage: 'Documents Submitted', status: 'Completed', completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), remarks: 'Identity, ST, Income and Admission proofs verified' },
        { stage: 'Application Submitted', status: 'Completed', completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), remarks: 'Application AS-2026-ST-40912 filed successfully' },
        { stage: 'Under Verification', status: 'In Progress', completedAt: null, remarks: 'Desk verification ongoing by Welfare Officer' },
        { stage: 'Final Decision', status: 'Pending', completedAt: null, remarks: 'Pending State Review Board' },
        { stage: 'Scholarship Received', status: 'Pending', completedAt: null, remarks: 'Direct Benefit Transfer (DBT) to bank account upon approval' }
      ]
    });
    await app1.save();

    // Application 2: Post-Matric Scholarship (Approved - stage 6)
    const app2 = new Application({
      applicationId: 'AS-2026-ST-18234',
      studentId: studentProfile._id,
      scholarshipId: createdScholarships[1]._id, // Post-Matric
      status: 'Approved',
      currentTimelineStage: 'Scholarship Received',
      matchScoreAtSubmission: 100,
      adminRemarks: 'Full sanction approved. Sanction Order #JH-MOTA-PMS-2026-881. Total ₹38,000 sanctioned and processed via PFMS DBT.',
      submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      timeline: [
        { stage: 'Profile Completed', status: 'Completed', completedAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000), remarks: 'Profile details verified' },
        { stage: 'Documents Submitted', status: 'Completed', completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), remarks: 'All 6 mandatory documents uploaded and approved' },
        { stage: 'Application Submitted', status: 'Completed', completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), remarks: 'Application registered on portal' },
        { stage: 'Under Verification', status: 'Completed', completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), remarks: 'Institute bonafide and income authenticated' },
        { stage: 'Final Decision', status: 'Completed', completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), remarks: 'Sanction letter issued by Ministry Desk' },
        { stage: 'Scholarship Received', status: 'Completed', completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), remarks: 'Amount ₹38,000 credited via Aadhaar DBT (SBI A/c ending 4910)' }
      ]
    });
    await app2.save();
    console.log('Sample applications created.');

    // 7. Create Notifications & JAGO Alerts
    const sampleNotifications = [
      {
        userId: studentUser._id,
        title: 'JAGO Awareness Alert: Top Class Scholarship Closing Soon',
        message: 'Portal window for National Scholarship for Higher Education in Premier Institutes closes in 20 days. Ensure NIT fee structure proof is attached.',
        type: 'JAGO',
        badgeText: 'JAGO Alert',
        link: '/scholarships.html',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        userId: studentUser._id,
        title: 'Application Status Update: AS-2026-ST-40912',
        message: 'Your Top Class application is currently Under Verification at the State Tribal Welfare Directorate.',
        type: 'Applications',
        badgeText: 'Under Review',
        link: `/application-details.html?id=${app1._id}`,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        userId: studentUser._id,
        title: 'Scholarship Sanctioned & Disbursed: AS-2026-ST-18234',
        message: 'Congratulations! Post-Matric Scholarship grant of ₹38,000 has been credited to your Aadhaar-linked bank account.',
        type: 'Scholarships',
        badgeText: 'Approved',
        link: `/application-details.html?id=${app2._id}`,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      },
      {
        userId: studentUser._id,
        title: 'Document Verified: ST Community Certificate',
        message: 'Your Santhal community ST certificate has been validated against Jharkhand revenue records.',
        type: 'Documents',
        badgeText: 'Verified',
        link: '/documents.html',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
      },
      {
        userId: studentUser._id,
        title: 'Upcoming Deadline: National Overseas Scholarship (NOS)',
        message: 'Only 18 days left for Master/Ph.D. foreign study grant applications. Check eligibility if planning overseas studies.',
        type: 'Deadlines',
        badgeText: '18 Days Left',
        link: '/scholarships.html',
        createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000)
      }
    ];
    await Notification.insertMany(sampleNotifications);
    console.log('Sample notifications and JAGO alerts created.');

    console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
    console.log('Student Login: student@adivasisetu.in | Password: Student@123');
    console.log('Admin Login:   admin@adivasisetu.in   | Password: Admin@123');
    console.log('-------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
