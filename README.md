# Sohel & Bristi — engagement invitation

A mobile-first, scroll-driven engagement invitation inspired by the cinematic sage-and-ivory invitation shown in the supplied Instagram reel.

## Included

- Scroll-controlled embossed door and embroidered curtain reveal
- Arabic Bismillah with English meaning
- Photo-free illustrated hero and closing scene
- Heart-shaped finger-scratch date reveal with a short flower shower
- Scroll-scrubbed “With joyful hearts” invitation sequence
- Live countdown to 18 October 2026 at 12:00 PM (Asia/Kolkata)
- Google Calendar and downloadable `.ics` Save the Date options
- Venue presentation linked to the supplied Google Maps location
- “Jashn-E-Bahaaraa” from its opening tune, with a fixed play/pause control plus Replay and Share actions
- Responsive phone-first layout and reduced-motion support

## Edit the event details

Names, date, venue, and map URL live in [`src/config.ts`](src/config.ts). Most visible copy lives in [`src/App.tsx`](src/App.tsx).

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:4173/`.

## Production build

```bash
pnpm build
```

The static site is generated in `dist/`. Its relative asset base works from a GitHub Pages project URL such as `https://username.github.io/repository-name/`.

The soundtrack uses the supplied official SonyMusicIndia video for [“Jashn-E-Bahaaraa”](https://www.youtube.com/watch?v=4h1WFyOQv0Y), starting at `0:00` and looping through YouTube’s player API. Playback is attempted as soon as the page opens. Phones that block sound autoplay start it on the guest’s first tap, which is standard mobile-browser behavior.

## Public share link

On the published site, Share Invitation automatically shares the clean public page URL. Localhost links are deliberately blocked. If the invitation will live behind redirects or a custom domain, set `VITE_PUBLIC_URL` at build time to the final public URL; see `.env.example`.
