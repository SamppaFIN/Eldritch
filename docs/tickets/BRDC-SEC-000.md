# BRDC-SEC-000 — Vuotaneiden avainten rotaatio

| | |
|---|---|
| **Vaihe** | 3 (siirretty) |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | — |
| **Status** | `parked` — tehdään kun Supabase kytketään |
| **Valmius** | 0 % |
| **Tekijä** | Infinite (ei automatisoitavissa) |

> **Siirretty Vaiheeseen 3 (päätös 2026-08-26).** Vaiheet 0–2 eivät käytä yhtään avainta,
> tiliä tai ulkoista palvelua — peli toimii kokonaan mock-datalla offline. Rotaatio tehdään
> silloin kun Supabase otetaan käyttöön, ei ennen.
>
> **Tämä ei poista riskiä.** `.env` on edelleen julkisessa v2-repossa. Jos siinä on
> `service_role`-avain, se on luettavissa nyt. Riski vain hyväksytään toistaiseksi,
> koska v2:n Supabase-projektia ei enää käytetä mihinkään.
>
> **Suositus:** v3 saa **uuden Supabase-projektin** Vaiheessa 3. Se on samalla puhdas
> avainrotaatio ja puhdas skeema — vanhoja avaimia ei tarvitse rotatoida lainkaan,
> vanha projekti vain poistetaan.

## 🔴 RED

`.env` on `EldrichHorror-v2`-repon juuressa ja repo on julkinen GitHubissa. Jos tiedostossa
on Supabasen `service_role`-avain, sillä on täysi ohitus rivitason käyttöoikeuksiin (RLS)
ja se on gitin historiassa. Tiedoston poistaminen ei poista sitä historiasta.

Todennettu: `ANALYSIS.md` §3.2, `MASTERPLAN.md` §0.

## 🟢 GREEN

Kaikki v2:ssa käytetyt tunnisteet on mitätöity, eikä yksikään vanha avain toimi enää.

- [ ] Supabase → Settings → API → `service_role` **ja** `anon` rotatoitu
- [ ] Google Cloud Console → OAuth client secret rotatoitu
- [ ] OpenRouter → API-avain peruutettu
- [ ] Heroku → config vars rotatoitu (tai koko sovellus poistettu — sitä ei enää tarvita)
- [ ] `git rm --cached .env` v2-repossa + `.gitignore`
- [ ] Harkittu v2-repon muuttamista yksityiseksi

## Toteutus

```bash
# Tarkista ensin mitä .env sisältää — älä tulosta arvoja mihinkään jaettuun.
cd C:/Projects/Klitoritari-FinalFantasy/EldrichHorror-v2
git log --oneline -- .env        # milloin se on committoitu
```

Rotaatio tehdään palveluiden omista hallintapaneeleista. Tätä ei voi eikä pidä
automatisoida skriptillä.

## Ei kuulu tähän tikettiin

Historian uudelleenkirjoitus (`git filter-repo`). Se ei ole tarpeen, kun avaimet on
rotatoitu, eikä se poista kopioita, jotka joku on jo kloonannut.

## Lähde

`MASTERPLAN.md` §0 · `ANALYSIS.md` §3.2, §8 kohta 10
