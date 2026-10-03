let myDocuments = [];
let standardCategories = [];

async function initDocumentsPage() {
  const token = getToken();
  if (!token) {
    window.location.href = './login.html';
    return;
  }
  await fetchDocuments();
}

async function fetchDocuments() {
  const container = document.getElementById('documents-list-container');
  if (container) {
    container.innerHTML = `<div style="text-align: center; padding: 3rem;"><p>Loading student document vault...</p></div>`;
  }

  try {
    const res = await apiRequest('/documents');
    if (res.success) {
      myDocuments = res.documents;
      standardCategories = res.standardCategories;
      renderDocumentsGrid();
    }
  } catch (error) {
    if (container) {
      container.innerHTML = `<div style="color: #ef4444; padding: 2rem;">Error: ${error.message}</div>`;
    }
  }
}

function renderDocumentsGrid() {
  const container = document.getElementById('documents-list-container');
  if (!container) return;

  // Render cards for the 6 core categories
  container.innerHTML = standardCategories.map(cat => {
    // Find matching uploaded doc
    const doc = myDocuments.find(d => d.category === cat.category);
    const status = doc ? doc.status : 'Missing';
    const statusBadge = getDocStatusBadge(status);

    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <span class="badge badge-scheme">${cat.category} Proof</span>
            <span class="badge ${statusBadge.class}">${status}</span>
          </div>

          <h3 style="font-size: 1.15rem; margin-bottom: 0.35rem;">${cat.label}</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
            Recommended: ${cat.defaultType} (Max 5 MB, PDF/JPG/PNG)
          </p>

          ${doc ? `
            <div style="background-color: var(--bg-alt); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.84rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <strong>📄 ${doc.originalName || doc.fileName}</strong>
                <span style="font-size: 0.76rem; color: var(--text-muted);">${(doc.fileSize / 1024).toFixed(0)} KB</span>
              </div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">
                Uploaded: ${formatDate(doc.uploadedAt)}
              </div>
            </div>

            ${doc.status === 'Rejected' ? `
              <div style="background-color: #fee2e2; border-left: 3px solid #ef4444; padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 1rem; color: #991b1b;">
                <strong>Rejection Reason:</strong> ${doc.rejectionReason || 'Document is unclear, blurry, or missing government seal.'}
                <div style="margin-top: 0.35rem;">Please re-upload a clear, authentic certificate.</div>
              </div>
            ` : ''}
          ` : `
            <div style="background-color: #fffbeb; border: 1px dashed #fcd34d; border-radius: var(--radius-md); padding: 1.25rem; text-align: center; margin-bottom: 1rem;">
              <span style="font-size: 1.5rem; display: block; margin-bottom: 0.35rem;">⚠️</span>
              <span style="font-size: 0.84rem; color: #92400e; font-weight: 600;">Document not uploaded yet</span>
            </div>
          `}
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid var(--border);">
          ${doc ? `
            <button class="btn btn-outline btn-sm" onclick="viewDocumentModal('${doc.originalName}', '${doc.fileUrl}', '${doc.status}')">
              👁️ View
            </button>
            <button class="btn btn-outline-primary btn-sm" onclick="openUploadModal('${cat.category}', '${cat.defaultType}', '${doc._id}')">
              🔄 ${doc.status === 'Rejected' ? 'Upload Again' : 'Replace'}
            </button>
            <button class="btn btn-outline btn-sm" style="color: #ef4444;" onclick="deleteDocument('${doc._id}')" title="Delete">
              🗑️
            </button>
          ` : `
            <button class="btn btn-primary btn-sm btn-block" onclick="openUploadModal('${cat.category}', '${cat.defaultType}')">
              📤 Upload Document
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function getDocStatusBadge(status) {
  switch (status) {
    case 'Verified': return { class: 'badge-approved' };
    case 'Under Verification': return { class: 'badge-review' };
    case 'Rejected': return { class: 'badge-rejected' };
    case 'Uploaded': return { class: 'badge-submitted' };
    default: return { class: 'badge-draft' };
  }
}

// Open Upload Modal
let uploadReplaceId = null;

function openUploadModal(category, defaultType, replaceId = null) {
  uploadReplaceId = replaceId;
  const catEl = document.getElementById('modal-upload-category');
  const typeEl = document.getElementById('modal-upload-type');
  const fileInput = document.getElementById('modal-upload-file');
  const replaceHint = document.getElementById('modal-replace-hint');

  if (catEl) catEl.value = category;
  if (typeEl) typeEl.value = defaultType;
  if (fileInput) fileInput.value = '';
  if (replaceHint) {
    replaceHint.style.display = replaceId ? 'block' : 'none';
  }

  openModal('document-upload-modal');
}

// Handle Document Upload
async function handleDocumentUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById('modal-upload-file');
  const category = document.getElementById('modal-upload-category')?.value;
  const documentType = document.getElementById('modal-upload-type')?.value;

  if (!fileInput.files || fileInput.files.length === 0) {
    showToast('Please select a file to upload.', 'error');
    return;
  }

  const file = fileInput.files[0];

  // 5MB Limit enforcement
  if (file.size > 5 * 1024 * 1024) {
    showToast('File exceeds the 5 MB maximum size limit.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('documentType', documentType);
  if (uploadReplaceId) {
    formData.append('replaceDocId', uploadReplaceId);
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Uploading Document...';

  try {
    const res = await apiRequest('/documents/upload', {
      method: 'POST',
      body: formData
    });

    if (res.success) {
      closeModal('document-upload-modal');
      showToast(res.message, 'success');
      await fetchDocuments();
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Upload Document';
  }
}

// View Document Simulation Modal
function viewDocumentModal(title, url, status) {
  const titleEl = document.getElementById('doc-view-title');
  const previewEl = document.getElementById('doc-view-preview');
  const statusEl = document.getElementById('doc-view-status');

  if (titleEl) titleEl.textContent = title;
  if (statusEl) statusEl.textContent = `Verification Status: ${status}`;
  if (previewEl) {
    previewEl.innerHTML = `
      <div style="background-color: #f1f5f9; border-radius: var(--radius-md); padding: 3rem; text-align: center; border: 2px dashed #cbd5e1;">
        <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">📄</span>
        <h4 style="margin-bottom: 0.5rem;">${title}</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">
          Verified and encrypted in AdivasiSetu tribal welfare repository.
        </p>
        <a href="${url}" target="_blank" class="btn btn-outline-primary btn-sm">
          Open / Download File ↗
        </a>
      </div>
    `;
  }

  openModal('document-view-modal');
}

// Delete Document
async function deleteDocument(docId) {
  if (!confirm('Are you sure you want to remove this document?')) return;

  try {
    const res = await apiRequest(`/documents/${docId}`, { method: 'DELETE' });
    if (res.success) {
      showToast(res.message, 'info');
      await fetchDocuments();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}
