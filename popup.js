/**
 * TagSilo Pro - Popup Application Controller (Manifest V3)
 * Full Production Grade Commercial Controller
 * Connected to Vercel Serverless Backend & Supabase Database Layer
 * 7-Layer Extraction Engine with Hard Timeout Infinite Loop Protection,
 * Live GET /api/profile-status Verification, POST /api/checkout, and Anti-Duplicate Sync.
 */

const DEFAULT_VERCEL_URL = "https://temporary-instant-sable-4evp3vd.vercel.app";

document.addEventListener("DOMContentLoaded", async () => {
  // DOM References
  const headerTierBadge = document.getElementById("headerTierBadge");
  const dailyCapPill = document.getElementById("dailyCapPill");
  const dailyCapIcon = document.getElementById("dailyCapIcon");
  const dailyCapText = document.getElementById("dailyCapText");
  const openOptionsBtn = document.getElementById("openOptionsBtn");

  // Google Auth Elements
  const googleSignInBtn = document.getElementById("googleSignInBtn");
  const googleUserBar = document.getElementById("googleUserBar");
  const userAvatarImg = document.getElementById("userAvatarImg");
  const userAvatarPlaceholder = document.getElementById("userAvatarPlaceholder");
  const userEmailText = document.getElementById("userEmailText");
  const disconnectGoogleBtn = document.getElementById("disconnectGoogleBtn");

  // Profile Extraction Elements
  const detectStatusBadge = document.getElementById("detectStatusBadge");
  const detectStatusText = document.getElementById("detectStatusText");
  const refreshMetaBtn = document.getElementById("refreshMetaBtn");
  const leadAvatarImg = document.getElementById("leadAvatarImg");
  const leadAvatarPlaceholder = document.getElementById("leadAvatarPlaceholder");
  const leadNameInput = document.getElementById("leadNameInput");
  const profileJobTitle = document.getElementById("profileJobTitle");
  const leadEmailInput = document.getElementById("leadEmailInput");
  const profileUrlBadge = document.getElementById("profileUrlBadge");
  const profileEmailBadge = document.getElementById("profileEmailBadge");

  // Already Tagged Glass Banner
  const alreadyTaggedBanner = document.getElementById("alreadyTaggedBanner");
  const taggedDateText = document.getElementById("taggedDateText");

  // Pipeline Group Controls
  const groupSelect = document.getElementById("groupSelect");
  const manageGroupsBtn = document.getElementById("manageGroupsBtn");

  // Tag Management Elements
  const activeTagsBox = document.getElementById("activeTagsBox");
  const activeCountLabel = document.getElementById("activeCountLabel");
  const customActiveTagInput = document.getElementById("customActiveTagInput");
  const addActiveTagBtn = document.getElementById("addActiveTagBtn");
  const quickTagsGrid = document.getElementById("quickTagsGrid");
  const manageTagsBtn = document.getElementById("manageTagsBtn");
  const tagLimitCounter = document.getElementById("tagLimitCounter");
  const inlineTagLimitBanner = document.getElementById("inlineTagLimitBanner");

  // Notes
  const leadNotesInput = document.getElementById("leadNotesInput");
  const charCountLabel = document.getElementById("charCountLabel");

  // Sync Action, Toast & Persistent Shortcut Link
  const primarySyncBtn = document.getElementById("primarySyncBtn");
  const syncBtnSpinner = document.getElementById("syncBtnSpinner");
  const syncBtnIcon = document.getElementById("syncBtnIcon");
  const syncBtnText = document.getElementById("syncBtnText");
  const syncToast = document.getElementById("syncToast");
  const toastMessage = document.getElementById("toastMessage");
  const toastSheetLink = document.getElementById("toastSheetLink");
  const sheetShortcutLink = document.getElementById("sheetShortcutLink");

  // Paywall Modal Elements
  const paywallModalOverlay = document.getElementById("paywallModalOverlay");
  const closePaywallBtn = document.getElementById("closePaywallBtn");
  const paywallDynamicMessage = document.getElementById("paywallDynamicMessage");
  const creemCheckoutBtn = document.getElementById("creemCheckoutBtn");
  const enterLicenseLink = document.getElementById("enterLicenseLink");

  // Error fallback for avatar image
  leadAvatarImg.onerror = () => {
    leadAvatarImg.style.display = "none";
    leadAvatarPlaceholder.style.display = "flex";
    leadAvatarPlaceholder.textContent = (leadNameInput.value || "L").charAt(0).toUpperCase();
  };

  // App State Variables
  let currentAuthToken = null;
  let currentGoogleUser = null;
  let isProUser = false;
  let licenseTier = "free";
  let dailyCount = 0;
  let maxDaily = 3;
  let isCapped = false;
  let activeTags = new Set();
  let quickTags = [];
  let pipelineGroups = [];
  let currentProfileUrl = "";
  let currentProfileAvatarUrl = "";
  let currentExtractedHeadline = "";
  let currentExtractedEmail = "Cannot Find";
  let isProfileAlreadySaved = false;
  let backendApiUrl = DEFAULT_VERCEL_URL;

  // 1. Initial State Load & Cache Hydration
  await initializeApp();

  async function initializeApp() {
    // Resolve Vercel / backend server endpoint
    try {
      const { vercel_backend_url, backend_server_url } = await chrome.storage.local.get([
        "vercel_backend_url",
        "backend_server_url"
      ]);
      backendApiUrl = vercel_backend_url || backend_server_url || DEFAULT_VERCEL_URL;
    } catch (e) {
      backendApiUrl = DEFAULT_VERCEL_URL;
    }

    // 0. Immediate Pro Status Rehydration & Modal Suppression
    try {
      const { license_tier, is_pro, creem_discount_code, creem_license_key } = await chrome.storage.local.get([
        "license_tier",
        "is_pro",
        "creem_discount_code",
        "creem_license_key"
      ]);

      if (is_pro === true || license_tier === "pro" || (creem_discount_code && creem_discount_code.trim() !== "")) {
        isProUser = true;
        licenseTier = "pro";
        if (headerTierBadge) {
          headerTierBadge.textContent = "PRO";
          headerTierBadge.className = "tier-badge pro";
        }
        if (dailyCapIcon) dailyCapIcon.textContent = "👑";
        if (dailyCapText) dailyCapText.textContent = "UNLIMITED SAVES";
        if (dailyCapPill) dailyCapPill.className = "daily-cap-pill pro-pill";
        if (inlineTagLimitBanner) inlineTagLimitBanner.style.display = "none";
        hidePaywallModal();
      }
    } catch (e) {}

    // A. Instant Rehydrate from Content Script & Storage
    try {
      const [curTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const curUrl = curTab?.url ? curTab.url.split("?")[0].split("#")[0].replace(/\/overlay\/contact-info\/?.*$/i, "").replace(/\/$/, "") : "";
      const { lastCapture, cached_profile_data } = await chrome.storage.local.get(["lastCapture", "cached_profile_data"]);
      const stored = (lastCapture && lastCapture.url === curUrl) ? lastCapture : ((cached_profile_data && cached_profile_data.url === curUrl) ? cached_profile_data : null);
      if (stored && stored.headline && stored.headline !== "No Headline Available" && stored.headline !== "Profile Member") {
        applyExtractedProfile(stored, false);
      }
    } catch (e) {
      console.warn("[TagSilo Pro] Cache load note:", e);
    }

    // B. Rehydrate Persistent Spreadsheet Navigation Shortcut Link
    await refreshSpreadsheetShortcutLink();

    // C. Load Stored Taxonomy and Credentials
    await loadTaxonomyAndSettings();

    // D. Verify Google Identity Auth State
    await checkGoogleAuthState();

    // E. Query GET /api/profile-status from Vercel & Supabase
    await queryUserProfileStatus();

    // F. Pre-Auth Capture Matrix & 7-Layer Profile Extraction
    await executePreAuthProfileCapture();
  }

  async function loadTaxonomyAndSettings() {
    let syncData = {};
    try {
      syncData = await chrome.storage.sync.get(["quick_tags", "tagsilo_tags", "pipeline_groups", "tagsilo_groups"]);
    } catch (e) {}

    const localData = await chrome.storage.local.get([
      "quick_tags",
      "tagsilo_tags",
      "pipeline_groups",
      "tagsilo_groups",
      "tagsilo_google_user",
      "tagsilo_google_access_token",
      "creem_license_key"
    ]);

    quickTags = syncData.quick_tags || syncData.tagsilo_tags || localData.quick_tags || localData.tagsilo_tags || [
      "🔥 High Priority",
      "💼 Executive",
      "🤝 Warm Intro",
      "🚀 Founder",
      "💡 Technical",
      "🎯 Decision Maker"
    ];

    pipelineGroups = syncData.pipeline_groups || syncData.tagsilo_groups || localData.pipeline_groups || localData.tagsilo_groups || [
      "Prospects",
      "Investors & Angels",
      "Talent & Recruiting",
      "Partnerships",
      "Key Accounts"
    ];

    renderPipelineGroups();
    renderQuickTags();
    renderActiveTags();
  }

  // 2. Query Vercel GET /api/profile-status (Supabase Database Layer)
  async function queryUserProfileStatus() {
    try {
      const stored = await chrome.storage.local.get(["creem_license_key", "tagsilo_google_user"]);
      const userEmail = stored.tagsilo_google_user?.email || currentGoogleUser?.email || "";
      const licenseKey = stored.creem_license_key || "";
      const chromeId = chrome.runtime.id;

      const params = new URLSearchParams({
        email: userEmail,
        chrome_id: chromeId,
        license_key: licenseKey
      });

      const response = await fetch(`${backendApiUrl}/api/profile-status?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.isPro || data.status === "active") {
          isProUser = true;
          licenseTier = data.tier || "pro";
          headerTierBadge.textContent = licenseTier.toUpperCase();
          headerTierBadge.className = "tier-badge pro";
          dailyCapIcon.textContent = "👑";
          dailyCapText.textContent = "PRO UNLIMITED";
          dailyCapPill.className = "daily-cap-pill";
          updateTagCounterLabel();
          return;
        }
      }
    } catch (err) {
      console.warn("[TagSilo Pro] /api/profile-status check note:", err.message);
    }

    // Fallback to local 24-hour freemium rolling cap
    await refreshTierAndCapStatus();
  }

  // 3. Profile Extraction Loop (Promise-based matching LinkTag Pro)
  async function executePreAuthProfileCapture() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id || !activeTab.url) {
        setScanStatus("Ready (Manual Entry)", false);
        return;
      }

      const rawUrl = activeTab.url.split("?")[0].split("#")[0];
      const cleanUrl = rawUrl.replace(/\/overlay\/contact-info\/?.*$/i, "").replace(/\/$/, "");
      currentProfileUrl = cleanUrl;
      if (profileUrlBadge) profileUrlBadge.textContent = cleanUrl;

      if (!activeTab.url.includes("linkedin.com")) {
        setScanStatus("Ready (Manual Entry)", false);
        return;
      }

      setScanStatus("Scanning...", true);
      if (profileJobTitle) profileJobTitle.textContent = "Scanning Headline...";

      let extracted = null;

      // Tier 1: Injected In-Page Extractor (Directly pops up Contact Info modal & captures Name, Headline, Avatar, Email)
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: extractLinkedInMetadataInPage
        });
        if (results && results[0] && results[0].result) {
          extracted = results[0].result;
        }
      } catch (execErr) {
        console.warn("[TagSilo Pro] Injected scraper note:", execErr);
      }

      // Tier 2: Content script runtime message fallback
      if (!extracted || !extracted.headline || extracted.headline === "Profile Member") {
        try {
          const resp = await chrome.tabs.sendMessage(activeTab.id, { action: "GET_LINKEDIN_METADATA" });
          if (resp && resp.data) {
            extracted = resp.data;
          }
        } catch (msgErr) {}
      }

      // Tier 3: Local Storage cache fallback
      if (!extracted) {
        try {
          const { lastCapture, cached_profile_data } = await chrome.storage.local.get(["lastCapture", "cached_profile_data"]);
          const matched = (lastCapture && lastCapture.url === cleanUrl) ? lastCapture : ((cached_profile_data && cached_profile_data.url === cleanUrl) ? cached_profile_data : null);
          if (matched) {
            extracted = matched;
          }
        } catch (stErr) {}
      }

      if (extracted) {
        extracted.url = cleanUrl;

        console.log("[TagSilo Pro] Extracted profile data:", JSON.stringify(extracted, null, 2));

        // Apply extracted fields onto UI grid
        applyExtractedProfile(extracted, true);

        // Save dataset immediately to browser local memory
        if (extracted.fullName || extracted.name) {
          await cacheProfileData(extracted);
        }

        // Check if this profile URL is already saved via Backend API
        await checkDuplicateProfile(cleanUrl);

        // If email was not located via in-page scan, trigger secondary background overlay fetcher
        if (!extracted.email || extracted.email === "Cannot Find" || extracted.email === "Unavailable") {
          if (cleanUrl.includes("/in/")) {
            fetchOverlayContactEmail(cleanUrl);
          }
        }
      } else {
        setScanStatus("LinkedIn Page", false);
        if (profileJobTitle && profileJobTitle.textContent === "Scanning Headline...") {
          profileJobTitle.textContent = "No Headline Available";
        }
      }
    } catch (err) {
      console.warn("[TagSilo Pro] Extraction error:", err);
      setScanStatus("Ready (Manual Entry)", false);
      if (profileJobTitle && profileJobTitle.textContent === "Scanning Headline...") {
        profileJobTitle.textContent = "No Headline Available";
      }
    }
  }

  // 4. Anti-Duplicate Check in Google Sheets via Backend API
  async function checkDuplicateProfile(profileUrl) {
    if (!profileUrl || !profileUrl.includes("linkedin.com")) return;

    try {
      const { active_google_sheet_id } = await chrome.storage.local.get("active_google_sheet_id");

      let response = null;
      try {
        const res = await fetch(`${backendApiUrl}/api/sync/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authToken: currentAuthToken,
            profileUrl: profileUrl,
            sheetId: active_google_sheet_id || null
          })
        });
        if (res.ok) {
          response = await res.json();
        }
      } catch (beErr) {
        console.warn("[TagSilo Pro] Backend check fallback note:", beErr.message);
      }

      if (!response) {
        response = await chrome.runtime.sendMessage({
          action: "CHECK_EXISTING_PROFILE",
          profileUrl: profileUrl,
          googleAuthToken: currentAuthToken
        });
      }

      if (response && response.success && response.exists && response.data) {
        isProfileAlreadySaved = true;
        const rec = response.data;

        // Show Already Saved Glass Banner
        if (alreadyTaggedBanner && taggedDateText) {
          taggedDateText.textContent = `Saved on ${rec.date || 'Google Sheet'} in group "${rec.group || 'Prospects'}"`;
          alreadyTaggedBanner.classList.add("visible");
        }

        // Pre-populate fields with existing record
        if (rec.group) {
          const matchOpt = Array.from(groupSelect.options).find(o => o.value === rec.group);
          if (matchOpt) {
            groupSelect.value = rec.group;
          } else {
            const opt = document.createElement("option");
            opt.value = rec.group;
            opt.textContent = rec.group;
            groupSelect.appendChild(opt);
            groupSelect.value = rec.group;
          }
        }

        if (rec.tags && rec.tags !== "No Tags") {
          const savedTags = rec.tags.split(",").map(t => t.trim()).filter(Boolean);
          savedTags.forEach(t => activeTags.add(t));
          renderActiveTags();
          updateQuickTagButtons();
        }

        if (rec.notes && rec.notes !== "No Notes Entered") {
          leadNotesInput.value = rec.notes;
          charCountLabel.textContent = `${rec.notes.length}/500`;
        }

        if (rec.email && rec.email !== "Cannot Find" && rec.email !== "Unavailable") {
          currentExtractedEmail = rec.email;
          updateEmailBadge(rec.email, false);
          if (leadEmailInput) leadEmailInput.value = `Email: ${rec.email}`;
        }

        syncBtnText.textContent = "Update Record in Google Sheets";
      } else {
        isProfileAlreadySaved = false;
        if (alreadyTaggedBanner) alreadyTaggedBanner.classList.remove("visible");
        syncBtnText.textContent = "Sync Profile to Cloud Pipeline";
      }
    } catch (err) {
      console.warn("[TagSilo Pro] Duplicate check note:", err);
    }
  }

  // extractLinkedInMetadataInPage is defined OUTSIDE this closure (at file bottom)
  // so chrome.scripting.executeScript can serialize it properly — matching LinkTag Pro architecture.

  function updateEmailBadge(emailText, isSearching = false) {
    if (!profileEmailBadge) return;
    if (isSearching) {
      profileEmailBadge.textContent = "Email: Searching...";
      profileEmailBadge.className = "profile-url-badge profile-email-badge";
      return;
    }

    const clean = (emailText || "").replace(/^Email:\s*/i, "").trim();
    if (clean && clean !== "Cannot Find" && clean !== "Unavailable" && clean !== "Searching...") {
      currentExtractedEmail = clean;
      profileEmailBadge.textContent = `Email: ${clean}`;
      profileEmailBadge.className = "profile-url-badge profile-email-badge";
    } else {
      currentExtractedEmail = "Cannot Find";
      profileEmailBadge.textContent = "Email: Cannot Find";
      profileEmailBadge.className = "profile-url-badge profile-email-badge not-found";
    }
  }

  function setScanStatus(label, isLive = false) {
    detectStatusText.textContent = label;
    if (isLive) {
      detectStatusBadge.style.borderColor = "rgba(0, 245, 212, 0.4)";
      detectStatusBadge.style.background = "rgba(0, 245, 212, 0.08)";
    } else {
      detectStatusBadge.style.borderColor = "rgba(255, 255, 255, 0.1)";
      detectStatusBadge.style.background = "rgba(30, 41, 59, 0.40)";
    }
  }

  function applyExtractedProfile(data, isLiveDetection = true) {
    const pName = data.name || data.fullName || "";
    if (pName) {
      leadNameInput.value = pName;
      setScanStatus("Profile Detected", true);
    } else if (isLiveDetection) {
      setScanStatus(currentProfileUrl.includes("linkedin.com") ? "LinkedIn Page" : "Ready (Manual Entry)", false);
    }

    // Render Job Title / Profile Headline right below the Full Name
    const titleVal = (data.title || data.headline || data.jobTitle || "").trim();
    if (titleVal) {
      currentExtractedHeadline = titleVal;
      if (profileJobTitle) {
        profileJobTitle.textContent = titleVal;
        profileJobTitle.title = titleVal;
        profileJobTitle.style.display = "block";
      }
    } else {
      currentExtractedHeadline = "";
      if (profileJobTitle) {
        profileJobTitle.textContent = "No Headline Available";
        profileJobTitle.title = "No Headline Available";
        profileJobTitle.style.display = "block";
      }
    }

    if (data.url) {
      currentProfileUrl = data.url;
      if (profileUrlBadge) profileUrlBadge.textContent = data.url;
    }

    // Render Email Badge (searching vs found vs cannot find)
    const rawEmail = (data.email || "").replace(/^Email:\s*/i, "").trim();
    if (rawEmail && rawEmail !== "Cannot Find" && rawEmail !== "Unavailable" && rawEmail !== "Searching...") {
      updateEmailBadge(rawEmail, false);
      if (leadEmailInput) leadEmailInput.value = `Email: ${rawEmail}`;
    } else if (isLiveDetection && currentProfileUrl.includes("linkedin.com")) {
      updateEmailBadge("", true);
      if (leadEmailInput) leadEmailInput.value = "Email: Searching...";
    } else {
      updateEmailBadge("Cannot Find", false);
      if (leadEmailInput) leadEmailInput.value = "Email: Cannot Find";
    }

    // SHOW PROFILE IMAGE (Exact LinkedTag Pro image rendering)
    const imgUrl = data.image || data.avatarUrl || "";
    if (imgUrl && !imgUrl.startsWith("data:image/svg") && !imgUrl.includes("ghost")) {
      currentProfileAvatarUrl = imgUrl;
      leadAvatarImg.src = imgUrl;
      leadAvatarImg.style.display = "block";
      leadAvatarPlaceholder.style.display = "none";
    } else {
      currentProfileAvatarUrl = "";
      leadAvatarImg.style.display = "none";
      leadAvatarPlaceholder.style.display = "flex";
      leadAvatarPlaceholder.textContent = (pName || "L").charAt(0).toUpperCase();
    }
  }

  async function cacheProfileData(data) {
    const packet = {
      fullName: data.fullName || leadNameInput.value || "",
      jobTitle: data.jobTitle || data.headline || currentExtractedHeadline || "",
      headline: data.headline || currentExtractedHeadline || "",
      email: currentExtractedEmail || "Cannot Find",
      avatarUrl: data.avatarUrl || currentProfileAvatarUrl || "",
      url: data.url || currentProfileUrl || "",
      savedAt: new Date().toISOString()
    };
    await chrome.storage.local.set({ cached_profile_data: packet });
  }

  // Overlay Contact Info Email Fetcher via background relay (/overlay/contact-info/)
  async function fetchOverlayContactEmail(profileUrl) {
    if (!profileUrl || !profileUrl.includes("linkedin.com/in/")) {
      updateEmailBadge("Cannot Find", false);
      if (leadEmailInput) leadEmailInput.value = "Email: Cannot Find";
      return "Cannot Find";
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: "FETCH_EMAIL",
        profileUrl: profileUrl
      });

      if (response && response.success && response.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.html, "text/html");

        const mailtoLink = doc.querySelector('a[href^="mailto:"]');
        if (mailtoLink) {
          const emailText = mailtoLink.innerText.trim() || mailtoLink.getAttribute("href").replace(/^mailto:/i, "").trim();
          if (emailText && emailText.includes("@")) {
            currentExtractedEmail = emailText;
            updateEmailBadge(emailText, false);
            if (leadEmailInput) leadEmailInput.value = `Email: ${emailText}`;
            await cacheProfileData({ email: emailText });
            return emailText;
          }
        }

        const emailMatch = response.html.match(/href=["']mailto:([^"'?]+)["']/i) ||
                           response.html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (emailMatch && emailMatch[1]) {
          const cleanEmail = emailMatch[1].trim();
          currentExtractedEmail = cleanEmail;
          updateEmailBadge(cleanEmail, false);
          if (leadEmailInput) leadEmailInput.value = `Email: ${cleanEmail}`;
          await cacheProfileData({ email: cleanEmail });
          return cleanEmail;
        }
      }
    } catch (err) {
      console.warn("[TagSilo Pro] Contact email fetch note:", err);
    }

    updateEmailBadge("Cannot Find", false);
    if (leadEmailInput) leadEmailInput.value = "Email: Cannot Find";
    return "Cannot Find";
  }

  // Refresh Metadata Button Click
  if (refreshMetaBtn) {
    refreshMetaBtn.addEventListener("click", () => {
      refreshMetaBtn.style.transform = "rotate(360deg)";
      refreshMetaBtn.style.transition = "transform 0.4s ease";
      executePreAuthProfileCapture();
      setTimeout(() => {
        refreshMetaBtn.style.transform = "none";
        refreshMetaBtn.style.transition = "none";
      }, 400);
    });
  }

  // 5. Pipeline Group Management & Dropdown Renderer
  function renderPipelineGroups() {
    groupSelect.innerHTML = '<option value="">-- Select a Pipeline Group --</option>';
    pipelineGroups.forEach((groupName, idx) => {
      const option = document.createElement("option");
      option.value = groupName;

      if (!isProUser && idx > 0) {
        option.textContent = `🔒 ${groupName} [PRO]`;
        option.dataset.pro = "true";
      } else {
        option.textContent = idx === 0 ? `${groupName} (Default)` : groupName;
        option.dataset.pro = "false";
      }
      groupSelect.appendChild(option);
    });

    if (groupSelect.options.length > 1) {
      groupSelect.selectedIndex = 1;
    }
  }

  groupSelect.addEventListener("change", (e) => {
    const selectedOption = groupSelect.options[groupSelect.selectedIndex];
    if (!isProUser && selectedOption && selectedOption.dataset.pro === "true") {
      groupSelect.selectedIndex = 1;
      showPaywallModal("Custom pipeline groups are unlocked exclusively for TagSilo Pro members. Upgrade to manage unlimited segmented tracking lists.");
    }
  });

  if (manageGroupsBtn) {
    manageGroupsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // 6. Active Attached Tags Management (with instant remove & in-popup add)
  function renderActiveTags() {
    activeTagsBox.innerHTML = "";
    const tagsArr = Array.from(activeTags);
    if (activeCountLabel) activeCountLabel.textContent = tagsArr.length.toString();

    if (tagsArr.length === 0) {
      activeTagsBox.innerHTML = '<span class="empty-tags-hint">No tags attached. Select quick tags below!</span>';
    } else {
      tagsArr.forEach((tag) => {
        const pill = document.createElement("span");
        pill.className = "active-tag-pill";
        pill.textContent = tag;

        const removeBtn = document.createElement("span");
        removeBtn.className = "active-tag-remove";
        removeBtn.innerHTML = "&times;";
        removeBtn.title = `Remove ${tag}`;
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          activeTags.delete(tag);
          renderActiveTags();
          updateQuickTagButtons();
          inlineTagLimitBanner.classList.remove("visible");
        });

        pill.appendChild(removeBtn);
        activeTagsBox.appendChild(pill);
      });
    }

    updateTagCounterLabel();
  }

  const handleAddCustomActiveTag = async () => {
    const text = customActiveTagInput.value.trim();
    if (!text) return;

    if (!isProUser && activeTags.size >= 2 && !activeTags.has(text)) {
      inlineTagLimitBanner.classList.add("visible");
      return;
    }

    activeTags.add(text);
    if (!quickTags.includes(text)) {
      quickTags.push(text);
      await chrome.storage.local.set({ quick_tags: quickTags, tagsilo_tags: quickTags });
      try {
        await chrome.storage.sync.set({ quick_tags: quickTags, tagsilo_tags: quickTags });
      } catch (e) {}
      renderQuickTags();
    }

    customActiveTagInput.value = "";
    renderActiveTags();
    updateQuickTagButtons();
  };

  addActiveTagBtn.addEventListener("click", handleAddCustomActiveTag);
  customActiveTagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddCustomActiveTag();
  });

  // 7. Quick Add Tags Grid (Button pills that toggle on/off)
  function renderQuickTags() {
    quickTagsGrid.innerHTML = "";
    quickTags.forEach((tag) => {
      const btn = document.createElement("button");
      btn.className = "quick-tag-btn" + (activeTags.has(tag) ? " active" : "");
      btn.textContent = tag;

      btn.addEventListener("click", () => {
        if (activeTags.has(tag)) {
          activeTags.delete(tag);
          btn.classList.remove("active");
          inlineTagLimitBanner.classList.remove("visible");
        } else {
          if (!isProUser && activeTags.size >= 2) {
            inlineTagLimitBanner.classList.add("visible");
            return;
          }
          activeTags.add(tag);
          btn.classList.add("active");
          inlineTagLimitBanner.classList.remove("visible");
        }
        renderActiveTags();
      });

      quickTagsGrid.appendChild(btn);
    });

    updateTagCounterLabel();
  }

  function updateQuickTagButtons() {
    const buttons = quickTagsGrid.querySelectorAll(".quick-tag-btn");
    buttons.forEach((btn) => {
      if (activeTags.has(btn.textContent)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function updateTagCounterLabel() {
    const count = activeTags.size;
    if (isProUser) {
      tagLimitCounter.textContent = `${count} Selected (Pro Unlimited)`;
      tagLimitCounter.style.color = "var(--neon-teal)";
    } else {
      tagLimitCounter.textContent = `${count}/2 Selected`;
      tagLimitCounter.style.color = count >= 2 ? "#fbbf24" : "var(--text-muted)";
    }
  }

  if (manageTagsBtn) {
    manageTagsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // Persistent Spreadsheet Navigation Link
  async function refreshSpreadsheetShortcutLink() {
    const { active_google_sheet_id } = await chrome.storage.local.get("active_google_sheet_id");
    if (active_google_sheet_id && sheetShortcutLink) {
      sheetShortcutLink.href = `https://docs.google.com/spreadsheets/d/${active_google_sheet_id}/edit`;
      sheetShortcutLink.textContent = "View Your TagSilo Google Sheet";
      sheetShortcutLink.style.display = "block";
    }
  }

  // Local Daily Rolling Cap Check & Pro Tier Sync
  async function refreshTierAndCapStatus() {
    try {
      // 1. Direct local storage check for instantaneous response
      const { license_tier, is_pro, creem_discount_code, creem_license_key } = await chrome.storage.local.get([
        "license_tier",
        "is_pro",
        "creem_discount_code",
        "creem_license_key"
      ]);

      if (is_pro === true || license_tier === "pro" || (creem_discount_code && creem_discount_code.trim() !== "")) {
        isProUser = true;
        licenseTier = "pro";
        headerTierBadge.textContent = "PRO";
        headerTierBadge.className = "tier-badge pro";
        dailyCapIcon.textContent = "👑";
        dailyCapText.textContent = "UNLIMITED SAVES";
        dailyCapPill.className = "daily-cap-pill pro-pill";
        if (inlineTagLimitBanner) {
          inlineTagLimitBanner.classList.remove("visible");
          inlineTagLimitBanner.style.display = "none";
        }
        updateTagCounterLabel();
        return;
      }

      // 2. Query Background Worker Check
      const response = await chrome.runtime.sendMessage({ action: "CHECK_SYNC_CAP" });
      if (response && response.success) {
        const { status } = response;
        isProUser = status.isPro;
        licenseTier = status.tier || (isProUser ? "pro" : "free");
        dailyCount = status.count;
        isCapped = status.isCapped;

        if (isProUser) {
          headerTierBadge.textContent = "PRO";
          headerTierBadge.className = "tier-badge pro";
          dailyCapIcon.textContent = "👑";
          dailyCapText.textContent = "UNLIMITED SAVES";
          dailyCapPill.className = "daily-cap-pill pro-pill";
          if (inlineTagLimitBanner) {
            inlineTagLimitBanner.classList.remove("visible");
            inlineTagLimitBanner.style.display = "none";
          }
        } else {
          headerTierBadge.textContent = "FREE";
          headerTierBadge.className = "tier-badge free";
          dailyCapIcon.textContent = "⚡";
          dailyCapText.textContent = `${dailyCount}/3 Saves`;

          if (dailyCount >= 3) {
            dailyCapPill.className = "daily-cap-pill capped";
          } else if (dailyCount === 2) {
            dailyCapPill.className = "daily-cap-pill near-limit";
          } else {
            dailyCapPill.className = "daily-cap-pill";
          }
        }
        updateTagCounterLabel();
      }
    } catch (e) {
      console.warn("[TagSilo Pro] Cap refresh note:", e);
    }
  }

  // Real-time synchronization across Options & Popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" || area === "sync") {
      if (changes.license_tier || changes.is_pro || changes.creem_discount_code || changes.creem_license_key) {
        refreshTierAndCapStatus();
      }
      if (changes.active_google_sheet_id) {
        refreshSpreadsheetShortcutLink();
      }
    }
  });

  // Cross-Browser Google Authorization (Native getAuthToken with tokeninfo scope verification & launchWebAuthFlow fallback)
  async function authenticateWithGoogle(interactive = true) {
    const scopeStr = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

    // 1. Try Native Chrome Extension Identity API
    try {
      const nativeToken = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: interactive, scopes: scopeStr.split(" ") }, (tok) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (!tok) {
            return reject(new Error("No access token returned by Google Identity."));
          }
          resolve(tok);
        });
      });

      if (nativeToken) {
        // Verify token scopes via Google's tokeninfo endpoint
        const tokenInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(nativeToken)}`);
        if (tokenInfoRes.ok) {
          const tokenInfo = await tokenInfoRes.json();
          const grantedScopes = tokenInfo.scope || "";
          const hasSheetsScope = grantedScopes.includes("spreadsheets") || grantedScopes.includes("drive");

          if (hasSheetsScope) {
            const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${nativeToken}` }
            });
            const userProfile = userRes.ok ? await userRes.json() : null;
            const googleUser = {
              email: userProfile?.email || tokenInfo.email || "Google Account Connected",
              name: userProfile?.name || "",
              picture: userProfile?.picture || "",
              lastAuth: new Date().toISOString()
            };

            currentAuthToken = nativeToken;
            currentGoogleUser = googleUser;

            await chrome.storage.local.set({
              tagsilo_google_access_token: nativeToken,
              tagsilo_google_user: googleUser
            });

            // Auto-Ingest / Sync user lead into Supabase database (Free or Pro)
            syncUserToBackend(googleUser);

            return { token: nativeToken, user: googleUser };
          } else {
            console.warn("[TagSilo Pro] Native token lacks spreadsheets scope. Purging cached token...");
            await new Promise((r) => chrome.identity.removeCachedAuthToken({ token: nativeToken }, r));
          }
        } else {
          // Token expired or invalid, purge
          await new Promise((r) => chrome.identity.removeCachedAuthToken({ token: nativeToken }, r));
        }
      }
    } catch (nativeErr) {
      console.warn("[TagSilo Pro] Native getAuthToken note:", nativeErr.message);
    }

    // 2. Fallback to launchWebAuthFlow with registered /google redirect URL
    const redirectUrl = "https://" + chrome.runtime.id + ".chromiumapp.org/google";
    const clientId = chrome.runtime.getManifest().oauth2?.client_id || "1087305619025-un37jr32jn77k6ah4rjc0rlgqekbranf.apps.googleusercontent.com";
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${encodeURIComponent(clientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${encodeURIComponent(scopeStr)}`;

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: interactive
        },
        (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            return reject(new Error(chrome.runtime.lastError?.message || "Authentication flow was cancelled or closed."));
          }

          try {
            const urlObj = new URL(responseUrl);
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            const accessToken = hashParams.get("access_token") || new URLSearchParams(urlObj.search).get("access_token");

            if (!accessToken) {
              return reject(new Error("No access token parameter found in OAuth redirect callback."));
            }

            (async () => {
              let userProfile = null;
              try {
                const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (userRes.ok) {
                  userProfile = await userRes.json();
                }
              } catch (e) {
                console.warn("[TagSilo Pro] User profile lookup note:", e);
              }

              const googleUser = {
                email: userProfile?.email || "Google Account Connected",
                name: userProfile?.name || "",
                picture: userProfile?.picture || "",
                lastAuth: new Date().toISOString()
              };

              currentAuthToken = accessToken;
              currentGoogleUser = googleUser;

              await chrome.storage.local.set({
                tagsilo_google_access_token: accessToken,
                tagsilo_google_user: googleUser
              });

              // Auto-Ingest / Sync user lead into Supabase database (Free or Pro)
              syncUserToBackend(googleUser);

              resolve({
                token: accessToken,
                user: googleUser
              });
            })();
          } catch (parseErr) {
            reject(new Error("Failed to parse token from OAuth callback: " + parseErr.message));
          }
        }
      );
    });
  }

  // 1.1 Auto-Sync / Register user lead into Supabase PostgreSQL (Free or Pro)
  async function syncUserToBackend(googleUser) {
    if (!googleUser || !googleUser.email || googleUser.email.includes("Account Connected")) return;
    try {
      const serverUrl = DEFAULT_VERCEL_URL;
      await fetch(`${serverUrl}/api/user/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name || "",
          picture: googleUser.picture || "",
          chromeId: chrome.runtime.id
        })
      });
    } catch (e) {
      console.warn("[TagSilo Pro] Background user sync notice:", e.message);
    }
  }

  async function checkGoogleAuthState() {
    const { tagsilo_google_access_token, tagsilo_google_user } = await chrome.storage.local.get([
      "tagsilo_google_access_token",
      "tagsilo_google_user"
    ]);

    // 1. Immediately rehydrate from stored user profile if previously connected
    if (tagsilo_google_user && tagsilo_google_user.email) {
      renderAuthenticatedUser(tagsilo_google_user, tagsilo_google_access_token || null);
      syncUserToBackend(tagsilo_google_user);
    }

    // 2. Validate / refresh token in background
    if (tagsilo_google_access_token) {
      try {
        const checkRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tagsilo_google_access_token}` }
        });

        if (checkRes.ok) {
          const userProfile = await checkRes.json();
          currentAuthToken = tagsilo_google_access_token;
          currentGoogleUser = {
            email: userProfile?.email || tagsilo_google_user?.email || "Google Account Connected",
            name: userProfile?.name || tagsilo_google_user?.name || "",
            picture: userProfile?.picture || tagsilo_google_user?.picture || "",
            lastAuth: new Date().toISOString()
          };
          renderAuthenticatedUser(currentGoogleUser, currentAuthToken);
          return;
        } else {
          // Token expired, remove cached token from identity manager
          try {
            await new Promise((r) => chrome.identity.removeCachedAuthToken({ token: tagsilo_google_access_token }, r));
          } catch (e) {}
        }
      } catch (networkErr) {
        console.warn("[TagSilo Pro] Token verification network note:", networkErr);
      }
    }

    // 3. Try silent refresh to get a fresh access token without prompting
    try {
      const silentAuth = await authenticateWithGoogle(false);
      if (silentAuth && silentAuth.token) {
        renderAuthenticatedUser(silentAuth.user, silentAuth.token);
        return;
      }
    } catch (silentErr) {}

    // 4. If user was already signed in, maintain logged-in state (token will auto-refresh on save)
    if (tagsilo_google_user && tagsilo_google_user.email) {
      renderAuthenticatedUser(tagsilo_google_user, null);
      return;
    }

    renderUnauthenticatedUser();
  }

  function renderAuthenticatedUser(user, token) {
    currentGoogleUser = user;
    if (token) currentAuthToken = token;

    googleSignInBtn.style.display = "none";
    googleUserBar.style.display = "flex";
    userEmailText.textContent = user.email || "Google Account Connected";

    if (user.picture) {
      userAvatarImg.src = user.picture;
      userAvatarImg.style.display = "block";
      userAvatarPlaceholder.style.display = "none";
    } else {
      userAvatarImg.style.display = "none";
      userAvatarPlaceholder.style.display = "flex";
      userAvatarPlaceholder.textContent = (user.name || user.email || "G").charAt(0).toUpperCase();
    }
  }

  function renderUnauthenticatedUser() {
    currentAuthToken = null;
    currentGoogleUser = null;
    googleSignInBtn.style.display = "flex";
    googleUserBar.style.display = "none";
  }

  googleSignInBtn.addEventListener("click", async () => {
    googleSignInBtn.disabled = true;
    googleSignInBtn.style.opacity = "0.7";

    try {
      const authResult = await authenticateWithGoogle(true);
      renderAuthenticatedUser(authResult.user, authResult.token);
      await queryUserProfileStatus();
    } catch (err) {
      alert(err.message || "Google Sign-In was cancelled or failed.");
      renderUnauthenticatedUser();
    } finally {
      googleSignInBtn.disabled = false;
      googleSignInBtn.style.opacity = "1";
    }
  });

  disconnectGoogleBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (confirm("Disconnect Google Account from TagSilo Pro?")) {
      await chrome.storage.local.remove(["tagsilo_google_access_token", "tagsilo_google_user"]);
      renderUnauthenticatedUser();
    }
  });

  // Notes Character Counter
  leadNotesInput.addEventListener("input", () => {
    const length = leadNotesInput.value.length;
    charCountLabel.textContent = `${length}/500`;
  });

  // 8. Central Synchronization Execution
  primarySyncBtn.addEventListener("click", async () => {
    // 1. Freemium Squeeze Rule: 3 saves per 24 hours
    if (!isProUser && dailyCount >= maxDaily) {
      showPaywallModal("You've reached your 3 free saves today. Upgrade to Pro for instant unlimited saves for $9.99/mth");
      return;
    }

    // 2. Lead Name Validation
    const leadName = leadNameInput.value.trim();
    if (!leadName) {
      leadNameInput.focus();
      leadNameInput.style.borderBottomColor = "var(--neon-magenta)";
      setTimeout(() => {
        leadNameInput.style.borderBottomColor = "";
      }, 2000);
      return;
    }

    // 3. Ensure Google Auth Token is active
    if (!currentAuthToken) {
      try {
        const authRes = await authenticateWithGoogle(true);
        currentAuthToken = authRes.token;
        renderAuthenticatedUser(authRes.user, authRes.token);
      } catch (e) {
        alert("Google Authentication is required to synchronize pipelines directly to your spreadsheet: " + e.message);
        return;
      }
    }

    setSyncLoadingState(true);

    try {
      const stored = await chrome.storage.local.get(["creem_license_key"]);
      let rawManualEmail = leadEmailInput ? leadEmailInput.value.replace(/^Email:\s*/i, "").trim() : "";
      if (rawManualEmail === "Cannot Find" || rawManualEmail === "Searching..." || rawManualEmail === "Unavailable") {
        rawManualEmail = "";
      }
      const finalEmail = rawManualEmail || (currentExtractedEmail && currentExtractedEmail !== "Unavailable" && currentExtractedEmail !== "Searching..." ? currentExtractedEmail : "Cannot Find");

      // 8-Field Data Payload matching exact Google Sheets sequence:
      // Column A: Saved Date | Column B: Full Name | Column C: Job Title | Column D: LinkedIn URL
      // Column E: Contact Email | Column F: Pipeline Group | Column G: Tags | Column H: Context Notes
      const profileData = {
        fullName: leadName,
        jobTitle: currentExtractedHeadline || (profileJobTitle ? profileJobTitle.textContent : "") || "",
        headline: currentExtractedHeadline || "",
        profileUrl: currentProfileUrl,
        email: finalEmail,
        group: groupSelect.value || "Prospects",
        tags: Array.from(activeTags),
        notes: leadNotesInput.value.trim(),
        userEmail: currentGoogleUser?.email || ""
      };

      // 4. Execute Google Sheets Synchronization via Background Service Worker
      let response = await chrome.runtime.sendMessage({
        action: "EXECUTE_SYNC",
        profileData: profileData,
        googleAuthToken: currentAuthToken,
        creemLicenseKey: stored.creem_license_key || ""
      });

      // 5. If Token Expired or Invalid, Auto-Refresh Google Token and Retry
      const isAuthError = response && !response.success && response.error && (
        response.error.toLowerCase().includes("authentication credential") ||
        response.error.toLowerCase().includes("oauth") ||
        response.error.toLowerCase().includes("token") ||
        response.error.toLowerCase().includes("401") ||
        response.error.toLowerCase().includes("unauthorized")
      );

      if (isAuthError) {
        console.warn("[TagSilo Pro] Expired Google OAuth token detected. Refreshing token...");
        try {
          const refreshed = await authenticateWithGoogle(true);
          currentAuthToken = refreshed.token;
          renderAuthenticatedUser(refreshed.user, refreshed.token);

          response = await chrome.runtime.sendMessage({
            action: "EXECUTE_SYNC",
            profileData: profileData,
            googleAuthToken: refreshed.token,
            creemLicenseKey: stored.creem_license_key || ""
          });
        } catch (reAuthErr) {
          console.error("[TagSilo Pro] Re-auth retry error:", reAuthErr);
        }
      }

      if (response && response.success) {
        const receivedSheetId = response.spreadsheetId || response.data?.spreadsheetId || (response.spreadsheetUrl ? response.spreadsheetUrl.split("/d/")[1]?.split("/")[0] : null);
        if (receivedSheetId) {
          await chrome.storage.local.set({ active_google_sheet_id: receivedSheetId });
          await refreshSpreadsheetShortcutLink();
        }

        const toastMsg = response.alreadyExists || response.updated
          ? "Profile was already saved! Updated record in Google Sheets."
          : "Profile Synced to Google Sheet!";

        showSuccessToast(response.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${receivedSheetId || "all"}/edit`, toastMsg);

        // Update Duplicate Banner State
        if (alreadyTaggedBanner && taggedDateText) {
          taggedDateText.textContent = `Saved on ${new Date().toLocaleDateString()} in group "${profileData.group}"`;
          alreadyTaggedBanner.classList.add("visible");
          syncBtnText.textContent = "Update Record in Google Sheets";
        }

        await queryUserProfileStatus();
      } else if (response && response.capped) {
        showPaywallModal("You've reached your 3 free saves today. Upgrade to Pro for instant unlimited saves for $9.99/mth");
      } else {
        const errMsg = response?.error || "Sync failed. Please ensure your Google Account is connected.";
        alert(errMsg);
      }
    } catch (err) {
      console.error("[TagSilo Pro] Sync Execution Error:", err);
      alert("Error during synchronization: " + err.message);
    } finally {
      setSyncLoadingState(false);
    }
  });

  function setSyncLoadingState(isLoading) {
    primarySyncBtn.disabled = isLoading;
    if (isLoading) {
      syncBtnSpinner.style.display = "block";
      syncBtnIcon.style.display = "none";
      syncBtnText.textContent = "Syncing Pipeline...";
    } else {
      syncBtnSpinner.style.display = "none";
      syncBtnIcon.style.display = "inline";
      syncBtnText.textContent = isProfileAlreadySaved ? "Update Record in Google Sheets" : "Sync Profile to Cloud Pipeline";
    }
  }

  function showSuccessToast(sheetUrl, customMessage) {
    if (customMessage) toastMessage.textContent = customMessage;
    toastSheetLink.href = sheetUrl;
    syncToast.classList.add("show");
    setTimeout(() => {
      syncToast.classList.remove("show");
    }, 4500);
  }

  // Paywall Slide-Up Modal Handlers (Strictly disabled for Pro users)
  function showPaywallModal(customMessage) {
    if (isProUser) {
      hidePaywallModal();
      return;
    }
    if (customMessage) {
      paywallDynamicMessage.textContent = customMessage;
    }
    paywallModalOverlay.style.display = "flex";
    paywallModalOverlay.classList.add("active");
  }

  function hidePaywallModal() {
    if (paywallModalOverlay) {
      paywallModalOverlay.classList.remove("active");
      paywallModalOverlay.style.display = "none";
    }
  }

  closePaywallBtn.addEventListener("click", hidePaywallModal);
  paywallModalOverlay.addEventListener("click", (e) => {
    if (e.target === paywallModalOverlay) hidePaywallModal();
  });

  // Dynamic Creem Checkout Portal Handler (POST /api/checkout)
  if (creemCheckoutBtn) {
    creemCheckoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      creemCheckoutBtn.style.opacity = "0.7";
      creemCheckoutBtn.innerHTML = "<span>Generating Checkout Session...</span>";

      try {
        const userId = currentGoogleUser?.email || "anonymous";
        const stored = await chrome.storage.local.get(["creem_discount_code", "creem_checkout_url"]);
        const discountCode = stored.creem_discount_code || "";

        const res = await fetch(`${backendApiUrl}/api/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            productId: "prod_2UzZ3KgIogYrqFFCZ4N9SP",
            userEmail: currentGoogleUser?.email || "",
            discountCode: discountCode,
            chromeId: chrome.runtime.id,
            successUrl: "https://creem.io/checkout/success",
            cancelUrl: "https://creem.io/checkout/cancel"
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.checkoutUrl && json.checkoutUrl.startsWith("http")) {
            chrome.tabs.create({ url: json.checkoutUrl });
            hidePaywallModal();
            return;
          }
        }
      } catch (err) {
        console.warn("[TagSilo Pro] Checkout API attempt error:", err);
      } finally {
        creemCheckoutBtn.style.opacity = "1";
        creemCheckoutBtn.innerHTML = "<span>🚀 Upgrade to Pro for $9.99/mo</span>";
      }

      // Direct Test Payment Link Fallback with Parameters
      const { creem_discount_code } = await chrome.storage.local.get("creem_discount_code");
      const checkoutUrlObj = new URL("https://www.creem.io/test/product/prod_2UzZ3KgIogYrqFFCZ4N9SP");
      if (creem_discount_code) {
        checkoutUrlObj.searchParams.set("discount_code", creem_discount_code);
        checkoutUrlObj.searchParams.set("coupon", creem_discount_code);
      }
      if (currentGoogleUser?.email) {
        checkoutUrlObj.searchParams.set("email", currentGoogleUser.email);
        checkoutUrlObj.searchParams.set("user_id", currentGoogleUser.email);
      }

      chrome.tabs.create({ url: checkoutUrlObj.toString() });
      hidePaywallModal();
    });
  }

  enterLicenseLink.addEventListener("click", () => {
    hidePaywallModal();
    chrome.runtime.openOptionsPage();
  });

  openOptionsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});

/**
 * Injected script executed inside the active LinkedIn tab context.
 * MUST be defined OUTSIDE the DOMContentLoaded closure so chrome.scripting.executeScript
 * can serialize it as a standalone function.
 *
 * Fully isolated multi-layer extraction engine for Name, Headline, Image Avatar, and Email.
 */
async function extractLinkedInMetadataInPage() {
  const cleanUrl = window.location.href.split('?')[0].split('#')[0].replace(/\/overlay\/contact-info\/?.*$/i, "").replace(/\/$/, "");
  let name = "";
  let title = "";
  let image = "";
  let email = "";

  // -------------------------------------------------------------
  // LAYER 1: HEADLINE & NAME EXTRACTION (DOM & VISUAL HIERARCHY)
  // -------------------------------------------------------------
  try {
    const nameEl = document.querySelector("h1.text-heading-xlarge") ||
                   document.querySelector(".top-card-layout__title") ||
                   document.querySelector(".pv-text-details__left-panel h1") ||
                   document.querySelector("main h1") ||
                   document.querySelector("section.artdeco-card h1") ||
                   document.querySelector("h1");
    if (nameEl) {
      name = (nameEl.innerText || nameEl.textContent || "").trim();
    }

    // 1A. Visual Hierarchy Scan from nameEl
    if (nameEl) {
      const card = nameEl.closest(".pv-text-details__left-panel") ||
                   nameEl.closest("section.artdeco-card") ||
                   nameEl.closest("section") ||
                   nameEl.closest("main") ||
                   document.body;

      const allEls = card.querySelectorAll("div, p, span, h2");
      for (const el of allEls) {
        if (nameEl.contains(el) || el.contains(nameEl) || el === nameEl) continue;
        if (el.closest("button") || el.closest("nav") || el.closest("header") || el.closest("a")) continue;

        const txt = (el.innerText || el.textContent || "").trim();
        if (!txt || txt.length < 8) continue;
        if (name && txt.toLowerCase() === name.toLowerCase()) continue;
        if (txt.toLowerCase().includes("contact info") || txt.toLowerCase().includes("mutual connection") || txt.toLowerCase().includes("follower")) continue;
        if (/^\([a-z\/\s]+\)$/i.test(txt)) continue; // (She/Her)
        if (/^(1st|2nd|3rd|verified|premium)$/i.test(txt)) continue;

        title = txt;
        break;
      }
    }

    // 1B. Direct Selectors
    if (!title) {
      const headlineSelectors = [
        ".pv-text-details__left-panel div.text-body-medium",
        "div.text-body-medium.break-words",
        ".pv-text-details__left-panel > div:nth-child(2)",
        "div[data-generated-suggestion-target]",
        "div[data-anonymize='headline']",
        "div[data-field='headline']",
        "div.top-card-layout__headline",
        "h2.top-card-layout__headline",
        "p.pv-top-card-section__headline",
        ".artdeco-entity-lockup__subtitle",
        ".ph5 div.text-body-medium",
        "section.artdeco-card div.text-body-medium"
      ];
      for (const sel of headlineSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const raw = (el.innerText || el.textContent || "").trim();
          if (raw && raw.length > 2 && (!name || raw.toLowerCase() !== name.toLowerCase()) && !raw.toLowerCase().includes("contact info")) {
            title = raw;
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn("[TagSilo] Headline DOM extraction note:", e);
  }

  // -------------------------------------------------------------
  // LAYER 2: HEADLINE FROM RAW BODY HTML REGEX & TEXT LINES
  // -------------------------------------------------------------
  if (!title) {
    try {
      const html = document.body ? document.body.innerHTML : "";
      const m = html.match(/<div[^>]*class="[^"]*text-body-medium[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                html.match(/<div[^>]*data-generated-suggestion-target[^>]*>([\s\S]*?)<\/div>/i);
      if (m && m[1]) {
        const clean = m[1].replace(/<[^>]+>/g, "").trim();
        if (clean && clean.length > 2 && (!name || clean.toLowerCase() !== name.toLowerCase()) && !clean.toLowerCase().includes("contact info")) {
          title = clean;
        }
      }
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // LAYER 2B: IN-PAGE RENDERED TEXT LINE SCANNING
  // -------------------------------------------------------------
  if (!title && document.body && document.body.innerText) {
    try {
      const lines = document.body.innerText.split("\n").map(l => l.trim()).filter(Boolean);
      let nameIndex = -1;
      if (name) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase() === name.toLowerCase() || (lines[i].includes(name) && lines[i].length < name.length + 10)) {
            nameIndex = i;
            break;
          }
        }
      }
      if (nameIndex === -1) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("connections") || lines[i].includes("Contact info") || lines[i].includes("mutual connection")) {
            nameIndex = Math.max(0, i - 4);
            break;
          }
        }
      }
      for (let i = nameIndex + 1; i < Math.min(lines.length, nameIndex + 8); i++) {
        const line = lines[i];
        if (!line || line.length < 8) continue;
        if (/^\([a-z\/\s]+\)$/i.test(line)) continue;
        if (line.includes("degree connection") || line.includes("mutual connection")) continue;
        if (line.includes("Contact info") || line.includes("connections") || line.includes("followers")) continue;
        if (/^(1st|2nd|3rd|verified|premium|message|follow|connect|more)$/i.test(line)) continue;
        if (line.startsWith("View ") && line.includes("profile")) continue;

        title = line;
        break;
      }
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // LAYER 3: JSON-LD STRUCTURED DATA
  // -------------------------------------------------------------
  try {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : (data["@graph"] || [data]);
        for (const item of items) {
          if (!item) continue;
          if (item["@type"] === "Person" || item["@type"] === "http://schema.org/Person") {
            if (!name) name = item.name || ((item.givenName || "") + " " + (item.familyName || "")).trim();
            if (!title) {
              const h = Array.isArray(item.jobTitle) ? item.jobTitle.join(", ") : (item.jobTitle || item.worksFor?.name || item.description || item.headline);
              if (h && typeof h === "string" && h.trim().length > 2) title = h.trim();
            }
            if (!image && item.image) image = typeof item.image === "string" ? item.image : (item.image.contentUrl || item.image.url || "");
            if (!email && item.email) email = item.email;
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  // -------------------------------------------------------------
  // LAYER 4: META TAGS & DOCUMENT TITLE (UNIVERSAL UNICODE SPLITTING)
  // -------------------------------------------------------------
  if (!title) {
    try {
      const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
                     document.querySelector('meta[name="description"]')?.getAttribute("content") ||
                     document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") || "";
      if (ogDesc) {
        let clean = ogDesc.replace(/^View\s+[^']+'s?\s+profile\s+on\s+LinkedIn[^.]*\.\s*/i, "");
        clean = clean.split(/[\s·•|]\s*(Experience|Education|Location|\d+\+?\s+connection)/i)[0].trim();
        clean = clean.split(" · ")[0].split("Experience:")[0].split("·")[0].replace(/\d+\+?\s+connections.*/i, "").trim();
        if (clean && clean.length > 2 && (!name || clean.toLowerCase() !== name.toLowerCase())) {
          title = clean;
        } else if (ogDesc.trim() && (!name || ogDesc.trim().toLowerCase() !== name.toLowerCase())) {
          title = ogDesc.trim();
        }
      }
    } catch (e) {}
  }

  if (!title) {
    try {
      const rawTitle = document.title || document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
      const cleanTitle = rawTitle.replace(/\| LinkedIn$/i, "").replace(/LinkedIn/i, "").trim();
      const parts = cleanTitle.split(/\s*[-–—|:]\s*/);
      if (parts.length >= 2) {
        const candidate = parts.slice(1).join(" - ").trim();
        if (candidate.length > 2 && (!name || candidate.toLowerCase() !== name.toLowerCase())) {
          title = candidate;
        }
      }
    } catch (e) {}
  }

  if (!name) {
    try {
      const rawTitle = document.title || "";
      const cleanTitle = rawTitle.replace(/\| LinkedIn$/i, "").replace(/LinkedIn/i, "").trim();
      const parts = cleanTitle.split(/\s*[-–—|:]\s*/);
      if (parts.length >= 1 && parts[0].trim()) {
        name = parts[0].trim();
      }
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // LAYER 4B: BACKGROUND FETCH OF CANONICAL URL (GUARANTEED BACKSTOP)
  // -------------------------------------------------------------
  if ((!title || title === "Profile Member") && cleanUrl.includes("linkedin.com/in/")) {
    try {
      const res = await fetch(cleanUrl, { credentials: "include" });
      if (res.ok) {
        const html = await res.text();
        const m = html.match(/<div[^>]*class="[^"]*text-body-medium[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                  html.match(/<div[^>]*data-generated-suggestion-target[^>]*>([\s\S]*?)<\/div>/i);
        if (m && m[1]) {
          const stripped = m[1].replace(/<[^>]+>/g, "").trim();
          if (stripped && stripped.length > 2 && (!name || stripped.toLowerCase() !== name.toLowerCase())) title = stripped;
        }

        if (!title) {
          const ogM = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
          if (ogM && ogM[1]) {
            let clean = ogM[1].replace(/^View\s+[^']+'s?\s+profile\s+on\s+LinkedIn[^.]*\.\s*/i, "");
            clean = clean.split(/[\s·•|]\s*(Experience|Education|Location|\d+\+?\s+connection)/i)[0].trim();
            clean = clean.split(" · ")[0].split("Experience:")[0].split("·")[0].replace(/\d+\+?\s+connections.*/i, "").trim();
            if (clean && clean.length > 2 && (!name || clean.toLowerCase() !== name.toLowerCase())) title = clean;
          }
        }

        if (!title) {
          const tM = html.match(/<title>([^<]+)<\/title>/i);
          if (tM && tM[1]) {
            const cleanTitle = tM[1].replace(/\| LinkedIn$/i, "").replace(/LinkedIn/i, "").trim();
            const parts = cleanTitle.split(/\s*[-–—|:]\s*/);
            if (parts.length >= 2) {
              const candidate = parts.slice(1).join(" - ").trim();
              if (candidate.length > 2 && (!name || candidate.toLowerCase() !== name.toLowerCase())) title = candidate;
            }
          }
        }
      }
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // LAYER 5: AVATAR IMAGE EXTRACTION
  // -------------------------------------------------------------
  try {
    if (!image) {
      const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
                    document.querySelector('meta[name="image"]')?.getAttribute("content") ||
                    document.querySelector('meta[name="twitter:image"]')?.getAttribute("content");
      if (ogImg && !ogImg.includes("static.licdn.com/aero-v1/sc/h/")) image = ogImg;
    }
    if (!image) {
      const imgEl = document.querySelector("img.pv-top-card-profile-picture__image") ||
                    document.querySelector("img.profile-photo-edit__preview") ||
                    document.querySelector("img.pv-top-card__photo") ||
                    document.querySelector("img.EntityPhoto-profile-3") ||
                    document.querySelector("img.EntityPhoto-profile-4") ||
                    document.querySelector(".pv-top-card__non-self-photo-wrapper img") ||
                    document.querySelector(".top-card-layout__entity-image") ||
                    document.querySelector('img[alt*="profile" i]') ||
                    document.querySelector('img[alt*="photo" i]');
      if (imgEl && !imgEl.closest("#global-nav") && !imgEl.closest("nav") && !imgEl.closest("header")) {
        const srcVal = imgEl.src || imgEl.getAttribute("data-delayed-url") || imgEl.getAttribute("data-src") || "";
        if (srcVal && !srcVal.startsWith("data:image/svg") && !srcVal.includes("ghost")) image = srcVal;
      }
    }
  } catch (e) {}

  // -------------------------------------------------------------
  // LAYER 6: EMAIL EXTRACTION (SAFE & ISOLATED)
  // -------------------------------------------------------------
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const isUserEmail = (eStr) => {
    if (!eStr || typeof eStr !== "string") return false;
    const lower = eStr.trim().toLowerCase();
    if (lower.endsWith("@linkedin.com") || lower.endsWith("@licdn.com") || lower.endsWith("@example.com") || lower.endsWith("@w3.org") || lower.endsWith("@schema.org")) return false;
    if (lower.startsWith("support@") || lower.startsWith("info@") || lower.startsWith("help@") || lower.startsWith("no-reply@") || lower.startsWith("donotreply@")) return false;
    return true;
  };
  const findEmailInText = (text) => {
    if (!text) return "";
    const matches = text.match(emailRegex);
    if (matches) {
      const valid = matches.find(isUserEmail);
      if (valid) return valid.trim();
    }
    return "";
  };

  try {
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    for (const a of mailtoLinks) {
      const raw = a.href.replace(/^mailto:/i, "").split("?")[0].trim();
      if (isUserEmail(raw)) { email = raw; break; }
    }
  } catch (e) {}

  if (!email) {
    try {
      const codeTags = document.querySelectorAll("code");
      for (const code of codeTags) {
        const text = code.textContent || "";
        if (text.includes("@")) {
          const found = findEmailInText(text);
          if (found) { email = found; break; }
        }
      }
    } catch (e) {}
  }

  // 6C. Contact Modal Pop-up & Email Extraction (Triggered on Demand)
  if (!email) {
    try {
      // First check if modal is already open in DOM
      const existingModal = document.querySelector(".pv-contact-info") ||
                            document.querySelector("section.ci-email") ||
                            document.querySelector("#pv-contact-info") ||
                            document.querySelector(".artdeco-modal");
      if (existingModal) {
        const mailtoModal = existingModal.querySelector('a[href^="mailto:"]');
        if (mailtoModal) {
          const raw = mailtoModal.href.replace(/^mailto:/i, "").split("?")[0].trim();
          if (isUserEmail(raw)) email = raw;
        }
        if (!email) {
          const found = findEmailInText(existingModal.innerText || existingModal.innerHTML);
          if (found) email = found;
        }
      }

      // If not yet found, trigger the Contact Info modal pop-up
      if (!email) {
        let contactBtn = document.querySelector('a[href*="contact-info"]') ||
                         document.querySelector('#top-card-text-details-contact-info') ||
                         document.querySelector('a[href*="/overlay/contact-info"]') ||
                         document.querySelector('button[aria-label*="contact info" i]') ||
                         document.querySelector('a[aria-label*="contact info" i]') ||
                         document.querySelector('a.ember-view[href*="contact-info"]');
        if (!contactBtn) {
          const allLinks = document.querySelectorAll("main a, section a, .pv-text-details__left-panel a, .ph5 a, a, button");
          for (const l of allLinks) {
            const txt = (l.innerText || l.textContent || "").trim().toLowerCase();
            if (txt.includes("contact info")) {
              contactBtn = l;
              break;
            }
          }
        }
        if (contactBtn) {
          contactBtn.click();

          // Active polling loop for up to 1500ms to allow LinkedIn to mount and render modal contents
          const startTime = Date.now();
          while (Date.now() - startTime < 1500) {
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 1. Direct mailto links in modal or DOM
            const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
            for (const a of mailtoLinks) {
              const raw = a.href.replace(/^mailto:/i, "").split("?")[0].trim();
              if (isUserEmail(raw)) {
                email = raw;
                break;
              }
            }
            if (email) break;

            // 2. Search modal container text
            const poppedModal = document.querySelector(".pv-contact-info") ||
                                document.querySelector("section.ci-email") ||
                                document.querySelector("#pv-contact-info") ||
                                document.querySelector(".artdeco-modal");
            if (poppedModal) {
              const found = findEmailInText(poppedModal.innerText || poppedModal.innerHTML);
              if (found) {
                email = found;
                break;
              }
            }

            // 3. Search document body text while modal is open
            if (document.body) {
              const foundBody = findEmailInText(document.body.innerText || "");
              if (foundBody) {
                email = foundBody;
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("[TagSilo] Contact info modal extraction note:", e);
    }
  }

  // 6D. Fallback search in document text
  if (!email && document.body) {
    try {
      const found = findEmailInText(document.body.innerText || document.body.innerHTML || "");
      if (found) email = found;
    } catch (e) {}
  }

  return {
    name: name || "LinkedIn Profile",
    fullName: name || "LinkedIn Profile",
    title: title || "Profile Member",
    headline: title || "Profile Member",
    jobTitle: title || "Profile Member",
    image: image || "",
    avatarUrl: image || "",
    url: cleanUrl,
    email: email || "Cannot Find"
  };
}
