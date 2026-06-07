# Neural Skill Tree

A local React, TypeScript, Vite, React Three Fiber, Zustand, and Framer Motion app for a personal 3D knowledge universe.

## Run locally

```bash
npm install
npm run dev
```

## Desktop launcher

`scripts/Start-NeuralSkillTree.ps1` starts the local Vite server on `http://127.0.0.1:5305/` if needed, then opens the app in the default browser. The Windows desktop shortcut can point to this script and use `public/icons/SKDesk.ico` as its icon.

## Desktop app

The project now includes a Tauri desktop shell. This turns the same React/Vite app into a native Windows desktop window using the `SKDesk` icon.

Run the desktop app in development:

```bash
npm run desktop:dev
```

Build the Windows installer:

```bash
npm run build
npm run desktop:build
```

The installer output is generated under:

`src-tauri/target/release/bundle/nsis/`

The normal web workflow still works:

```bash
npm run dev
```

## BookOpen model

The provided archive is expected at:

`C:\Users\mrani\Downloads\msxam6ypo2kg-Book.zip`

This app keeps the original model at:

`public/models/BookOpen/BookOpen.FBX`

It loads the same FBX bytes through this browser-friendlier copy:

`public/models/BookOpen/BookOpen.model`

Some browser/ad-block setups block direct `.FBX` requests, while `FBXLoader` can still parse the file regardless of extension. The current zip contains `BookOpen.FBX` and TGA texture files. If you replace it with a GLB/GLTF version later, update `BOOK_MODEL_PATH` in `src/components/skill-tree/FloatingBookArchive.tsx` and switch the loader from `useFBX` to `useGLTF`.

If the model is missing or cannot load, the app renders a procedural open-book fallback so the Knowledge Chamber entry sequence never crashes.

## Persistence

Tree data, documents, notes, and settings are persisted in `localStorage` for quick local use. Use Settings to reset to the blank starter universe, export JSON, or import a saved archive.

### Portable local vault

For a more reliable local-first workflow, open Settings and use **Portable Local Vault**:

1. Click **Connect Folder**.
2. Choose or create a folder on your computer, for example `Documents/Neural Skill Tree Vault`.
3. The app writes `skilltree-vault.json` into that folder.
4. Copy that folder to move your universe to another computer.
5. On the new computer, run the app, connect the copied folder, and click **Load Vault**.

The vault stores the skill tree, connections, notes, document records, text content, activity, and settings. When the vault is connected, uploaded PDFs are copied into a `documents/` folder beside `skilltree-vault.json`, and the document record stores the portable vault path. The PDF reader is still a polished placeholder that can later be replaced with `react-pdf`/PDF.js for true page rendering.
