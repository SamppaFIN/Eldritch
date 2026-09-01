# BRDC-VISITORS-001 — Unique visitors and their countries

| | |
|---|---|
| **Vaihe** | 5 — Supabase (tai yksi tietoinen poikkeus aiemmin) |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | backend (§9 sääntö 9) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-01: *"mekaniikka joka näyttää montako uniikkia ip:tä on käynyt kokeilemassa peliä ja mistä maasta"* |

## 🔴 RED

Kaverit kokeilevat peliä, mutta ei ole mitään käsitystä montako on käynyt tai mistä.
"Kuinka moni on nähnyt tämän" on kysymys johon ei ole vastausta.

## 🟡 Ongelma: tämä vaatii palvelimen

Selain **ei näe omaa julkista IP:tään** eikä voi maantieteellistää sitä ilman
ulkopuolista palvelua. GitHub Pages on staattinen. `claude.md` §9 sääntö 9: ei
API-avaimia, ei ulkoisia tilejä ennen Vaihe 5:tä.

Kaksi tietä:

1. **Odota Vaihe 5:tä.** Supabase Edge Function lukee `x-forwarded-for`in, kutsuu
   ilmaista geo-IP:tä (esim. ipapi.co) tai Cloudflaren `cf-ipcountry`-otsaketta, ja
   tallettaa **maakoodin + hashatun IP:n** (ei raakaa IP:tä) uniikkiuslaskentaa varten.
   Peli lukee summat RPC:llä.
2. **Yksi tietoinen poikkeus nyt.** Pieni Cloudflare Worker (ilmainen taso) tekee saman
   ja tarjoaa `GET /stats` → `{ unique, byCountry }`. Vaatii yhden ulkoisen tilin —
   kysy Infinitelta erikseen ennen kuin tämä avataan.

## 🟢 GREEN (kun backend on)

- [ ] Endpoint kirjaa käynnin: hashattu IP (ei raakaa), maakoodi, aikaleima
- [ ] Uniikkius = distinct hashattu IP (rullaava ikkuna, esim. 90 pv)
- [ ] Peli näyttää: **"N seekers, from M lands"** + lippulista tai top-5 maat
- [ ] Missä: title-screen tai `HearthPanel`/Atlas. Ei kävelyHUD:iin
- [ ] Tietosuoja: raakaa IP:tä ei talleteta, hash suolattu, ei evästeitä

## Ei tässä

- Kartta jossa pisteet — myöhemmin, jos maakohtaiset luvut eivät riitä
- Session-analytiikka, retention, mikään mainos-SDK
