# TagSilo Landing by Manus V1.1

This folder contains the restored standalone TagSilo landing-page source exported from the Manus project state corresponding to checkpoint `172aed15` (rollback version `22c45a35`). It uses the official TagSilo brand kit, including the neon-lime palette, Plus Jakarta Sans typography, JetBrains Mono labels, and the repository logo assets.

The root-level `index.html`, `assets/`, and `media/` directories form a self-contained compiled static package. They can be opened locally after downloading this folder, and the repository workflow deploys the same package to GitHub Pages. The `client/`, `server/`, and configuration files remain here as the editable source project.

The source is a Vite/React static site. Install dependencies with `pnpm install`, run the local environment with `pnpm dev`, and create a production build with `pnpm build`.

The compiled static package includes local media copies, so it does not depend on managed Manus storage. The source project retains its original managed asset references; replace those URLs with your own hosted assets if you rebuild for a different external host.
