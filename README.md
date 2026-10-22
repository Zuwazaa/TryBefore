# TryBefore

Interactive room designer: plan a room to scale, move furniture, check that it fits, compare layouts and decide before you buy.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run server     # optional API proxy on :8787 (see below)
```

## What works without any external service

- Landing page, before/after slider, example rooms (illustrations, not photos)
- Room creation from dimensions, photo upload (validated, resized) or camera capture
- Konva 2D editor: drag, rotate, resize, numeric edit, duplicate, delete, grid snapping, zoom/pan, undo/redo
- Real geometry checks: boundary, overlap (SAT), door clearance, minimum passage; open-floor area computed from the layout
- Five layout strategies that actually re-arrange furniture, saved layouts, side-by-side compare
- Rule-based design suggestions (clearly labelled), budget planner with user-entered estimates
- Projects in LocalStorage: create, rename, duplicate, delete, JSON export/import, PNG/SVG plan export

## What needs configuration

`server/server.js` keeps keys on the server. Set environment variables, then run `npm run server` next to `npm run dev`:

| Feature | Variables |
| --- | --- |
| AI design suggestions | `AI_DESIGN_URL`, `AI_DESIGN_KEY` |
| Photo visualisation | `IMAGE_EDIT_URL`, `IMAGE_EDIT_KEY` |

The upstream URL receives the JSON the browser sends to `/api/design` or `/api/visualize` and must answer with:

- design: `{ summary, placement: [{id,x,y,rotation}], style: {name,palette,tips}, additions: [{type,reason}], constraints }`
- visualize: `{ image: "data:image/..." }`

Responses are validated in `src/lib/recommend.js` before they touch the plan. Without a backend the app falls back to rule-based suggestions and clearly labelled sample visualisations.

## Limitations

- Room pictures are vector illustrations. Photo-to-photo transformation needs an image service.
- Layout ideas are heuristic: they are checked against the geometry rules, not proven optimal.
- Storage is per browser (about 5 MB), so large photos are downscaled.
