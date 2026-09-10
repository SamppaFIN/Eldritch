# BRDC-ECON-009 — Renderin aikana luettu kello jumitti koko tietokerroksen

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | M (puoli päivää, josta valtaosa mittaamista) |
| **Riippuvuudet** | BRDC-QUEST-001 (`useAdventure`), BRDC-ECON-007 (perustamislahja) |
| **Status** | `done` — 2026-09-10 (v0.5.61) |
| **Valmius** | 100 % — portti vihreä, desktop e2e 28/28 |
| **Lähde** | Infinite 2026-09-10: *"mikään napi ei toimi, reveal ground, tutki, osta"* |

## 🔴 RED

**Peli oli itseään ruokkivassa renderisilmukassa, joka syötti IndexedDB:tä täysillä.**

`useFumingLake` kutsui `useAdventure(repository, now(), ownedCount)` — **`now()` suoritettiin
joka renderillä**, joten hookille annettiin uusi millisekunti joka kerta:

```
render → refetch()  (uusi identiteetti, koska now on uusi luku)
       → getAdventures → getOwnedCells + koko pussin settle
       → setList(uusi taulukko) → render → uusi now() → ...
```

Mitattuna, ilman että yhtään paneelia avattiin:

| Aika | `getResources`-kutsuja yhteensä |
|---:|---:|
| 5 s | 21 |
| 10 s | 33 |
| 20 s | 85 |
| 31 s | **150** |

Eli noin **6 täyttä IndexedDB-kierrosta sekunnissa, kiihtyen.** Kutsujittain eriteltynä:
`storyRepo/adventures = 76`, `usePouchPolling = 2`. Jokainen niistä lukee kaikki solut ja
ajaa pussin settlen `commit`in globaalin kirjoitusketjun läpi, joten **kaikki muu jonottaa
niiden takana**: yksittäinen `getResources` kesti mittauksissa 3–6 sekuntia.

### Mitä pelaaja näki

1. **Pussi näytti tyhjältä.** Storessa oli `stone: 60, culture: 10`; HUD:ssa `—`. Pussin
   ensimmäinen luku osui hetkeen ennen perustamislahjaa, ja seuraava vastaus tuli 7–15
   sekuntia myöhemmin — sitä pahemmin mitä kauemmin sivu oli auki.
2. **Rakentaminen oli mahdotonta.** `BuildPanel` arvioi varallisuuden **samasta kopiosta**
   (`resources ?? EMPTY_POOL`), joten jokainen rakennus torjuttiin *"Cannot afford"* ja
   osio sanoi *"Nothing can be built here yet."*
3. Ja perustamislahja on **tasan yhden Monumentin hinta** (60 kiveä + 10 kulttuuria) — eli
   se yksi asia joka uuden pelaajan on tarkoitus tehdä ensimmäisenä oli se joka ei onnistunut.

Sivuvika samasta juuresta: pussi luettiin kerran kun repository ilmestyi, **ennen** kuin
Hearth oli perustettu, eikä mikään pyytänyt uudestaan ennen minuutin pollausta.

## 🟢 GREEN

- [x] **`useAdventure` ottaa kellon funktiona, ei lukemana.** `now: () => number`, luettuna
      `refetch`in sisällä. Sama kuvio kuin muualla koodissa — ja `MapView`in oma kommentti
      varoitti jo tästä luokasta (*"Stable primitives, not a fresh `clock` object each
      render"*, BRDC-ECON-003). Tämä oli sama vika toisessa paikassa.
- [x] **Pussi luetaan uudelleen kun Hearth syntyy.** `castle` lisätty `pouchTriggers`iin:
      se muuttuu tasan kerran, sillä hetkellä kun on Hearth ja lahja.
- [x] **`useBoot` eriytetty** (`MapView` oli 400/400 eikä kestänyt korjausta). Sauma on
      aito: kaikki siellä tapahtuu kerran, järjestyksessä, ennen kuin peliä voi pelata —
      ja **juuri se järjestys aiheutti vian**. `MapView` 399 → **357**.
- [x] Auditoin muut kutsupaikat: `KeepTemples`, `KeepResources` ja `HearthPanel` lukevat
      `now`in numerona, mutta vain klikkauskäsittelijöissä. Ne eivät ole silmukoita.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1104**) + `pnpm build` vihreä.
- [x] Uusi `opening.spec.ts` (2, desktop): perustamislahja on HUD:ssa **8 sekunnin sisällä**,
      ja se on käytettävissä siihen rakennukseen jota varten se on mitoitettu — Build on
      käytössä, painallus jättää Workin pystyyn ja pussin tyhjäksi.
- [x] **Todennettu että testi nappaa vian:** silmukka palautettiin (`() => now()`, sama
      luokka: uusi identiteetti joka renderillä), `pnpm build`, ja aikarajatesti **kaatui**.
      Palautettiin, ja se menee läpi.
- [x] Desktop `opening` + `dialogs` + `map` **28/28**.
- [ ] Kenttä: avaa peli puhelimella, katso että pussi näkyy heti ja Monument on rakennettavissa.

## Miten tämä löytyi, koska tapa on tikettiä arvokkaampi

En arvannut kertaakaan. Järjestys oli:

1. **Ajoin pelin** ja luin kortin sisällön ulos — *"Nothing can be built here yet"*.
2. **Luin storen** IndexedDB:stä: `stone: 60`. Ristiriita ruudun kanssa.
3. **Kuuntelin hylätyt promiset** — ei yhtään. Ei siis poikkeus.
4. **Lokitin mitä HUD saa propsina** — nollattu pool. Vika propsissa, ei renderissä.
5. **Lokitin jokaisen pussin luvun**: 26 lukua, joista suurin osa näki 60 — mutta HUD:n oma
   luku näki 0 eikä kysynyt uudestaan.
6. **Mittasin onko jumissa vai hidas** — 7 s tyhjä, 15 s täysi. Hidas.
7. **Mittasin ajankäytön** ja **kutsumäärän ikkunoittain** — 21 → 150. Silmukka, ei purske.
8. **Merkitsin kutsupaikat** ja sain syyllisen: `storyRepo/adventures = 76`.

Vaihe 6 oli käännekohta. Siihen asti oletin jumia; mittaus sanoi hidas, ja *hidas* osoittaa
kuormaan.

## Ei tässä

- **`commit`in globaali kirjoitusketju.** Se serialisoi kaikki pussin kirjoitukset yhteen
  jonoon (BRDC-ECON-006, tietoinen valinta), ja se on syy miksi silmukka oli näin tuhoisa
  eikä vain tuhlaavainen. Ilman silmukkaa se ei ole ongelma; jos siitä tulee sellainen,
  se on oma tikettinsä eikä hätäkorjaus tämän kylkeen.
- **Avauksen 4 sekuntia.** Yhä enemmän kuin haluaisin, mutta se on käynnistyspurske eikä
  silmukka. Mitattava uudestaan ennen kuin sitä optimoidaan.
- **`useAdventure`n yksikkötestit.** Se on hook, eikä projektissa ole React-testikirjastoa
  eikä sitä lisätä kysymättä. Kate on e2e:ssä, ja se on todennettu kaatumaan vian kanssa.
