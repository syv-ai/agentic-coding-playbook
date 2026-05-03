# Research notes — "Agentic coding anno 2026" section

Working facts gathered from `docs/internal/sources.md` and `docs/research-summary.md` for the slides that follow "Hvad bruger folk faktisk?". Goal: a curated pool of facts to choose from when extending or restructuring this section.

## Editorial principle (applies throughout this file)

The Anthropic 2026 Agentic Coding Trends Report ([entry in `sources.md`](../../docs/internal/sources.md)) is now a primary source for several of these facts. Anthropic has a direct commercial interest in adoption growing, so the discipline is:

- **Cite Anthropic-internal claims (the 60%/0–20%, the 27%, the productivity-through-volume framing) by naming Anthropic on the slide** so the room can weigh them. Don't strip the source.
- **Treat the named case studies (CRED, TELUS, Rakuten, Fountain, Zapier, Augment Code) as the load-bearing evidence** — they are externally verifiable claims attributed to named organisations, which carries more independent weight.
- **Pair Anthropic-internal stats with an external practitioner voice** (Mollick, Karpathy, Pydantic panel) on the same slide or in adjacent narrative — avoids sole-source bias.

The Anthropic-internal engineer quote ("I'm primarily using AI in cases where I know what the answer should be...") is useful in speaker notes but should not be the headline citation on a slide. The same point lands harder from Mollick or van Rossum.

---

## Current flow after "Hvad bruger folk faktisk?"

1. **22%** AI-authored merged code (DX)
2. **Uber example** — 1,800 changes/week, 95% engineer adoption
3. ✅ **27% wouldn't-have-been-done** (Anthropic Trends Report) — added 2026-05-03
4. **Volumen ændrer sig** — Jellyfish speed/quality numbers
5. **19% slower** — METR perception-vs-reality
6. **Hvor virker agenter** — distribution diagram
7. **Fem opgaver hvor det giver mening at starte** — concrete starter list

---

## Theme A — Adoption is wider than the room thinks

The opener of the section (22% slide) is one data point. There are several other adoption stats that make the same argument from different angles, useful as backup talking points.

- **91% of developers use AI in some form.** *Source:* DX Q4 2025 report (135k+ developers), via MIT Tech Review. *Use:* talking point under the 22% slide. Counters "but our team isn't using it" — yes, you are; you may not be tracking it. ✅ Already in speaker notes.
- **~50% of companies have ≥50% AI-generated code in merged PRs**, up from ~20% at start of 2025. *Source:* Jellyfish 2025 AI Metrics in Review. *Use:* candidate slide if you want to anchor "this is now the median, not the leading edge." Strong leadership-track angle.
- **Code-review-agent adoption: 14.8% → 51.4% during 2025**, jump aligned with Copilot Code Review GA in Mar–Apr. *Source:* Jellyfish 2025. *Use:* talking point on the same slide as 22%, or its own micro-slide showing the curve. Strong "the line crossed while people were still debating it" framing.
- **42% of code is AI-assisted; 96% of developers don't fully trust it.** *Source:* ShiftMag State of Code 2025. *Use:* the 96% number is the killer here — pairs with the "PhD og 10-årig" framing. Could be a standalone callout slide. Strong tone-match for sceptisk-friendly Norlys audience.
- **100% of respondents report increased engineering delivery YoY; 49% attribute most of the increase to AI; 62% of security teams say keeping up with AI volume is getting harder.** *Source:* ProjectDiscovery 2026 AI Coding Impact Report (vendor press release, weak methodology). *Use:* the 62% security number is most useful — leadership-track-coded but lands for Norlys because of regulatory exposure. Skip the 100%/49% (press-release framing).

## Theme B — The collaboration paradox (data-backing for "not autopilot")

Anchors the takeaway line on the PhD/10-årig slide. Without these numbers, "we're not at autopilot yet" is an opinion. With them, it's the dominant pattern.

- **~60% of developer work uses AI; only 0–20% is "fully delegated"**, with the gap explained as "thoughtful set-up and prompting, active supervision, validation, and human judgment — especially for high-stakes work." *Source:* **Anthropic 2026 Trends Report, Foreword (p.3) and Trend 4 (p.10)** — now a primary citation. *Use:* the most important fact missing from the section. Could be its own slide right after PhD/10-årig: "Folk bruger AI, men de uddelegerer ikke endnu". Strong candidate for inclusion. Per editorial principle, name Anthropic as source on slide.
- **96% of devs don't fully trust AI** *(also under Theme A).* *Source:* ShiftMag — independent industry survey, no vendor incentive issue. *Use:* the *external* counterweight to the Anthropic-internal 0–20% delegation number. Together they make a complete argument: we use it (Anthropic), we don't trust it (ShiftMag), so we don't delegate it (Anthropic again).

## Theme C — What unlocks ("flere måder end mange tror")

This is the bridge promise from the PhD/10-årig takeaway. ✅ The 27% slide now delivers the headline of this theme — the items below are remaining angles.

- ✅ **27% of AI-assisted work is tasks that wouldn't have been done otherwise** — scaling projects, nice-to-have tools, exploratory work. *Source:* **Anthropic 2026 Trends Report, Trend 6 (p.13)** — primary citation. **Now on slides** (added 2026-05-03 between Uber and Volume). Speaker notes pair it with Mollick's "reverse salients" framing from his Substack post "The Shape of AI" (verified concept attribution).
- **Onboarding collapse: weeks → hours.** *Source:* Anthropic Trends Report Trend 1 (p.5–6). Sidebar example: an Augment Code customer finished a project the CTO had estimated at 4–8 months in 2 weeks. *Use:* concrete value angle that isn't about velocity. Could be a small mention or its own micro-slide. Lands well for a leadership-adjacent audience.
- **Long-running agents: Rakuten — Claude Code completed a complex activation-vector extraction in vLLM (12.5M LOC OSS library) in 7 hours of autonomous work, single run, 99.9% numerical accuracy.** *Source:* Anthropic Trends Report Trend 3 (p.9). *Use:* concrete proof that long-running agents handle hard technical work, not just CRUD. **Externally verifiable** (named company, named library, specific result) — strongest case-study evidence in the report. Could replace or supplement the Uber example for a more technically-deep audience.
- **Sam Colvin's 4 conditions for 10–20× AI acceleration:** (1) internal systems known to the model, (2) external interfaces well-defined, (3) unit tests exist or are easily generated, (4) no dispute about interface specs. *Source:* Pydantic PyAI panel discussion. *Use:* the most practitioner-credible "where does the speedup actually come from?" framing. Best fit: just before "Hvor virker agenter" diagram, as a concrete checklist behind the abstract distribution. **External practitioner voice** — good pairing with the Anthropic-internal numbers.

## Theme D — Where the human is still in the loop (counter-balance)

The METR slide is great. Reinforcing facts from different angles, useful if you want to land the message harder before transitioning into best practices.

- **Comprehension debt: experienced devs 19% slower despite predicting they'd be 24% faster.** *Source:* METR randomized study (July 2025), reinforced by Nimbalyst write-up. *Use:* you already have the 19%. The +24%-prediction number makes the **40-percentage-point gap** in the "Det de troede — og det de målte" slide. Verify the slide wording matches study numbers exactly.
- **60% use, 0–20% delegate** *(Theme B above).* *Use:* both anchor "human still required" and "value already there." Same fact lands twice depending on framing.
- **96% don't fully trust AI** *(Theme A above).* *Use:* the trust gap *is* the human-in-the-loop argument from the developer's own mouth.
- **Anthropic-internal engineer quote:** *"I'm primarily using AI in cases where I know what the answer should be or should look like. I developed that ability by doing software engineering 'the hard way.'"* *Source:* Anthropic Trends Report Trend 4 (p.10). *Use:* **speaker notes only** — strong articulation of the developer-track stance, but per editorial principle the headline citation should be an external practitioner. Useful when answering "but how do you know when to trust it?" from the room.

## Theme E — Quality amplifies (transitions into best practices)

The Jellyfish numbers (review +91%, incidents +23.5%) already do this work.

- **AI-generated code has 1.7× more issues overall, 75% more logic errors, up to 2.74× more security issues.** *Source:* CodeRabbit, analysis of 470 OSS PRs. *Use:* if you want the quality-cost message louder. **Caveat:** CodeRabbit sells AI code review tooling — direct interest. Use as *supporting*, not primary. Name the vendor on the slide.
- **62% of security teams say AI volume is getting harder to keep up with.** *Source:* ProjectDiscovery (press release; vendor). *Use:* a reasonable supporting number for leadership-track. For Norlys-Track-2 (developers), probably skip.

## Theme F — Pre-conditions for value (sets up best practices block)

Currently implicit. Could be made explicit with one slide that bridges from "value is there" → "but only if you do these things" → best practices block.

- **Average enterprise codebase scores 5.15/10 on code health; agent safety threshold is 9.4+.** *Source:* CodeScene benchmarks. *Use:* the gap between average and threshold is the most concrete "your codebase needs work before agents help" framing. Strong slide candidate, especially for a hard handoff into best practices: *"Det her er gennemsnittet. Det her er hvad I skal hen mod."*
- **MCP-guided refactoring produces 2–5× more structural improvement than unguided.** *Source:* CodeScene. *Use:* supports the broader "infrastructure makes agents better" point. Better in best-practices block.
- **LLMs follow ~150–200 instructions consistently; tool system prompts already use ~50 of those slots.** *Source:* Augment Code. *Use:* concrete operational fact for a developer audience. Best in best-practices block when introducing instruction files.

## Theme G — Named case studies (cross-verifiable adoption depth)

Per editorial principle, these are the load-bearing evidence from the Anthropic Trends Report — externally verifiable claims attributed to named organisations. Useful both as direct slide content and as talking-point backup when the audience challenges adoption claims.

- **Uber.** Praveen Neppalli, Uber CTO: 1,800 code changes/week from internal background-coding-agent; 95% of engineers use AI monthly across all tracked tools. *Source:* tweet by @praveenTweets, 16. marts 2026. ✅ Already on slides.
- **CRED.** Indian fintech, 15M+ users. **Doubled execution speed** "without eliminating human involvement, but by shifting developers toward higher-value work." *Source:* Anthropic Trends Report Trend 4 (p.10). *Use:* the regulated-domain case. Strong Norlys parallel: regulated, high-stakes, financial. **Better than Uber for the human-still-in-loop point** because the framing explicitly preserves human involvement.
- **TELUS.** Telecoms. **13,000+ custom AI solutions** built by teams; **500,000+ hours saved**; code shipped 30% faster; average **40 min saved per AI interaction**. *Source:* Anthropic Trends Report Trend 6 (p.13). *Use:* different domain than Uber, similar adoption depth. The "13,000 custom solutions" number is striking — speaks to non-engineers building tools, which is relevant to the leadership half of any audience.
- **Rakuten.** *(See Theme C above.)* 7-hour autonomous run on vLLM, 99.9% accuracy.
- **Fountain.** Frontline workforce platform. 50% faster screening, 40% quicker onboarding, 2× candidate conversions using hierarchical multi-agent orchestration. One logistics customer cut fulfillment-center staffing from "one or more weeks to less than 72 hours." *Source:* Anthropic Trends Report Trend 2 (p.8). *Use:* multi-agent / orchestration angle. Probably too niche for Norlys-Track-2 main flow but useful talking point if someone asks about agent teams.
- **Zapier.** **89% AI adoption org-wide; 800+ AI agents deployed internally.** *Source:* Anthropic Trends Report Trend 7 (p.14). *Use:* non-engineering adoption — leadership-track. Skip for Norlys-Track-2 unless someone asks about org-wide rollout.
- **Augment Code customer.** Engineer joining a new codebase finished a project the CTO had estimated at **4–8 months in 2 weeks** using Claude. *Source:* Anthropic Trends Report Trend 1 sidebar (p.6). *Use:* the cleanest single anecdote for the onboarding-collapse claim.

## Theme H — Role transformation

The PhD/10-årig slide already implies this. The Trends Report names it explicitly.

- **Implementer → orchestrator** as the named framing. *Source:* Anthropic Trends Report Trend 1 (p.6). *Use:* a short framing line on a slide that closes the section, or absorbed as language in speaker notes. Connects directly to the planned "every developer is now an engineering manager" framing (#7 in the issue coverage plan).
- **Productivity through output volume, not just speed.** *Anthropic's own internal data:* "engineers report a net decrease in time spent per task category, but a much larger net increase in output volume." *Source:* Anthropic Trends Report Trend 6 (p.13). *Use:* this is the cleanest reconciliation of the METR finding (per-task slower) with the Jellyfish finding (more PRs merged). Could be a one-line callout on the Volume slide. Reframes apparent contradictions into one coherent picture.

---

## My recommendations for what to add (updated 2026-05-03)

**Done in this pass:**

- ✅ **27% wouldn't-have-been-done slide** added between Uber and Volume. Paired with Mollick's "reverse salients" framing in speaker notes (external practitioner counterweight to the Anthropic-internal stat).

**Highest leverage — still pending:**

1. **Collaboration-paradox slide** (Theme B) — 60% use vs. 0–20% delegate. The most important remaining missing fact. Anchors "we're not at autopilot endnu" with data instead of opinion. Could go right after the PhD/10-årig slide as the empirical landing of its takeaway. Pair the 60% (Anthropic) with 96% don't trust (ShiftMag) on the same slide for source diversity.
2. **CRED case study** (Theme G) — strong fintech / regulated-domain anchor. Could replace the Uber slide for a Norlys-fit narrative, or sit alongside it as a second concrete example.
3. **Sam Colvin's 4 conditions** (Theme C) — concrete framework for *when* you get the 10–20× speedup. Best fit: just before "Hvor virker agenter" diagram. External practitioner voice.

**Medium leverage — strengthens what's already there:**

4. **Trust gap callout** (Theme A/D) — 96% don't fully trust AI. Could be a small callout on the collaboration-paradox slide or its own micro-slide.
5. **Onboarding collapse with the Augment Code anecdote** (Theme C, Theme G) — value beyond velocity. Could fold into an existing slide as a one-line anecdote rather than a full slide.
6. **Code-health pre-condition** (Theme F) — 5.15/10 average vs. 9.4 threshold. Strong handoff into the best-practices block. Worth considering as the closing slide of the section.

**Skip or keep in speaker notes only:**

- CodeRabbit numbers (1.7×, 75%, 2.74×) — vendor source on a quality-amplification claim. Jellyfish does the same work without the vendor incentive problem.
- ProjectDiscovery 100% / 49% numbers — press release.
- Zapier, Fountain — too far from a developer audience's daily concerns.
- Anthropic-internal engineer quote — speaker notes only, per editorial principle.

---

## Source provenance

- DX Q4 2025 report → cited via MIT Tech Review when the primary URL isn't stable
- Jellyfish 2025 AI Metrics in Review → vendor-aggregated, methodology opaque, but widely re-cited and uncontested
- ShiftMag State of Code 2025 → independent industry survey
- **Anthropic 2026 Agentic Coding Trends Report** → primary source for collaboration paradox, 27%, role transformation, and case studies. Vendor-published — name Anthropic on slides for internal claims; treat case studies as load-bearing. Full entry in `docs/internal/sources.md`.
- METR (July 2025) → academic randomized study, the strongest single empirical citation in the section
- Pydantic PyAI panel → practitioner voices (van Rossum, Colvin, Lowin, Ramirez); use for color and authority
- CodeScene benchmarks → vendor research, peer-reviewed methodology, well-regarded
- ProjectDiscovery / CodeRabbit → vendor press / vendor blog; flag the vendor when citing
- Mollick — *The Shape of AI: Jaggedness, Bottlenecks and Salients* (One Useful Thing Substack) → external practitioner framing for the 27% slide

Full provenance and caveats live in `docs/internal/sources.md`.
