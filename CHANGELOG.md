# Notes de version

## 1.0.0 — 5 octobre 2026

Première version : extraction du code commun de pmpa-crypto, dca-crypto et renfort-crypto (commun D-001 à D-007).

- `money` : arithmétique décimale exacte (decimal.js).
- `csv` : lecteur et écrivain CSV (RFC 4180, séparateur détecté).
- `format` : formatage à la française, montants dans une devise de cotation (EUR, USDT, USDC…).
- `parse` : nombres saisis à la française ou à l'anglaise.
- `storage` : stockage local préfixé, repli en mémoire.
- `binance` : liste des cours (deux hôtes), chemins de conversion en euros, arrondi des cours.
- `support` : auteur, GitHub Sponsors, adresses de don vérifiées par test.
- `theme`, `theme.css`, `ThemeToggle.svelte` : thème auto, clair, sombre.
- `Support.svelte` : fenêtre de soutien, QR codes générés dans le navigateur.
- `renfort` : formules de renfort (montant pour un PMP cible, prix limite, exposition, scénarios).
- `vite` : plugin de service worker hors ligne.
