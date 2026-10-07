# Folding paper assets for Opus

Created from the exact NETS in src/solidLessonMath.js, using existing mustard/teal paper materials and cream reverse material. No generated approximation of the mathematical net. All selected assets live under public/folding-paper-kit-v1.

## Files

- prism: five faces, each with independent front/back self-contained transparent SVG; five separate glue tabs; crease overlay.
- pyramid: four faces, each with independent front/back self-contained transparent SVG; three separate glue tabs; crease overlay.
- assets.json: face polygons in shared source coordinates, root face, parent/child hinges, ordered rotation axes, target angles, closed 3D vertices, tabs and counts.
- fold-math.js: reference Rodrigues rotation and hierarchical foldPoint function. Progress 0 is flat, 1 closed. Child rotations apply before parent rotations.
- geometry-checks.json: closed vertex/edge checks; every closed edge is shared by exactly two mathematical faces.
- index.html: scrubbed folding geometry preview, flat net, half fold and closed poses. This is an asset verification preview, not yet the live lesson component or a production animation.

## Geometry conventions

All face SVG viewBoxes retain source-net coordinates with two units of transparent margin. Do not center each file independently and lose its relation to the shared net. Build one local mesh per polygon, attaching child transform groups to the exact shared hinge edge. Map the front/back textures to each face. Slight physical paper thickness and code shadows can be added at runtime.

Prism root face 1: cap hinges +90 and -90 degrees; side-wall hinges +120 degrees. Triangle sides are 60, prism length 100. Pyramid root face 0: each outside triangle folds +109.471220634 degrees around its ordered shared edge. This is the exterior turn; do not replace it with the interior dihedral angle or 90 degrees. Order of axis endpoints matters.

Closed prism has 5 faces, 9 edges, 6 vertices; closed triangular pyramid has 4 faces, 6 edges, 4 vertices. Glue tabs are excluded from these counts. Tabs are separate art attached to their owner face; animate their own creases only after the main faces fold. Check clearance at intermediate states and choreograph the assembly order rather than assuming simultaneous folding cannot collide.

## Implement next

Use these materials/geometry to build an articulated 3D papercraft in SolidLessons and the subject cover. Keep the source diagrams, populations, questions, progress keys and math gates intact. Add Fold, Unfold, Pause, Replay and a slider, with interruptible motion and reduced-motion still poses. Keep faces visibly identifiable between net and solid. Preserve triangle/rectangle counting; tabs must not become extra selectable faces.

The current preview validates closure and face counts, but does not certify physical collision clearance, lighting, paper thickness, production animation choreography or lesson integration. Those remain Opus implementation work.

Rebuild files with node tools/create-folding-kit.mjs from the main app folder. This regenerates asset data and face SVGs; preview and handoff are separate files. No existing math lesson or asset was overwritten.
