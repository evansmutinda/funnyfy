# FunnyFy — Style prompts reference

**Source of truth:** `api/_utils/styles-config.ts` → `LEGACY_STYLES`

Regenerate this file after prompt changes:

```bash
node scripts/generate-prompts-md.js
```

**Last generated:** 2026-07-10 · **71 enabled** · **1 disabled** in LEGACY_STYLES

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
- **Description:** Funko Pop style

```
make this a funko pop
```

### Anime & Manga

#### `anime` — Anime

- **Category:** anime-manga
- **Model:** DEFAULT_MODEL
- **Description:** Anime-style cartoon

```
Make this an anime cartoon, maintaining poster and facial features
```

### Video Games

#### `superhero` — Superhero

- **Category:** video-games
- **Model:** NANO_BANANA
- **Description:** Superhero caricature in action, avoiding trademarked themes, maintaining facial and body features

```
make a superhero caricature, in superhero costumes, avoid trademarked themes, set super hero actions like saving victims, stopping trains, stopping bad guys, etc. in random settings. maintain subjects facial and body features
```

#### `villian` — Super Villain

- **Category:** video-games
- **Model:** NANO_BANANA
- **Description:** Super villain caricature in action, avoiding trademarked themes, maintaining facial and body features

```
make a super villain caricature, in superhero costumes, avoid trademarked themes, set super villan actions like chasing victims, destroying stuff being bad guys, etc, in random settings. maintain subjects facial and body features
```

#### `cyborg` — Cyborg

- **Category:** video-games
- **Model:** NANO_BANANA
- **Description:** Cyborg cartoon caricature maintaining facial and body features, set in futuristic city settings

```
make a cyborg cartoon caricature, maintaining subjects facial and body features, set in futuristic random city in random settings
```

### Fantasy & Mythical

#### `neandc` — Neanderthal

- **Category:** fantasy-mythical
- **Model:** NANO_BANANA
- **Description:** Funny neanderthal cartoon maintaining facial features in a random Neanderthalic setting

```
make this a funny neanderthal cartoon maintaining facial features, in a random Neanderthalic setting
```

#### `neand3d` — Neanderthal 3D

- **Category:** fantasy-mythical
- **Model:** NANO_BANANA
- **Description:** Funny neanderthal 3D caricature maintaining facial features, detects and includes all humans

```
make this a funny neanderthal 3d caricature maintaining facial features, in a random Neanderthalic setting. detect and include all humans in the photo, caricaturize all humans once detected
```

### Trending

#### `custom1` — Custom 1

- **Category:** trending
- **Model:** DEFAULT_MODEL
- **Description:** Digital cartoon illustration with vibrant colors and proportion exaggeration

```
Using the uploaded photo as the facial reference, create a digital cartoon illustration of the same subject. Preserve the subject's recognizable facial likeness, while applying stylized, cartoon-like exaggeration. The subject is dressed in random shirt that fits snugly around a rounded torso, paired with random trousers that are slightly loose at the legs, and random shoes. His arms hang naturally by his sides, with relaxed but slightly clenched hands. The background is a bright blue sky with soft, fluffy white clouds, creating an open, cheerful atmosphere that contrasts with the subject's serious expression. Style: clean, polished contemporary digital cartoon illustration, with smooth linework, vibrant colors, and intentional proportion exaggeration (large head, simplified body). Maintain clarity, balanced proportions, and a friendly cartoon aesthetic. Full-bleed composition. No borders. No photorealism.
```

#### `custom2` — Custom 2

- **Category:** trending
- **Model:** DEFAULT_MODEL
- **Description:** Stylized 3D cartoon caricature with soft, friendly animated style - supports multiple faces

```
Using the uploaded photo as the reference, detect all clearly visible human faces in the image.Create a stylized 3D cartoon caricature of EACH person, preserving their individual facial likeness, skin tone, hairstyle, and expression.Do NOT merge faces and do NOT ignore secondary subjects. If multiple people are present:Apply the same 3D animated style consistently to all subjects, Maintain relative positions and scale between them,Keep each face distinct and recognizable,Reinterpret each person in a soft, friendly, animated 3D style with slightly exaggerated features, including: Large expressive eyes,Smooth rounded facial structure,Simplified nose and mouth,Warm, cheerful expressions,Skin should be smooth and matte, with soft lighting and no visible pores.Hair should be stylized and sculpted, with soft volume and clean shapes.Clothing should remain recognizable but simplified. Background may be simplified or softly blurred, but the relationship and interaction between subjects must be preserved.Render quality: polished 3D animated film style, clean geometry, soft shadows, warm color palette.Full-bleed composition. No borders. No photorealism.
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
- **Multi-subject** styles (`custom2`, `neand3d`, `impasto`, ukiyo-e masters) mention detecting all faces/subjects.
- **Trademark safety:** superhero/villain prompts say avoid trademarked themes.
- **Composition:** many prompts end with `Full-bleed composition. No borders.`
- **Catalog placeholders** (160 styles, `enabled: false`) use auto-generated placeholder prompts until you replace them in `LEGACY_STYLES`.
