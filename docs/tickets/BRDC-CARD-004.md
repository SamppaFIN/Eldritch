# BRDC-CARD-004 — YOU mallin mukaan

| | |
|---|---|
| **Alue** | `features/character/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S–M |
| **Status** | `[~]` osittain valmis 2026-09-16 — tietoisuusrengas ja pikalukema tehty; elinikäiset luvut vaativat uutta pysyvää tilaa |
| **Riippuvuudet** | — |
| **Lähde** | `Eldritch-Sigil.html` §06 — 06 · YOU · Infinite 2026-09-16 (ks. `BRDC-CARD-001`) |

## 🔴 RED

`BRDC-CHAR-002` (v0.5.91) nimesi ruudun, **mallia ei rakennettu**. Mallin oma selitys:

> *"Identity above data: the avatar is a sigil the player picks and the consciousness ring shows the
> distance to Awakening. Six lifetime numbers fit above the fold; achievements stay a compact ledger
> rather than a wall of dimmed rows."*

## Auditoi nykyinen You-ruutu mallia vasten — tehty 2026-09-16

Mallin oma HTML (`Eldritch-Sigil.html`, "06 · YOU"), sen omat näytedatataulut (`youStats`,
`achievements`) mukaan lukien, verrattu `CharacterPanel`in nykyiseen tuotokseen:

| Mallin osa | Peli tänään | Ero |
|---|---|---|
| Avatar + rengas etäisyydelle seuraavaan | Avatar ilman rengasta; taso+XP-palkki erillään alempana | 🔶 **korjattu tässä kierroksessa** |
| NAME-kenttä | Sama, jo muokattava | ✅ jo tehty |
| "1 · DORMANT → 5 AWAKENING" yhdellä rivillä | "{taso} · {nimi}" — seuraava näkyi vain alempana tikapuulistan lukitussa rivissä | 🔶 **korjattu tässä kierroksessa** — pikalukema lisätty, tikapuu säilyy sellaisenaan |
| **Kuusi elinikäistä lukua** (WALKED, DAYS, STREAK, CLAIMS, PEAK CELLS, RITES CAST) | Ei yhtään | ❌ **ei tehty — mitattu syy alla, ei arvattu** |
| YOUR SIGIL -rivi (avatinvalinnat inline-riveinä) | `AvatarPicker`, avautuu napista | Eri UX-malli, sama toiminto — ei muutettu |
| FOUND · 0/3 | "Found (N/3)" -osio, sama sisältö | ✅ jo tehty, eri ulkoasu |
| ACHIEVEMENTS · 2/12 tiiviinä | `Achievements`-lista, jo tiivis (merkki+nimi+aika/vihje per rivi) | ✅ jo tehty |

## Miksi elinikäisiä lukuja ei tehty — mitattu, ei arvattu

`PlayerProfile`illa (`types/domain.ts`) on vain `{id, name, colorHue, level, xp}` — **ei
yhtään** kertyvää lukua. Toimintaloki (`rules/log.ts`) on **tarkoituksella rajattu**
(`MAX_LOG_ENTRIES`, oma dokumentaationsa: *"a scroll back through a few weeks of play, not
a ledger to the first step"*) — sen laskeminen "RITES CAST"iksi antaisi viimeaikaisen,
katkaistun luvun ja esittäisi sen elinikäisenä, mikä olisi väärä luku oikean näköisenä.
Kaikki kuusi lukua (kuljettu matka, aktiiviset päivät, putki, elinikäiset valtaukset,
huippusolumäärä, castatut riitit) vaatisivat **uutta pysyvää tilaa**: kertyvät kentät
`PlayerProfile`iin, `SAVE_VERSION`-migraatio, ja kytkentä jokaiseen tapahtumaan (kävely,
valtaus, casting) joka niitä kasvattaa. Tämä on oma, todellinen ominaisuutensa —
tallennusmuodon laajennus omine suunnittelupäätöksineen (esim. nollautuuko putki
puolenyön UTC:ssä vai paikallisessa ajassa) — ei tämän kierroksen sivutuote.

## 🟢 GREEN

- [x] **Auditoi nykyinen You-ruutu mallia vasten** — taulukko yllä
- [x] **Tietoisuusrengas avatarin ympärille** (`CharacterPanel.tsx`, `character.css`):
      SVG-rengas jo lasketun `state.progress`in mukaan — ei uutta dataa, sama luku jo
      `character__xp-fill`in käyttämä. Erillinen kerros `Avatar.tsx`in ympärillä, ei
      muutosta itse komponenttiin
- [x] **"N · Nimi → M SeuraavaNimi" yhdellä rivillä** — tikapuun oma "ei spoilata blurbia"
      -periaate (`consciousness.ts`) säilyy: seuraavan NIMI näkyi jo tikapuun lukitussa
      rivissä, uusi rivi ei paljasta mitään uutta
- [ ] **Kuusi elinikäistä lukua** — vaatii uutta pysyvää tilaa, katso yllä. Ei tehty tässä
- [ ] YOUR SIGIL inline-rivinä picker-napin sijaan — visuaalinen, ei toteutettu
- [ ] 360 px -kuvakaappaus mallin rinnalla — ei kuvakaappaustyökalua tässä istunnossa
- [x] Portti: 1567 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät

## Ei tässä

- Elinikäisten lukujen pysyvä tila — oma tikettinsä, jos Infinite haluaa sen eteenpäin
