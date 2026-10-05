# commun-crypto

Code commun des outils crypto open source, 100 % locaux et en français, d'[Arnaud (Patart50)](https://github.com/Patart50) :
[pmpa-crypto](https://github.com/Patart50/pmpa-crypto), [dca-crypto](https://github.com/Patart50/dca-crypto),
[renfort-crypto](https://github.com/Patart50/renfort-crypto) et carnet-crypto.

Une seule source pour ce que chaque outil partage : calcul décimal exact, CSV, prix Binance, formatage, stockage local, thème,
service worker hors ligne, auteur et soutien. Choix et conventions : [docs/DECISIONS.md](docs/DECISIONS.md).

## Installation

Dans un outil du programme (dépendance git épinglée par tag, commun D-001) :

```sh
npm install github:Patart50/commun-crypto#v1.0.0
```

Le paquet livre ses sources TypeScript et Svelte : l'outil doit utiliser Vite, `@sveltejs/vite-plugin-svelte` et Svelte 5.

## Modules

| Import | Contenu |
|---|---|
| `commun-crypto/money` | `D`, `dec`, `ZERO`, `toCents`, `toEuros` : jamais de `number` pour un montant |
| `commun-crypto/parse` | `parseNumber` : « 1 234,56 », « 1,234.56 », « 0,1 % » |
| `commun-crypto/format` | `eur`, `eurSigned`, `eurPrice`, `qty`, `pct`, `amount(d, 'USDT')`, `dateFr`, `duration`… |
| `commun-crypto/csv` | `parseCsv`, `detectDelimiter`, `toCsv`, `csvCell` |
| `commun-crypto/storage` | `openLocalStore('outil-crypto:')` : lecture, écriture JSON, repli en mémoire |
| `commun-crypto/binance` | `fetchTicker`, `loadTicker`, `priceEur`, `priceEurAsync`, `eurRoute`, `roundPrice` |
| `commun-crypto/support` | `AUTHOR`, `SPONSORS_URL`, `DONATION_ADDRESSES` |
| `commun-crypto/theme` | `Theme`, `applyTheme`, `nextTheme`, `isTheme` |
| `commun-crypto/renfort` | formules de renfort-crypto |
| `commun-crypto/theme.css` | thème commun, polices locales |
| `commun-crypto/ui/Support.svelte` | `<Support intro="…" />` |
| `commun-crypto/ui/ThemeToggle.svelte` | `<ThemeToggle theme={…} onchange={…} />` |
| `commun-crypto/vite` | `offlineServiceWorker({ name: 'outil-crypto' })` |

## Règles

- **Réseau** : `binance` ne doit être appelé qu'après consentement explicite de l'utilisateur ; il n'envoie que des noms de paires.
- **Adresses de don** : elles ne se modifient qu'ici (`src/support.ts`), jamais à la main dans un outil. Le test de checksum fait échouer la CI à la moindre faute.
- **Versions** : semver, tags posés par le mainteneur. Un outil monte de version par une PR.

## Développement

```sh
npm install
npm run check   # svelte-check, types
npm test        # Vitest
```

## Auteur et soutien

Créé par [Arnaud (Patart50)](https://github.com/Patart50). Les outils sont gratuits, sans publicité ni compte.
Pour soutenir le programme : [GitHub Sponsors](https://github.com/sponsors/Patart50), ou en crypto depuis la fenêtre « Soutenir le projet » de chaque outil.

## Licence

[AGPL-3.0](LICENSE).
