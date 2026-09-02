# BRDC-WIKI-001 — Pelinsisäinen tietokirja

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-TECH-001 |
| **Status** | `wip` — viipaleet 1–3 (Vigil · lokin aiheet · etusivu + peliohjeet) 2026-09-02 |
| **Valmius** | 60 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (W1–W2), §3 · kenttätesti 2026-09-01 |

## Eka viipale — Vigil-ohje (2026-09-01)

Kaverit kentällä kysyivät "mikä vigil on". Rakennettu tietokirjan **runko** ja sen
ensimmäinen sivu, muu suunnitelma alla jää Vaihe 3:een portin taakse.

- [x] `features/help/help.ts` — `HelpTopic`-unioni + `HELP`-tietue (`{ title, body: string[] }`)
- [x] `HelpPanel.tsx` (+css) — `GlassPanel`, ei modaali, ESC + sulkunappi, korkeus
      katkaistu HUDin yläpuolelle ja vierii sisällään (sama kuin `CellPanel`)
- [x] HUDin Vigil-tilan viereen **sininen linkki** "what is this?" kun Vigil on päällä
      (`hud__help-link`, `--mystic-cyan`, alleviivattu, oikea `<button>`)
- [x] `MapView` pitää `help`-tilaa ja renderöi `<HelpPanel>`

## Viipale 2 — lokin linkkaamat aiheet (2026-09-01, BRDC-LOG-001)

- [x] `HelpTopic` + `HELP` kasvoivat 10 aiheella: `awakening` · `corruption` ·
      `reinforcement` · `decay` · `work` · `rite` · `warding` · `mana` · `the-wager` ·
      `hearth`. Teksti johdettu sääntömoduulien omista doc-kommenteista
- [x] Toimintalokin jokainen rivi linkittää oikeaan aiheeseen (`describe.ts` `TOPIC`);
      testi väittää että jokainen palautettu topic on `HELP`issä
- [~] Sisältö johdettu taulukoista, haku, linkki joka paneelista — jää Vaihe 3:een
- [~] Testi "jokaisella rakennuksella/teknologialla sivu" — jää Vaihe 3:een

## Viipale 3 — etusivu, peliohjeet, ristiviittaukset (2026-09-02)

Infinite kenttätestin jälkeen: *"wikipedia pelistä peliohjeineen"*. Kirjaan oli ennen
vain kontekstilinkki — ei ovea, ei listaa, ei selitystä *pelistä* itsestään.

- [x] **Selattava etusivu.** `GROUPS` (`help.ts`) ryhmittää kaikki 17 aihetta kuuteen
      otsakkeeseen; `HelpPanel` on kaksitilainen: `'index'` = etusivu, aihe = sivu.
      Avataan hampurilaisvalikosta ("Guide", `SettingsMenu` → `useMapAside.openGuide`).
- [x] **Peliohjeet.** Kolme uutta käsinkirjoitettua sivua: `how-to-play` (koko silmukka
      yhdellä ruudulla), `first-walk` (numeroitu aloitus), `vocabulary` (lore↔selkokieli
      `claude.md` §10:stä).
- [x] **Ristiviittaukset datana.** `HelpEntry.see?: HelpTopic[]` → "See also" -linkit;
      joka sivulla "‹ Guide" -paluu. Vigil-/loki-/hahmolinkit avaavat nyt koko kirjan.
- [x] `help.test.ts`: jokainen aihe täsmälleen yhdessä ryhmässä (ei orpoa, ei duplikaattia),
      jokainen `see` osoittaa olemassa olevaan sivuun eikä itseensä, jokaisella sivulla
      otsikko + ≥1 kappale. 838 vihreää · `tsc` · `lint:lines` · `build`.
- [~] Saavutettavuus: h2→h3-hierarkia, ESC sulkee, paneeli ottaa fokuksen navigoidessa.
      **Fokuksen palautus avaajaan sulkiessa puuttuu** — yhteinen puute kaikissa
      kartan sivupaneeleissa (Changelog, History), ei korjattu tässä.

## 🔴 RED

Sääntöjä on jo enemmän kuin mahtuu muistiin — piiritysmalli, rappeutuminen, päiväbonus,
naapuribonus, dwell-kynnykset — eikä yksikään niistä ole luettavissa pelistä. Tämä
suunnitelma kolminkertaistaa määrän.

Ilman tietokirjaa jokainen luku on taikuutta, ja pelaaja lakkaa suunnittelemasta.

## 🟢 GREEN

- [ ] Tietokirja **johdetaan samoista taulukoista** kuin peli: `BUILDINGS`, `TECHS`,
      `SPELLS`, maastot, ihmeet, vakiot
- [ ] **Yksikään luku ei ole kirjoitettu käsin kahteen paikkaan.** Testi väittää, että
      jokaisella rakennuksella ja teknologialla on sivu, eikä yhtään orpoa sivua ole
- [~] **Linkki joka toiminnosta**: valikko + Vigil + loki + hahmonäkymä + "See also"
      -ristiviittaukset kytketty (viipale 3). Solupaneeli, rakennusvalikko, loitsu ja
      opetus vielä kytkemättä — jää Vaihe 3:een
- [x] Avautuu ja sulkeutuu **yhdellä peukalolla**, ei estä karttaa pysyvästi
      (ei-modaali `GlassPanel`, ESC + sulkunappi, katkaistu HUDin yläpuolelle) — viipale 3
- [ ] Haku, koska sisältöä tulee satoja rivejä
- [~] Saavutettavuus: h2→h3-hierarkia + ESC tehty (viipale 3); fokuksen palautus
      avaajaan puuttuu, ks. viipale 3 (`claude.md` §14)
- [ ] Wiki **päivittyy itsestään** kun mekaniikka avautuu (`BRDC-TUTOR-001`) — uusi
      sivu ei ilmesty ennen kuin pelaaja on nähnyt asian kerran

## Toteutus

**Tämä on ainoa tapa pitää suunnitelma hallittavana.** Kuusitoista rakennusta,
teknologiapuu ja kaksitoista ihmettä ovat jo nyt enemmän sääntöä kuin `claude.md` §11
kantaa. Kun kirja lukee samoja taulukoita kuin sääntökoodi, dokumentaatio ei voi
vanhentua — ja se on täsmälleen se ongelma, joka tappoi v2:n 112 markdownia.

Kirja on siis **testi, ei vain käyttöliittymä**: sivun puuttuminen kaataa ajon.

## Ei tässä

- Lore-teksti kaikelle. Ihmeet saavat omansa (`BRDC-WONDER-001`); rakennuksille riittää
  se, mitä ne tekevät
- Ulkoinen wiki tai dokumentaatiosivusto. `claude.md` §5.1: statusdokumentteja ei luoda
