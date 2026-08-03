# FunnyFy — Style prompts reference

**Source of truth:** `api/_utils/styles-config.ts` → `LEGACY_STYLES`

Regenerate this file after prompt changes:

```bash
node scripts/generate-prompts-md.js
```

**Last generated:** 2026-07-31 · **110 enabled** · **1 disabled** in LEGACY_STYLES

Prompts are server-side only — the mobile app never bundles them. When adding a style, copy/adapt a prompt here, then add it to `LEGACY_STYLES` and deploy staging.

See also: `MD/STYLES.md`, `MD/ADDING_MORE_STYLES_GUIDE.md`.

---

## Models

| Constant | Replicate model |
|----------|-----------------|
| `DEFAULT_MODEL` | `black-forest-labs/flux-kontext-pro` |
| `NANO_BANANA` | `google/nano-banana` |
| `NANO_BANANA_2` | `google/nano-banana-2` |
| `SEEDREAM_4` | `bytedance/seedream-4` |
| `SEEDREAM_4_5` | `bytedance/seedream-4.5` |

---

## Enabled prompts

### Moods & Moments

#### `monday-mood` — Monday

- **Category:** moods-moments
- **Model:** SEEDREAM_4_5 · NANO_BANANA_2 · NANO_BANANA (random)
- **Description:** Humorous Monday Mood cartoon — exhausted, relatable, identity preserved

```
Preserve the uploaded person's identity exactly. Create a humorous Monday Mood cartoon illustration. The person is exhausted, slouching with a varied mood and expressions Add random scenarios in relation to the illustration. Warm painterly comic illustration, expressive brushwork, clean composition, humorous but relatable, identity preserved..
```

#### `friday-feeling` — Friday

- **Category:** moods-moments
- **Model:** NANO_BANANA_2 · NANO_BANANA (random)
- **Description:** Humorous Friday Feeling illustration — excited, relaxed, full of energy

```
Preserve the uploaded person's identity exactly. Create a humorous Friday Feeling illustration. The person is excited, relaxed, smiling, and full of energy with varied moods and expressions. Add random scenarios in relation to the illustration. Warm painterly comic illustration, expressive brushwork, clean composition, humorous but relatable, identity preserved.
```

#### `payday` — Payday

- **Category:** moods-moments
- **Model:** NANO_BANANA
- **Description:** Payday glow-up caricature — flush, smug, and briefly unstoppable

```
Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Payday. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating a smug, flush, briefly-unstoppable grin. Scene: playful payday moment — bank notification vibe, shopping bags or coffee treat nearby, soft glamorous lighting. Mood: temporary wealth swagger, light comedy. Style: polished humorous editorial caricature. Full-bleed. No readable text, logos, watermarks, or borders.
```

#### `end-of-month` — End of Month

- **Category:** moods-moments
- **Model:** NANO_BANANA
- **Description:** Broke-but-surviving end-of-month caricature — empty wallet energy

```
Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as End of Month. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating a broke-but-surviving, empty-wallet expression. Scene: end-of-month realism — sparse fridge vibes, empty wallet or nearly empty card, ramen or toast nearby, soft comic lighting. Mood: relatable financial humor, not harsh. Style: polished humorous editorial caricature. Full-bleed. No readable text, logos, watermarks, or borders.
```

#### `before-coffee` — Before Coffee

- **Category:** moods-moments
- **Model:** NANO_BANANA
- **Description:** Pre-caffeine zombie caricature — half-awake and unapproachable

```
Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Before Coffee. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating a half-awake, unapproachable, pre-caffeine zombie expression. Scene: morning kitchen or bathroom — empty mug waiting, dim soft light, bedhead energy. Mood: comic warning label energy. Style: polished humorous editorial caricature. Full-bleed. No text, logos, watermarks, or borders.
```

#### `after-coffee` — After Coffee

- **Category:** moods-moments
- **Model:** NANO_BANANA
- **Description:** Post-caffeine glow caricature — alert, caffeinated, and finally human

```
Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as After Coffee. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating an alert, caffeinated, finally-human expression. Scene: bright morning light, steaming coffee cup in hand or nearby, energetic posture. Mood: revitalized comedy glow-up. Style: polished humorous editorial caricature with crisp lighting. Full-bleed. No text, logos, watermarks, or borders.
```

#### `deadline-mode` — Deadline Mode

- **Category:** moods-moments
- **Model:** NANO_BANANA
- **Description:** Deadline chaos caricature — intense focus, caffeine, and ticking clock energy

```
Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Deadline Mode. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating intense focus, mild panic, and hyper-productive energy. Scene: desk buried in notes and screens, coffee cups, soft dramatic task lighting, ticking-clock tension without readable text. Mood: stressful comedy. Style: polished humorous editorial caricature. Full-bleed. No logos, watermarks, or borders.
```

#### `vacation-mood` — Vacation Mood

- **Category:** moods-moments
- **Model:** NANO_BANANA
- **Description:** Vacation-brain caricature — sunglasses, sun, and zero responsibilities

```
Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Vacation Mood. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating a relaxed, sunglasses-optional, zero-responsibilities smile. Scene: sunny vacation setting — beach, pool, or resort lounge with warm sunlight and soft tropical colors. Mood: blissful escape comedy. Style: polished humorous editorial caricature. Full-bleed. No text, logos, watermarks, or borders.
```

#### `gym-motivation` — Gym Motivation

- **Category:** moods-moments
- **Model:** NANO_BANANA
- **Description:** Gym-day caricature — hyped, determined, and slightly overconfident

```
Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Gym Motivation. Preserve facial likeness, age, ethnicity, hairstyle, and athletic or casual gym clothing while exaggerating a hyped, determined, slightly overconfident expression. Scene: gym or workout setting — weights, water bottle, energetic lighting. Mood: motivational comedy, not body-shaming. Style: polished humorous editorial caricature. Full-bleed. No text, logos, watermarks, or borders.
```

#### `forgot-my-password` — Forgot My Password

- **Category:** moods-moments
- **Model:** NANO_BANANA
- **Description:** Password-reset rage caricature — staring at a screen in digital despair

```
Using the uploaded photo as the sole identity reference, create a funny caricature of the subject as Forgot My Password. Preserve facial likeness, age, ethnicity, hairstyle, and clothing while exaggerating digital despair — blank stare, mild rage, forehead-in-hand energy at a laptop or phone. Scene: desk or couch with glowing screen, soft comic lighting. Mood: relatable tech frustration comedy. Style: polished humorous editorial caricature. Full-bleed. No readable UI text, logos, watermarks, or borders.
```

### Caricatures

#### `handd` — Hand-Drawn

- **Category:** caricatures
- **Model:** NANO_BANANA
- **Description:** Traditional hand-drawn editorial caricature with colored-pencil and ink illustration style

```
Using the uploaded photo as the visual reference, create a hand-drawn editorial caricature of the subject. The caricature should feature a very large, exaggerated head and a small, simplified body, preserving the subject's core facial likeness while emphasizing distinctive features. Strongly exaggerate: Head size and facial proportions, Nose, cheeks, jaw, and brow, Eye spacing and expression. Style: Traditional colored-pencil and ink illustration, Visible pencil strokes, Cross-hatching and line shading, Slightly uneven, hand-drawn outlines, Subtle paper texture. Shading should be: Built with layered pencil tones, Warm, earthy colors, No smooth digital gradients. Facial expression should be expressive and characterful, leaning slightly humorous or serious depending on the reference photo. Clothing should be simplified and secondary, drawn with minimal detail to keep focus on the face. Background: Plain, light, off-white or beige, Minimal texture only, No scenery, no environment. Overall look: Classic newspaper / magazine caricature, Hand-drawn, imperfect, human, Exaggerated but recognizable. Full-bleed illustration. No borders. Avoid 3D, avoid painterly styles, avoid realism.
```

#### `editorial` — Editorial

- **Category:** caricatures
- **Model:** NANO_BANANA
- **Description:** Sophisticated magazine editorial caricature with ink linework and watercolor washes

```
Create a sophisticated editorial caricature of the provided subject while faithfully preserving their identity, facial structure, age, ethnicity, hairstyle, expression, clothing, and pose. Exaggerate the defining facial characteristics in a tasteful editorial manner—slightly enlarge the head, emphasize the forehead, eyebrows, eyes, nose, ears, cheek lines, smile lines, and wrinkles to communicate wisdom and character without becoming grotesque. Maintain realistic facial proportions despite the stylization. Render in a premium newspaper/magazine editorial illustration style using expressive black ink linework, fine cross-hatching, loose pen strokes, and layered watercolor washes. Use warm, earthy tones with subtle texture from watercolor paper. Employ confident contour lines, varied line weights, and painterly shading to create depth while retaining a handcrafted appearance. Preserve the library setting with bookshelves and the armchair, but simplify the background into soft watercolor shapes and sketch-like details so it supports rather than competes with the subject. Use soft natural window lighting, gentle shadows, and a muted, elegant color palette. The overall mood should be thoughtful, distinguished, intellectual, and timeless—resembling a high-end editorial portrait published in The New Yorker, The Economist, Financial Times, or a literary magazine. No typography, captions, speech bubbles, logos, signatures, watermarks, borders, decorative frames, or graphic elements. Background should remain clean and uncluttered, with the subject as the clear focal point.
```

#### `exaggerated` — Exaggerated

- **Category:** caricatures
- **Model:** NANO_BANANA
- **Description:** Exaggerated 3D cartoon caricature with playful proportions

```
Make this an Exaggerated 3d cartoon caricature
```

#### `watercolor` — Watercolor

- **Category:** caricatures
- **Model:** SEEDREAM_4
- **Description:** Watercolor caricature with soft painterly washes and stylized shading

```
Make this a Watercolor caricature
```

#### `carc1` — Carc1

- **Category:** caricatures
- **Model:** SEEDREAM_4
- **Description:** Full-body stylized 3D caricature with oversized head, slim proportions, and premium character shading

```
Using the uploaded photo as the sole identity reference, create a full-body stylized 3D caricature that faithfully preserves the person's recognizable facial features, body type, skin tone, ethnicity, hairstyle, facial hair, clothing, footwear, and accessories. The character should unmistakably resemble the person in the reference photo. Maintain a clean studio composition with the character standing upright in a relaxed pose, facing forward, with the entire body visible from head to toe. Apply a cohesive stylized character design with: An oversized head (approximately 1.8–2.2× realistic size), A very long, slim neck, A smaller, simplified torso, Long, thin arms and legs, Large expressive hands, Slightly oversized shoes, Gentle exaggeration of the person's natural facial features (nose, ears, jawline, cheeks, eyes, lips, eyebrows) while preserving identity, Expressive but believable proportions. Preserve the person's actual: race and skin tone, facial structure, hairstyle, facial hair, age appearance, body build (slim, average, muscular, heavy-set, etc.), clothing style, colors, textures and logos (unless copyright-safe replacements are required), accessories. Render using premium stylized 3D character artwork with: physically based materials, soft cinematic lighting, subtle skin texture, realistic fabric folds, clean matte surfaces, high-quality sculpted details, smooth stylized anatomy, slightly enlarged eyes with expressive brows. The expression should be natural and personality-driven rather than exaggerated into comedy. Keep the background completely transparent with no floor, shadows, props, or scenery. The final image should resemble a collectible animated film character or high-end stylized game character while remaining an unmistakable caricature of the person in the uploaded photograph.
```

#### `3d-bd` — 3D BD

- **Category:** caricatures
- **Model:** NANO_BANANA_2
- **Description:** Ultra-realistic premium BD caricature with exaggerated features and cinematic lighting

```
Transform the person in the original photograph into an ultra-realistic, highly detailed premium-quality BD caricature. Preserve the recognizability, facial features, head shape, hairstyle, clothing, pose, personality, and overall mood of the original photo. Exaggerate characteristic facial features to the extreme: enlarge the head relative to the body, make the character more expressive, but do not distort the person beyond recognition. Emphasize the shape of the eyes (make them huge), eyebrows, nose (make it big), lips, cheekbones, and jawline, while maintaining natural proportions and visual similarity to the reference. Add realistic skin microtexture: pores, expression lines, fine lines, natural folds, subtle imperfections, and smooth color transitions. The look should be vibrant and natural, without the effects of plastic, wax, or excessive ironing. Detail the hair, eyelashes, boots, and clothing textures: individual fibers, seams, folds, and natural light reflections. Use cinematic lighting, flickering volumetric shadows, expressive highlights, and realistic rendering. The final result should resemble a character from an expensive full-length animated film: stylized, charismatic, emotional, and distinctly... High-quality digitalization, professional
```

#### `3d` — 3D

- **Category:** caricatures
- **Model:** SEEDREAM_4_5
- **Description:** Ultra-realistic premium 3D caricature with exaggerated features and cinematic film-style rendering

```
Transform a person in a source photo into an ultra-realistic, highly detailed premium 3D caricature. Preserve the recognizability, individual facial features, head shape, hairstyle, clothing, pose, emotion, and overall mood of the original photo. Exaggerate characteristic facial features to the extreme: enlarge the head relative to the body, make facial expressions more expressive, but don't distort the person beyond recognition. Emphasize the shape of the eyes (make them huge), eyebrows, nose (make it big), lips, cheekbones, and jawline, while maintaining natural proportions and visual similarity to the reference. Add realistic skin microtexture: pores, expression lines, fine wrinkles, natural folds, subtle imperfections, and smooth tonal transitions. The skin should look alive and natural, without the effect of plastic, wax, or excessive smoothing. Detail the hair, eyelashes, eyebrows, and clothing textures: individual fibers, seams, folds, and natural light reflections. Use cinematic lighting, soft volumetric shadows, expressive highlights, and realistic rendering. The final result should resemble a character from an expensive full-length animated film: stylized, charismatic, emotional, and photorealistic at the same time. Highly detailed, professional 3D rendering, ultra-realistic, cinematic lighting, 8K, no text, logos, or extraneous elements.
```

#### `dancing-carc` — Dancing

- **Category:** caricatures
- **Model:** NANO_BANANA_2
- **Description:** Exaggerated hybrid 3D-illustration dancing caricature with dynamic motion and painterly textures

```
An exaggerated hybrid cartoon character combining sculpted 3D volume with expressive painted illustration style, featuring distorted stylized proportions and artistic facial deformation, freely adapting the person's appearance without realistic facial accuracy while keeping recognizable traits such as skin tone and hairstyle, the character captured in a dynamic dance pos full of motion and rhythm, flowing body ges and expressive posture, visible brush strok painted shadows and graphic textures layer over soft 3D forms, contemporary animated illustration aesthetic, solid blue studio background, stylized studio lighting translated into painterly highlights and shadows, energetic composition, textured paint surfaces and high-end hybrid 3D illustration render
```

#### `tiny-muscle-v1` — Tiny Muscle V1

- **Category:** caricatures
- **Model:** SEEDREAM_4_5
- **Description:** Humorous hyper-muscular cartoon caricature with oversized head and comic-book hero physique

```
Preserve the uploaded person's identity exactly. Transform the person into a humorous hyper-muscular cartoon caricature while maintaining their recognizable face, hairstyle, skin tone, facial hair, and personality.nnExaggerate characteristic facial features to the extreme: enlarge the head relative to the body, make facial expressions more expressive, but don't distort the person beyond recognition. Emphasize the shape of the eyes (make them huge), eyebrows, nose (make it big), lips, cheekbones, and jawline, while maintaining natural proportions and visual similarity to the reference.nnDramatically exaggerate the physique with enormous rounded shoulders, gigantic biceps, thick forearms, massive chest, oversized trapezius muscles, a powerful V-shaped torso, sculpted eight-pack abs, broad back, muscular thighs, and athletic calves. The proportions should be intentionally exaggerated and cartoonishly powerful while remaining visually appealing and cohesive. The body should look like an impossibly muscular comic-book hero rather than a realistic bodybuilder.nnPreserve the person's facial identity, but subtly enhance the expression with a confident grin, determined eyes, and strong jawline without over-distorting their unique facial features.nnRender smooth, clean muscle contours with glossy skin highlights, rounded anatomical forms, and premium digital illustration quality. Emphasize heroic proportions, dynamic anatomy, exaggerated strength, and energetic visual appeal. Rich colour gradients, soft studio lighting, subtle ambient occlusion, crisp edges, and high-detail digital painting with a polished commercial illustration finish. Humorous yet impressive, premium character design, ultra-detailed, vibrant, 8K quality.
```

#### `tiny-muscle-v2` — Tiny Muscle V2

- **Category:** caricatures
- **Model:** NANO_BANANA
- **Description:** Humorous hyper-muscular cartoon caricature with oversized head and comic-book hero physique

```
Preserve the uploaded person's identity exactly. Transform the person into a humorous hyper-muscular cartoon caricature while maintaining their recognizable face, hairstyle, skin tone, facial hair, and personality.nnExaggerate characteristic facial features to the extreme: enlarge the head relative to the body, make facial expressions more expressive, but don't distort the person beyond recognition. Emphasize the shape of the eyes (make them huge), eyebrows, nose (make it big), lips, cheekbones, and jawline, while maintaining natural proportions and visual similarity to the reference.nnDramatically exaggerate the physique with enormous rounded shoulders, gigantic biceps, thick forearms, massive chest, oversized trapezius muscles, a powerful V-shaped torso, sculpted eight-pack abs, broad back, muscular thighs, and athletic calves. The proportions should be intentionally exaggerated and cartoonishly powerful while remaining visually appealing and cohesive. The body should look like an impossibly muscular comic-book hero rather than a realistic bodybuilder.nnPreserve the person's facial identity, but subtly enhance the expression with a confident grin, determined eyes, and strong jawline without over-distorting their unique facial features.nnRender smooth, clean muscle contours with glossy skin highlights, rounded anatomical forms, and premium digital illustration quality. Emphasize heroic proportions, dynamic anatomy, exaggerated strength, and energetic visual appeal. Rich colour gradients, soft studio lighting, subtle ambient occlusion, crisp edges, and high-detail digital painting with a polished commercial illustration finish. Humorous yet impressive, premium character design, ultra-detailed, vibrant, 8K quality.
```

### Cartoons

#### `90s-cartoon` — 90s

- **Category:** cartoons
- **Model:** DEFAULT_MODEL
- **Description:** Classic 90s animated cartoon style

```
Make this a 90s cartoon
```

#### `chibi` — Chibi

- **Category:** cartoons
- **Model:** DEFAULT_MODEL
- **Description:** Cute, big-head chibi cartoon style

```
Make this a chibi cartoon, maintaining posture and facial features
```

#### `classic-v1` — Classic V1

- **Category:** cartoons
- **Model:** SEEDREAM_4
- **Description:** Classic cartoon style with timeless animated character appeal

```
make this a Classic Cartoon
```

#### `classic-v2` — Classic V2

- **Category:** cartoons
- **Model:** NANO_BANANA
- **Description:** Classic cartoon style with bold lines and expressive character design

```
make this a Classic Cartoon
```

#### `saturday-v1` — Saturday V1

- **Category:** cartoons
- **Model:** NANO_BANANA
- **Description:** Saturday morning cartoon style with bright colors and playful energy

```
make this a Saturday Morning Cartoon
```

#### `saturday-v2` — Saturday V2

- **Category:** cartoons
- **Model:** SEEDREAM_4
- **Description:** Saturday morning cartoon style with bold outlines and cheerful animation

```
make this a Saturday Morning Cartoon
```

#### `comic` — Comic

- **Category:** cartoons
- **Model:** SEEDREAM_4_5
- **Description:** Comic cartoon style with bold ink lines and expressive character art

```
make this a comic Cartoon
```

#### `cute` — Cute

- **Category:** cartoons
- **Model:** SEEDREAM_4_5
- **Description:** Cute cartoon style with soft shapes and adorable character charm

```
make this a cute Cartoon
```

#### `dc` — DC

- **Category:** cartoons
- **Model:** DEFAULT_MODEL
- **Description:** DC style cartoon with bold superhero comic-book character design

```
make this a DC style Cartoon
```

#### `cyberpunk-v1` — Cyberpunk V1

- **Category:** cartoons
- **Model:** SEEDREAM_4_5
- **Description:** Cyberpunk cartoon style with neon-lit futuristic character design

```
make this a cyberpunk style cartoon, no extra text
```

#### `cyberpunk-v2` — Cyberpunk V2

- **Category:** cartoons
- **Model:** NANO_BANANA_2
- **Description:** Cyberpunk cartoon style with bold sci-fi edges and vivid neon color

```
make this a cyberpunk style cartoon, no extra text
```

#### `disney` — Disney

- **Category:** cartoons
- **Model:** NANO_BANANA_2
- **Description:** Disney-style cartoon with soft features and classic animated character charm

```
make this a disney style cartoon, no extra text
```

#### `pixel` — Pixel

- **Category:** cartoons
- **Model:** SEEDREAM_4_5
- **Description:** Pixel cartoon style with retro game-art charm

```
make this a pixel cartoon
```

#### `3d-render-v1` — 3D Render V1

- **Category:** cartoons
- **Model:** DEFAULT_MODEL
- **Description:** 3D rendered art cartoon with polished CGI character styling

```
make all subjects and object a 3D Rendered Art cartoon
```

#### `3d-render-v2` — 3D Render V2

- **Category:** cartoons
- **Model:** SEEDREAM_4_5
- **Description:** 3D rendered art cartoon with vivid stylized CGI illustration

```
make all subjects and object a 3D Rendered Art cartoon
```

#### `comic-v1` — Comic V1

- **Category:** cartoons
- **Model:** DEFAULT_MODEL
- **Description:** Comic book style cartoon with classic printed-panel energy

```
make this a Comic Book Style cartoon
```

#### `comic-v2` — Comic V2

- **Category:** cartoons
- **Model:** SEEDREAM_4_5
- **Description:** Comic book style cartoon with sharper modern illustrated rendering

```
make this a Comic Book Style cartoon
```

### Paintings

#### `oil-paint` — Oil Paint

- **Category:** paintings
- **Model:** DEFAULT_MODEL
- **Description:** Oil-paint cartoon caricature style

```
make this a Oil-paint cartoon caricature
```

#### `water-color` — Water Color

- **Category:** paintings
- **Model:** DEFAULT_MODEL
- **Description:** Water color cartoon caricature style

```
make this a water color cartoon caricature
```

#### `acrylic` — Acrylic

- **Category:** paintings
- **Model:** SEEDREAM_4
- **Description:** Acrylic painting portrait with bold brushstrokes and vibrant color

```
Make this an Acrylic Painting
```

#### `gouache` — Gouache

- **Category:** paintings
- **Model:** SEEDREAM_4
- **Description:** Gouache painting portrait with matte opaque washes and rich color

```
Make this a Gouache Painting
```

#### `expressionist` — Expressionist

- **Category:** paintings
- **Model:** SEEDREAM_4
- **Description:** Expressionist painting portrait with bold brushwork and emotional color

```
make this an Expressionist painting
```

#### `impressionist` — Impressionist

- **Category:** paintings
- **Model:** SEEDREAM_4
- **Description:** Impressionist painting portrait with soft brushstrokes and luminous color

```
make this an Impressionist painting
```

#### `baroque` — Baroque

- **Category:** paintings
- **Model:** SEEDREAM_4
- **Description:** Baroque portrait painting with dramatic lighting and rich classical detail

```
make this a Baroque Portrait painting
```

#### `van-gogh` — Van Gogh

- **Category:** paintings
- **Model:** SEEDREAM_4
- **Description:** Van Gogh style painting with expressive brushstrokes and vivid swirling color

```
An expressive Post-Impressionist oil painting featuring thick impasto brushstrokes, swirling directional paint strokes, vibrant complementary colors, textured canvas, energetic movement, dramatic lighting, bold painterly texture. Preserve the uploaded person's exact facial identity, age, hairstyle, facial structure, expression, and clothing. Transform only the artistic rendering, not the person's identity.
```

#### `expressive-impasto` — Expressive Impasto V1

- **Category:** paintings
- **Model:** NANO_BANANA_2
- **Description:** Expressive impasto oil painting with thick brushstrokes, vivid color, and dramatic post-impressionist texture

```
An expressive Post-Impressionist oil painting featuring thick impasto brushstrokes, swirling directional paint strokes, vibrant complementary colors, textured canvas, energetic movement, dramatic lighting, bold painterly texture. Preserve the uploaded person's exact facial identity, age, hairstyle, facial structure, expression, and clothing. Transform only the artistic rendering, not the person's identity.
```

#### `expressive-impasto-v2` — Expressive Impasto V2

- **Category:** paintings
- **Model:** SEEDREAM_4_5
- **Description:** Expressive impasto oil painting with thick brushstrokes, vivid color, and dramatic post-impressionist texture

```
An expressive Post-Impressionist oil painting featuring thick impasto brushstrokes, swirling directional paint strokes, vibrant complementary colors, textured canvas, energetic movement, dramatic lighting, bold painterly texture. Preserve the uploaded person's exact facial identity, age, hairstyle, facial structure, expression, and clothing. Transform only the artistic rendering, not the person's identity.
```

#### `monet` — Monet

- **Category:** paintings
- **Model:** SEEDREAM_4
- **Description:** Monet style painting with soft impressionist light and delicate color

```
using this pic make this a monet style Painting
```

#### `renoir` — Renoir

- **Category:** paintings
- **Model:** NANO_BANANA_2
- **Description:** Renoir inspired painting with warm impressionist tones and soft brushwork

```
using this pic make this a Renoir Inspired Painting
```

#### `cezanne` — Cézanne

- **Category:** paintings
- **Model:** SEEDREAM_4_5
- **Description:** Cézanne inspired painting with structured forms and post-impressionist color

```
using this pic make this a Cézanne Inspired Painting
```

#### `gauguin` — Gauguin

- **Category:** paintings
- **Model:** SEEDREAM_4_5
- **Description:** Gauguin inspired painting with bold color and post-impressionist tropical mood

```
using this pic make this a Gauguin Inspired Painting
```

#### `matisse` — Matisse

- **Category:** paintings
- **Model:** SEEDREAM_4_5
- **Description:** Matisse inspired painting with bold flat color and expressive fauvist forms

```
using this pic make this a Matisse Inspired Painting
```

#### `seurat` — Seurat

- **Category:** paintings
- **Model:** SEEDREAM_4_5
- **Description:** Seurat inspired painting with pointillist dots and luminous neo-impressionist color

```
using this pic make this a Seurat Inspired Painting
```

#### `ink-wash` — Ink-Wash

- **Category:** paintings
- **Model:** SEEDREAM_4_5
- **Description:** Ink wash painting with fluid brushstrokes and delicate tonal washes

```
using this pic make this a Ink Wash Painting
```

#### `impasto` — Impasto

- **Category:** paintings
- **Model:** NANO_BANANA_2
- **Description:** Impasto painting with thick textured brushstrokes and rich layered paint

```
using this pic make all subjects as an Impasto Painting
```

#### `hokusai-v1` — Hokusai V1

- **Category:** paintings
- **Model:** SEEDREAM_4_5
- **Description:** Hokusai inspired painting with bold ukiyo-e lines and dramatic composition

```
using this pic make all subjects as a Hokusai Inspired Painting
```

#### `hokusai-v2` — Hokusai V2

- **Category:** paintings
- **Model:** NANO_BANANA_2
- **Description:** Hokusai inspired painting with vivid woodblock color and expressive brushwork

```
using this pic make all subjects as a Hokusai Inspired Painting
```

#### `hiroshige` — Hiroshige

- **Category:** paintings
- **Model:** NANO_BANANA_2
- **Description:** Hiroshige inspired painting with elegant ukiyo-e landscapes and refined color

```
using this pic make all subjects as a Hiroshige Inspired Painting, no extra text
```

#### `sesshu` — Sesshū

- **Category:** paintings
- **Model:** NANO_BANANA_2
- **Description:** Sesshū inspired painting with ink-wash landscapes and meditative composition

```
using this pic make all subjects as a Sesshū Inspired Painting in color, no extra text
```

#### `wc-marker` — Watercolor Marker

- **Category:** paintings
- **Model:** DEFAULT_MODEL
- **Description:** Watercolor marker portrait with loose washes and crisp ink-marker edges

```
Using the attached image as a reference create stylish dynamic stylized portrait of a person head, drawn with art watercolor markers. Use only one [color] color family in contrasting shades: a bright vivid shade for the crucial contour lines and details, a very light pastel shade for soft volume and shadows. Maximize the use of white paper (negative space). No dark colors. Marker strokes do not overlap, use long smooth dynamic lines where possible. Stylish perspective and camera angle. Only essential details. Slight paper texture is visible under the strokes, the rest is clean white. Bold, graphic, juicy
```

### Art

#### `neon` — Neon

- **Category:** art
- **Model:** DEFAULT_MODEL
- **Description:** Vibrant neon cartoon style

```
make a neon cartoon
```

#### `lowpoly` — Low Poly

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Low-poly cartoon with geometric facets and plain-color background

```
make this a low-poly cartoon, make background plain color if none.
```

#### `mural` — Mural

- **Category:** art
- **Model:** NANO_BANANA
- **Description:** Street mural graffiti portrait of the subject

```
make a street mural graffiti of the subject/s
```

#### `pop-art-v1` — Pop Art V1

- **Category:** art
- **Model:** DEFAULT_MODEL
- **Description:** Pop art portrait rendered with bold flat colors

```
make this a pop art.
```

#### `pop-art-v2` — Pop Art V2

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Pop art portrait with vibrant graphic styling

```
make this a pop art.
```

#### `pop-art-v3` — Pop Art V3

- **Category:** art
- **Model:** NANO_BANANA
- **Description:** Pop art portrait with bold comic-inspired color blocks

```
make this a pop art.
```

#### `graffiti` — Graffiti

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Graffiti art portrait with bold street-art styling

```
make this a Graffiti Art.
```

#### `banksy` — Banksy

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Banksy-style stencil street art portrait

```
make this a banksy style art
```

#### `mosaic` — Mosaic

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Mosaic installation art portrait with tiled color fragments

```
make this a Mosaic installations art
```

#### `hexagonal-mosaic` — Hexagonal Mosaic

- **Category:** art
- **Model:** NANO_BANANA
- **Description:** Hexagonal mosaic portrait with honeycomb tiles and faceted color blocks

```
Preserve the uploaded person's identity exactly. Transform the portrait into a contemporary geometric artwork composed of interlocking hexagonal mosaic cells across the face while preserving realistic eyes, nose, lips, and facial proportions. Render the hair as flowing topographic contour lines resembling fingerprint ridges or elevation maps. Blend warm amber and orange tones into cool violet, indigo, and cobalt gradients with smooth transitions. Integrate the geometric pattern naturally into the clothing using elongated vertical graphic elements. Maintain a textured off-white paper background with subtle painterly brush textures. High-detail digital illustration, architectural precision, clean composition, elegant modern generative art, crisp edges, premium gallery-quality finish.
```

#### `e-glow` — E-Glow

- **Category:** art
- **Model:** DEFAULT_MODEL
- **Description:** Electric glow art portrait with neon luminous highlights

```
make this a Electric Glow art
```

#### `abstract-v1` — Abstract V1

- **Category:** art
- **Model:** NANO_BANANA
- **Description:** Abstract art portrait with bold shapes and expressive color

```
Make this an abstract art
```

#### `abstract-v2` — Abstract V2

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Abstract art portrait with layered forms and vivid composition

```
Make this an abstract art
```

#### `geometric` — Geometric

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Geometric art portrait with angular shapes and bold color blocks

```
Make this a geometric art
```

#### `surreal` — Surreal

- **Category:** art
- **Model:** NANO_BANANA
- **Description:** Surreal art portrait with dreamlike forms and imaginative composition

```
Make this a surreal art
```

#### `coloured-glass` — Coloured Glass

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Colored glass art portrait with luminous stained-glass styling

```
Make this a Colored Glass Art
```

#### `paste-up` — Paste-up

- **Category:** art
- **Model:** SEEDREAM_4
- **Description:** Paste-up street art portrait with layered paper collage styling

```
Make this a Paste-up Art
```

#### `pencil-sketch-v1` — Pencil Sketch V1

- **Category:** art
- **Model:** NANO_BANANA
- **Description:** Childlike crayon caricature on lined notebook paper with messy vibrant strokes

```
A childlike crayon drawing on blue horizontal lined notebook paper. The drawing is a simplified, slightly exaggerated caricature of the reference image. preserving face shape, skin tone, hairstyle, facial expression, and outfit colors. Features messy, vibrant crayon strokes and bold outlines. Background is simplified and loosely sketched. The overall effect should be an authentic drawing by a child aged 10-6.
```

#### `pencil-sketch-v2` — Pencil Sketch V2

- **Category:** art
- **Model:** NANO_BANANA_2
- **Description:** Childlike crayon caricature on lined notebook paper with messy vibrant strokes

```
A childlike crayon drawing on blue horizontal lined notebook paper. The drawing is a simplified, slightly exaggerated caricature of the reference image. preserving face shape, skin tone, hairstyle, facial expression, and outfit colors. Features messy, vibrant crayon strokes and bold outlines. Background is simplified and loosely sketched. The overall effect should be an authentic drawing by a child aged 10-6.
```

#### `origami` — Origami

- **Category:** art
- **Model:** SEEDREAM_4_5
- **Description:** Elegant traditional origami sculpture of the subject from folded washi paper with museum-quality craftsmanship

```
Preserve the uploaded person's identity exactly. Transform the person into an elegant traditional origami sculpture, handcrafted entirely from folded paper while maintaining their recognizable facial features, hairstyle, skin tone (represented through carefully chosen paper colours), clothing, accessories, and personality.nnConstruct the entire character exclusively from precisely folded sheets of paper, using authentic origami techniques without cutting, tearing, or sculpting. Every part of the figure—including the face, hair, clothing, shoes, and accessories—should be formed through intricate geometric folds, layered paper structures, sharp creases, crisp edges, and carefully engineered paper geometry.nnPreserve the person's facial identity by using sophisticated folded forms that suggest the eyes, eyebrows, nose, lips, jawline, hairstyle, and expression while remaining unmistakably handcrafted from paper. Hair should be represented through layered folded strips, pleats, curls, or angular paper sections that mimic the person's hairstyle.nnClothing should appear as folded paper garments with realistic collars, sleeves, seams, lapels, pockets, folds, and fabric draping recreated entirely through origami techniques. Accessories should also be folded from paper while remaining clearly recognizable.nnUse premium textured Japanese washi paper with subtle fibres, natural matte surfaces, delicate paper grain, and realistic fold stress along the creases. Employ harmonious paper colours with gentle tonal variation while preserving the person's clothing colours and overall appearance.nnDisplay the finished origami sculpture on a clean neutral surface with soft studio lighting that highlights the crisp folds, layered construction, realistic paper thickness, and intricate craftsmanship. Subtle contact shadows, shallow depth of field, professional macro photography, museum-quality paper sculpture, ultra-detailed handcrafted artistry, elegant composition, photorealistic materials, 8K quality, no glue, no tape, no text, no watermarks, and no visual defects.
```

### 3D Characters

#### `3dclay` — 3D Clay

- **Category:** 3d-characters
- **Model:** DEFAULT_MODEL
- **Description:** 3D Clay cartoon style

```
make this a 3D Clay cartoon
```

#### `pixar-like` — Pixar-like

- **Category:** 3d-characters
- **Model:** DEFAULT_MODEL
- **Description:** Pixar-like cartoon style including background

```
make this a pixar-like cartoon including the background
```

#### `funko-pop` — Funko Pop

- **Category:** 3d-characters
- **Model:** DEFAULT_MODEL
- **Description:** Premium vinyl Funko Pop–style collectible figure with oversized head and commercial product photography

```
Preserve the uploaded person's identity exactly. Transform the person into a premium vinyl collectible figure inspired by the iconic Funko Pop aesthetic while maintaining their recognizable facial features, hairstyle, skin tone, facial hair (if applicable), clothing, accessories, and overall personality.nnThe character has the classic collectible proportions: an oversized rounded head occupying approximately half the figure's total height, a compact simplified body, short limbs, and slightly enlarged hands and feet. The face features large glossy solid-black circular eyes without visible pupils, simplified eyebrows, a minimal nose, and a subtle stylized smile or neutral expression while preserving the person's unique likeness. The figure has a smooth matte vinyl finish with subtle satin highlights and finely sculpted details.nnFaithfully recreate the person's hairstyle with simplified sculpted strands and clean vinyl contours. Reproduce all distinctive clothing, shoes, jewellery, glasses, watches, hats, or accessories in miniature collectible form using simplified yet highly recognizable sculpting. Preserve colour accuracy while slightly simplifying textures to resemble moulded vinyl.nnThe figure stands confidently on a transparent round display base with balanced proportions and museum-quality craftsmanship. Every detail resembles a professionally manufactured designer vinyl collectible, including clean seam lines, crisp paint application, smooth rounded edges, premium mould quality, realistic vinyl materials, subtle surface reflections, and highly detailed sculpting.nnThe scene is photographed as premium commercial product photography on a clean tabletop or studio surface with soft diffused lighting, realistic contact shadows, gentle reflections, shallow depth of field, and a professional 85mm product lens. Ultra-photorealistic, 8K quality, sharp focus on the figure, commercial advertising aesthetic, realistic materials and textures, clean composition, no packaging, no logos, no text, no watermarks, and no visual defects.
```

#### `aardman` — Aardman

- **Category:** 3d-characters
- **Model:** SEEDREAM_4_5
- **Description:** Grotesque humorous Aardman-style claymation 3D scene preserving original composition

```
Create a highly detailed 3D interpretation of the reference image while **strictly preserving the exact spatial arrangement of all objects, their scale, rotations, positions, and the overall structural composition.**nn**Do not move, add, or remove any elements.** Instead, translate the entire image into a grotesque, humorous clay world while preserving the original scene and its visual logic.nn### StylennThe style should be **extremely caricatured**, reminiscent of **Aardman Animations**, with an absurdist tone.nnThe characters should appear deliberately ridiculous, featuring:nn* Wildly disproportionate bodiesn* Rubbery, noodle-like limbsn* Bulging "ping-pong ball" eyes, slightly pointing in different directionsn* Huge toothy smiles with unnaturally large rectangular teethn* Clearly visible pink gumsnnEach character should look intentionally comical.nn### Texture & AestheticnnEverything should appear to be sculpted from **heavy, matte modeling clay (plasticine).**nnThe geometry should be intentionally uneven and imperfect:nn* No straight linesn* No perfectly sharp edgesn* No sterile smoothnessnnEvery surface should feel hand-sculpted, with visible waviness and rough, organic forms.nnThe material should display pronounced tactile imperfections, including:nn* Deep dirty fingerprintsn* Random fingernail scratchesn* Rough seamsn* Fine cracksn* Tiny dust particlesn* Lint fibersn* Small bits of debris stuck to the clay surfacenn### Overall FeelnnThe final result should evoke a **funny, bizarre, slightly unsettling, yet vibrant and tangible claymation world**, rendered as a richly detailed 3D image with maximum visual detail.
```

#### `modern-animation` — Modern Animation

- **Category:** 3d-characters
- **Model:** SEEDREAM_4_5
- **Description:** Warm high-end modern animated feature-film character with soft stylization and cinematic lighting

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into a charming high-end animated feature film character, preserving their recognizable facial features, hairstyle, beard, skin tone, eye colour, clothing, accessories, and personality.nnReimagine the character with warm, appealing proportions: a slightly oversized head, expressive large eyes with natural irises, softly rounded cheeks, a friendly smile, simplified facial anatomy, and subtle stylization while maintaining the person's unmistakable identity. Avoid caricature-like distortion or exaggerated facial features.nnSculpt the hair as soft, flowing strands with layered volume, natural movement, and silky textures. Facial hair should appear neatly groomed with stylized yet realistic individual strands that blend seamlessly into the character's face.nnThe clothing should retain its original design while being recreated with premium animated-film quality, featuring soft fabrics, clean stitching, subtle wrinkles, realistic cloth simulation, and vibrant colours.nnRender the character as a premium stylized 3D model with smooth topology, high-quality skin shaders, subtle subsurface scattering, realistic fabric materials, soft global illumination, ambient occlusion, cinematic rim lighting, and polished studio-quality rendering.nnThe overall aesthetic should feel warm, inviting, expressive, and emotionally engaging, with rounded forms, appealing silhouettes, and elegant proportions typical of modern family animated feature films.nnPlace the character against a clean softly blurred gradient background with warm cinematic lighting, shallow depth of field, soft shadows, premium colour grading, ultra-clean composition, commercial-quality character render, highly detailed textures, photorealistic 3D materials, 8K quality, no text, no logos, no watermarks, and no visual defects.
```

#### `3d-portrait-v1` — 3D Portrait V1

- **Category:** 3d-characters
- **Model:** SEEDREAM_4_5
- **Description:** Stylized 3D portrait with exaggerated cartoon proportions and semi-realistic skin texture

```
A stylized 3D portrait that transforms the person in the photo into a character with exaggerated proportions, like a cartoon. The skin is textured with realistic pores, subtle wrinkles, and expressive features, just like in the photo.  A discreet signature is added in the lower left corner in a contrasting color: The lighting is warm and soft, with a plain beige studio background. High-quality 3D rendering with semi-realistic shading, sculpted facial features, and high-quality materials.
```

#### `3d-portrait-v2` — 3D Portrait V2

- **Category:** 3d-characters
- **Model:** NANO_BANANA_2
- **Description:** Stylized 3D portrait with exaggerated cartoon proportions and semi-realistic skin texture

```
A stylized 3D portrait that transforms the person in the photo into a character with exaggerated proportions, like a cartoon. The skin is textured with realistic pores, subtle wrinkles, and expressive features, just like in the photo.  A discreet signature is added in the lower left corner in a contrasting color: The lighting is warm and soft, with a plain beige studio background. High-quality 3D rendering with semi-realistic shading, sculpted facial features, and high-quality materials.
```

#### `minime` — Minime

- **Category:** 3d-characters
- **Model:** NANO_BANANA_2
- **Description:** Premium studio portrait pairing a photoreal subject with a stylized mini 3D version of the same person

```
Use the uploaded reference image as an immutable source of identity for both subjects. IDENTITY FIXED - NOT ALTERABLE Preserve the exact facial structure, facial proportions, skin tone, eye shape, nose shape, lips, hairstyle, hair color, visual age, body proportions, and all recognizable personality traits from the reference image. The real person and the stylized character must clearly represent the same person. Do not create a different face, hairstyle, ethnicity, age, or body type. Do not embellish, alter, or reinterpret the person's identity. COMPOSITION AND FRAMMENT Create a premium studio portrait in a vertical 4:5 composition. Full-length shot. The real person stands on the right side of the frame. A stylized 3D version of the same person stands on the left side. The 3D character should be approximately 50-60% the height of a real person and reach approximately to waist level. The real subject casually rests one elbow on the character's large head. The interaction should appear natural, relaxed, and believable. Maintain a balanced distance between objects and a clean, centered composition. REAL SUBJECT - PHOTOREALISM Create an ultra-realistic, professional, commercial-quality studio photograph. Skin texture, natural pores, realistic hair strands, realistic fabric detail, and physically accurate lighting should be visible. The facial expression should be warm, inviting, confident, and relaxed. Avoid overly wide smiles, artificial beauty filters, plastic skin, and unrealistic retouching. POSE DIRECTION The pose should appear natural, stylish, and relaxed. Weight slightly shifted to one leg. Slight asymmetry in posture. Relaxed shoulders. Natural body language. The hand resting on the character should appear casual and relaxed, not staged. Avoid stiff, standing poses. CLOTHING PRESERVATION Accurately recreate the clothing from the reference image. Preserve the clothing colors, fit, silhouette, fabric characteristics, stitching, folds, seams, cuffs, hems, logos, accessories, shoes, and overall style. Do not alter or replace clothing elements. 3D CHARACTER VERSION Create a premium animated 3D character inspired by the aesthetics of high-end cinematic animation. The character should remain clearly recognizable as the same person. Large, expressive head. Smaller, stylized body proportions. More expressive facial expressions while maintaining accurate character. Slightly enlarged eyes. Softer facial contours. A friendly, animated smile. Sophisticated, high-quality character modeling. Avoid a toy-like, cheap, plastic, low-detail, or rigid figurine look. CHARACTER AND MOVEMENT The character should appear alive and expressive. Subtle body movement. Natural stance. Playful personality. Animated facial expression. Confident and charming presence. The pose should look like a still from an animated film, not like a static collectible figurine. MATERIALS AND DETAILS High-quality physically based rendering. Premium cloth simulation. Soft, realistic folds in clothing. Accurate surface reflections. Natural skin shading and lighting. Detailed hair rendering. Professional character texturing. LIGHTING AND STUDIO ENVIRONMENT Soft, diffuse studio lighting from the top left. Clean highlight transitions. Natural, soft shadows. Premium commercial studio lighting scheme. The background should be a seamless light gray studio gradient, slightly brighter in the center. Both subjects should cast realistic shadows, securely anchored to the surface.
```

#### `dancing-3d` — Dancing

- **Category:** 3d-characters
- **Model:** SEEDREAM_4_5
- **Description:** Exaggerated hybrid 3D-illustration dancing character with dynamic motion and painterly textures

```
An exaggerated hybrid cartoon character combining sculpted 3D volume with expressive painted illustration style, featuring distorted stylized proportions and artistic facial deformation, freely adapting the person's appearance without realistic facial accuracy while keeping recognizable traits such as skin tone and hairstyle, the character captured in a dynamic dance pos full of motion and rhythm, flowing body ges and expressive posture, visible brush strok painted shadows and graphic textures layer over soft 3D forms, contemporary animated illustration aesthetic, solid blue studio background, stylized studio lighting translated into painterly highlights and shadows, energetic composition, textured paint surfaces and high-end hybrid 3D illustration render
```

#### `miniature` — Miniature

- **Category:** 3d-characters
- **Model:** SEEDREAM_4_5
- **Description:** Hyperrealistic miniature caricature sitting in giant hands with oversized head and photoreal detail

```
Use the attached photo as the primary reference for appearance and clothing. Maintain the person's individuality as accurately as possible: recognizable facial features, head shape, hairstyle, hairline, age, skin tone and natural texture, and the shape of the eyes, nose, lips, and chin. Transfer clothing, shoes, accessories, colors, materials, and small details entirely from the attached reference—don't replace or invent anything. Create the effect of a hyperrealistic, humorous caricature: an adult is transformed into a tiny, miniature version of themselves with a deliberately exaggerated, disproportionately large head and a very small body. The head should appear massive and expressive, but the face remains anatomically realistic and easily recognizable. This is a living, breathing miniature person, not a child, a toy, or a plastic doll. The character sits on the open palm of a huge human hand, crossing their legs in a confident, slightly demonstrative pose. The character's arms are tightly folded over their chest. The facial expression is serious, sullen, and slightly displeased: furrowed brows, an intense gaze, and barely noticeable pursed lips. The emotion is expressive but natural, without being overly grotesque. The enormous lower palm gently supports the miniature character and takes up a noticeable portion of the foreground. A second, gigantic hand enters the frame from above and gently touches the top of the character's head, as if gently supporting a small, lifelike figure between its palms. Both hands must appear as realistic as possible: correct anatomy and proportions of the fingers, natural skin, pores, fine wrinkles, knuckle creases, nails, translucent areas of skin, and soft, natural highlights. The contrast between the enormous hands and the tiny body should create a convincing illusion of scale. Vertical portrait composition 9:16. The camera is positioned approximately at face level, at a slight three-quarter angle. The face is the main focal point of the image, with perfectly sharp eyes and facial features. Both large hands beautifully frame the character, creating the impression that he is nestled between them. The head, petite body, crossed legs, clothing, and key parts of both hands are fully visible in the frame. The composition is dense, expressive, and visually balanced. Cinematic studio lighting: soft, directional key light on the face, subtle shadows, delicate backlighting along the edges of the head and clothing, and natural reflections on the skin. Realistic depth of field with a slight blur in the background without losing important details. The background is a bright blue-blue radial gradient, more luminous and saturated in the center behind the character and gradually fading to a deep blue at the edges. 8K, extreme detail, hyperrealism, photorealistic, cinematic quality, ultra-detailed skin, realistic fabric texture, physically accurate lighting, natural color grading, HDR, sharp facial details, professional studio photography, premium advertising aesthetics, high-end collectible miniature effect, no text.
```

#### `plastic-toy-v1` — Plastic Toy

- **Category:** 3d-characters
- **Model:** SEEDREAM_4_5
- **Description:** Premium stylized plastic toy render preserving the original scene, pose, and composition

```
Using the uploaded image as your ONLY reference, transform it into a high-quality stylized 3D render of a plastic toy, STRICTLY preserving the original scene without any changes: same object, same pose, same camera angle, same framing, same proportions, same lighting direction, same shadows, and same composition. The final image should look like an exact copy of the original photograph, transformed into a toy version, not a reimagining of it. Transform all characters and objects into the aesthetics of a premium collectible toy made of molded plastic. Surfaces should be exceptionally smooth, clean, and glossy, with controlled specular highlights, like those found in high-end designer toys or luxury collectible figurines. Add realistic structural details to the toy: visible hinge joints at the shoulders, elbows, hips, and knees (neat round or segmented hinges); subtle joint lines along the limbs and body parts; if necessary, minimal facial segmentation lines (very subtle, like those on premium action figures, no exaggeration); hinges should appear naturally integrated into the design and not interfere with the anatomy. The skin should be transformed into a smooth synthetic plastic (without pores or any imperfections), while fully preserving the character's personality and facial structure. Eyes should have a slight glossy sheen, like the painted eyes of the toy. Clothing should be transformed into plastic-coated materials (latex, rubberized surfaces, molded plastic, etc.), while maintaining the exact same design, folds, and construction - without any redesign.
```

#### `plastic-toy-v2` — Plastic Toy

- **Category:** 3d-characters
- **Model:** NANO_BANANA_2
- **Description:** Premium stylized plastic toy render preserving the original scene, pose, and composition

```
Using the uploaded image as your ONLY reference, transform it into a high-quality stylized 3D render of a plastic toy, STRICTLY preserving the original scene without any changes: same object, same pose, same camera angle, same framing, same proportions, same lighting direction, same shadows, and same composition. The final image should look like an exact copy of the original photograph, transformed into a toy version, not a reimagining of it. Transform all characters and objects into the aesthetics of a premium collectible toy made of molded plastic. Surfaces should be exceptionally smooth, clean, and glossy, with controlled specular highlights, like those found in high-end designer toys or luxury collectible figurines. Add realistic structural details to the toy: visible hinge joints at the shoulders, elbows, hips, and knees (neat round or segmented hinges); subtle joint lines along the limbs and body parts; if necessary, minimal facial segmentation lines (very subtle, like those on premium action figures, no exaggeration); hinges should appear naturally integrated into the design and not interfere with the anatomy. The skin should be transformed into a smooth synthetic plastic (without pores or any imperfections), while fully preserving the character's personality and facial structure. Eyes should have a slight glossy sheen, like the painted eyes of the toy. Clothing should be transformed into plastic-coated materials (latex, rubberized surfaces, molded plastic, etc.), while maintaining the exact same design, folds, and construction - without any redesign.
```

#### `figurine-v1` — Figurine V1

- **Category:** 3d-characters
- **Model:** SEEDREAM_4_5
- **Description:** Hyper-realistic commercial scene with a 1/7th-scale collectible figurine beside the real subject

```
Use a reference photo to create a hyper-realistic commercial scene featuring a 1/7th scale collectible action figure based on the uploaded image. The main subject is a realistic miniature figurine of the same man from the reference photo, accurately reproducing his appearance, facial features, hairstyle, body proportions, pose, and clothing. The figurine stands on a round, clear acrylic base and is placed on a computer desk in a modern studio space. The figurine's materials should look premium and realistic: detailed skin, natural fabric texture, accurate paintwork, and clear, fine details, without a plastic or toy-like appearance. Next to the table is a real-life version of the same man, wearing the same clothing as in the reference photo. He carefully cleans the figurine with a fine brush, leaning slightly toward it, with an attentive and focused expression. The composition should emphasize the contrast between the real man and his miniature commercial figurine. The setting is a stylish, modern studio room with bright, soft lighting. In the background, shelves displaying a collection of toys, figurines, and decorative items are visible. The background is slightly blurred to keep the main focus on the figurine and the man. The atmosphere is premium, creative, and collectible, reminiscent of a professional advertising shoot for a brand of designer figurines. Ultra-realistic texture, highly detailed, 8K, cinematic soft light, realistic shadows, professional product photography, no plastic textures, no CGI
```

#### `figurine-v2` — Figurine V2

- **Category:** 3d-characters
- **Model:** NANO_BANANA_2
- **Description:** Hyper-realistic commercial scene with a 1/7th-scale collectible figurine beside the real subject

```
Use a reference photo to create a hyper-realistic commercial scene featuring a 1/7th scale collectible action figure based on the uploaded image. The main subject is a realistic miniature figurine of the same man from the reference photo, accurately reproducing his appearance, facial features, hairstyle, body proportions, pose, and clothing. The figurine stands on a round, clear acrylic base and is placed on a computer desk in a modern studio space. The figurine's materials should look premium and realistic: detailed skin, natural fabric texture, accurate paintwork, and clear, fine details, without a plastic or toy-like appearance. Next to the table is a real-life version of the same man, wearing the same clothing as in the reference photo. He carefully cleans the figurine with a fine brush, leaning slightly toward it, with an attentive and focused expression. The composition should emphasize the contrast between the real man and his miniature commercial figurine. The setting is a stylish, modern studio room with bright, soft lighting. In the background, shelves displaying a collection of toys, figurines, and decorative items are visible. The background is slightly blurred to keep the main focus on the figurine and the man. The atmosphere is premium, creative, and collectible, reminiscent of a professional advertising shoot for a brand of designer figurines. Ultra-realistic texture, highly detailed, 8K, cinematic soft light, realistic shadows, professional product photography, no plastic textures, no CGI
```

#### `figurine-v3` — Figurine V3

- **Category:** 3d-characters
- **Model:** SEEDREAM_4_5
- **Description:** Hyper-realistic chibi collectible figurine product photo on a wooden table with graffiti backdrop

```
A hyper-realistic promotional product photo of a small collectible figurine, positioned vertically on a wooden table with a distinctive natural texture. The figurine is fully visible and central to the composition. The figurine is based on the character from the attached image and is executed in a charming chibi style: an enlarged head, compact body proportions, expressive facial features, and a recognizable appearance. The character is depicted in a dynamic pose against a brick wall covered in colorful graffiti.nnThe figurine accurately replicates the appearance, pose, clothing, hairstyle, and key features of the character from the attached image. The detailed plastic figurine looks like a genuine premium collectible souvenir with its precise paint job and matte and slightly glossy surfaces.nnThe composition is reminiscent of a professional advertising shoot for a limited edition collection. The figurine is the main focus of the shot. A blurred brick wall with bright street graffiti elements is visible in the background.nnSoft natural lighting from the side, subtle highlights on the figurine, realistic contact shadows on the table, a warm, cozy atmosphere. Shallow depth of field, sharp focus on the figurine, smooth artistic background blur, the effect of a professional 50mm lens. Maximum photorealism, realistic materials and textures, high detail, commercial product photography, 8K quality, no unnecessary objects, text, watermarks, or visual defects.
```

#### `figurine-v4` — Figurine V4

- **Category:** 3d-characters
- **Model:** NANO_BANANA_2
- **Description:** Hyper-realistic chibi collectible figurine product photo on a wooden table with graffiti backdrop

```
A hyper-realistic promotional product photo of a small collectible figurine, positioned vertically on a wooden table with a distinctive natural texture. The figurine is fully visible and central to the composition. The figurine is based on the character from the attached image and is executed in a charming chibi style: an enlarged head, compact body proportions, expressive facial features, and a recognizable appearance. The character is depicted in a dynamic pose against a brick wall covered in colorful graffiti.nnThe figurine accurately replicates the appearance, pose, clothing, hairstyle, and key features of the character from the attached image. The detailed plastic figurine looks like a genuine premium collectible souvenir with its precise paint job and matte and slightly glossy surfaces.nnThe composition is reminiscent of a professional advertising shoot for a limited edition collection. The figurine is the main focus of the shot. A blurred brick wall with bright street graffiti elements is visible in the background.nnSoft natural lighting from the side, subtle highlights on the figurine, realistic contact shadows on the table, a warm, cozy atmosphere. Shallow depth of field, sharp focus on the figurine, smooth artistic background blur, the effect of a professional 50mm lens. Maximum photorealism, realistic materials and textures, high detail, commercial product photography, 8K quality, no unnecessary objects, text, watermarks, or visual defects.
```

### Sculptures

#### `carved-stone` — Carved Stone

- **Category:** sculptures
- **Model:** DEFAULT_MODEL
- **Description:** Museum-quality carved white marble portrait sculpture with authentic stone texture and classical craftsmanship

```
Preserve the uploaded person's identity exactly. Create a 64K ultra-DSLR museum-quality carved stone portrait of the uploaded person, shown from the chest up with a calm, dignified, and serene expression. Maintain their exact facial features, hairstyle, skin tone (translated naturally into stone form), facial structure, age, and any distinctive characteristics, ensuring they remain instantly recognizable.nnSculpt the entire portrait from premium white marble or finely carved natural stone, featuring authentic marble veining, realistic stone grain, subtle mineral variations, delicate surface cracks, gentle weathering, smooth chisel marks, and expertly polished planes. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, earrings, hats, or jewelry—should be faithfully recreated as beautifully hand-carved stone elements that integrate seamlessly into the sculpture.nnIlluminate the sculpture with soft museum-quality lighting that accentuates the marble veins, carved details, polished surfaces, and subtle textures. Use gentle rim lighting, realistic ambient shadows, shallow depth of field, and a clean gallery-style background to create a timeless, majestic atmosphere.nnHyper-realistic stone sculpture, masterful classical craftsmanship, Renaissance-inspired marble artistry, ultra-detailed textures, photorealistic museum photography, premium sculptural quality, cinematic lighting, extraordinary realism, 64K resolution, no text, no logos, no watermarks, and no visual defects.
```

#### `marble` — Marble

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Museum-quality white marble statue portrait with authentic veining and classical Renaissance craftsmanship

```
Preserve the uploaded person's identity exactly. Create a 64K ultra-DSLR museum-quality Marble Statue portrait of the uploaded person, shown from the chest up with a calm, dignified, and serene expression. Maintain their exact facial features, hairstyle, skin tone (translated naturally into stone form), facial structure, age, and any distinctive characteristics, ensuring they remain instantly recognizable.nnSculpt the entire portrait from premium white marble or finely carved natural stone, featuring authentic marble veining, realistic stone grain, subtle mineral variations, delicate surface cracks, gentle weathering, smooth chisel marks, and expertly polished planes. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, earrings, hats, or jewelry—should be faithfully recreated as beautifully hand-carved stone elements that integrate seamlessly into the sculpture.nnIlluminate the sculpture with soft museum-quality lighting that accentuates the marble veins, carved details, polished surfaces, and subtle textures. Use gentle rim lighting, realistic ambient shadows, shallow depth of field, and a clean gallery-style background to create a timeless, majestic atmosphere.nnHyper-realistic stone sculpture, masterful classical craftsmanship, Renaissance-inspired marble artistry, ultra-detailed textures, photorealistic museum photography, premium sculptural quality, cinematic lighting, extraordinary realism, 64K resolution, no text, no logos, no watermarks, and no visual defects.
```

#### `black-granite` — Black Granite

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Museum-quality black granite portrait sculpture with polished stone texture and classical craftsmanship

```
Preserve the uploaded person's identity exactly. Create a 64K ultra-DSLR museum-quality Black granite portrait sculpture of the uploaded person, shown from the chest up with a calm, dignified, and serene expression. Maintain their exact facial features, hairstyle, skin tone (translated naturally into stone form), facial structure, age, and any distinctive characteristics, ensuring they remain instantly recognizable.nnSculpt the entire portrait from premium white marble or finely carved natural stone, featuring authentic marble veining, realistic stone grain, subtle mineral variations, delicate surface cracks, gentle weathering, smooth chisel marks, and expertly polished planes. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, earrings, hats, or jewelry—should be faithfully recreated as beautifully hand-carved stone elements that integrate seamlessly into the sculpture.nnIlluminate the sculpture with soft museum-quality lighting that accentuates the marble veins, carved details, polished surfaces, and subtle textures. Use gentle rim lighting, realistic ambient shadows, shallow depth of field, and a clean gallery-style background to create a timeless, majestic atmosphere.nnHyper-realistic stone sculpture, masterful classical craftsmanship, Renaissance-inspired marble artistry, ultra-detailed textures, photorealistic museum photography, premium sculptural quality, cinematic lighting, extraordinary realism, 64K resolution, no text, no logos, no watermarks, and no visual defects.
```

#### `weathered-limestone` — Weathered Limestone

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Majestic weathered limestone sculpture with porous ivory stone texture and refined museum display

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into a majestic weathered limestone sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, and distinctive characteristics while faithfully translating them into expertly carved limestone.nnSculpt the entire figure from authentic weathered limestone with warm ivory, cream, and pale beige tones. The stone should display realistic limestone grain, natural mineral deposits, porous textures, subtle fossil-like inclusions, gentle colour variation, and authentic surface weathering. Include fine hairline cracks, softened edges, tiny chips, shallow pitting, delicate erosion, subtle tool marks, and naturally aged patina while keeping the sculpture elegant and highly detailed.nnCarefully sculpt every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses or jewellery—using refined hand-carved stone craftsmanship. Preserve the person's identity with realistic sculptural precision while giving the surface the appearance of centuries-old limestone.nnClothing should faithfully preserve the person's original outfit, recreated entirely as carved limestone with realistic folds, layered fabric textures, decorative details, crisp chisel work, and naturally weathered edges.nnPresent the sculpture on a simple stone pedestal in a clean, minimalist gallery or museum display with an uncluttered neutral background. The environment should remain subtle and unobtrusive, ensuring the sculpture is the sole focus of the composition.nnIlluminate the sculpture with soft diffused museum lighting that accentuates the limestone's porous texture, mineral veins, weathered surfaces, carved details, and natural depth. Use realistic contact shadows, shallow depth of field, premium product-style photography, and a clean composition.nnHyper-realistic weathered limestone sculpture, masterful stone craftsmanship, authentic porous limestone, elegant natural ageing, refined sculptural detail, premium museum photography, cinematic lighting, ultra-detailed textures, extraordinary realism, 64K resolution, no ancient ruins, no Roman architecture, no Greek columns, no temples, no outdoor scenery, no text, no logos, no watermarks, and no visual defects.
```

#### `sandstone` — Sand Stone

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Warm golden sandstone portrait sculpture with sedimentary grain and museum-quality craftsmanship

```
Preserve the uploaded person's identity exactly. Create a 64K ultra-DSLR museum-quality sandstone sculpture of the uploaded person, shown from the chest up with a calm, dignified, and serene expression. Maintain their exact facial features, hairstyle, facial structure, age, and distinctive characteristics, ensuring they remain instantly recognizable.nnSculpt the entire portrait from authentic natural sandstone featuring warm golden, tan, ochre, and light amber tones. The stone should display realistic sandstone grain, fine sedimentary layers, natural mineral banding, subtle colour variations, and a slightly rough matte texture. Include delicate chisel marks, crisp carved edges, soft weathering, tiny surface pits, fine hairline cracks, and gently worn details that reflect masterful stone craftsmanship while preserving the sculpture's elegance.nnEvery facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, earrings, hats, or jewellery—should be meticulously hand-carved from sandstone, maintaining the person's unique identity. Hair should appear as carefully sculpted layered stone strands with realistic carved texture, while facial hair should be represented through refined stone detailing.nnClothing should faithfully preserve the person's original outfit while transforming every fabric fold, seam, collar, button, accessory, and decorative element into beautifully carved sandstone with layered relief, crisp chiselling, and natural stone texture.nnPresent the sculpture on a simple sandstone pedestal against a clean neutral studio or museum-style background that keeps the focus entirely on the artwork. Avoid historical ruins, temples, columns, or elaborate scenery.nnIlluminate the sculpture with soft museum-quality lighting that enhances the warm earthy colours, sedimentary layers, carved details, natural stone grain, and realistic textures. Use gentle rim lighting, realistic contact shadows, shallow depth of field, premium gallery photography, and a clean minimalist composition.nnHyper-realistic sandstone sculpture, masterful stone carving, authentic sedimentary stone textures, warm natural earth tones, refined sculptural craftsmanship, museum-quality photography, cinematic lighting, ultra-detailed realism, premium gallery presentation, 64K resolution, no ancient ruins, no Roman architecture, no Greek columns, no temples, no outdoor scenery, no text, no logos, no watermarks, and no visual defects.
```

#### `sand-sculpture` — Sand

- **Category:** sculptures
- **Model:** DEFAULT_MODEL
- **Description:** Life-sized golden beach sand sculpture with intricate carving and shoreline setting

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into an extraordinary life-sized sand sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, age, expression, clothing, accessories, and distinctive characteristics.nnSculpt the entire figure from finely compacted golden beach sand with exceptional realism and masterful craftsmanship. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, hats, jewellery, or watches—should be intricately carved from sand while maintaining the person's unmistakable identity.nnRecreate the person's original clothing entirely in sculpted sand, capturing realistic fabric folds, seams, collars, buttons, pockets, wrinkles, layered garments, and accessories with precise hand-carved detail. The sculpture should exhibit crisp edges, delicate relief work, and finely sculpted textures that demonstrate the skill of a world-class sand artist.nnThe sand should display authentic granular texture, compacted sculpting, subtle colour variation, tiny grains, soft natural imperfections, and realistic moisture that helps hold the sculpture together. Include finely carved details, gentle tool marks, sharp contours, and intricate surface textures while avoiding excessive erosion or damage.nnPosition the sculpture naturally on smooth beach sand near the shoreline, with the ocean and sky softly blurred in the background so they complement rather than dominate the composition. The environment should remain clean and uncluttered, ensuring the sculpture is the primary focus.nnIlluminate the sculpture with warm natural sunlight that enhances the sand's texture, depth, and intricate carvings. Soft directional lighting should create realistic highlights and shadows that emphasize the fine sculptural detail. Use shallow depth of field, premium outdoor photography, natural colour grading, and a clean composition.nnHyper-realistic professional sand sculpture, authentic beach sand textures, world-class sand art craftsmanship, ultra-detailed carving, realistic granular materials, museum-quality artistic presentation, exceptional realism, soft natural lighting, premium photography, faithful identity preservation, clean composition, no crowds, no beach umbrellas, no distractions, no text, no logos, no watermarks, and no visual defects.
```

#### `bronze-cast` — Bronze

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Magnificent cast bronze sculpture with warm metallic tones, aged patina, and museum display

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into a magnificent cast bronze sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural accuracy.nnRender the entire figure as expertly cast solid bronze, showcasing authentic metallic surfaces with rich warm bronze tones, subtle golden highlights, natural oxidation, and realistic aged patina. The sculpture should display intricate cast-metal details, delicate surface variations, fine tooling marks, and the refined craftsmanship of a master bronze sculptor.nnFaithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, jewellery, hats, or watches—as beautifully sculpted bronze elements while maintaining the person's unmistakable identity. Hair should appear as individually sculpted flowing bronze strands with elegant metallic texture and depth.nnTransform the person's original clothing into cast bronze while preserving every fold, seam, button, collar, pocket, and accessory with remarkable sculptural precision. The fabric should appear translated into flowing bronze drapery with crisp edges, realistic relief, and subtle casting details.nnThe bronze surface should exhibit authentic foundry craftsmanship, including a smooth polished finish on prominent surfaces, slightly textured recessed areas, delicate cast-metal grain, realistic oxidation, soft verdigris accents in deep crevices, and gentle wear that enhances realism without obscuring detail.nnPresent the sculpture on a simple dark stone pedestal against a clean, neutral museum or gallery background that keeps the artwork as the sole focus.nnIlluminate the sculpture with soft museum-quality lighting that enhances the bronze's rich metallic reflections, polished highlights, aged patina, and intricate sculptural details. Use realistic contact shadows, subtle rim lighting, shallow depth of field, premium gallery photography, and a clean, elegant composition.nnHyper-realistic cast bronze sculpture, authentic metallic materials, masterful foundry craftsmanship, refined sculptural detail, realistic bronze patina, subtle verdigris oxidation, museum-quality professional photography, premium artistic presentation, exceptional realism, faithful identity preservation, clean composition, no historical monuments, no outdoor statues, no text, no logos, no watermarks, and no visual defects.
```

#### `jade` — Jade

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Exquisite hand-carved jade sculpture with polished translucency, mineral inclusions, and museum display

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into an exquisite hand-carved jade sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.nnSculpt the entire figure from a single piece of authentic natural jade, showcasing smooth polished surfaces, subtle translucency, realistic mineral inclusions, delicate colour gradients, and natural stone variations. The jade should exhibit rich emerald green, soft celadon, white, or pale green tones with authentic marbling, cloudy inclusions, and crystalline depth characteristic of premium jade.nnFaithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, jewellery, hats, or watches—as finely carved jade while maintaining the person's unmistakable identity. Hair should be elegantly sculpted with flowing carved strands and smooth polished contours, reflecting the meticulous craftsmanship of a master jade artisan.nnTransform the person's original clothing into beautifully carved jade, preserving every fold, seam, collar, button, pocket, and accessory. The garments should appear delicately sculpted with graceful flowing lines, crisp relief, and refined ornamental detail, while retaining the clean polished finish characteristic of hand-finished jade carvings.nnThe jade should display authentic mineral veining, subtle translucency around thinner carved sections, natural crystalline depth, smooth rounded edges, flawless polishing, and intricate hand-carved details. The sculpture should convey elegance, luxury, and timeless artistry while remaining completely faithful to the person's identity.nnPresent the sculpture on a simple polished black stone pedestal against a clean, neutral museum or gallery background, allowing the jade carving to remain the sole focus of the composition.nnIlluminate the sculpture with soft museum-quality lighting that gently passes through the thinner edges of the jade, revealing its natural translucency, internal mineral structure, and polished surfaces. Use subtle rim lighting, realistic contact shadows, shallow depth of field, premium gallery photography, and a refined minimalist composition.nnHyper-realistic jade carving, authentic nephrite or jadeite material, masterful gemstone craftsmanship, premium polished finish, realistic translucency, natural mineral inclusions, luxurious sculptural artistry, museum-quality professional photography, exceptional realism, faithful identity preservation, clean composition, no historical temples, no ornate backgrounds, no text, no logos, no watermarks, and no visual defects.
```

#### `ivory` — Ivory

- **Category:** sculptures
- **Model:** DEFAULT_MODEL
- **Description:** Exquisite ivory-inspired carved sculpture with creamy faux ivory finish and museum display

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into an exquisite ivory-inspired carved sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.nnSculpt the entire figure from luxurious faux ivory, featuring a warm creamy-white colour with subtle ivory tones, a smooth satin finish, delicate natural-looking grain, gentle ageing, and soft lustre. The material should resemble finely carved antique ivory while clearly appearing as an artistic, non-animal material.nnFaithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), and accessories such as glasses, jewellery, hats, or watches—as beautifully hand-carved ivory-inspired elements while maintaining the person's unmistakable identity. Hair should consist of elegant flowing carved strands with refined detailing and polished contours.nnTransform the person's original clothing into intricately carved faux ivory, preserving every fold, seam, collar, button, pocket, and decorative element with exceptional craftsmanship. The garments should display graceful relief carving, crisp detailing, and refined ornamental textures while maintaining a smooth polished finish.nnThe sculpture should exhibit master artisan craftsmanship with delicate relief work, refined carving depth, smooth rounded edges, subtle engraved details, and a premium polished surface. The material should possess a gentle translucent quality under light, adding depth and elegance without appearing like plastic or stone.nnPresent the sculpture on a simple dark wooden or black stone pedestal against a clean neutral museum-style background that keeps the sculpture as the sole focus.nnIlluminate the sculpture with soft museum-quality lighting that enhances the warm creamy tones, polished surfaces, delicate carved details, and subtle translucency of the faux ivory. Use gentle rim lighting, realistic contact shadows, shallow depth of field, premium gallery photography, and a refined minimalist composition.nnHyper-realistic ivory-inspired sculpture, masterful artisan carving, luxurious faux ivory material, elegant polished finish, refined ornamental craftsmanship, museum-quality professional photography, exceptional realism, faithful identity preservation, clean composition, no real animal ivory, no ornate historical backgrounds, no text, no logos, no watermarks, and no visual defects.
```

#### `crystal` — Crystal

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Hand-carved colored crystal sculpture with transparency, refraction, and gemstone-inspired brilliance

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into a breathtaking hand-carved crystal sculpture, preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.nnSculpt the entire figure from a single block of premium colored crystal, faithfully recreating every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—while maintaining the person's unmistakable identity. Every detail should be expertly carved with crisp precision and elegant craftsmanship.nnThe sculpture should be carved from a single piece of premium crystal in a randomly selected gemstone-inspired color. Each generation should use a unique crystal color while maintaining realistic transparency, subtle natural color variation, internal refractions, crystalline depth, brilliant reflections, delicate light dispersion, and flawlessly polished surfaces.nnRecreate the person's original clothing entirely in crystal while preserving every fold, seam, collar, button, pocket, wrinkle, layered garment, and accessory. The flowing forms should appear elegantly sculpted with refined contours, polished surfaces, and intricate craftsmanship that captures the beauty of precision crystal carving.nnThe sculpture should display authentic crystal characteristics, including brilliant reflections, realistic optical distortion through thicker sections, subtle internal inclusions, sparkling highlights, finely beveled edges, smooth polished contours, and natural light refraction that enhances the richness of the colored crystal.nnPresent the sculpture against a clean, minimalist background that keeps the crystal artwork as the sole focus. The composition should be elegant and uncluttered, allowing the crystal's transparency, color, and brilliance to dominate the image.nnIlluminate the sculpture with carefully positioned studio lighting that maximizes realistic reflections, refractions, color brilliance, internal sparkle, and shimmering highlights throughout the crystal. Use realistic contact shadows, shallow depth of field, premium professional photography, elegant composition, and photorealistic rendering that showcases the crystal's extraordinary optical beauty.nnHyper-realistic colored crystal sculpture, authentic transparent crystal material, masterful crystal craftsmanship, vibrant gemstone-inspired colors, exceptional optical realism, polished crystal surfaces, realistic light refraction, brilliant reflections, sparkling highlights, luxurious artistic presentation, premium studio photography, faithful identity preservation, clean minimalist composition, no fantasy magic, no glowing energy effects, no text, no logos, no watermarks, and no visual defects.
```

#### `ice` — Ice

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Life-sized hand-carved ice sculpture with crystal-clear frozen texture and winter setting

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into a breathtaking hand-carved ice sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.nnSculpt the entire person as a magnificent life-sized ice sculpture in a natural standing, sitting, walking, or expressive pose that complements their appearance. Faithfully recreate every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—while maintaining the person's unmistakable identity.nnThe sculpture should be carved from a single block of pristine crystal-clear ice or naturally tinted ice, with the ice color chosen randomly for each generation. Each image should feature a unique icy hue, such as crystal clear, icy blue, frosted white, turquoise, pale emerald, lavender, soft pink, golden champagne, or other realistic frozen tones. The ice should exhibit exceptional transparency, subtle translucency, delicate internal frost patterns, trapped air bubbles, natural crystalline textures, and beautifully polished carved surfaces.nnRecreate the person's original clothing entirely in ice while preserving every fold, seam, collar, button, pocket, wrinkle, layered garment, and accessory with remarkable sculptural detail. Clothing should appear elegantly carved with flowing contours and crisp edges while retaining the unmistakable appearance of solid ice.nnThe sculpture should display authentic ice characteristics, including razor-sharp carved edges, smooth polished surfaces, realistic frozen textures, subtle internal cracks, delicate frost along selected edges, naturally trapped bubbles, intricate crystalline formations, and convincing light refraction through thicker sections. The sculpture should appear freshly carved, perfectly preserved, and remarkably lifelike.nnPosition the sculpture outdoors on a clean snow-covered surface or a simple ice pedestal with a softly blurred winter landscape in the background. The environment should remain uncluttered so the sculpture is the unmistakable focal point.nnIlluminate the sculpture with soft natural winter light or cool studio lighting that enhances transparency, reflections, internal refractions, shimmering highlights, and crystalline detail. Use realistic contact shadows, shallow depth of field, premium professional photography, elegant composition, and photorealistic rendering that emphasizes the beauty of carved ice.nnHyper-realistic hand-carved ice sculpture, authentic frozen materials, exceptional ice carving craftsmanship, realistic crystalline textures, polished transparent ice, subtle frost patterns, natural light refraction, premium professional photography, faithful identity preservation, elegant composition, no fantasy magic, no glowing energy effects, no text, no logos, no watermarks, and no visual defects.
```

#### `metal` — Metal

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Life-sized handcrafted metal sculpture with random premium finishes and realistic reflections

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into an extraordinary handcrafted metal sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.nnSculpt the entire person as a life-sized metal artwork in a natural standing, sitting, walking, or expressive pose that complements their appearance. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—should be meticulously sculpted while maintaining the person's unmistakable identity.nnThe sculpture should be crafted from a randomly selected premium metal, with each generation featuring a different realistic metal finish. Materials may include polished stainless steel, brushed aluminum, forged iron, polished chrome, titanium, copper, brass, blackened steel, weathered steel, gunmetal, or other authentic metals. The surface should display realistic metallic reflections, subtle natural imperfections, machining marks, brushed grain, polished finishes, oxidation where appropriate, and exceptional craftsmanship.nnRecreate the person's original clothing entirely in metal while preserving every fold, seam, collar, button, pocket, wrinkle, layered garment, and accessory with remarkable sculptural detail. Flowing garments should appear elegantly formed from solid metal while maintaining realistic contours and intricate craftsmanship.nnThe sculpture should exhibit authentic metal characteristics, including crisp edges, precision detailing, smooth polished surfaces, brushed textures, realistic welds or cast details where appropriate, subtle surface wear, fine machining marks, and convincing metallic reflections. The chosen metal should appear solid, weighty, and expertly crafted.nnPresent the sculpture in a clean, minimalist environment that keeps the artwork as the unmistakable focal point. The background should remain simple and uncluttered.nnIlluminate the sculpture with professional studio lighting that enhances metallic reflections, surface texture, polished highlights, and realistic shadows. Use shallow depth of field, elegant composition, premium professional photography, and photorealistic rendering that showcases the beauty of the chosen metal.nnHyper-realistic handcrafted metal sculpture, authentic metallic materials, master artisan craftsmanship, realistic reflections, polished and brushed metal finishes, exceptional sculptural detail, premium professional photography, faithful identity preservation, elegant minimalist composition, no fantasy materials, no glowing effects, no text, no logos, no watermarks, and no visual defects.
```

#### `wood` — Wood

- **Category:** sculptures
- **Model:** NANO_BANANA_2
- **Description:** Life-sized hand-carved wooden sculpture with random hardwood grain and artisan finish

```
Preserve the uploaded person's identity exactly. Transform the uploaded person into an extraordinary hand-carved wooden sculpture, faithfully preserving their recognizable facial features, hairstyle, facial structure, expression, age, clothing, accessories, and distinctive characteristics with exceptional sculptural precision.nnSculpt the entire person as a life-sized wooden artwork in a natural standing, sitting, walking, or expressive pose that complements their appearance. Every facial feature—including the eyes, nose, lips, ears, eyebrows, hairstyle, facial hair (if present), clothing, and accessories—should be meticulously carved while maintaining the person's unmistakable identity.nnThe sculpture should be carved from a randomly selected premium hardwood, with each generation featuring a different authentic wood species. Materials may include rich walnut, golden oak, mahogany, teak, maple, cherry, ebony, cedar, olive wood, rosewood, or other realistic hardwoods. The wood should display beautiful natural grain patterns, subtle color variations, growth rings, knots where appropriate, and the unique character of genuine timber.nnRecreate the person's original clothing entirely in carved wood while preserving the realistic design, fit, tailoring, and construction of the garments. Every fold, seam, collar, button, zipper, pocket, cuff, wrinkle, layered garment, and accessory should be faithfully reproduced with exceptional sculptural precision. The clothing should retain the appearance of real garments while clearly being carved from solid wood, displaying continuous natural wood grain, subtle chisel marks, refined carved textures, and master artisan craftsmanship.nnThe sculpture should exhibit authentic wood carving characteristics, including finely carved details, realistic wood grain flowing naturally across the form, subtle chisel marks, delicate gouge textures, smooth hand-sanded surfaces, gently rounded edges, and a premium hand-finished appearance. The wood should look solid, warm, and expertly crafted, with a soft satin or lightly polished finish that enhances its natural beauty.nnPresent the sculpture in a clean, minimalist setting that keeps the artwork as the unmistakable focal point. The background should remain simple and uncluttered.nnIlluminate the sculpture with soft natural or studio lighting that enhances the wood grain, carved textures, warm tones, and sculptural depth. Use realistic contact shadows, shallow depth of field, elegant composition, premium professional photography, and photorealistic rendering that highlights the craftsmanship and organic beauty of the wood.nnHyper-realistic hand-carved wooden sculpture, authentic natural hardwood, master woodcarving craftsmanship, realistic wood grain, intricate carved details, subtle chisel marks, premium hand-finished surface, exceptional realism, professional photography, faithful identity preservation, elegant minimalist composition, no painted wood, no fantasy materials, no text, no logos, no watermarks, and no visual defects.
```

### Anime & Manga

#### `anime` — Anime

- **Category:** anime-manga
- **Model:** DEFAULT_MODEL
- **Description:** Anime-style cartoon

```
Make this an anime cartoon, maintaining poster and facial features
```

---

## Disabled (LEGACY_STYLES)

#### `coloured_pencil` — Coloured Pencil *(disabled)*

- **Category:** caricatures
- **Model:** SEEDREAM_4
- **Description:** Colored pencil caricature rendered with premium stylized shading

```
Make this an Exaggerated 3d cartoon caricature
```

---

## Prompt tips

- **Short prompts** work for many cartoon/art styles (`make this a …`).
- **Caricatures** use longer, structured prompts (likeness, exaggeration, medium, background).
- **Multi-subject** styles (`impasto`, ukiyo-e masters) mention detecting all faces/subjects.
- **Composition:** many prompts end with `Full-bleed composition. No borders.`
- **Catalog placeholders** (160 styles, `enabled: false`) use auto-generated placeholder prompts until you replace them in `LEGACY_STYLES`.
