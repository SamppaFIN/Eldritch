# BRDC-CHAR-002 — Ruutu on "You", koska sitä nappia painettiin

| | |
|---|---|
| **Alue** | `features/character/CharacterPanel.tsx` |
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | XS |
| **Riippuvuudet** | `BRDC-CHAR-001`, `BRDC-SIGIL-005` (avatar, jo tehty tähän ruutuun) |
| **Status** | `done` — 2026-09-15 (v0.5.91) |

## 🔴 RED

HUD:n nappi sanoo **You** (`Hud.tsx:359`). Ruutu joka siitä avautuu sanoi otsikossaan ja
`aria-label`issaan **Character**. Pelaaja painoi yhtä nimeä ja sai toisen — sama luokka
virhettä kuin `BRDC-KEEP-008`in Keepissä, vain pienempänä: nimi jota ei koskaan painettu.

Ruudunlukijalle tämä on isompi kuin näkevälle: `aria-label="Character"` on ainoa nimi
jonka se sanoo, eikä se vastaa mitään mitä käyttöliittymässä lukee.

## 🟢 GREEN

- [x] `<h2>` ja `aria-label` sanovat molemmat **You** — sama sana kuin napissa
- [x] Koko sovelluksessa ei ole enää yhtään "Character"-merkkijonoa käyttäjälle
      (`grep`: vain tiedoston oma selittävä kommentti)
- [x] Portti: `lint:lines`, `tsc -b`, 1363 vitest, `pnpm build`

## Mitä tässä **ei** korjattu, ja miksi

**Consciousness-taso renderöityy kolmessa paikassa** — HUD, Keep, ja tämä ruutu. Se
näytti vanhassa suunnitelmassa kahdentumalta, mutta ei ole sitä: kaikki kolme lukevat
saman `levelState(profile.xp)`in, joten ne eivät voi olla eri mieltä (toisin kuin
`formatArea`, jonka `BRDC-KEEP-008` korjasi — siinä sama maa näytti kaksi eri lukua).
Kolme paikkaa palvelee kolmea eri tarkoitusta: HUD:n vilkaisu kävellessä, Keepin
"kuka tätä rakentaa", ja tämän ruudun oma syventävä tikapuu. Toisto ei ole vika kun
luku ei voi olla väärässä eikä sekoita mitään.

## Ei tässä

- Avatar näkyy edelleen vain tällä ruudulla (`BRDC-SIGIL-005`in tietoinen rajaus)
- Cipher-lohkon oma typografia — ei mitattua ongelmaa
