# front-signature

> Application web développée avec [Next.js](https://nextjs.org), TypeScript et TailwindCSS.

## Description du projet

front-signature est une application web moderne dédiée à la signature électronique de documents PDF existants. Elle offre une solution professionnelle pour la gestion et l'apposition de signatures sur vos fichiers PDF, en s'appuyant sur une stack technologique performante :

- **Next.js** (React, SSR, SSG)
- **TypeScript** (typage statique)
- **TailwindCSS** (framework utilitaire pour le style)
- **Vercel** (déploiement recommandé)

## Prérequis

- Node.js >= 18
- npm, yarn, pnpm ou bun

## Installation

Clonez le dépôt puis installez les dépendances :

```bash
# Cloner le projet
git clone <url-du-repo>
cd front-signature

# Installer les dépendances
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

## Démarrer le serveur de développement

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir l'application.

## Structure du projet

- `app/` : pages et composants principaux
- `public/` : fichiers statiques (images, icônes)
- `globals.css` : styles globaux
- `next.config.ts` : configuration Next.js
- `tailwind.config.js` : configuration de TailwindCSS

## Modifier la page principale

Éditez le fichier `app/page.tsx` pour personnaliser la page d'accueil. Les modifications sont automatiquement prises en compte.

## Déploiement

Le déploiement le plus simple se fait sur [Vercel](https://vercel.com/new).
Documentation officielle :

- [Déployer une app Next.js sur Vercel](https://nextjs.org/docs/app/building-your-application/deploying)

## Ressources utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Tutoriel interactif Next.js](https://nextjs.org/learn)
- [Dépôt GitHub Next.js](https://github.com/vercel/next.js)
- [Documentation TailwindCSS](https://tailwindcss.com/docs)

## Auteur

NGASSAKI Chadrack Sidney

---

Ce projet est sous licence MIT. N'hésitez pas à contribuer !
