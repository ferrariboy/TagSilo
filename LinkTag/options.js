/**
 * LinkTag Pro Workspace - Options Manager
 * Handles Google Web App Endpoint Configuration, Pipeline Group Manager & Quick Add Tag Management
 */

const DEFAULT_TAGS = ["Recruiter", "Software Engineer", "Founder", "Hiring Manager", "High Priority"];
const DEFAULT_GROUPS = ["Inbound Leads", "Prospecting", "Interviewing", "Active Clients", "Talent Pool"];

document.addEventListener('DOMContentLoaded', async () => {
  // Web App Elements
  const webhookUrlInput = document.getElementById('webhookUrl');
  const saveUrlBtn = document.getElementById('saveUrlBtn');
  const testUrlBtn = document.getElementById('testUrlBtn');
  const webhookAlert = document.getElementById('webhookAlert');

  // Pipeline Group Elements
  const newGroupInput = document.getElementById('newGroupInput');
  const addGroupBtn = document.getElementById('addGroupBtn');
  const groupContainer = document.getElementById('groupContainer');
  const groupAlert = document.getElementById('groupAlert');

  // Quick Tag Elements
  const newTagInput = document.getElementById('newTagInput');
  const addTagBtn = document.getElementById('addTagBtn');
  const tagContainer = document.getElementById('tagContainer');
  const tagAlert = document.getElementById('tagAlert');

  // Load existing configuration from chrome.storage.sync
  const storageData = await chrome.storage.sync.get(['webhook_url', 'quick_tags', 'pipeline_groups']);
  
  if (storageData.webhook_url) {
    webhookUrlInput.value = storageData.webhook_url;
  }

  let quickTags = storageData.quick_tags;
  if (!Array.isArray(quickTags) || quickTags.length === 0) {
    quickTags = [...DEFAULT_TAGS];
    await chrome.storage.sync.set({ quick_tags: quickTags });
  }

  let pipelineGroups = storageData.pipeline_groups;
  if (!Array.isArray(pipelineGroups) || pipelineGroups.length === 0) {
    pipelineGroups = [...DEFAULT_GROUPS];
    await chrome.storage.sync.set({ pipeline_groups: pipelineGroups });
  }

  renderGroups(pipelineGroups);
  renderTags(quickTags);

  // --- Web App URL Handlers ---
  saveUrlBtn.addEventListener('click', async () => {
    const url = webhookUrlInput.value.trim();
    if (!url) {
      showAlert(webhookAlert, 'Please enter a valid Google Web App URL.', 'error');
      return;
    }
    await chrome.storage.sync.set({ webhook_url: url });
    showAlert(webhookAlert, 'Google Web App URL successfully saved!', 'success');
  });

  testUrlBtn.addEventListener('click', async () => {
    const url = webhookUrlInput.value.trim();
    if (!url) {
      showAlert(webhookAlert, 'Please enter a Web App URL before testing.', 'error');
      return;
    }

    testUrlBtn.textContent = 'Testing...';
    testUrlBtn.disabled = true;

    try {
      // CORS Preflight Firewall Bypass strategy: mode: 'no-cors' + text/plain Content-Type
      const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type: 'test_connection',
          client: 'LinkTag Pro Workspace Extension',
          timestamp: new Date().toISOString()
        })
      });

      if (response.type === 'opaque' || response.ok || response.status === 200) {
        showAlert(webhookAlert, 'Connection successful! Google Web App endpoint reached.', 'success');
      } else {
        showAlert(webhookAlert, `Endpoint returned HTTP status ${response.status}. Please check deployment settings.`, 'error');
      }
    } catch (err) {
      console.error('Webhook test error:', err);
      showAlert(webhookAlert, `Connection failed: ${err.message || 'Unable to fetch'}. Check URL syntax & Google Web App access ('Anyone').`, 'error');
    } finally {
      testUrlBtn.textContent = 'Test Connection';
      testUrlBtn.disabled = false;
    }
  });

  // --- Pipeline Group Manager Handlers ---
  const handleAddGroup = async () => {
    const groupText = newGroupInput.value.trim();
    if (!groupText) {
      showAlert(groupAlert, 'Please enter a pipeline group label.', 'error');
      return;
    }

    if (pipelineGroups.some(g => g.toLowerCase() === groupText.toLowerCase())) {
      showAlert(groupAlert, `Pipeline group "${groupText}" already exists.`, 'error');
      return;
    }

    pipelineGroups.push(groupText);
    await chrome.storage.sync.set({ pipeline_groups: pipelineGroups });
    newGroupInput.value = '';
    renderGroups(pipelineGroups);
    showAlert(groupAlert, `Added pipeline group "${groupText}".`, 'success');
  };

  addGroupBtn.addEventListener('click', handleAddGroup);
  newGroupInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddGroup();
  });

  function renderGroups(groups) {
    groupContainer.innerHTML = '';
    if (groups.length === 0) {
      groupContainer.innerHTML = '<span style="color: var(--text-dim); font-size: 0.85rem;">No pipeline groups saved. Add one above!</span>';
      return;
    }

    groups.forEach((group, index) => {
      const badge = document.createElement('div');
      badge.className = 'tag-badge';

      const label = document.createElement('span');
      label.textContent = group;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'tag-delete-btn';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = `Delete ${group}`;
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        pipelineGroups.splice(index, 1);
        await chrome.storage.sync.set({ pipeline_groups: pipelineGroups });
        renderGroups(pipelineGroups);
        showAlert(groupAlert, `Removed pipeline group "${group}".`, 'success');
      });

      badge.appendChild(label);
      badge.appendChild(deleteBtn);
      groupContainer.appendChild(badge);
    });
  }

  // --- Quick Tag Manager Handlers ---
  const handleAddTag = async () => {
    const tagText = newTagInput.value.trim();
    if (!tagText) {
      showAlert(tagAlert, 'Please enter a tag label.', 'error');
      return;
    }

    if (quickTags.some(t => t.toLowerCase() === tagText.toLowerCase())) {
      showAlert(tagAlert, `Tag "${tagText}" already exists.`, 'error');
      return;
    }

    quickTags.push(tagText);
    await chrome.storage.sync.set({ quick_tags: quickTags });
    newTagInput.value = '';
    renderTags(quickTags);
    showAlert(tagAlert, `Added tag "${tagText}".`, 'success');
  };

  addTagBtn.addEventListener('click', handleAddTag);
  newTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddTag();
  });

  function renderTags(tags) {
    tagContainer.innerHTML = '';
    if (tags.length === 0) {
      tagContainer.innerHTML = '<span style="color: var(--text-dim); font-size: 0.85rem;">No quick tags saved. Add one above!</span>';
      return;
    }

    tags.forEach((tag, index) => {
      const badge = document.createElement('div');
      badge.className = 'tag-badge';

      const label = document.createElement('span');
      label.textContent = tag;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'tag-delete-btn';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = `Delete ${tag}`;
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        quickTags.splice(index, 1);
        await chrome.storage.sync.set({ quick_tags: quickTags });
        renderTags(quickTags);
        showAlert(tagAlert, `Removed tag "${tag}".`, 'success');
      });

      badge.appendChild(label);
      badge.appendChild(deleteBtn);
      tagContainer.appendChild(badge);
    });
  }

  // Utility to display alert notifications
  function showAlert(alertEl, message, type) {
    alertEl.textContent = message;
    alertEl.className = `alert-banner ${type}`;
    
    if (alertEl.dataset.timeoutId) {
      clearTimeout(parseInt(alertEl.dataset.timeoutId, 10));
    }

    const timeoutId = setTimeout(() => {
      alertEl.className = 'alert-banner';
      alertEl.textContent = '';
    }, 4000);

    alertEl.dataset.timeoutId = timeoutId.toString();
  }
});
