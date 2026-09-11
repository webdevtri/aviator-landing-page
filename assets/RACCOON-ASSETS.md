# Raccoon assets

Created with the built-in image-generation tool from the user-supplied `C:/Users/User/Downloads/Raccoon_Banner_3.png`. Transparent PNGs were finalized with Magnific background removal after the user explicitly approved that tool. The image generator returned opaque checkerboards, so those drafts are retained as `*-source.png` files.

- `raccoon-thumbs-up.png`: left-side commander, 1122 × 1402 RGBA.
- `raccoon-pilot-cartoon.png`: current 2D cartoon raccoon in a red airplane, 1536 × 1024 RGBA.
- `raccoon-pilot-plane.png`: earlier 3D-rendered version, retained but no longer used in the game.

The commander is a 3D-rendered bitmap placed below the desktop headline and beside the text on mobile. It idles, responds to takeoff, and celebrates the completed flight. The current pilot is a 2D cartoon bitmap animated with Canvas, with separately drawn spinning blue-and-gold propeller blades behind its nose hub. The pilot follows the existing flight state with responsive sizing, banking and exhaust. Decorative motion respects the reduced-motion preference.

## Generation prompts

### raccoon-commander

Use case: stylized-concept. Create one high-quality 3D-rendered character cutout for a KIXO9 Aviator landing page. Reference image is identity and costume reference: preserve this SAME mature confident raccoon pilot, detailed grey/brown fur, black face mask, amber eyes, leather flight cap, brass goggles with reflective BLUE lenses, cobalt-blue leather aviator jacket with cream shearling collar and gold aviation patches. Repose him giving one very clear raised THUMBS UP with a brown leather-gloved paw, smiling knowingly as if authorizing takeoff, other paw resting on his hip. Waist-up portrait, three-quarter front view facing slightly right, full ears and entire raised hand inside frame with generous padding. Premium cinematic 3D game character, finely groomed fur, tactile leather, soft studio key and blue rim light. Recognizably the same adult raccoon, not a baby mascot. ISOLATED on a genuinely transparent RGBA background, clean alpha edges, no floor, no plane, no coins/chips, no text, no watermark. Single coherent character only, suitable for gentle CSS bobbing and tilt animation; not a sprite sheet.

### raccoon-pilot-plane

Use case: stylized-concept. Create one production-ready 3D game SPRITE on a genuinely transparent RGBA background. Use reference as exact identity/costume: same mature raccoon pilot, amber eyes, grey/brown fur, black face mask, brown leather flight cap, brass goggles with reflective blue lenses, cobalt-blue shearling aviator jacket with gold aviation patches. Show this raccoon actually seated in the OPEN COCKPIT of a compact RED Aviator-style single-engine propeller airplane, paws on flight controls, looking confidently ahead, recognizable large head/upper torso above cockpit. Plane travels toward RIGHT, nearly side-on with slight front three-quarter view, wings showing dimension, level fuselage, tail LEFT and propeller/nose RIGHT. Premium playful 3D game figure with detailed fur, glossy red aircraft paint and polished metal; raccoon head large enough to read at 180px sprite width. Entire airplane including all wings/tail/propeller inside the canvas, tight centered horizontal composition with 8% transparent padding. No ground shadow, environment, text, logos, clouds, coins, chips or additional characters. Single isolated complete plane-with-pilot sprite, no multi-panel sheet, no motion streaks. Transparent background mandatory.

## Transparency pass

All three generated designs were processed into true RGBA cutouts with Magnific's background-removal tool, as approved by the user. No character identity changes were requested in that pass.

### raccoon-pilot-cartoon

Generated with the built-in image-generation tool, referencing the original user-supplied raccoon. Final background removal used Magnific.

Create a production 2D CARTOON game sprite using the supplied raccoon reference for identity only. One cheerful raccoon pilot seated in an open cockpit of a compact red airplane, traveling toward RIGHT, tail on LEFT. Preserve recognizability: gray/brown raccoon with black eye mask, cream muzzle, brown aviator cap, big blue goggles, cobalt blue flight jacket with cream collar, paws gripping flight controls. Clearly HAND-DRAWN 2D cartoon: confident thick dark ink outlines, simple flat colors, two-tone cel shading, clean expressive face, large readable head. NO photorealism, NO 3D rendering, NO realistic fur or metal textures. Red fuselage and wings with simple golden yellow trim. Almost strict side profile with a small amount of top wing visible, level fuselage. Whole airplane and pilot in frame, uncropped, centered horizontally. IMPORTANT: airplane nose has ONLY a small round yellow propeller hub on the RIGHT at about 88 percent of image width and 57 percent image height. NO PROPELLER BLADES at all, no propeller blur or motion streaks: actual spinning blades will be animated separately in the game. Isolated subject, transparent background if possible; otherwise perfectly flat pure WHITE background, NEVER checkerboard, no shadows, no environment, no coins or text. Landscape 3:2 composition with compact silhouette and 8 percent padding.
