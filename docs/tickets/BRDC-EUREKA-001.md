# BRDC-EUREKA-001 — Eurekat: kävely vie tutkimusta

| | |
|---|---|
| **Alue** | `rules/eureka.ts`, `data/loreStore.ts`, `data/stepStore.ts` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | PROG-004 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A1; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Lore tutkitaan vain maksamalla wisdomia. Civ VI:n paras keksintö — *tee asia, niin opit sen puoleen hintaan* — puuttuu, vaikka kävelypeli on sille luonteva: pelaaja liikkuu joka tapauksessa.

## 🟢 GREEN

- [ ] Jokaisella Lorella yksi eureka-ehto luettuna tilasta (esim. "kävele 3 metsäheksaa", "pidä temppeli hereillä 2 päivää", "rakenna Farm") — puhdas `eurekaFor(lore, state)` + testit
- [ ] Täyttynyt eureka laskee Loren hinnan 50 % (oletus); näkyy Research-listassa rivinä "Eureka: …" ja kun täyttyy, kortti kertoo sen
- [ ] Eureka kertyy vain kun Lore on vielä tutkimatta; ei takautuvasti ennen tiketin julkaisua (tila lasketaan julkaisusta lähtien)
- [ ] Kävelyyn sidotut ehdot laskevat askeleita samasta lähteestä kuin `stepStore` (ei toista laskuria)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Eurekat vanhalle `tech.ts`-puulle (poistumassa).
