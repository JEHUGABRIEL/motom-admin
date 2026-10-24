# MOTOM — Back-office

Espace d'administration de l'agence MOTOM (biens, véhicules, services, FAQ, messages,
avis, comptes, journal d'audit). Application React/Vite **séparée du site public**.

| Application | Dépôt | URL |
| ----------- | ----- | --- |
| Site public + API | `JEHUGABRIEL/motom` | https://motom-rca.vercel.app |
| Back-office | ce dépôt | https://motom-admin.vercel.app |

## Architecture

Le BO est un SPA pur : il ne contient aucune fonction serverless et ne stocke aucun
secret. Tous les appels `/api/...` sont relayés par une **réécriture Vercel** vers
l'API du site public (`vercel.json`, source `/api/:path*`). Du point de vue du
navigateur, l'API est donc sur la même origine que le BO : le cookie de session
`HttpOnly` reste un cookie first-party et fonctionne sur tous les navigateurs.

## Routes

- `/` — connexion, puis tableau de bord (l'état de session est lu via `/api/auth`)
- `/invite` — activation d'un compte invité (`?token=...`)
- `/reset` — définition d'un nouveau mot de passe (`?token=...`)

## Développement

```bash
npm install
npm run dev     # http://localhost:5173
```

En développement, Vite relaie `/api` vers le site public (voir `server.proxy` dans
`vite.config.ts`). Pour viser un autre déploiement :

```bash
VITE_API_TARGET=https://mon-preview.vercel.app npm run dev
```

## Déploiement (Vercel)

1. Créer le dépôt GitHub `motom-admin` puis y pousser ce dossier.
2. Sur Vercel : **Add New → Project**, importer le dépôt, framework *Vite*.
3. Vérifier que le domaine `motom-admin.vercel.app` est bien attribué au projet.
4. Côté dépôt du site, définir `ADMIN_URL=https://motom-admin.vercel.app` pour que les
   e-mails d'invitation et de réinitialisation pointent vers le BO.

Si l'URL du site change, mettre à jour la destination de la réécriture `/api/:path*`
dans `vercel.json` (et `VITE_SITE_URL` pour le lien « Retour au site »).

Aucune variable d'environnement n'est requise sur ce projet Vercel.
