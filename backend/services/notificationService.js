const Notification = require('../models/Notification');

async function createNotification({ userId, title, message, type = 'JAGO', link = '', badgeText = '' }) {
  try {
    const notif = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      badgeText: badgeText || type
    });
    return notif;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
}

async function notifyApplicationStatusChange(userId, application) {
  const statusTexts = {
    'Under Review': 'Your application is now under desk scrutiny and document verification by the Tribal Welfare Committee.',
    'Approved': 'Congratulations! Your scholarship application has been verified and approved by the Tribal Welfare Board.',
    'Rejected': 'Your application could not be approved. Please review the admin remarks and remarks in Application Tracker.'
  };

  const message = statusTexts[application.status] || `Your application status was updated to ${application.status}.`;
  return await createNotification({
    userId,
    title: `Application Update: ${application.applicationId}`,
    message,
    type: 'Applications',
    link: `/application-details.html?id=${application._id}`,
    badgeText: application.status
  });
}

async function notifyDocumentStatusChange(userId, docName, status, reason = '') {
  let message = `Document "${docName}" is now marked as ${status}.`;
  if (status === 'Rejected' && reason) {
    message = `Document "${docName}" was rejected: "${reason}". Please upload a clearer copy.`;
  } else if (status === 'Verified') {
    message = `Document "${docName}" has been successfully verified.`;
  }

  return await createNotification({
    userId,
    title: `Document Verification: ${docName}`,
    message,
    type: 'Documents',
    link: `/documents.html`,
    badgeText: status
  });
}

async function notifyDeadlineUpcoming(userId, scholarshipName, daysLeft) {
  return await createNotification({
    userId,
    title: `Upcoming Deadline: ${scholarshipName}`,
    message: `Application portal closes in ${daysLeft} days. Ensure all documents are verified before final submission.`,
    type: 'Deadlines',
    link: `/scholarships.html`,
    badgeText: `${daysLeft} Days Left`
  });
}

module.exports = {
  createNotification,
  notifyApplicationStatusChange,
  notifyDocumentStatusChange,
  notifyDeadlineUpcoming
};
