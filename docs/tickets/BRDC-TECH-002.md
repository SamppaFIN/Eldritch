# BRDC-TECH-002 — Tutkimus maksaa itsensä takaisin omalla maallaan

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 3 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-TECH-001, BRDC-MANA-002 (joka toi viisauden virtaamaan) |
| **Status** | `done` — 2026-09-09 (v0.5.51) |
| **Valmius** | 100 % talouden osalta; **puunäkymä on erikseen, ks. "Ei tässä"** |
| **Lähde** | Infinite 2026-09-09: *"Tutkimukset antavat merkittäviä tuotantobonuksia omistetuille ruuduille, esim.: Perustutkimus: +2 resurssia/tunti per omistettu ruutu, Merkittävämpi tutkimus: +10 resurssia/tunti"* |

## 🔴 RED

**Teknologia ei tehnyt taloudelle mitään.** `TECHS` avasi rakennuksia ja Riittejä, ja siinä
kaikki: mikään koodissa ei lukenut `researched`-listaa tuotantoa laskiessaan
(`pouch.ts#perHourBonus` ei tuntenut sitä). Viisautta kerättiin, sitä käytettiin, ja
ruutujen tuotto pysyi täsmälleen samana — `TRICKLE_PER_HOUR = 2` ensimmäisestä minuutista
viimeiseen.

Se on ero jonka pelaaja kyllä huomaa: tutkimus tuntui maksulta josta ei saa mitään, ja
`BRDC-MANA-002`:n jälkeen viisautta alkoi virrata itsestään — eli oli yhä vähemmän syytä
välittää siitä mihin se menee.

Paneeli ei myöskään kertonut mitä teknologia antaa. Rivi sanoi hinnan ja *"Unlocks
Library"*; tuotosta ei mainittu, koska sitä ei ollut.

## 🟢 GREEN

- [x] **`Tech.yield`** — valinnainen `{ resource, perCell }`. Teknologia nostaa **omaa
      maastoaan**: Mining vuoria, Irrigation vesiä.
- [x] **`researchBonus(researched, owned, now)`** (`rules/tech.ts`, puhdas) laskee mitä
      tutkimus maksaa tunnissa jokaisesta omistetusta, hereillä olevasta solusta jonka
      resurssiin se osuu. Sama 48 h dormanssikello kuin rakennuksilla ja paikoilla:
      maa jota et enää kävele lakkaa maksamasta, tutkimuksista riippumatta.
- [x] Kytketty `pouch.ts#perHourBonus`iin, muiden bonusten rinnalle.
- [x] **Paneeli kertoo mitä se maksaa:** *"+4 stone an hour on every hill you hold"* —
      nimetty maastolla eikä resurssikentällä, koska metsä on asia jonka voi mennä
      katsomaan.
- [x] Astronomialla **ei ole** tuotto­bonusta, ja se on tietoinen: se ostaa Insight-riitin,
      joka maksaa viisautta, eikä viisaus ole mitään mitä heksa tuottaa. Kaikkien
      teknologioiden ei tarvitse olla talousteknologioita.

### Taulukko

| Aikakausi | Teknologia | Maasto | +/h per solu |
|---|---|---|---:|
| prehistory | Early Farming · Forestry · Toolmaking | järvi/ranta · metsä · kukkula | **+2** |
| antiquity | Irrigation · Masonry · Mining · Seafaring | järvi/ranta · kukkula · vuori · kauppa | **+4** |
| medieval | Tide Lore · Fortification · Smithing · Wildcraft · Guild Craft | järvi/ranta · kukkula · vuori · metsä · kauppa | **+10** |
| medieval | Astronomy | — | — (Insight-riitti) |

## Miksi bonus osuu omaan maastoon eikä kaikkeen

PIVOTin sanamuoto (*"+2 resurssia/tunti per omistettu ruutu"*) luettuna kirjaimellisesti
tarkoittaisi että jokainen teknologia nostaa jokaista solua. Kolmentoista teknologian
jälkeen se on **+82/h yhdellä heksalla** perustuoton ollessa 2 — 41-kertainen, ja se
kasvaa lineaarisesti puun koon mukaan riippumatta siitä mitä pelaaja omistaa.

Kohdistettuna teknologian omaan maastoon pahin tapaus on **+16/h** (kivi: 2 + 4 + 10), ja
se on ansaittu: sen saa vain jos omistaa sitä maastoa. `tech.test.ts` lukitsee molemmat
luvut, jotta tämä ei liu'u takaisin.

Se tekee myös maastosta valinnan: metsäpainotteinen valtakunta ja vuoripainotteinen
tutkivat eri puuta.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1029**) + `pnpm build` vihreä.
- [x] `tech.test.ts` +7: ei mitään ennen tutkimusta · nostaa vain oman maastonsa ·
      samaan resurssiin osuvat pinoutuvat · maksaa **per solu** · **ei koskaan kertaudu
      koko puuta yhteen heksaan** (pahin tapaus mitattu, `= 16`) · dormantti solu ei maksa ·
      tasamaa ei tuota mitään joten mikään ei nosta sitä.
- [x] e2e `research.spec.ts`, `temple.spec.ts`, `standards.spec.ts` (a11y) vihreät.
- [ ] Kenttä: tutki Forestry ja katso metsäsolujen tuotto — nouseeko se 2 → 4/h.
      *(Infinite ajaa.)*

## ⚠️ Katsottavaa kentällä — tasapaino

Kolme lukua kannattaa mitata pelatessa, ei arvata pöydän ääressä:

1. **Onko +2/+4/+10 oikea porras?** Täysin tutkittu kivisolu tuottaa 18/h vastaan 2/h nyt.
2. **Onko juuriteknologia liian halpa?** 20 wisdomia, ja `BRDC-MANA-002`:n jälkeen
   viisautta tulee 6/h yhdellä Hearthilla — eli reilut kolme tuntia.
3. **Skaalautuuko se liikaa maalla?** Bonus on per solu, joten 340 solun valtakunnassa
   yksi juuriteknologia on iso luku. Se on tarkoituskin — kävely on pelin ydin — mutta
   raja kannattaa nähdä.

## Ei tässä

- **Puunäkymä**: `requires` piirretään, aikakausiryhmittely, ja se että kuusi koulullista
  teknologiaa näkyvät listassa ("vaatii <koulun> temppelin") sen sijaan että katoavat
  selittämättä. Se on `ResearchPanel`in rakennemuutos ja oma tikettinsä — tämä tiketti
  teki tutkimuksesta *kannattavaa*, seuraava tekee siitä *luettavan*.
- `ResearchPanel.tsx:102`:n sisäinen jargon *"Every schoolless technology is known."* —
  sama tiketti.
- Viisauden kertyminen uuden ruudun avaamisesta (PIVOT kohta 4:n toinen lähde).
