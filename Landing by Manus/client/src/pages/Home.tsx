/**
 * TagSilo visual system: direct-response editorial + systems-dashboard minimalism.
 * Deep ink, warm paper, alert red, and TagSilo lime create a practical conversion narrative.
 */
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

const assets = {
  logo: "/manus-storage/tagsilo-logo-lockup_2b2fa597.jpg",
  workflow: "/manus-storage/tagsilo-capture-workflow_418d4a35.jpg",
  heroField: "/manus-storage/tagsilo-hero-field_bee6544c.png",
  workflowVisual: "/manus-storage/tagsilo-workflow-visual_d5174c6f.png",
  extensionPanel: "/manus-storage/tagsilo-extension-product_ba57d612.png",
  mark: "/manus-storage/tagsilo-generated-mark_a0147131.png",
};

const faqItems = [
  {
    question: "What does TagSilo capture from a LinkedIn profile?",
    answer:
      "TagSilo is built to capture the useful prospecting context: name, headline, profile URL, available contact information, your notes, pipeline group, and tags—then keep that record in a structured sheet.",
  },
  {
    question: "Is TagSilo a replacement for a full CRM?",
    answer:
      "No. It is the organization layer for the LinkedIn workflow you already use. TagSilo gives you a clean, practical pipeline without forcing you into a heavyweight system before the lead is ready.",
  },
  {
    question: "How does the Google Sheets sync work?",
    answer:
      "You connect your Google account, choose your working sheet, and use the sync action to send a qualified prospect into a structured lead record. Duplicate detection helps prevent repeated saves.",
  },
  {
    question: "Who is TagSilo designed for?",
    answer:
      "TagSilo is designed for B2B outbound sales professionals, agency owners, recruiters, founders, and growth marketers who build and manage prospect lists from LinkedIn.",
  },
  {
    question: "Can I start without paying?",
    answer:
      "Yes. TagSilo Free includes three profile syncs each day and a default pipeline group. Upgrade when you need unlimited daily saves, tag flexibility, and more pipeline capacity.",
  },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="section-eyebrow">{children}</p>;
}

function PrimaryCta({ className = "", label = "Get TagSilo Free" }: { className?: string; label?: string }) {
  return (
    <a className={`cta cta-primary ${className}`} href="#pricing">
      <span>{label}</span>
      <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
    </a>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 34);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  return (
    <main className="landing-shell">
      <div className="attention-bar">
        <div className="shell-width attention-inner">
          <span className="attention-icon">△</span>
          <span>
            <strong>ATTENTION:</strong> LinkedIn prospectors spending more time entering data than starting conversations.
          </span>
        </div>
      </div>

      <header className={`site-header ${scrolled ? "header-scrolled" : ""}`}>
        <div className="shell-width header-inner">
          <a href="#top" className="brand-link" aria-label="TagSilo home">
            <img className="brand-lockup" src={assets.logo} alt="TagSilo" />
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#features">What it captures</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="header-actions">
            <a className="header-cta" href="#pricing">Get TagSilo <ArrowRight size={15} /></a>
            <button
              className="menu-button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-nav shell-width" aria-label="Mobile navigation">
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>What it captures</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          </nav>
        )}
      </header>

      <section id="top" className="hero-section">
        <img className="hero-field" src={assets.heroField} alt="" aria-hidden="true" />
        <div className="hero-vignette" />
        <div className="shell-width hero-grid">
          <div className="hero-copy reveal-up">
            <SectionEyebrow>01 / ZERO-SETUP LINKEDIN CRM</SectionEyebrow>
            <h1>Turn LinkedIn browsing into a <em>clean lead system.</em></h1>
            <p className="hero-subcopy">
              Capture prospect context, organize the intent, and sync your pipeline to Google Sheets—without leaving the profile.
            </p>
            <div className="hero-cta-row">
              <PrimaryCta />
              <a href="#how-it-works" className="text-cta">See the workflow <ArrowDownRight size={18} /></a>
            </div>
            <div className="hero-note-row" aria-label="TagSilo benefits">
              <span><CircleCheck size={14} /> 3 captures/day on Free</span>
              <span><CircleCheck size={14} /> Google Sheets sync</span>
              <span><CircleCheck size={14} /> No context switching</span>
            </div>
          </div>
          <div className="hero-product reveal-up-delay">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-card-frame">
              <div className="hero-card-label"><span className="live-dot" /> CAPTURE MODE / ACTIVE</div>
              <img src={assets.extensionPanel} alt="TagSilo extension interface concept" />
              <div className="hero-card-corner"><img src={assets.mark} alt="" /></div>
            </div>
          </div>
        </div>
        <div className="shell-width hero-bottom-grid">
          <div><span>01.</span> Capture the profile context while you prospect.</div>
          <div><span>02.</span> Tag signal, intent, and the next follow-up.</div>
          <div><span>03.</span> Sync the lead to the sheet your workflow already uses.</div>
        </div>
      </section>

      <section className="noise-section">
        <div className="paper-shell">
          <div className="narrow-intro reveal-on-scroll">
            <SectionEyebrow>02 / THE PROBLEM</SectionEyebrow>
            <h2>LinkedIn is built for <span>scrolling.</span> Your pipeline needs a system.</h2>
            <p>
              Tabs, inbox threads, copied names, half-finished sheets. It works just long enough to become a problem. The more prospects you find, the easier it is for good conversations to get buried.
            </p>
          </div>
          <div className="clutter-stage" aria-label="A sequence of cluttered LinkedIn prospect records">
            <div className="noise-card n-card-a"><span className="tiny-avatar" /><div><b>Jordan Ellis</b><small>VP Growth · Northwind Co.</small></div><p>“Need to remember his Q3 launch…”</p></div>
            <div className="noise-card n-card-b"><span className="tiny-avatar orange" /><div><b>Priya Shah</b><small>Founder · Rivet Labs</small></div><p>“Met at webinar. Follow up Friday.”</p></div>
            <div className="noise-card n-card-c"><span className="tiny-avatar navy" /><div><b>Alex Warren</b><small>Recruiting Lead · Halo</small></div><p>“Warm intro via Devin.”</p></div>
            <div className="noise-card n-card-d"><span className="tiny-avatar pink" /><div><b>Daniel Li</b><small>Head of Sales · Sila</small></div><p>“High intent / pricing page visit”</p></div>
            <div className="noise-card n-card-e"><span className="tiny-avatar green" /><div><b>Sam Rose</b><small>Agency Owner · Tenth</small></div><p>“Replied on post / awaiting reply.”</p></div>
          </div>
          <div className="signal-stat-grid">
            <div><b>Too many tabs.</b><span>Prospecting context disappears across profiles, messages, notes, and browser windows.</span></div>
            <div><b>Too much copying.</b><span>Manual entry turns a useful habit into an administrative chore.</span></div>
            <div><b>Too many gaps.</b><span>When the next action has no place to live, promising contacts go cold.</span></div>
          </div>
          <div className="bridge-statement">
            <span className="mini-rule" />
            <h3>LinkedIn wasn’t designed to be a CRM.<br />TagSilo adds the missing layer.</h3>
            <p>Organize the contacts already in your workflow. Keep the research, context, and action in one dependable place.</p>
            <div className="tag-line"><span><Check size={13} /> Capture</span><span><Check size={13} /> Qualify</span><span><Check size={13} /> Sync</span><span><Check size={13} /> Follow through</span></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="transfer-section">
        <div className="shell-width transfer-layout">
          <div className="transfer-copy">
            <SectionEyebrow>03 / THE CAPTURE ENGINE</SectionEyebrow>
            <h2>From profile<br />to <em>pipeline</em><br />in one flow.</h2>
            <p>
              TagSilo is designed for the small moment that determines whether research becomes progress: the moment you recognize a relevant person and want to preserve the context.
            </p>
            <div className="process-list">
              <div><span>01</span><p><b>Open the prospect profile.</b> Work on LinkedIn as normal. No new dashboard to learn.</p></div>
              <div><span>02</span><p><b>Apply context in seconds.</b> Add a pipeline group, intent tags, and notes while the information is fresh.</p></div>
              <div><span>03</span><p><b>Sync the structured record.</b> Send a clean, usable prospect row to your Google Sheets database.</p></div>
            </div>
          </div>
          <div className="transfer-art">
            <div className="art-index">SYSTEM STATE / 01</div>
            <img src={assets.workflowVisual} alt="A profile record moving into a TagSilo capture panel" />
            <div className="art-caption"><span className="live-dot" /> LIVE DATA PATH · LinkedIn profile → TagSilo → Google Sheet</div>
          </div>
        </div>
      </section>

      <section id="features" className="capture-section">
        <div className="paper-shell capture-top">
          <div className="feature-heading">
            <SectionEyebrow>04 / WHAT GETS CAPTURED</SectionEyebrow>
            <h2>Everything you need to make the <span>next move</span> smarter.</h2>
            <p>TagSilo turns a fleeting profile visit into a practical lead record that keeps your next conversation grounded in context.</p>
          </div>
          <div className="capture-board">
            <div className="profile-snapshot">
              <div className="profile-topline"><span className="brand-mini"><img src={assets.mark} alt="" /> Profile read</span><span>linkedin.com/in/*</span></div>
              <div className="profile-person"><div className="large-avatar" /><div><b>Jordan Ellis</b><small>VP Growth, Northwind Co.</small><em>linkedin.com/in/jordan-ellis</em></div></div>
              <div className="profile-bars"><i /><i /><i /></div>
              <div className="profile-fields"><span>NAME</span><b>Jordan Ellis</b><span>HEADLINE</span><b>VP Growth, Northwind Co.</b></div>
            </div>
            <div className="transfer-arrow"><ArrowRight size={32} /></div>
            <div className="tagsilo-capture-card">
              <div className="capture-title"><img src={assets.mark} alt="" /><b>TagSilo captured</b><span className="live-dot" /></div>
              <div className="capture-field"><span>PIPELINE GROUP</span><b>Q3 Outbound</b></div>
              <div className="capture-field"><span>ACTIVE TAGS</span><div><i>High intent</i><i>Decision maker</i></div></div>
              <div className="capture-field"><span>CONTEXT NOTE</span><b className="muted-line">Launch expected in late August.</b></div>
              <div className="sync-button">Sync to Google Sheets <ArrowRight size={14} /></div>
            </div>
          </div>
          <div className="feature-rail">
            <article><span>01</span><h3>Profile context</h3><p>Capture the identity and details that make an outreach sequence personal.</p></article>
            <article><span>02</span><h3>Custom tags</h3><p>Label priority, intent, segment, or any signal that matters to your workflow.</p></article>
            <article><span>03</span><h3>Pipeline groups</h3><p>Keep campaigns and relationship stages separated before they become a cluttered sheet.</p></article>
            <article><span>04</span><h3>Follow-up notes</h3><p>Preserve the useful nuance that you would otherwise try to remember later.</p></article>
          </div>
        </div>
      </section>

      <section className="sheet-section">
        <div className="shell-width sheet-layout">
          <div className="sheet-visual-wrap"><img src={assets.workflow} alt="TagSilo workflow showing profile details captured into a structured lead record" /></div>
          <div className="sheet-copy">
            <SectionEyebrow>05 / THE OUTPUT</SectionEyebrow>
            <h2>Your spreadsheet becomes the <em>source of truth.</em></h2>
            <p>TagSilo keeps the operational layer simple. When a profile is qualified, your list receives a neat lead record—with grouping, tags, and notes attached.</p>
            <ul className="check-list">
              <li><Check size={18} /> Structured data instead of loose bookmarks.</li>
              <li><Check size={18} /> Duplicate detection to avoid repeated saves.</li>
              <li><Check size={18} /> One simple place to sort, filter, and prioritize.</li>
            </ul>
            <a className="inline-link" href="#pricing">See the plan options <ArrowRight size={16} /></a>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="shell-width pricing-wrap">
          <div className="pricing-intro">
            <SectionEyebrow>06 / START YOUR PIPELINE</SectionEyebrow>
            <h2>Start simple.<br /><span>Scale the system.</span></h2>
            <p>Try the capture workflow on your own day-to-day prospecting. Upgrade when your pipeline needs more room to work.</p>
          </div>
          <div className="pricing-grid">
            <article className="price-card free-card">
              <div className="plan-kicker">TagSilo Free</div>
              <div className="price"><b>$0</b><span>/ month</span></div>
              <p>For testing the habit of capturing leads while you browse.</p>
              <ul><li><Check size={15} /> 3 profile syncs per day</li><li><Check size={15} /> 1 default pipeline group</li><li><Check size={15} /> Up to 2 tags per lead</li><li><Check size={15} /> Google Sheets sync</li></ul>
              <PrimaryCta label="Start with TagSilo Free" />
            </article>
            <article className="price-card pro-card">
              <div className="pro-tab"><Sparkles size={13} /> MOST PIPELINES CHOOSE PRO</div>
              <div className="plan-kicker">TagSilo Pro</div>
              <div className="price"><b>$9.99</b><span>/ month</span></div>
              <p>For a lead workflow that grows with your outreach volume.</p>
              <ul><li><Check size={15} /> Unlimited daily profile syncs</li><li><Check size={15} /> Unlimited pipeline groups</li><li><Check size={15} /> Unlimited simultaneous tags</li><li><Check size={15} /> Full tag & group builder</li><li><Check size={15} /> Real-time Sheets synchronization</li></ul>
              <PrimaryCta label="Get TagSilo Pro" />
            </article>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="paper-shell faq-layout">
          <div className="faq-heading"><SectionEyebrow>07 / CLEAR THE OBJECTIONS</SectionEyebrow><h2>Questions worth asking <span>before you organize.</span></h2><p>TagSilo is purpose-built to make the existing LinkedIn workflow more useful—not more complicated.</p></div>
          <div className="faq-list">
            {faqItems.map((item, index) => {
              const open = activeFaq === index;
              return <div className={`faq-row ${open ? "faq-open" : ""}`} key={item.question}>
                <button onClick={() => setActiveFaq(open ? null : index)} aria-expanded={open}>
                  <span className="faq-number">0{index + 1}</span><b>{item.question}</b><ChevronDown size={20} />
                </button>
                <div className="faq-answer"><p>{item.answer}</p></div>
              </div>;
            })}
          </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-grain" />
        <div className="shell-width closing-content">
          <img className="closing-mark" src={assets.mark} alt="" />
          <SectionEyebrow>READY WHEN YOUR NEXT PROSPECT IS</SectionEyebrow>
          <h2>Capture the profile.<br />Keep the <em>momentum.</em></h2>
          <p>Build a lead process that lets your LinkedIn time turn into a more organized pipeline—not another list of tabs to revisit later.</p>
          <PrimaryCta label="Get TagSilo Free" />
          <small>Start with 3 profile syncs per day. Upgrade whenever your workflow needs more capacity.</small>
        </div>
      </section>

      <footer className="site-footer">
        <div className="shell-width footer-inner">
          <img className="footer-logo" src={assets.logo} alt="TagSilo" />
          <p>LinkedIn prospecting, organized into a usable pipeline.</p>
          <div><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#top">Back to top ↑</a></div>
        </div>
      </footer>
    </main>
  );
}
