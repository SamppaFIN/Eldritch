# BRDC-TRAIL-004 — Käyntikerrat kantana: polku · tie · katu · valtatie · junarata

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-TRAIL-003, BRDC-HEX-001, BRDC-PERSIST-002 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"tee jsonista nk tietokanta joka tallentaa kerrat kun on käyty (tämän
perusteella päivitetään ruudulle civilisaatio tyyliin onko polku, tie, katu, valtatie,
junarata jne...)"*

`BRDC-TRAIL-003` piirtää kävellyt pätkät ja paksuntaa niitä käytön mukaan — mutta
paksuus on jatkuva arvo, ei **tila**. Pelaaja ei näe että jokin on nyt *tie* eikä enää
*polku*. Civilizationissa juuri se on palkinto: sama reitti muuttuu näkyvästi
paremmaksi, ja se kertoo kuka siellä asuu.

Tämä on halvin mahdollinen pitkän aikavälin palkinto kävelystä, ja se rakentuu datalle,
joka on jo olemassa.

## 🟢 GREEN

- [ ] **Käyntikerrat tallessa pysyvästi.** Per kuljettu reunapari (`WalkedEdge`), luku joka
      kasvaa kerran per kalenteripäivä — sama sääntö kuin vahvistuksessa: viisi lenkkiä
      tänään ei tee valtatietä.
- [ ] **Portaat `constants.ts`:ään**, viisi tasoa: polku · tie · katu · valtatie · junarata.
      Kynnykset ovat pitkiä; junarata on kuukausien asia, ei viikon.
- [ ] **Taso on puhdas funktio** käyntikerroista (`roadTier(visits)`), ei tallennettu
      kenttä — silloin kynnyksiä voi säätää ilman migraatiota.
- [ ] **Renderöinti kertoo tason**: leveys ja tyyli portaittain, ei sulava interpolaatio.
      Nykyinen `PathLayer` laajenee; ei uutta layeria.
- [ ] Taso näkyy heksan tiedoissa rivinä (*"A street runs through here — walked 40 days"*)
      ja avaa Guide-sivun.
- [ ] Testit: sama päivä ei kasvata kahdesti · jokainen kynnys tuottaa oikean tason ·
      olemassa oleva tallennus lukee ilman migraatiota (tai `SCHEMA_VERSION` nousee).

## Ei tässä

- Teiden **vaikutus** liikkumiseen tai talouteen. Tämä on näkyvä palkinto; mekaaninen
  hyöty on oma harkintansa (ja tässä pelissä liikkuminen on omat jalat, joten "nopeampi
  liikkuminen" ei tarkoita mitään).
- Teiden jakaminen muille pelaajille — Vaihe 5.
