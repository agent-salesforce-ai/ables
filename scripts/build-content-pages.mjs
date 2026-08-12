import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://ables.ai';
const published = '2026-08-09';

function absoluteUrl(pagePath) {
  return `${origin}${pagePath}`;
}

function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function mainSchema(page) {
  const base = {
    '@id': `${absoluteUrl(page.path)}#main`,
    url: absoluteUrl(page.path),
    name: page.h1,
    description: page.description,
    inLanguage: 'en-US',
  };

  if (page.schema === 'CollectionPage') {
    return {
      '@type': 'CollectionPage',
      ...base,
      isPartOf: { '@id': `${origin}/#website` },
      about: { '@id': `${origin}/#organization` },
    };
  }

  if (page.schema === 'Article') {
    return {
      '@type': 'Article',
      ...base,
      headline: page.h1,
      datePublished: published,
      dateModified: published,
      author: { '@id': `${origin}/#organization` },
      publisher: { '@id': `${origin}/#organization` },
      mainEntityOfPage: absoluteUrl(page.path),
    };
  }

  if (page.schema === 'WebApplication') {
    return {
      '@type': 'WebApplication',
      ...base,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      browserRequirements: 'JavaScript',
      isAccessibleForFree: true,
      creator: { '@id': `${origin}/#organization` },
    };
  }

  return {
    '@type': 'Service',
    ...base,
    serviceType: page.serviceType,
    provider: { '@id': `${origin}/#organization` },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Small-business lenders and funding teams',
    },
  };
}

function brand() {
  return `<a class="brand" href="/" aria-label="Ables home">
        <svg width="34" height="20" viewBox="0 0 28 16" aria-hidden="true"><ellipse cx="12" cy="8" rx="11" ry="3.2" stroke="currentColor" stroke-width=".7" fill="none" opacity=".42" transform="rotate(-20 12 8)"/><circle cx="12" cy="8" r="5" fill="currentColor" opacity=".12"/><circle cx="12" cy="8" r="3.6" fill="currentColor" opacity=".32"/><circle cx="12" cy="8" r="2.8" fill="currentColor"/></svg>
        Ables
      </a>`;
}

function layout(page) {
  const url = absoluteUrl(page.path);
  const breadcrumbs = [{ name: 'Home', path: '/' }, ...page.breadcrumbs];
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbSchema(breadcrumbs), mainSchema(page)],
  };
  const toc = page.toc.map((item) => `<a href="#${item.id}">${item.label}</a>`).join('\n        ');
  const breadcrumbHtml = breadcrumbs.map((item, index) => {
    const isLast = index === breadcrumbs.length - 1;
    return `<li>${isLast ? `<span aria-current="page">${item.name}</span>` : `<a href="${item.path}">${item.name}</a>`}</li>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NLL9GDQY8S"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-NLL9GDQY8S', {
      page_location: '${url}',
      page_referrer: document.referrer ? new URL(document.referrer).origin : ''
    });
  </script>
  <script defer src="/analytics.js?v=60102cc503b3"></script>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${page.title}</title>
  <meta name="description" content="${page.description}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta property="og:type" content="${page.schema === 'Article' ? 'article' : 'website'}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.description}" />
  <meta property="og:image" content="https://ables.ai/og-cover.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="/company.css?v=20260809a" />
  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
  ${page.head || ''}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-nav">
    <div class="wrap nav-inner">
      ${brand()}
      <nav class="nav-links" aria-label="Primary">
        <a href="/solutions/">Solutions</a>
        <a href="/integrations/">Integrations</a>
        <a href="/resources/">Resources</a>
        <a href="/security/">Security</a>
        <a class="nav-cta" href="/#cta">Book a demo</a>
      </nav>
    </div>
  </header>

  <nav class="breadcrumb" aria-label="Breadcrumb"><div class="wrap"><ol>${breadcrumbHtml}</ol></div></nav>

  <main id="main">
    <section class="page-hero page-hero--commercial">
      <div class="wrap">
        <p class="eyebrow">${page.eyebrow}</p>
        <h1>${page.h1}</h1>
        <p class="lead">${page.lead}</p>
        <div class="hero-actions">
          <a class="button" href="/#cta">Book a workflow review <span aria-hidden="true">→</span></a>
          <a class="button button--secondary" href="${page.secondaryHref}">${page.secondaryLabel}</a>
        </div>
      </div>
    </section>

    <div class="wrap content-shell content-shell--wide">
      <aside class="toc" aria-label="On this page">
        <strong>On this page</strong>
        ${toc}
      </aside>
      <article class="prose">
        ${page.body}
      </article>
    </div>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-inner">
      <div>© 2026 Ables · AI workflow software for small-business lenders</div>
      <div class="footer-links"><a href="/solutions/">Solutions</a><a href="/integrations/">Integrations</a><a href="/resources/">Resources</a><a href="/about/">About</a><a href="/security/">Security</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="mailto:zak@ables.ai">Contact</a></div>
    </div>
  </footer>
  ${page.script || ''}
</body>
</html>
`.replace(/[ \t]+$/gm, '');
}

const cta = (heading, copy) => `<section class="cta-panel" aria-labelledby="page-cta"><h2 id="page-cta">${heading}</h2><p>${copy}</p><a class="button" href="/#cta">Book a workflow review <span aria-hidden="true">→</span></a></section>`;

const pages = [
  {
    path: '/solutions/', schema: 'CollectionPage',
    title: 'Lending Workflow Automation Solutions | Ables',
    description: 'Explore Ables workflows for lender intake, qualification, bank-statement review, risk scoring, offer creation, and follow-up.',
    eyebrow: 'Solutions',
    h1: 'Connect the lending work that happens between systems.',
    lead: 'Ables supports AI-assisted workflows across intake, communications, document review, configured risk rules, offer routing, and follow-up—with review points defined for each deployment.',
    breadcrumbs: [{ name: 'Solutions', path: '/solutions/' }],
    secondaryHref: '/resources/evaluate-ai-underwriting-software/', secondaryLabel: 'Read the evaluation guide',
    toc: [{ id: 'workflows', label: 'Workflow areas' }, { id: 'pipeline', label: 'Connected pipeline' }, { id: 'controls', label: 'Shared controls' }, { id: 'scope', label: 'Scope a review' }],
    body: `
      <p class="section-kicker">Start with the bottleneck</p>
      <h2 id="workflows">Workflow areas</h2>
      <p class="intro">A deployment can begin with one repetitive workflow or connect several stages. The useful starting point is the work your team can describe, test, and review—not a promise that every process should be automated.</p>
      <div class="link-grid">
        <a class="link-card" href="/solutions/lending-workflow-automation/"><span class="label">Connected operations</span><h3>Lending workflow automation</h3><p>Map intake, documents, rules, handoffs, offers, and follow-up as one reviewable sequence.</p><span class="link-end">Explore the workflow →</span></a>
        <a class="link-card" href="/solutions/bank-statement-review/"><span class="label">Document review · Vision</span><h3>Bank-statement review</h3><p>Surface revenue, recurring obligations, and items that need an underwriter’s attention.</p><span class="link-end">Review the approach →</span></a>
        <a class="link-card" href="/solutions/lender-lead-qualification/"><span class="label">Communications · Hubble + Reply</span><h3>Lender lead qualification</h3><p>Coordinate approved outreach, two-way conversations, qualification, opt-outs, and human routing.</p><span class="link-end">See the controls →</span></a>
        <a class="link-card" href="/solutions/configurable-risk-scoring/"><span class="label">Risk rules · Tier</span><h3>Configurable risk scoring</h3><p>Apply configured rules and data checks, then present a tier and written rationale for review.</p><span class="link-end">Examine the workflow →</span></a>
        <a class="link-card" href="/solutions/offer-and-renewal-workflows/"><span class="label">Offers + follow-up · Calculator + Drip</span><h3>Offer and renewal workflows</h3><p>Route approved terms, offer delivery steps, renewal signals, and configured follow-up.</p><span class="link-end">Follow the lifecycle →</span></a>
      </div>

      <p class="section-kicker">A real sequence</p>
      <h2 id="pipeline">One connected pipeline, six reviewable stages</h2>
      <div class="workflow-ledger">
        <div class="workflow-step"><span class="step-label">01 · Hubble</span><div><h3>Approved outreach</h3><p>Coordinate SMS, email, and voice activity from customer-approved data sources and configured campaigns.</p></div></div>
        <div class="workflow-step"><span class="step-label">02 · Reply</span><div><h3>Qualification</h3><p>Support two-way conversations, capture qualification details, record opt-out events, and route handoffs.</p></div></div>
        <div class="workflow-step"><span class="step-label">03 · Vision</span><div><h3>Document review</h3><p>Review bank-statement data, identify recurring obligations, and surface items for underwriter review.</p></div></div>
        <div class="workflow-step"><span class="step-label">04 · Tier</span><div><h3>Configured scoring</h3><p>Apply customer-configured risk rules and data checks to produce a reviewable tier and rationale.</p></div></div>
        <div class="workflow-step"><span class="step-label">05 · Calculator</span><div><h3>Offer workflow</h3><p>Build offers from approved terms and route them through configured review and delivery steps.</p></div></div>
        <div class="workflow-step"><span class="step-label">06 · Drip</span><div><h3>Follow-up</h3><p>Support renewal targeting, abandoned-application follow-up, payment monitoring, and configured risk alerts.</p></div></div>
      </div>

      <h2 id="controls">Controls shared across the workflow</h2>
      <div class="control-list">
        <div class="control-item"><strong>Human checkpoints</strong><p>Define where a person reviews, approves, changes, or stops the workflow.</p></div>
        <div class="control-item"><strong>Traceable handoffs</strong><p>Record material workflow actions and the context passed between systems.</p></div>
        <div class="control-item"><strong>Deployment-specific access</strong><p>Limit data and system access to the workflow being implemented.</p></div>
        <div class="control-item"><strong>Explicit customer rules</strong><p>Use the lender’s approved policies and terms rather than treating a demo configuration as policy.</p></div>
      </div>
      <div class="truth-note"><strong>Scope varies by deployment.</strong><p>Model providers, integrations, data access, service levels, retention, and security commitments must be confirmed for the proposed implementation. Ables does not replace underwriting judgment, legal review, or a customer’s compliance program.</p></div>

      <h2 id="scope">Scope a representative review</h2>
      <p>Choose one workflow, identify the systems and data it touches, mark the required human approvals, and agree on what your team will measure. A representative sample can then be used to examine output quality, exceptions, handoffs, and operating fit before production access is connected.</p>
      <div class="related-links"><a href="/integrations/">Integration options</a><a href="/resources/workflow-readiness-assessment/">Workflow readiness assessment</a><a href="/security/">Security review</a></div>
      ${cta('Review the workflow your team already runs.', 'Bring one defined workflow to a walkthrough. We can discuss its inputs, handoffs, review points, integration scope, and appropriate evaluation criteria.')}
    `,
  },
  {
    path: '/solutions/lending-workflow-automation/', schema: 'Service', serviceType: 'Lending workflow automation',
    title: 'Lending Workflow Automation for Funding Teams | Ables',
    description: 'Map lender intake, document review, configured risk rules, offer workflows, and follow-up into a connected, reviewable process.',
    eyebrow: 'Solution · Connected operations',
    h1: 'Lending workflow automation with visible handoffs.',
    lead: 'Connect the repetitive work around your lending team while preserving the review points, rules, and system boundaries that the process requires.',
    breadcrumbs: [{ name: 'Solutions', path: '/solutions/' }, { name: 'Lending workflow automation', path: '/solutions/lending-workflow-automation/' }],
    secondaryHref: '/integrations/', secondaryLabel: 'Review integration options',
    toc: [{ id: 'scope', label: 'What it connects' }, { id: 'sequence', label: 'Workflow sequence' }, { id: 'oversight', label: 'Human oversight' }, { id: 'evaluation', label: 'How to evaluate' }],
    body: `
      <p class="section-kicker">Workflow scope</p><h2 id="scope">What a connected workflow can cover</h2>
      <p>Funding operations often span a CRM, inboxes, messaging channels, document tools, spreadsheets, and review queues. Ables is designed to connect selected steps around those systems. Depending on the deployment, that can include lead routing, SMS and email conversations, bank-statement review, recurring-obligation detection, configured risk-rule application, offer routing, and renewal follow-up.</p>
      <p>The scope should be narrow enough to test. A first implementation might connect qualification to a human handoff, or document review to a configured risk queue. It does not need to replace every system or automate every exception.</p>
      <div class="cards"><div class="card"><h3>Start from the operating process</h3><p>Document where data enters, which actions are repetitive, and where a person must decide.</p></div><div class="card"><h3>Connect only what is required</h3><p>Choose systems, fields, credentials, and events for the agreed workflow rather than opening broad access.</p></div></div>

      <p class="section-kicker">Handoffs</p><h2 id="sequence">A sequence the team can inspect</h2>
      <div class="workflow-ledger">
        <div class="workflow-step"><span class="step-label">Input</span><div><h3>Receive approved data</h3><p>Identify the customer-approved source, expected fields, document types, and event that begins the workflow.</p></div></div>
        <div class="workflow-step"><span class="step-label">Prepare</span><div><h3>Handle repeatable work</h3><p>Route, classify, summarize, or apply configured rules to the portion of the process selected for automation.</p></div></div>
        <div class="workflow-step"><span class="step-label">Review</span><div><h3>Present context to a person</h3><p>Keep the relevant inputs, checks, and written rationale available for the person responsible for the next step.</p></div></div>
        <div class="workflow-step"><span class="step-label">Record</span><div><h3>Write back the approved outcome</h3><p>Define which system receives the status, note, task, offer, or follow-up event after review.</p></div></div>
      </div>

      <h2 id="oversight">Automation does not remove accountability</h2>
      <p>Customers remain responsible for underwriting decisions, legal and compliance obligations, communication policies, and the terms they approve. Model outputs can be incomplete or wrong. The implementation should document escalation paths, override behavior, stop conditions, and the material actions that need an audit record.</p>
      <div class="truth-note"><strong>No universal deployment is implied.</strong><p>Integration behavior, model routing, private infrastructure, retention, support, and service levels vary and should be documented in the applicable agreement.</p></div>

      <h2 id="evaluation">Evaluate the process, not a generic demo</h2>
      <ul><li>Select a representative workflow and sample.</li><li>Define the expected inputs, outputs, exceptions, and human checkpoints.</li><li>Measure the current process using your own baseline.</li><li>Review output quality and reconciliation, not only speed.</li><li>Confirm security, access, retention, and operational ownership.</li></ul>
      <p>Use the <a class="plain-link" href="/resources/workflow-readiness-assessment/">workflow readiness assessment</a> to structure the first discussion, then review the <a href="/resources/evaluate-ai-underwriting-software/">AI underwriting software evaluation guide</a>.</p>
      ${cta('Map one workflow end to end.', 'A walkthrough can focus on the systems, handoffs, controls, and evaluation criteria for a representative lending workflow.')}
    `,
  },
  {
    path: '/solutions/bank-statement-review/', schema: 'Service', serviceType: 'AI-assisted bank-statement review for lenders',
    title: 'AI Bank-Statement Review for Lenders | Ables Vision',
    description: 'Review bank-statement data, recurring obligations, revenue, and flagged items in an AI-assisted workflow designed for underwriter review.',
    eyebrow: 'Solution · Document review · Vision',
    h1: 'Bank-statement review that routes evidence to an underwriter.',
    lead: 'Vision reviews bank-statement data, identifies recurring obligations, and surfaces revenue, obligations, and flagged items for a person to verify.',
    breadcrumbs: [{ name: 'Solutions', path: '/solutions/' }, { name: 'Bank-statement review', path: '/solutions/bank-statement-review/' }],
    secondaryHref: '/resources/evaluate-ai-underwriting-software/', secondaryLabel: 'Use the evaluation checklist',
    toc: [{ id: 'workflow', label: 'Review workflow' }, { id: 'outputs', label: 'Outputs and limits' }, { id: 'controls', label: 'Review controls' }, { id: 'pilot', label: 'Pilot evidence' }],
    body: `
      <p class="section-kicker">Vision</p><h2 id="workflow">From customer-provided files to a review queue</h2>
      <p>Bank-statement work is useful only when the reviewer can trace the output back to the submitted material and handle exceptions. A Vision deployment begins by defining the accepted input, the information to surface, and the person responsible for verification.</p>
      <div class="workflow-ledger">
        <div class="workflow-step"><span class="step-label">01 · Intake</span><div><h3>Receive the agreed bank files</h3><p>Define the approved channel, document set, period, and completeness checks for the deployment.</p></div></div>
        <div class="workflow-step"><span class="step-label">02 · Review</span><div><h3>Structure the selected information</h3><p>Review statement data for revenue, recurring obligations, and items configured for attention.</p></div></div>
        <div class="workflow-step"><span class="step-label">03 · Surface</span><div><h3>Show outputs and flags</h3><p>Present the information needed by the underwriter without representing it as an independent credit decision.</p></div></div>
        <div class="workflow-step"><span class="step-label">04 · Verify</span><div><h3>Resolve exceptions and continue</h3><p>The assigned reviewer verifies the source material, handles uncertainty, and decides the appropriate next step.</p></div></div>
      </div>

      <h2 id="outputs">What the workflow can surface</h2>
      <div class="control-list"><div class="control-item"><strong>Revenue information</strong><p>Statement-derived revenue information selected for the customer’s review process.</p></div><div class="control-item"><strong>Recurring obligations</strong><p>Repeated obligations or patterns configured for the workflow to identify.</p></div><div class="control-item"><strong>Items requiring attention</strong><p>Missing, inconsistent, or policy-relevant items that should be reviewed by a person.</p></div><div class="control-item"><strong>Workflow context</strong><p>Enough context to route the file and support the next review step.</p></div></div>
      <p>Results depend on document quality, completeness, data interpretation, configuration, and the workflow’s supported inputs. An output should be checked against the source material before it informs a lending decision.</p>

      <h2 id="controls">Controls to define before connecting files</h2>
      <ul><li>Accepted document types, periods, and submission channels.</li><li>Required completeness and reconciliation checks.</li><li>How uncertainty, duplicates, and unreadable material are handled.</li><li>Which outputs can move automatically and which require approval.</li><li>Who can access the files, outputs, and workflow record.</li><li>Retention and deletion expectations for the proposed deployment.</li></ul>
      <div class="truth-note"><strong>Vision supports review; it is not a substitute for underwriting judgment.</strong><p>No accuracy rate, processing-time guarantee, or autonomous decision claim is made on this page. Those questions should be tested on an agreed sample.</p></div>

      <h2 id="pilot">Evidence to collect in a controlled pilot</h2>
      <p>Use a representative, approved sample and compare outputs against the lender’s own reviewed result. Track field-level agreement where applicable, missing or uncertain items, reconciliation differences, exception reasons, reviewer corrections, and the time required for the complete human process.</p>
      <p>Do not connect customer financial data through the public demo form. File access, security, retention, and the sample protocol should be agreed before testing.</p>
      <div class="related-links"><a href="/solutions/configurable-risk-scoring/">Configured risk scoring</a><a href="/integrations/api-webhooks/">API and webhooks</a><a href="/security/">Security review</a></div>
      ${cta('Review a representative document workflow.', 'Discuss the accepted inputs, outputs, exceptions, review steps, and evidence required for a controlled evaluation.')}
    `,
  },
  {
    path: '/solutions/lender-lead-qualification/', schema: 'Service', serviceType: 'Lead qualification and communication workflows for lenders',
    title: 'AI Lead Qualification for Business Lenders | Ables',
    description: 'Coordinate approved lender outreach, two-way qualification, opt-out handling, and human routing across configured messaging workflows.',
    eyebrow: 'Solution · Communications · Hubble + Reply',
    h1: 'Lender lead qualification with explicit routing and opt-out controls.',
    lead: 'Coordinate approved outreach and two-way conversations, capture qualification details, record opt-out events, and hand the conversation to the right person.',
    breadcrumbs: [{ name: 'Solutions', path: '/solutions/' }, { name: 'Lender lead qualification', path: '/solutions/lender-lead-qualification/' }],
    secondaryHref: '/integrations/telnyx/', secondaryLabel: 'Review Telnyx workflows',
    toc: [{ id: 'workflow', label: 'Conversation workflow' }, { id: 'channels', label: 'Channels' }, { id: 'controls', label: 'Required controls' }, { id: 'measure', label: 'What to measure' }],
    body: `
      <p class="section-kicker">Hubble + Reply</p><h2 id="workflow">Move from an approved campaign to a human handoff</h2>
      <p>Hubble coordinates outreach from approved customer data sources and configured campaigns. Reply supports two-way conversations, routes objections, captures qualification details, and records opt-out events. The purpose is to organize the conversation and handoff—not to remove ownership from the customer’s team.</p>
      <div class="workflow-ledger"><div class="workflow-step"><span class="step-label">Campaign</span><div><h3>Use approved data and rules</h3><p>Define the audience, message policy, permitted channels, schedule, and customer owner.</p></div></div><div class="workflow-step"><span class="step-label">Conversation</span><div><h3>Handle configured interactions</h3><p>Support two-way responses and capture the qualification details selected for the workflow.</p></div></div><div class="workflow-step"><span class="step-label">Control</span><div><h3>Record stop signals</h3><p>Apply the deployment’s opt-out handling, DNC checks, quiet-hour policy, and message-level records.</p></div></div><div class="workflow-step"><span class="step-label">Handoff</span><div><h3>Route the conversation</h3><p>Send qualified or exceptional conversations to the designated person with the relevant context.</p></div></div></div>

      <h2 id="channels">Channels depend on the deployment</h2>
      <p>Current Ables implementations include SMS through Telnyx and email through Microsoft Graph or the Gmail API. Voice workflows are deployment-specific. Channel availability, sender configuration, throughput, content rules, and escalation behavior must be confirmed during discovery.</p>
      <p>See the <a href="/integrations/telnyx/">Telnyx integration page</a> and <a href="/integrations/microsoft-email/">Microsoft and Gmail email workflow page</a> for the questions that should be answered before implementation.</p>

      <h2 id="controls">Controls belong in the operating design</h2>
      <div class="control-list"><div class="control-item"><strong>Customer-approved audience</strong><p>Use only the data sources and campaign scope the customer is authorized to use.</p></div><div class="control-item"><strong>Opt-out handling</strong><p>Define how stop requests are recognized, recorded, confirmed, and prevented from re-entry.</p></div><div class="control-item"><strong>Quiet hours and DNC checks</strong><p>Document the policies, source systems, ownership, and failure behavior.</p></div><div class="control-item"><strong>Human escalation</strong><p>Identify which responses, objections, or exceptions require a person.</p></div></div>
      <div class="truth-note"><strong>Customers remain responsible for their communications program.</strong><p>Ables does not provide legal advice or guarantee compliance. Applicable consent, telemarketing, DNC, recording, content, and state-law requirements should be reviewed by the customer and its counsel.</p></div>

      <h2 id="measure">Measure the complete conversation workflow</h2>
      <p>Define metrics from the customer’s own baseline: valid delivery, response classification, qualification completeness, opt-out handling, incorrect routing, human corrections, time to handoff, and downstream lead quality. Avoid treating reply volume alone as evidence of business value.</p>
      <div class="source-list"><h2>External reference</h2><ul><li><a href="https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200" rel="noopener noreferrer">Current eCFR text for 47 CFR § 64.1200</a> — a starting point for regulatory context, not a substitute for legal advice.</li></ul></div>
      ${cta('Review a controlled qualification workflow.', 'Bring the audience, channels, routing rules, stop conditions, and handoff requirements for one approved campaign.')}
    `,
  },
  {
    path: '/solutions/configurable-risk-scoring/', schema: 'Service', serviceType: 'Configurable risk scoring workflow for lenders',
    title: 'Configurable Risk Scoring for Lenders | Ables Tier',
    description: 'Apply lender-configured risk rules and data checks to produce a reviewable tier and written rationale with human approval points.',
    eyebrow: 'Solution · Risk rules · Tier',
    h1: 'Configured risk scoring with a rationale your team can review.',
    lead: 'Tier applies configured risk rules and data checks to produce a reviewable tier and written rationale. The lender remains responsible for the policy and decision.',
    breadcrumbs: [{ name: 'Solutions', path: '/solutions/' }, { name: 'Configurable risk scoring', path: '/solutions/configurable-risk-scoring/' }],
    secondaryHref: '/security/', secondaryLabel: 'Review security principles',
    toc: [{ id: 'workflow', label: 'Scoring workflow' }, { id: 'governance', label: 'Governance' }, { id: 'evidence', label: 'Evaluation evidence' }, { id: 'references', label: 'References' }],
    body: `
      <p class="section-kicker">Tier</p><h2 id="workflow">Put the customer’s rules before the output</h2>
      <p>A scoring workflow should begin with the lender’s approved criteria, defined inputs, and review obligations. Tier is designed to apply configured rules and data checks, then present a tier and written rationale for review. It should not be treated as a universal credit policy or an independent approval authority.</p>
      <div class="workflow-ledger"><div class="workflow-step"><span class="step-label">Policy</span><div><h3>Define the approved rules</h3><p>Identify criteria, thresholds, exclusions, required data, and the owner authorized to change them.</p></div></div><div class="workflow-step"><span class="step-label">Inputs</span><div><h3>Validate the selected data</h3><p>Confirm source, freshness, completeness, and what happens when an input is missing or uncertain.</p></div></div><div class="workflow-step"><span class="step-label">Apply</span><div><h3>Run configured checks</h3><p>Apply the agreed rules and prepare the resulting tier and rationale.</p></div></div><div class="workflow-step"><span class="step-label">Review</span><div><h3>Keep a person accountable</h3><p>Present the inputs, checks, rationale, exceptions, and available override path to the assigned reviewer.</p></div></div></div>

      <h2 id="governance">Questions the implementation must answer</h2>
      <ul><li>Who owns the policy and can approve a rule change?</li><li>Which source supplies each input, and how is freshness checked?</li><li>What happens when data is absent, contradictory, or outside the supported range?</li><li>Which outputs require human approval before they affect a customer?</li><li>How are overrides, corrections, versions, and material actions recorded?</li><li>How will the lender review performance, errors, and drift over time?</li></ul>
      <div class="truth-note"><strong>Model outputs can be incomplete or wrong.</strong><p>No scoring accuracy, approval lift, loss-rate reduction, or autonomous-decision claim is made here. Legal, fair-lending, adverse-action, model-risk, and documentation obligations depend on the customer’s use and should be reviewed by qualified counsel and compliance staff.</p></div>

      <h2 id="evidence">Evidence for a representative evaluation</h2>
      <p>Compare the configured workflow with a lender-reviewed sample. Record agreement and disagreement by rule, missing inputs, reason quality, reviewer corrections, overrides, exceptions, and the downstream decision made by the authorized person. Preserve the sample definition and version of the rules so the result can be reproduced.</p>
      <p>Review whether the rationale is useful to the assigned reviewer; a fluent explanation is not evidence that the underlying output is correct.</p>

      <div class="source-list"><h2 id="references">Primary references for evaluation planning</h2><ul><li><a href="https://www.nist.gov/itl/ai-risk-management-framework" rel="noopener noreferrer">NIST AI Risk Management Framework</a></li><li><a href="https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm" rel="noopener noreferrer">Federal Reserve SR 26-2 revised model risk management guidance</a></li><li><a href="https://www.consumerfinance.gov/compliance/circulars/circular-2022-03-adverse-action-notification-requirements-in-connection-with-credit-decisions-based-on-complex-algorithms/" rel="noopener noreferrer">CFPB circular on adverse-action notices and complex algorithms</a></li></ul><p>Applicability varies. These links are provided for evaluation context, not as a claim that any particular framework or rule applies to every Ables deployment.</p></div>
      ${cta('Review the rules, inputs, and approval path.', 'A walkthrough can focus on one configured scoring workflow and the evidence your team needs to evaluate it responsibly.')}
    `,
  },
  {
    path: '/solutions/offer-and-renewal-workflows/', schema: 'Service', serviceType: 'Offer and renewal workflow automation for lenders',
    title: 'Lending Offer and Renewal Workflow Automation | Ables',
    description: 'Route customer-approved offer terms, delivery steps, renewal targeting, abandoned applications, payment signals, and configured alerts.',
    eyebrow: 'Solution · Lifecycle · Calculator + Drip',
    h1: 'Offer and follow-up workflows built around approved terms.',
    lead: 'Calculator builds offers from customer-approved terms and configured review steps. Drip supports renewal targeting, abandoned-application follow-up, payment monitoring, and configured risk alerts.',
    breadcrumbs: [{ name: 'Solutions', path: '/solutions/' }, { name: 'Offer and renewal workflows', path: '/solutions/offer-and-renewal-workflows/' }],
    secondaryHref: '/integrations/zoho-crm/', secondaryLabel: 'Review CRM integration questions',
    toc: [{ id: 'offers', label: 'Offer workflow' }, { id: 'follow-up', label: 'Follow-up workflow' }, { id: 'controls', label: 'Controls' }, { id: 'evaluate', label: 'How to evaluate' }],
    body: `
      <p class="section-kicker">Calculator</p><h2 id="offers">Move approved terms through a defined offer process</h2>
      <p>Calculator supports offer creation from terms the customer has approved, including daily, weekly, or monthly payment frequencies. A deployment defines where those terms come from, who can approve or change them, what the generated offer contains, and which delivery steps are allowed.</p>
      <div class="workflow-ledger"><div class="workflow-step"><span class="step-label">Terms</span><div><h3>Receive approved inputs</h3><p>Use the source, fields, and approval status selected for the customer’s process.</p></div></div><div class="workflow-step"><span class="step-label">Build</span><div><h3>Prepare the configured offer</h3><p>Apply the selected payment frequency and presentation rules without inventing or changing customer policy.</p></div></div><div class="workflow-step"><span class="step-label">Review</span><div><h3>Confirm before delivery</h3><p>Route the offer through the approvals required by the deployment.</p></div></div><div class="workflow-step"><span class="step-label">Record</span><div><h3>Capture the approved action</h3><p>Write the appropriate status or activity to the designated system.</p></div></div></div>

      <p class="section-kicker">Drip</p><h2 id="follow-up">Continue only with configured signals and rules</h2>
      <p>Drip supports renewal targeting, abandoned-application follow-up, payment monitoring, and configured risk alerts. Each use case requires its own eligibility rules, source event, message or task policy, stop conditions, human owner, and write-back behavior.</p>
      <div class="cards"><div class="card"><h3>Renewal targeting</h3><p>Define the source signal, eligibility criteria, exclusions, and assigned owner.</p></div><div class="card"><h3>Abandoned applications</h3><p>Define what counts as abandoned, when follow-up is permitted, and when it stops.</p></div><div class="card"><h3>Payment monitoring</h3><p>Define the approved source, monitored event, and appropriate response path.</p></div><div class="card"><h3>Configured alerts</h3><p>Define the condition, recipient, context, and required human action.</p></div></div>

      <h2 id="controls">Keep policy and communication ownership explicit</h2>
      <ul><li>Only customer-approved terms should enter the offer workflow.</li><li>Changes, overrides, and approvals should identify the responsible person.</li><li>Renewal and follow-up eligibility should be documented and testable.</li><li>Communication opt-outs and stop conditions should apply across relevant workflows.</li><li>Alerts should state what happened without implying a decision that the underlying signal cannot support.</li></ul>
      <div class="truth-note"><strong>Ables does not set the lender’s credit policy or legal terms.</strong><p>The customer remains responsible for offer accuracy, approvals, disclosures, communications, underwriting judgment, and compliance obligations.</p></div>

      <h2 id="evaluate">Evaluate each lifecycle stage separately</h2>
      <p>For offers, compare the generated terms and document against the approved source and review every variance. For renewals and follow-up, evaluate eligibility, exclusions, opt-out behavior, routing accuracy, human corrections, and downstream lead quality. For payment alerts, test both expected events and failure conditions.</p>
      <div class="related-links"><a href="/integrations/zoho-crm/">Zoho CRM</a><a href="/integrations/api-webhooks/">API and webhooks</a><a href="/solutions/lender-lead-qualification/">Qualification controls</a></div>
      ${cta('Review one offer or follow-up path.', 'Discuss the approved source data, human checkpoints, stop conditions, delivery rules, and evidence required for a controlled workflow.')}
    `,
  },
  {
    path: '/integrations/', schema: 'CollectionPage',
    title: 'Lending Workflow Integrations | Ables',
    description: 'Review Ables integration options for Zoho CRM, Telnyx, Microsoft Graph, Gmail API, LendSaaS, LendTech, REST APIs, and webhooks.',
    eyebrow: 'Integrations',
    h1: 'Connect the workflow without pretending every stack is the same.',
    lead: 'Ables integration scope is deployment-specific. Start by defining the systems, fields, events, credentials, review points, and write-back behavior for the workflow you want to evaluate.',
    breadcrumbs: [{ name: 'Integrations', path: '/integrations/' }],
    secondaryHref: '/resources/build-vs-buy-lending-automation/', secondaryLabel: 'Read the build-versus-buy guide',
    toc: [{ id: 'options', label: 'Integration options' }, { id: 'mapping', label: 'Mapping process' }, { id: 'boundaries', label: 'Security boundaries' }, { id: 'questions', label: 'Questions to answer' }],
    body: `
      <p class="section-kicker">Supported connection areas</p><h2 id="options">Integration options described by the current platform</h2>
      <p class="intro">These pages describe supported connection areas and the questions a deployment must answer. They do not claim a universal native, one-click, or real-time integration.</p>
      <div class="link-grid"><a class="link-card" href="/integrations/zoho-crm/"><span class="label">CRM</span><h3>Zoho CRM</h3><p>Map lead, deal, status, note, task, and workflow ownership to the customer’s actual CRM configuration.</p><span class="link-end">Review Zoho questions →</span></a><a class="link-card" href="/integrations/telnyx/"><span class="label">Messaging</span><h3>Telnyx</h3><p>Scope sender configuration, inbound and outbound events, opt-outs, routing, and operational ownership.</p><span class="link-end">Review messaging scope →</span></a><a class="link-card" href="/integrations/microsoft-email/"><span class="label">Email</span><h3>Microsoft Graph + Gmail API</h3><p>Define approved mailboxes, permissions, message workflows, and human handoffs.</p><span class="link-end">Review email scope →</span></a><a class="link-card" href="/integrations/lendsaas-lendtech/"><span class="label">Lending platforms</span><h3>LendSaaS + LendTech</h3><p>Confirm the applicable system, record model, environment, supported actions, and evidence before implementation.</p><span class="link-end">Review discovery questions →</span></a><a class="link-card" href="/integrations/api-webhooks/"><span class="label">Custom systems</span><h3>REST APIs + webhooks</h3><p>Define the event contract, authentication, data scope, retries, error handling, and write-back behavior.</p><span class="link-end">Map an API workflow →</span></a></div>

      <h2 id="mapping">Map the workflow before connecting credentials</h2>
      <div class="workflow-ledger"><div class="workflow-step"><span class="step-label">System</span><div><h3>Name the source of truth</h3><p>Identify the system, environment, record, field, and business owner for each input and output.</p></div></div><div class="workflow-step"><span class="step-label">Event</span><div><h3>Define what begins the action</h3><p>Document the trigger, expected state, duplicates, ordering, and stale-data behavior.</p></div></div><div class="workflow-step"><span class="step-label">Action</span><div><h3>Limit the permitted operation</h3><p>Choose the read, create, update, message, task, or routing action needed by the agreed workflow.</p></div></div><div class="workflow-step"><span class="step-label">Review</span><div><h3>Assign ownership</h3><p>Define approvals, exception queues, failure alerts, reconciliation, and change control.</p></div></div></div>

      <h2 id="boundaries">Security boundaries are part of integration design</h2>
      <p>Before production access, document credential ownership, authentication method, required scopes, data categories, environments, network path, logging, retention, deletion, backup expectations, and incident contacts. Exact answers vary by deployment and belong in the applicable review and agreement.</p>
      <h2 id="questions">Questions every integration should answer</h2>
      <ul><li>Which system is authoritative for each field and status?</li><li>What happens when a record is missing, duplicated, stale, or changed during processing?</li><li>Which actions need a person’s approval?</li><li>How are retries, partial failures, and reconciliation handled?</li><li>What is recorded, where is it retained, and who reviews it?</li><li>Who can change the mapping or credentials?</li></ul>
      ${cta('Bring the systems and workflow—not just a logo list.', 'A workflow review can identify the required events, fields, permissions, human checkpoints, and operational owners before an integration is scoped.')}
    `,
  },
  {
    path: '/integrations/zoho-crm/', schema: 'Service', serviceType: 'Zoho CRM integration for lending workflows',
    title: 'Zoho CRM Integration for Lending Workflows | Ables',
    description: 'Scope Ables and Zoho CRM workflows around verified modules, fields, events, ownership, human approvals, and write-back behavior.',
    eyebrow: 'Integration · CRM', h1: 'Zoho CRM integration mapped to your lending process.',
    lead: 'Ables supports Zoho CRM integrations, but the modules, fields, triggers, and actions depend on the customer’s CRM configuration and the selected workflow.',
    breadcrumbs: [{ name: 'Integrations', path: '/integrations/' }, { name: 'Zoho CRM', path: '/integrations/zoho-crm/' }],
    secondaryHref: '/solutions/lending-workflow-automation/', secondaryLabel: 'Explore connected workflows',
    toc: [{ id: 'scope', label: 'Integration scope' }, { id: 'mapping', label: 'Mapping checklist' }, { id: 'controls', label: 'Controls' }, { id: 'reference', label: 'Vendor reference' }],
    body: `
      <p class="section-kicker">CRM context</p><h2 id="scope">Start with the actual Zoho configuration</h2>
      <p>Zoho CRM can be a source, destination, or system of record within an Ables workflow. During discovery, the customer identifies the applicable organization, environment, modules, layouts, fields, statuses, owners, blueprints, and API constraints. Ables then scopes only the operations required by the selected workflow.</p>
      <p>Possible workflow categories include intake routing, conversation handoffs, review statuses, notes or tasks, offer steps, and follow-up signals. This list describes discovery areas; it does not state that every action is available in every deployment.</p>

      <h2 id="mapping">CRM mapping checklist</h2>
      <div class="control-list"><div class="control-item"><strong>Record identity</strong><p>Define the module, record key, duplicate behavior, and authoritative source.</p></div><div class="control-item"><strong>Field contract</strong><p>Verify exact API names, types, allowed values, ownership, and empty-value behavior.</p></div><div class="control-item"><strong>Trigger and state</strong><p>Define the event and record state that permit the workflow to continue.</p></div><div class="control-item"><strong>Write-back</strong><p>Choose the status, note, task, owner, or selected fields the workflow may create or update.</p></div></div>
      <p>A representative test should cover valid records, duplicates, missing fields, invalid values, deleted or reassigned records, API limits, expired credentials, and partial failures.</p>

      <h2 id="controls">Keep access and change control narrow</h2>
      <ul><li>Use the authentication method and scopes approved for the deployment.</li><li>Separate test and production environments where applicable.</li><li>Limit write permissions to the selected modules and actions.</li><li>Document the customer owner for field and workflow changes.</li><li>Record material writes and reconcile failures.</li></ul>
      <div class="truth-note"><strong>No “one-click” or universal field mapping is claimed.</strong><p>Zoho configurations differ. Integration behavior, sync direction, latency, API capacity, and operational support must be confirmed for the proposed deployment.</p></div>
      <div class="source-list"><h2 id="reference">Primary vendor reference</h2><ul><li><a href="https://www.zoho.com/crm/developer/docs/api/v8/" rel="noopener noreferrer">Zoho CRM API documentation</a></li></ul></div>
      ${cta('Map one Zoho workflow.', 'Bring the modules, fields, statuses, trigger, write-back action, and human owner for the process you want to review.')}
    `,
  },
  {
    path: '/integrations/telnyx/', schema: 'Service', serviceType: 'Telnyx SMS integration for lender communication workflows',
    title: 'Telnyx SMS Integration for Lender Workflows | Ables',
    description: 'Scope Telnyx-based lender messaging around approved senders, inbound and outbound events, opt-outs, routing, audit records, and human ownership.',
    eyebrow: 'Integration · Messaging', h1: 'Telnyx messaging connected to a controlled lender workflow.',
    lead: 'Current Ables implementations support Telnyx-based SMS workflows. The sender configuration, events, routing, content rules, and controls are defined for each deployment.',
    breadcrumbs: [{ name: 'Integrations', path: '/integrations/' }, { name: 'Telnyx', path: '/integrations/telnyx/' }],
    secondaryHref: '/solutions/lender-lead-qualification/', secondaryLabel: 'Explore qualification workflows',
    toc: [{ id: 'workflow', label: 'Messaging workflow' }, { id: 'controls', label: 'Controls' }, { id: 'test', label: 'Test cases' }, { id: 'reference', label: 'Vendor reference' }],
    body: `
      <p class="section-kicker">Channel scope</p><h2 id="workflow">Define the message lifecycle</h2>
      <div class="workflow-ledger"><div class="workflow-step"><span class="step-label">Sender</span><div><h3>Approve the sending identity</h3><p>Identify the permitted numbers, profiles, users, campaigns, and customer owner.</p></div></div><div class="workflow-step"><span class="step-label">Outbound</span><div><h3>Apply configured campaign rules</h3><p>Define the approved audience, message policy, schedule, rate, and failure behavior.</p></div></div><div class="workflow-step"><span class="step-label">Inbound</span><div><h3>Route replies and stop signals</h3><p>Define classification, qualification capture, opt-out handling, and the conditions for human escalation.</p></div></div><div class="workflow-step"><span class="step-label">Record</span><div><h3>Preserve material activity</h3><p>Identify the system that receives the message status, conversation context, opt-out state, and assigned owner.</p></div></div></div>

      <h2 id="controls">Messaging controls are customer-specific</h2>
      <p>Ables workflows can support quiet-hour policies, DNC checks, opt-out handling, and message-level audit records. The customer is responsible for defining applicable consent, DNC, telemarketing, content, registration, sender, and state-law requirements with qualified counsel.</p>
      <div class="truth-note"><strong>No deliverability, throughput, response-rate, or compliance outcome is promised.</strong><p>Channel capacity, carrier behavior, sender registration, message content, and operating requirements vary and must be verified for the deployment.</p></div>

      <h2 id="test">Test expected and failure paths</h2>
      <ul><li>Approved outbound and inbound message events.</li><li>Stop requests, ambiguous negative responses, and duplicate events.</li><li>Quiet-hour and DNC enforcement paths.</li><li>Invalid numbers, carrier errors, and delayed or out-of-order delivery events.</li><li>Human takeover, reassignment, and write-back failures.</li><li>Credential, webhook, and dependency failures.</li></ul>
      <div class="source-list"><h2 id="reference">Primary vendor reference</h2><ul><li><a href="https://developers.telnyx.com/docs/messaging" rel="noopener noreferrer">Telnyx messaging documentation</a></li></ul></div>
      ${cta('Review the Telnyx message lifecycle.', 'Discuss approved senders, events, opt-outs, routing, human handoffs, records, and failure behavior for one messaging workflow.')}
    `,
  },
  {
    path: '/integrations/microsoft-email/', schema: 'Service', serviceType: 'Microsoft Graph and Gmail API integration for lender email workflows',
    title: 'Microsoft Graph and Gmail API Email Workflows | Ables',
    description: 'Connect approved mailboxes to lender email workflows with deployment-specific permissions, routing, human review, and audit expectations.',
    eyebrow: 'Integration · Email', h1: 'Email workflows through Microsoft Graph and Gmail API.',
    lead: 'Current Ables implementations support email workflows through Microsoft Graph and the Gmail API. Mailboxes, permissions, events, actions, and human review are scoped per deployment.',
    breadcrumbs: [{ name: 'Integrations', path: '/integrations/' }, { name: 'Microsoft Graph and Gmail API', path: '/integrations/microsoft-email/' }],
    secondaryHref: '/solutions/lender-lead-qualification/', secondaryLabel: 'Explore qualification workflows',
    toc: [{ id: 'scope', label: 'Workflow scope' }, { id: 'permissions', label: 'Permissions' }, { id: 'controls', label: 'Controls' }, { id: 'references', label: 'Vendor references' }],
    body: `
      <p class="section-kicker">Mailbox scope</p><h2 id="scope">Choose the mailbox and actions deliberately</h2>
      <p>An email workflow begins with the customer-approved account, mailbox or user context, folders or labels, message types, and actions. Depending on the selected process, email can support outreach, reply handling, routing, review tasks, and follow-up. Exact behavior must be demonstrated for the proposed deployment.</p>
      <div class="workflow-ledger"><div class="workflow-step"><span class="step-label">Account</span><div><h3>Identify the approved mailbox</h3><p>Define the organization, user or shared mailbox, environment, and customer owner.</p></div></div><div class="workflow-step"><span class="step-label">Access</span><div><h3>Limit the permitted operations</h3><p>Choose the minimum read, compose, send, label, move, or other permissions required by the workflow.</p></div></div><div class="workflow-step"><span class="step-label">Route</span><div><h3>Define the selected messages and handoffs</h3><p>Document filters, classification expectations, exceptions, and when a person takes control.</p></div></div><div class="workflow-step"><span class="step-label">Record</span><div><h3>Choose the downstream system</h3><p>Define what status or context is written back and what remains only in the mailbox.</p></div></div></div>

      <h2 id="permissions">Permissions and identity</h2>
      <p>Microsoft Graph and Gmail use different authorization and administration models. Discovery should identify whether delegated or application access is appropriate, who grants consent, how credentials are stored and rotated, and how access is removed. The final architecture should be documented before production use.</p>

      <h2 id="controls">Operational controls to test</h2>
      <ul><li>Duplicate messages, threads, aliases, forwarding, and automated replies.</li><li>Human-sent replies that arrive while a workflow is processing.</li><li>Opt-outs, wrong recipients, bounced mail, and delivery failures.</li><li>Permission removal, token expiration, rate limits, and provider outages.</li><li>Mailbox reassignment, user departure, and incident response.</li></ul>
      <div class="truth-note"><strong>No universal mailbox access or send behavior is claimed.</strong><p>The supported identity, scopes, throughput, routing, retention, and operational support depend on the provider and proposed deployment.</p></div>
      <div class="source-list"><h2 id="references">Primary vendor references</h2><ul><li><a href="https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview" rel="noopener noreferrer">Microsoft Graph Outlook mail API overview</a></li><li><a href="https://developers.google.com/workspace/gmail/api/guides" rel="noopener noreferrer">Google Workspace Gmail API guides</a></li></ul></div>
      ${cta('Map one approved mailbox workflow.', 'Discuss the account, permissions, message types, actions, handoffs, write-back behavior, and failure paths required by your team.')}
    `,
  },
  {
    path: '/integrations/lendsaas-lendtech/', schema: 'Service', serviceType: 'LendSaaS and LendTech integration discovery for lending workflows',
    title: 'LendSaaS and LendTech Workflow Integration | Ables',
    description: 'Review LendSaaS or LendTech integration scope by environment, record model, permitted actions, ownership, testing, and deployment evidence.',
    eyebrow: 'Integration · Lending platforms', h1: 'LendSaaS and LendTech workflows scoped to the applicable deployment.',
    lead: 'Ables lists LendSaaS and LendTech among its integration options. The applicable system, environment, supported records, actions, and evidence must be confirmed during discovery.',
    breadcrumbs: [{ name: 'Integrations', path: '/integrations/' }, { name: 'LendSaaS and LendTech', path: '/integrations/lendsaas-lendtech/' }],
    secondaryHref: '/resources/evaluate-ai-underwriting-software/', secondaryLabel: 'Use the evaluation guide',
    toc: [{ id: 'discovery', label: 'Discovery first' }, { id: 'contract', label: 'Data contract' }, { id: 'testing', label: 'Testing' }, { id: 'limits', label: 'Limits' }],
    body: `
      <p class="section-kicker">Evidence before implementation</p><h2 id="discovery">Confirm the exact platform context</h2>
      <p>Product names alone are not an integration specification. Before an Ables workflow is scoped, identify the applicable LendSaaS or LendTech product, account, environment, partner or administrative role, current documentation, authentication method, record identifiers, and customer owner.</p>
      <p>The implementation should be based on the customer’s verified access and current provider behavior. Do not assume that an endpoint, field, or permission observed in another environment applies.</p>

      <h2 id="contract">Define the record and action contract</h2>
      <div class="control-list"><div class="control-item"><strong>Records</strong><p>Name the exact object, identifier, lifecycle state, and authoritative system.</p></div><div class="control-item"><strong>Fields</strong><p>Verify names, types, allowed values, null behavior, and sensitive-data classification.</p></div><div class="control-item"><strong>Actions</strong><p>Limit reads and writes to the agreed workflow and approval state.</p></div><div class="control-item"><strong>Ownership</strong><p>Assign responsibility for credentials, mapping changes, errors, and provider updates.</p></div></div>

      <h2 id="testing">Test with reversible, representative cases</h2>
      <ul><li>Use the correct non-production environment when one is available and approved.</li><li>Test valid, duplicate, missing, stale, unauthorized, and malformed records.</li><li>Verify status transitions, field mappings, error responses, and reconciliation.</li><li>Confirm what is recorded and how a failed action is surfaced to a person.</li><li>Repeat the test after any provider or workflow change that affects the contract.</li></ul>

      <h2 id="limits">What this page does not claim</h2>
      <div class="truth-note"><strong>No native, one-click, bidirectional, or real-time integration claim is made.</strong><p>Supported endpoints, fields, directions, latency, rate limits, environments, and service levels must be verified for the proposed customer deployment.</p></div>
      <div class="related-links"><a href="/integrations/api-webhooks/">API and webhook mapping</a><a href="/solutions/offer-and-renewal-workflows/">Offer and follow-up workflows</a><a href="/security/">Security review</a></div>
      ${cta('Verify the platform context before scoping.', 'Bring the applicable product, environment, documentation, access role, records, and desired workflow action to a technical review.')}
    `,
  },
  {
    path: '/integrations/api-webhooks/', schema: 'Service', serviceType: 'Custom REST API and webhook integration for lending workflows',
    title: 'REST API and Webhook Integrations for Lenders | Ables',
    description: 'Define custom lending workflow integrations with explicit events, authentication, schemas, idempotency, errors, reconciliation, and human ownership.',
    eyebrow: 'Integration · Custom systems', h1: 'REST API and webhook workflows with an explicit data contract.',
    lead: 'Ables supports custom REST and webhook connections. A reliable implementation begins with the event, schema, permitted action, failure behavior, and system owner.',
    breadcrumbs: [{ name: 'Integrations', path: '/integrations/' }, { name: 'REST APIs and webhooks', path: '/integrations/api-webhooks/' }],
    secondaryHref: '/solutions/lending-workflow-automation/', secondaryLabel: 'Explore workflow automation',
    toc: [{ id: 'contract', label: 'Integration contract' }, { id: 'reliability', label: 'Reliability questions' }, { id: 'security', label: 'Security questions' }, { id: 'evaluation', label: 'Evaluation' }],
    body: `
      <p class="section-kicker">Custom connections</p><h2 id="contract">Describe the integration as a contract</h2>
      <div class="workflow-ledger"><div class="workflow-step"><span class="step-label">Event</span><div><h3>What happened?</h3><p>Name the source event, timestamp, identifier, expected state, version, and duplicate behavior.</p></div></div><div class="workflow-step"><span class="step-label">Payload</span><div><h3>What data is required?</h3><p>Define the schema, required and optional fields, types, sensitive-data classification, and validation rules.</p></div></div><div class="workflow-step"><span class="step-label">Action</span><div><h3>What may the receiver do?</h3><p>Limit the downstream read, write, message, calculation, task, or routing action to the agreed workflow.</p></div></div><div class="workflow-step"><span class="step-label">Result</span><div><h3>How is the outcome reconciled?</h3><p>Define success, partial success, retry, permanent failure, notification, and human review behavior.</p></div></div></div>

      <h2 id="reliability">Reliability questions to answer</h2>
      <ul><li>Can the same event arrive more than once, late, or out of order?</li><li>Which identifier makes the action safe to retry?</li><li>What timeout and response are expected?</li><li>Who owns retries, dead-letter events, and manual reconciliation?</li><li>How are schema and version changes introduced?</li><li>What monitoring confirms that both systems agree?</li></ul>
      <p>These are design questions, not claims that every Ables connection implements the same mechanism. The answers belong in the deployment specification and test evidence.</p>

      <h2 id="security">Security questions to answer</h2>
      <ul><li>Authentication method, credential owner, storage, rotation, and revocation.</li><li>Transport path, network restrictions, source validation, and permitted origins.</li><li>Minimum data scope and field-level sensitivity.</li><li>Logging, redaction, retention, deletion, and access review.</li><li>Abuse prevention, rate limits, and incident contacts.</li></ul>
      <div class="truth-note"><strong>Custom does not mean unrestricted.</strong><p>The safest connection is limited to the systems, events, fields, and actions required by the approved workflow.</p></div>

      <h2 id="evaluation">Test the contract from both sides</h2>
      <p>Use representative valid and invalid payloads, duplicate events, missing fields, stale states, permission failures, provider errors, timeouts, and human corrections. Verify both the immediate response and the final system-of-record state.</p>
      ${cta('Map the event before writing the connector.', 'Bring the source event, payload, authentication, permitted action, reconciliation path, and system owners to a technical workflow review.')}
    `,
  },
  {
    path: '/resources/', schema: 'CollectionPage',
    title: 'AI Underwriting and Lending Automation Resources | Ables',
    description: 'Use practical guides and a browser-based assessment to evaluate AI underwriting software, workflow platforms, and build-versus-buy decisions.',
    eyebrow: 'Resources', h1: 'Evaluate lending automation with questions you can verify.',
    lead: 'These resources focus on workflow fit, evidence, human oversight, integration boundaries, and customer-owned measurements rather than unsupported outcome claims.',
    breadcrumbs: [{ name: 'Resources', path: '/resources/' }],
    secondaryHref: '/solutions/', secondaryLabel: 'Explore Ables solutions',
    toc: [{ id: 'guides', label: 'Evaluation guides' }, { id: 'assessment', label: 'Readiness assessment' }, { id: 'lender-research', label: 'Lender research' }, { id: 'principles', label: 'Editorial principles' }, { id: 'next', label: 'Next step' }],
    body: `
      <p class="section-kicker">Decision-stage guides</p><h2 id="guides">Start with the decision you need to make</h2>
      <div class="link-grid"><a class="link-card" href="/resources/evaluate-ai-underwriting-software/"><span class="label">Buyer guide</span><h3>How to evaluate AI underwriting software</h3><p>Review workflow fit, data, output quality, human control, integration, security, operations, and evidence.</p><span class="link-end">Open the guide →</span></a><a class="link-card" href="/resources/lending-workflow-platform-vs-point-tools/"><span class="label">Architecture decision</span><h3>Workflow platform vs. point tools</h3><p>Compare breadth, handoffs, ownership, change control, and the consequences of connecting specialized systems.</p><span class="link-end">Compare approaches →</span></a><a class="link-card" href="/resources/build-vs-buy-lending-automation/"><span class="label">Delivery decision</span><h3>Build vs. buy lending automation</h3><p>Evaluate internal capacity, operating ownership, integration depth, governance, and long-term change work.</p><span class="link-end">Use the decision framework →</span></a></div>

      <p class="section-kicker">Private calculation</p><h2 id="assessment">Map your current workflow with your own inputs</h2>
      <p>The <a class="plain-link" href="/resources/workflow-readiness-assessment/">workflow readiness assessment</a> estimates the manual workload represented by values you enter and identifies questions to resolve before a pilot. It does not predict savings, approval rates, revenue, loss performance, or implementation outcomes. Values stay in your browser and are not submitted or stored.</p>

      <p class="section-kicker">External industry research</p><h2 id="lender-research">Review lender criteria outside the workflow</h2>
      <p>Teams evaluating routing rules can use <a class="plain-link" href="https://lender-list.com/" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:.35em;vertical-align:middle"><img src="/assets/lender-list-mark.svg" alt="" width="22" height="22" style="width:1.25em;height:1.25em;flex:none"><span>Lender List</span></a>, an external informational MCA lender directory and matching tool, to review published criteria and match explanations. A directory match is not an approval or offer; confirm current criteria directly with the lender before routing a file.</p>

      <h2 id="principles">How these resources are written</h2>
      <div class="control-list"><div class="control-item"><strong>Grounded scope</strong><p>Product statements are limited to capabilities described by current Ables public materials.</p></div><div class="control-item"><strong>Visible assumptions</strong><p>Calculations and decision frameworks state what the visitor supplies and what is not predicted.</p></div><div class="control-item"><strong>Primary references</strong><p>Regulatory, platform, and risk-management references link to the issuing organization where practical.</p></div><div class="control-item"><strong>No substitute for review</strong><p>Resources do not replace underwriting, legal, compliance, security, or technical judgment.</p></div></div>

      <h2 id="next">Move from reading to a representative test</h2>
      <p>Choose one workflow, document its current baseline, identify the systems and human approvals, and define the evidence your team needs. Then evaluate the proposed workflow on an approved sample before production access is connected.</p>
      ${cta('Bring one workflow and your evaluation questions.', 'Use a walkthrough to examine the relevant product scope, integrations, controls, security requirements, and representative test design.')}
    `,
  },
  {
    path: '/resources/evaluate-ai-underwriting-software/', schema: 'Article',
    title: 'How to Evaluate AI Underwriting Software | Ables Guide',
    description: 'A practical lender checklist for evaluating workflow fit, data, output quality, human review, integration, security, operations, and evidence.',
    eyebrow: 'Buyer guide', h1: 'How to evaluate AI underwriting software.',
    lead: 'A useful evaluation asks what the system does, what a person still owns, how evidence is checked, and what happens when inputs or dependencies fail.',
    breadcrumbs: [{ name: 'Resources', path: '/resources/' }, { name: 'Evaluate AI underwriting software', path: '/resources/evaluate-ai-underwriting-software/' }],
    secondaryHref: '/resources/workflow-readiness-assessment/', secondaryLabel: 'Assess workflow readiness',
    toc: [{ id: 'workflow', label: '1. Workflow fit' }, { id: 'data', label: '2. Data and outputs' }, { id: 'control', label: '3. Human control' }, { id: 'integration', label: '4. Integration' }, { id: 'security', label: '5. Security' }, { id: 'evidence', label: '6. Evidence' }, { id: 'sources', label: 'Primary references' }],
    body: `
      <p class="section-kicker">Evaluation framework</p><h2 id="workflow">1. Define the workflow before comparing software</h2>
      <p>Write down the current trigger, inputs, systems, repeatable tasks, human decisions, exceptions, outputs, and system of record. Identify which part creates the delay or risk you want to address. A broad demonstration is difficult to evaluate if the buyer has not defined the process it is meant to support.</p>
      <ul><li>What event starts the workflow?</li><li>Which steps are deterministic, and which require judgment?</li><li>What must remain visible to an underwriter or other accountable person?</li><li>What does a successful handoff look like?</li></ul>

      <h2 id="data">2. Trace data from source to output</h2>
      <p>For every material output, identify the source, freshness, completeness checks, transformation, uncertainty, and reconciliation path. Ask the vendor to demonstrate missing, contradictory, duplicated, and poor-quality inputs—not only clean examples.</p>
      <p>When evaluating document review or scoring, compare results with an independently reviewed sample. Record disagreements and corrections at the level needed to understand the failure, rather than reducing the test to one aggregate accuracy number.</p>

      <h2 id="control">3. Make human authority explicit</h2>
      <p>Determine who can approve, override, stop, correct, and change the workflow. Review how the system presents rationale and source context, and whether a fluent explanation can obscure an uncertain or incorrect output.</p>
      <ul><li>Which actions require approval before affecting an applicant or customer?</li><li>How are overrides and rule changes recorded?</li><li>What stops the workflow when a required system or input is unavailable?</li><li>Who reviews errors and performance over time?</li></ul>

      <h2 id="integration">4. Evaluate the integration, not just the interface</h2>
      <p>Confirm exact systems, environments, identities, fields, events, actions, rate limits, retries, and reconciliation. Test duplicate and out-of-order events, stale records, credential failures, and partial writes. Establish which system is authoritative for each field and status.</p>
      <p>See the <a href="/integrations/">Ables integration mapping guide</a> for system-specific questions.</p>

      <h2 id="security">5. Review the proposed deployment</h2>
      <p>Request the architecture and commitments that apply to the actual implementation. Review access scope, model and provider routing, data categories, storage, retention, deletion, logging, customer isolation, administrative access, monitoring, backups, incident contacts, change management, and service levels.</p>
      <div class="truth-note"><strong>Do not infer controls from a logo or old sales page.</strong><p>Certifications, infrastructure, providers, support, and service levels should be supported by current evidence and documented commitments.</p></div>

      <h2 id="evidence">6. Design a representative evaluation</h2>
      <p>Agree on the sample, baseline, expected outputs, review method, exceptions, success criteria, security constraints, and versioned configuration before testing. Measure the full human process and downstream quality, not only model response time.</p>
      <div class="comparison-wrap"><table class="comparison-table"><thead><tr><th>Evidence area</th><th>What to record</th><th>What not to assume</th></tr></thead><tbody><tr><td>Output quality</td><td>Agreement, disagreement, missing items, corrections, and exception reasons</td><td>That one aggregate percentage explains operational fit</td></tr><tr><td>Workflow</td><td>Handoffs, queue time, reviewer actions, failures, and reconciliation</td><td>That model speed equals end-to-end time saved</td></tr><tr><td>Controls</td><td>Approvals, overrides, stop conditions, logs, and change ownership</td><td>That “human in the loop” describes a specific control</td></tr><tr><td>Business result</td><td>Customer-defined downstream quality and qualified outcomes</td><td>That replies, files processed, or tiers alone equal value</td></tr></tbody></table></div>

      <div class="source-list"><h2 id="sources">Primary references</h2><ul><li><a href="https://www.nist.gov/itl/ai-risk-management-framework" rel="noopener noreferrer">NIST AI Risk Management Framework</a></li><li><a href="https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm" rel="noopener noreferrer">Federal Reserve SR 26-2 revised model risk management guidance</a></li><li><a href="https://www.consumerfinance.gov/compliance/circulars/circular-2022-03-adverse-action-notification-requirements-in-connection-with-credit-decisions-based-on-complex-algorithms/" rel="noopener noreferrer">CFPB circular on adverse action and complex algorithms</a></li><li><a href="https://www.ftc.gov/business-guidance/blog/artificial-intelligence" rel="noopener noreferrer">FTC business guidance archive on artificial intelligence</a></li></ul><p>Applicability varies by institution, product, jurisdiction, and use. Obtain qualified legal, compliance, risk, and security review.</p></div>
      ${cta('Apply the checklist to one representative workflow.', 'A walkthrough can focus on the data, controls, integrations, security questions, and evidence your team needs to make a decision.')}
    `,
  },
  {
    path: '/resources/lending-workflow-platform-vs-point-tools/', schema: 'Article',
    title: 'Lending Workflow Platform vs. Point Tools | Ables Guide',
    description: 'Compare a connected lending workflow platform with specialized point tools across depth, handoffs, ownership, integration, control, and change.',
    eyebrow: 'Architecture guide', h1: 'Lending workflow platform vs. point tools.',
    lead: 'The decision is not “one system good, many systems bad.” It is a tradeoff between specialized depth and the work required to connect, govern, and operate the full process.',
    breadcrumbs: [{ name: 'Resources', path: '/resources/' }, { name: 'Workflow platform vs. point tools', path: '/resources/lending-workflow-platform-vs-point-tools/' }],
    secondaryHref: '/solutions/lending-workflow-automation/', secondaryLabel: 'Explore connected workflows',
    toc: [{ id: 'definitions', label: 'Define the options' }, { id: 'compare', label: 'Comparison' }, { id: 'handoffs', label: 'Count the handoffs' }, { id: 'decision', label: 'Decision questions' }],
    body: `
      <p class="section-kicker">Architecture choice</p><h2 id="definitions">Define what each option actually includes</h2>
      <p>A point tool usually concentrates on a particular job, such as document extraction, messaging, scoring, offer preparation, or CRM automation. A workflow platform connects several jobs and their handoffs. Either approach can be appropriate. The evaluation should compare the complete operating design, not labels.</p>
      <p>A connected platform may still rely on specialized providers and customer systems. A point-tool stack may have strong orchestration. Document the actual architecture, data paths, operating ownership, and limits.</p>

      <h2 id="compare">Compare the full operating model</h2>
      <div class="comparison-wrap"><table class="comparison-table"><thead><tr><th>Question</th><th>Connected workflow platform</th><th>Point-tool stack</th></tr></thead><tbody><tr><td>Specialized depth</td><td>Confirm depth for each selected stage rather than assuming equal coverage.</td><td>Can offer focused capability; verify how its outputs fit the next system.</td></tr><tr><td>Handoffs</td><td>May reduce custom handoffs when stages share a defined workflow.</td><td>Requires the buyer to design and operate connections between tools.</td></tr><tr><td>System ownership</td><td>Clarify where the platform ends and customer systems remain authoritative.</td><td>Clarify who owns orchestration, mappings, retries, and reconciliation.</td></tr><tr><td>Change control</td><td>Assess how one workflow change affects connected stages.</td><td>Assess version and contract changes across multiple vendors.</td></tr><tr><td>Replacement risk</td><td>Evaluate modular scope, export, APIs, and phased deployment.</td><td>Evaluate dependency on each tool and the custom integration layer.</td></tr><tr><td>Evidence</td><td>Test each stage and the complete handoff sequence.</td><td>Test each tool and every connection between them.</td></tr></tbody></table></div>

      <h2 id="handoffs">Count operational handoffs, not just software subscriptions</h2>
      <p>List where a person copies data, changes status, reconciles two views, watches for failure, or decides which system is correct. Include manual inbox and spreadsheet work. Then identify which handoffs create delay, error, unclear ownership, or difficult audit reconstruction.</p>
      <p>The <a href="/resources/workflow-readiness-assessment/">workflow readiness assessment</a> can estimate the manual workload represented by your own volume and time inputs. It deliberately does not estimate savings.</p>

      <h2 id="decision">Decision questions</h2>
      <ul><li>Which specialized capabilities are genuinely differentiating for this workflow?</li><li>Who will own the integration layer and respond when it fails?</li><li>Can each material output be traced to source data and configuration?</li><li>Where are human approvals, overrides, and stop conditions enforced?</li><li>How easily can a stage be tested, changed, or replaced?</li><li>What data and workflow record can the customer export?</li></ul>
      <div class="truth-note"><strong>A category comparison is not a vendor claim.</strong><p>This guide does not state that Ables or any other product has every characteristic listed above. Verify the proposed architecture and contractual scope.</p></div>
      ${cta('Compare architectures using your real handoffs.', 'Bring the current systems, manual transfers, system owners, and required controls for one workflow to a review.')}
    `,
  },
  {
    path: '/resources/build-vs-buy-lending-automation/', schema: 'Article',
    title: 'Build vs. Buy Lending Workflow Automation | Ables Guide',
    description: 'Evaluate whether to build or buy lending automation based on workflow specificity, internal capacity, integrations, governance, operations, and change.',
    eyebrow: 'Delivery guide', h1: 'Build vs. buy lending workflow automation.',
    lead: 'The right decision depends on the workflow, internal engineering and operating capacity, integration depth, governance requirements, and who will own change after launch.',
    breadcrumbs: [{ name: 'Resources', path: '/resources/' }, { name: 'Build vs. buy lending automation', path: '/resources/build-vs-buy-lending-automation/' }],
    secondaryHref: '/integrations/', secondaryLabel: 'Review integration scope',
    toc: [{ id: 'frame', label: 'Frame the decision' }, { id: 'build', label: 'Building internally' }, { id: 'buy', label: 'Buying a platform' }, { id: 'hybrid', label: 'Hybrid approach' }, { id: 'scorecard', label: 'Decision scorecard' }],
    body: `
      <p class="section-kicker">Delivery decision</p><h2 id="frame">Start with the operating capability, not the code</h2>
      <p>Define the workflow, integration surface, risk, review obligations, expected change rate, and required service ownership. The cost of either path includes discovery, data preparation, testing, deployment, monitoring, incident response, vendor changes, policy changes, and user support.</p>

      <h2 id="build">Building internally</h2>
      <p>An internal build can provide deep control over policy, user experience, infrastructure, and integration. It also requires sustained ownership of product decisions, data contracts, model and prompt changes where applicable, testing, security, observability, failure recovery, audit evidence, and support.</p>
      <p>Ask whether the organization has named owners for the workflow, product, engineering, data, security, compliance, and operations—not only the ability to build an initial prototype.</p>

      <h2 id="buy">Buying a platform or implementation</h2>
      <p>A vendor may provide reusable workflow components, existing integrations, implementation experience, and ongoing operations. Buyers should still verify fit, source traceability, human controls, data handling, change ownership, export, failure behavior, vendor dependencies, and contractual commitments.</p>
      <p>Do not treat a short implementation claim or polished demo as evidence that a production workflow, edge cases, and security review are complete.</p>

      <h2 id="hybrid">A phased or hybrid approach</h2>
      <p>Many teams retain their CRM, lending platform, policy ownership, and decision authority while adding automation around selected steps. A representative pilot can isolate one workflow, connect only necessary systems, and preserve an exit path. The result may be a vendor component, custom connection, internal control layer, or combination.</p>

      <h2 id="scorecard">Decision scorecard</h2>
      <div class="comparison-wrap"><table class="comparison-table"><thead><tr><th>Dimension</th><th>Questions to answer</th></tr></thead><tbody><tr><td>Workflow specificity</td><td>How unusual are the inputs, rules, exceptions, and user experience?</td></tr><tr><td>Internal capacity</td><td>Who owns product, engineering, security, compliance, data, support, and incidents?</td></tr><tr><td>Integration depth</td><td>How many systems, records, fields, events, and write paths are involved?</td></tr><tr><td>Control and evidence</td><td>What must be reviewed, explained, versioned, logged, reproduced, or audited?</td></tr><tr><td>Change rate</td><td>How often do policy, providers, channels, systems, or workflows change?</td></tr><tr><td>Dependency and exit</td><td>What can be exported, replaced, or operated if a provider changes?</td></tr><tr><td>Operating cost</td><td>What ongoing monitoring, review, correction, support, and incident work is required?</td></tr></tbody></table></div>
      <div class="truth-note"><strong>Do not force a false binary.</strong><p>The best answer can differ by workflow. Build proprietary policy or control layers where they matter, buy reusable components where they fit, and keep the boundaries explicit.</p></div>
      ${cta('Apply the scorecard to one workflow.', 'Discuss which parts are customer-owned, reusable, integration-heavy, policy-sensitive, or appropriate for a controlled pilot.')}
    `,
  },
  {
    path: '/resources/workflow-readiness-assessment/', schema: 'WebApplication',
    title: 'Lending Workflow Readiness Assessment | Ables',
    description: 'Use your own workflow volume, manual time, systems, handoffs, controls, and access readiness to prepare a lending automation evaluation.',
    eyebrow: 'Browser-based assessment', h1: 'Map the workflow before you automate it.',
    lead: 'Enter your own operating assumptions to estimate the manual workload represented by the workflow and identify questions to resolve before a pilot. No values are submitted or stored.',
    breadcrumbs: [{ name: 'Resources', path: '/resources/' }, { name: 'Workflow readiness assessment', path: '/resources/workflow-readiness-assessment/' }],
    secondaryHref: '/resources/evaluate-ai-underwriting-software/', secondaryLabel: 'Read the evaluation guide',
    toc: [{ id: 'assessment', label: 'Assessment' }, { id: 'method', label: 'Method and assumptions' }, { id: 'next', label: 'Use the result' }],
    head: '<script defer src="/assessment.js?v=7bb889a2a9ec"></script>',
    body: `
      <p class="section-kicker">Your inputs</p><h2 id="assessment">Describe one current workflow</h2>
      <p>Choose a single repeatable workflow, such as qualification, bank-statement review, risk-rule preparation, offer routing, or renewal follow-up. Use current observed values where possible.</p>
      <form class="assessment" id="readiness-assessment" action="/resources/workflow-readiness-assessment/" method="post">
        <div class="assessment-grid">
          <div class="assessment-field"><label for="monthly-volume">Items handled per month</label><input id="monthly-volume" type="number" min="1" max="100000" step="1" value="100" inputmode="numeric" /><small>Applications, deals, documents, or conversations in this one workflow.</small></div>
          <div class="assessment-field"><label for="minutes-per-item">Repeatable manual minutes per item</label><input id="minutes-per-item" type="number" min="0" max="1440" step="1" value="30" inputmode="numeric" /><small>Exclude time that is entirely judgment or customer waiting time.</small></div>
          <div class="assessment-field"><label for="system-count">Systems a person touches</label><input id="system-count" type="number" min="1" max="50" step="1" value="4" inputmode="numeric" /><small>Include inboxes and spreadsheets when they are part of the process.</small></div>
          <div class="assessment-field"><label for="handoff-count">Human or system handoffs</label><input id="handoff-count" type="number" min="0" max="50" step="1" value="3" inputmode="numeric" /><small>Count transfers of data, status, ownership, or approval.</small></div>
          <div class="assessment-field"><label for="control-state">Approval and exception rules</label><select id="control-state"><option value="documented">Documented and owned</option><option value="partial" selected>Partly documented</option><option value="unclear">Mostly implicit or unclear</option></select><small>Choose the state of this workflow, not the organization overall.</small></div>
          <div class="assessment-field"><label for="access-state">Data and system access</label><select id="access-state"><option value="defined">APIs or approved events are defined</option><option value="available" selected>Exports or access exist but need mapping</option><option value="unclear">Access or ownership is unclear</option></select><small>This does not assess security approval or technical feasibility.</small></div>
        </div>
        <div class="assessment-actions"><button class="button" id="calculate-readiness" type="button">Calculate workflow snapshot</button><button class="button button--secondary" type="reset">Reset inputs</button></div>
        <section class="assessment-output" id="assessment-output" tabindex="-1" aria-live="polite" hidden>
          <p class="section-kicker">Workflow snapshot</p><h2 id="assessment-level">Mapping needed</h2><p id="assessment-summary"></p>
          <div class="assessment-metric"><strong id="manual-hours">0 hours</strong><span>Estimated monthly repeatable manual workload from your inputs—not predicted savings.</span></div>
          <h3>Questions to resolve first</h3><ul id="priority-list"></ul>
          <p><a class="plain-link" href="/#cta">Discuss this workflow in a walkthrough →</a></p>
        </section>
      </form>

      <div class="method-box"><h2 id="method">Method and assumptions</h2><p><strong>Manual workload represented</strong> = items per month × repeatable manual minutes per item ÷ 60.</p><p>The readiness label uses only your selections for documented controls, system access, system count, and handoffs. It is a discussion aid, not a technical, security, compliance, financial, or implementation assessment.</p><p>The tool does not predict time saved, staffing changes, approval rates, revenue, loss performance, accuracy, implementation cost, or return on investment. Browser-entered values are not sent to Ables, Google Analytics, or another service by this tool and are not stored.</p></div>

      <h2 id="next">Use the result to prepare a representative evaluation</h2>
      <ol><li>Write down the trigger, inputs, outputs, and current owner.</li><li>Confirm the systems and authoritative fields.</li><li>Document approvals, exceptions, stop conditions, and corrections.</li><li>Choose an approved representative sample.</li><li>Define what your team will measure and how it will verify the result.</li></ol>
      <div class="related-links"><a href="/resources/evaluate-ai-underwriting-software/">Evaluation guide</a><a href="/integrations/">Integration mapping</a><a href="/security/">Security review</a></div>
      ${cta('Turn the snapshot into a workflow review.', 'Bring the inputs, systems, handoffs, controls, and access questions for one process. The next step is to verify them, not assume an outcome.')}
    `,
  },
];

for (const page of pages) {
  const outputDir = path.join(root, page.path.replace(/^\//, ''));
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), layout(page), 'utf8');
}

const sitemapPaths = ['/', '/about/', '/security/', '/privacy/', '/terms/', ...pages.map((page) => page.path)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((pagePath) => `  <url>
    <loc>${absoluteUrl(pagePath)}</loc>
    <lastmod>${published}</lastmod>
  </url>`).join('\n')}
</urlset>
`;
await writeFile(path.join(root, 'sitemap.xml'), sitemap, 'utf8');

console.log(`Built ${pages.length} content pages and ${sitemapPaths.length} sitemap entries.`);
