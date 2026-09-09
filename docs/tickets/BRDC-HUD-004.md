# BRDC-HUD-004 — Ilmoitukset katoavat itsestään, eivätkä pinoudu päällekkäin

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 12 |
| **Effort** | S (tunti) |
| **Riippuvuudet** | BRDC-CLAIM-013 (joka toi valtausrivin näkyviin) |
| **Status** | `done` — 2026-09-09 (v0.5.48) |
| **Valmius** | 100 % — portti vihreä, desktop e2e 14/14; kenttätesti Infinitellä |
| **Lähde** | Infinite 2026-09-09: *"Kaikki pelialueen notifikaatiot (mukaan lukien '+10 resurssia') häviävät automaattisesti muutaman sekunnin kuluttua sen sijaan että jäisivät näkyviin/pinoutuisivat."* |

## 🔴 RED

**Neljä ilmoitusta piirtyy tasan samoihin koordinaatteihin.**

`MapNotices.tsx` renderöi neljä erillistä `<p className="mapview__warning">`, ja
`mapview.css:25-41` antaa jokaiselle `position: fixed` samalla `top`illa ja samoilla
sivumarginaaleilla. Niillä ei ole virtaussäiliötä, joten kaksi yhtä aikaa voimassa olevaa
ilmoitusta ovat **päällekkäin, ei allekkain** — jälkimmäinen peittää edellisen kokonaan.

**Eikä yksikään niistä katoa.** Ne ovat ehtoja, eivät tapahtumia: `!durable`,
`schemaReset`, `worldStirredMs !== null` ja dev-kello. Niin kauan kuin ehto on voimassa,
teksti on ruudulla. *"Other realms last stirred 1 h ago"* jää siihen koko istunnoksi.

**Valtausrivi jää sekin.** `Hud.tsx:222` näyttää `lastClaim`in niin kauan kuin se on
olemassa — eli `BRDC-CLAIM-013`:n jälkeen pysyvästi ensimmäisen askeleen jälkeen. Infinite
nimeää sen erikseen: *"mukaan lukien +10 resurssia"*.

Tämä ei ole kosmetiikkaa. `BRDC-CLAIM-013` osoitti mitä ruudulle jäävä ilmoitus tekee:
`ClaimBurst` jäi päälle ja **esti solupaneelin napin painamisen** — e2e kaatui siihen, ja
kentällä se olisi ollut sama.

**Sivulöydös:** `.mapview__warning--dev` (`MapNotices.tsx:47`) on kuollut luokka — sille ei
ole sääntöä missään.

## 🟢 GREEN

- [x] Yksi **virtaussäiliö** ilmoituksille: ne pinoutuvat allekkain, eivät päällekkäin.
      Useampi yhtä aikaa on tuettu tila.
- [x] Jokainen ilmoitus **katoaa itsestään** muutamassa sekunnissa.
- [x] Jokainen ilmoitus on **napautettavissa pois** heti (≥44 px, oikea `<button>`).
- [x] Kerran ohitettu ilmoitus **ei palaa** samalla istunnolla vaikka ehto olisi yhä
      voimassa — muuten se ilmestyisi uudelleen joka renderillä.
- [x] Ilmoitukset **eivät estä kartan käyttöä**: `pointer-events` vain itse ilmoituksissa,
      ei säiliössä.
- [x] **Valtausrivi katoaa** samalla tavalla muutaman sekunnin jälkeen. History-sisäänkäynti
      säilyy ☰-valikossa, joten mitään ei jää saavuttamattomiin.
- [x] `.mapview__warning--dev` joko saa säännön tai poistuu.
- [x] `Hud.tsx` (398/400) pysyy alle rajan — valtausrivi eriytyy omaksi komponentikseen.

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` + `pnpm build` vihreä.
- [x] Yksikkötesti ilmoituslistan rakentamisesta: kaksi ehtoa yhtä aikaa → kaksi ilmoitusta,
      ohitettu ei palaa.
- [x] e2e: kävele uuteen ruutuun → valtausrivi ilmestyy ja **on poissa** muutaman sekunnin
      kuluttua; solupaneelin napit ovat painettavissa koko ajan.
- [ ] Kenttä: kaksi ilmoitusta yhtä aikaa ovat molemmat luettavissa. *(Infinite ajaa.)*

## Toteutuksessa opittua

**Valtausrivi ei mahtunut paneeliin.** `BRDC-CLAIM-013` teki siitä yleisen — ennen se
näkyi vain lenkin sulkemisesta, mikä on harvinaista. Paneelin sisällä se työnsi HUD:n
**25 %:sta 31,7 %:iin** puhelimen ruudusta, eli yli 30 %:n budjetin (`BRDC-HUD-001`,
`trail-detail.spec.ts:81`) koko ajaksi jonka se oli näkyvissä.
→ Rivi on nyt `position: absolute` kiinteää `.hud`ia vasten, paneelin **yläpuolella**: se ei
kasvata HUD:ia eikä valehtele `--hud-height`istä, johon ylädokatut paneelit kattonsa
laskevat. Samalla se sai oman kehyksen ja taustan — se on ilmoitus, ja näyttää nyt siltä.

**Mitattu, ei arvattu:** `.hud` 197 px / 780 px = 25,3 % ilman riviä; 247 px = 31,7 %
rivin kanssa paneelin sisällä; 197 px kelluvana.

## Ei tässä

- HUD:n korkeusbudjetti (44–50 % ruudusta) — oma tikettinsä.
- `ClaimBurst`in ja kultaisen välähdyksen rajaus lenkkiin — jo tehty `BRDC-CLAIM-013`:ssa.
- Halpa yhden heksan välähdys askeleelle — oma tikettinsä.
