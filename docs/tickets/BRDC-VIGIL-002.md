# BRDC-VIGIL-002 — Keepalive kuolee lukitussa puhelimessa, ja aukon paikkaus

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus (osa vastauksesta on Vaihe 4) |
| **Effort** | M (mittaus) + L (jos vastaus on APK) |
| **Riippuvuudet** | BRDC-VIGIL-001, BRDC-MOBILE-001 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Keepalive ei näytä toimivan, heti kun känny menee lukkoon, niin lakkaa
toimimasta. Voisiko joku humina pitää ruudun hereillä paremmin.. vai tarviiko tuo android
sovelluksen, että toimii lukittuna taskussakin."*

Tämä on koko pelin kriittisin avoin kysymys, ei yksi bugi. `BRDC-VIGIL-001` rakensi
äänisilmukan ja `wakeLock`in juuri tähän, ja lukitusnäytöllä ne eivät riitä. Jos vastaus
on "selain ei pysty", niin Vaiheiden 1, 2 ja 2.6 hyväksymisportit — *kävele kortteli
puhelin taskussa* — eivät ole selaimella läpäistävissä lainkaan, ja **APK nousee kaiken
4X-sisällön edelle**. `claude.md` §9 sanoo tämän jo: *"Jos vastaus on 'ei tarpeeksi
pitkälle', APK on kiireellisempi kuin mikään 4X-sisältö."*

Tätä ei ratkaista arvaamalla. Se mitataan.

## 🟢 GREEN

- [ ] **Mitattu vastaus, ei mielipide.** Kävele sama reitti kolmesti: (a) näyttö auki,
      (b) näyttö lukossa, Vigil päällä, (c) näyttö lukossa, Vigil pois. Kirjaa jokaisesta
      pisteiden määrä, aukot ja akunkulutus. Tulos tähän tikettiin.
- [ ] **Päätös kirjattuna:** riittääkö selain, vai vaatiiko taskussa toimiminen APK:n
      (`foreground service`, Vaihe 4). Jos jälkimmäinen, tämä tiketti sulkeutuu ja
      `BRDC-ANDROID-004` nousee jonon kärkeen.
- [ ] **Rehellinen tila käyttäjälle.** Jos selain ei pysty pitämään linjaa lukossa, Vigil
      sanoo sen suoraan sen sijaan että lupaisi. Nykyinen *"breath"* / *"screen only"*
      -lukema tarkistetaan totuudenmukaiseksi kentällä mitatulla.
- [ ] **Aukon paikkaus herätessä.** Kun sivu herää ja edellisen pisteen ja nykyisen välissä
      on matkaa, arvioi väli suoraksi janaksi **vain jos** se läpäisee tarkistukset:
      nopeus alle `MAX_SPEED_MS`, aukko alle kynnyksen, ja väli merkitään `interpolated`ksi
      — se ei kelpaa lenkin sulkemiseen eikä valtaukseen, vain jäljen jatkuvuuteen.
- [ ] Testi: aukko jonka nopeus ylittää rajan **ei** paikkaudu; kelvollinen aukko paikkautuu
      ja merkitään `interpolated`.

## Ei tässä

- **Kulkutapavalinta (kävely / pyörä / auto).** Infiniten ajatus: *"ehkä valinta, että
  mennäänkö nyt autolla, pyörällä vai kävellen ja sitä saakin tutkimustietoa vain
  säännöllisin väliajoin."* Se on oikea idea ja väärä hetki — se muuttaa anti-cheatin
  koko mallin (`claude.md` §15), ja §15 sanoo: älä heikennä ilman pyyntöä. Oma tikettinsä
  kun tämän mittaus on tehty ja tiedetään mitä ollaan korvaamassa.
- Akun optimointi. Ensin tieto siitä toimiiko mikään.
