# BRDC-DETAIL-002 — Heksan tuotto näkyy laskuna, ei lopputuloksena

| | |
|---|---|
| **Alue** | `features/territory/CellHeader.tsx`, `CellWorth.tsx`, `rules/pouch.ts` (lukija, ei muutosta) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` — Infiniten pyyntö kirjattu, ei suunniteltu loppuun |
| **Riippuvuudet** | `BRDC-DETAIL-001` (joka rajasi tämän ulos: *"Uudet tiedot detail-ruutuihin. Jos jokin puuttuu, se on oma tikettinsä"*) |
| **Lähde** | Infinite 2026-09-15: *"heksan details korttiin, jos maalla on bonusresursseja tai rakennuksia, niin ne esitellään kanssa headerissa.. esim shoreline (+2 food, fish +3 food) × fishing hut = tms.. mutta että laskenta näkyy selkeästi ja miksi."* |

## 🔴 RED

Solukortti sanoo tänään maaston tuoton ja **vain sen**: otsikossa *"yields food"*, ja
`CellWorth`in `<dl>`:ssä *"10 food · 2/h"*. Se on pohjaluku.

Mutta heksan oikea tuotto tunnissa on summa monesta lähteestä, jotka `pouch.ts#perHourBonus`
laskee yhteen eikä mikään näytä:

- maaston oma trickle
- **bonusresurssi** (`BRDC-BOUNTY-001`) — esim. kalapaikka rannikolla
- **Työ** joka sillä seisoo (`BRDC-BUILD-001`) — esim. Fishery
- **tutkimus** joka osuu juuri siihen maastoon (`BRDC-TECH-002`: *"+4 stone an hour on
  every hill you hold"*)
- pimeä aika, dormanssi

Pelaaja näkee lopputuloksen HUD:n pussissa ja arvaa loput. Kortti ei kerro **mistä** luku
tulee eikä **mitä kannattaisi rakentaa**, vaikka se on juuri se ruutu jolla rakentamisesta
päätetään.

Infiniten oma muotoilu on tavoite sellaisenaan:

> `shoreline (+2 food, fish +3 food) × fishing hut`

— eli **laskenta näkyvissä ja perusteltuna**, ei yksi luku ilman historiaa.

## 🟢 GREEN (luonnos — ei vielä toteutettavaksi)

- [ ] Otsikko/kortti näyttää tuoton **eriteltynä**: maasto + bonusresurssi + Työ +
      tutkimus, jokainen omalla nimellään ja omalla värillään (väälaki on jo olemassa,
      `RESOURCE_COLOUR`)
- [ ] Summa on näkyvissä, ja se **täsmää pussin kanssa** — tämä on tiketin kova
      vaatimus: kaksi eri lukua samasta heksasta olisi pahempaa kuin ei lukua ollenkaan
      (vrt. `BRDC-KEEP-008`in `formatArea`)
- [ ] Rivi mahtuu 360 px:iin ilman kääriytymistä, tai kääriytyy hallitusti
- [ ] Ei uutta laskentaa: luvut luetaan `pouch.ts`in olemassa olevasta erittelystä.
      **Jos erittelyä ei ole ulos saatavilla, sen paljastaminen on osa tätä tikettiä** —
      mutta sääntö ei muutu

## Avoimet kysymykset

1. **Paljonko mahtuu otsikkoon?** Infiniten esimerkki on yksi rivi. Neljä lähdettä
   täydellä nimellä ei mahdu kapealle ruudulle — tarvitaanko tiivis rivi + taitettu
   erittely, vai pelkkä erittely `CellWorth`iin?
2. **Näkyykö erittely myös sellaisesta heksasta jota ei omista?** Bonusresurssi on
   `BRDC-SIGIL-003`:n mukaan "löydetty, ei annettu" — paljastamaton heksa ei saa vuotaa
   mitä siinä on
3. **Näytetäänkö potentiaali vai toteuma?** Dormantti solu ei maksa mitään; rivi joka
   lupaa +5/h nukkuvasta maasta on väärässä, mutta rivi joka näyttää 0 ei kerro mitä
   kävely palauttaisi

## Ei tässä

- Sääntömuutokset tuottoon. Tämä tiketti **näyttää** mitä `pouch.ts` jo laskee
- Rakennussuositukset ("kannattaisi rakentaa Fishery") — eri asia, ja isompi
