# Nature Sanctuary assets

Implemented September 8, 2026. The app uses locally served assets; no remote media host is required at runtime.

## Original artwork

- `public/media/sanctuary.webp`: generated with the built-in OpenAI image generation tool, then encoded as WebP (about 276 KB).
- `src/features/shell/SanctuaryMark.jsx` and `public/icon.svg`: original vector botanical sun emblem. The same mark appears at arrival, in navigation, on the tarot table, and in the app icons.
- The tarot card art keeps its existing geometric symbols and now uses forest, sage, cream, and muted gold.

Generation prompt:

> Use case: photorealistic-natural. Asset type: cinematic panoramic background photograph for an elegant wellness app called Vibe Check. Create a lush secluded nature sanctuary: an ancient woodland with soft sage ferns and deep evergreen moss framing a still reflecting pool, a little warm cream limestone at the water's edge, faint golden late-afternoon sunlight filtering through the canopy and delicate mist. Refined editorial photography for a luxury forest retreat, extraordinarily beautiful but convincingly natural. Wide landscape composition, 16:9 or wider. Trees, ferns and reflected sun on the right and perimeter, dark calm uncluttered pool and forest shade across the left half with generous room for cream interface text. Deep hunter and sage greens, muted warm gold light, warm tan stone. Tactile realistic foliage, subtle ripples. No buildings, no people, no lettering, no logo, no border, no neon, no fantasy particles. The atmosphere is peaceful, cinematic, intimate and luxurious.

## Nature film

- `public/media/forest-light.mp4`: 11-second silent H.264 loop, 960 × 540, 24 fps, about 1.4 MB. The ending crossfades into the beginning.
- Source: [Sunlight Peeking Through the Leaves of Trees in a Forest](https://www.pexels.com/video/sunlight-peeking-through-the-leaves-of-trees-in-a-forest-3493297/) by **lam loi**, Pexels, asset 3493297.
- [Pexels license](https://www.pexels.com/license/), checked September 8, 2026. The license allows app use and modification. This footage is used as background atmosphere, not as the app's mark.
- Source download: `https://videos.pexels.com/video-files/3493297/3493297-hd_1920_1080_30fps.mp4`.

`SkyField` uses the film only when requested, visible, motion is allowed, and Save Data is off. It pauses when the page is hidden, provides a play/pause control, handles autoplay rejection, and falls back to the generated image when playback fails. Check-in and Cosmos use the static artwork so focused work remains still.
