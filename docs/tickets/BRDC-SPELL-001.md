# BRDC-SPELL-001 — Loitsut: tutkimus, valta, esto, suoja

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-MANA-001, BRDC-WAGER-JSON-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §6 (M3–M4), §3 |

## 🔴 RED

Manaa kertyy eikä sitä voi käyttää mihinkään. Ja pelissä, joka on nimeltään Eldritch
Sanctuary, ei ole yhtään loitsua — mystiikka on tähän asti ollut sanastoa, ei mekaniikkaa.

## 🟢 GREEN

- [ ] Neljä koulukuntaa suunnitelman mukaan: **tutkimus, valta, esto, suoja**
- [ ] `SPELLS`-taulukko: hinta manassa, kohde, kesto, vaikutus, avaava teknologia
- [ ] Loitsulla on **kohde ja se on tarkistettu**: oma solu, vieras solu, tai koko lääni
- [ ] Vaikutus on **määräaikainen** ja päättyy itsestään — pysyvä loitsu on rakennus
- [ ] Aktiiviset loitsut näkyvät kartalla ja HUDissa jäljellä olevine aikoineen
- [ ] Loitsu, jonka kesto on umpeutunut, **poistuu laskennasta luettaessa** — sama malli
      kuin rappeutumisella, ei ajastinta
- [ ] Puhtaat funktiot; jokainen koulukunta testattuna erikseen

## 🔴 Ratkaistava: vihollisen heksaan ei ylety

Suunnitelman §3 lupaa opetustapahtuman *"Opit Estoloitsun. Aseta se vihollisen heksalle!"*

**Vihollisen heksaa ei ole olemassa reaaliajassa.** Ilman palvelinta peli tietää muiden
pelaajien alueista vain sen, mitä `world.json` viimeksi kertoi (`BRDC-SHARE-001`) tai
mitä Wager-viesti toi mukanaan (`BRDC-WAGER-JSON-001`). Kumpikaan ei ota vastaan
vaikutusta: et voi kirjoittaa toisen pelaajan tilaan.

Kaksi rehellistä tapaa:

1. **Loitsu kulkee Wager-viestissä.** Asetat sen haasteeseen, ja se vaikuttaa siinä
   taistelussa. Deterministinen, tarkistettavissa checksumilla, toimii tänään
2. **Loitsu vaikuttaa vain omaan lääniisi** — suoja, tuotto, näkyvyys. Hyökkäysloitsut
   odottavat Supabasea

Suositus: **molemmat, eri koulukunnille.** Esto ja valta kulkevat Wagerissa; tutkimus
ja suoja vaikuttavat kotona. Näin jokainen koulukunta tekee jotain jo nyt, eikä yksikään
lupaa jotain, mitä arkkitehtuuri ei kanna.

## Ei tässä

- Uniikit ihmeloitsut → `BRDC-WONDER-001`
- Loitsuefektien grafiikka → `BRDC-ART-001`
- Palvelinvahvistettu hyökkäysloitsu vieraaseen lääniin. Supabase, myöhemmin
