import fs from 'node:fs/promises';
import path from 'node:path';

const deployRoot = process.argv[2];
const devBaseUrl = process.env.AAS_DEV_BASE_URL || 'https://dev.ai-automation-studio.pages.dev';
const shouldNoindex = process.env.AAS_NO_INDEX !== 'false';

if (!deployRoot) {
  console.error('Usage: node scripts/dev-overlay.mjs <deploy-root>');
  process.exit(1);
}

const locales = ['en', 'ru', 'de'];
const routeByLocale = { en: '/', ru: '/ru/', de: '/de/' };
const titleByLocale = {
  en: 'AI Automation Studio — Automate. Scale. Grow.',
  ru: 'AI Automation Studio — Автоматизируй. Масштабируй. Расти.',
  de: 'AI Automation Studio — Automatisieren. Skalieren. Wachsen.'
};

const deText = new Map(Object.entries({
  'Services': 'Leistungen',
  'Industries': 'Branchen',
  'Insights': 'Insights',
  'Process': 'Prozess',
  'Contact': 'Kontakt',
  'Book a Call': 'Termin buchen',
  'Book a free call': 'Kostenlosen Termin buchen',
  'Book a Free Call': 'Kostenlosen Termin buchen',
  'Send an email': 'E-Mail senden',
  'AI Automation Studio': 'AI Automation Studio',
  'AI-powered process and task automation for service firms, production and distribution companies, and enterprise teams.': 'KI-gestützte Prozess- und Aufgabenautomatisierung für Dienstleistungsunternehmen, Produktions- und Handelsfirmen sowie Enterprise-Teams.',
  'productivity boost': 'Produktivitätsschub',
  'faster processes': 'schnellere Prozesse',
  'AI monitoring': 'KI-Monitoring',
  'Process Automated': 'Prozess automatisiert',
  'Saved 3.2 hrs today': 'Heute 3,2 Std. gespart',
  'Trend Alert': 'Trend erkannt',
  'AI spotted opportunity': 'KI hat eine Chance erkannt',
  'Content Created': 'Content erstellt',
  '48 posts generated': '48 Beiträge erstellt',
  'The Problem': 'Das Problem',
  'Is Your Business Stuck in These Traps?': 'Steckt Ihr Unternehmen in diesen Fallen fest?',
  'Manual work, missed trends, and slow content — these bottlenecks cost SMBs thousands of hours every year.': 'Manuelle Arbeit, übersehene Markttrends und langsame Content-Prozesse kosten mittelständische Unternehmen jedes Jahr tausende Stunden.',
  'Manual Overload': 'Zu viel manuelle Arbeit',
  'Data entry, document prep, and routine tasks consume hours that your team should spend on clients.': 'Dateneingabe, Dokumentenvorbereitung und Routineaufgaben verbrauchen Zeit, die Ihr Team eigentlich für Kunden einsetzen sollte.',
  'Blind to Trends': 'Trends werden zu spät erkannt',
  'Your competitors spot market shifts before you do because no one has time to monitor news, prices, and signals.': 'Ihre Wettbewerber erkennen Marktverschiebungen früher, weil in Ihrem Team niemand Zeit hat, Nachrichten, Preise und Signale laufend zu beobachten.',
  'Slow Content Pipeline': 'Langsame Content-Pipeline',
  'Creating consistent, high-quality marketing content takes too long and blocks your growth.': 'Regelmäßig hochwertigen Marketing-Content zu erstellen dauert zu lange und bremst Ihr Wachstum.',
  'Scaling Pain': 'Wachstum mit Reibung',
  'Growing the business means hiring more staff for repetitive work — margins shrink while overheads rise.': 'Wachstum bedeutet oft, mehr Personal für wiederkehrende Arbeit einzustellen - die Marge sinkt, während die Fixkosten steigen.',
  'Compliance Burden': 'Compliance-Aufwand',
  'Tracking deadlines, checklists, and follow-ups is error-prone and eats senior staff time.': 'Fristen, Checklisten und Follow-ups zu verfolgen ist fehleranfällig und bindet Zeit erfahrener Mitarbeiter.',
  'What We Do': 'Was wir tun',
  'Workshop first. Then a 4‑step ladder.': 'Zuerst der Workshop. Danach ein klarer 4-Schritte-Pfad.',
  'We start with an AI-readiness workshop and a scoped pilot on one heavy process — bank reconciliation, payroll bureau, VAT returns, or month-end close — then expand to Fractional CAIO and Partnership.': 'Wir beginnen mit einem AI-readiness Workshop und einem klar abgegrenzten Pilotprojekt für einen belastenden Prozess - Bankabstimmung, Payroll Bureau, VAT Returns oder Month-end Close. Danach erweitern wir zu Fractional CAIO und Partnership.',
  'AI-readiness Workshop': 'AI-readiness Workshop',
  'Low-risk entry for UK accountancy and audit practices: map your heaviest processes, set a KPI baseline, and pick one workflow for a pilot.': 'Risikogarmer Einstieg für britische Accounting- und Audit-Praxen: Wir erfassen die aufwendigsten Prozesse, setzen eine KPI-Basislinie und wählen einen Workflow für den Pilot aus.',
  'Process map + priority ranking': 'Prozesslandkarte + Priorisierung',
  'KPI baseline and pilot scope': 'KPI-Basislinie und Pilotumfang',
  'Human-in-the-loop guardrails from day one': 'Human-in-the-loop Leitplanken ab Tag eins',
  'Pilot': 'Pilot',
  'Fixed-scope build: one UK accountancy workflow live in production in 30–90 days — with exception routing and measurable KPIs.': 'Fest abgegrenzte Umsetzung: Ein britischer Accounting-Workflow geht in 30-90 Tagen live - mit Exception-Routing und messbaren KPIs.',
  'Bank reconciliation at scale (80k+ records)': 'Bankabstimmung im großen Maßstab (80k+ Datensätze)',
  'Payroll bureau pre-run checks & journal posting': 'Payroll-Bureau Pre-run Checks und Journal Posting',
  'VAT return prep checks & client chase workflow': 'VAT-Return-Vorprüfung und Client-Chase-Workflow',
  'Month-end close checklist orchestration': 'Orchestrierung der Month-end-Close-Checkliste',
  'Fractional CAIO': 'Fractional CAIO',
  'After a successful pilot: AI strategy, automation roadmap, and governance — without hiring a full-time executive.': 'Nach einem erfolgreichen Pilot: KI-Strategie, Automatisierungs-Roadmap und Governance - ohne eine Vollzeit-Führungskraft einzustellen.',
  'Automation roadmap tied to P&L': 'Automatisierungs-Roadmap mit P&L-Bezug',
  'Quarterly priorities and guardrails': 'Quartalsprioritäten und Leitplanken',
  'Vendor and stack decisions': 'Entscheidungen zu Anbietern und Stack',
  'Works side‑by‑side with your COO/CFO': 'Arbeitet Seite an Seite mit Ihrem COO/CFO',
  'After Pilot: Care & Partnership': 'Nach dem Pilot: Care & Partnership',
  'Once the first automation is live, we stay to maintain, extend, and compound the gains — from a light Care Plan to a deeper Automation Partnership.': 'Wenn die erste Automatisierung live ist, bleiben wir an Bord, um sie zu betreuen, zu erweitern und den Effekt auszubauen - vom schlanken Care Plan bis zur tieferen Automation Partnership.',
  'Care Plan — 90‑day support & small changes': 'Care Plan - 90 Tage Support und kleinere Änderungen',
  'Automation Partnership — embedded SA+TPM': 'Automation Partnership - eingebetteter SA+TPM',
  'Optional Technology Partnership with rev‑share': 'Optionale Technology Partnership mit Revenue Share',
  'Fixed scope and KPIs per 90‑day cycle': 'Fester Umfang und KPIs je 90-Tage-Zyklus',
  'Who We Serve': 'Für wen wir arbeiten',
  'Built for These Sectors': 'Entwickelt für diese Branchen',
  'Built for UK accountancy & audit practices first.': 'Zuerst für britische Accounting- und Audit-Praxen gebaut.',
  'Accountancy Practices': 'Accounting-Praxen',
  'UK practices drowning in bank reconciliation, payroll bureau runs (PAYE/RTI), VAT returns, and month-end close. Reconciled 80,000+ bank records across statements, invoices, and contracts.': 'Britische Praxen, die in Bankabstimmung, Payroll-Bureau-Läufen (PAYE/RTI), VAT Returns und Month-end Close stecken bleiben. 80.000+ Bankdatensätze über Kontoauszüge, Rechnungen und Verträge hinweg abgestimmt.',
  'Audit Firms': 'Audit-Firmen',
  'Combined audit and accountancy practices: audit fieldwork admin, working papers, client document chase, and completion bottlenecks during busy season.': 'Kombinierte Audit- und Accounting-Praxen: Audit-Fieldwork-Admin, Working Papers, Nachfassen bei Kundendokumenten und Engpässe in der Busy Season.',
  'Asset Management Companies / Family Offices': 'Asset-Management-Gesellschaften / Family Offices',
  'Teams handling portfolio reporting, document-heavy approvals, and investor communication workflows.': 'Teams mit Portfolio-Reporting, dokumentenlastigen Freigaben und Workflows für Investorenkommunikation.',
  'Industrial & Manufacturing': 'Industrie & Fertigung',
  'SME manufacturers streamlining back-office ops and supply chain': 'Mittelständische Hersteller, die Backoffice-Prozesse und Supply Chain schlanker machen',
  'Service Businesses': 'Dienstleistungsunternehmen',
  'Professional services firms growing without extra headcount': 'Professional-Services-Firmen, die ohne zusätzliche Stellen wachsen wollen',
  'How It Works': 'So funktioniert es',
  'From Snapshot to Partnership in 4 steps': 'Vom Snapshot zur Partnership in 4 Schritten',
  'Each stage earns the right to the next: Snapshot → Blueprint → Pilot → Care / Automation Partnership.': 'Jede Stufe verdient sich die nächste: Snapshot -> Blueprint -> Pilot -> Care / Automation Partnership.',
  'Automation Snapshot': 'Automation Snapshot',
  'A 30‑minute session on one operational bottleneck — bank reconciliation backlog, payroll bureau repetition, VAT quarter-end spike, or month-end close delay. We estimate cost and define a KPI.': 'Eine 30-minütige Session zu einem operativen Engpass - Bankabstimmungs-Backlog, Payroll-Bureau-Wiederholung, VAT-Quartalsspitze oder Verzögerung im Month-end Close. Wir schätzen die Kosten und definieren einen KPI.',
  'Automation Blueprint': 'Automation Blueprint',
  'A board‑ready document that maps leaks, defines KPIs, and scopes the first Pilot. You can implement it with us or any other team.': 'Ein board-taugliches Dokument, das Lecks sichtbar macht, KPIs definiert und den ersten Pilot abgrenzt. Sie können es mit uns oder mit jedem anderen Team umsetzen.',
  'A scoped build that takes one workflow live in production with parallel run, clear owners, and a 90‑day measurement window.': 'Ein klar abgegrenzter Build, der einen Workflow mit Parallelbetrieb, klaren Verantwortlichen und einem 90-Tage-Messfenster live bringt.',
  'Care / Automation Partnership': 'Care / Automation Partnership',
  'After a successful Pilot, we move into a light Care Plan or a deeper Automation Partnership with an embedded SA+TPM, iterating in 90‑day cycles.': 'Nach einem erfolgreichen Pilot wechseln wir in einen schlanken Care Plan oder eine tiefere Automation Partnership mit eingebettetem SA+TPM und iterieren in 90-Tage-Zyklen.',
  'Productivity': 'Produktivität',
  'Average staff output increase': 'Durchschnittlicher Anstieg der Teamleistung',
  'Faster Processes': 'Schnellere Prozesse',
  'Reduction in manual processing time': 'Weniger manuelle Bearbeitungszeit',
  'Fewer Errors': 'Weniger Fehler',
  'Automated validation catches mistakes': 'Automatische Validierung erkennt Fehler',
  'More Content': 'Mehr Content',
  'Published at the same cost': 'Veröffentlicht bei gleichen Kosten',
  'Case Studies': 'Case Studies',
  'What we&#x27;ve built': 'Was wir gebaut haben',
  'A working library of automation systems we build for professional services teams: client intake, lead routing, drafting support, back-office operations, hiring, and finance workflows.': 'Eine praxiserprobte Bibliothek von Automatisierungssystemen für Professional-Services-Teams: Client Intake, Lead Routing, Drafting Support, Backoffice-Operationen, Recruiting und Finance Workflows.',
  'UK Firms · Finance Automation': 'UK-Firmen · Finance Automation',
  'Part-time finance admin vs AI agent cost': 'Teilzeit-Finance-Admin vs. AI-Agent: Kostenvergleich',
  'A 2026 cost breakdown for UK firms choosing between a 0.5 FTE finance administrator and a scoped AI finance agent for repeatable finance admin.': 'Eine Kostenaufstellung für 2026 für britische Firmen, die zwischen einem 0,5-FTE Finance Administrator und einem klar begrenzten AI Finance Agent für wiederholbare Finance-Admin-Arbeit wählen.',
  'Read the cost comparison →': 'Kostenvergleich lesen →',
  'UK Company · Financial Services': 'UK-Unternehmen · Financial Services',
  'Unreconciled transactions cleared in 3 days': 'Nicht abgestimmte Transaktionen in 3 Tagen bereinigt',
  'Three years of backlog across several bank accounts. A four-layer AI pipeline (exact-match, fuzzy, AI web search, then manual) narrowed 18,000 unknowns to 100 for human review.': 'Drei Jahre Backlog über mehrere Bankkonten. Eine vierstufige KI-Pipeline - Exact Match, Fuzzy Matching, KI-Websuche, dann manuelle Prüfung - reduzierte 18.000 Unbekannte auf 100 Fälle für Human Review.',
  'Read full case study →': 'Case Study lesen →',
  'UK Accountancy Practice': 'Britische Accounting-Praxis',
  'Bank records reconciled overnight': 'Bankdatensätze über Nacht abgestimmt',
  'A UK accountancy practice automated its monthly bank reconciliation with Make.com and the Xero API. Two days of manual work, cut to a morning exceptions review.': 'Eine britische Accounting-Praxis automatisierte ihre monatliche Bankabstimmung mit Make.com und der Xero API. Zwei Tage manuelle Arbeit wurden auf eine morgendliche Prüfung von Ausnahmen reduziert.',
  'Law Firms · Client Intake': 'Kanzleien · Client Intake',
  'Client intake automation': 'Automatisierung der Mandantenaufnahme',
  'A 24/7 intake workflow that captures every enquiry, asks the right follow-up questions, qualifies the case, answers common questions, and prepares the first draft before a fee-earner steps in.': 'Ein 24/7-Intake-Workflow, der jede Anfrage erfasst, die richtigen Rückfragen stellt, den Fall qualifiziert, häufige Fragen beantwortet und einen ersten Entwurf vorbereitet, bevor ein Fee-earner übernimmt.',
  'Read the intake article →': 'Intake-Artikel lesen →',
  'Growth Teams · Lead Routing': 'Growth Teams · Lead Routing',
  'No leaks': 'Keine Lecks',
  'Lead qualification and routing automation': 'Automatisierung von Lead-Qualifizierung und Routing',
  'Incoming enquiries are qualified by fit, urgency, value, and likelihood to convert, then routed to the right person automatically. Strong opportunities move faster, and high-value leads do not get lost in the queue.': 'Eingehende Anfragen werden nach Passung, Dringlichkeit, Wert und Abschlusswahrscheinlichkeit qualifiziert und automatisch an die richtige Person weitergeleitet. Gute Chancen bewegen sich schneller, und hochwertige Leads gehen nicht in der Warteschlange verloren.',
  'Score your pipeline →': 'Pipeline bewerten →',
  'Fee-earners · Drafting': 'Fee-earners · Drafting',
  'Drafting workflow automation': 'Automatisierung von Drafting-Workflows',
  'The workflow reads the case file, pulls out the facts, and prepares first drafts of letters, summaries, legal documents, and client updates for human review. The lawyer keeps control, but loses the repetitive first pass.': 'Der Workflow liest die Akte, extrahiert die Fakten und erstellt erste Entwürfe für Schreiben, Zusammenfassungen, juristische Dokumente und Mandanten-Updates zur menschlichen Prüfung. Die anwaltliche Kontrolle bleibt erhalten, der repetitive erste Durchlauf entfällt.',
  'Design the drafting workflow →': 'Drafting-Workflow entwerfen →',
  'Operations · Back Office': 'Operations · Backoffice',
  'Less admin': 'Weniger Admin',
  'Back-office workflow automation': 'Automatisierung von Backoffice-Workflows',
  'Automation handles the admin that quietly slows firms down: chasing unsigned clients, reviving stalled matters, sending reminders, preparing invoices, collecting reviews, spotting complaint signals early, and watching email deliverability.': 'Automatisierung übernimmt die Admin-Arbeit, die Firmen leise ausbremst: nicht unterschriebene Mandanten nachfassen, ins Stocken geratene Vorgänge reaktivieren, Erinnerungen senden, Rechnungen vorbereiten, Reviews einsammeln, Beschwerdesignale früh erkennen und E-Mail-Zustellbarkeit überwachen.',
  'Remove admin drag →': 'Admin-Ballast entfernen →',
  'Hiring Teams · Recruitment': 'Hiring Teams · Recruitment',
  'Top 10%': 'Top 10 %',
  'Recruitment workflow automation': 'Automatisierung von Recruiting-Workflows',
  'Applications are screened against the role, candidates move through the funnel automatically, interviews are transcribed and summarised, and hiring managers see a shortlist worth their attention.': 'Bewerbungen werden gegen die Rolle geprüft, Kandidaten bewegen sich automatisch durch den Funnel, Interviews werden transkribiert und zusammengefasst, und Hiring Manager sehen eine Shortlist, die ihre Aufmerksamkeit verdient.',
  'Automate hiring →': 'Recruiting automatisieren →',
  'More case studies and articles →': 'Weitere Case Studies und Artikel →',
  'Common Questions': 'Häufige Fragen',
  'FAQ': 'FAQ',
  'We tried Zapier/Make before and it broke constantly. How is this different?': 'Wir haben Zapier/Make schon ausprobiert, und es ist ständig kaputtgegangen. Was ist hier anders?',
  "DIY platforms break because they're built for broad compatibility, not your specific process. We build custom automations — code that knows your exact data structure, your exact exceptions, your exact edge cases. It's the difference between a suit off the rack and one made to fit.": 'DIY-Plattformen brechen, weil sie für breite Kompatibilität gebaut sind, nicht für Ihren konkreten Prozess. Wir bauen maßgeschneiderte Automatisierungen - Code, der Ihre Datenstruktur, Ihre Ausnahmen und Ihre Edge Cases kennt. Das ist der Unterschied zwischen Konfektionsware und Maßanfertigung.',
  'Our data is sensitive. Where does it go?': 'Unsere Daten sind sensibel. Wohin gehen sie?',
  "Nowhere it doesn't already go. We build automations that run inside your existing cloud — Microsoft 365, Google Workspace, your CRM. We don't create new data stores. We don't have access to your data after the engagement ends. Full architecture documentation provided upfront.": 'Nirgendwohin, wohin sie nicht ohnehin schon gehen. Wir bauen Automatisierungen, die in Ihrer bestehenden Cloud laufen - Microsoft 365, Google Workspace, Ihr CRM. Wir schaffen keine neuen Datenspeicher. Nach Ende des Engagements haben wir keinen Zugriff mehr auf Ihre Daten. Die vollständige Architekturdokumentation erhalten Sie vorab.',
  "We don't have an IT team. Is that a problem?": 'Wir haben kein IT-Team. Ist das ein Problem?',
  "No — that's the majority of our clients. We handle all technical setup. Your team uses the automation through tools they already know: email, SharePoint, Teams, a shared spreadsheet. Nothing to install, no new logins, no IT involvement required.": 'Nein - das ist bei den meisten unserer Kunden so. Wir übernehmen die technische Einrichtung. Ihr Team nutzt die Automatisierung über Tools, die es bereits kennt: E-Mail, SharePoint, Teams oder eine gemeinsame Tabelle. Nichts zu installieren, keine neuen Logins, keine IT-Beteiligung erforderlich.',
  'No — that&#x27;s the majority of our clients. We handle all technical setup. Your team uses the automation through tools they already know: email, SharePoint, Teams, a shared spreadsheet. Nothing to install, no new logins, no IT involvement required.': 'Nein - das ist bei den meisten unserer Kunden so. Wir übernehmen die technische Einrichtung. Ihr Team nutzt die Automatisierung über Tools, die es bereits kennt: E-Mail, SharePoint, Teams oder eine gemeinsame Tabelle. Nichts zu installieren, keine neuen Logins, keine IT-Beteiligung erforderlich.',
  'How long does it actually take?': 'Wie lange dauert es tatsächlich?',
  'Process Audit: 2 hours of your time in Week 0. First automation: typically 3–4 weeks from kickoff to live testing. Your commitment: 2–3 hours in Week 1 for process mapping, then we do the work.': 'Process Audit: 2 Stunden Ihrer Zeit in Woche 0. Erste Automatisierung: typischerweise 3-4 Wochen vom Kick-off bis zum Live-Test. Ihr Aufwand: 2-3 Stunden in Woche 1 für das Process Mapping, danach übernehmen wir.',
  "We've had consultants before who wrote reports and nothing changed.": 'Wir hatten schon Berater, die Berichte geschrieben haben - und nichts hat sich geändert.',
  "We don't write reports. We build systems. The deliverable is a working automation, not a document. If it's not live and tested, the engagement isn't complete.": 'Wir schreiben keine Berichte. Wir bauen Systeme. Das Ergebnis ist eine funktionierende Automatisierung, kein Dokument. Wenn sie nicht live und getestet ist, ist das Engagement nicht abgeschlossen.',
  'Can we start with one process before committing to more?': 'Können wir mit einem Prozess starten, bevor wir uns zu mehr verpflichten?',
  "Yes — that's exactly how we structure it. One process, one Sprint, measurable results. You decide whether to continue. Most clients come back for a second process within 60 days.": 'Ja - genau so strukturieren wir es. Ein Prozess, ein Sprint, messbare Ergebnisse. Sie entscheiden, ob es weitergeht. Die meisten Kunden kommen innerhalb von 60 Tagen mit einem zweiten Prozess zurück.',
  'Yes — that&#x27;s exactly how we structure it. One process, one Sprint, measurable results. You decide whether to continue. Most clients come back for a second process within 60 days.': 'Ja - genau so strukturieren wir es. Ein Prozess, ein Sprint, messbare Ergebnisse. Sie entscheiden, ob es weitergeht. Die meisten Kunden kommen innerhalb von 60 Tagen mit einem zweiten Prozess zurück.',
  'What happens after 90 days?': 'Was passiert nach 90 Tagen?',
  "You own everything. Full documentation, full source code, full handover to your team. After 90 days you can maintain it yourself, have your IT team take over, or extend our support monthly. No dependency if you don't want it.": 'Alles gehört Ihnen. Vollständige Dokumentation, vollständiger Quellcode, vollständige Übergabe an Ihr Team. Nach 90 Tagen können Sie selbst warten, Ihr IT-Team übernehmen lassen oder unseren Support monatlich verlängern. Keine Abhängigkeit, wenn Sie sie nicht möchten.',
  'You own everything. Full documentation, full source code, full handover to your team. After 90 days you can maintain it yourself, have your IT team take over, or extend our support monthly. No dependency if you don&#x27;t want it.': 'Alles gehört Ihnen. Vollständige Dokumentation, vollständiger Quellcode, vollständige Übergabe an Ihr Team. Nach 90 Tagen können Sie selbst warten, Ihr IT-Team übernehmen lassen oder unseren Support monatlich verlängern. Keine Abhängigkeit, wenn Sie sie nicht möchten.',
  'What tools do you work with?': 'Mit welchen Tools arbeiten Sie?',
  'Microsoft 365 (SharePoint, Power Automate, Teams, Outlook, Excel), Google Workspace, Xero, Sage, QuickBooks, Salesforce, HubSpot, Pipedrive, and custom APIs. If you use it, we can likely connect it.': 'Microsoft 365 (SharePoint, Power Automate, Teams, Outlook, Excel), Google Workspace, Xero, Sage, QuickBooks, Salesforce, HubSpot, Pipedrive und Custom APIs. Wenn Sie es nutzen, können wir es wahrscheinlich anbinden.',
  'How do you calculate the ROI projection?': 'Wie berechnen Sie die ROI-Prognose?',
  'We time-audit the process with you — how long each step takes, how often it runs, how many people it involves. We apply your average loaded hourly cost. You get a conservative estimate of annual hours wasted and the payback period. We show you the maths.': 'Wir führen mit Ihnen ein Time Audit des Prozesses durch: wie lange jeder Schritt dauert, wie oft er läuft und wie viele Personen beteiligt sind. Dann wenden wir Ihre durchschnittlichen Vollkosten pro Stunde an. Sie erhalten eine konservative Schätzung der jährlich verlorenen Stunden und der Amortisationszeit. Wir zeigen die Rechnung offen.',
  "What if the process changes after you've built it?": 'Was passiert, wenn sich der Prozess nach dem Build ändert?',
  "Stable processes are automation candidates. If a process changes every few weeks, we'd tell you in the audit — it's not ready yet. Minor changes over time are covered in the 90-day support window. Larger changes are quoted separately.": 'Stabile Prozesse sind gute Automatisierungskandidaten. Wenn sich ein Prozess alle paar Wochen ändert, sagen wir das im Audit - er ist noch nicht bereit. Kleinere Änderungen im Laufe der Zeit sind im 90-Tage-Supportfenster enthalten. Größere Änderungen werden separat angeboten.',
  'Ready to Automate, Scale, and Grow?': 'Bereit, zu automatisieren, zu skalieren und zu wachsen?',
  "Book a free 30-minute discovery call. We'll identify your three biggest automation opportunities and map out the ROI — no cost, no commitment.": 'Buchen Sie einen kostenlosen 30-minütigen Discovery Call. Wir identifizieren Ihre drei größten Automatisierungschancen und skizzieren den ROI - kostenlos und unverbindlich.',
  'Automate. Scale. Grow.': 'Automatisieren. Skalieren. Wachsen.',
  'All rights reserved.': 'Alle Rechte vorbehalten.',
  'Built with AI': 'Gebaut mit KI'
}));

function relUrl(route) {
  return route;
}

function absUrl(route) {
  return `${devBaseUrl}${route === '/' ? '' : route}`;
}

function languageLinks(activeLocale) {
  return locales
    .map((locale) => {
      const active = locale === activeLocale ? ' active' : '';
      return `<a class="lang-btn${active}" id="btn-${locale}" href="${relUrl(routeByLocale[locale])}" hreflang="${locale}" lang="${locale}">${locale.toUpperCase()}</a>`;
    })
    .join('\n          ');
}

function hreflangHeadLinks() {
  return [
    ...locales.map((locale) => `<link rel="alternate" hreflang="${locale}" href="${absUrl(routeByLocale[locale])}">`),
    `<link rel="alternate" hreflang="x-default" href="${absUrl('/')}" />`
  ].join('\n  ');
}

function ensureFavicon(html) {
  if (html.includes('rel="icon"')) return html;
  return html.replace(
    /(<meta name="viewport"[^>]*>\s*)/,
    `$1\n  <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">\n  <link rel="alternate icon" href="/favicon.ico" type="image/x-icon">\n`
  );
}

function ensureDevNoindex(html) {
  if (!shouldNoindex) return html.replace(/\s*<meta name="robots" content="noindex, nofollow">/i, '');
  if (html.includes('name="robots" content="noindex')) return html;
  return html.replace(/<\/head>/i, '  <meta name="robots" content="noindex, nofollow">\n</head>');
}

function ensureBrandLogo(html) {
  return html
    .replaceAll(
      '<span class="brand-mark">A</span>',
      '<img class="brand-mark brand-logo" src="/favicon.svg" alt="AI Automation Studio logo" width="34" height="34">'
    )
    .replaceAll('href="#" class="nav-logo"', 'href="/" class="nav-logo"');
}

function ensureSharedDevCss(html) {
  const css = `
  <style id="aas-dev-overlay">
    .dev-lang-links, .lang-toggle { display: inline-flex; align-items: center; gap: 0; }
    .dev-lang-links { border: 1px solid var(--rule, #e5e4de); border-radius: 8px; overflow: hidden; background: #fff; }
    .dev-lang-links a { min-width: 38px; padding: 8px 10px; text-align: center; text-decoration: none; color: var(--muted, #66645f); font: 700 12px/1 Geist, Inter, system-ui, sans-serif; }
    .dev-lang-links a.active, .dev-lang-links a:hover { background: var(--accent, #0d9488); color: #fff; }
    .brand-logo { object-fit: contain; background: #0a0a0a !important; border-radius: 9px; padding: 0; }
    .lang-toggle a.lang-btn { text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
  </style>`;
  if (html.includes('id="aas-dev-overlay"')) return html;
  return html.replace('</head>', `${css}\n</head>`);
}

function plainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function addGermanSpanPairs(html) {
  return html.replace(
    /<span class="en">([\s\S]*?)<\/span>\s*<span class="ru">([\s\S]*?)<\/span>(?!\s*<span class="de">)/g,
    (match, enHtml, ruHtml) => {
      if (match.includes('class="de"')) return match;
      if (enHtml.includes('<span')) return match;
      const key = plainText(enHtml);
      const translation = deText.get(key);
      if (!translation) return match;
      return `<span class="en">${enHtml}</span><span class="ru">${ruHtml}</span><span class="de">${translation}</span>`;
    }
  );
}

function replaceIndustriesNavigation(html, activeLocale) {
  const caseRoute = activeLocale === 'en' ? '/cases/' : `/${activeLocale}/cases/`;
  return html
    .replaceAll('href="#industries"', `href="${caseRoute}"`)
    .replace(/<span class="en">Industries<\/span><span class="ru">Отрасли<\/span>(?:<span class="de">Branchen<\/span>)?/g, '<span class="en">Cases</span><span class="ru">Кейсы</span><span class="de">Cases</span>');
}

function ensureCaseStudyHashScroll(html) {
  if (html.includes('id="aas-case-study-hash-scroll"')) return html;
  const script = `<script id="aas-case-study-hash-scroll">
    (() => {
      const scrollToCaseStudies = () => {
        if (window.location.hash !== '#case-studies') return;
        const target = document.getElementById('case-studies');
        if (!target) return;
        const originalBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        target.scrollIntoView({ block: 'start' });
        document.documentElement.style.scrollBehavior = originalBehavior;
      };
      window.addEventListener('load', () => window.setTimeout(scrollToCaseStudies, 0));
      window.addEventListener('hashchange', scrollToCaseStudies);
    })();
  </script>`;
  return html.replace('</body>', `${script}\n</body>`);
}

function addGermanHeroTitle(html) {
  if (html.includes('<span class="de">\n            <span class="sp-word"><span>Automatisieren.</span></span>')) return html;
  const deHero = `          <span class="de">
            <span class="sp-word"><span>Automatisieren.</span></span><br>
            <span class="sp-word sp-accent">
              <span>Skalieren.</span>
              <svg class="sp-underline" viewBox="0 0 360 12" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 8 C 90 2, 180 11, 357 5" />
              </svg>
            </span>
            <br><span class="sp-word"><span>Wachsen.</span></span>
          </span>`;
  return html.replace(
    /(\s*<span class="ru">[\s\S]*?<br><span class="sp-word"><span>Расти\.<\/span><\/span>\s*<\/span>)(\s*<\/h1>)/,
    `$1\n${deHero}$2`
  );
}

function addGermanChatDialogues(html) {
  if (html.includes("de: 'Bankabstimmung'")) return html;
  const replacements = [
    ["topic: { en: 'Reconciliation', ru: 'Реконсиляция' }", "topic: { en: 'Reconciliation', ru: 'Реконсиляция', de: 'Bankabstimmung' }"],
    ["en: 'Can you reconcile invoices, contracts and payments from last year?',\n        ru: 'Можешь мне сделать реконсиляцию счетов, договоров и платежей за прошлый год?'", "en: 'Can you reconcile invoices, contracts and payments from last year?',\n        ru: 'Можешь мне сделать реконсиляцию счетов, договоров и платежей за прошлый год?',\n        de: 'Kannst du Rechnungen, Verträge und Zahlungen aus dem letzten Jahr abstimmen?'"],
    ["en: 'Yes, sure — where’s the data?',\n        ru: 'Да, конечно. Где у тебя лежат данные?'", "en: 'Yes, sure — where’s the data?',\n        ru: 'Да, конечно. Где у тебя лежат данные?',\n        de: 'Ja, gern. Wo liegen die Daten?'"],
    ["topic: { en: 'Content ops', ru: 'Контент' }", "topic: { en: 'Content ops', ru: 'Контент', de: 'Content Ops' }"],
    ["en: 'Hey, I’ll send you a video — can you cut Reels with subtitles?',\n        ru: 'Привет, я дам тебе видео — можешь нарезать рилсы с субтитрами?'", "en: 'Hey, I’ll send you a video — can you cut Reels with subtitles?',\n        ru: 'Привет, я дам тебе видео — можешь нарезать рилсы с субтитрами?',\n        de: 'Ich schicke dir ein Video. Kannst du daraus Reels mit Untertiteln schneiden?'"],
    ["en: 'Yes. Share the drive link. Instagram or LinkedIn format? Translation needed?',\n        ru: 'Да, конечно. Дай ссылку на диск, где видео. Формат под Instagram или LinkedIn? Нужен перевод?'", "en: 'Yes. Share the drive link. Instagram or LinkedIn format? Translation needed?',\n        ru: 'Да, конечно. Дай ссылку на диск, где видео. Формат под Instagram или LinkedIn? Нужен перевод?',\n        de: 'Ja. Schick mir den Drive-Link. Format für Instagram oder LinkedIn? Wird eine Übersetzung gebraucht?'"],
    ["topic: { en: 'Strategy', ru: 'Стратегия' }", "topic: { en: 'Strategy', ru: 'Стратегия', de: 'Strategie' }"],
    ["en: 'Hi. Read the brief, deep-dive competitors and trends, then build a business plan and financial model.',\n        ru: 'Привет. Посмотри описание проекта, сделай глубокий анализ конкурентов и трендов, затем бизнес-план и финансовую модель.'", "en: 'Hi. Read the brief, deep-dive competitors and trends, then build a business plan and financial model.',\n        ru: 'Привет. Посмотри описание проекта, сделай глубокий анализ конкурентов и трендов, затем бизнес-план и финансовую модель.',\n        de: 'Lies bitte das Briefing, analysiere Wettbewerber und Trends gründlich und erstelle danach Businessplan und Finanzmodell.'"],
    ["en: 'On it. I’ll review and ask clarifying questions until I understand the project at 99%.',\n        ru: 'Конечно. Я посмотрю и задам уточняющие вопросы, пока не пойму проект на 99%.'", "en: 'On it. I’ll review and ask clarifying questions until I understand the project at 99%.',\n        ru: 'Конечно. Я посмотрю и задам уточняющие вопросы, пока не пойму проект на 99%.',\n        de: 'Mache ich. Ich prüfe alles und stelle Rückfragen, bis ich das Projekt zu 99 % verstanden habe.'"],
    ["topic: { en: 'Finance · P&L', ru: 'Финансы · P&L' }", "topic: { en: 'Finance · P&L', ru: 'Финансы · P&L', de: 'Finance · P&L' }"],
    ["en: 'Hi, can you compare April P&L against the previous three months and analyse the trends?',\n        ru: 'Привет, можешь сравнить P&L за апрель и предыдущие три месяца и проанализировать тренды?'", "en: 'Hi, can you compare April P&L against the previous three months and analyse the trends?',\n        ru: 'Привет, можешь сравнить P&L за апрель и предыдущие три месяца и проанализировать тренды?',\n        de: 'Kannst du die April-P&L mit den drei vorherigen Monaten vergleichen und die Trends analysieren?'"],
    ["en: 'Done — refreshed the dashboard and dropped the report in the folder.',\n        ru: 'Да, обновил дэшборд и отчёт положил в папку.'", "en: 'Done — refreshed the dashboard and dropped the report in the folder.',\n        ru: 'Да, обновил дэшборд и отчёт положил в папку.',\n        de: 'Erledigt - das Dashboard ist aktualisiert, der Bericht liegt im Ordner.'"],
    ["topic: { en: 'Competitor watch', ru: 'Конкуренты' }", "topic: { en: 'Competitor watch', ru: 'Конкуренты', de: 'Wettbewerbsmonitoring' }"],
    ["en: 'Hi, monitor my 10 closest competitors — track their new products and services, plus customer comments on social.',\n        ru: 'Привет, регулярно смотри 10 моих ближайших конкурентов и отслеживай их новые продукты и услуги, а также комментарии клиентов в соцсетях.'", "en: 'Hi, monitor my 10 closest competitors — track their new products and services, plus customer comments on social.',\n        ru: 'Привет, регулярно смотри 10 моих ближайших конкурентов и отслеживай их новые продукты и услуги, а также комментарии клиентов в соцсетях.',\n        de: 'Beobachte bitte meine 10 wichtigsten Wettbewerber: neue Produkte und Services sowie Kundenkommentare auf Social Media.'"],
    ["en: 'I’ll send you a weekly brief by email.',\n        ru: 'Раз в неделю буду присылать тебе бриф на почту.'", "en: 'I’ll send you a weekly brief by email.',\n        ru: 'Раз в неделю буду присылать тебе бриф на почту.',\n        de: 'Ich schicke dir jede Woche ein kurzes Briefing per E-Mail.'"]
  ];
  return replacements.reduce((current, [from, to]) => current.replace(from, to), html);
}

function ensureSubpageSwitcher(html) {
  if (html.includes('class="dev-lang-links"')) return html;
  const switcher = `<div class="dev-lang-links" aria-label="Language versions">\n        <a href="/" hreflang="en" lang="en">EN</a>\n        <a href="/ru/" hreflang="ru" lang="ru">RU</a>\n        <a href="/de/" hreflang="de" lang="de">DE</a>\n      </div>`;
  if (html.includes('<div class="container nav-inner">')) {
    return html.replace(/(<div class="container nav-inner">[\s\S]*?)(\n\s*<\/div>\s*\n\s*<\/nav>)/, `$1\n      ${switcher}$2`);
  }
  return html;
}

function homepageVariant(sourceHtml, activeLocale) {
  let html = sourceHtml;
  html = ensureFavicon(html);
  html = ensureDevNoindex(html);
  html = ensureBrandLogo(html);
  html = ensureSharedDevCss(html);
  html = addGermanSpanPairs(html);
  html = addGermanHeroTitle(html);
  html = addGermanChatDialogues(html);
  html = replaceIndustriesNavigation(html, activeLocale);
  html = ensureCaseStudyHashScroll(html);
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${activeLocale}">`);
  html = html.replace(/<title>.*?<\/title>/, `<title>${titleByLocale[activeLocale]}</title>`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${absUrl(routeByLocale[activeLocale])}">\n  ${hreflangHeadLinks()}`);
  html = html.replace(
    /<div class="lang-toggle">\s*<button class="lang-btn active" id="btn-en" onclick="setLang\('en'\)">EN<\/button>\s*<button class="lang-btn"\s*id="btn-ru" onclick="setLang\('ru'\)">RU<\/button>\s*<\/div>/,
    `<div class="lang-toggle" aria-label="Language versions">\n          ${languageLinks(activeLocale)}\n        </div>`
  );
  html = html.replace(
    "document.querySelectorAll('.en, .ru').forEach(el => {\n      el.style.display = el.classList.contains(l) ? '' : 'none';\n    });",
    "document.querySelectorAll('.en, .ru, .de').forEach(el => {\n      el.style.display = el.classList.contains(l) ? '' : 'none';\n    });"
  );
  html = html.replace(
    "document.getElementById('btn-ru').classList.toggle('active', l === 'ru');",
    "document.getElementById('btn-ru')?.classList.toggle('active', l === 'ru');\n    document.getElementById('btn-de')?.classList.toggle('active', l === 'de');"
  );
  html = html.replace(
    "document.getElementById('btn-en').classList.toggle('active', l === 'en');",
    "document.getElementById('btn-en')?.classList.toggle('active', l === 'en');"
  );
  html = html.replace(
    "document.title = l === 'ru'\n      ? 'AI Automation Studio — Автоматизируй. Масштабируй. Расти.'\n      : 'AI Automation Studio — Automate. Scale. Grow.';",
    "document.title = l === 'ru'\n      ? 'AI Automation Studio — Автоматизируй. Масштабируй. Расти.'\n      : l === 'de'\n        ? 'AI Automation Studio — Automatisieren. Skalieren. Wachsen.'\n        : 'AI Automation Studio — Automate. Scale. Grow.';"
  );
  html = html.replace("setLang('en');", `setLang('${activeLocale}');`);
  return html;
}

async function walkHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

const homePath = path.join(deployRoot, 'index.html');
const sourceHome = await fs.readFile(homePath, 'utf8');

for (const locale of locales) {
  const route = routeByLocale[locale];
  const outputDir = path.join(deployRoot, route.replace(/^\/+|\/+$/g, ''));
  const outputPath = locale === 'en' ? homePath : path.join(outputDir, 'index.html');
  if (locale !== 'en') await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, homepageVariant(sourceHome, locale));
}

const htmlFiles = await walkHtmlFiles(deployRoot);
for (const file of htmlFiles) {
  if ([homePath, path.join(deployRoot, 'ru', 'index.html'), path.join(deployRoot, 'de', 'index.html')].includes(file)) {
    continue;
  }
  let html = await fs.readFile(file, 'utf8');
  html = ensureFavicon(html);
  html = ensureDevNoindex(html);
  html = ensureBrandLogo(html);
  html = ensureSharedDevCss(html);
  html = ensureSubpageSwitcher(html);
  await fs.writeFile(file, html);
}

await import('./i18n/render-insights-hubs.mjs');

console.log(`Dev overlay applied: language URLs ${locales.map((locale) => routeByLocale[locale]).join(', ')}`);
