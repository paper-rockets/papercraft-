# Papercraft clock kit for Opus

Purpose: replace the mixed rim/plain SVG hands with coordinated separately movable paper parts. Asset generation in progress; assets.json will record inspected dimensions and pivots.

Layer order: face, rim, hour hand, minute hand, second hand, center pin. Numerals and minute ticks are code overlays; position them within the rim opening, using exact polar coordinates. The face is deliberately blank. Do not stretch hands or rotate the entire square file around its canvas center: use each hand pivot in assets.json.

Use 0 degrees for pointing to 12, clockwise rotation. Second angle = seconds*6; minute angle = minutes*6 + seconds*0.1; hour angle = (hours%12)*30 + minutes*0.5 + seconds/120. Source Watch example remains 10:20:05. Preserve all existing watch/play/try gates and saved progress.

Position each hand image so its pivot coincides with the clock center. CSS transform-origin uses the actual asset pixel pivot; hand image width scales by the documented radius, not by the clock diameter. Shadows belong to the wrapper and rotate with the hand. Keep center pin fixed above all hands.

Clock face target: large clear circle, paper rim, no additional oversized background card. At smaller screens twelve numerals and minute marks must remain legible; numerals must never overlap the rim or each other. Align at 12,3,6,9 using exact geometry, not estimated per-file placement.

Interaction: animate time changes and existing hand adjustments, with pointer/keyboard support if the activity requires it. For seconds animation use a continuous underlying angle to avoid a reverse spin at 59 -> 0. Reduced motion should update directly. Keep colors distinct and names accessible. Preserve real hour/minute/second proportions and fractional hour rotation.

Required checks: 12:00:00, 3:00:00, 6:30:00, 10:20:05; portrait and landscape; correct angles, center alignment, digit clearance, alpha transparency, no image loading errors, and original math tests.

These assets are provided for implementation; current TimeLessons.jsx is not yet switched to the new kit.
