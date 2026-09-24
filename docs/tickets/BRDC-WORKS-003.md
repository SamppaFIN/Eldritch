# BRDC-WORKS-003 — Yhdeksän rakennuksen sisältö: sivut ja puut

| | |
|---|---|
| **Alue** | `packages/core/src/rules/worksDefs/*.ts` (uusi, yksi tiedosto per rakennus, jotta mikään ei lähesty 400 riviä) |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `draft` — sisältö siirretty PDF:stä 2026-09-24, ei aloitettu (testitauko) |
| **Riippuvuudet** | `BRDC-WORKS-002` (tyypit) |
| **Lähde** | Design system -PDF, sivut 01–09. **Tämä tiketti on sisällön totuuden lähde**, eikä PDF:ää tarvitse avata toteutuksessa |

## 🔴 RED

PDF:ssä on yhdeksän valmista sivua, joissa on lore, luvut ja 56 solmua, mutta mitään niistä
ei ole koodissa. Sisältö pitää siirtää dataksi täsmälleen, ja kolme PDF:n omaa
epäjohdonmukaisuutta pitää ratkaista kerran (alla).

## Kirjoitussäännöt

- Hinnat koodin avaimilla: PDF:n `TIMBER` = `wood` (UI sanoo "timber", `RESOURCE_WORD`).
- **A** = efekti kytkeytyy olemassaolevaan mekaniikkaan, **B** = `dormant` (WORKS-002 P5).
- Lore kirjoitetaan sanasta sanaan PDF:stä. Ei muokata, ei lyhennetä.
- `Needs` jätetään pois: edeltäjä on aina edellinen taso (WORKS-002).

## PDF:n epäjohdonmukaisuudet, ratkaisuehdotukset

1. **"Tiers III and V are a choice"** — PDF:n periaate sanoo näin, mutta taso V on valinta vain
   Keepissä, Templessä ja Watchtowerissa. Muissa kuudessa V on yksi solmu. **Ehdotus:**
   taso III on aina valinta, taso V saa olla valinta. Rakennetesti (WORKS-002) tarkistaa vain III:n.
2. **Night Marketin "2 / 7 LEARNED"** ym.: laskurin nimittäjä on kaikkien solmujen määrä,
   mukaan lukien valinnassa suljettu. `LEVEL n / 5` on tasoja. Molemmat säilyvät.
3. **Taso vs. opitut:** jokaisessa PDF:n esimerkissä `LEVEL` = opittujen tasojen määrä
   (Keep 2, Night Market 3). Tämä vahvistaa `worksLevel`in määritelmän.

---

## 01 · The Keep — *Linna · Seat of the realm*

`kind: 'keep'` · anchor cell · stat `PROVINCES` · reach **Influence** 1 → max 2 · upkeep none
Tuottaa: `+6 mana/h +1 culture/h +2 gold/h`. Muistiinpano: *"The only building that cannot be
lost to decay. If it falls to a rival, every province you hold loses its bonus until you
rebuild."* Reach-lause: *"Every claim you make inside the ring starts stronger."*
Lore: *"Every Keep is built on something that was already there. The masons dug four metres
down and found the foundation already laid — and still warm."* — Marginalia, Härmälä parish
register, 1911
Puu: **The Old Foundation**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Warded Walls | +50 strength on the Keep's own cell | stone 40 | A | The mortar was mixed with lake water drawn at midnight. Nobody wrote down why. |
| II | Mustering Yard | Claims inside your influence start at +15 strength | stone 60, gold 20 | A | The drill sergeant counts the recruits every dawn. Some mornings there is one extra. |
| III◇ | The Deep Cellar | Food storage cap +200 food, and stores never rot | stone 80, wisdom 30 | A* | Something beneath the cellar breathes in winter. The frost on the barrels forms in rings. |
| III◇ | The High Seat | Influence reaches +1 ring — 36 cells in all | stone 80, gold 40 | A | From the high seat you can see every roof in the reach. Some of them have windows facing inward. |
| IV | Council of Whispers | +2 wisdom per hour for every province you hold | gold 120, culture 60 | A | The councillors meet in a room without a door. They are always already seated when you arrive. |
| V◇ | Crown of the Sleeper | The Keep cannot be besieged while you walk within 500 m | mana 200, stone 150 | B | Wear it, and you dream the same dream as the thing under the lake. It does not notice you. Yet. |
| V◇ | The Unbroken Line | Cells on your province borders never decay below 200 | culture 200, stone 150 | A | A line drawn in salt, walked every solstice, and never once crossed from the other side. |

\* "stores never rot": ruoka ei pilaannu tänään. Jos pilaantumista ei tule, lauseen
jälkimmäinen puolikas poistetaan eikä sitä toteuteta.
Huom: *"36 cells in all"* on väärin, koska 2 rengasta = 18 solua (1+6+12 = 19 keskusta
lukien). Ehdotus: lause lasketaan `reachRings`istä, ei kirjoiteta käsin.

## 02 · Temple of the Birches — *Koivujen temppeli · Revealed, not built*

`kind: 'temple'` · forest · stat `RITES` (n / 4) · reach **Blessing** 1 → max 2 · upkeep −1 food
Tuottaa: `+6 mana/h +2 wisdom/h`. Muistiinpano: *"Rites are cast here and nowhere else. A temple you
lose takes its learned rites with it."* Reach: *"Cells inside the blessing earn mana when walked."*
Lore: *"They did not build the temple. They found it standing among the birches on the sixth
morning, and its door opened onto a staircase longer than the hill was tall."* — Statement of a
berry-picker, 1934
Puu: **Litany of the Deep**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Kindled Altar | +2 mana per hour from the altar alone | wisdom 20 | A | The flame is blue at the base and something else at the tip. Looking at the tip too long is discouraged. |
| II | Choir of Stillness | Every rite cast here costs 20% less mana | wisdom 30, mana 40 | A | They sing with their mouths closed. The birches outside lean towards the sound. |
| III◇ | Eye of the Dreamer | Reveals the six cells around every temple you hold | wisdom 60, mana 60 | A | Close your eyes in the nave and you see the surrounding streets — from above, and slightly wrong. |
| III◇ | Bell of Tides | Blessing reaches +1 ring | wisdom 60, iron 40 | A | The bell is rung at low water. There is no tide on Pyhäjärvi. It rings on schedule regardless. |
| IV | Reliquary | A found artefact placed here doubles its bonus | culture 100, gold 80 | B | The reliquary accepts gifts. It has, twice, returned them — to people who had not given them. |
| V◇ | Open the Stair | Unlocks the rite Descent — walk below the map | mana 250, wisdom 150 | B | The staircase goes down four hundred steps. The bottom step is warm, and wet, and breathing. |
| V◇ | Seal the Stair | This temple can never be lost to a rival siege | stone 250, culture 150 | B | Some doors are best closed from this side. The masons were paid double and asked no questions. |

Huom: "Blessing earns mana when walked" on uusi mekaniikka (B). Renkaan piirto ja luku ovat A.

## 03 · Farmstead — *Maatila · Built on plains*

`kind: 'farm'` · plain, Wheat deposit · stat `STORES` · reach **Harvest** 1 → max 2 · upkeep none
Tuottaa: `+4 food/h +1 gold/h`. Muistiinpano: *"Standing on a Wheat deposit doubles the base
yield. Food feeds every other work you hold."* Reach: *"Plain cells in the ring give +1 food each."*
Lore: *"The rye grows tallest over the old burial field. The farmers stopped asking why in 1868
and started asking only how much."* — Tampere agricultural survey, unpublished appendix
Puu: **The Hungry Furrow**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Tilled Rows | +2 food per hour | wood 20 | A | The plough turns up flint arrowheads every spring. They always point towards the lake. |
| II | Granary Loft | Food storage cap +200 food | wood 40, stone 20 | A | The rats will not go into the loft. The cats will not come out of it. |
| III◇ | Rotation of the Fields | Harvest reaches +1 ring of plains | food 40, wisdom 30 | A | Leave one field fallow each year, the old rule says. Nobody remembers what it is being left for. |
| III◇ | Scarecrow of Straw and Bone | Rival claims in your harvest lose 20 strength a day | wood 30, culture 20 | B | It was only straw when they built it. Nobody added the bone. |
| IV | Mill Wheel | Converts 10 food → 2 gold every hour | wood 80, stone 40 | A | The wheel turns in both directions depending on who is watching it. |
| V | Harvest Moon | Once each full moon, triple food for 24 hours | food 150, mana 80 | B | On the night of the harvest moon the fields are reaped by morning. The farmhands all slept through it. |

## 04 · Sawmill — *Saha · Built on forest*

`kind: 'sawmill'` · forest, Birch stand · stat `STACKED` · reach **Felling** 1 → max 2 · upkeep −1 food
Tuottaa: `+4 wood/h`. Muistiinpano: *"Timber is spent on almost every other building. Two Sawmills in
one province share one flume."* Reach: *"Forest cells in the ring feed the mill."*
Lore: *"The blades are sharpened on Sundays. The logs from the eastern stand come in already
split, and nobody on the crew will say who split them."* — Foreman's log, Rantaperkiö mill, 1922
Puu: **The Split Grain**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Iron Teeth | +2 timber per hour | iron 30 | A | New blades every season. The old ones are buried, not melted. That is the rule. |
| II | Log Flume | Felling reaches +1 ring of forest | wood 60, stone 20 | A | Logs float down the flume at night. Sometimes more arrive than were cut. |
| III◇ | Charcoal Pits | Your Forges yield +20% iron | wood 80 | A | The pits smoulder for weeks. The smoke drifts against the wind, towards the temple. |
| III◇ | Old-Growth Pact | Ancient Oak deposits in reach yield double timber | culture 60, mana 40 | A | Ask the oldest tree before you cut its children. It will answer. Do not ask what it wants in return. |
| IV | Shipwright's Slip | Water cells no longer break a walk streak | wood 120, iron 40 | B | The first boat off the slip came back empty. The second came back with a passenger nobody had sent. |
| V | The Pale Timber | +4 timber; temples built from it gain a blessing ring | wood 200, mana 100 | A/B | White wood, grainless, that grows only where something is buried. It never rots and never burns. |

Huom: "Two Sawmills in one province share one flume" on sääntö, jota ei ole. Ehdotus: lause
jätetään pois, kunnes se on totta. Pale Timber: `produce` on A, temppelirengas B.

## 05 · Quarry — *Louhos · Built on hills*

`kind: 'quarry'` · hill, Granite · stat `DEPTH` · reach **Seam** 0 ("THIS CELL ONLY") → max 2 · upkeep −1 food
Tuottaa: `+2 stone/h`. Muistiinpano (taso 0): *"Only just founded. Nothing is learned yet — the first
tier is open now."* Reach: *"Works only its own cell until Deep Gallery follows the seam outward."*
Lore: *"At nine metres the granite turns black and smooth, as though polished from the other
side."* — Blasting report, Pereen rise, 1959 — sealed
Puu: **The Black Seam**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Drill and Wedge | +2 stone per hour | iron 30, wood 20 | A | Drive the wedge at dawn. Stop when the stone starts ringing back. |
| II | Cut Stone | Every building costs 10% less stone | stone 60 | A | The blocks come out square without being dressed. The masons are grateful and uneasy. |
| III◇ | Follow the Black Seam | +1 iron and +1 mana per hour — and something taps back | stone 80, wisdom 40 | A | The seam is warmer than the rock around it. At night the drillholes sweat. |
| III◇ | Mason's Guild | All works in the province +50 strength | stone 80, gold 40 | A | The guild keeps its own calendar. It has one more month than ours. |
| IV | Deep Gallery | Seam reaches +2 rings of hill | stone 150, iron 60 | A | The gallery goes further than the survey says the hill extends. |
| V | The Floor Beneath | Unlocks the wonder Ten Thousand Steps | stone 300, wisdom 150 | B | Below the last gallery the floor is dressed stone. Nobody laid it. The steps go down. |

Huom: nykyinen `quarry` tuottaa `+9 stone` (`build.ts`). PDF:n perustuotto on 2, ja
tutkimus tuo lisää. Tasapaino on päätös (P7).

## 06 · Forge — *Paja · Built on hill or settlement*

`kind: 'forge'` · settlement, Bog iron near · stat `HEAT` (1 240°) · reach **Smelting** 1 → max 1 · upkeep −2 timber
Tuottaa: `+3 iron/h +1 gold/h`. Muistiinpano: *"Iron gates Toolmaking, towers and every siege bonus.
The forge burns timber whether you collect or not."* Reach: *"Bog iron and ore deposits in the
ring are smelted here automatically."*
Lore: *"The bellows were rebuilt twice. Both times the smith swore the fire had been breathing on
its own."* — Insurance claim, Härmälänranta works, 1947
Puu: **The Unquenched Fire**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Hot Hearth | +2 iron per hour | stone 30, wood 20 | A | The hearth has never fully gone out. Not in the fire of 1947, not in the flood of 1966. |
| II | Bloomery | Bog iron deposits in reach give +2 iron each | stone 40, iron 30 | A | The bloom comes out of the furnace in the shape of a closed hand. |
| III◇ | Tempered Edge | Your claims gain +20 strength against rivals | iron 60, gold 30 | A* | Quench the blade in lake water and it holds an edge for a century. Also, it hums. |
| III◇ | Bell-Founder | The Iron Bell Foundry wonder costs 25% less iron | iron 60, culture 40 | B | They cast a practice bell first. It was never rung. It rang anyway. |
| IV | Star-Metal | Every iron smelted gives +1 mana | iron 100, mana 80 | A | Iron that fell from the sky in 1842. It is heavier on moonless nights. |
| V | The Unquenched | +5 iron; this cell is immune to decay | iron 200, wood 120 | A | Let the fire decide when it is finished. It has not decided yet. |

\* Tempered Edge: CLAIM-017:n jälkeen askelvaltaus rivaalilta on välitön, joten `attackPower`
vaikuttaa enää vain Hearthiin ja Fortressiin. Efekti on A mutta lähes merkityksetön (P2).

## 07 · Night Market — *Yötori · Built on trade* (PDF:n rivaaliesimerkki)

`kind: 'market'` · trade, Kenkätie · stat `TRADES` (rivaalilla `YOUR ATTACK`) · reach **Trade Route** 2 → max 2 · upkeep none
Tuottaa: `+3 gold/h +2 culture/h`. Muistiinpano (rivaalin sivu): *"Rival-held. You see what it
produces and what they have learned — you cannot research here until the cell is yours."*
Reach: *"Their trade cells in the ring pay the Order. Take the market and the route becomes yours."*
Lore: *"Prices at the Wednesday market are quoted in coin. Prices at the other market — the one
after the lamps go out — are quoted in years."* — Overheard at the Kenkätie stalls, 2019
Puu: **The Last Bargain**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Stalls | +2 gold per hour | wood 30 | A | Stalls go up at dusk. By dawn there is one more stall than there were traders. |
| II | Weights and Measures | Every trade loses 10% less to the exchange | iron 40, gold 20 | A | The weights are honest. The scale, less so. |
| III◇ | Caravan Road | +1 gold for each trade cell in reach | gold 60, stone 40 | A | Caravans arrive from towns that are not on the map. Their coin spends anyway. |
| III◇ | The After-Dark Stalls | +2 culture, but −1 food each hour | culture 60 | A | What is sold there cannot be bought back. |
| IV | Counting House | Gold storage cap +500 gold | gold 120, stone 60 | A | The accountants count in base twelve. The thirteenth column is never totalled. |
| V | The Last Bargain | Trade anything for anything, once | gold 400, culture 200 | B | Once, you may ask the market for anything. It will name a price. You will pay it. |

## 08 · Watchtower — *Vartiotorni · Built on hill or plain*

`kind: 'watchtower'` (**ei vielä `BuildingId`**, BUILD-013) · plain, Rantapuisto · stat `SIGHT` · reach **Sight** 2 → max 3 · upkeep −1 food
Tuottaa: `+1 wisdom/h`. Muistiinpano: *"It produces little. Its value is what it shows you — rival
claims, fading cells and caches inside its sight."* Reach: *"Lookout sees ring one. Second
Platform adds ring two. Spyglass of Ground Lenses adds ring three."*
Lore: *"From the top you can see the whole lake. On clear nights you can see a second lake beneath
it, with its own lights."* — Night-watch logbook, entry of 3 October
Puu: **What the Lake Sees**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Lookout | Reveals the six cells around the tower | wood 30, stone 20 | A | The first watchman kept a list of every boat on the lake. Some entries have no oars. |
| II | Second Platform | Sight reaches +1 ring — 18 cells | stone 60, iron 30 | A | The stair to the second platform has thirty steps going up and thirty-one coming down. |
| III◇ | Signal Fire | Rival sieges inside your sight are announced the moment they start | wood 40, wisdom 30 | B | Light the fire when something moves on the water. Keep it lit until it stops. |
| III◇ | Spyglass of Ground Lenses | Sight reaches +1 ring — 36 cells | iron 60, wisdom 40 | A | The lenses were ground from lake ice that never melted. They show a little further than they should. |
| IV | Night Watch | Fading cells in sight decay half as fast | food 80, wisdom 60 | A | Someone is always on watch. The roster has one name nobody recognises, and it is always their turn. |
| V◇ | Beacon to the Other Lake | See rival research in every work inside your sight | mana 200, wisdom 100 | B | Answer the lights beneath the water. They have been signalling for a long time. |
| V◇ | The Tower Looks Back | Rival claims inside your sight lose 40 strength | iron 200, mana 100 | B | Stare long enough from the top and whatever is out there knows it is being watched. It minds. |

## 09 · The Drowned Man — *Hukkunut mies · taverna · Built on settlement or trade*

`kind: 'tavern'` · settlement, Ale Cellar · stat `QUESTS` (n open) · reach **Rumour** 1 → max 2 · upkeep −2 food
Tuottaa: `+2 gold/h +1 culture/h`. Muistiinpano: *"The quest board lives here. Every active chain
in the province is listed on its wall and nowhere else."* Reach: *"Caches inside the ring appear
on the quest board as rumours."*
Lore: *"The Drowned Man serves ale that tastes faintly of salt. The regulars say it is the only
honest drink in Tampere, and that the landlord has not blinked since 1980."* — Review card,
pinned behind the bar
Puu: **Last Orders**

| T | Solmu | Efekti | Hinta | | Lore |
|---|---|---|---|---|---|
| I | Quest Board | Lists every quest in the province | wood 30, gold 10 | A | Notices go up overnight. The handwriting is always the same, whoever pins them. |
| II | Hearth and Hops | An adjacent Ale Cellar gives double gold | food 40, gold 20 | B | The hops are dried over the hearth. The smoke smells of seaweed, forty kilometres from any sea. |
| III◇ | Travellers' Rest | +1 active quest slot | wood 60, gold 40 | B | Room seven is always taken. The key is always on its hook. |
| III◇ | Whispering Corner | Rumour reaches +1 ring; one cache revealed a day | culture 40, wisdom 40 | A/B | Sit in the corner booth and you will hear something useful. You will not see who said it. |
| IV | The Private Room | Wager stakes won here +50% tokens | gold 100, culture 50 | B | Bets are settled in the back. The losers leave by the other door. |
| V | The Last Round | Once a week, restore one fading cell to full strength | gold 150, mana 100 | B | Time, gentlemen. The landlord rings the bell, and for one hour the clocks in the district agree with him. |

Huom: Quest Board on tavernan nykyinen käytös (TAVERN-001), joten taso I on "ilmainen" solmu,
joka vain nimeää sen. The Private Room nojaa Wageriin, joka on pysäköity (CLAIM-017).
Ehdotus: se vaihdetaan A-efektiin tai jää `dormant`iksi.

---

## Yhteenveto A/B

| Rakennus | Solmuja | A | B |
|---|---:|---:|---:|
| Keep | 7 | 6 | 1 |
| Temple | 7 | 4 | 3 |
| Farmstead | 6 | 4 | 2 |
| Sawmill | 6 | 5 | 1 |
| Quarry | 6 | 5 | 1 |
| Forge | 6 | 5 | 1 |
| Night Market | 6 | 5 | 1 |
| Watchtower | 7 | 4 | 3 |
| The Drowned Man | 6 | 2 | 4 |
| **Yht.** | **57** | **40** | **17** |

(A/B-solmut lasketaan A:ksi, koska niiden A-osa toimii yksinään.)

## 🟢 GREEN

- [ ] Yhdeksän `worksDefs/<kind>.ts`-tiedostoa, sisältö sanasta sanaan tästä tiketistä
- [ ] WORKS-002:n rakennetesti menee läpi kaikille yhdeksälle
- [ ] Lore-testi: yksikään `lore` ei ole tyhjä, ja jokaisella sivulla on `lore.source`
- [ ] Hintojen avaimet ovat koodin avaimia (`wood`, ei `timber`). Testi hylkää tuntemattoman
- [ ] Reach-lauseiden solumäärät lasketaan, ei kirjoiteta käsin (Keepin "36 cells" -virhe)
- [ ] Portti: `pnpm test && pnpm typecheck && pnpm lint:lines`

## Päätös Infiniteltä

- **P7 — Tasapaino.** PDF:n perustuotot (Quarry +2 stone, Sawmill +4, Farm +4) ovat
  pienempiä kuin nykyisen `build.ts`in (+9, +5, +5), ja tutkimus kasvattaa niitä. Käytetäänkö
  PDF:n lukuja sellaisenaan (peli hidastuu alkuun ja palkitsee tutkimuksen) vai skaalataanko
  ne nykytasolle?
- **P8 — Rakennuskatalogi.** Nykyisessä `BUILDINGS`issa on 16 rakennusta, PDF:ssä 7 + Keep +
  Temple. Saavatko loput (granary, monument, storehouse, lumbermill, mine, fishery, vineyard,
  library, lighthouse, fortress) oman puun myöhemmin, vai karsitaanko katalogi näihin
  yhdeksään?
