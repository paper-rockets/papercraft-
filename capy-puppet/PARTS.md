# Capybara puppet parts

Master: `capy-design.png`, approved round capybara with small open dot eyes. Top-left light. Previous master: `capy-design-old-1.png`. Sheets are transparent and uncut.

## Scale and fidelity

Parts sheets were normalized as whole sheets to the master body silhouette widths: front 567 px, sitting side 549 px, standing side 714 px. Special poses use roughly the master's 603 px sitting height. Swaps are normalized to small facial details. Preserve native image scale during later extraction; do not enlarge every isolated piece to a common bounding box.

These are reference-conditioned generated parts, not pixel-exact extractions. Visible contours, texture and some relative proportions differ slightly from the master. Final pivot coordinates and exact registration must be established after extraction and an assembled overlay check. The pin locations below are approximate, not a tested rig. No app code or rig has been created.

## Attachment conventions

Coordinates are fractions of the body+head bounding box: x=0 left, x=1 right, y=0 top, y=1 bottom. Left/right on the front sheet mean viewer-left/viewer-right. Near/far describe the visible/hidden side on left-facing puppets. Pins belong at the centre of the rounded tuck tab, inset from its edge. Hide root tabs behind the torso; draw the visible limb portion over the torso where necessary. Do not punch the outer visible nub.

Fixed patches use adhesive/registration anchors, not rotating pins. Facial swaps overlay the existing eyes or mouth; cover the default expression with matching tan or muzzle-colour paper before placing a different expression. The default muzzle includes its smile and nostrils; they are not separate parts on the base sheets.

## Front sitting — capy-front-parts.png

| Piece | Attaches to | Approximate pin/anchor | Layer |
|---|---|---|---|
| Body+head, one bean piece with dot eyes | Root | Body centre (0.50,0.55) | Main base |
| Left ear | Body top | (0.25,0.04), centre of rounded root tab | Root behind body; ear above silhouette |
| Right ear | Body top | (0.75,0.04) | Same |
| Muzzle, nostrils and default smile | Face | Fixed centre (0.50,0.34) | Above body, below facial swaps |
| Cream belly patch | Torso | Fixed centre (0.50,0.73) | Above body, behind paws and feet |
| Left paw | Torso | (0.25,0.61), tan root tab | Root hidden; visible paw above belly |
| Right paw | Torso | (0.75,0.61) | Same |
| Left foot | Lower torso | (0.24,0.91), rounded upper tab | Root hidden; visible foot above body/belly |
| Right foot | Lower torso | (0.76,0.91) | Same |
| Left cheek | Face | Fixed (0.20,0.37) | Above body |
| Right cheek | Face | Fixed (0.80,0.37) | Above body |

Sheet layout: body on left; ears across upper middle; muzzle upper right-middle; cheeks upper far right; belly below ears; paws above feet on right. Paired pieces read viewer-left then viewer-right.

## Left-facing sitting — capy-side-parts.png

| Piece | Attaches to | Approximate pin/anchor | Layer |
|---|---|---|---|
| Body+head with one dot eye | Root | (0.55,0.56) | Main base |
| Near ear | Head top | (0.64,0.08) | Root behind body; visible near ear foremost |
| Far ear | Head top | (0.54,0.03) | Behind near ear and body |
| Muzzle with nostril/smile | Snout | Fixed (0.12,0.34) | Above body |
| Cream belly patch | Front torso | Fixed (0.33,0.73) | Above torso, behind paws/feet |
| Near paw | Chest | (0.42,0.60) | Visible portion above belly |
| Far paw | Chest | (0.22,0.60) | Behind near paw |
| Near foot | Lower torso | (0.45,0.91) | Above body/belly |
| Far foot | Lower torso | (0.18,0.91) | Behind near foot |
| Pink cheek | Face | Fixed (0.47,0.37) | Above body |

Sheet layout: body left; two ears above cream patch, near then far; muzzle and cheek upper right; paws across middle right; feet below paws. Assign the larger visible pawn/foot to the near side.

## Left-facing standing — capy-stand-parts.png

| Piece | Attaches to | Approximate pin/anchor | Layer |
|---|---|---|---|
| Body+head loaf with dot eye | Root | (0.55,0.50) | Main base |
| Near ear | Head top | (0.45,0.07) | Visible near ear above far ear |
| Far ear | Head top | (0.37,0.02) | Behind body/near ear |
| Muzzle with nostril/smile | Snout | Fixed (0.10,0.38) | Above body |
| Cream belly underside | Torso underside | Fixed (0.53,0.91) | Behind torso edge, above far legs |
| Near front leg | Front underside | (0.34,0.90), rounded tab | Root behind body; lower leg visible |
| Near rear leg | Rear underside | (0.87,0.90) | Same |
| Far front leg, darker | Front underside | (0.25,0.87) | Behind body and near front leg |
| Far rear leg, darker | Rear underside | (0.76,0.87) | Behind body and near rear leg |
| Pink cheek | Face | Fixed (0.34,0.42) | Above body |

Sheet layout: body left; ears above right; muzzle and cheek upper right; cream underside middle right; four legs bottom right. Bottom-row first two are normal brown near legs; last two darker pieces are far legs. Use the pair's front member nearer the snout and rear member nearer the rump.

## Expression swaps — capy-swaps.png

Top two rows are front expressions, bottom two rows side expressions. Eye row runs left to right: calm closed, open dots, wide surprised, happy squint, sleepy half-closed. Front eyes are paired; side eyes single. Mouth row runs left to right: small smile, closed line, small open, big open, o shape, big happy grin.

| Piece/set | Attaches to | Anchor | Layer |
|---|---|---|---|
| Front calm-closed eye pair | Front face | Same centres as body dot eyes | Above tan cover patches |
| Front open-dot eye pair | Front face | Same centres as body dot eyes | Above body |
| Front wide-surprised eye pair | Front face | Same centres as body dot eyes | Above tan cover patches |
| Front happy-squint eye pair | Front face | Same centres as body dot eyes | Above tan cover patches |
| Front sleepy-half-closed eye pair | Front face | Same centres as body dot eyes | Lid above dark eye |
| Side calm-closed eye | Side face | Same centre as side dot eye | Above tan cover patch |
| Side open-dot eye | Side face | Same centre as side dot eye | Above body |
| Side wide-surprised eye | Side face | Same centre as side dot eye | Above tan cover patch |
| Side happy-squint eye | Side face | Same centre as side dot eye | Above tan cover patch |
| Side sleepy-half-closed eye | Side face | Same centre as side dot eye | Lid above dark eye |
| Front small smile | Front muzzle | Default smile centre | Above muzzle-colour cover |
| Front closed line | Front muzzle | Default smile centre | Same |
| Front small open | Front muzzle | Default smile centre | Same |
| Front big open | Front muzzle | Default smile centre | Same |
| Front o shape | Front muzzle | Default smile centre | Same |
| Front big happy grin | Front muzzle | Default smile centre | Same; cream inset above dark mouth |
| Side small smile | Side muzzle | Default smile centre | Above muzzle-colour cover |
| Side closed line | Side muzzle | Default smile centre | Same |
| Side small open | Side muzzle | Default smile centre | Same |
| Side big open | Side muzzle | Default smile centre | Same |
| Side o shape | Side muzzle | Default smile centre | Same |
| Side big happy grin | Side muzzle | Default smile centre | Same; cream inset above dark mouth |

No rotating pins for face swaps; align their centres to the original feature. Side swaps serve both sitting and standing views. Fit-check swaps against muzzle before final export; expressions are generated art rather than mechanically registered masks.

## Special full poses — capy-poses.png

Six assembled poses in reading order: waving one paw; cheering both paws up; holding a blank cream number card; little jump; asleep; thinking with paw on chin. These are full pose assets, not additional exploded parts. Raised limbs retain paper overlap construction. The card is above belly and behind holding paws. Thinking paw sits above muzzle/chin. Sleeping eyes cover default dots. Jump has tucked lifted feet with no drawn ground.

## Practical layer order

Back to front: far ears and far limbs; body+head; cream belly; near ear visible surfaces; muzzle; cheeks; near paws and feet; facial expressions. Raised paws may need to be in front of muzzle; card sits behind holding paws. Keep light and short shadows pointing down-right. Rounded attachment tabs are hidden overlap allowance, not visible decoration.
