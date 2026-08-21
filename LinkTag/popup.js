/**
 * LinkTag Pro Workspace - Central Tracking Window Script
 * Features Zero-DOM Scraping JSON-LD Extraction (Name, Title, Image Avatar, Email)
 * & CORS Preflight Bypass Sync with Pipeline Group Selection
 */

const DEFAULT_AVATAR_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%2394a3b8' viewBox='0 0 24 24'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const profileAvatarEl = document.getElementById('profileAvatar');
  const profileNameEl = document.getElementById('profileName');
  const profileTitleEl = document.getElementById('profileTitle');
  const profileUrlEl = document.getElementById('profileUrl');
  const profileEmailEl = document.getElementById('profileEmail');
  const refreshMetaBtn = document.getElementById('refreshMetaBtn');
  
  const groupSelectEl = document.getElementById('groupSelect');

  const activeTagsBox = document.getElementById('activeTagsBox');
  const activeCountEl = document.getElementById('activeCount');
  const customActiveTagInput = document.getElementById('customActiveTagInput');
  const addActiveTagBtn = document.getElementById('addActiveTagBtn');
  
  const quickTagsGrid = document.getElementById('quickTagsGrid');
  const notesTextarea = document.getElementById('notesTextarea');
  
  const syncBtn = document.getElementById('syncBtn');
  const syncBtnText = document.getElementById('syncBtnText');
  const statusAlert = document.getElementById('statusAlert');
  const openOptionsBtn = document.getElementById('openOptionsBtn');

  // Set image fallback error handler
  profileAvatarEl.onerror = () => {
    profileAvatarEl.src = DEFAULT_AVATAR_SVG;
  };

  // Application State
  let currentProfileData = {
    name: 'Unknown Profile',
    title: 'No Title Extracted',
    url: 'https://linkedin.com',
    image: '',
    email: 'Cannot Find'
  };
  
  let activeTags = new Set();
  let quickTags = [];
  let pipelineGroups = [];
  let webhookUrl = '';

  // Initialize Page Data
  await loadStorageData();
  await loadTabProfileData();

  // Open Options Page
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Refresh Metadata Event
  refreshMetaBtn.addEventListener('click', async () => {
    refreshMetaBtn.style.transform = 'rotate(360deg)';
    refreshMetaBtn.style.transition = 'transform 0.4s ease';
    await loadTabProfileData();
    setTimeout(() => {
      refreshMetaBtn.style.transform = 'none';
      refreshMetaBtn.style.transition = 'none';
    }, 400);
  });

  // Custom Active Tag Handlers
  const handleAddCustomActiveTag = () => {
    const text = customActiveTagInput.value.trim();
    if (text) {
      activeTags.add(text);
      customActiveTagInput.value = '';
      renderActiveTags();
      updateQuickTagStates();
    }
  };

  addActiveTagBtn.addEventListener('click', handleAddCustomActiveTag);
  customActiveTagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddCustomActiveTag();
  });

  // Sync to Google Sheets Handler (CORS Preflight Firewall Bypass)
  syncBtn.addEventListener('click', async () => {
    if (!webhookUrl) {
      showStatusAlert(
        'Google Web App URL missing. <span id="alertOptionsLink" class="open-options-link">Open Settings</span>',
        'error'
      );
      document.getElementById('alertOptionsLink')?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
      return;
    }

    // UI Loading State
    syncBtn.disabled = true;
    syncBtn.classList.add('loading');
    syncBtnText.textContent = 'Syncing...';
    hideStatusAlert();

    const activeTagsList = Array.from(activeTags).join(', ').trim();
    const currentDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    // Outgoing JSON payload matching exact 8-column sequence map:
    // Column A: Date | Column B: Name | Column C: Title | Column D: URL | Column E: Email | Column F: Groups | Column G: Tags | Column H: Notes
    const payload = {
      date: currentDateStr,
      name: profileNameEl.innerText.trim() || "Unknown Profile",
      title: profileTitleEl.innerText.trim() || "No Title Listed",
      url: currentProfileData.url || profileUrlEl.innerText.trim(),
      email: currentProfileData.email || "Cannot Find",
      groups: groupSelectEl.value.trim() || "None Assigned",
      tags: activeTagsList || "No Tags",
      notes: notesTextarea.value.trim() || "No Notes Entered"
    };

    console.log('[LinkTag Pro] Transmitting payload to Google Web App:', payload);

    try {
      // CORS Preflight Firewall Bypass Strategy:
      // mode: 'no-cors' + Content-Type: 'text/plain;charset=utf-8' prevents OPTIONS preflight handshake
      const response = await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (response.type === 'opaque' || response.ok || response.status === 200) {
        showStatusAlert('Successfully synced profile to Google Sheets!', 'success');
        syncBtnText.textContent = 'Synced!';
      } else {
        showStatusAlert(`Sync returned status ${response.status}. Check Web App configuration.`, 'error');
        syncBtnText.textContent = 'Sync Failed';
      }
    } catch (err) {
      console.error('Network sync error:', err);
      showStatusAlert(`Sync failed: ${err.message || 'Network error'}. Check Web App URL & internet connection.`, 'error');
      syncBtnText.textContent = 'Sync Failed';
    } finally {
      syncBtn.classList.remove('loading');
      setTimeout(() => {
        syncBtn.disabled = false;
        syncBtnText.textContent = 'Sync to Google Sheets';
      }, 3000);
    }
  });

  // --- Core Functions ---

  async function loadStorageData() {
    const data = await chrome.storage.sync.get(['webhook_url', 'quick_tags', 'pipeline_groups']);
    webhookUrl = data.webhook_url || '';
    
    quickTags = Array.isArray(data.quick_tags) && data.quick_tags.length > 0
      ? data.quick_tags
      : ["Recruiter", "Software Engineer", "Founder", "Hiring Manager", "High Priority"];

    pipelineGroups = Array.isArray(data.pipeline_groups) && data.pipeline_groups.length > 0
      ? data.pipeline_groups
      : ["Inbound Leads", "Prospecting", "Interviewing", "Active Clients", "Talent Pool"];

    renderPipelineGroups();
    renderQuickTags();
  }

  function renderPipelineGroups() {
    groupSelectEl.innerHTML = '<option value="">-- Select a Pipeline Group --</option>';
    pipelineGroups.forEach(group => {
      const opt = document.createElement('option');
      opt.value = group;
      opt.textContent = group;
      groupSelectEl.appendChild(opt);
    });
  }

  async function loadTabProfileData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        setFallbackProfile('No active tab detected');
        return;
      }

      // Execute in-page extraction script (Zero DOM Scraping: JSON-LD + OpenGraph + Email Parsing)
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractLinkedInMetadata
      });

      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        currentProfileData = {
          name: data.name || 'Unknown Profile',
          title: data.title || 'No Headline Available',
          url: data.url || tab.url.split('?')[0],
          image: data.image || '',
          email: data.email || 'Cannot Find'
        };
      } else {
        currentProfileData = {
          name: 'Non-LinkedIn Page',
          title: tab.title || 'Web Page',
          url: tab.url ? tab.url.split('?')[0] : 'https://linkedin.com',
          image: '',
          email: 'Cannot Find'
        };
      }
    } catch (err) {
      console.error('Script execution error:', err);
      currentProfileData = {
        name: 'LinkedIn Metadata Capture',
        title: 'Open a LinkedIn Profile tab to extract profile details.',
        url: 'https://linkedin.com',
        image: '',
        email: 'Cannot Find'
      };
    }

    displayProfileData();
    await checkExistingProfile();
  }

  async function checkExistingProfile() {
    if (!webhookUrl || !currentProfileData.url || currentProfileData.url === 'https://linkedin.com') return;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'check_profile',
          url: currentProfileData.url
        })
      });

      if (response.ok) {
        const text = await response.text();
        let resData = null;
        try { resData = JSON.parse(text); } catch(e) {}

        if (resData && resData.status === 'found' && resData.data) {
          const rec = resData.data;
          
          // Display Already Tagged Glass Banner
          const alreadyTaggedBanner = document.getElementById('alreadyTaggedBanner');
          const taggedDateText = document.getElementById('taggedDateText');
          if (alreadyTaggedBanner && taggedDateText) {
            taggedDateText.textContent = `Saved on ${rec.date || 'Sheets'} in group: "${rec.groups || 'None'}"`;
            alreadyTaggedBanner.classList.add('visible');
          }

          // Populate Popup UI with saved values from Google Sheets
          if (rec.groups && rec.groups !== 'None Assigned') {
            const optMatch = Array.from(groupSelectEl.options).find(o => o.value === rec.groups);
            if (optMatch) {
              groupSelectEl.value = rec.groups;
            } else {
              const opt = document.createElement('option');
              opt.value = rec.groups;
              opt.textContent = rec.groups;
              groupSelectEl.appendChild(opt);
              groupSelectEl.value = rec.groups;
            }
          }

          if (rec.tags && rec.tags !== 'No Tags') {
            const savedTags = rec.tags.split(',').map(t => t.trim()).filter(Boolean);
            savedTags.forEach(t => activeTags.add(t));
            renderActiveTags();
            updateQuickTagStates();
          }

          if (rec.notes && rec.notes !== 'No Notes Entered') {
            notesTextarea.value = rec.notes;
          }

          if (rec.email && rec.email !== 'Cannot Find') {
            currentProfileData.email = rec.email;
            if (profileEmailEl) profileEmailEl.textContent = `Email: ${rec.email}`;
          }

          // Update Sync Button Label
          syncBtnText.textContent = 'Update Record in Google Sheets';
        }
      }
    } catch (err) {
      console.warn('Profile lookup check notice:', err);
    }
  }

  function displayProfileData() {
    profileNameEl.textContent = currentProfileData.name;
    profileTitleEl.textContent = currentProfileData.title;
    profileUrlEl.textContent = currentProfileData.url;
    profileUrlEl.title = currentProfileData.url;

    if (profileEmailEl) {
      profileEmailEl.textContent = `Email: ${currentProfileData.email || 'Cannot Find'}`;
    }

    if (currentProfileData.image) {
      profileAvatarEl.src = currentProfileData.image;
    } else {
      profileAvatarEl.src = DEFAULT_AVATAR_SVG;
    }
  }

  function setFallbackProfile(msg) {
    currentProfileData = {
      name: 'Unknown Profile',
      title: msg,
      url: 'https://linkedin.com',
      image: '',
      email: 'Cannot Find'
    };
    displayProfileData();
  }

  function renderActiveTags() {
    activeTagsBox.innerHTML = '';
    const tagsArr = Array.from(activeTags);
    activeCountEl.textContent = tagsArr.length.toString();

    if (tagsArr.length === 0) {
      activeTagsBox.innerHTML = '<span class="empty-tags-hint">No tags attached. Select quick tags below!</span>';
      return;
    }

    tagsArr.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'active-tag-pill';
      pill.textContent = tag;

      const removeBtn = document.createElement('span');
      removeBtn.className = 'active-tag-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Remove ${tag}`;
      removeBtn.addEventListener('click', () => {
        activeTags.delete(tag);
        renderActiveTags();
        updateQuickTagStates();
      });

      pill.appendChild(removeBtn);
      activeTagsBox.appendChild(pill);
    });
  }

  function renderQuickTags() {
    quickTagsGrid.innerHTML = '';
    quickTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'quick-tag-btn';
      btn.textContent = tag;

      if (activeTags.has(tag)) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        if (activeTags.has(tag)) {
          activeTags.delete(tag);
          btn.classList.remove('active');
        } else {
          activeTags.add(tag);
          btn.classList.add('active');
        }
        renderActiveTags();
      });

      quickTagsGrid.appendChild(btn);
    });
  }

  function updateQuickTagStates() {
    const buttons = quickTagsGrid.querySelectorAll('.quick-tag-btn');
    buttons.forEach(btn => {
      if (activeTags.has(btn.textContent)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function showStatusAlert(htmlContent, type) {
    statusAlert.innerHTML = htmlContent;
    statusAlert.className = `status-alert ${type}`;
  }

  function hideStatusAlert() {
    statusAlert.className = 'status-alert';
    statusAlert.innerHTML = '';
  }
});

/**
 * Injected script executed inside the active tab context.
 * 7-Layer Extraction Engine for Name, Title, Avatar, and Email (including /overlay/contact-info/ & code tags).
 * Returns "Cannot Find" if no email address is accessible.
 */
async function extractLinkedInMetadata() {
  const cleanUrl = window.location.href.split('?')[0];
  let name = '';
  let title = '';
  let image = '';
  let email = '';

  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

  const isUserEmail = (eStr) => {
    if (!eStr || typeof eStr !== 'string') return false;
    const lower = eStr.trim().toLowerCase();
    if (lower.endsWith('@linkedin.com') || lower.endsWith('@licdn.com') || lower.endsWith('@example.com') || lower.endsWith('@w3.org') || lower.endsWith('@schema.org')) {
      return false;
    }
    if (lower.startsWith('support@') || lower.startsWith('info@') || lower.startsWith('help@') || lower.startsWith('no-reply@') || lower.startsWith('donotreply@')) {
      return false;
    }
    return true;
  };

  const findEmailInText = (text) => {
    if (!text) return '';
    const matches = text.match(emailRegex);
    if (matches) {
      const valid = matches.find(isUserEmail);
      if (valid) return valid.trim();
    }
    return '';
  };

  // 1. Search all mailto: links in DOM immediately
  const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
  for (const a of mailtoLinks) {
    const raw = a.href.replace(/^mailto:/i, '').split('?')[0].trim();
    if (isUserEmail(raw)) {
      email = raw;
      break;
    }
  }

  // 2. Search all <code> tags (LinkedIn embeds initial JSON state in code tags)
  if (!email) {
    const codeTags = document.querySelectorAll('code');
    for (const code of codeTags) {
      const text = code.textContent || '';
      if (text.includes('@')) {
        const found = findEmailInText(text);
        if (found) {
          email = found;
          break;
        }
      }
    }
  }

  // 3. Search script[type="application/ld+json"] tags for "Person" object
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      const items = Array.isArray(data) ? data : (data['@graph'] || [data]);

      for (const item of items) {
        if (item && (item['@type'] === 'Person' || item['@type'] === 'http://schema.org/Person')) {
          if (!name) name = item.name || `${item.givenName || ''} ${item.familyName || ''}`.trim();
          if (!title) title = Array.isArray(item.jobTitle) ? item.jobTitle.join(', ') : (item.jobTitle || item.worksFor?.name || item.description);
          if (!image && item.image) {
            image = typeof item.image === 'string' ? item.image : (item.image.contentUrl || item.image.url || '');
          }
          if (!email && item.email && isUserEmail(item.email)) {
            email = item.email;
          }
        }
      }
    } catch (e) {}
  }

  // 4. Try clicking Contact Info link in DOM if present & email not found yet
  if (!email) {
    const contactBtn = document.querySelector('a[href*="contact-info"]') ||
                       document.querySelector('#top-card-text-details-contact-info') ||
                       document.querySelector('a[href*="/overlay/contact-info"]');
    if (contactBtn) {
      try {
        contactBtn.click();
        await new Promise(resolve => setTimeout(resolve, 350));
        
        const modal = document.querySelector('.pv-contact-info') ||
                      document.querySelector('section.ci-email') ||
                      document.querySelector('#pv-contact-info') ||
                      document.querySelector('.artdeco-modal');
        if (modal) {
          const mailtoModal = modal.querySelector('a[href^="mailto:"]');
          if (mailtoModal) {
            const raw = mailtoModal.href.replace(/^mailto:/i, '').split('?')[0].trim();
            if (isUserEmail(raw)) email = raw;
          }
          if (!email) {
            const found = findEmailInText(modal.innerText || modal.innerHTML);
            if (found) email = found;
          }
        }
      } catch (err) {
        console.warn('Contact info click error:', err);
      }
    }
  }

  // 5. Fetch /overlay/contact-info/ directly if email still missing
  if (!email && window.location.hostname.includes('linkedin.com') && window.location.pathname.includes('/in/')) {
    try {
      const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '').replace(/\/overlay\/contact-info/i, '');
      const contactUrl = baseUrl + '/overlay/contact-info/';
      
      const response = await fetch(contactUrl, {
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        credentials: 'include'
      });

      if (response.ok) {
        const htmlText = await response.text();
        const mailtoMatch = htmlText.match(/href=["']mailto:([^"'?]+)["']/i);
        if (mailtoMatch && mailtoMatch[1] && isUserEmail(mailtoMatch[1])) {
          email = mailtoMatch[1].trim();
        } else {
          const found = findEmailInText(htmlText);
          if (found) email = found;
        }
      }
    } catch (err) {
      console.warn('Contact info overlay fetch error:', err);
    }
  }

  // 6. Search full document body text for email addresses
  if (!email && document.body) {
    const found = findEmailInText(document.body.innerText || document.body.innerHTML);
    if (found) email = found;
  }

  // 7. Image & Metadata fallbacks
  if (!image) {
    const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                  document.querySelector('meta[name="image"]')?.getAttribute('content');
    if (ogImg && !ogImg.includes('static.licdn.com/aero-v1/sc/h/')) {
      image = ogImg;
    }
  }

  if (!image) {
    const imgEl = document.querySelector('img.pv-top-card-profile-picture__image') ||
                  document.querySelector('img.profile-photo-edit__preview') ||
                  document.querySelector('img.pv-top-card__photo') ||
                  document.querySelector('img.EntityPhoto-profile-3') ||
                  document.querySelector('img.EntityPhoto-profile-4') ||
                  document.querySelector('img[alt*="profile" i]') ||
                  document.querySelector('img[alt*="photo" i]');
    if (imgEl && imgEl.src && !imgEl.src.startsWith('data:image/svg+xml')) {
      image = imgEl.src;
    }
  }

  if (!name || !title) {
    const docTitle = document.title || '';
    if (docTitle.includes('| LinkedIn') || window.location.hostname.includes('linkedin.com')) {
      const cleanTitle = docTitle.replace(/\| LinkedIn$/i, '').trim();
      const parts = cleanTitle.split(' - ');
      if (parts.length >= 2) {
        if (!name) name = parts[0].trim();
        if (!title) title = parts.slice(1).join(' - ').trim();
      } else if (parts.length === 1 && parts[0]) {
        if (!name) name = parts[0].trim();
      }
    }

    if (!name) {
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      if (ogTitle) {
        const ogParts = ogTitle.split(' - ');
        name = ogParts[0].trim();
        if (!title && ogParts.length > 1) {
          title = ogParts.slice(1).join(' - ').replace(/\| LinkedIn$/i, '').trim();
        }
      }
    }

    if (!title) {
      const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                     document.querySelector('meta[name="description"]')?.getAttribute('content');
      if (ogDesc) {
        title = ogDesc.trim();
      }
    }
  }

  return {
    name: name || 'LinkedIn Profile',
    title: title || 'Profile Member',
    url: cleanUrl,
    image: image || '',
    email: email || 'Cannot Find'
  };
}
