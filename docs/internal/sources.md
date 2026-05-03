# Sources knowledge base

Working knowledge base of articles, studies, and other sources we've gathered while researching open issues and topics for the playbook. Each entry has a short summary, the key stats or claims that make it citable, and notes on where it pulls weight.

For resources we've flagged but haven't drawn from yet, see [`further-reading.md`](further-reading.md). The two files form a pipeline: `further-reading.md` → `sources.md` → `docs/research-summary.md`.

## How to use this page

- **Look up a source before citing it.** If we've used it before, the entry already has the framing we settled on.
- **Add a new source when you research it.** Don't rely on memory — by the third issue, the same article gets re-read from scratch.
- **Promote to `docs/research-summary.md`** when the source ends up backing content in a landed module. This page stays the working draft; the published research summary is the curated cut.
- **Mark sources you'd avoid.** Vendor-published material, weak methodology, or claims we've decided not to lean on belong here too — labelled — so we don't accidentally re-adopt them later.

## Entry template

```
### [Title](URL)
**Type:** academic study / vendor report / industry write-up / practitioner panel / standard
**Scope / year:** what was measured, when
**Key findings:** the 1–3 stats or claims worth citing
**Where useful:** which playbook module / issue / argument this supports
**Caveats:** vendor bias, methodological limits, what NOT to use it for
**Used in:** issue/PR/module references
```

---

## Code review (issue #12, paired with #11)

### [Bacchelli & Bird — Expectations, Outcomes, and Challenges of Modern Code Review (Microsoft, ICSE 2013)](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/ICSE202013-codereview.pdf)
**Type:** academic study (peer-reviewed, ICSE)
**Scope / year:** Microsoft, hundreds of review comments manually classified across diverse teams, 2013
**Key findings:** Managers expect reviews to catch high-severity bugs; in reality the majority of comments target maintainability and low-level issues. Knowledge transfer and team awareness end up being dominant outcomes — not bug-finding.
**Where useful:** 06 Verification and Quality, the discipline checklist. Disarms the "but reviews already catch bugs" objection.
**Caveats:** 2013 data, pre-AI, single company. Still the strongest empirical statement on the expectation/outcome mismatch.
**Used in:** issue #12

### [Sadowski et al. — Modern Code Review: A Case Study at Google (ICSE 2018)](https://sback.it/publications/icse2018seip.pdf)
**Type:** academic study (peer-reviewed, ICSE)
**Scope / year:** 12 interviews + 44-respondent survey + 9M reviewed changes, Google, 2018
**Key findings:** Median change is small, has one reviewer, and gets no comments beyond approval. 70% of changes land within 24 hours of being mailed out. Lightweight by design.
**Where useful:** anchor for "what 'normal' review looks like at scale" — when we want to describe a working system.
**Caveats:** Do NOT cite this in the "review is broken" framing — it describes a functioning system and reads as cherry-picking next to the rubber-stamp numbers. Save for a "what good looks like" reference if we add one.
**Used in:** issue #12 (research review only, not recommended for the section itself)

### [Bosu et al. — Characteristics of Useful Code Reviews: An Empirical Study at Microsoft](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bosu2015useful.pdf)
**Type:** academic study
**Scope / year:** 844 review comments across Azure, Bing, Exchange, Office, Visual Studio
**Key findings:** Density of useful comments increases over time on a project — attributed to both project experience and refinement of the reviewing process itself. Review effectiveness is learned, not innate.
**Where useful:** supports the argument that review discipline can be improved deliberately, against fatalism that "reviews are just like that."
**Caveats:** secondary citation; less rhetorical punch than Bacchelli & Bird.
**Used in:** issue #12

### [Code Review at Cisco Systems — SmartBear case study](https://static0.smartbear.co/support/media/resources/cc/book/code-review-cisco-case-study.pdf)
**Type:** vendor-affiliated industry study (still the largest published code-review study)
**Scope / year:** 2,500 reviews, 3.2M LOC, 10 months at Cisco
**Key findings:**
- Defect detection peaks at 200–400 LOC per review; past 400, detection drops sharply
- Inspection rate <300 LOC/hour gives best detection; faster reviewers miss a significant share
- Defect detection collapses after 60–90 minutes of continuous review
- **61% of reviews surfaced zero defects**
- Average 32 defects per 1000 LOC across the corpus
**Where useful:** the "61% find zero defects" stat is the strongest opener for the broken-review-process framing. The 60–90 min cliff and 200–400 LOC sweet spot belong in an operational sidebar.
**Caveats:** SmartBear sells review tooling, but the dataset and methodology are unusually large and the numbers have been re-cited for over a decade without serious challenge.
**Used in:** issue #12

### [SmartBear — 11 Best Practices for Peer Code Review](https://static1.smartbear.co/support/media/resources/cc/11_best_practices_for_peer_code_review_redirected.pdf)
**Type:** vendor write-up (summarizes the Cisco numbers)
**Where useful:** convenient citation when the full Cisco PDF is too long to link.
**Used in:** issue #12

### [Tyler Cipriani — Code Review Decision Fatigue](https://tylercipriani.com/blog/2022/03/12/code-review-procrastination-and-clarity/)
**Type:** practitioner essay
**Key findings:** The easiest decision under fatigue is to opt out — defer review for when you have more energy. Argues that decision quality degrades through the day; leans on the broader decision-fatigue literature (Danziger et al.'s parole-judges study).
**Where useful:** narrative support for the "reviewers vary" argument. Frame as borrowed-from-adjacent-fields; don't present its claims as SE-empirical.
**Caveats:** essay, not a study. Underlying evidence is from non-SE domains.
**Used in:** issue #12

### [Michaela Greiler — Code review challenges that slow down your productivity](https://www.michaelagreiler.com/code-review-pitfalls-slow-down/)
**Type:** practitioner write-up
**Key findings:** Documents reviewer-dependence qualitatively — one reviewer enforces test coverage, another only style; same author gets contradictory feedback depending on who picks up the PR.
**Where useful:** human-scale illustration of the inter-reviewer variance claim where empirical SE numbers don't exist.
**Caveats:** anecdotal; useful for color, not load-bearing.
**Used in:** issue #12

### [Belur et al. — Interrater Reliability in Systematic Review Methodology (Sage, 2021)](https://journals.sagepub.com/doi/full/10.1177/0049124118799372)
**Type:** academic study (meta-science / systematic-review methodology)
**Key findings:** Inter-rater reliability among reviewers is low across decades of meta-science research. Coders attribute disagreement to human error and lack of subject expertise.
**Where useful:** **named-gap citation** in issue #12 — software engineering doesn't have an equivalent landmark study, so we cite the closest analogue (academic peer review) and explicitly say so.
**Caveats:** not SE; cite as analogy, not as direct evidence.
**Used in:** issue #12

### [Inter-reviewer reliability of human literature reviewing (PMC, 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10952858/)
**Type:** academic mixed-methods review
**Where useful:** companion citation to Belur et al. for the inter-rater-reliability gap argument.
**Used in:** issue #12

---

## AI-generated code volume and quality (issue #12, #11)

### [Jellyfish — 2025 AI Metrics in Review](https://jellyfish.co/blog/2025-ai-metrics-in-review/)
**Type:** vendor data report (engineering-metrics tooling)
**Scope / year:** 2025, multi-customer aggregate
**Key findings (verified Nov 2026 re-fetch):**
- 90% of teams use AI in their workflows, up from 61% one year earlier
- Code-assistant adoption: 49.2% (Jan) → 69% (Oct), peaked at 72.8% (Aug)
- Code-review-agent adoption: 14.8% (Jan) → 51.4% (Oct)
- Almost half of companies have ≥50% AI-generated code, vs ~20% at start of year
- Tool share by Oct: GitHub Copilot 60% of AI-assisted PRs (down from 80% in Jan); Cursor ~40% (up from <20%)
- **From their OpenAI partnership analysis:** PRs per engineer +113% (1.36 → 2.9) when adoption goes 0% → 100%; median cycle time −24% (16.7 → 12.7 hours); bug-fix share 7.5% → 9.5% at high-adoption companies
**Where useful:** the adoption-curve numbers (51.4% review-agent growth, 50% companies stat) for the "the line crossed fast" framing. The OpenAI-partnership stats (113% PRs, 24% cycle time) are the cleanest "individual gains are real" anchor.
**Caveats:** vendor-aggregated, methodology opaque. **The "33% PR size growth", "PRs per author +20% YoY", and "23.5% incidents per PR" numbers earlier attributed to Jellyfish in this entry have been moved — 23.5% incidents per PR is actually Cortex.io; the productivity-and-pain-point numbers (98% PRs, 91% review time, 154% PR size, 9% bugs) are Faros AI, not Jellyfish.** See dedicated entries below.
**Used in:** issue #12

### [DX — AI Impact Reports (Q4 2025 + Nov 2025–Feb 2026)](https://getdx.com/research/)
**Type:** vendor data reports (developer experience platform)
**Scope / year:** Two reports —
  - Q4 2025: 135k+ developers
  - Nov 2025 – Feb 2026: **4.2M developers** (the largest empirical study post-December-inflection)
**Key findings:**
- **Q4 2025:** 91% AI adoption; 22% of merged code is AI-authored
- **Nov 2025 – Feb 2026:** **26.9% of new production code is AI-authored** (up from 22% the previous quarter); **92.6% of developers use AI monthly**
- Cited extensively in MIT Tech Review (Dec 2025) and Philippe Dubach's March 2026 synthesis
**Where useful:** the freshest broad-industry adoption number we have, post-inflection. The 26.9% / 4.2M-developer measurement is the strongest "anno 2026" anchor — beats the Q4 2025 22% on recency, beats the BI/Brockman frontier-lab numbers on representativeness.
**Caveats:** vendor; cite via MIT Tech Review (Dec 2025) for the Q4 2025 number if the primary URL isn't stable. The 4.2M-developer number comes from DX's instrumentation, not a survey — measurement methodology is more rigorous than self-report but population is biased toward DX customers (tend to be larger / more mature engineering orgs).
**Used in:** Norlys deck (Volumen slide), issue #12.

### [Faros AI — The AI Productivity Paradox Research Report](https://www.faros.ai/blog/ai-software-engineering)
**Type:** vendor research report (engineering-intelligence platform)
**Scope / year:** July 23, 2025; telemetry analysis of 10,000+ developers across 1,255 teams
**Key findings:**
- Teams with high AI adoption: **+21% tasks completed, +98% PRs merged, +91% PR review time, +154% average PR size, +9% bugs per developer**
- Daily workflow: developers touch 9% more tasks and 47% more PRs per day
- Over 75% of developers use AI coding assistants
- Widespread usage (>60% weekly active users) only began in the last 2–3 quarters before publication
- **No significant correlation between AI adoption and improvements at the company level** — the namesake "productivity paradox"
**Where useful:** the canonical primary source for the "individual gains, no organizational lift" story. Numbers used on the Norlys deck Volumen slide. The +154% PR size and +91% review time are the cleanest "more code, same review process" framing in any single study.
**Caveats:** vendor-published (Faros sells engineering-intelligence platforms — direct interest in showing that productivity needs measurement). Pre-December-inflection (data from June 2025) — the magnitudes may be different post-Opus-4.5 / Claude-Code-GA. Methodology is telemetry-based (more rigorous than survey) but customer-base is biased toward larger / more measurement-minded engineering orgs. Cite as **"Faros, juli 2025"** with sample size on the slide; pair with newer DX 2026 numbers when freshness matters.
**Used in:** Norlys deck (Volumen slide), issue #12.

### [Philippe Dubach — 93% of Developers Use AI Coding Tools. Productivity Hasn't Moved.](https://philippdubach.com/posts/93-of-developers-use-ai-coding-tools.-productivity-hasnt-moved./)
**Type:** independent analyst synthesis
**Scope / year:** March 2026; aggregates 19 studies (METR, DX, DORA, Faros, JetBrains, Bain, Veracode, NBER, MIT/Princeton/Wharton/Microsoft, etc.)
**Key findings:**
- **At 92.6% adoption and 27% AI-generated code, six independent research efforts converge on roughly 10% organizational productivity gains.** This is the central "AI Productivity Paradox of 2026" framing.
- **METR February 2026 update:** the original July 2025 finding (developers 19% slower) has been revised to **−4% (CI: −15% to +9%)** — much weaker effect, no longer statistically significant.
- NBER (Feb 2026, ~6,000 executives): 80%+ of firms report no productivity impact at the 3-year mark; expected 3-year improvement only **1.4%**.
- MIT/Princeton/Wharton/Microsoft field experiment (4,867 developers): no significant gains for above-median-tenure developers.
**Where useful:** the master synthesis source for the "anno 2026" picture. The "six independent studies converge on ~10%" line is the cleanest single statement of the 2026 paradox. Useful as a secondary / aggregator citation when we don't want to chase 19 primary URLs. **Critical for any update to the METR slide** — the Feb 2026 revision changes the headline number meaningfully.
**Caveats:** independent analyst (Dubach is not academic), but the article is heavily linked to primary sources and the framing has become consensus across 2026 industry coverage. **Use as a secondary** when citing the convergent finding; for individual numbers, cite the primary source it aggregates (DX, Faros, METR, NBER, etc.) directly.
**Used in:** Norlys deck (Volumen slide closing line "~10 %"), and a planned METR slide update.

### [CodeRabbit — State of AI vs. Human Code Generation](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report)
**Type:** vendor report
**Scope:** analysis of 470 OSS PRs (also cited in the Pydantic PyAI panel write-up)
**Key findings:** AI-generated code has ~1.7× more issues overall, **75% more logic errors, up to 2.74× more security issues.**
**Where useful:** sharper amplification stat than the headline 1.7× when we want the claim to bite. Logic-error and security multipliers are the load-bearing numbers.
**Caveats:** CodeRabbit sells AI code review tooling — they have a direct interest in this finding. Use as supporting citation, not primary.
**Used in:** issue #12

### [ProjectDiscovery — 2026 AI Coding Impact Report (press release)](https://www.prnewswire.com/news-releases/projectdiscoverys-2026-ai-coding-impact-report-reveals-ai-generated-code-is-outpacing-security-teams-ability-to-keep-up-302749706.html)
**Type:** vendor press release
**Key findings:** 100% of respondents reported increased engineering delivery YoY; 49% attribute most of it to AI; 62% of security teams say keeping up with AI volume is getting harder.
**Where useful:** the security-team angle for the leadership track (#9) — frames volume as a governance problem, not a tooling one.
**Caveats:** press release, not the full report. Vendor framing.
**Used in:** issue #12

### [MIT Technology Review — AI coding is now everywhere (Dec 2025)](https://www.technologyreview.com/2025/12/15/1128352/rise-of-ai-coding-developers-2026/)
**Type:** journalism (cites multiple primary reports)
**Where useful:** stable secondary citation for the DX numbers and the "AI-driven volume saturating mid-level review capacity" framing.
**Used in:** issue #12

### [ShiftMag — State of Code 2025: 42% AI-assisted, 96% don't fully trust it](https://shiftmag.dev/state-of-code-2025-7978/)
**Type:** industry survey write-up
**Key findings:** 42% of code is AI-assisted; 96% of developers say they don't fully trust it.
**Where useful:** the trust gap — useful in the "two-way critique" section to frame why review discipline matters more, not less, with agents.
**Used in:** issue #12

---

## Industry trends and adoption (cross-cutting)

### [2026 Agentic Coding Trends Report](https://resources.anthropic.com/2026-agentic-coding-trends-report)
**Type:** vendor research report (Anthropic)
**Scope / year:** 2026 predictions across eight named trends (foundation / capability / impact), drawing on internal Anthropic Societal Impacts research and named customer case studies. 17-page PDF.
**Key findings:**
- **Collaboration paradox** (Foreword p.3, Trend 4 p.10): engineers report using AI in roughly 60% of their work but being able to "fully delegate" only 0–20% of tasks. Effective use requires "thoughtful set-up and prompting, active supervision, validation, and human judgment — especially for high-stakes work."
- **27% of AI-assisted work is tasks that wouldn't have been done otherwise** (Trend 6, p.13) — scaling projects, nice-to-have tools, exploratory work. Productivity comes "primarily through greater output — more features shipped, more bugs fixed, more experiments run — rather than simply doing the same work faster."
- **Onboarding collapse, weeks → hours** (Trend 1, p.5–6). Sidebar: an Augment Code customer finished a project the CTO had estimated at 4–8 months in 2 weeks using Claude.
- **Role transformation: implementer → orchestrator** (Trend 1, p.6) — named framing.
- **Long-running agents handle multi-hour work**: Rakuten — Claude Code completed a complex activation-vector extraction in vLLM (12.5M LOC OSS library) in 7 hours of autonomous work, single run, 99.9% numerical accuracy. (Trend 3, p.9)
- **Multi-agent coordination case**: Fountain — 50% faster screening, 40% quicker onboarding, 2× candidate conversions; one logistics customer cut fulfillment-center staffing from "one or more weeks to less than 72 hours." (Trend 2, p.8)
- **Regulated-domain case**: CRED (Indian fintech, 15M+ users) doubled execution speed "without eliminating human involvement, but by shifting developers toward higher-value work." (Trend 4, p.10)
- **Telecoms case**: TELUS — 13,000+ custom AI solutions, 500,000+ hours saved, code shipped 30% faster, average 40 min saved per AI interaction. (Trend 6, p.13)
- **Non-technical adoption case**: Zapier — 89% AI adoption org-wide with 800+ AI agents deployed internally. (Trend 7, p.14)
- **Anthropic-internal engineer quote** (Trend 4, p.10): *"I'm primarily using AI in cases where I know what the answer should be or should look like. I developed that ability by doing software engineering 'the hard way.'"*
**Where useful:** load-bearing for the "AI Coding anno 2026" framing in workshop decks (adoption depth + value beyond velocity). The collaboration-paradox stat is the strongest single citation for the "we're not at autopilot, but value is real" framing. The named case studies (CRED, TELUS, Rakuten, Fountain, Zapier, Augment Code) give domain anchors — fintech, telecoms, logistics, OSS infrastructure — for audience-specific decks. The 27% wouldn't-have-been-done number is the cleanest "value beyond velocity" anchor in the literature.
**Caveats:** **Anthropic-published** — they have a direct commercial interest in adoption growing. Treat the *case studies* (CRED, TELUS, Rakuten, Fountain, Zapier, Legora, Augment Code) as the load-bearing evidence: those are externally verifiable claims attributed to named organisations. Treat *Anthropic's internal claims* (60%/0–20% split, the 27% number, the productivity-through-volume framing) as legitimate but vendor-sourced — when citing on a slide, name Anthropic as the source so the audience can weigh it. Pair Anthropic-internal claims with an external practitioner voice (Mollick, Karpathy, Pydantic panel) to avoid sole-source bias. Predictions framed as "we expect X in 2026" are forecasts, not measurements — don't cite them as facts.
**Used in:** Norlys deck (`decks/audiences/norlys-2026-05-05/`), `docs/research-summary.md` entry #16. Cross-relevant to issues #4 (culture), #7 (developer-as-manager), #9 (who codes), #12 (volume).

### [Business Insider — OpenAI's president says AI has gone from writing 20% to "80% of your code"](https://www.businessinsider.com/openai-president-ai-now-writing-80-percent-of-code-2026-5)
**Type:** industry write-up (Business Insider, journalism — secondary citation of CEO/exec statements)
**Scope / year:** May 2026; aggregates statements from OpenAI's Greg Brockman (Sequoia Capital talk), Google's Sundar Pichai, Meta's internal expectations (BI reporting), and Anthropic's Dario Amodei.
**Key findings:**
- **Greg Brockman (OpenAI president, Sequoia Capital talk, ~May 2026):** *"If you look even over the course of December, we went from these agentic coding tools writing 20% of your code to writing 80% of your code. Which means they go from being kind of a sideshow to being the main thing that you're doing."*
- **Brockman on human responsibility:** *"That thoughtfulness of not just saying 'oh just blindly use' this or 'we don't want to use this at all.' I think neither extreme is quite right."* OpenAI ensures a human is responsible for all code that is merged.
- **Sundar Pichai (Google):** 75% of new code at Google is AI-generated and reviewed by human engineers. Trajectory: **25% (2024) → 50% (2025) → 75% (2026)**. Three-year curve from one named source.
- **Meta (BI reporting, March 2026):** 65% of engineers in the creation organization expected to write more than 75% of their committed code using AI.
- **Dario Amodei (Anthropic CEO):** *"I think we will be there in three to six months, where AI is writing 90% of the code. And then, in 12 months, we may be in a world where AI is writing essentially all of the code."* Plus: *"Because AI is now writing much of the code at Anthropic, it is already substantially accelerating the rate of our progress in building the next generation of AI systems."*
**Where useful:** the **frontier-labs adoption picture** in the "Agentic coding anno 2026" deck section. Specifically: solves the staleness problem of citing the DX Q4 2025 22% number alone — this gives May 2026 trajectory data from named CEOs across OpenAI, Google, Meta, Anthropic. The Pichai 25% → 50% → 75% trajectory is the cleanest single-source curve for the "the line crossed and the slope is steep" framing. Brockman's "neither extreme is right" quote is also a clean external-voice version of the playbook's "human in the loop" stance.
**Caveats:** **Multi-vendor CEO statements aggregated by journalism** — not measured studies. Every quoted exec sells AI tools or builds AI products; treat each individual percentage as a self-report, not a verified measurement. The Brockman "20% → 80% over December" quote is anecdotal and the "your code" referent is ambiguous (his audience? OpenAI internal? the agentic-coding subset of work?). The Meta number is an *expectation*, not a measurement. **NOT directly comparable to the DX 22% broad-industry survey** — different populations (frontier labs vs cross-industry), different measurement methods (CEO claims vs 135k-developer survey). Cite together as "broad industry baseline + frontier-lab leading edge", never as one continuous metric. Where possible, prefer primary citations: Brockman's Sequoia talk (video), Pichai's earnings call statements, Amodei's blog post for his quotes. The strength of the source is the *agreement across competitors* — when OpenAI, Google, Meta, and Anthropic all converge on similar directional claims despite cross-incentives, the directional signal is harder to dismiss than any single number.
**Used in:** Norlys deck (`decks/audiences/norlys-2026-05-05/`). Cross-relevant to issues #7 (developer-as-manager — the "merge responsibility" angle), #12 (volume amplification).

> [!info] Active tension with the DX Q4 2025 entry below
> The Brockman / Pichai numbers (75–80% AI-authored at frontier labs, May 2026) are not directly comparable to the DX 22% (broad-industry, Q4 2025). Different populations, different methods. Treat the DX number as the *broad-industry baseline* and the BI numbers as the *frontier-lab leading edge* — together they tell a trajectory, but presenting either alone is misleading. Update DX's "headline number" framing accordingly when citing in new modules.

### [GAI Insights — The Claude Code and Cowork Moment](https://gaiinsights.substack.com/p/the-claude-code-and-cowork-moment)
**Type:** analyst newsletter (Paul Baier, GAI Insights — AI strategy consultancy)
**Scope / year:** January 19, 2026; analysis of the November 2025 Opus 4.5 release and its perceived inflection effect on agentic coding viability.
**Key findings:**
- **Claude Opus 4.5 released November 2025** — first frontier model to break 80% on SWE-bench Verified, scoring **80.9%**. This is the cleanest concrete technical anchor in the literature for the "December inflection" framing that Karpathy and others reported.
- **Sergey Karayev:** *"Claude Code with Opus 4.5 is a watershed moment, moving software creation from an artisanal, craftsman activity to a true industrial process."*
- **Zach Loyd (Warp CEO):** *"Claude Opus 4.5 excels at long-horizon, autonomous tasks, especially those requiring sustained reasoning."*
- **Boris Cherny (Head of Claude Code) on Claude Cowork:** *"All of it [Claude Cowork code]… We had to plan, design, and go back and forth with Claude."*
- **Claude Cowork case study:** 4-person Anthropic team built the product end-to-end in a 1.5-week sprint using Claude Code for complete code generation. Concrete proof of the "long-horizon autonomous work" claim.
**Where useful:** answers the "why did agentic coding start working in late 2025?" question with concrete technical anchors (Opus 4.5, SWE-bench 80.9%, model + harness convergence). Slot 1: the Karpathy slide footnote in the Norlys deck — provides the "what changed in November" detail behind Karpathy's "started working in December" claim. Slot 2: the "Hvad har ændret sig?" slide — could supplement with the SWE-bench number as the model-side anchor. Slot 3: the "where it's heading" sub-section — the 80.9% SWE-bench anchor pairs naturally with the Amodei/Brockman trajectory predictions ("here's where the curve crossed; here's where they think it goes next").
**Caveats:** **Analyst newsletter**, not peer-reviewed research. Paul Baier runs GAI Insights, a paid AI-strategy consultancy with commercial interest in being seen as credible in the space; tends to write favorably about frontier AI labs. The quoted voices (Karayev, Loyd, Cherny) are all Anthropic-adjacent: Karayev runs an Anthropic-aligned startup, Loyd's Warp partners with Anthropic, Cherny works at Anthropic. Treat the directional framing as commentary, not independent verification. **The 80.9% SWE-bench number is verifiable from Anthropic's own model card** and is the strongest single claim to cite — quote it with the source named so the audience can weigh it. Pair the "watershed moment" framing with external practitioner voices (Karpathy, Mollick) when used in front of a sceptical audience. The "industrial process" metaphor is the article's editorial thesis, not a measured finding.
**Used in:** Norlys deck Karpathy slide footnote (`decks/audiences/norlys-2026-05-05/`). Cross-relevant to the Anthropic 2026 Trends Report entry above — both anchor the late-2025 inflection from different angles (Trends Report is forward-looking predictions; this is backward-looking explanation of what crossed the threshold).

---

## Practitioner perspectives

### [Pydantic — Code Review in the Age of AI: PyAI Panel Discussion](https://pydantic.dev/articles/pyai-oss-panel)
**Type:** panel write-up (Samuel Colvin, Guido van Rossum, Jeremiah Lowin, Sebastián Ramirez)
**Key quotes worth citing:**
- **Guido van Rossum on large PRs:** "If someone confronts you with 10,000 lines of code, I find it real hard to believe that those are the right 10,000 lines of code." Plus: "I would much rather co-develop that PR from small beginnings, with occasionally bursts of code written by a model but carefully reviewed then." — load-bearing quote for the incrementalism bullet in 06.
- **Jeremiah Lowin on scoping:** "I think it's about creating an environment where explaining the code is of paramount importance." — supports the "checks reasoning, not diff" bullet.
- **Sebastián Ramirez on disclosure:** attaches model, prompts, and full conversation history to AI-assisted PRs he sends to other people's projects. Concrete behavior to recommend in #11 / #9.
- **Samuel Colvin's 4 conditions for 10–20× AI acceleration:** internal systems known to model; external interfaces well-defined; unit tests exist or easily generated; no dispute about interface specs. (Belongs in a different chapter — scoping, not review.)
**Where useful:** named-practitioner voices that match the empirical picture from the data sources above. Useful when the audience trusts maintainer instincts more than vendor numbers.
**Caveats:** panel discussion, not research. Use for color and authority, not as evidence.
**Used in:** issue #12

---

## How to add a new source

1. Pick the right section (or add one if no existing topic fits).
2. Use the entry template above.
3. Always include caveats, even short ones — "vendor-published" or "single anecdote" matters when the source gets re-used six months later.
4. Cross-link the issue or PR where the source was first used, so future contributors can see how the framing evolved.
