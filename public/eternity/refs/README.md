# Reference images → particle clouds

Drop image files here. The eternity engine samples each one's bright pixels
and spawns particles at those positions with the pixel's colour — so the
photo becomes a cloud of points that the universe morphs into.

## How to make them sample cleanly
- **Pure black background** (#000) wherever there is empty space. The sampler
  keeps bright pixels and drops black ones, so a true-black void = clean stars
  on nothing. Avoid muddy grey fog filling the frame.
- **High resolution**: ≥ 1600 px on the long edge.
- **16:9 landscape** preferred (matches the full-screen stage), JPG or PNG.
- No text, captions, watermarks, or borders.

## Images each act needs (filename → subject)

Already covered by your three references — just save them here:
- `andromeda.jpg`   — the TWO spiral galaxies meeting (reference #1)
- `nebula.jpg`      — the Pillars-of-Creation star-forming towers (reference #2)
- `protodisk.jpg`   — the protoplanetary disk with a bright central star (reference #3)

Still needed (same style, on pure black):
- `deepfield.jpg`   — many small galaxies scattered across black (a "deep field")
- `milkyway.jpg`    — one grand spiral galaxy, face-on (stands in for "now")
- `blackhole.jpg`   — an EHT-style black hole: a dark centre ringed by a bright
                      orange accretion ring, on black

Optional (only if we feature them):
- `earth.jpg`       — Earth as a blue marble on black
- `sun.jpg`         — the Sun's surface, close

The abstract early acts (Big Bang, plasma, atoms, first light, dark ages) and
the far-future acts (last star, degenerate era, heat death) are pure procedural
particles — they need no image.
