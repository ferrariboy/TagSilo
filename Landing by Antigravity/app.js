/**
 * TagSilo Pro - Vanguard Interactive Engine
 * Handles Simulator Tag Toggling, Google Sheet Row Insertion (Clean unboxed Pipeline Group),
 * Dynamic ROI Calculator, Pricing Toggle, FAQ, and Lead Magnet.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initExtensionSimulator();
  initRoiCalculator();
  initPricingToggle();
  initFaqAccordion();
  initLeadMagnetModal();
});

/* --------------------------------------------------------------------------
   1. Mobile Menu
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.querySelector('[data-collapse-toggle="navbar-sticky"]');
  const navMenu = document.getElementById('navbar-sticky');
  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    navMenu.classList.toggle('hidden');
  });

  const navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        navMenu.classList.add('hidden');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   2. Live Extension Simulator & Real-time Google Sheet Inserter
   -------------------------------------------------------------------------- */
function initExtensionSimulator() {
  const tags = document.querySelectorAll('.sim-tag');
  const counter = document.getElementById('simTagCounter');
  const syncBtn = document.getElementById('simSyncBtn');
  const spinner = document.getElementById('simBtnSpinner');
  const btnText = document.getElementById('simBtnText');
  const btnIcon = document.getElementById('simBtnIcon');
  const toast = document.getElementById('simSuccessNotification');
  const tableBody = document.getElementById('simSheetTableBody');
  const rowCounterDisplay = document.getElementById('simRowCounter');
  const notesInput = document.getElementById('simNotesInput');
  const pipelineSelect = document.getElementById('simPipelineSelect');

  let currentSyncCount = 14;

  // Update tag active styling & counter
  function updateTagUI(tagEl) {
    const isActive = tagEl.classList.contains('active');
    if (isActive) {
      tagEl.classList.remove('bg-slate-800', 'border-slate-700', 'text-slate-300');
      tagEl.classList.add('bg-brand-lime/20', 'border-brand-lime', 'text-brand-lime', 'shadow-[0_0_12px_rgba(166,255,38,0.25)]');
    } else {
      tagEl.classList.remove('bg-brand-lime/20', 'border-brand-lime', 'text-brand-lime', 'shadow-[0_0_12px_rgba(166,255,38,0.25)]');
      tagEl.classList.add('bg-slate-800', 'border-slate-700', 'text-slate-300');
    }
  }

  // Initialize initial tags state
  tags.forEach(t => {
    updateTagUI(t);
    t.addEventListener('click', (e) => {
      e.preventDefault();
      t.classList.toggle('active');
      updateTagUI(t);

      const activeCount = document.querySelectorAll('.sim-tag.active').length;
      if (counter) {
        counter.textContent = `${activeCount} selected`;
      }
    });
  });

  // Sync button action
  if (syncBtn) {
    syncBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (syncBtn.disabled) return;
      syncBtn.disabled = true;

      // Loading state
      if (spinner) spinner.classList.remove('hidden');
      if (btnIcon) btnIcon.classList.add('hidden');
      if (btnText) btnText.textContent = 'Writing to Google Sheet...';

      setTimeout(() => {
        currentSyncCount++;
        if (rowCounterDisplay) rowCounterDisplay.textContent = currentSyncCount;

        const activeTagElements = document.querySelectorAll('.sim-tag.active');
        const activeTagTexts = Array.from(activeTagElements).map(el => el.getAttribute('data-tag')).join(', ') || 'General Prospect';
        const groupText = pipelineSelect ? pipelineSelect.value : '🔥 Q3 Outbound Blitz';
        const noteText = (notesInput && notesInput.value.trim()) ? notesInput.value.trim() : 'Active prospect context';

        const now = new Date();
        const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        // Insert animated new row at top of spreadsheet (Clean unboxed text for Pipeline Group)
        if (tableBody) {
          const newRow = document.createElement('tr');
          newRow.className = 'border-b border-brand-lime/30 bg-brand-lime/15 text-brand-lime font-bold transition-all duration-700';
          newRow.innerHTML = `
            <td class="py-2.5 px-3 text-slate-300 font-normal font-mono">${timeStr}</td>
            <td class="py-2.5 px-3 font-semibold text-white">Jordan Ellis</td>
            <td class="py-2.5 px-3 text-slate-200">VP Growth @ CloudScale</td>
            <td class="py-2.5 px-3 text-brand-lime font-mono">jordan.e@cloudscale.io</td>
            <td class="py-2.5 px-3 text-slate-200 font-normal font-sans">${groupText}</td>
            <td class="py-2.5 px-3 text-emerald-400 font-mono text-[11px]">${activeTagTexts}</td>
            <td class="py-2.5 px-3 text-slate-300 truncate max-w-[150px] font-normal">${noteText}</td>
          `;

          tableBody.insertBefore(newRow, tableBody.firstChild);

          // Settle row styling after 2.5s
          setTimeout(() => {
            newRow.className = 'border-b border-white/5 opacity-90 transition-all duration-700';
          }, 2500);
        }

        // Reset button
        if (spinner) spinner.classList.add('hidden');
        if (btnIcon) btnIcon.classList.remove('hidden');
        if (btnText) btnText.textContent = 'Synced! Sync Again';
        syncBtn.disabled = false;

        // Show Toast
        if (toast) {
          toast.classList.remove('hidden');
          setTimeout(() => toast.classList.add('hidden'), 3500);
        }
      }, 700);
    });
  }
}

/* --------------------------------------------------------------------------
   3. Dynamic ROI Calculator
   -------------------------------------------------------------------------- */
function initRoiCalculator() {
  const profilesSlider = document.getElementById('calcProfilesSlider');
  const rateSlider = document.getElementById('calcRateSlider');

  const profilesValueDisplay = document.getElementById('calcProfilesValue');
  const rateValueDisplay = document.getElementById('calcRateValue');

  const hoursSavedDisplay = document.getElementById('calcHoursSaved');
  const dollarsSavedDisplay = document.getElementById('calcDollarsSaved');
  const roiPercentDisplay = document.getElementById('calcRoiPercent');

  function calculate() {
    if (!profilesSlider || !rateSlider) return;

    const dailyProfiles = parseInt(profilesSlider.value, 10);
    const hourlyRate = parseInt(rateSlider.value, 10);

    if (profilesValueDisplay) profilesValueDisplay.textContent = `${dailyProfiles} profiles`;
    if (rateValueDisplay) rateValueDisplay.textContent = `$${hourlyRate} / hr`;

    const monthlyProfiles = dailyProfiles * 22;
    const minutesSaved = monthlyProfiles * 3.25;
    const hoursSaved = (minutesSaved / 60);
    const dollarsSaved = hoursSaved * hourlyRate;

    const tagSiloMonthlyCost = 9.99;
    const netSavings = dollarsSaved - tagSiloMonthlyCost;
    const roiPercent = Math.round((netSavings / tagSiloMonthlyCost) * 100);

    if (hoursSavedDisplay) hoursSavedDisplay.textContent = hoursSaved.toFixed(1);
    if (dollarsSavedDisplay) dollarsSavedDisplay.textContent = `$${Math.round(dollarsSaved).toLocaleString()}`;
    if (roiPercentDisplay) roiPercentDisplay.textContent = `${roiPercent.toLocaleString()}%`;
  }

  if (profilesSlider) profilesSlider.addEventListener('input', calculate);
  if (rateSlider) rateSlider.addEventListener('input', calculate);

  calculate();
}

/* --------------------------------------------------------------------------
   4. Pricing Frequency Toggle
   -------------------------------------------------------------------------- */
function initPricingToggle() {
  const monthlyBtn = document.getElementById('billingMonthlyBtn');
  const annualBtn = document.getElementById('billingAnnualBtn');
  const priceDisplay = document.getElementById('priceDisplay');
  const periodDisplay = document.getElementById('pricePeriodDisplay');
  const checkoutBtn = document.getElementById('proCheckoutBtn');

  if (!monthlyBtn || !annualBtn) return;

  monthlyBtn.addEventListener('click', () => {
    monthlyBtn.className = 'px-5 py-2 rounded-full text-xs font-bold text-brand-oled bg-brand-lime transition-all';
    annualBtn.className = 'px-5 py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5';
    if (priceDisplay) priceDisplay.textContent = '$9.99';
    if (periodDisplay) periodDisplay.textContent = '/ month';
    if (checkoutBtn) checkoutBtn.href = 'https://creem.io/checkout/tagsilo-pro';
  });

  annualBtn.addEventListener('click', () => {
    annualBtn.className = 'px-5 py-2 rounded-full text-xs font-bold text-brand-oled bg-brand-lime transition-all flex items-center gap-1.5';
    monthlyBtn.className = 'px-5 py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-all';
    if (priceDisplay) priceDisplay.textContent = '$6.58';
    if (periodDisplay) periodDisplay.textContent = '/ mo ($79 billed yearly)';
    if (checkoutBtn) checkoutBtn.href = 'https://creem.io/checkout/tagsilo-pro-annual';
  });
}

/* --------------------------------------------------------------------------
   5. FAQ Accordion Flush Fallback
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
  const headings = document.querySelectorAll('#accordion-flush h2 button');
  headings.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-accordion-target');
      const targetBody = document.querySelector(targetId);
      const icon = btn.querySelector('svg');
      if (!targetBody) return;

      const isHidden = targetBody.classList.contains('hidden');
      document.querySelectorAll('#accordion-flush [id^="accordion-flush-body"]').forEach(b => b.classList.add('hidden'));
      document.querySelectorAll('#accordion-flush svg').forEach(i => i.classList.remove('rotate-180'));

      if (isHidden) {
        targetBody.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   6. Exit-Intent & Mobile Lead Magnet
   -------------------------------------------------------------------------- */
function initLeadMagnetModal() {
  const modal = document.getElementById('leadMagnetModal');
  const openBtn = document.getElementById('openLeadMagnetBtn');
  const closeBtn = document.getElementById('closeLeadMagnetBtn');
  const form = document.getElementById('leadMagnetForm');
  const successMsg = document.getElementById('leadMagnetSuccess');

  if (!modal) return;

  function openModal() { modal.classList.remove('hidden'); }
  function closeModal() { modal.classList.add('hidden'); }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  let triggered = false;
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0 && !triggered && !localStorage.getItem('tagsilo_lead_captured')) {
      triggered = true;
      openModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      localStorage.setItem('tagsilo_lead_captured', 'true');
      if (successMsg) successMsg.classList.remove('hidden');
      form.style.display = 'none';
      setTimeout(closeModal, 2500);
    });
  }
}
