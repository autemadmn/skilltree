# Neural Skill Tree

A local React, TypeScript, Vite, React Three Fiber, Zustand, and Framer Motion app for a personal 3D knowledge universe.

## Run locally

```bash
npm install
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

Tree data, documents, notes, and settings are persisted in `localStorage`. Use Settings to reset to the blank starter universe, export JSON, or import a saved archive.
