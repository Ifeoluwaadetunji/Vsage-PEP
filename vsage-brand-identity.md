# Vsage — Brand Identity Brief

**Scope:** This brief covers **Vsage**, the studio/company. It is a sibling document to [`design-system.md`](./design-system.md), which covers **TradeOS**, one of Vsage's products. Where TradeOS is a product UI system (buttons, badges, dashboards), this is a company-level identity (how Vsage presents itself across its site, decks, docs, and as the "by Vsage" mark on every product it ships).

---

## 1. Identity Strategy Statement

Vsage is a software studio that builds focused, vertical B2B tools for operators in industries legacy software ignores — starting with trade and wholesale distribution via TradeOS. The identity needs to do one job: signal **engineering credibility to a technical or operationally-sharp buyer** without performing "startup energy." No gradients-and-confetti SaaS marketing, no corporate holding-company blankness. The visual language borrows more from technical documentation, IDEs, and precision instruments than from consumer tech — deliberate, quiet, exact. Every product Vsage ships should feel like it came from the same disciplined hand, even when each product's own UI (like TradeOS's navy/teal/cream) diverges. Color is used sparingly and functionally, never decoratively. Typography carries most of the weight: a monospace or grotesk-adjacent display face reads as "engineered," not "designed to impress."

---

## 2. Logo Direction

**Style:** Wordmark-first, no pictorial mark. At studio scale, a wordmark is more flexible across products, decks, and docs than an icon that has to mean something.

**Character:**
- Set in the display typeface (Space Grotesk, see §4), all lowercase: `vsage`
- Tight letter-spacing, slightly negative tracking — reads as a single compact unit, not spaced-out "startup lockup" style
- No enclosing shape, no icon, no gradient fill — solid color only (ink or paper, see §3)
- A single geometric mark is permissible as a *secondary* asset (favicon, avatar, loading state) — not a logo replacement: a monospace `>` or `_` cursor glyph, or a single squared bracket `[ ]`, reinforcing the "tool/instrument" association without becoming a mascot

**Product lockup rule:** Every Vsage product carries a small "by vsage" wordmark, set in DM Sans, uppercase, wide letter-spacing (`0.12em`), at ~35–40% the size of the product's own wordmark, at reduced opacity. This pattern already exists correctly in TradeOS's [Navbar.tsx](../src/components/landing/Navbar.tsx) and [Footer.tsx](../src/components/landing/Footer.tsx) — extend it verbatim to future products rather than reinventing per-product.

**References:** Vercel (wordmark discipline, no unnecessary icon), Linear (precision typography, restrained color), Stripe's developer docs (not stripe.com marketing) — technical, not consumer.

**Constraints:**
- Must read at 16px favicon size and on a 1080p pitch deck title slide with equal confidence
- Must work as a single flat color (no gradient dependency) for contexts like GitHub org avatars, terminal output, PDF headers

---

## 3. Color Palette

Distinct from TradeOS's palette, but sharing one hue family (teal) as the connective thread — so a "by vsage" mark never feels like it's fighting the product it's attached to.

| Role | Name | Hex | Usage |
|---|---|---|---|
| **Primary (Ink)** | Graphite Black | `#0D0F12` | Dominant — backgrounds, primary text on light surfaces, deck title slides |
| **Primary (Paper)** | Bone White | `#F7F5EF` | Inverse dominant — light-mode backgrounds, text on dark |
| **Accent** | Signal Teal | `#2F8F7A` | The one color that gets attention: links, active states, the wordmark's occasional accent use |
| **Structure** | Slate | `#5A6169` | Body copy on light, secondary text, rules/dividers, code blocks |

### Color Rationale
- **Graphite Black**, not TradeOS's navy — deliberately desaturated and cooler-neutral, so it reads as "studio/tool" rather than "trade/finance product." Navy is TradeOS's; black-adjacent ink is Vsage's.
- **Bone White**, not pure white and not TradeOS's warmer cream — a slightly cooler, drier off-white that suits documentation and technical surfaces better than TradeOS's consumer-facing warmth.
- **Signal Teal** is the deliberate inheritance: a shifted, slightly brighter relative of TradeOS's Forest Teal (`#357266`). Same hue family, different value — enough kinship that "by vsage" never clashes with a product built on teal, but distinct enough that Vsage-level materials don't read as a TradeOS reskin.
- **Slate** exists purely so body text isn't pure black on white (harsh) — same functional role as TradeOS's `#4C6663`, i.e. a tool, not a fourth brand color.

### Usage split
- 70% ink/paper (whichever is dominant for the surface), 25% slate, 5% teal. Teal is a highlight color, not a fill — same discipline as TradeOS's teal rule.

---

## 4. Typography

| Role | Typeface | Weight | Notes |
|---|---|---|---|
| **Display / Wordmark** | Space Grotesk | 700 | Same family as TradeOS's product wordmark — this is the one typographic thread tying every Vsage product together |
| **Headings** | Space Grotesk | 500–700 | Slightly less bold than display; used for section heads in decks, docs, site |
| **Body** | DM Sans | 400 | Matches TradeOS's body font — continuity across studio and product copy |
| **Code / Technical / Data** | JetBrains Mono or IBM Plex Mono | 400–500 | New addition, not present in TradeOS's system — used for anything that signals "engineered": API snippets, terminal output, the secondary `[ ]` / `>` mark, stat call-outs on the studio site |

**Pairing logic:** Space Grotesk's geometric-but-slightly-quirky letterforms (the flat-topped "e", squared "s") already do the "confident, not corporate" work for TradeOS — reusing it at the studio level means the two levels of the brand never feel like they're from different companies. DM Sans stays the workhorse body face for the same reason. The **only new typographic element at the studio level is the monospace face** — it doesn't exist anywhere in TradeOS's system, and it's the single clearest signal that Vsage-the-studio is a more technical, more engineering-forward register than any individual product needs to be.

---

## 5. Imagery & Photography

- **No stock photography of people in offices, handshakes, or "diverse team collaborating" imagery** — this is the fastest way to read as a generic SaaS brand.
- Preferred imagery: **real product screenshots** (TradeOS dashboard, terminal/code snippets, actual data visualizations), rendered in-context (browser chrome, terminal window) rather than cropped/floating.
- If abstract imagery is needed (deck backgrounds, OG images): geometric, grid-based, low-color — line work, dot grids, wireframe diagrams. Nothing organic/blobby, nothing gradient-mesh.
- Mood: **workshop, not showroom.** Vsage builds tools for people who build/move physical goods — imagery should feel closer to technical diagrams and real interfaces than aspirational lifestyle photography.

---

## 6. Iconography & Illustration

- **Icon set:** Lucide (already in use across TradeOS per [Navbar.tsx](../src/components/landing/Navbar.tsx)) — continue this at the studio level for consistency. Outline style, 1.5–2px stroke, no filled icons except for active/selected states.
- **No custom illustration system.** A studio this size doesn't need a mascot or illustration language — it adds production overhead without adding credibility for this audience. If a diagram is needed, it should look like a technical diagram (boxes, arrows, monospace labels), not a decorative illustration.
- Iconography is functional only — never decorative filler on a landing page.

---

## 7. Design Principles

1. **Specificity over polish.** A real screenshot with real data beats a beautiful mockup. A real error message beats a smiling illustration. Vsage's credibility comes from evidence that the software works, not from visual sparkle.
2. **One accent color, used sparingly.** Teal marks the single most important interactive or informational element on a screen. If everything is teal, nothing is — this rule already governs TradeOS's [design-system.md](./design-system.md) Do/Don't table and applies identically at the studio level.
3. **Typography does the talking.** With a two-color-plus-accent palette, hierarchy and personality come from type scale and the Space Grotesk/DM Sans/mono pairing — not from decorative color or illustration.
4. **Studio and product are kin, not clones.** Vsage-level materials should never be mistaken for a TradeOS screen, but a user moving from vsage.com to a product should feel continuity (shared teal hue, shared type family), not a jarring rebrand.

---

## 8. Brand Expressions

| Touchpoint | Guidance |
|---|---|
| **vsage.com (studio site)** | Ink-on-paper (light) as default, not TradeOS's dark-navy-first approach — studio site should read as documentation-clean, not product-dashboard-dark. Reserve dark mode as an option, not the default. |
| **Product "by vsage" lockup** | Exactly as implemented today in [Navbar.tsx:62-70](../src/components/landing/Navbar.tsx) and [Footer.tsx:29-39](../src/components/landing/Footer.tsx) — DM Sans, uppercase, `0.12em` tracking, ~65% opacity of the cream/paper text color. Do not modify this pattern per-product; it's the one constant across the portfolio. |
| **Pitch decks / investor materials** | Bone White background, Graphite Black type, Space Grotesk for slide titles, teal used only for the single most important chart line or callout per slide. No template gradients. |
| **GitHub org / technical docs** | Monospace face gets top billing here — org README, API docs, changelogs. This is the one surface where the mono face should dominate over Space Grotesk. |
| **Social / OG images** | Dot-grid or line-grid background at low opacity, Space Grotesk wordmark, single teal accent element (never a full-color photo background). Follow the existing technical pattern in [opengraph-image.tsx](../src/app/opengraph-image.tsx) rather than inventing a new template per surface. |

---

## Relationship to TradeOS Design System

| | Vsage (studio) | TradeOS (product) |
|---|---|---|
| Primary palette | Graphite Black / Bone White | Deep Navy / Warm Cream |
| Accent | Signal Teal `#2F8F7A` | Forest Teal `#357266` |
| Display type | Space Grotesk | Space Grotesk *(shared)* |
| Body type | DM Sans | DM Sans *(shared)* |
| Added register | Monospace (technical) | — |
| Default mode | Light-first | Dark-first |
| Icon set | Lucide | Lucide *(shared)* |

Shared type family and icon set are intentional — they're the load-bearing consistency across every future Vsage product. Each product is free to run its own primary/accent palette (as TradeOS does with navy/teal/cream), as long as the accent stays within the teal hue family and the "by vsage" lockup rule in §8 is followed exactly.
