# Auto-D&D Plan — Research & Strategy

**Status:** Research draft (2026-07-06)  
**Scope:** Landscape of agent-powered tabletop RPG / D&D systems, usable IP, Wizards of the Coast legal posture, and a recommended build direction for this repo.

> **Disclaimer:** This document is engineering and product research, not legal advice. Before shipping anything commercial, retain counsel familiar with games IP and software licensing.

---

## Executive summary

The agent-powered “AI Dungeon Master” space is crowded but immature. Products split into three durable categories:

1. **Full-stack AI GMs** (SaaS) — narration + rules + memory + multiplayer.
2. **VTT co-pilots** — MCP/agent tools that sit beside Foundry/Roll20; human stays creative lead.
3. **Open-source agent stacks** — self-hosted rules engines + LLM narration via MCP or multi-agent graphs.

**Legally buildable D&D-compatible software** should anchor on **SRD 5.1 / 5.2.1 under CC-BY-4.0**, use a **deterministic rules engine** (not LLM adjudication), avoid WotC trademarks and non-SRD product identity, and market as **“5e compatible”** rather than “Dungeons & Dragons.” WotC has **not** published a policy banning third parties from using LLMs in tools — their generative-AI FAQ targets **commissioned official art and writing**. The main legal exposure is **copyright/trademark misuse** (scraping PHB content, using “D&D” branding, shipping beholders/FR lore) and **marketplace rules** (DMs Guild / DriveThru ban AI-generated *published* text).

**Recommended posture for this repo:** Build a **“cyborg GM” agent stack** on MCP — rules engine + campaign state + tool-calling agent — SRD-only, original setting, instrumented via `cursor-agentcontrol-bridge` for cost/quality observability. Do **not** ship a consumer “AI D&D” SaaS without legal review.

---

## 1. Current landscape (mid-2026)

### 1.1 Category map

```mermaid
quadrantChart
    title Agent RPG products (approximate positioning)
    x-axis Low rules fidelity --> High rules fidelity
    y-axis Human DM required --> Fully autonomous AI GM
    quadrant-1 VTT co-pilots
    quadrant-2 Full AI GM SaaS
    quadrant-3 Narrative sandboxes
    quadrant-4 DM prep assistants
    Familiar: [0.85, 0.35]
    Foundry MCP Bridge: [0.75, 0.30]
    TableForge: [0.90, 0.80]
    ArchitectRPG: [0.95, 0.85]
    VoxDungeon: [0.80, 0.85]
    AIDungeonMaster.ai: [0.75, 0.90]
    Questwright: [0.85, 0.80]
    AI Dungeon / Voyage: [0.20, 0.95]
    Hidden Door: [0.40, 0.75]
    MythWeaver: [0.60, 0.15]
    Tavern (OSS): [0.90, 0.70]
    dmcp (OSS): [0.50, 0.65]
```

### 1.2 Full-stack AI Game Master products (consumer SaaS)

| Product | URL | Rules basis | Agent architecture | Notable claims |
|--------|-----|-------------|-------------------|----------------|
| **AIDungeonMaster.ai** | [aidungeonmaster.ai](https://aidungeonmaster.ai/) | D&D 5e | LLM DM + tactical combat, NPC voices, persistent memory | Multiplayer (up to 5), pro from ~$8/mo |
| **ArchitectRPG** | [architectrpg.com](https://www.architectrpg.com/) | D&D 5e SRD + PF2e ORC | “Architect” builds world; AI GM on autopilot; 2,400+ verified rule records | Explicit CC/ORC licensing; compares itself to AI Dungeon, Hidden Door, Roll20 |
| **TableForge** | [tableforge.gg](https://tableforge.gg/) | 5e SRD 2024 | **Separate rules engine** (not LLM) + AI narration | Async + realtime multiplayer; host-pays model |
| **VoxDungeon** | [voxdungeon.com](https://voxdungeon.com/) | 5e SRD | Voice-first LLM DM + TTS | Free tier (8B model); premium 70B + voices ~$5/mo |
| **Questwright** | [questwright.app](https://questwright.app/) | D&D 5e SRD + original systems | Proprietary multi-system rules engine + AI narration | Beta; expanding to PF2e, Fate, Blades, etc. |

**Pattern:** Winners separate **mechanical truth** (code/SQLite/rules server) from **narrative improvisation** (LLM). Products that let the model invent HP, spell slots, or DCs get poor reviews for “hallucinated rules.”

### 1.3 Narrative-first platforms (not strict 5e)

| Product | URL | Model | IP approach |
|--------|-----|-------|-------------|
| **AI Dungeon / Voyage** (Latitude) | [latitude.io](https://latitude.io/) | Open-ended text RPG; “World Engine” enforces state | Original/generic fantasy; **not** licensed D&D |
| **Hidden Door** | [hiddendoor.co](https://www.hiddendoor.co/) | Curated worlds; AI pacing; light mechanics | **Licensed IP** (e.g. Wizard of Oz, The Crow) + public domain; creator revenue share (Atlas, 2026) |

Hidden Door is the counter-model to SRD cloning: **pay for worlds**, don’t scrape rulebooks.

### 1.4 VTT co-pilots & MCP bridges (“cyborg GM”)

| Product | URL | Integration | Tools / scope |
|--------|-----|-------------|---------------|
| **Familiar** | [familiarvtt.com](https://familiarvtt.com/) | Foundry VTT module; MCP server | **193 tools** across combat, compendia, journals, audio; BYO AI (Claude, ChatGPT, Cursor); D&D 5e (2024) |
| **Foundry MCP Bridge** | [foundryvtt.com/packages/foundry-mcp-bridge](https://foundryvtt.com/packages/foundry-mcp-bridge) | Foundry v13+ ↔ Claude Desktop | ~20–42 tools; quest/NPC/scene generation; GM-only |
| **dmcp** | [github.com/shawnrushefsky/dmcp](https://github.com/shawnrushefsky/dmcp) | Standalone MCP server (Docker) | ~170 tools; setting-agnostic; dynamic rule systems |

These align with the “exosuit” thesis ([Petri Leinonen, 2026](https://strangeworlder.medium.com/the-cyborg-game-master-0e9413503147)): the human keeps taste and story; the agent handles bookkeeping, lookups, and encounter math.

### 1.5 DM prep assistants (not autonomous players)

| Product | Notes |
|--------|-------|
| **MythWeaver** | Campaign prep — lore, NPCs, stat blocks, maps; assists human DMs running D&D/Pathfinder |
| **D&D Beyond Rules Assistant** (WotC, early 2026) | Searchable rules encyclopedia inside Maps VTT — **not** an AI DM |

### 1.6 Open-source / research agent stacks

| Project | URL | Stack | License / data |
|--------|-----|-------|----------------|
| **Tavern** | [github.com/t11z/tavern](https://github.com/t11z/tavern) | FastAPI + Claude + PostgreSQL; Discord voice | Apache-2.0; SRD 5.2.1 rules engine |
| **Project Infinity** | [github.com/rthuffman/Project_Infinity](https://github.com/rthuffman/Project_Infinity) | MCP + SQLite game engine; SRD 5.1 | MIT code; CC-BY data |
| **ITMO ai-dungeon-master** | [github.com/ITMO-Agentic-AI/ai-dungeon-master](https://github.com/ITMO-Agentic-AI/ai-dungeon-master) | **8 LangGraph agents** (story, rules, lore, etc.) | Academic / research |
| **envy-ai/ai_rpg** | [github.com/envy-ai/ai_rpg](https://github.com/envy-ai/ai_rpg) | Node.js + Nunjucks prompts + optional ComfyUI art | Solo GM sandbox |
| **5e-srd-api** | [github.com/5e-bits/5e-srd-api](https://github.com/5e-bits/5e-srd-api) | REST API over SRD JSON | MIT; underlying SRD (verify CC attribution) |

### 1.7 What WotC is *not* shipping

WotC has **publicly denied** building an AI Dungeon Master for D&D Beyond ([EN World, 2024](https://www.enworld.org/threads/wotc-we-are-not-making-ai-dungeon-masters.694638/); [Rascal News, 2025](https://www.rascal.news/wizards-of-the-coast-set-to-rebuild-d-d-beyond-add-more-features/)). Their 2026 roadmap emphasizes **human-led** tools: rebuilt character builder, Maps VTT, **Rules Assistant** (lookup, not narration).

WotC **does** use generative AI internally for **developer productivity** and experimental **onboarding aids** (Google Cloud partnership, 2024) — explicitly **not** for published D&D art or creative writing.

**Implication:** The official channel is unlikely to compete with a well-built SRD-based agent co-pilot in the near term; third-party startups are the competitive set.

---

## 2. Architecture patterns that work

Across commercial and OSS leaders, the same design repeats:

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| **Rules engine** | Dice, HP, conditions, spell slots, initiative, valid targets | Be prompt-only |
| **Campaign state** | PCs, NPCs, locations, quests, session log | Live only in chat context |
| **Agent orchestrator** | Plan turns, call tools, narrate outcomes | Invent mechanics |
| **Memory** | Summaries + structured facts (RAG optional) | Rely on 200k context alone |
| **Interface** | Web, Discord, Foundry, or Cursor/MCP | — |

**Agentic pattern (MCP):** The LLM receives tool schemas (`roll_attack`, `get_spell`, `update_initiative`). Every mechanical outcome is a tool return the model must quote verbatim (see Project Infinity’s `narrative_format` pattern).

**Multi-agent pattern:** Specialized agents (rules judge, lore builder, director) reduce prompt complexity; higher ops cost, better for research demos.

**Connection to this repo:** `cursor-agentcontrol-bridge` is ideal for measuring **which agent/model** burns tokens on rules lookups vs narration, tracking error rates when tool calls fail, and A/B testing prompts via LaunchDarkly AI Configs — without owning game UI.

---

## 3. IP you can use (and what you cannot)

### 3.1 SRD 5.1 & 5.2.1 — Creative Commons BY 4.0 ✅

WotC released core mechanics under **[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)**, which is **irrevocable** — they cannot claw it back ([D&D Beyond SRD FAQ](https://www.dndbeyond.com/srd); [Ars Technica, Apr 2025](https://arstechnica.com/gaming/2025/04/everything-but-the-beholders-dd-updates-core-rules-sticks-with-cc-license/)).

**You may (with attribution):**

- Use classes, spells, monsters, items, and rules text **included in the SRD**
- Adapt, remix, and build software (including VTTs and commercial products)
- Say **“compatible with fifth edition”** or **“5E compatible”**
- Crowdfund and sell subscriptions

**Required attribution** (include in app/about/LICENSE; exact text is in the SRD preamble):

> This work includes material taken from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

Use the matching version string (5.1 vs 5.2.1) for the SRD you actually ship.

**Explicitly do not** add extra Wizards attribution beyond what CC requires ([SRD 5.1 preamble via a5esrd.com](https://a5esrd.com/5esrd)).

### 3.2 OGL 1.0a — legacy option ⚠️

SRD 5.1 remains available under **OGL 1.0a** as well. Most new projects prefer **CC-BY-4.0** (fewer restrictions, clearer permanence). OGL’s “Product Identity” clauses are why many lawyers steered clients away during the 2023 OGL crisis.

### 3.3 Open RPG Creative (ORC) — Pathfinder 2e ✅

[ArchitectRPG](https://www.architectrpg.com/) ships PF2e under **ORC**. Viable if you want tactical 3-action combat instead of 5e — different community, same agent architecture.

### 3.4 DMs Guild — WotC setting IP ✅ (with constraints)

[DMs Guild](https://www.dmsguild.com/) licenses **Forgotten Realms**, **beholders**, **mind flayers**, named NPCs, and published adventure content.

**Critical constraint for AI products:** DMs Guild / DriveThru **[prohibit AI-generated text](https://help.drivethrurpg.com/hc/en-us/articles/12723312467095-General-Content-Guidelines)** in products for sale. An autonomous AI DM that **generates** adventures for distribution likely **cannot** be published there. DMs Guild fits **human-written** adventures, not LLM runtime output.

### 3.5 Fan Content Policy — streaming & free stuff only ⚠️

[WotC Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) allows **free** fan videos, streams, podcasts with disclaimers and no logos.

**You cannot (without written permission):**

- **Sell** a game or software that incorporates WotC IP beyond OGL/SRD mechanics
- Use WotC **logos/trademarks** (“Dungeons & Dragons®”, “D&D®”) in your product
- Use WotC IP **in other games** (their words: “game components, rule books, tokens”)
- Gate fan content behind paywalls (Patreon ads OK; selling the game is not)

Running a **private** campaign tool for friends is closer to fan use; **commercial SaaS** must route through SRD/CC, not Fan Content Policy.

### 3.6 Trademarks & product identity — hard red lines 🚫

| Asset | SRD/CC? | Notes |
|-------|---------|-------|
| Game mechanics (d20, proficiency, spell levels) | ✅ | Uncopyrightable; CC covers SRD expression |
| SRD monsters (goblin, owlbear, many dragons) | ✅ | Check specific stat block is in SRD |
| **Beholder**, **mind flayer**, **illithid**, **displacer beast**, etc. | 🚫 | Brand identity; excluded from SRD ([D&D Beyond FAQ](https://www.dndbeyond.com/srd)) |
| **Forgotten Realms**, Waterdeep, Strahd, Tiamat | 🚫 | Not in SRD |
| **“Dungeons & Dragons”**, **“D&D”** in product title | 🚫 | Trademark; use “5e compatible” instead |
| Renamed SRD items (e.g. “Mysterious Deck” for Deck of Many Things) | ✅ | WotC renamed in SRD 5.2 to reduce PI friction |
| Published PHB/MM text not in SRD | 🚫 | Copyright — [5etools DMCA, Aug 2024](https://github.com/github/dmca/blob/master/2024/08/2024-08-07-wizards-of-the-coast.md) |
| Official art, maps, handouts from books | 🚫 | Unless licensed separately |

### 3.7 Training data & model knowledge — separate risk ⚠️

Even if your **runtime** only serves SRD JSON, base LLMs were trained on broad corpora that may include copyrighted RPG text. Mitigations:

- **Don’t** fine-tune on scraped PHB PDFs without a license
- **Do** RAG over SRD-only corpora with citations
- **Do** force tool calls for stats so the model can’t freestyle copyrighted stat blocks

This is an unsettled area of law; SRD-compliant **behavior** is stronger than hoping the model “forgets” non-SRD content.

### 3.8 Alternative: original rules + fantasy genre

**AI Dungeon / Voyage** and **Hidden Door** show you can build agent RPGs with **zero D&D license** — generic fantasy or licensed third-party worlds. Lowest legal surface area; hardest marketing (no “5e” hook).

---

## 4. Will WotC’s legal team come for you?

### 4.1 What they have enforced

| Target | Issue | Source |
|--------|-------|--------|
| **5etools / mirrors** | Verbatim reproduction of non-SRD book content | [GitHub DMCA, Aug 2024](https://github.com/github/dmca/blob/master/2024/08/2024-08-07-wizards-of-the-coast.md) |
| **Online character generators** | Unauthorized use of copyrighted rules text | [TechRaptor](https://techraptor.net/tabletop/news/wotc-shuts-down-online-character-generators) |
| **NFT / Magic fan projects** | Copyright in card expression | [GeekWire, 2022](https://www.geekwire.com/2022/wizards-of-the-coast-sends-takedown-notice-to-organizers-of-fan-made-magic-nft-project/) |
| **Spellbook generator (2014)** | Pre-OGL 5e tools | [Tenkar's Tavern](https://www.tenkarstavern.com/2014/09/first-wotc-5e-cease-desist.html) |

**Pattern:** Enforcement targets **reproduction of protected expression** and **brand confusion**, not “software that rolls d20s.”

### 4.2 What they have *not* (publicly) targeted

- SRD-based commercial VTTs (Roll20, Foundry ecosystem)
- **ArchitectRPG, VoxDungeon, TableForge, Questwright** — openly marketing 5e SRD + AI
- **Familiar** — MCP agent running official-adjacent 5e in Foundry
- **AI Dungeon** — different brand; generic fantasy

No public record (as of this research) of WotC C&D against an **SRD-compliant AI DM** that does not scrape books or misuse trademarks. That is **not a guarantee** — it is an observation.

### 4.3 WotC stance on generative AI

Official [Generative AI art FAQ (D&D)](https://dnd-support.wizards.com/hc/en-us/articles/26243094975252-Generative-AI-art-FAQ):

> We require artists, writers, and creatives **contributing to** the Magic TCG and the D&D TTRPG to refrain from using AI generative tools to create **final** Magic or D&D products.

That governs **WotC’s supply chain**, not third-party SRD publishers. It **does** signal cultural hostility — expect community backlash if you market “AI replaces human DMs” loudly.

### 4.4 Risk matrix (qualitative)

| Approach | Copyright | Trademark | Community | Marketplace |
|----------|-----------|-----------|-----------|-------------|
| SRD engine + original setting + “5e compatible” | **Low** | **Low** if compliant | Medium | OK off-platform |
| Scraping PHB / 5etools data | **Very high** | Medium | High backlash | Takedown |
| Product named “AI D&D Dungeon Master” | Medium | **High** | High | — |
| Shipping beholders / FR in product | **High** (no license) | **High** | — | DMs Guild only; no AI text |
| Free fan stream of homebrew game | Low | Medium | Low | Fan policy |
| Paid SaaS with SRD + attribution | **Low–medium** | **Low** | Medium | DriveThru AI-text ban irrelevant if not publishing PDFs |

### 4.5 Practical compliance checklist

- [ ] Ship **only** SRD 5.2.1 (or 5.1) content in rules database; audit monster/spell names against SRD index
- [ ] Include **CC-BY attribution** in UI, docs, and distributions
- [ ] Product name and marketing: **no “D&D”**; use “5e compatible” / “tabletop fantasy RPG”
- [ ] Original setting name, map, pantheon — no FR, no Strahd, no Tiamat
- [ ] Replace PI creatures (beholder → homebrew “oculus tyrant” with **new** stat block if needed)
- [ ] **Do not** redistribute purchased D&D Beyond / Roll20 / book content through the agent
- [ ] Footer: “Unofficial fan tool / not affiliated with Wizards of the Coast”
- [ ] If using Foundry modules: respect **Foundry EULA** and **user-owned** compendia — agent reads only what the user licensed
- [ ] Consult counsel before App Store launch, fundraising, or Hasbro partnership outreach

---

## 5. Competitive gaps (where to differentiate)

| Gap | Incumbent weakness | Opportunity |
|-----|-------------------|-------------|
| **Agent observability** | Black-box SaaS; users don’t know cost or failure modes | LD-monitored agent runs (this repo) |
| **Cursor / IDE-native play** | Most products are web or VTT-only | MCP session in Cursor for solo dev-table culture |
| **Rules-verified narration** | Many chatbots still hallucinate | Mandatory tool pipeline + verbatim mechanical output |
| **Human-in-the-loop by default** | “AI DM” hype alienates DMs | Co-pilot mode as primary; solo as secondary |
| **Bring-your-own-model** | Vendor lock-in | Familiar proved BYO AI; extend with AI Config routing |
| **Published adventure fidelity** | Familiar needs human-owned modules | Agent reads **user’s** legally purchased PDF — user responsibility |

---

## 6. Recommended build plan (for `cursor-agentcontrol-bridge` context)

### 6.1 Product thesis

**“Agentic table co-pilot for 5e-compatible solo and small-group play”** — not “Wizards-approved AI DM,” not a PHB replacement.

Position next to **Familiar / dmcp / Project Infinity**, with **LaunchDarkly AI Config Monitoring** as the moat for teams who want to **measure and steer** agent behavior (model choice, prompt versions, tool-error rate, cost per session).

### 6.2 Phase 0 — Legal & data foundation (1–2 weeks)

1. Download [SRD 5.2.1 PDF](https://dnd.wizards.com/resources/systems-reference-document) as the sole rules source of truth.
2. Parse into structured JSON/SQLite (or fork [5e-database](https://github.com/5e-bits/5e-database) after verifying SRD-only subset).
3. Add `LEGAL.md`: CC attribution, PI exclusion list, trademark guidelines.
4. Original setting bible: **one** starting region, **one** adventure hook — no WotC lore.

### 6.3 Phase 1 — Rules MCP server (2–4 weeks)

Minimal tool surface (mirror dmcp / Project Infinity):

| Tool | Purpose |
|------|---------|
| `roll_dice` | `XdY+Z` with audit log |
| `get_srd_entity` | spell / monster / condition by SRD id |
| `apply_damage` | HP, temp HP, death saves |
| `start_combat` / `next_turn` | Initiative, turn economy |
| `skill_check` | DC + modifiers from character sheet |
| `get_campaign_fact` / `set_campaign_fact` | Structured memory |

**Rule:** LLM never outputs numbers that weren’t tool results.

### 6.4 Phase 2 — Agent orchestration in Cursor (2–3 weeks)

1. MCP server local to repo; Cursor agent as player/DM co-pilot.
2. System prompt: genre, tone, tool-use contract, PI word blocklist.
3. Wire **cursor-agentcontrol-bridge** hooks → LD AI Config `auto-dnd-session` variations per model.
4. Metrics: tokens/session, tool latency, rule lookup errors, player satisfaction thumbs.

### 6.5 Phase 3 — Session UX (optional, 3–6 weeks)

Pick one:

- **A.** Terminal / markdown session log (fastest)
- **B.** Lightweight web UI (Tavern-style)
- **C.** Foundry module bridge (largest audience, highest integration cost)

### 6.6 Phase 4 — Hardening & optional commercialization

- Multiplayer state sync (Postgres / WebSocket)
- Voice (TTS only if licensing clear)
- **Before charging money:** trademark review, Terms of Service, privacy policy, counsel sign-off
- Consider **ORC/PF2e** second ruleset only after 5e loop is stable

### 6.7 Explicit non-goals (v1)

- No “D&D” branding or official setting
- No scraping D&D Beyond or PDF rulebooks into the repo
- No autonomous publishing of AI adventures to DMs Guild
- No replacement for human DMs at public tables — solo/small-group focus

---

## 7. Suggested repo layout (future)

```
auto-dnd/
  srd/                 # CC-BY data only, version-pinned
  engine/              # deterministic rules (no LLM)
  mcp/                 # MCP tool server
  prompts/             # narrator / co-pilot templates
  campaigns/           # original adventure JSON
  LEGAL.md
```

Keep **`auto-dnd/`** separate from bridge core so licensing and game data don’t complicate the LD extension distribution.

---

## 8. Key references

### Official Wizards

- [SRD 5.2.1 downloads & FAQ](https://dnd.wizards.com/resources/systems-reference-document)
- [Generative AI art FAQ (D&D)](https://dnd-support.wizards.com/hc/en-us/articles/26243094975252-Generative-AI-art-FAQ)
- [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)
- [Roll20 SRD 5.2 creator guide](https://pages.roll20.net/dnd-srd)

### Market / architecture

- [ArchitectRPG](https://www.architectrpg.com/) — SRD + ORC commercial AI GM
- [Familiar VTT](https://familiarvtt.com/) — MCP co-pilot for Foundry
- [TableForge](https://tableforge.gg/) — rules engine + AI narration
- [The Cyborg Game Master (Medium)](https://strangeworlder.medium.com/the-cyborg-game-master-0e9413503147)
- [If AI Can Play D&D, It Can Run Your ERP (The New Stack)](https://thenewstack.io/if-ai-can-play-dungeons-dragons-it-can-run-your-erp/) — MCP lesson from solo play

### Open source

- [dmcp](https://github.com/shawnrushefsky/dmcp) — MCP DM server
- [Project Infinity](https://github.com/rthuffman/Project_Infinity) — MCP + SQLite 5e
- [Tavern](https://github.com/t11z/tavern) — self-hosted SRD 5.2.1 GM
- [5e-srd-api](https://github.com/5e-bits/5e-srd-api) — SRD REST data

### Legal commentary (non-authoritative)

- [Ars Technica — SRD CC license (Apr 2025)](https://arstechnica.com/gaming/2025/04/everything-but-the-beholders-dd-updates-core-rules-sticks-with-cc-license/)
- [Cardozo blog — OGL / copyright mechanics](https://larc.cardozo.yu.edu/cgi/viewcontent.cgi?article=1341&context=aelj-blog)
- [GitHub DMCA — 5etools (Aug 2024)](https://github.com/github/dmca/blob/master/2024/08/2024-08-07-wizards-of-the-coast.md)

---

## 9. Decision log (to update as the project proceeds)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-06 | Anchor rules on **SRD 5.2.1 / CC-BY-4.0** | Irrevocable; industry standard for new 5e-compatible tools |
| 2026-07-06 | **Cyborg GM / MCP co-pilot** over consumer “AI DM” SaaS | Lower legal and community risk; fits Cursor + bridge |
| 2026-07-06 | **Original setting** only at launch | Avoids FR/PI; cleaner trademark posture |
| TBD | Commercial license vs OSS | Pending counsel + product validation |

---

*End of plan.*
