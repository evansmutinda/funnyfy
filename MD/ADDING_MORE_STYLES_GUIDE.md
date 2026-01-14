# Guide: Adding More Styles to FunnyFy

## Current Status

You currently have **17 styles** configured. This guide shows you how to easily add more styles to compete with other apps.

---

## How Styles Work in Your App

### The Good News
- ✅ **Styles are server-side** - Add them in `api/styles-config.ts`
- ✅ **No app update needed** - New styles appear instantly via `/api/styles` endpoint
- ✅ **Easy to add** - Just add a new entry to the `STYLES_CONFIG` object
- ✅ **Can enable/disable** - Use `enabled: false` to temporarily disable styles

### The Process
1. Add style to `api/styles-config.ts`
2. Deploy to Vercel (or it auto-deploys)
3. App fetches new styles from `/api/styles` endpoint
4. Users see new styles immediately!

---

## Popular Style Ideas (Based on Other Apps)

Here are popular style categories that work well for caricature apps:

### Art Styles
- **Oil Painting** ✅ (you have this)
- **Watercolor** ✅ (you have this)
- **Pencil Sketch** (classic drawing style)
- **Charcoal Drawing** (dark, dramatic)
- **Pastel Art** (soft, colorful)
- **Acrylic Painting** (bold, vibrant)
- **Ink Drawing** (clean lines, high contrast)
- **Pop Art** (Warhol-style, vibrant colors)

### Digital/3D Styles
- **3D Clay** ✅ (you have this)
- **Low-Poly** ✅ (you have this)
- **3D Render** (realistic 3D)
- **Voxel Art** (Minecraft-style blocks)
- **Stylized 3D** (Fortnite/Roblox style)
- **CGI Animation** (Pixar/Toy Story style)

### Cartoon/Anime
- **90s Cartoon** ✅ (you have this)
- **Anime** ✅ (you have this)
- **Chibi** ✅ (you have this)
- **Pixar-like** ✅ (you have this)
- **Disney Classic** (old Disney animation)
- **Modern Cartoon** (Rick and Morty style)
- **Manga** (Japanese comic style)
- **Super Deformed** (exaggerated chibi)

### Specialized Styles
- **Neon** ✅ (you have this)
- **Funko Pop** ✅ (you have this)
- **Oil Paint** ✅ (you have this)
- **Hand-Drawn** ✅ (you have this)
- **Stained Glass** (church window style)
- **Mosaic** (tile art)
- **Origami** (paper folding)
- **Paper Cutout** (flat, layered)

### Character Themes
- **Superhero** ✅ (you have this)
- **Super Villain** ✅ (you have this)
- **Cyborg** ✅ (you have this)
- **Neanderthal** ✅ (you have this)
- **Wizard/Mage** (fantasy)
- **Pirate** (adventure)
- **Robot** (mechanical)
- **Alien** (sci-fi)

---

## How to Add a New Style

### Step 1: Open `api/styles-config.ts`

This file contains all your styles. Each style has:
- `id`: Unique identifier (lowercase, use hyphens)
- `label`: Display name users see
- `description`: What the style does
- `prompt`: The AI prompt (this is the magic!)
- `model`: Which AI model to use
- `enabled`: Whether to show it (true/false)
- `premium`: Whether it's premium-only (optional)

### Step 2: Add Your New Style

Add a new entry to the `STYLES_CONFIG` object. Here's the format:

```typescript
'style-id': {
  id: 'style-id',
  label: 'Style Name',
  description: 'What this style does',
  prompt: 'Your AI prompt here',
  model: 'black-forest-labs/flux-kontext-pro', // or 'google/nano-banana'
  enabled: true,
  premium: false
},
```

### Step 3: Example - Adding a New Style

Let's say you want to add a "Pencil Sketch" style:

```typescript
'pencil-sketch': {
  id: 'pencil-sketch',
  label: 'Pencil Sketch',
  description: 'Classic pencil drawing with shading and detail',
  prompt: 'Transform this into a detailed pencil sketch caricature. Use graphite pencil technique with realistic shading, cross-hatching, and fine lines. Maintain facial features while exaggerating distinctive characteristics. Style: traditional pencil art, high contrast, detailed shading, realistic proportions with caricature exaggeration. Black and white or subtle sepia tones. Background: minimal, light gray or white.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### Step 4: Deploy

After saving the file:
- If using Vercel with auto-deploy: Just commit and push to GitHub
- If manual: Deploy via Vercel dashboard or CLI
- The app will automatically fetch new styles from `/api/styles`

---

## Popular Styles to Add (Ready-to-Use Templates)

Here are some popular styles you can copy-paste directly:

### 1. Disney Classic Animation

```typescript
'disney-classic': {
  id: 'disney-classic',
  label: 'Disney Classic',
  description: 'Classic Disney animation style from the golden age',
  prompt: 'Transform this into a Disney classic animation style caricature. Smooth, hand-drawn animation aesthetic from 1930s-1950s Disney films. Soft, rounded features, expressive eyes, fluid lines. Maintain facial likeness while applying Disney character design principles. Warm, vibrant colors. Clean animation lines. Background: simplified, painted background typical of Disney feature films.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### 2. Pop Art (Warhol Style)

```typescript
'pop-art': {
  id: 'pop-art',
  label: 'Pop Art',
  description: 'Bold, vibrant Pop Art style with high contrast',
  prompt: 'Transform this into a Pop Art caricature in the style of Andy Warhol. Bold, flat colors, high contrast, simplified shapes. Use vibrant, saturated colors (bright reds, blues, yellows). Strong black outlines. Maintain facial features while simplifying and exaggerating. Background: solid bold color or repeating patterns. Overall: iconic, graphic design aesthetic.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### 3. Stained Glass

```typescript
'stained-glass': {
  id: 'stained-glass',
  label: 'Stained Glass',
  description: 'Medieval stained glass window style',
  prompt: 'Transform this into a stained glass window caricature. Medieval cathedral stained glass style. Black leading lines separating colored glass panels. Bold, vibrant jewel tones (deep reds, blues, greens, purples). Maintain facial features outlined in black leading. Simplify features into geometric shapes. Background: additional stained glass patterns or geometric designs. Overall: colorful, translucent glass effect with strong black outlines.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### 4. Paper Cutout

```typescript
'paper-cutout': {
  id: 'paper-cutout',
  label: 'Paper Cutout',
  description: 'Flat, layered paper art style',
  prompt: 'Transform this into a paper cutout caricature. Flat, 2D paper art style with visible layers and depth. Bold, solid colors. Simplified shapes cut from colored paper. Slight shadow between layers for depth. Maintain facial features while simplifying into geometric paper shapes. Clean, sharp edges like cut paper. Background: layered paper background in complementary colors. Overall: crafty, handmade aesthetic.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### 5. Voxel Art (Minecraft Style)

```typescript
'voxel-art': {
  id: 'voxel-art',
  label: 'Voxel Art',
  description: 'Blocky, pixelated 3D Minecraft-style art',
  prompt: 'Transform this into a voxel art caricature. Minecraft-style blocky 3D aesthetic. Cubic, pixelated structure. Maintain facial features using voxel blocks. Low-resolution blocky appearance. Bright, saturated colors typical of voxel games. Isometric perspective. Background: voxel block environment or simple colored blocks. Overall: digital, game-like aesthetic with visible cubes and blocks.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### 6. Manga Style

```typescript
'manga': {
  id: 'manga',
  label: 'Manga',
  description: 'Japanese manga comic book style',
  prompt: 'Transform this into a manga-style caricature. Japanese manga comic book aesthetic. Expressive, large eyes. Dramatic hair with sharp, stylized lines. Bold black outlines. Screen tones for shading. Maintain facial likeness while applying manga character design. High contrast black and white with occasional color accents. Background: manga-style speed lines or simple patterns. Overall: dynamic, expressive comic book style.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### 7. Pastel Art

```typescript
'pastel-art': {
  id: 'pastel-art',
  label: 'Pastel Art',
  description: 'Soft, dreamy pastel drawing style',
  prompt: 'Transform this into a soft pastel art caricature. Dreamy, soft pastel drawing style. Gentle, muted colors (soft pinks, blues, yellows, greens). Blended, smooth color transitions. Soft edges and gentle shading. Maintain facial features with soft exaggeration. Chalky, matte texture like pastel crayons. Light, airy feel. Background: soft pastel colors or gentle gradients. Overall: dreamy, romantic aesthetic with soft textures.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### 8. Ink Drawing

```typescript
'ink-drawing': {
  id: 'ink-drawing',
  label: 'Ink Drawing',
  description: 'Bold ink illustration with cross-hatching',
  prompt: 'Transform this into an ink drawing caricature. Traditional pen and ink illustration style. Bold black ink lines. Cross-hatching and stippling for shading. High contrast black and white. Fine, detailed linework. Maintain facial features with bold ink outlines. Clean, precise lines. Background: minimal or subtle ink patterns. Overall: classic, editorial illustration style with strong contrasts.',
  model: 'black-forest-labs/flux-kontext-pro',
  enabled: true,
  premium: false
},
```

### 9. Robot/Mech Style

```typescript
'robot-mech': {
  id: 'robot-mech',
  label: 'Robot Mech',
  description: 'Mechanical robot transformation maintaining human features',
  prompt: 'Transform this person into a mechanical robot caricature. Cybernetic, robotic transformation while maintaining recognizable facial features. Metallic surfaces with visible joints and panels. Mechanical details like gears, wires, and circuits. Futuristic robot aesthetic. Maintain face structure but reinterpret as robotic. Chrome, silver, and blue color palette. Background: futuristic city or tech environment. Overall: sci-fi mechanical transformation.',
  model: 'google/nano-banana',
  enabled: true,
  premium: false
},
```

### 10. Wizard/Fantasy

```typescript
'wizard-fantasy': {
  id: 'wizard-fantasy',
  label: 'Wizard',
  description: 'Fantasy wizard or mage transformation',
  prompt: 'Transform this person into a fantasy wizard caricature. Magical wizard character with robes, staff, and mystical elements. Maintain facial features while adding wizard characteristics (beard, hat, robes). Fantasy setting with magical atmosphere. Rich, mystical colors (purples, blues, golds). Magical effects like sparkles or energy. Background: fantasy landscape, castle, or magical realm. Overall: epic fantasy character transformation.',
  model: 'google/nano-banana',
  enabled: true,
  premium: false
},
```

---

## Tips for Creating Great Prompts

### What Makes a Good Prompt?

1. **Be Specific**: "Pencil sketch with shading" vs "drawing"
2. **Mention Style**: "Disney animation style" vs "cartoon"
3. **Include Details**: "Bold black outlines, vibrant colors"
4. **Preserve Features**: Always mention "maintain facial features" or "preserve likeness"
5. **Describe Background**: "Simple background" or "fantasy setting"
6. **Set Mood**: "Dreamy", "Bold", "Classic", "Futuristic"

### Prompt Template

Use this template for new styles:

```
Transform this [subject] into a [style name] caricature. 
[Style description - what makes it unique]
[Technical details - colors, lines, shading]
Maintain [facial features/body features] while [what to change]
[Background description]
Overall: [mood/aesthetic - one sentence summary]
```

### Example Breakdown

```
Transform this person into a Disney classic animation style caricature.
  ↑ What to do          ↑ What style
Smooth, hand-drawn animation aesthetic from 1930s-1950s Disney films.
  ↑ Style description
Soft, rounded features, expressive eyes, fluid lines.
  ↑ Technical details
Maintain facial likeness while applying Disney character design principles.
  ↑ What to preserve    ↑ What to change
Warm, vibrant colors. Clean animation lines.
  ↑ More technical details
Background: simplified, painted background typical of Disney feature films.
  ↑ Background
Overall: classic animated film aesthetic.
  ↑ Summary
```

---

## Models Available

You have two models available:

### 1. `black-forest-labs/flux-kontext-pro` (Recommended)
- **Best for**: Most styles, high quality
- **Cost**: $0.04 per generation
- **Quality**: Excellent
- **Use for**: Art styles, detailed styles, quality-focused

### 2. `google/nano-banana`
- **Best for**: Fun/quirky styles, character themes
- **Cost**: ~$0.03 per generation (estimate - verify actual cost)
- **Quality**: Good (slightly lower than flux)
- **Use for**: Character transformations, themed styles

**Recommendation**: Start with `flux-kontext-pro` for most styles. Use `nano-banana` for simpler, fun styles or if you want to save costs.

---

## Testing New Styles

After adding a style:

1. **Deploy to Vercel** (or wait for auto-deploy)
2. **Check `/api/styles` endpoint**:
   ```bash
   curl https://your-app.vercel.app/api/styles
   ```
   Should include your new style in the response

3. **Test in app**: 
   - Open app
   - Go to style selection
   - New style should appear
   - Test generating an image

4. **Verify results**:
   - Does it look good?
   - Does it maintain facial features?
   - Does it match the style description?
   - If not, refine the prompt!

---

## Organizing Styles

As you add more styles, you might want to organize them. You can:

### Option 1: Add Categories (Future Enhancement)
Group styles by category in the mobile app:
- Art Styles
- Cartoon Styles
- Character Themes
- 3D Styles

### Option 2: Mark as Premium
Some styles can be premium-only:

```typescript
'premium-style': {
  // ...
  premium: true,  // Only paid users can use this
},
```

Then in your app, filter styles based on subscription tier.

### Option 3: Disable/Enable
Temporarily disable styles:

```typescript
'experimental-style': {
  // ...
  enabled: false,  // Hide from users but keep in code
},
```

---

## Recommended Next Steps

1. **Add 5-10 popular styles** from the templates above
2. **Test each one** with different photos
3. **Refine prompts** based on results
4. **Consider grouping** similar styles together
5. **Add premium styles** for paid users
6. **Monitor usage** - which styles are most popular?

---

## Cost Considerations

Each style uses the same API cost:
- **flux-kontext-pro**: $0.04 per generation
- **nano-banana**: ~$0.03 per generation (estimate - verify actual cost)

**Adding more styles doesn't increase costs** - users still have the same monthly quota. More styles just gives them more options!

---

## Quick Reference: All Your Current Styles

You currently have:
1. 90s Cartoon ✅
2. Chibi ✅
3. Neon ✅
4. Anime ✅
5. Custom 1 ✅
6. 3D Clay ✅
7. Oil Paint ✅
8. Low-Poly ✅
9. Water Color ✅
10. Pixar-like ✅
11. Funko Pop ✅
12. Custom 2 ✅
13. Neanderthal ✅
14. Neanderthal 3D ✅
15. Hand-Drawn ✅
16. Superhero ✅
17. Super Villain ✅
18. Cyborg ✅

**Total: 17 styles**

Adding 10-15 more popular styles would bring you to **27-32 styles**, which is competitive with other apps!

---

**Last Updated:** January 2025  
**Related Files:** `api/styles-config.ts`, `api/styles.ts`

