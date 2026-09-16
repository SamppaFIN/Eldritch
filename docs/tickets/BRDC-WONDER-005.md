# BRDC-WONDER-005 — The Carcosa Foundry

| | |
|---|---|
| **Alue** | `rules/harmalaWonder.ts`, `rules/aura.ts`, `rules/capture.ts` (kutsujat) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | `todo` — luonnos, ei toteutettu |
| **Riippuvuudet** | `BRDC-WONDER-003` (bonus maksaa ylipäätään) |
| **Lähde** | `worldseed.ts` (`iron_bell`), `rules/harmalaWonder.ts`in `carcosa-foundry` |

## 🔴 RED — mitattu, ei arvattu

Dokumentti: *"+8 iron/h. Your claims gain +40 strength against rivals."* Jälkimmäinen
puolisko **ei ole uusi mekaniikka — se on olemassa oleva, vain toisesta lähteestä**:

- `resolveCapture` (`capture.ts:74`) ottaa jo `defence = 0` -parametrin, jonka kutsuja
  laskee etukäteen `defenceAura`illa (`aura.ts:113`) ja vähentää hyökkääjän voimasta
  (`max(0, attackPower - defence)`) — täsmälleen se mitä Linnoitus jo tekee
  (`BRDC-BUILD-004`)
- Carcosa Foundryn "+40 strength against rivals" on siis **sama luku, toinen lähde**:
  ei uutta kaavaa, vain yksi lisäys siihen mitä `defenceAura` jo palauttaa —
  realmin laajuinen, ei säteellinen kuten Linnoituksen oma

## 🟢 GREEN — ehdotus, ei toteutettu

- [ ] **+8 iron/h**, kun ihme on löydetty ja hereillä (`BRDC-WONDER-003`in `wonderBonus`)
- [ ] `defenceAura`in (tai sen kutsujan) uusi parametri: onko puolustajalla Carcosa Foundry
      löydettynä — jos on, `+40` lisätään summaan ennen `DEFENCE_AURA_CAP`-kattoa.
      **Katto on jo olemassa** (`DEFENCE_AURA_CAP`, `constants.ts`) — tämä ihme voi hyvinkin
      törmätä siihen jos pelaajalla on myös Linnoituksia lähellä, ja se on tarkoituksellista,
      ei bugi
- [ ] Testit: puolustus nousee +40:llä löydön jälkeen, katto pysyy, ei vaikuta hyökkääjän
      omaan voimaan (tämä on puolustusluku, ei hyökkäysluku — sekaannus jonka
      `BRDC-BUILD-004`in oma dokumentaatio jo varoitti kerran)

## Päätös Infiniteltä

- **Kertautuuko Linnoituksen suojan kanssa saman katon (`DEFENCE_AURA_CAP`) alla, vai
  onko ihmeen +40 oma, erillinen kattonsa?** Jos sama katto, moni Linnoitus + tämä ihme
  yhdessä saattaa jo olla kattautunut ilman että ihme näyttää tekevän mitään — pelaajalle
  näkymätön katto on huonompi kuin näkyvä
- Näkyykö tämä pelaajalle solukortilla (`BRDC-BUILD-012`in oma "suojattu" viesti on jo
  Linnoitus-spesifinen sanamuotoinen — "Its Fortress holds it"), vai tarvitaanko yleisempi
  sanamuoto kun suoja voi tulla kahdesta eri lähteestä?

## Ei tässä

- Hyökkäysvoiman muutokset — tämä on puolustusluku
