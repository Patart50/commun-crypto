# Journal des décisions — commun-crypto

Chaque décision est numérotée et ne se réécrit pas : on en ajoute une nouvelle qui remplace l'ancienne. Statut : ✅ actée · ⚠️ à vérifier · 🔁 remplacée. Dans les échanges entre projets, préfixer : « commun D-003 ».

## D-001 ✅ Paquet commun en dépendance git épinglée par tag
Le code copié dans pmpa-crypto, dca-crypto et renfort-crypto est extrait dans `Patart50/commun-crypto` (AGPL-3.0), avant le premier code de carnet-crypto (carnet D-010, choix d'Arnaud, 5 oct. 2026). Chaque outil le déclare en dépendance git épinglée sur un tag : `"commun-crypto": "github:Patart50/commun-crypto#v1.0.0"`. Pas de registre npm (compte, jeton de publication, surface d'attaque), pas de sous-module (pénible en CI et pour les contributeurs), pas de monorepo (casserait les dépôts et leurs sites). Le lockfile fixe le commit exact. Passage à npm possible plus tard sans changer les imports.

## D-002 ✅ Sources livrées sans étape de build
Le paquet livre ses sources TypeScript et Svelte ; Vite les compile dans chaque outil (même stack partout). Une seule exception, D-005.

## D-003 ✅ Contenu de la v1.0
`money` (pmpa), `csv` (pmpa), `format` (dca, plus `amount` pour les devises non ISO comme USDT), `parse` (renfort D-012), `storage` (dca, préfixe paramétré), `binance` (pmpa et renfort : table des cours, chemins de conversion en euros, arrondi), `support` (pmpa D-055), `theme` et `theme.css` (pmpa, séries de dca D-014), `renfort` (formules de renfort-crypto), composants `Support.svelte` (texte d'introduction en propriété `intro`) et `ThemeToggle.svelte` (découplé de l'état de l'outil), plugin de service worker. Restent dans chaque outil : moteurs métier, écrans, état, bougies historiques (minute pour pmpa, jour pour dca).

## D-004 ✅ Source unique des adresses de don
`src/support.ts` d'ici devient la seule source des adresses et de l'auteur ; remplace la règle « modification dans pmpa puis recopie » (pmpa D-055, dca D-021). Un changement d'adresse se fait ici, puis chaque outil monte de version. Le test de checksum (bech32, format EVM) tourne dans la CI du paquet.

## D-005 ✅ Plugin de service worker en JavaScript
La configuration de Vite est chargée par Node, qui ne retire pas les types TypeScript des fichiers situés dans node_modules. Le plugin est donc écrit en JavaScript (`// @ts-check`, déclaration `.d.ts` à côté). Le nom de l'outil, passé en option, préfixe les caches.

## D-006 ✅ Chemins de conversion en euros : ceux de pmpa
Les chemins sont écrits une fois, en générateur (`eurRoute`), utilisable avec une table déjà chargée (`priceEur`) ou des cours obtenus à la demande (`priceEurAsync`). Ordre de pmpa D-026 : EUR ; USD → 1 ÷ EURUSDT ; XEUR ; XUSDT ÷ EURUSDT ; XUSDC × USDCUSDT ÷ EURUSDT ; XBTC × BTCEUR. Écart minime avec l'ancienne copie de renfort pour l'USD (paire directe essayée avant), sans effet pratique.

## D-007 ✅ Versions
Semver. Ajout compatible → mineure ; changement d'API → majeure. Les tags sont posés par Arnaud. Chaque outil monte de version par une PR, sans être entraîné malgré lui. Le Short des formules de renfort, nécessaire à carnet-crypto, arrivera dans une version mineure avec ses tests.
