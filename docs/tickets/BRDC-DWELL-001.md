# BRDC-DWELL-001 — Dwell-aika: Base ja Temppelit paljastuvat

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-GROW-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | `files/pelin-suunnittelumuistiinpanot.md` |

## 🔴 RED

Kaikki maa on samanarvoista. Peli ei tiedä mitään siitä missä pelaaja oikeasti elää,
vaikka se seuraa sijaintia tuntikausia.

## 🟢 GREEN

- [x] Aika lasketaan **per solu**: peräkkäisten fixien aikaero kohdistetaan solulle jossa oltiin
- [x] Iso aikahyppy **katkaistaan kattoon** (40 min) — puhelin taskussa 8 h ei saa tehdä kotoa temppeliä
- [x] Kynnyksen ylittänyt solu **paljastuu merkitykselliseksi**
- [x] Eniten aikaa saanut = **Anchor Stone** (koodissa `base`)
- [x] Muut kynnyksen ylittäneet = **Temppelit**, järjestyksessä
- [x] Merkitys ei ole tiedossa etukäteen — se paljastuu kun siellä on oikeasti oltu
- [x] Anchor ja Temppelit näkyvät kartalla — nimettyinä, hehkuvina merkkeinä
- [x] Paljastumishetki on oma tapahtumansa: Metatronin kuutio Ankkurille, Elämän kukka
      temppelille (`PlaceReveal.tsx`)
- [x] Puhdas funktio, aika parametrina

**Tarkennus kattoon (BRDC-VIGIL-001):** 40 min katto pätee kun pelaaja oli yhä samassa
solussa. Jos solu vaihtui, katko kattoi kävelyä eikä paikallaanoloa, ja hyvitys on
enintään `OBSERVATION_GAP_MS`. Muuten Ankkurikiven olisi saanut se solu jossa ruutu
sattui sammumaan.

**Kesken:** kartalla merkki on hehkuva ympyrä nimen kanssa, ei vielä platoninen kappale
(`claude.md` §12). Reveal-hetki on geometriaa; merkki itse ei.

## Toteutus

Kynnys on säädettävä. Prototyypissä 1,5 h; tässä pelissä kynnys kannattaa olla
**pienempi ensimmäiselle** paljastukselle, jotta jotain tapahtuu ensimmäisenä iltana.

**Miksi tämä on dokumentin vahvin idea:** paikan merkitys ei tule valikosta vaan siitä
että siellä on ollut. Peli ei kysy missä asut — se päättelee sen, ja sanoo sen ääneen
vasta kun on varma. Se on täsmälleen tämän pelin lore: *maa oppii sinut*.

**Anchor Stone on jo olemassa vakiona** (`ANCHOR_BONUS = 200`, `claude.md` §11) ja
`claude.md` §12 nimeää sille muodon: platoninen kappale. Tämä tiketti tuo sen peliin.

## Ei kuulu tähän tikettiin

Mitä Temppelit *tekevät* pelillisesti — muistiinpanot jättävät sen auki, ja niin jätän
minäkin. Ensin tunnistus, sitten vaikutus.
