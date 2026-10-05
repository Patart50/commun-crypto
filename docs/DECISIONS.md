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
Semver. Ajout compatible → mineure ; changement d'API → majeure. Les tags sont posés par Arnaud. Chaque outil monte de version par une PR, sans être entraîné malgré lui. Le Short des formules de renfort, nécessaire à carnet-crypto, arrive dans une version mineure avec ses tests (D-008).

## D-008 ✅ Formules de renfort en Long et en Short (v1.1)
Pour le simulateur de carnet-crypto (carnet D-008). Une position est vue à travers son prix effectif d'entrée, frais compris : Long P ÷ (1 − f), Short P × (1 − f) (on encaisse moins). Nouveau PMP = (Q·PMP + q·Pe) ÷ (Q + q) dans les deux sens ; quantité pour atteindre Y : q = Q(PMP − Y) ÷ (Y − Pe), cible sous le PMP en Long, au-dessus en Short ; prix limite Y(1 − f) en Long, Y ÷ (1 − f) en Short. Frais de sortie en fraction du montant : break-even PMP ÷ (1 − f_v) en Long, PMP ÷ (1 + f_v) en Short (le rachat coûte plus cher). Choc défavorable : baisse en Long, hausse en Short. Les fonctions en montant de la 1.0 restent inchangées ; un test vérifie qu'en Long les deux approches coïncident. Frais nuls = PMP brut (carnet D-003).

## D-009 ✅ URL HTTPS dans package.json
Les outils déclarent `"commun-crypto": "git+https://github.com/Patart50/commun-crypto.git#vX.Y.Z"`. npm inscrit quand même `git+ssh` dans le lockfile, mais télécharge l'archive en HTTPS (vérifié sans clé SSH, en local et sur la CI de renfort-crypto).

## D-010 ✅ Cours historiques à la minute (v1.2)
Pour le bouton « Cours à cette date » de carnet-crypto, et la future migration de pmpa-crypto : `MinuteKlines` reprend la lecture des bougies d'une minute de pmpa (D-026, D-028) : clôture de la bougie contenant l'instant, au-delà d'une heure d'écart la bougie est ignorée, liste des paires chargée une fois par la liste publique des cours (une paire inconnue n'est jamais interrogée), cache par paire et minute, compteur d'échecs. L'instant est passé en UTC ; `parisToUtcMs` convertit une heure de Paris (pmpa). Ajout compatible.

