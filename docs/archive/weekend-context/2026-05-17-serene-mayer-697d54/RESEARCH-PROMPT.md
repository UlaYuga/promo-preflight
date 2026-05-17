# Deep research prompt — Promo Preflight × emerging markets pain

> Скопируй всё что ниже в новый чат с ChatGPT Deep Research (или Claude DR / Gemini DR — любой). Не редактируй. Ответ пришли мне как есть в текстовом виде.

---

I'm building a product called **Promo Preflight** — a pre-launch readiness check for iGaming operators expanding into multiple jurisdictions. The product runs deterministic checks against a campaign bundle (offer terms, T&C, channel copy, links, payment methods, owner approvals, localization) before it goes live in a new market.

The target customer is operators working with white-label platforms like **01.tech**, who simultaneously operate across **Tier-1 licensed EU, lawfully regulated emerging markets (Brazil, Colombia, Mexico, Argentina), and offshore/grey segments (Russia, CIS, Turkey, India, Malaysia, Africa)** — and need to adapt every campaign to each jurisdiction's specific rules every quarter.

I have already read the **01.tech × G GATE MEDIA "01 Global iGaming Report" (Feb 2026, 159 pages)**. It established the macro picture for me. Now I need a **deeper, source-cited report on the specific operational and regulatory failures** that Promo Preflight should catch, so I can write a credible README and case study.

Please produce a structured report with the following sections. Each claim must include a source link (regulator filing, news article, industry report, operator statement, court ruling, sanction order). If you can't find a hard source, mark the item "industry estimate" and explain the basis.

## Section 1 — Real operational disasters from cross-jurisdictional promo / launch failures

Find and summarize at least 10 specific incidents where an iGaming operator suffered a measurable loss (fine, license suspension, payment processor freeze, domain block, ad account ban, reputational damage with concrete numbers) because a promo or campaign was not properly adapted to a jurisdiction's rules.

Prioritize cases from the **target geographies** (in order of importance):
1. **Brazil** — under SPA/MF #3, SPA/MF #1.885/2025, SPA/MF #338/2025, MESP #31, PL 5473/2025
2. **Colombia** — Resolución #20250022644, temporary deposit tax
3. **Mexico** — Circular 1/2025 Banco de México (SPEI rules), LFPDPPP, LFPIORPI
4. **Argentina** — provincial fragmentation (Resolución 13510 Córdoba, DGR 23/2025 Misiones, 1755/25, etc.)
5. **India** — full ban on online real-money gaming, 30%+1% TDS tax, UPI Collect cut-off
6. **Malaysia** — expanded social media platform liability for iGaming content
7. **South Korea** — VASP licensing, anonymous wallet ban, extraterritorial content control
8. **Germany** — Baden-Württemberg fragmentation, 8C 3.24 federal ruling, stake limits
9. **UK** — UKGC RTS update, online slot stake caps (£2 / £5), remote gambling tax hike
10. **Italy** — Decree 41/2024, personal deposit/bet limit rules
11. **Poland** — AML tightening, lootbox legislation
12. **Russia** — TRON/USDT payment dominance, advertising restrictions

For each incident, document:
- Operator name (or "unnamed operator, [country]" if anonymized in the source)
- Year/month
- Specific failure (e.g. "promo creative used 'risk-free' wording prohibited under UKGC LCCP", "T&C did not disclose Brazilian SPA/MF max bet rule", "payment method shown in landing page was unavailable in target geo after Banco de México SPEI rule")
- Concrete loss: fine amount (original currency + USD), license consequence, processor freeze duration, ad spend wasted, retention impact
- Direct quote from the regulator/court/news source
- Source link

## Section 2 — Mandatory T&C clauses by jurisdiction (the actual rule text)

For each of the 12 jurisdictions above, list the mandatory promotional T&C clauses with **specific wording requirements** where they exist. Categories:

- Maximum bet during bonus play and consequence rules
- Wagering requirement disclosure format
- Eligibility (geo, age — note that age is 18 in most of EU but 21 in some US states and some MENA, and minimum 25 in some jurisdictions; document the actual requirement per country)
- Cashout / withdrawal rules
- Game contribution percentages disclosure
- Maximum cashout from bonus winnings
- Bonus expiry disclosure
- Responsible gambling messaging — what exact text and which logos/links must appear
- "Risk-free" / "guaranteed" wording prohibitions (and other prohibited words per regulator)
- Restricted jurisdictions list (which countries the operator must explicitly exclude)
- License identification (license number must be displayed where, with what minimum font size if specified)
- Operator legal entity disclosure

Where exact wording is required (mandatory disclaimers), quote it verbatim. Where the rule is implicit (precedent only), note the precedent.

## Section 3 — Payment and crypto compliance per jurisdiction

This is the most product-specific section. For each of the 12 jurisdictions, document:

1. **Which payment methods are legal / illegal / grey for iGaming** (e.g. UPI in India was usable until SPA cut-off; SPEI in Mexico has Circular 1/2025 restrictions; Pix in Brazil has anti-money-laundering rules for gaming; iDEAL in Netherlands is whitelisted; SEPA Instant in EU has KYC requirements).
2. **Which cryptocurrencies are allowed / mandated / forbidden** (Russia 100% crypto-first with USDT/TRX/BTC/LTC/ETH; Algeria all virtual currency illegal; Turkey grey; Brazil regulated through PL 4173/2023; Nigeria post-eNaira framework).
3. **Mandatory disclosure language** when crypto is mentioned in a promo (e.g. "cryptocurrency value may fluctuate" disclaimers, KYC/source-of-funds notices).
4. **Banned payment-marketing patterns** (e.g. instant-deposit promises after Circular 1/2025; "no KYC needed" claims after FATF travel rule).

## Section 4 — Localization beyond translation — what regulators check

Find evidence (from regulator audits, fines, or operator post-mortems) of cases where a translation was technically correct but failed because of jurisdictional specifics:

- Cultural references that work in one market and break in another (e.g. references to alcohol, religion, gender)
- Currency display format (decimal separator, currency symbol position) when wrong = consumer protection violation
- Date / time format causing T&C ambiguity
- Locale-specific responsible-gambling phrasing (e.g. Spain's "Juega con responsabilidad" exact phrasing requirement, Sweden's Spelpaus self-exclusion mention)
- Age verification phrasing (18+ vs 21+ confusion across markets)
- Imagery / iconography prohibited per region (e.g. religious imagery, gambling-positive imagery for under-25s in UK)

## Section 5 — Affiliate / influencer / streamer compliance

The 01.tech report calls out specific operator cases: BK8 partnering with Lam Chi-Chung (Telegram-promo April 2025), WE88 with Adele Lew (motorsport), We1Win with Ronnie O'Sullivan (snooker), 7Games growing 4x via journalist Luis Bacci's native ads, Brazino777 via Aviator reels by influencers, Stake via Argentinian streamers (c0ker, gonchо).

Find documented cases where:
- Influencer / streamer / affiliate promo violated a specific regulation (e.g. Brazil Conar advertising code; UK ASA / UKGC LCCP 17.3.2 social media rules; Spain DGOJ celebrity restrictions; Italy Dignity Decree)
- The operator was held liable for the affiliate's content
- Specific fines or sanctions imposed

## Section 6 — White-label platform customer landscape

Identify the major white-label / B2B iGaming platforms competing with or adjacent to 01.tech:
- SoftSwiss / SOFTSWISS
- BetConstruct
- EveryMatrix
- Pronet Gaming
- BetB2B (NuxGame)
- White Hat Gaming
- DIGITAIN

For each: their target geographies, their main differentiation, do they have anything resembling promo compliance tooling, what gaps exist that Preflight could fill.

## Section 7 — 5 verbatim quotes for marketing

Find 5 short (under 30 words each), real, attributable quotes from people in the industry — operator CRM/Promo leads, compliance officers, regulators, ex-platform employees, affiliate managers — that capture the **specific pain of multi-jurisdictional promo launches**. Format:

> "Quote text here." — **Name**, Title at Company, year, [source]

Prefer quotes from public LinkedIn posts, conference talks (SiGMA Rome, SBC Lisbon, iGB London, Conversion Conf Warsaw — these are the conferences 01.tech employees attend), EGR / iGaming Business / SBC News / Slotegrator blog articles, Telegram channels: "Affiliate Tea-Party", "По Уши в Гембле", "SEO Деньги Два Слота", "Тихий час".

## Section 8 — Specific blockers Preflight should catch in a Brazilian welcome offer launch case study

Construct a detailed walkthrough: a fictional operator "Acme Casino" wants to launch a "100% up to R$500" welcome offer in Brazil under the current SPA/MF regime (as of Q2 2026). Produce:

- The full T&C text that would be required to be compliant (in Portuguese, with English translation)
- A list of 8-12 specific blockers an unprepared operator would introduce (each with: rule reference, what they did wrong, exact regulator-cited fine amount or precedent)
- The "fixed" version of the campaign that would pass
- What CRM/Promo Ops manager workflow at a typical operator looks like for this kind of launch today (manual)
- Quantified estimate: hours saved if a tool like Preflight catches these blockers automatically

## Section 9 — Output format

Return the report as a single markdown document with:
- A 7-bullet executive summary at the top
- Each section as an H2 heading
- Every concrete claim followed by a source link in parentheses
- A final "Methodology and gaps" section listing what you couldn't find and why
- Where the 01.tech report already establishes a fact, briefly cite it as `[01.tech G GATE Report 2026, ch. X]` and don't duplicate the analysis — go deeper

Length target: 4000-6000 words. Density over fluff. No marketing language. No invented data.

If you genuinely cannot find sources for a section, say so explicitly — do not invent.
