# BRDC-CLAIM-015 — Kerran päivässä maa menee sille, joka siellä oikeasti käy

| | |
|---|---|
| **Alue** | `rules/capture.ts`, `types/domain.ts` (`Cell`), `data/walkWriter.ts`, jaettujen solujen käsittely |
| **Vaihe** | 3 → **todennäköisesti 5** (ks. "Miksi tämä ei ole pieni") |
| **Effort** | L |
| **Status** | `todo` — **suunnittelupäätös Infiniteltä tarvitaan ennen koodia** |
| **Lähde** | Infinite 2026-09-15: *"haluan, että kerran päivässä jokainen maa ja niiden omistus lasketaan sen mukaan, kuka on käynyt siellä useiten. Nyt tuolla on paljon jaettuja heksoja."* |

## 🔴 RED — mikä ongelma tässä oikeasti on

Oire on selvä ja todellinen: **jaettuja heksoja on liikaa.** `shared`-tila
(`BRDC-WAGER-JSON-005/-006`) syntyy kun tuotu Wager väittää samaa maata kuin sinä, ja
silloin tuotto jaetaan. Jos niitä kertyy paljon, kartta on täynnä puolikkaita eikä
kenenkään maata.

Toive on yhtä selvä: **omistuksen pitäisi ratketa**, ja ratketa sen perusteella kuka
siellä oikeasti kulkee — ei sen, kuka ehti ensin tai kenellä oli parempi vahvuus
tuontihetkellä.

## ⛔ Miksi tätä ei voi vain toteuttaa — kaksi estettä, molemmat koodista

### 1. Peli ei tallenna kenenkään muun käyntejä

`Cell` kantaa `visitDays`- ja `visits`-kentät, mutta ne ovat **nykyisen omistajan**
omat — ja `capture.ts` nollaa ne omistajan vaihtuessa:

```ts
// capture.ts:98 ja :199, molemmat valtauspolut
visitDays: [today],
```

`ownedDays` säilyy omistajan yli (*"Cumulative across owners"*), mutta se on **yhteis**-
luku, ei kenenkään oma. Ainoa paikka jossa kahden pelaajan käyntejä verrataan on
`shared.myDays` / `shared.theirDays` — ja ne ovat tilannekuva **tuontihetkeltä**, eivät
elävä laskuri.

Eli kysymykseen *"kuka on käynyt täällä useiten"* **ei ole tänään mitään millä vastata.**
Se vaatii uuden pysyvän rakenteen: käyntilaskuri per solu per pelaaja. Se on uutta
tallennettavaa dataa jokaiselle heksalle, ja se kasvaa pelaajamäärän mukana.

### 2. Rivaalin käyntimäärä on hänen oma väitteensä

Vaiheissa 0–4 ei ole palvelinta. Tieto rivaalin käynneistä tulisi `world.json`ista tai
Wager-viestistä — eli **vastapuolen omasta ilmoituksesta**. Omistuksen ratkaiseminen
sillä luvulla tarkoittaa, että maan saa kirjoittamalla suuremman numeron.

`claude.md` §6.1 sanoo: *"ownership, XP, and capture outcomes are decided only by Postgres
RPC"* — ja §15 kieltää anti-cheatin heikentämisen pyytämättä. Tämä mekaniikka on
**arbitraatiota**, ja arbitraatio ilman palvelinta on luottamusjärjestelmä.

## 🤔 Ja kolmas asia, joka kannattaa tietää ennen kuin rakennetaan mitään

**Jaettu solu ratkeaa jo tänään.** `Cell.shared`in oma docstring:

> *"Cleared by reinforcing the cell on a new day."*

Eli kävele se uudestaan uutena päivänä, ja se on kokonaan sinun. Jos jaettuja heksoja on
paljon, mahdollisia syitä on kaksi, ja ne johtavat eri korjauksiin:

- **Pelaaja ei tiedä tätä.** → korjaus on tekstiä, ei sääntöä. Halpa, ja `BRDC-DETAIL-001`
  jätti `OwnershipNote`n juuri sitä varten näkyviin jaetuille soluille
- **Sääntö ei oikeasti laukea.** → se on bugi, ei ominaisuuspyyntö, ja se on tätä
  halvempi korjata

**Tämä kannattaa mitata ennen kuin isompaa rakennetaan.**

## Kysymykset Infiniteltä

1. **Korvaako tämä piiritysmallin?** `claude.md` §11 sanoo piirityksestä: *"Do not
   'simplify' this back to a single comparison."* Päivittäinen käyntivertailu on
   yksi vertailu — jos se voi kääntää solun, piiritys ohitetaan
2. **Riittääkö paikallinen totuus?** Eli: ratkaistaanko *vain* sillä mitä tämä laite on
   nähnyt (rehellinen, mutta ei tiedä rivaalin kävelyistä mitään), vai odotetaanko
   Vaihetta 5 ja palvelinta (oikea, mutta myöhemmin)?
3. **Vai riittääkö kevyempi:** jaettu solu ratkeaa jo uudella käynnillä — tehdäänkö
   siitä näkyvä ja varma ensin, ja katsotaan kaipaako se sen jälkeen enempää?

## Ei tässä

- Mitään koodia ennen vastauksia. Tämä on sääntömuutos pelin ytimeen, ja §5:n työnkulku
  on tätä varten: tiketti ensin, päätös, sitten toteutus
