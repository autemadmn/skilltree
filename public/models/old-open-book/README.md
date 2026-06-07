Old open book model

This folder contains the real open-book model used by the orb interior gateway.

- `old-open-book.fbx` is the current runtime model.
- `old-open-book.obj` is kept as a source fallback.
- `textures/` contains web-friendly texture names used by the loader URL redirects.
- `source/` keeps the original model files and original texture folder.

If Blender or another converter is available later, export the FBX as:

`public/models/old-open-book/old-open-book.glb`

Then update `src/components/skill-tree/OpenBookModel.tsx` to load the GLB with `useGLTF`.
