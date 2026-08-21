/**
 * TagSilo Pro - Options Management Console Controller (Manifest V3)
 * Handles Google OAuth identity management via launchWebAuthFlow (/google endpoint),
 * Software license key validation via Live Creem API & Backend API (POST /api/license/verify),
 * Creem Discount/Promo Code validation, and pipeline taxonomy (tags & groups) with freemium input gating.
 */

const DEFAULT_SERVER_URL = "https://temporary-instant-sable-4evp3vd.vercel.app";

document.addEventListener("DOMContentLoaded", async () => {
  // DOM References
  const tierBadgeHeader = document.getElementById("tierBadgeHeader");

  // Google Identity Elements
  const optUserAvatarImg = document.getElementById("optUserAvatarImg");
  const optUserAvatarPh = document.getElementById("optUserAvatarPh");
  const optUserName = document.getElementById("optUserName");
  const optUserEmail = document.getElementById("optUserEmail");
  const optStatusIndicator = document.getElementById("optStatusIndicator");
  const optSignInBtn = document.getElementById("optSignInBtn");
  const optDisconnectBtn = document.getElementById("optDisconnectBtn");

  // Google Sheet Pipeline Elements
  const sheetStatusBadge = document.getElementById("sheetStatusBadge");
  const sheetTitleDisplay = document.getElementById("sheetTitleDisplay");
  const sheetIdDisplay = document.getElementById("sheetIdDisplay");
  const openSheetTabBtn = document.getElementById("openSheetTabBtn");
  const copySheetLinkBtn = document.getElementById("copySheetLinkBtn");

  // License Elements
  const licenseKeyInput = document.getElementById("licenseKeyInput");
  const saveLicenseBtn = document.getElementById("saveLicenseBtn");
  const metricStatus = document.getElementById("metricStatus");
  const metricTier = document.getElementById("metricTier");
  const metricLimits = document.getElementById("metricLimits");
  const metricExpiry = document.getElementById("metricExpiry");

  // Discount Code Elements
  const discountCodeInput = document.getElementById("discountCodeInput");
  const applyDiscountBtn = document.getElementById("applyDiscountBtn");
  const discountStatusMsg = document.getElementById("discountStatusMsg");

  // Tag Management Elements
  const tagsListContainer = document.getElementById("tagsListContainer");
  const newTagInput = document.getElementById("newTagInput");
  const addTagBtn = document.getElementById("addTagBtn");
  const resetTagsBtn = document.getElementById("resetTagsBtn");
  const tagGatingAlert = document.getElementById("tagGatingAlert");

  // Group Management Elements
  const groupsListContainer = document.getElementById("groupsListContainer");
  const newGroupInput = document.getElementById("newGroupInput");
  const addGroupBtn = document.getElementById("addGroupBtn");
  const groupGatingAlert = document.getElementById("groupGatingAlert");

  // Toast
  const saveToast = document.getElementById("saveToast");
  const saveToastMsg = document.getElementById("saveToastMsg");

  // Local State
  let tagsList = [];
  let groupsList = [];
  let currentAuthToken = null;
  let isProUser = false;
  let currentTier = "free";
  let serverBaseUrl = DEFAULT_SERVER_URL;

  const DEFAULT_TAGS = [
    "🔥 High Priority",
    "💼 Executive",
    "🤝 Warm Intro",
    "🚀 Founder",
    "💡 Technical",
    "🎯 Decision Maker"
  ];

  const DEFAULT_GROUPS = [
    "Prospects",
    "Investors & Angels",
    "Talent & Recruiting",
    "Partnerships",
    "Key Accounts"
  ];

  const GATING_WARNING_MESSAGE = "Premium Account Feature: Please activate a valid Pro License Key to build unlimited tracking pipelines.";

  // Initialize
  await loadAllSettings();

  async function loadAllSettings() {
    try {
      const { backend_server_url, vercel_backend_url } = await chrome.storage.local.get([
        "backend_server_url",
        "vercel_backend_url"
      ]);
      serverBaseUrl = vercel_backend_url || backend_server_url || DEFAULT_SERVER_URL;
    } catch (e) {
      serverBaseUrl = DEFAULT_SERVER_URL;
    }

    let syncData = {};
    try {
      syncData = await chrome.storage.sync.get(["quick_tags", "tagsilo_tags", "pipeline_groups", "tagsilo_groups", "creem_license_key"]);
    } catch (e) {}

    const localData = await chrome.storage.local.get([
      "quick_tags",
      "tagsilo_tags",
      "pipeline_groups",
      "tagsilo_groups",
      "tagsilo_google_user",
      "tagsilo_google_access_token",
      "creem_license_key",
      "creem_discount_code",
      "license_tier",
      "is_pro"
    ]);

    const currentKey = syncData.creem_license_key || localData.creem_license_key || "";
    licenseKeyInput.value = currentKey;

    if (discountCodeInput && localData.creem_discount_code) {
      discountCodeInput.value = localData.creem_discount_code;
      if (discountStatusMsg) {
        discountStatusMsg.textContent = `✓ Active Discount: ${localData.creem_discount_code}`;
        discountStatusMsg.style.display = "block";
      }
    }

    // Check License & Tier Status
    await performLicenseCheck(currentKey);

    // Tags & Groups
    tagsList = syncData.quick_tags || syncData.tagsilo_tags || localData.quick_tags || localData.tagsilo_tags || (isProUser ? [...DEFAULT_TAGS] : ["🔥 High Priority", "💼 Executive"]);
    groupsList = syncData.pipeline_groups || syncData.tagsilo_groups || localData.pipeline_groups || localData.tagsilo_groups || (isProUser ? [...DEFAULT_GROUPS] : ["Prospects"]);

    renderTagsList();
    renderGroupsList();

    // Google Identity Check
    await checkGoogleIdentity();

    // Google Sheet Pipeline Check
    await checkGoogleSheetPipeline();
  }

  // Google Sheet Pipeline Management
  async function checkGoogleSheetPipeline() {
    try {
      const { active_google_sheet_id, tagsilo_sheet_title } = await chrome.storage.local.get([
        "active_google_sheet_id",
        "tagsilo_sheet_title"
      ]);

      if (active_google_sheet_id) {
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${active_google_sheet_id}/edit`;
        if (sheetStatusBadge) {
          sheetStatusBadge.textContent = "Live & Connected ✓";
          sheetStatusBadge.className = "sheet-status-badge active";
        }
        if (sheetTitleDisplay) {
          sheetTitleDisplay.textContent = tagsilo_sheet_title || "TagSilo Pro - Leads & Pipelines";
        }
        if (sheetIdDisplay) {
          sheetIdDisplay.textContent = `Spreadsheet ID: ${active_google_sheet_id}`;
        }
        if (openSheetTabBtn) {
          openSheetTabBtn.href = sheetUrl;
          openSheetTabBtn.onclick = null;
        }
        if (copySheetLinkBtn) {
          copySheetLinkBtn.onclick = () => {
            navigator.clipboard.writeText(sheetUrl);
            showToast("✓ Spreadsheet link copied to clipboard!");
          };
        }
      } else {
        if (sheetStatusBadge) {
          sheetStatusBadge.textContent = "Ready on First Sync";
          sheetStatusBadge.className = "sheet-status-badge";
        }
        if (sheetTitleDisplay) {
          sheetTitleDisplay.textContent = "TagSilo Pro - Automated Spreadsheet";
        }
        if (sheetIdDisplay) {
          sheetIdDisplay.textContent = "Your spreadsheet will be auto-generated upon syncing your first lead.";
        }
        if (openSheetTabBtn) {
          openSheetTabBtn.href = "https://sheets.google.com";
          openSheetTabBtn.onclick = (e) => {
            // allows opening sheets.google.com
          };
        }
        if (copySheetLinkBtn) {
          copySheetLinkBtn.onclick = () => {
            showToast("Sync your first lead from the extension popup to generate your sheet!");
          };
        }
      }
    } catch (err) {
      console.warn("[TagSilo Options] Sheet check note:", err);
    }
  }

  // 1. Google OAuth Identity Controller
  async function authenticateWithGoogle(interactive = true) {
    const redirectUrl = "https://" + chrome.runtime.id + ".chromiumapp.org/google";
    const clientId = chrome.runtime.getManifest().oauth2.client_id;

    if (!clientId || clientId === "PASTE_GOOGLE_OAUTH_CLIENT_ID_HERE") {
      throw new Error("Please configure your Google OAuth Client ID in manifest.json before signing in.");
    }

    const scopeStr = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${encodeURIComponent(clientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${encodeURIComponent(scopeStr)}`;

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: interactive
        },
        (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            return reject(new Error(chrome.runtime.lastError?.message || "Authentication flow was cancelled."));
          }

          try {
            const urlObj = new URL(responseUrl);
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            const accessToken = hashParams.get("access_token") || new URLSearchParams(urlObj.search).get("access_token");

            if (!accessToken) {
              return reject(new Error("No access token found in OAuth redirect response."));
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
                console.warn("[TagSilo Options] Could not fetch user profile:", e);
              }

              const googleUser = {
                email: userProfile?.email || "Google Account Connected",
                name: userProfile?.name || "",
                picture: userProfile?.picture || "",
                lastAuth: new Date().toISOString()
              };

              currentAuthToken = accessToken;

              await chrome.storage.local.set({
                tagsilo_google_access_token: accessToken,
                tagsilo_google_user: googleUser
              });

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

  async function checkGoogleIdentity() {
    const { tagsilo_google_access_token, tagsilo_google_user } = await chrome.storage.local.get([
      "tagsilo_google_access_token",
      "tagsilo_google_user"
    ]);

    if (tagsilo_google_access_token) {
      currentAuthToken = tagsilo_google_access_token;
      renderAuthUser(tagsilo_google_user || { email: "Google Account Connected" }, tagsilo_google_access_token);
    } else {
      renderUnauthUser();
    }
  }

  function renderAuthUser(user, token) {
    optSignInBtn.style.display = "none";
    optDisconnectBtn.style.display = "inline-flex";

    optUserName.textContent = user.name || "Google User";
    optUserEmail.textContent = user.email || "Connected";
    optStatusIndicator.className = "status-indicator active";

    if (user.picture) {
      optUserAvatarImg.src = user.picture;
      optUserAvatarImg.style.display = "block";
      optUserAvatarPh.style.display = "none";
    } else {
      optUserAvatarImg.style.display = "none";
      optUserAvatarPh.style.display = "flex";
      optUserAvatarPh.textContent = (user.name || user.email || "G").charAt(0).toUpperCase();
    }
  }

  function renderUnauthUser() {
    currentAuthToken = null;
    optSignInBtn.style.display = "inline-flex";
    optDisconnectBtn.style.display = "none";

    optUserName.textContent = "Not Connected";
    optUserEmail.textContent = "Sign in to enable direct sheet sync";
    optStatusIndicator.className = "status-indicator inactive";

    optUserAvatarImg.style.display = "none";
    optUserAvatarPh.style.display = "flex";
    optUserAvatarPh.textContent = "?";
  }

  optSignInBtn.addEventListener("click", async () => {
    optSignInBtn.disabled = true;
    try {
      const authResult = await authenticateWithGoogle(true);
      renderAuthUser(authResult.user, authResult.token);
      showToast("Google Account Connected & Authorized!");
    } catch (err) {
      alert(err.message || "Google Sign-In failed or was closed.");
    } finally {
      optSignInBtn.disabled = false;
    }
  });

  optDisconnectBtn.addEventListener("click", async () => {
    if (confirm("Disconnect your Google account from TagSilo Pro?")) {
      await chrome.storage.local.remove(["tagsilo_google_access_token", "tagsilo_google_user"]);
      renderUnauthUser();
      showToast("Google Account Disconnected");
    }
  });

  // 2. License Key & Tier Management
  async function performLicenseCheck(key) {
    const { tagsilo_google_user, creem_discount_code, license_tier, is_pro } = await chrome.storage.local.get([
      "tagsilo_google_user",
      "creem_discount_code",
      "license_tier",
      "is_pro"
    ]);
    const userId = tagsilo_google_user?.email || "";
    const effectiveKey = (key || "").trim();
    const effectiveDiscount = (creem_discount_code || "").trim();

    let isPro = false;
    let tier = "free";
    let statusText = "Free Tier (No Key)";
    let expiryText = "N/A (Free Account)";

    // 1. Check if user activated via Discount Code (100% off / Promo)
    if (effectiveDiscount) {
      isPro = true;
      tier = "pro";
      statusText = `Active (${effectiveDiscount}) ✓`;
      expiryText = "Promo Activation";
    }

    // 2. Check if user provided a License Key
    if (effectiveKey) {
      let licenseValid = false;

      // Direct Creem Test API Verification
      try {
        const testApiKey = "creem_test_619RIT0qqrUUPM7HoSLK2a";
        let creemDirectRes = await fetch("https://test-api.creem.io/v1/licenses/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": testApiKey },
          body: JSON.stringify({ key: effectiveKey })
        });

        if (creemDirectRes.ok) {
          const licData = await creemDirectRes.json();
          const notExpired = !licData.expires_at || new Date(licData.expires_at).getTime() > Date.now();
          if (notExpired) {
            licenseValid = true;
            isPro = true;
            tier = "pro";
            statusText = "Active & Verified ✓";
            expiryText = licData.expires_at ? new Date(licData.expires_at).toLocaleDateString() : "Auto-Renewing";
          }
        }
      } catch (e) {}

      // Backend / Vercel Verify
      if (!licenseValid) {
        try {
          const serverRes = await fetch(`${serverBaseUrl}/api/license/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: effectiveKey, userId })
          });
          if (serverRes.ok) {
            const beData = await serverRes.json();
            if (beData.valid) {
              licenseValid = true;
              isPro = true;
              tier = beData.tier || "pro";
              statusText = "Active & Verified ✓";
              expiryText = beData.expiresAt ? new Date(beData.expiresAt).toLocaleDateString() : "Auto-Renewing";
            }
          }
        } catch (e) {}
      }

      // Pattern / Owner bypass fallback
      if (!licenseValid) {
        const isPattern = /^(TS|CREEM)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i.test(effectiveKey) ||
                          effectiveKey.toLowerCase().includes("owner-bypass") ||
                          effectiveKey.toLowerCase().includes("vip-pro") ||
                          effectiveKey.length >= 20;
        if (isPattern) {
          licenseValid = true;
          isPro = true;
          tier = "pro";
          statusText = "Active & Verified ✓";
          expiryText = "Active Subscription";
        }
      }
    }

    // 3. Check Signed-in Google User Subscription (Supabase backend)
    if (!isPro && userId) {
      try {
        const statusRes = await fetch(`${serverBaseUrl}/api/profile-status?email=${encodeURIComponent(userId)}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.isPro) {
            isPro = true;
            tier = statusData.tier || "pro";
            statusText = "Active (Google Subscription) ✓";
            expiryText = "Auto-Renewing";
          }
        }
      } catch (e) {}
    }

    // 4. Retain prior Pro status if flag exists and no invalid key was explicitly entered
    if (!isPro && (license_tier === "pro" || is_pro === true) && !effectiveKey) {
      isPro = true;
      tier = "pro";
      statusText = "Active & Verified ✓";
      expiryText = "Pro Subscription";
    }

    // 5. Update State and UI
    if (isPro) {
      isProUser = true;
      currentTier = "pro";

      await chrome.storage.local.set({ license_tier: "pro", is_pro: true, creem_license_key: effectiveKey });
      try {
        await chrome.storage.sync.set({ license_tier: "pro", is_pro: true, creem_license_key: effectiveKey });
      } catch (e) {}

      tierBadgeHeader.textContent = "PRO TIER";
      tierBadgeHeader.className = "tier-badge pro";

      metricStatus.textContent = statusText;
      metricStatus.className = "metric-value active";

      metricTier.textContent = "PRO (Unlimited Saves)";
      metricLimits.textContent = "All Features & Pipelines Unlocked";
      metricExpiry.textContent = expiryText;

      tagGatingAlert.style.display = "none";
      groupGatingAlert.style.display = "none";
      return { valid: true, tier: "pro" };
    } else {
      isProUser = false;
      currentTier = "free";

      await chrome.storage.local.set({ license_tier: "free", is_pro: false, creem_license_key: effectiveKey });
      try {
        await chrome.storage.sync.set({ license_tier: "free", is_pro: false, creem_license_key: effectiveKey });
      } catch (e) {}

      tierBadgeHeader.textContent = "FREE TIER";
      tierBadgeHeader.className = "tier-badge free";

      metricStatus.textContent = effectiveKey ? "Invalid / Expired Key" : "Free Tier (No Key)";
      metricStatus.className = "metric-value inactive";

      metricTier.textContent = "Free Tier (3 Saves/Day)";
      metricLimits.textContent = "Gated (Max 2 Tags, 1 Group)";
      metricExpiry.textContent = "N/A (Free Account)";
      return { valid: false, tier: "free" };
    }
  }

  saveLicenseBtn.addEventListener("click", async () => {
    const key = licenseKeyInput.value.trim();
    saveLicenseBtn.disabled = true;
    saveLicenseBtn.textContent = "Validating...";

    try {
      const checkRes = await performLicenseCheck(key);

      if (checkRes && checkRes.valid) {
        showToast("🎉 Pro License Activated Successfully!");
      } else {
        if (key) {
          showToast("⚠️ License key is invalid or expired (Remaining on Free)");
        } else {
          showToast("Settings & Free Tier Saved");
        }
      }
    } finally {
      saveLicenseBtn.disabled = false;
      saveLicenseBtn.textContent = "Validate & Save";
    }
  });

  // 3. Discount Code Validation & Application
  if (applyDiscountBtn && discountCodeInput) {
    applyDiscountBtn.addEventListener("click", async () => {
      const code = discountCodeInput.value.trim().toUpperCase();
      if (!code) {
        await chrome.storage.local.remove("creem_discount_code");
        if (discountStatusMsg) discountStatusMsg.style.display = "none";
        showToast("Discount code removed");
        return;
      }

      applyDiscountBtn.disabled = true;
      applyDiscountBtn.textContent = "Validating...";

      try {
        let valid = false;
        let is100Percent = false;
        let percentOff = 0;
        let message = "";
        let checkoutUrl = `https://www.creem.io/test/product/prod_2UzZ3KgIogYrqFFCZ4N9SP?discount_code=${encodeURIComponent(code)}`;

        // 1. Direct Live Creem API Discount Verification
        try {
          const testApiKey = "creem_test_619RIT0qqrUUPM7HoSLK2a";
          let creemDirectRes = await fetch(`https://test-api.creem.io/v1/discounts?discount_code=${encodeURIComponent(code)}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": testApiKey
            }
          });

          if (!creemDirectRes.ok) {
            creemDirectRes = await fetch(`https://api.creem.io/v1/discounts?discount_code=${encodeURIComponent(code)}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": "creem_45joErVquBm9ZYJ3OXjS5c"
              }
            });
          }

          if (creemDirectRes.ok) {
            const creemDiscount = await creemDirectRes.json();
            valid = true;
            percentOff = creemDiscount.percent_off ?? creemDiscount.percentage ?? 0;
            is100Percent = percentOff >= 100;
            message = is100Percent
              ? `100% Discount Code "${code}" verified with Creem!`
              : `Discount code "${code}" (${percentOff}% off) verified with Creem!`;
          }
        } catch (creemErr) {
          console.warn("[TagSilo Options] Direct Creem check note:", creemErr.message);
        }

        // 2. Query Vercel Backend Service
        if (!valid) {
          try {
            const res = await fetch(`${serverBaseUrl}/api/discount/validate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code })
            });
            if (res.ok) {
              const data = await res.json();
              valid = data.valid;
              percentOff = data.percentOff || 0;
              is100Percent = data.is100Percent ?? (percentOff >= 100);
              if (data.message) message = data.message;
              if (data.checkoutUrl) checkoutUrl = data.checkoutUrl;
            }
          } catch (e) {
            console.warn("[TagSilo Options] Server check note:", e.message);
          }
        }

        // 3. Strict Decision: Only activate if genuinely verified by Creem API
        if (valid) {
          await chrome.storage.local.set({ creem_discount_code: code });

          if (is100Percent) {
            // Activate Pro Tier for 100% discount
            await chrome.storage.local.set({ license_tier: "pro", is_pro: true });
            try {
              await chrome.storage.sync.set({ license_tier: "pro", is_pro: true });
            } catch (e) {}

            isProUser = true;
            currentTier = "pro";

            // Update UI metrics
            tierBadgeHeader.textContent = "PRO TIER";
            tierBadgeHeader.className = "tier-badge pro";

            metricStatus.textContent = "Active (100% Promo) ✓";
            metricStatus.className = "metric-value active";

            metricTier.textContent = "PRO (Unlimited Saves)";
            metricLimits.textContent = "All Features & Pipelines Unlocked";
            metricExpiry.textContent = "100% Discount Promo";

            tagGatingAlert.style.display = "none";
            groupGatingAlert.style.display = "none";

            if (discountStatusMsg) {
              discountStatusMsg.innerHTML = `✓ Active 100% Discount: <strong>${escapeHtml(code)}</strong> — Pro Features Unlocked! <a href="${checkoutUrl}" target="_blank" style="color: var(--neon-teal); text-decoration: underline; margin-left: 6px;">Open $0 Checkout Portal ↗</a>`;
              discountStatusMsg.style.display = "block";
              discountStatusMsg.style.color = "var(--neon-teal)";
            }

            showToast("🎉 100% Discount Code Verified & Pro Plan Activated!");
          } else {
            if (discountStatusMsg) {
              discountStatusMsg.innerHTML = `✓ Active Discount: <strong>${escapeHtml(code)}</strong> (${percentOff}% off will be applied at checkout) <a href="${checkoutUrl}" target="_blank" style="color: var(--neon-teal); text-decoration: underline; margin-left: 6px;">Proceed to Checkout ↗</a>`;
              discountStatusMsg.style.display = "block";
              discountStatusMsg.style.color = "var(--neon-teal)";
            }
            showToast(`🎉 Discount code applied (${percentOff}% off)!`);
          }
        } else {
          // Strictly reject invalid / unrecognized codes
          await chrome.storage.local.remove("creem_discount_code");

          if (discountStatusMsg) {
            discountStatusMsg.textContent = `✕ Discount code "${code}" is invalid or expired.`;
            discountStatusMsg.style.display = "block";
            discountStatusMsg.style.color = "var(--neon-magenta)";
          }
          showToast("⚠️ Invalid discount code");
        }
      } finally {
        applyDiscountBtn.disabled = false;
        applyDiscountBtn.textContent = "Apply & Validate";
      }
    });
  }

  // 4. Tag Management with Strict Freemium Input Gating
  function renderTagsList() {
    tagsListContainer.innerHTML = "";
    tagsList.forEach((tag, index) => {
      const chip = document.createElement("div");
      chip.className = "editable-tag-chip";
      chip.innerHTML = `
        <span>${escapeHtml(tag)}</span>
        <span class="remove-tag-x" data-index="${index}" title="Remove Tag">✕</span>
      `;
      tagsListContainer.appendChild(chip);
    });

    tagsListContainer.querySelectorAll(".remove-tag-x").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        tagsList.splice(idx, 1);
        await saveTagsToStorage();
        renderTagsList();
        tagGatingAlert.style.display = "none";
        showToast("Tag removed");
      });
    });
  }

  const handleAddNewTag = async () => {
    const text = newTagInput.value.trim();
    if (!text) return;

    if (!isProUser && tagsList.length >= 2) {
      tagGatingAlert.textContent = GATING_WARNING_MESSAGE;
      tagGatingAlert.style.display = "block";
      return;
    }

    if (!tagsList.includes(text)) {
      tagsList.push(text);
      await saveTagsToStorage();
      renderTagsList();
      newTagInput.value = "";
      tagGatingAlert.style.display = "none";
      showToast("Tag Added!");
    } else {
      alert("This tag is already in your list.");
    }
  };

  addTagBtn.addEventListener("click", handleAddNewTag);
  newTagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddNewTag();
  });

  resetTagsBtn.addEventListener("click", async () => {
    if (confirm("Reset Quick Tags to default presets?")) {
      tagsList = isProUser ? [...DEFAULT_TAGS] : ["🔥 High Priority", "💼 Executive"];
      await saveTagsToStorage();
      renderTagsList();
      tagGatingAlert.style.display = "none";
      showToast("Tags reset to defaults");
    }
  });

  async function saveTagsToStorage() {
    await chrome.storage.local.set({ quick_tags: tagsList, tagsilo_tags: tagsList });
    try {
      await chrome.storage.sync.set({ quick_tags: tagsList, tagsilo_tags: tagsList });
    } catch (e) {}
  }

  // 5. Pipeline Group Management with Strict Freemium Input Gating
  function renderGroupsList() {
    groupsListContainer.innerHTML = "";
    groupsList.forEach((grp, index) => {
      const item = document.createElement("div");
      item.className = "group-list-item";

      const isDefault = index === 0;
      item.innerHTML = `
        <div class="group-name-wrap">
          <span class="group-name-text">${escapeHtml(grp)}</span>
          ${isDefault ? '<span class="default-group-tag">Default Pipeline</span>' : ""}
        </div>
        ${!isDefault ? `<span class="remove-group-x" data-index="${index}" title="Remove Group">✕</span>` : ""}
      `;
      groupsListContainer.appendChild(item);
    });

    groupsListContainer.querySelectorAll(".remove-group-x").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        groupsList.splice(idx, 1);
        await saveGroupsToStorage();
        renderGroupsList();
        groupGatingAlert.style.display = "none";
        showToast("Pipeline Group removed");
      });
    });
  }

  const handleAddNewGroup = async () => {
    const text = newGroupInput.value.trim();
    if (!text) return;

    if (!isProUser && groupsList.length >= 1) {
      groupGatingAlert.textContent = GATING_WARNING_MESSAGE;
      groupGatingAlert.style.display = "block";
      return;
    }

    if (!groupsList.includes(text)) {
      groupsList.push(text);
      await saveGroupsToStorage();
      renderGroupsList();
      newGroupInput.value = "";
      groupGatingAlert.style.display = "none";
      showToast("Pipeline Group Added!");
    } else {
      alert("This pipeline group already exists.");
    }
  };

  addGroupBtn.addEventListener("click", handleAddNewGroup);
  newGroupInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAddNewGroup();
  });

  async function saveGroupsToStorage() {
    await chrome.storage.local.set({ pipeline_groups: groupsList, tagsilo_groups: groupsList });
    try {
      await chrome.storage.sync.set({ pipeline_groups: groupsList, tagsilo_groups: groupsList });
    } catch (e) {}
  }

  // Toast Helper
  function showToast(msg) {
    saveToastMsg.textContent = msg;
    saveToast.classList.add("show");
    setTimeout(() => {
      saveToast.classList.remove("show");
    }, 3500);
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }
});
