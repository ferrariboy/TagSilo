/**
 * Signal Ledger design: calm editorial workflow for a LinkedIn-to-Google-Sheets extension.
 * Official TagSilo neon-lime system: dark ink, #A6FF26 actions, and direct workflow clarity.
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  FileSpreadsheet,
  Layers3,
  Linkedin,
  Menu,
  MousePointerClick,
  NotebookPen,
  ShieldCheck,
  Tag,
  Users,
  X,
} from "lucide-react";

const logoUrl = "/manus-storage/tagsilo-logo-lockup_1793048f.jpg";
const iconUrl = "/manus-storage/tagsilo-icon-48_b4e6cf97.jpg";
const heroUrl = "/manus-storage/tagsilo-hero-workflow_0387b631.png";
const flowUrl = "/manus-storage/tagsilo-flow-diagram_b6b2e14e.png";
const contextUrl = "/manus-storage/tagsilo-context-cards_3b2bd2e6.png";
const textureUrl = "/manus-storage/tagsilo-proof-texture_7e3d86c6.png";

const chromeWebStore = "https://chromewebstore.google.com/";

const workflowSteps = [
  {
    number: "01",
    title: "Open a LinkedIn profile",
    description:
      "Browse LinkedIn as you normally do. When you find someone worth tracking, open TagSilo from your browser.",
    icon: Linkedin,
  },
  {
    number: "02",
    title: "Add the context that matters",
    description:
      "Choose a pipeline group, apply tags, and add a note while the reason you saved the lead is still fresh.",
    icon: NotebookPen,
  },
  {
    number: "03",
    title: "Save it to your Google Sheet",
    description:
      "Click Save to add an organized lead record to the sheet you use for outreach, sourcing, or follow-up.",
    icon: FileSpreadsheet,
  },
];

const capabilities = [
  {
    eyebrow: "01 · Capture",
    title: "Save the profile details without retyping.",
    description:
      "Keep the profile information available on the page you are viewing together with the link back to it.",
    icon: MousePointerClick,
  },
  {
    eyebrow: "02 · Organize",
    title: "Make your lead list match your process.",
    description:
      "Use pipeline groups and tags to separate outreach targets, candidates, design partners, or client lists.",
    icon: Tag,
  },
  {
    eyebrow: "03 · Remember",
    title: "Keep the human context with the lead.",
    description:
      "Add the reason the profile matters before you move on—an outreach angle, mutual connection, or next step.",
    icon: NotebookPen,
  },
  {
    eyebrow: "04 · Review",
    title: "Avoid rebuilding the same record twice.",
    description:
      "When connected to your configured sheet, existing-record awareness can help you spot a lead you have already saved.",
    icon: Layers3,
  },
];

const audiences = [
  {
    role: "Sales reps & outbound teams",
    copy: "Build a clean prospect list as you research accounts. Keep decision-makers, outreach angles, and follow-up context together.",
  },
  {
    role: "Agencies & consultants",
    copy: "Keep client prospecting separate with clear pipeline groups, then hand over a usable Google Sheet—not scattered tabs and loose notes.",
  },
  {
    role: "Recruiters & talent sourcers",
    copy: "Build structured talent pools with role-specific tags and the context that explains why a candidate belongs in the search.",
  },
  {
    role: "Founders & growth teams",
    copy: "Track design partners, customer prospects, investor targets, or partnerships without taking on a complex CRM too early.",
  },
];

const faqs = [
  {
    question: "What does TagSilo do?",
    answer:
      "TagSilo is a Chrome extension for organizing LinkedIn leads in Google Sheets. On a LinkedIn profile, you can add a pipeline group, tags, and notes, then save the lead record to the Google Sheet you use for prospecting or follow-up.",
  },
  {
    question: "Do I need a CRM to use TagSilo?",
    answer:
      "No. TagSilo is useful if Google Sheets is your lead list today. It can also help you create cleaner, more complete records before you move qualified leads into another system.",
  },
  {
    question: "Does TagSilo send messages or connection requests for me?",
    answer:
      "No. TagSilo is an organization tool. It does not send LinkedIn messages or connection requests on your behalf. You choose the profiles you view and the records you save.",
  },
  {
    question: "What is included in the Free plan?",
    answer:
      "The Free plan lets you save up to 3 profiles per day, keep 1 active pipeline group, and add up to 2 tags per lead. It is a practical way to try the workflow before you need more capacity.",
  },
  {
    question: "Which browsers does TagSilo support?",
    answer:
      "TagSilo is available for Chrome. Add other browser names only after they have been tested, supported, and clearly documented.",
  },
  {
    question: "How does duplicate checking work?",
    answer:
      "When enabled and connected to your configured sheet, TagSilo can look for an existing saved record for the profile you are viewing. This helps reduce accidental duplicate records in your own workflow.",
  },
];

function BrandLockup({ className = "" }: { className?: string }) {
  return <img className={`object-contain ${className}`} src={logoUrl} alt="TagSilo" />;
}

function InstallButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`group inline-flex items-center justify-center gap-2 bg-[#a6ff26] font-semibold text-[#06080d] shadow-[0_8px_0_#5c9c0f] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c1ff69] hover:shadow-[0_11px_0_#5c9c0f] active:translate-y-1 active:shadow-[0_3px_0_#5c9c0f] ${compact ? "rounded-full px-5 py-3 text-sm" : "rounded-full px-6 py-4 text-base"}`}
      href={chromeWebStore}
      target="_blank"
      rel="noreferrer"
    >
      <span>Add TagSilo to Chrome — Free</span>
      <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="precision-entry mb-5 flex items-center gap-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.13em] text-[#94a3b8]">
      <img className="h-4 w-4 rounded-sm object-cover" src={iconUrl} alt="" aria-hidden="true" />
      <span>Entry</span>
      <span className="h-px w-7 bg-[#94a3b8]/55" />
      <span className="flex items-center gap-1 text-[#a6ff26]"><span className="h-1.5 w-1.5 rounded-full bg-current" /><ArrowRight className="h-3 w-3" /></span>
      <span>{children}</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#06080d] text-white">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="relative z-20 border-b border-[#a6ff26]/15 bg-[#06080d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <a className="flex items-center" href="#top" aria-label="TagSilo home">
            <BrandLockup className="h-9 w-auto" />
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#c8d9d3] md:flex" aria-label="Main navigation">
            <a className="hover:text-[#a6ff26]" href="#how-it-works">How it works</a>
            <a className="hover:text-[#a6ff26]" href="#who-its-for">Who it&apos;s for</a>
            <a className="hover:text-[#a6ff26]" href="#pricing">Pricing</a>
            <a className="hover:text-[#a6ff26]" href="#faq">FAQ</a>
          </nav>

          <div className="hidden md:block"><InstallButton compact /></div>
          <button className="rounded-full border border-[#a6ff26]/25 p-2 text-[#a6ff26] md:hidden" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main id="main">
        <section id="top" className="relative overflow-hidden border-b border-[#a6ff26]/15 bg-[#06080d]">
          <div className="hero-grid absolute inset-0 opacity-[0.45]" />
          <div className="absolute -left-40 top-8 h-80 w-80 rounded-full bg-[#a6ff26]/15 blur-3xl" />
          <div className="absolute right-[18%] top-[-110px] h-72 w-72 rounded-full bg-[#3cf6df]/10 blur-3xl" />

          <div className="relative mx-auto grid min-h-[690px] max-w-[1440px] items-center gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <SectionLabel>Chrome extension for LinkedIn prospecting</SectionLabel>
              <h1 className="max-w-[770px] font-[Fraunces] text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl xl:text-[5.6rem]">
                Save and organize LinkedIn leads in Google Sheets—<em className="font-normal text-[#a6ff26]">without leaving LinkedIn.</em>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#c8d9d3] sm:text-xl">
                TagSilo helps sales reps, founders, recruiters, and agencies turn LinkedIn profiles into organized lead records. Add a group, tags, and a note, then save the lead to your Google Sheet in one click.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <InstallButton />
                <a href="#how-it-works" className="group inline-flex items-center gap-2 text-sm font-bold text-white">
                  See how it works <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#a8c0b7]">
                <span className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-[#a6ff26]" /> Free plan available</span>
                <span className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-[#a6ff26]" /> No credit card required</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[710px] lg:mr-0">
              <div className="absolute -left-6 -top-7 z-10 hidden items-center gap-2 rounded-full border border-[#a6ff26]/25 bg-[#11181b] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#c8d9d3] shadow-sm sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#a6ff26]" /> A lead worth keeping
              </div>
              <div className="relative rounded-[2rem] border border-[#a6ff26]/25 bg-[#11181b] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <img className="aspect-[16/9] w-full rounded-[1.55rem] object-cover" src={heroUrl} alt="Illustrated TagSilo workflow from a profile to organized spreadsheet record" />
              </div>
              <div className="absolute -bottom-8 -left-4 hidden max-w-[245px] rounded-2xl border border-[#a6ff26]/30 bg-[#11181b] p-4 text-white shadow-xl sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a6ff26]">Transfer complete</p>
                <p className="mt-2 font-[Fraunces] text-xl leading-5">The profile becomes a usable record.</p>
              </div>
              <div className="absolute -right-5 top-[45%] hidden rounded-xl border border-[#a6ff26]/25 bg-[#11181b] px-3 py-2 shadow-lg lg:block">
                <div className="flex gap-1.5">
                  <span className="tag-cut bg-[#a6ff26] px-2 py-1 text-[10px] font-bold text-[#06080d]">High intent</span>
                  <span className="tag-cut bg-[#203b36] px-2 py-1 text-[10px] font-bold text-[#d7faaf]">Q3 outbound</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative bg-[#17352d] py-24 text-[#f7f5ef] lg:py-32">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${textureUrl})`, backgroundSize: "cover" }} />
          <div className="relative mx-auto max-w-[1440px] px-5 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <SectionLabel>How TagSilo works</SectionLabel>
                <h2 className="font-[Fraunces] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                  A simple way to keep every LinkedIn lead organized.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[#c8d9d3]">
                You already find prospects on LinkedIn. TagSilo gives you a faster way to keep the details, context, and next-step information together in your Google Sheet.
              </p>
            </div>

            <div className="relative mt-14 overflow-hidden rounded-[2rem] border border-white/10 bg-[#22483d] p-5 sm:p-8">
              <img className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-screen" src={flowUrl} alt="" aria-hidden="true" />
              <div className="relative grid gap-8 lg:grid-cols-3">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <article key={step.number} className="group relative rounded-2xl border border-white/10 bg-[#17352d]/90 p-7 backdrop-blur-sm">
                      {index !== workflowSteps.length - 1 && <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full border border-[#a6ff26]/40 bg-[#a6ff26] p-2 text-[#06080d] lg:block" />}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold tracking-widest text-[#a6ff26]">{step.number}</span>
                        <Icon className="h-5 w-5 text-[#a6ff26]" />
                      </div>
                      <h3 className="mt-12 font-[Fraunces] text-2xl font-semibold leading-7">{step.title}</h3>
                      <p className="mt-4 text-sm leading-6 text-[#c8d9d3]">{step.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
            <p className="mt-7 text-center text-sm font-semibold text-[#c8d9d3]">No repeated copying. No separate note app. No guessing why you saved someone a week later.</p>
          </div>
        </section>

        <section className="border-b border-[#17352d]/10 bg-[#f7f5ef] py-24 text-[#17352d] lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-14 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
            <div className="max-w-xl">
              <SectionLabel>The manual handoff</SectionLabel>
              <h2 className="font-[Fraunces] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                LinkedIn is where you find leads. Your lead list needs to be somewhere you can use it.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#49655d]">
                The usual workflow breaks momentum: copy a name, switch to a spreadsheet, paste a link, add a note somewhere else, then hope you remember the context later.
              </p>
              <p className="mt-8 border-l-2 border-[#a6ff26] pl-4 font-[Fraunces] text-xl leading-7 text-[#17352d]">TagSilo keeps lead organization inside the moment you are already working in.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 lg:mt-20">
              {[
                ["01", "Stop rebuilding the same lead record", "Save the profile details you need instead of repeatedly copying names, titles, and links into a spreadsheet."],
                ["02", "Keep the reason you saved a lead", "Add a note and tags while you remember the trigger: a hiring signal, mutual connection, outreach idea, or follow-up date."],
                ["03", "Keep your list organized as it grows", "Use pipeline groups and tags to separate prospects, candidates, client targets, or outreach campaigns."],
              ].map(([number, title, copy]) => (
                <article key={number} className="flex min-h-[290px] flex-col rounded-2xl border border-[#17352d]/12 bg-white p-6 shadow-[0_12px_25px_rgba(20,59,48,0.04)]">
                  <span className="font-mono text-xs font-bold tracking-widest text-[#76b51d]">{number}</span>
                  <h3 className="mt-auto font-[Fraunces] text-2xl font-semibold leading-7 tracking-[-0.03em]">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-[#55746c]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#edf3eb] py-24 text-[#17352d] lg:py-32">
 <div className="absolute right-[-80px] top-[11%] h-[450px] w-[450px] rounded-full bg-[#c4ead3] opacity-60 blur-3xl" />
          <div className="relative mx-auto max-w-[1440px] px-5 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <SectionLabel>The organization layer for LinkedIn</SectionLabel>
                <h2 className="max-w-2xl font-[Fraunces] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">Capture the lead. Keep the context. Find the next step.</h2>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[#49655d]">TagSilo is built around the pieces of information that make a profile useful after you leave LinkedIn.</p>
              </div>
              <div className="relative mx-auto max-w-[540px] rotate-[-2deg] overflow-hidden rounded-[2rem] border border-[#17352d]/15 bg-[#f7f5ef] p-3 shadow-[0_24px_45px_rgba(20,59,48,0.12)]">
                <div className="rounded-[1.5rem] bg-[#101b18] p-5 text-white">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a6ff26]"><span>TagSilo record</span><span>● Ready to save</span></div>
                  <div className="mt-5 rounded-xl bg-white p-4 text-[#17352d]">
                    <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9f6aa] font-[Fraunces] text-lg">J</div><div><p className="font-bold">Jordan Ellis</p><p className="mt-0.5 text-xs text-[#55746c]">VP Growth · CloudScale</p></div></div>
                    <div className="mt-4 flex flex-wrap gap-2"><span className="tag-cut bg-[#a6ff26] px-2.5 py-1 text-[10px] font-bold text-[#06080d]">Decision maker</span><span className="tag-cut bg-[#e7f0ed] px-2.5 py-1 text-[10px] font-bold text-[#294b41]">Warm intro</span></div>
                    <p className="mt-4 border-l-2 border-[#a6ff26] pl-3 text-xs leading-5 text-[#55746c]">“Send the outbound case study on Friday.”</p>
                  </div>
                  <div className="mt-4 grid grid-cols-[1.1fr_0.8fr_0.7fr] gap-px overflow-hidden rounded-xl bg-[#a6ff26]/20 text-[10px]"><span className="bg-[#17352d] px-3 py-2 text-[#c8d9d3]">Jordan Ellis</span><span className="bg-[#17352d] px-3 py-2 text-[#a6ff26]">Q3 outbound</span><span className="bg-[#17352d] px-3 py-2 text-[#c8d9d3]">Saved</span></div>
                </div>
              </div>
            </div>
            <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {capabilities.map((capability) => {
                const Icon = capability.icon;
                return (
                  <article key={capability.eyebrow} className="group rounded-2xl border border-[#17352d]/10 bg-[#f7f5ef] p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_24px_rgba(20,59,48,0.09)]">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-[#55746c]">
                      {capability.eyebrow}<Icon className="h-5 w-5 text-[#76b51d]" />
                    </div>
                    <h3 className="mt-12 font-[Fraunces] text-2xl font-semibold leading-7 tracking-[-0.03em]">{capability.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-[#55746c]">{capability.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="who-its-for" className="border-y border-[#17352d]/10 bg-[#f7f5ef] py-24 text-[#17352d] lg:py-32">
          <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <SectionLabel>Built for the way you prospect</SectionLabel>
                <h2 className="font-[Fraunces] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">One simple system for the people you need to keep track of on LinkedIn.</h2>
              </div>
              <div className="max-w-2xl self-end">
                <p className="text-lg leading-8 text-[#49655d]">TagSilo is flexible enough for different prospecting motions, without asking you to adopt a heavy new system.</p>
                <p className="mt-5 border-l-2 border-[#a6ff26] pl-4 text-base leading-7 text-[#294b41]">Not prospecting? TagSilo is also for anyone who wants their LinkedIn contacts tagged, grouped, and easy to find again. Whether you are reconnecting with your network, planning partnerships, saving alumni, or keeping track of people who matter, every profile has a place to live.</p>
              </div>
            </div>
            <div className="mt-14 grid overflow-hidden rounded-[2rem] border border-[#17352d]/10 bg-[#17352d] md:grid-cols-2">
              {audiences.map((audience, index) => (
                <article key={audience.role} className={`group relative min-h-[220px] p-8 text-[#f7f5ef] ${index % 2 === 0 ? "bg-[#17352d]" : "bg-[#22483d]"}`}>
                  <span className="font-mono text-xs font-bold tracking-widest text-[#a6ff26]">0{index + 1}</span>
                  <h3 className="mt-10 max-w-md font-[Fraunces] text-3xl font-semibold leading-8 tracking-[-0.04em]">{audience.role}</h3>
                  <p className="mt-4 max-w-md text-sm leading-6 text-[#c8d9d3]">{audience.copy}</p>
                  <ArrowUpRight className="absolute bottom-7 right-7 h-5 w-5 text-[#a6ff26] transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f5ef] py-24 text-[#17352d] lg:py-32">
 <div className="mx-auto grid max-w-[1440px] gap-14 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
            <div>
              <SectionLabel>Not another CRM</SectionLabel>
              <h2 className="font-[Fraunces] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">Keep the tools you already use.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#49655d]">TagSilo does not ask you to replace your CRM, spreadsheet, or outreach tools. It helps you organize lead information at the point where you discover it: the LinkedIn profile.</p>
              <div className="mt-8 flex items-start gap-3 rounded-2xl bg-[#ecffd9] p-5 text-sm leading-6 text-[#294b41]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#5f9f10]" /> You choose the profile, the group, the note, and the moment a record is saved.</div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-[#17352d]/10 bg-white">
              <div className="grid grid-cols-[1fr_auto_1fr] border-b border-[#17352d]/10 px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-[#55746c]">
                <span>What you do today</span><span /><span>What TagSilo changes</span>
              </div>
              {[
                ["Find a promising person on LinkedIn", "Open TagSilo on the profile you are already viewing."],
                ["Copy details into a spreadsheet and write notes elsewhere", "Choose a group, add tags and notes, then save the record."],
                ["Reopen tabs to remember who is who", "See the original context in the organized record."],
                ["Wonder whether you already added the profile", "Use existing-record awareness where enabled."],
              ].map(([before, after]) => (
                <div key={before} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[#17352d]/10 px-6 py-5 last:border-0">
                  <p className="text-sm leading-5 text-[#55746c]">{before}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a6ff26] text-[#06080d]"><ArrowRight className="h-4 w-4" /></div>
                  <p className="text-sm font-semibold leading-5 text-[#17352d]">{after}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#edf3eb] py-24 text-[#17352d] lg:py-32">
 <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(${textureUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="relative mx-auto max-w-[1440px] px-5 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <SectionLabel>Built for a user-controlled workflow</SectionLabel>
              <h2 className="font-[Fraunces] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">You choose the profile. You choose what to save.</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#49655d]">TagSilo is designed to help you organize the LinkedIn profiles you choose to review. You decide when to open the extension, what group and notes to add, and when to save a record.</p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
              {[
                [Users, "Your workflow", "Create the groups and tags that reflect how you source, qualify, and follow up."],
                [FileSpreadsheet, "Your configured sheet", "Save lead records to the Google Sheet you set up for your own workflow."],
                [ShieldCheck, "Your next move", "TagSilo organizes research; it does not send LinkedIn messages or connection requests for you."],
              ].map(([Icon, title, copy]) => {
                const CardIcon = Icon as typeof Users;
                return <div key={title as string} className="rounded-2xl border border-[#17352d]/10 bg-[#f7f5ef]/85 p-6 text-left backdrop-blur-sm"><CardIcon className="h-6 w-6 text-[#5f9f10]" /><h3 className="mt-8 font-[Fraunces] text-2xl font-semibold">{title as string}</h3><p className="mt-3 text-sm leading-6 text-[#55746c]">{copy as string}</p></div>;
              })}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-[#55746c]">You remain responsible for using TagSilo and LinkedIn in accordance with applicable terms and policies.</p>
          </div>
        </section>

        <section id="pricing" className="border-y border-[#17352d]/10 bg-[#17352d] py-24 text-[#f7f5ef] lg:py-32">
          <div className="mx-auto max-w-[1120px] px-5">
            <div className="mx-auto max-w-3xl text-center">
              <SectionLabel>Simple pricing</SectionLabel>
              <h2 className="font-[Fraunces] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">Start with your next few leads. Upgrade when TagSilo becomes part of your workflow.</h2>
              <p className="mt-6 text-lg leading-8 text-[#c8d9d3]">Try the core workflow for free. Move to Pro when you need to organize LinkedIn prospecting without daily limits.</p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2">
              <article className="rounded-[2rem] border border-white/15 bg-[#22483d] p-8 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a6ff26]">Entry 08.1 · Free</p>
                <h3 className="mt-5 font-[Fraunces] text-4xl font-semibold">Try the workflow.</h3>
                <p className="mt-4 text-sm leading-6 text-[#c8d9d3]">See how TagSilo fits into your everyday LinkedIn prospecting.</p>
                <div className="mt-8 flex items-baseline gap-2"><span className="font-[Fraunces] text-6xl font-semibold">$0</span><span className="text-sm text-[#c8d9d3]">/ month</span></div>
                <ul className="mt-10 space-y-4 text-sm text-[#f7f5ef]">
                  {["Save up to 3 profiles per day", "Keep 1 active pipeline group", "Add up to 2 tags per lead", "Save leads to Google Sheets"].map((feature) => <li className="flex gap-3" key={feature}><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#aee9be]" />{feature}</li>)}
                </ul>
                <a href={chromeWebStore} target="_blank" rel="noreferrer" className="mt-10 block rounded-full border border-white/25 px-5 py-3 text-center text-sm font-bold transition hover:bg-white hover:text-[#17352d]">Add to Chrome — Free</a>
              </article>
              <article className="relative rounded-[2rem] border-2 border-[#a6ff26] bg-[#f7f5ef] p-8 text-[#17352d] shadow-[0_18px_0_#76b51d] sm:p-10">
                <span className="absolute right-7 top-7 rounded-full bg-[#a6ff26] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#06080d]">For active prospecting</span>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f9f10]">Entry 08.2 · TagSilo Pro</p>
                <h3 className="mt-5 font-[Fraunces] text-4xl font-semibold">Keep the whole workflow organized.</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-[#55746c]">For prospecting that has outgrown daily limits and one default group.</p>
                <div className="mt-8 flex items-baseline gap-2"><span className="font-[Fraunces] text-6xl font-semibold">$9.99</span><span className="text-sm text-[#55746c]">/ month</span></div>
                <ul className="mt-10 space-y-4 text-sm text-[#17352d]">
                  {["Unlimited profile saves", "Unlimited pipeline groups", "Unlimited tags per lead", "A system that matches your process"].map((feature) => <li className="flex gap-3" key={feature}><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5f9f10]" />{feature}</li>)}
                </ul>
                <a href="#top" className="mt-10 block rounded-full bg-[#a6ff26] px-5 py-3 text-center text-sm font-bold text-[#06080d] shadow-[0_5px_0_#5c9c0f] transition hover:bg-[#c1ff69]">Upgrade to Pro</a>
              </article>
            </div>
            <p className="mt-10 text-center text-sm text-[#c8d9d3]">Need TagSilo for a team or agency? <a className="font-bold text-[#aee9be] underline underline-offset-4" href="mailto:support@tagsilo.com">Talk to us about multi-seat access.</a></p>
          </div>
        </section>

        <section id="faq" className="bg-[#f7f5ef] py-24 text-[#17352d] lg:py-32">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-5 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="font-[Fraunces] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">Questions before you install?</h2>
              <p className="mt-6 max-w-sm text-lg leading-8 text-[#49655d]">The short answers about the workflow, setup, and what TagSilo does—and does not—do.</p>
            </div>
            <Accordion type="single" collapsible className="border-t border-[#17352d]/15">
              {faqs.map((faq, index) => (
                <AccordionItem value={`faq-${index}`} key={faq.question} className="border-[#17352d]/15 py-2">
                  <AccordionTrigger className="py-5 text-left font-[Fraunces] text-xl font-semibold tracking-[-0.025em] hover:no-underline">{faq.question}<ChevronDown className="h-4 w-4 shrink-0 text-[#5f9f10]" /></AccordionTrigger>
                  <AccordionContent className="max-w-2xl pb-5 text-sm leading-7 text-[#55746c]">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-[#0d2019] via-[#123a2e] to-[#0a1411] py-24 text-white lg:py-32">
          <div className="absolute left-[12%] top-0 h-full w-px bg-white/20" /><div className="absolute left-[calc(12%+16px)] top-0 h-full w-px bg-white/20" />
          <div className="absolute right-[12%] top-0 h-full w-px bg-white/20" /><div className="absolute right-[calc(12%+16px)] top-0 h-full w-px bg-white/20" />
          <div className="relative mx-auto max-w-4xl px-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a6ff26]">Entry 10 · Your next lead does not need another tab</p>
            <h2 className="mt-5 font-[Fraunces] text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">Stop rebuilding LinkedIn leads by hand.</h2>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#d3e7de]">Add TagSilo to Chrome and turn the profiles you find on LinkedIn into an organized Google Sheet you can actually use.</p>
            <div className="mt-9"><a className="inline-flex items-center gap-2 rounded-full bg-[#a6ff26] px-6 py-4 font-bold text-[#06080d] shadow-[0_8px_0_#5c9c0f] transition hover:-translate-y-0.5 hover:bg-[#c1ff69] hover:shadow-[0_11px_0_#5c9c0f] active:translate-y-1 active:shadow-[0_3px_0_#5c9c0f]" href={chromeWebStore} target="_blank" rel="noreferrer">Add TagSilo to Chrome — Free <ArrowUpRight className="h-4 w-4" /></a></div>
            <p className="mt-6 text-sm font-medium text-[#d3e7de]">Start with up to 3 saved profiles per day. No credit card required.</p>
          </div>
        </section>
      </main>

      <footer className="bg-[#17352d] py-10 text-[#c8d9d3]">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-5 sm:flex-row sm:items-end lg:px-10">
          <div><a className="flex items-center" href="#top"><BrandLockup className="h-8 w-auto" /></a><p className="mt-3 max-w-xs text-sm leading-6">Organize LinkedIn leads in Google Sheets.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold"><a className="hover:text-[#a6ff26]" href="#faq">FAQ</a><a className="hover:text-[#a6ff26]" href="mailto:support@tagsilo.com">Support</a><a className="hover:text-[#a6ff26]" href={chromeWebStore} target="_blank" rel="noreferrer">Chrome Web Store</a></div>
        </div>
        <div className="mx-auto mt-9 max-w-[1440px] border-t border-white/10 px-5 pt-6 text-xs text-[#8caaa0] lg:px-10">© 2026 TagSilo. All rights reserved.</div>
      </footer>
    </div>
  );
}
