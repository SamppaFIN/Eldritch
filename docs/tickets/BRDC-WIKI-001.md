# BRDC-WIKI-001 — Pelinsisäinen tietokirja

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001, BRDC-TECH-001 |
| **Status** | `done` — 2026-10-13: loput rakentuivat WIKI-003/004:n ja Season 3:n alla; fokuksen palautus lisätty |
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
- [x] Sisältö johdettu taulukoista, haku, linkki joka paneelista — jää Vaihe 3:een — tehty WIKI-003/004:ssä (ks. alla)
- [x] Testi "jokaisella rakennuksella/teknologialla sivu" — jää Vaihe 3:een — `wikiPages.test.ts`: jokainen Work, teknologia ja Rite ratkeaa sivuksi, jokainen ref kerran

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
- [x] Saavutettavuus: h2→h3-hierarkia, ESC sulkee, paneeli ottaa fokuksen navigoidessa.
      **Fokuksen palautus avaajaan sulkiessa puuttuu** — yhteinen puute kaikissa
      kartan sivupaneeleissa (Changelog, History), ei korjattu tässä. — **2026-10-13:** fokus palaa avaajaan (`HelpPanel`), guide.spec todentaa

## 🔴 RED

Sääntöjä on jo enemmän kuin mahtuu muistiin — piiritysmalli, rappeutuminen, päiväbonus,
naapuribonus, dwell-kynnykset — eikä yksikään niistä ole luettavissa pelistä. Tämä
suunnitelma kolminkertaistaa määrän.

Ilman tietokirjaa jokainen luku on taikuutta, ja pelaaja lakkaa suunnittelemasta.

## 🟢 GREEN

- [x] Tietokirja **johdetaan samoista taulukoista** kuin peli: `BUILDINGS`, `TECHS`,
      `SPELLS`, maastot, ihmeet, vakiot — Works, Lore ja temppeliriitit luetaan pelin taulukoista (`wikiPages.ts` REFERENCE); Consciousness-sivun perkit `PERKS`istä. Ihmeet ja maastot eivät vielä ole omina sivuinaan
- [x] **Yksikään luku ei ole kirjoitettu käsin kahteen paikkaan.** Testi väittää, että
      jokaisella rakennuksella ja teknologialla on sivu, eikä yhtään orpoa sivua ole — johdetut sivut lukevat luvut taulukosta; testi kattaa jokaisen rakennuksen ja teknologian
- [~] **Linkki joka toiminnosta**: valikko + Vigil + loki + hahmonäkymä + "See also"
      -ristiviittaukset kytketty (viipale 3). Solupaneeli, rakennusvalikko, loitsu ja
      opetus vielä kytkemättä — jää Vaihe 3:een — 2026-10-13: rakennusvalikon rivi (WIKI-004) ja opetuskortin *Read more* kytketty; loitsu ja solupaneeli yhä ilman
- [x] Avautuu ja sulkeutuu **yhdellä peukalolla**, ei estä karttaa pysyvästi
      (ei-modaali `GlassPanel`, ESC + sulkunappi, katkaistu HUDin yläpuolelle) — viipale 3
- [x] Haku, koska sisältöä tulee satoja rivejä — hakukenttä etusivulla (`HelpIndex`), guide.spec todentaa
- [x] Saavutettavuus: h2→h3-hierarkia + ESC tehty (viipale 3); fokuksen palautus
      avaajaan puuttuu, ks. viipale 3 (`claude.md` §14) — fokuksen palautus tehty 2026-10-13
- [x] Wiki **päivittyy itsestään** kun mekaniikka avautuu (`BRDC-TUTOR-001`) — uusi
      sivu ei ilmesty ennen kuin pelaaja on nähnyt asian kerran — `encountered.ts`: aihe avautuu kun pelaaja kohtaa sen; perusaiheet ja kauden sivut aina näkyvissä

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
