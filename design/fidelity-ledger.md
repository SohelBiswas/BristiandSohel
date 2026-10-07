# Visual fidelity ledger

Reference: the supplied reel and its matching Royal Grace mobile invitation. Generated concepts are in this folder. Final phone capture: `qa-mobile-top.png` at 390 × 844.

| Check | Concept evidence | Browser evidence | Result |
|---|---|---|---|
| Opening composition | Symmetrical embossed sage doors with a strong centre seam | The 390 × 844 render preserves the same full-screen door skeleton and seam | Matched |
| Palette and materials | Muted sage paper, ivory blossoms, antique-gold relief | Rendered asset and code-native seal retain the same colour and tactile hierarchy | Matched |
| Seal and monogram | Central ivory-gold `S B` seal | Responsive code-native `S & B` pointed plaque, inner line, and botanical wreath stay centred and remain a real button | Matched with requested motto removal |
| Opening instruction | Concept said `TAP TO OPEN` | Render says `SCROLL TO OPEN` | Intentional change requested by the user so scroll controls the reveal |
| Motion sequence | Doors lead into curtains, then the invitation hero | Mobile browser test verified doors, pearl-edged embroidered curtains, full hero, and later section reveals | Matched and functional |
| Typography | Editorial serif, calligraphy, small tracked labels | Browser uses Playfair Display, Cormorant Garamond, Great Vibes, Lora, and Noto Naskh Arabic | Matched |
| Personal copy | Sohel, Bristi, date, time, and venue | All supplied details appear in the rendered page and Maps action | Matched |
| Mobile behavior | Tall phone-first composition with touch interaction | No horizontal overflow at 390 px; 44+ px controls; scratch canvas responds to finger drags | Verified |
| Added requirement | No Arabic line in the first generated concept | Bismillah plus English meaning appears in the revealed hero | Intentional user-requested addition |
| Revised hero | Concept included an opening date line and continuation label | Date/time and `Continue` were removed; only the animated down arrow remains | Intentional user-requested change |
| Revised welcome | Original welcome was a one-time fade | Heading, ornament, invitation, names, and closing sentence now scrub into view with scroll | Intentional user-requested change |
| Date reveal | Original card used a rounded plaque and confetti | Card is now a true heart mask with a matching gold SVG frame and a finite flower shower | Intentional user-requested change |
| Timed prelude | Original moved directly from curtains to the hero | Six requested phrases now transition automatically before the engagement hero appears | Intentional user-requested addition |
| Prelude scenery | Closing page uses realistic ivory jasmine, deep foliage, brass lanterns, pink petals, and sunset light | The timed prelude now reuses the same `closing-bg.jpg` artwork with an ivory readability wash; the mismatched line-art flowers, lanterns, dotted overlays, and artificial frame were removed | Matched across opening and closing |
| Prelude lettering | Requested Great Vibes calligraphy must remain fully visible | Mobile render uses padded 1.16–1.18 line boxes and opacity/transform animation, with no clipped ascenders, descenders, or swashes | Verified |
| Date reveal depth | User requested a 3D trial for the heart and date | Layered heart edges, bevel lighting, dimensional shadows, and embossed date text render cleanly without changing scratch hit-testing | Verified |
| Countdown details | Day, date, and time were too small | Mobile render increases the Sunday/date/time block while preserving hierarchy and fit | Verified |
| Soundtrack | Original used generated ambient tones | The official Sony Music India stream for `Jashn-E-Bahaaraa` begins at 0:00, retries on first touch when autoplay is blocked, and uses a fixed speaker-only pause/play control | Intentional user-requested change |
| RSVP | Original included phone details and a WhatsApp form | RSVP row and form are absent from the final flow | Intentional user-requested removal |

Above-the-fold copy diff: `TAP TO OPEN` was changed to `SCROLL TO OPEN`; the stamp motto, opening date/time, and `Continue` label were removed; Bismillah and its English meaning remain. The event date is still revealed by scratching and appears in the countdown, calendar, venue, and closing sections.
