# BRDC-ECON-002 — Kadonnut pouch, ja debug-täyttö

| | |
|---|---|
| **Vaihe** | 2.6 |
| **Effort** | S |
| **Riippuvuudet** | BRDC-ECON-001 |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infiniten testiajon huomio 2026-09-02 (v0.4.5) |

## 🔴 RED

Infiniten pouch ja kerätyt resurssit katosivat kesken testin — HUD näytti tyhjää.

**Syy:** `ResourcePool` kasvoi yhdeksään kenttään (`aaffff6`), mutta `SCHEMA_VERSION`ia ei
nostettu eikä migraatiota rekisteröity — ja `pouch.ts`:n rakenteen tunnistus poistettiin
version-portin myötä. Vanha viisikenttäinen pouch luetaan sellaisenaan, `undefined + n`
tekee `NaN`:in, ja `NaN`-pool näyttää ruudulla tyhjältä. Data ei "kadonnut" — se muuttui
lukukelvottomaksi.

## 🟢 GREEN

- [x] **`normalizePool`** (`data/pouch.ts`): jokainen `read` normalisoi — puuttuva tai
      ei-äärellinen kenttä → 0, kaikki yhdeksän avainta paikalla. Itseparantuu seuraavalla
      luvulla, ei wipeä. Testattu (`data/pouch.test.ts`): viisikenttäinen ja NaN-pool.
- [x] **Hampurilaisvalikon debug-nappi** "Debug · +200 every resource" — vain
      `import.meta.env.DEV`-buildissa. `repository.debugGrant(now)` → `grantAll` täyttää
      jokaisen resurssin +200 (storage-kattoon asti), pouch päivittyy heti ruudulle.

## Ei tässä

- `SCHEMA_VERSION`in nosto + migraatio — `normalizePool` tekee sen tarpeettomaksi ja on
  riskittömämpi. Voidaan lisätä myöhemmin jos halutaan siivota vanhat avaimet kokonaan.
