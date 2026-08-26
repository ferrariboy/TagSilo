# TagSilo Landing by Manus V1.1

This folder contains the restored standalone TagSilo landing-page source exported from the Manus project state corresponding to checkpoint `172aed15` (rollback version `22c45a35`). It uses the official TagSilo brand kit, including the neon-lime palette, Plus Jakarta Sans typography, JetBrains Mono labels, and the repository logo assets.

The root-level `index.html`, `styles.css`, `app.js`, and `media/` directories form a self-contained static HTML5 package. Double-click `index.html` to open it directly from `file:///`—no server, Vite build, React runtime, or ES-module import is required. The `client/`, `server/`, and configuration files remain here as the original editable source project.

The source is a Vite/React static site. Install dependencies with `pnpm install`, run the local environment with `pnpm dev`, and create a production build with `pnpm build`.

The static package uses Tailwind CSS through its CDN and Google Fonts through link tags; the remaining visual media is stored locally in `./media/`. The original source project retains its managed asset references; replace those URLs with your own hosted assets if you rebuild it for a different external host.
