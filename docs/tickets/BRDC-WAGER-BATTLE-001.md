# BRDC-WAGER-BATTLE-001 — Taistelu: deterministinen clientillä, muuri vai örkit

| | |
|---|---|
| **Vaihe** | 2.5 — suunnanmuutos |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-WAGER-JSON-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infiniten päätös 2026-08-29: *"alkuun clientillä, rakennetaan back endi sit lopuks"* |

## 🔴 RED

Haasteen saattoi lähettää ja vastaanottaa, mutta mitään ei tapahtunut. Vastustajan maa
ilmestyi kartalle ja siinä kaikki. Muistiinpanojen **muuri vs. örkit** odotti päätöstä
joka oli jätetty auki: ratkaistaanko taistelu clientillä vai vahvistaako palvelin.

## 🎯 Lukittu päätös

**Client ensin, palvelin lopuksi.** Se tekee determinismistä koko suunnittelurajoitteen,
ei mukavuuden — kaksi puhelinta jotka ovat eri mieltä voittajasta ei voi kysyä keneltäkään.
Neljä sääntöä, ja jokainen on testattu:

1. **Tulosta ei koskaan lähetetä.** Kumpikin lähettää pyhäkkönsä ja puolustusvalintansa;
   molemmat laskevat saman lopputuloksen samoista syötteistä. Ei ole viestiä jossa lukee
   "minä voitin", koska siinä ei ole mitään valehdeltavaa.
2. **Järjestys ei saa merkitä.** Osapuolet lajitellaan id:n mukaan ennen kuin mitään
   tapahtuu — haastaja ja haastettu ajavat täsmälleen saman taistelun.
3. **Siemen tulee molemmilta.** Se johdetaan molempien id:istä ja molempien voimista.
   Edullisen siemenen etsiminen tarkoittaisi oman pyhäkön muuttamista, mikä muuttaa
   voimaa, mikä muuttaa siementä. Käärme syö häntänsä tarkoituksella.
4. **Kokonaislukuaritmetiikka**, eikä `Math.random`ia lähelläkään.

## 🟢 GREEN

- [x] `resolveWager(a, b)` antaa saman tuloksen ajokerrasta riippumatta
- [x] …ja **kumman puhelin sen ajaa**: `resolveWager(a,b) === resolveWager(b,a)`
- [x] Siemen on kommutatiivinen ja muuttuu kun pyhäkkö muuttuu
- [x] Voittaja on aina joku — tasapelillä maa, sitten taso, sitten id
- [x] Muuri torjuu `WALL_GUARD` % joka iskusta; örkit lisäävät `ORC_BITE` puremaan
- [x] Valinta kulkee haasteessa (`CHALLENGE_VERSION` 1 → 2)
- [x] Maa on suurin osa voimaa — enemmän kävellyt saapuu vahvempana
- [x] Kierrosloki: kumpikaan ei voi parantua, kaikki luvut kokonaislukuja
- [x] 15 yksikkötestiä + 4 e2e:tä kahden selainkontekstin välillä

## Mitä tämä ei tee

**Se ei estä ketään muokkaamasta omaa pyhäkköään ennen lähetystä.** Mikään clientillä ei
estä. Se on Vaiheen 3 palvelimen tehtävä, ja sen sanominen on parempi kuin tarkistussumma
joka esittää tuomaria.

Kun palvelin tulee: `resolveWager` on jo puhdas funktio jolla ei ole kelloa eikä
satunnaisuutta, joten sama koodi ajetaan Postgresin puolella ja verrataan. Se on sama
golden fixture -kuvio joka `claude.md` §16:ssa on jo luvattu säännöille.

## Voiton seuraus — `spoils.ts`

Kaksintaistelu joka ei muuta mitään on esittely, ei mekaniikka. Mutta palkinto ei voi
olla heidän maansa: **maa otetaan kävelemällä**, ja se sääntö on koko pelin selkäranka.
Joten voitto tekee sen ainoan asian joka mahtuu näiden väliin — se *pehmentää* heidän
rajaansa sinun kartallasi. Solut menettävät vahvuutta; sinun on yhä mentävä seisomaan
niiden päälle.

- [x] Voitto vie `WAGER_SPOIL` vahvuutta vastustajan tuoduista soluista
- [x] **Häviö ei maksa mitään.** Jos häviö vahingoittaisi maata jonka olet oikeasti
      kävellyt, kaveri voisi jauhaa karttasi maahan haastamalla joka ilta
- [x] Omistaja ei koskaan vaihdu — eikä vahvuus koskaan mene nollaan, koska nollattu
      solu vapautuisi rappeutumissiivouksessa: se olisi omistajanvaihdos viestillä
- [x] Oma maa ja valtaamaton maa jäävät koskematta
- [x] **Haaste on kulutettu kun se on taisteltu.** Taistelu on deterministinen, joten
      saman viestin tuonti uudestaan antaisi saman vastauksen — mutta korttelin kierto
      välissä muuttaa voimaa, mikä muuttaa siementä. Häviäjä ei koskaan häviäisi.
- [x] Tuonti, taistelu ja saalis ovat **yksi kutsu**: tila jossa vastustajan maa on
      kartalla mutta kaksintaistelua ei ole käyty ei saa olla havaittavissa

## Toisto — `WagerFight.tsx`

Kierrosloki oli olemassa eikä näkynyt missään: kaksintaistelu oli JSON-tapahtuma jonka
lopputulos ilmestyi lauseena. Nyt se katsotaan.

- [x] Kaksi voimapalkkia askeltavat kierros kerrallaan — kaksi lukua yhtä aikaa on
      *tulos*, eikä tulos ole kaksintaistelu
- [x] Kanoninen järjestys on id:n mukainen eikä merkitse pelaajalle mitään;
      `fightFrames` kääntää sen muotoon *minä / he* — ja testi vaatii että kaksi
      näkymää ovat **täsmälliset peilikuvat**, tai toinen niistä valehtelisi
      taistelusta josta molemmat ovat samaa mieltä
- [x] Palkit ovat `progressbar`eja jotka kertovat arvonsa avustavalle tekniikalle;
      tuomio sanotaan sanoin
- [x] Mandala ilmestyy kerran, lopussa — ei joka kierroksella (`claude.md` §12:
      geometria on hetkiä varten, ei tapetiksi)
- [x] `prefers-reduced-motion`: suoraan loppuun. Tuomio on tieto, askellus on draamaa

Lähtövoimat eivät ole lopputuloksessa eikä niiden tarvitse olla: osapuolen voima ennen
ensimmäistä kierrosta on se mitä sillä oli sen jälkeen plus se mikä siitä vietiin.
Johtaminen voittaa lankaformaatin leventämisen edistymispalkin takia.

## Ei tässä
