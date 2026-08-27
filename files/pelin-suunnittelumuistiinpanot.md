# Sijaintipohjainen aluevaltaus & kaupunginrakennuspeli — suunnittelumuistiinpanot

Nämä muistiinpanot kokoavat suunnittelukeskustelun yhteen dokumenttiin toteutusta varten. Toimiva prototyyppi (`kotivyohyke.jsx`) on tehty tämän keskustelun aikana ja kannattaa antaa toteuttajalle mukaan referenssiksi hex-matematiikasta ja tilalogiikasta — se ei ole valmis tuote, vaan konseptin todistus yhdestä osa-alueesta.

## Konsepti

Peli jossa oma oikean maailman liikkuminen muodostaa pelialueen ("lääni"). GPS-sijainti jaetaan kuusikulmioruudukkoon (hex-grid), ja kuljettu/vallattu alue kasvaa orgaanisesti. Alueen sisällä rakennetaan SimCity-tyyppistä kaupunkia kerätyillä resursseilla, joita saa oikean maailman maastosta (järvi, metsä, kauppa jne). Pelaajat voivat haastaa toisiaan lähettämällä oman alueensa/kaupunkinsa JSON-dataa esim. WhatsAppin kautta.

## Ydinsilmukka

1. Pelaaja kävelee oikeassa maailmassa → GPS tuottaa aikaleimattuja koordinaatteja
2. Sijainti muunnetaan hex-ruuduksi; ruutu valtautuu vain jos se on **vierekkäin jo omistetun alueen kanssa** (estää GPS-virheiden aiheuttamat väärät kaukovaltaukset — ei tarvita erillistä polygon-tarkistusta, vierekkäisyyssääntö riittää)
3. Jokaisella hex-ruudulla on oikeaan maastoon sidottu resurssityyppi (järvi→vesi, metsä→puu, kauppa→kulta)
4. Pelaaja kerää dataa siitä, missä viettää aikaa (dwell time per ruutu)
5. Kun yhdessä ruudussa vietetty aika ylittää kynnyksen, paikka **paljastuu** merkitykselliseksi:
   - Eniten aikaa saanut paikka = **Base**
   - Muut kynnyksen ylittäneet paikat = **Temppelit**
   - Paikan merkitys ei ole tiedossa etukäteen — se paljastuu vasta kun pelaaja on oikeasti viettänyt siellä aikaa
6. Resursseilla rakennetaan omaa linnaa/kaupunkia (aluksi kevyttä — ei raskasta valtakunnanhallintaa)
7. Kun Base on löytynyt, avautuu yksinkertainen valinta rajan puolustukseen: **muuri** (passiivinen) vai **örkit** (aktiivinen yksikkö) — tällä ei ole vaikutusta ennen kuin toista pelaajaa vastaan taistellaan alueesta
8. Pelaaja voi haastaa kaverin: vie oman alueen/kaupungin JSON:na → kaveri tuo sen omaan peliinsä vastustajaksi → tulos lähetetään takaisin samalla tavalla (esim. WhatsAppin kautta tiedostona tai kopioitavana tekstinä)

## Mekaniikat yksityiskohtaisesti

### Sijaintipohjainen aluevaltaus
- Hex-koko pitää olla selvästi puhelimen GPS-tarkkuutta (~5–15 m) suurempi. Prototyypissä käytetty 22 m.
- Vahvista sijainti mieluummin usean peräkkäisen samankaltaisen lukeman perusteella kuin yhdellä pingillä.
- Uusi ruutu hyväksytään vain jos se on vierekkäin (axial hex -naapuruus) jo omistetun alueen kanssa, tai on ensimmäinen koskaan tehty valtaus (siemen). Muuten se ohitetaan — tämä on koko "GPS ei ole tarkka mutta pysyy rajojen sisällä" -vaatimuksen ratkaisu.
- Aikaleima tallennetaan jokaisen koordinaatin kanssa (käytetään dwell-time-laskentaan, ei vain näytöksi).

### Base & Temppelit
- Dwell-aika lasketaan per hex-ruutu (peräkkäisten lukemien aikaero kohdistetaan sille ruudulle, jossa oltiin).
- Iso aikahyppy (esim. puhelin ollut kiinni tunteja) kannattaa katkaista kattoon (esim. 40 min) ettei vääristä laskentaa.
- Kynnysarvo paljastumiselle (prototyypissä 1,5 h) on säädettävä parametri.
- Korkein dwell-arvo = Base. Muut kynnyksen ylittäneet = Temppelit, järjestyksessä.
- Avoin kysymys: mitä Temppelit *tekevät* pelillisesti pidemmällä tähtäimellä (erikoisresurssi? rakennuspaikka? puhtaasti kosmeettinen tunnistus)?

### Resurssit maastosta
- Prototyypissä maasto on simuloitu (hash-pohjainen klusterointi), koska demo-artifaktista ei pääse oikeaan paikkatietoon.
- Oikeassa toteutuksessa tarvitaan paikkatietolähde: **OpenStreetMap + Overpass API** (ilmainen, mutta rate-limitoitu ja vaatii attribuution) tai **Google Places API** (maksullinen, tarkempi). Tämä vaatii backendin — ei voi tehdä suoraan client-koodista ilman API-avaimen piilottamista.
- Resurssin saa sekä kertapalkkiona valtauksen yhteydessä että pienenä jatkuvana tuottona ajan myötä omistetuista ruuduista.

### Rakentaminen (SimCity-tyylinen)
- Aluksi rakennetaan vain omaa linnaa/tukikohtaa — ei raskasta valtakunnanhallintaa heti alusta.
- Rakennustyypit ja resurssikustannukset päätetään toteutusvaiheessa (esim. talo, saha, louhos, tori — nämä olivat esillä keskustelussa esimerkkeinä, ei lopullisina).
- 3D-näkymä rakennuksista: jos käytetään Three.js:n vanhempaa versiota, huomioi ettei OrbitControls tai CapsuleGeometry välttämättä ole saatavilla — kamerakontrollit ja geometriat pitää tarkistaa käytettävän kirjaston version mukaan.

### Rajan puolustus & PvP
- Muuri vs. örkit -valinta tehdään kevyesti Base-vaiheessa, mutta sen *vaikutus* realisoituu vasta taistelussa toista pelaajaa vastaan.
- Avoin kysymys: ratkaistaanko taistelu deterministisesti clientillä (sama syöte → sama tulos molemmilla) vai tarvitaanko palvelin vahvistamaan tulos? Ilman palvelinta kumpikin pelaaja voisi teoriassa väärentää lopputuloksen.

### Haasta kaveri (JSON export/import)
- Vie oman alueen/kaupungin tila JSON:na (rakennukset, resurssit, Base/Temppeli-sijainnit, puolustusvalinta).
- Jaa tiedostona (lataus + natiivi jakotoiminto) tai kopioitavana tekstinä liitettäväksi WhatsApp-viestiin.
- Lisää checksum/allekirjoitus JSON:iin estämään datan peukalointi ennen lähetystä.
- Kaveri tuo JSON:n omaan peliinsä vastustajaksi, pelaa sitä vastaan, ja lähettää tuloksen (pieni JSON) takaisin samalla tavalla.

## Tärkeät avoimet kysymykset ja rajoitteet toteuttajalle

- **Taustalla toimiva GPS-seuranta**: selaimessa (web-appina) taustalla tapahtuva sijaintiseuranta on rajallista, erityisesti iOS Safarissa. Dwell-time-mekaniikka joka vaatii tunteja kestävää seurantaa toimii luotettavasti vain natiivissa mobiilisovelluksessa (tai PWA:ssa rajoituksin).
- **GPS-huijauksen esto**: sijaintipohjaisissa peleissä spoofattu GPS on tunnettu ongelma. Jos peli ratkaisee riitoja tai antaa arvokkaita palkintoja liikkumisen perusteella, palvelinpuolen järkevyystarkistus (esim. liikkumisnopeus ei voi ylittää X km/h) kannattaa suunnitella mukaan.
- **Paikkatiedon lisenssi**: OpenStreetMap-datan käyttö vaatii attribuution (ODbL-lisenssi). Tarkista vaatimukset jos päädytään Overpass-rajapintaan.
- **Backend tarpeen**: alue-omistus per käyttäjä, cross-device-synkronointi ja haaste-datan välitys tarvitsevat jonkinlaisen palvelimen — kaikki tähän mennessä tehty on ollut client-only-demoa.
- **Taistelun ratkaisumalli**: deterministinen client-laskenta vs. palvelinvahvistus (ks. yllä) — päätä ennen moninpelin rakentamista.

## Prototyyppi

`kotivyohyke.jsx` toteuttaa toimivana React-artifaktina: aikaleimatun GPS-/simulointipohjaisen sijaintiseurannan, axial hex -ruudukon (SVG-renderöinti, kamera seuraa pelaajaa), vierekkäisyyssäännön alueen kasvattamiseen, dwell-time-pohjaisen Base/Temppeli-tunnistuksen, maasto-simulaation resursseille, sekä muuri/örkit-valinnan (ei vielä taistelulogiikkaa). Käytä sitä referenssinä hex-matematiikalle (axial-koordinaatit, pointy-top-orientaatio, paikallinen metri-projektio lat/lng:stä) ja tilan päivityslogiikalle, mutta rakenna oikea toteutus natiivina sovelluksena taustalla toimivan GPS-seurannan takia.
