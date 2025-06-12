# AUTOBEL

## Objectifs du projet

AUTOBEL est une application web de gestion des demandes de devis (RFQ). Elle s'appuie sur React et TypeScript pour l'interface utilisateur et sur Supabase pour la persistance des données ainsi que l'authentification.

## Arborescence

```
AUTOBEL/
├── README.md
└── project 3/
    ├── index.html
    ├── package.json
    ├── src/
    │   ├── components/
    │   ├── constants/
    │   ├── hooks/
    │   ├── lib/
    │   ├── pages/
    │   └── test/
    └── supabase/
        └── migrations/
```

## Installation des dépendances

Ce projet nécessite Node.js >= 20.

```bash
cd "project 3"
npm install
```

## Avant les tests et le développement

Assurez-vous d'installer les dépendances dans `project 3/` avant d'exécuter `npm run dev` ou `npm test`.

```bash
cd "project 3"
npm install   # ou npm ci
```

## Configuration des variables d'environnement Supabase

Créez un fichier `.env` (ou `.env.local`) à la racine de `project 3` contenant :

```
VITE_SUPABASE_URL=<url fournie par Supabase>
VITE_SUPABASE_ANON_KEY=<clé anonyme>
```

## Lancement et tests

```bash
npm run dev    # démarre le serveur de développement
npm test       # lance la suite de tests Vitest
npm run build  # construit la version de production
```

## Migrations SQL et initialisation de la base

Le dossier `project 3/supabase/migrations` contient les scripts SQL générés par Supabase. Chaque fichier est préfixé par un horodatage afin de garantir leur ordre d'exécution. Pour initialiser une base locale, installez le CLI Supabase puis exécutez :

```bash
supabase db reset
```

Cette commande applique toutes les migrations et prépare la base pour l'application.

## Licence

Ce projet est distribué sous licence MIT. Consultez le fichier [LICENSE](LICENSE)
pour plus de détails.
