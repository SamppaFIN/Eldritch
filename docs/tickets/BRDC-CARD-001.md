# BRDC-CARD-001 — HERE-kortti mallin mukaan

| | |
|---|---|
| **Alue** | `features/territory/CellPanel.tsx`, `CellHeader.tsx`, `CellOn.tsx`, `CellIncome.tsx`, `CellWorth.tsx`, riittilista |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `todo` |
| **Riippuvuudet** | `BRDC-SEED-004` (tarina, maamerkki, luottamus) — rakenne voidaan tehdä ennen |
| **Lähde** | `Eldritch-Sigil.html` §06 *Seven screens* — 03 · HERE · Infinite 2026-09-16: *"nuo kortit ovat toteutettu vain osiltaan.. Ei tarvitse noudattaa 100%, voit käyttää nykytoteutusta pohjana.. mutta rakennetaan kaikki ruudut mallien mukaiseksi"* |

## 🔴 RED

`BRDC-SIGIL-001`:n läpikäynti (v0.5.88) korjasi kortin hierarkiaa ja kahdentumia, **mutta mallia ei
rakennettu**. Mallin oma selitys:

> *"The cell identifies itself first — its own art, its own name, its own lore. The bonus resource
> gets a banner in its hue instead of a line of grey text. Nine locked rites collapse to one
> castable action plus a count, and the primary verb sits at the thumb."*

Malli järjestyksessä: ◉ *You are standing here* · nimi (*A Place of Trade*) · sirut *Surveyed* /
*Unclaimed* · **erikoisresurssin banneri** (*Gold vein — 10 gold once, then 2/h*) · luvut ·
**LORE · THIS CELL** · yksi castattava riitti (*Insight · 12 ◆*) + *8 more Rites locked here ›* ·
**AWAKEN THIS GROUND** peukalon alla.

Lisäksi `BRDC-BUILD-012`:n jäänne: Linnoituksen *viereisen* heksan kortti laskee yhä rappiota,
koska `CellPanel` saa yhden solun eikä naapureita.

## 🟢 GREEN

- [ ] **Auditoi nykyinen kortti mallia vasten ennen koskemista**; ero listana tähän
- [ ] Heksa esittäytyy ensin: oma kuva (laatta/rakennelma), nimi, tarina
- [ ] Erikoisresurssi **bannerina resurssin värissä**, monituotto (`BRDC-RES-001`)
- [ ] *Surveyed / Unclaimed* -sirut; luottamus < 0,5 → "?" (`BRDC-SEED-004`)
- [ ] Maamerkin oikea nimi ja tarina (`BRDC-LANDMARK-001`)
- [ ] Lukitut riitit yhdeksi castattavaksi + määrä
- [ ] Päätoiminto peukalon alla
- [ ] Linnoituksen suoja myös viereisellä heksalla (valinta välittää `fortified`-tiedon)
- [ ] 360 px -kuvakaappaus mallin rinnalla

## Ei tässä

- Tarinan generointi — `BRDC-SEED-003`
