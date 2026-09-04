# BRDC-TRAIL-005 — Miksi ley-line näytti katoavan, kun data ei kadonnut

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S |
| **Riippuvuudet** | — |
| **Status** | `done`, kenttätodennus `[~]` (v0.5.27) |
| **Valmius** | 70 % — juurisyy on parhaan löydöksen varassa, ei toistettu suorana bugina |
| **Lähde** | Infinite 2026-09-04: *"laylinet ei persistoidu ja katoo randomisti"* |

## 🔴 RED

Infiniten raportti: ley-line ei säily ja katoaa satunnaisesti. Ei kuvausta tarkoista
askelista.

**Tutkittu ja suljettu pois, e2e:llä todennettu:**

- Trail-data selviää yhdestä `reload`ista ja lisäkävelystä muuttumattomana —
  `run:active`, `run:<id>`, `trail:<id>` samat ennen ja jälkeen, pituus kasvaa oikein.
- `submitWalk` (joka reittieräpätkä kutsuu tätä) on liitä-vain: ei koskaan poista
  vanhoja pisteitä. Ainoa paikka joka lyhentää `K.trail`ia on `closeWalk` (lenkin
  sulkeminen, *"the ring is spent"*) — tarkoituksellista, ja koskee vain lenkkiä, joka
  on oletuksena pois (`BRDC-CLAIM-009`).
- `SCHEMA_VERSION`-nollaus (`BRDC-SCALE-001`) on kertaluonteinen, jo tapahtunut asia,
  ei toistuva.

**Todennäköisin selitys, ei suoraan toistettu:** `TrailLayer.ts`n oma "havaintokatko"
(`OBSERVATION_GAP_MS`, 2 min) piirtää yli kahden minuutin GPS-katkon **harmaana
katkoviivana, ei kultaisena ley-linenä** — tarkoituksella, "ei nähty" ei saa näyttää
samalta kuin "kävelty". Mutta harmaa oli `line-width: 1.5`, `opacity: 0.55`: ohuempi ja
himmeämpi kuin ydinviivan 5 px / 0.95, eikä hehkua lainkaan. Ulkona päivänvalossa,
puhelimessa — täsmälleen se konteksti jota `claude.md` §14 vaatii kontrastin
kestävän — tuollainen viiva on käytännössä näkymätön. Vigil on oletuksena pois
(*"Held open by the player, never by default"*), joten puhelimen lukkiutuminen
kesken kävelyn — tavallista, ei pelaajan hallinnassa — tuottaa tällaisia katkoja
säännöllisesti mutta arvaamattomasti: juuri se, mitä *"katoo randomisti"* kuvaa.

## 🟢 GREEN

- [x] **Katkoviiva näkyy.** `TrailLayer.ts#TRAIL_GAP_LAYER`: leveys nousee
      zoomiportaittain (2 → 4 → 6, ydinviivan tapaan) ja peittävyys 0.55 → 0.85.
      Harmaa väri ja katkoviivakuvio säilyvät — ne kertovat "ei vahvistettu", ei
      himmeys.
- [x] Trail-persistenssi todennettu e2e:llä (`_d.spec.ts`, ajettu käsin tämän
      tutkinnan aikana — ei jätetty pysyväksi tiedostoksi koska ei löytänyt mitään
      korjattavaa; toistettavissa `apps/game/e2e/step-claim.spec.ts`in kaltaisella
      IndexedDB-tarkistuksella jos epäily palaa).
- [~] **Ei toistettu suorana "data häviää" -bugina.** Jos tämä ei ole se mitä
      Infinite näki, tarvitaan tarkat toistoaskeleet (kuinka pitkä katko, kauanko
      taustalla, dev vai tuotanto).

## Ei tässä

- `OBSERVATION_GAP_MS`in arvon muutos (2 min) — pelisääntö, ei ulkoasu; kysytään
  ensin jos 2 min osoittautuu liian tiukaksi kentällä.
