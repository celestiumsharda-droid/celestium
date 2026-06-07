/**
 * CELESTIUM — DISCOVERIES (canonical content)
 * Single source of truth for every article. Validated against the
 * `Discovery` type — editing this file safely is one of the project's
 * core promises.
 *
 * When a CMS lands, replace this default export with a fetch:
 *   export default (await fetch('/api/discoveries').then(r => r.json())) as DiscoveryMap;
 * Nothing downstream changes.
 */

import type { DiscoveryMap } from "../engine/types";

const DISCOVERIES: DiscoveryMap = {
  "black-hole-image": {
    field: "Cosmology",
    era: "2019 CE",
    subject: "M87&#42; · 55M ly",
    kick: "Cosmology · The Discovery Series",
    title: 'We took a photograph<br>of <i>the unphotographable.</i>',
    dek: "A black hole emits no light by definition. In 2019, an Earth-sized instrument returned the first direct image of one anyway — and it looked exactly like a century-old equation said it would.",
    hero: "bh",
    heroImage: { base: "m87", w: 1280, h: 1280, alt: "The Event Horizon Telescope's 2019 image of M87*: a bright orange ring of light around a dark central shadow.", credit: "EHT Collaboration · CC BY 4.0" },
    related: ["gravitational-waves", "weighing-the-universe", "__scale"],
    depths: [
      [
        '<p><span class="lead">A</span> black hole traps light, so it cannot be seen directly. But the superheated gas swirling around one glows — and a black hole carves a dark, precisely-sized "shadow" out of that glow. In April 2019 the Event Horizon Telescope — eight radio dishes turned into one Earth-sized instrument — released the first image of that shadow, around the giant black hole in galaxy M87. Its size matched Einstein’s general relativity to within the error bars. In 2022 the same team imaged the one at the centre of our own galaxy.</p>',
        '__FIG_M87__',
        '<div class="know"><div class="kh">Why it matters</div><p>It turned a mathematical prediction from 1915 into a photograph. Nothing about the result had to come out right — and it did, exactly.</p></div>'
      ],
      [
        '<h2>The thing that cannot be seen</h2>',
        '<p><span class="lead">A</span> black hole is defined by an edge — the event horizon — past which gravity is so steep that not even light escapes. By construction it emits nothing. For most of the twentieth century, "seeing" one was treated as a contradiction in terms.</p>',
        '<p>The loophole is its surroundings. Gas spiralling inward is compressed and heated to billions of degrees, blazing across the radio spectrum. The black hole sits in front of that glow as a sharply defined dark disc — its <strong>shadow</strong> — ringed by light bent around it. General relativity predicts the shadow’s exact size from a single number: the black hole’s mass.</p>',
        '<div class="pull">If you could photograph the shadow, you could test gravity itself in the most extreme place it exists.<cite>The premise of the Event Horizon Telescope</cite></div>',
        '<h2>A telescope the size of a planet</h2>',
        '<p>The target is absurdly small on the sky — like reading a line of text in New York from a café in Paris. No single telescope is remotely large enough, so the collaboration linked radio observatories on different continents and combined their signals so they behaved as one dish nearly as wide as the Earth.</p>',
        '__FIG_EHT__',
        '<p>Each station recorded the sky against an atomic clock so precise the signals could be aligned later to a fraction of a billionth of a second. The combined data — around five petabytes — was far too large to send over the internet, so it was physically shipped on stacks of hard drives, including a set that had to wait months for Antarctic winter to end.</p>',
        '__STATS_EHT__',
        '<div class="know"><div class="kh">How we know it is real</div><p>To avoid seeing what they hoped to see, separate teams reconstructed the image independently, using different methods, without comparing notes. They converged on the same ring. The result was only announced once the independent paths agreed.</p></div>',
        '<h2>First sight, 2019</h2>',
        '<p>On 10 April 2019 the collaboration released it: a luminous ring with a dark centre, around the black hole in M87, a galaxy 55 million light-years away. The shadow’s measured size matched the prediction from general relativity for an object of that mass. In 2022, after years of extra work, they imaged Sagittarius A&#42; — the black hole at the heart of our own Milky Way.</p>',
        '__FIG_M87__',
        '<p>Two black holes, a thousandfold apart in mass, both ringed exactly as the equations demanded. A prediction made with chalk in 1915 had become a photograph.</p>'
      ],
      [
        '<h2>A prediction nobody expected to photograph</h2>',
        '<p><span class="lead">W</span>hen Einstein published general relativity in 1915, the black hole was an unwelcome consequence buried in the mathematics — a region where spacetime curves so sharply that an event horizon forms and nothing, not even light, escapes. For decades they were regarded as a theoretical curiosity; the phrase "black hole" itself did not enter common use until the late 1960s.</p>',
        '<p>By definition such an object is invisible. What is not invisible is its environment. Matter falling toward a black hole forms a hot, fast accretion flow that radiates fiercely, much of it in radio waves that pass cleanly through interstellar dust. General relativity makes a sharp prediction about that glow: light passing near the horizon is bent so severely that the black hole appears as a dark region — the shadow, about 2.6 times the diameter of the event horizon — ringed by a bright photon ring. Crucially, the shadow’s angular size depends almost entirely on one quantity: mass divided by distance.</p>',
        '<div class="pull">The shadow is not the black hole. It is the precise, calculable absence the black hole leaves in the light around it.<cite>The geometry being tested</cite></div>',
        '<h2>The resolution problem</h2>',
        '<p>The two best targets are M87&#42;, a roughly six-and-a-half-billion-solar-mass giant in galaxy M87, and Sagittarius A&#42;, the four-million-solar-mass black hole at the Milky Way’s centre. Despite their scale, both subtend only tens of microarcseconds on the sky. A telescope’s resolving power grows with its diameter — and reaching the required sharpness at radio wavelengths would demand a dish thousands of kilometres across. No such dish can be built.</p>',
        '<p>Very Long Baseline Interferometry sidesteps the problem. Take many real telescopes separated by continental distances, record the radio waves at each against an extraordinarily stable clock, and combine the recordings later. The array then resolves detail as finely as a single telescope whose diameter equals the largest separation between stations — for the Event Horizon Telescope, nearly the diameter of the Earth.</p>',
        '__FIG_EHT__',
        '<p>In practice this is brutal. Each station carries a hydrogen-maser atomic clock so streams align to a fraction of a nanosecond. Observing windows need clear weather simultaneously from Hawaii to Spain to the South Pole. And the raw output — on the order of five petabytes per campaign — is far beyond any network, so it is recorded onto physical drives and flown to central correlators. The South Pole drives could not even leave until Antarctic winter ended, delaying analysis by months.</p>',
        '__STATS_EHT__',
        '<h2>Guarding against seeing what you want</h2>',
        '<p>An image reconstructed from sparse interferometric data is not unique; the gaps must be filled algorithmically, and a motivated team could, in principle, coax the data toward an expected ring. The collaboration treated this as the central threat to the result.</p>',
        '<div class="know"><div class="kh">How we know it is real</div><p>Multiple teams were deliberately kept apart and reconstructed the image with independent pipelines and assumptions, without sharing intermediate results. Synthetic data with known answers was run through the same machinery to expose bias. Only once the independent reconstructions converged on the same ring — same size, same orientation — was the result considered sound.</p></div>',
        '<h2>The image, and what it confirmed</h2>',
        '<p>On 10 April 2019 the collaboration unveiled M87&#42;: an asymmetric ring roughly 42 microarcseconds across, brighter on one side because gas there moves toward us at nearly light speed. The measured shadow implied a mass in close agreement with independent estimates and with the size general relativity predicts for that mass. Strong-field gravity had been tested where it is most extreme, and it held.</p>',
        '__FIG_M87__',
        '<p>Sagittarius A&#42; was far harder: a thousand times less massive, its gas orbits in minutes rather than days, so the source visibly changes within a single night. It took until May 2022, and new techniques to handle that variability, to release its ring. One theory described both, across a factor of a thousand in mass.</p>',
        '<div class="pull">A claim made with chalk in 1915 had become a photograph in 2019 — and the universe had not blinked.<cite>The result</cite></div>',
        '<h2>What comes next</h2>',
        '<p>Later work resolved the polarised light around M87&#42;, mapping the magnetic fields that channel its enormous jet. The next-generation array adds dishes and frequencies, aiming to turn these stills into time-lapse movies of gas falling past the edge of reality — and to push general relativity into regimes it has never been tested in.</p>'
      ]
    ]
  },

  "gravitational-waves": {
    field: "Spacetime",
    era: "2015 CE",
    subject: "GW150914 · 1.3B ly",
    kick: "Astrophysics · The Discovery Series",
    title: 'The night we <i>heard</i><br>two black holes collide.',
    dek: "A billion years ago two black holes spiralled together and shook spacetime itself. In September 2015 that tremor reached Earth and moved a mirror by less than the width of a proton.",
    hero: "wave",
    heroImage: { base: "gravitational-waves", w: 1280, h: 720, alt: "Two black holes spiralling into a merger, bending the surrounding starlight as ripples of spacetime radiate outward.", credit: "Illustration · Celestium" },
    related: ["black-hole-image", "weighing-the-universe", "__scale"],
    depths: [
      [
        '<p><span class="lead">E</span>instein predicted that violent events should send ripples through spacetime — gravitational waves — stretching and squeezing space as they pass. They are so faint he doubted they could ever be detected. On 14 September 2015 two detectors in the United States caught one: the merger of two black holes about 1.3 billion light-years away. The wave changed each detector’s 4-kilometre arms by about a ten-thousandth the width of a proton. It opened an entirely new way to observe the universe — by listening instead of looking.</p>',
        '__FIG_LIGO__',
        '__CHIRP__',
        '<div class="know"><div class="kh">Why it matters</div><p>Every telescope in history collected light. This was the first time humanity sensed the universe through gravity itself — and confirmed a 1916 prediction in the same instant.</p></div>'
      ],
      [
        '<h2>Ripples nobody expected to catch</h2>',
        '<p><span class="lead">I</span>n 1916 Einstein showed that masses in violent, asymmetric motion should radiate energy as waves in the fabric of spacetime — alternately stretching and compressing distance itself. The effect is almost unimaginably tiny. Einstein himself doubted it would ever be measured.</p>',
        '<p>The strongest sources are cataclysms: two dense, massive objects spiralling into each other. As they merge they briefly outshine — in gravitational power — every star in the observable universe combined. Yet by the time that signal crosses cosmic distance to Earth, it distorts space by less than one part in a billion trillion.</p>',
        '<div class="pull">The merger releases more power than all the stars in the universe — and arrives as a whisper smaller than an atom.<cite>The detection challenge</cite></div>',
        '<h2>An instrument that measures almost nothing</h2>',
        '<p>LIGO answers this with two L-shaped detectors, in Washington and Louisiana, each with arms four kilometres long. A laser is split down both arms, bounced off suspended mirrors, and recombined. A passing gravitational wave lengthens one arm while shortening the other, and the recombined light shifts. The change being measured is around a ten-thousandth the diameter of a proton.</p>',
        '__FIG_LIGO__',
        '__CHIRP__',
        '__STATS_LIGO__',
        '<div class="know"><div class="kh">How we know it is real</div><p>Two detectors 3,000 km apart saw the same waveform about seven milliseconds apart — the light-travel time between them. The signal also matched, in exquisite detail, the waveform Einstein’s equations predict for two merging black holes. Noise does not do that twice, in step, on opposite sides of a continent.</p></div>',
        '<h2>14 September 2015</h2>',
        '<p>The first confirmed event, GW150914, was the merger of black holes of about 36 and 29 solar masses, roughly 1.3 billion light-years away. About three Suns’ worth of mass vanished into gravitational radiation in a fraction of a second. The discovery was announced in February 2016 and recognised with the Nobel Prize in Physics in 2017.</p>',
        '<p>Two years later, two neutron stars were caught merging — and this time telescopes around the world also saw the accompanying flash of light. Astronomy now had a second sense, and the two could be used together.</p>'
      ],
      [
        '<h2>A prediction Einstein nearly disowned</h2>',
        '<p><span class="lead">G</span>eneral relativity recasts gravity as the curvature of spacetime. A direct consequence, worked out in 1916, is that masses accelerating asymmetrically should radiate that curvature outward as waves travelling at the speed of light. For decades the idea sat in limbo — even Einstein at one point doubted the waves were physically real rather than a mathematical artefact. Indirect proof arrived in the 1970s, when a binary pulsar was observed spiralling inward at exactly the rate gravitational-wave energy loss predicts.</p>',
        '<p>A passing wave is described by a strain: the fractional change it produces in any length. For the most violent events reaching Earth, that strain is around one part in ten to the twenty-first. Over LIGO’s 4-kilometre arms that is a length change far smaller than an atomic nucleus. Building a ruler that sensitive — and trusting it — is the entire problem.</p>',
        '<div class="pull">The merger briefly outshone the universe in gravitational power, and arrived as a whisper a fraction the size of a proton.<cite>The scale of the signal</cite></div>',
        '<h2>The interferometer</h2>',
        '<p>Each LIGO observatory is a Michelson interferometer with two perpendicular 4-km arms. A laser is split into both; it reflects between suspended mirrors many times, effectively lengthening the path, then recombines at a detector. With no wave present the arms are tuned so the recombined light nearly cancels. A gravitational wave stretches one arm and shrinks the other in alternation, unbalancing that cancellation in a pattern that traces the wave itself.</p>',
        '<p>The mirrors hang on multi-stage pendulums isolating them from ground tremor; the beam travels in one of the largest vacuum systems on Earth; the laser is stabilised to extraordinary precision. Even so, the instrument is swamped by seismic, thermal and quantum noise. The signal is not so much "seen" as statistically extracted.</p>',
        '__FIG_LIGO__',
        '__CHIRP__',
        '__STATS_LIGO__',
        '<h2>Pulling a signal out of noise</h2>',
        '<p>The recovery technique is matched filtering: vast banks of theoretical waveforms — computed from general relativity for every plausible pair of masses and spins — are slid against the data, hunting for a match buried in the noise. A real astrophysical event must also appear in both widely separated detectors, with a time offset no larger than the light-travel time between them.</p>',
        '<div class="know"><div class="kh">How we know it is real</div><p>GW150914 registered in Louisiana and Washington about seven milliseconds apart, with matching waveforms, and matched a relativistic merger template to remarkable fidelity. Independent analysis pipelines, blind hardware-injection tests, and a false-alarm rate estimated at less than one per many thousands of years together made coincidental noise effectively impossible.</p></div>',
        '<h2>14 September 2015, and after</h2>',
        '<p>GW150914 was two black holes of roughly 36 and 29 solar masses merging about 1.3 billion light-years away, with around three solar masses converted into gravitational-wave energy in under a second. It was also the first direct evidence that binary black holes exist and merge. The result was announced in February 2016; Weiss, Barish and Thorne received the 2017 Nobel Prize in Physics for the detection.</p>',
        '<p>In 2017 a neutron-star merger, GW170817, was detected together with gamma rays and then light across the spectrum — the birth of multi-messenger astronomy. Detectors have since logged many more mergers, turning a once-doubted prediction into a routine new instrument for surveying the dark, violent universe.</p>',
        '<div class="pull">For the whole history of astronomy we only ever collected light. Now we can also feel the universe move.<cite>What changed</cite></div>'
      ]
    ]
  },

  "weighing-the-universe": {
    field: "Cosmology",
    era: "1933 – now",
    subject: "The cosmic budget",
    kick: "Cosmology · The Discovery Series",
    title: 'How we weighed<br>the <i>entire universe.</i>',
    dek: "We never put the cosmos on a scale. We watched how it moves and how its light bends — and discovered that 95% of what holds it together is something we have never seen.",
    hero: "web",
    heroImage: { base: "weighing-the-universe", w: 1280, h: 720, alt: "A vast cosmic web — golden galaxy clusters strung along faint blue-violet filaments of dark matter.", credit: "Illustration · Celestium" },
    related: ["black-hole-image", "gravitational-waves", "__scale"],
    depths: [
      [
        '<p><span class="lead">Y</span>ou cannot weigh a galaxy directly, so astronomers let gravity do it: the faster things orbit, the more mass must be pulling on them. Do this carefully and the visible stars and gas fall far short — galaxies behave as if wrapped in vast halos of unseen matter. Add the way light bends around clusters and the geometry of the infant universe, and the books only balance if ordinary matter is about 5% of the total, with roughly 27% "dark matter" and 68% "dark energy." We have weighed the universe with confidence — and found we cannot see almost any of it.</p>',
        '__FIG_BULLET__',
        '<div class="know"><div class="kh">Why it matters</div><p>Independent methods, using completely different physics, all demand the same invisible 95%. That agreement is why dark matter and dark energy are taken seriously rather than dismissed.</p></div>'
      ],
      [
        '<h2>Weighing without a scale</h2>',
        '<p><span class="lead">G</span>ravity is a balance you can read from a distance. Watch how fast stars circle a galaxy, or how galaxies swarm within a cluster, and Newton and Einstein let you infer the mass doing the pulling. In 1933 Fritz Zwicky did this for a cluster of galaxies and found them moving far too fast for their visible matter to hold them together. The discrepancy was so large it was largely set aside for forty years.</p>',
        '<p>In the 1970s Vera Rubin and Kent Ford measured how orbital speed changes with distance from a galaxy’s centre. It should fall off at the edges, the way outer planets orbit the Sun more slowly. Instead it stayed stubbornly flat — implying a huge, invisible halo of mass extending well beyond the visible stars.</p>',
        '<div class="pull">The stars at a galaxy’s edge move as if held by something enormous that emits no light at all.<cite>The rotation-curve problem</cite></div>',
        '<h2>Three witnesses, one verdict</h2>',
        '<p>Rotation curves alone could be a fluke of one method. They are not alone. Massive clusters bend the light of galaxies behind them — gravitational lensing — and the bending reveals far more mass than any glowing matter present. And the faint afterglow of the Big Bang, the cosmic microwave background, encodes the precise composition of the early universe in its pattern of ripples.</p>',
        '__FIG_BULLET__',
        '__STATS_COSMO__',
        '<div class="know"><div class="kh">How we know it is real</div><p>Galaxy motion, gravitational lensing, the cosmic microwave background, and the large-scale arrangement of galaxies are independent measurements relying on different physics. They converge on the same budget. A single mistaken method could be wrong; four agreeing is hard to dismiss.</p></div>',
        '<h2>And then it got stranger</h2>',
        '<p>In 1998 two teams measuring distant exploding stars found the expansion of the universe is not slowing under gravity, as expected — it is accelerating. Something with effectively negative pressure, dubbed dark energy, dominates the cosmic budget. The current accounting: about 5% ordinary matter, 27% dark matter, 68% dark energy. We have weighed everything, and identified almost none of it.</p>'
      ],
      [
        '<h2>The first crack, 1933</h2>',
        '<p><span class="lead">M</span>ass announces itself through gravity, and gravity can be measured at a distance from the motion it causes. In 1933 Fritz Zwicky applied this to the Coma cluster: from how fast its galaxies moved, the cluster needed far more mass to stay bound than its luminous matter could supply. He called the missing component dark matter. The result was striking enough, and the era’s data uncertain enough, that it was largely shelved for four decades.</p>',
        '<h2>Rotation curves</h2>',
        '<p>The decisive evidence came from spiral galaxies. Where mass is concentrated centrally — as in the Solar System — orbital speed should decline with distance from the centre. In the 1970s Vera Rubin and Kent Ford measured these speeds out to the faint edges of galaxies and found the curves flat: outer stars orbit just as fast as inner ones. The only consistent explanation is a massive, roughly spherical halo of unseen matter, several times the visible mass, dominating each galaxy’s outskirts.</p>',
        '<div class="pull">A galaxy’s visible disc turned out to be the small bright core of something far larger and entirely dark.<cite>The halo</cite></div>',
        '<h2>Independent confirmations</h2>',
        '<p>A single technique invites a single error, so the case rests on methods sharing no common assumptions. Gravitational lensing weighs a cluster by how strongly it warps the light of background galaxies, mapping mass that emits nothing — and in colliding clusters the mass is seen separated from the visible hot gas, hard to explain without dark matter. The cosmic microwave background, the relic glow from about 380,000 years after the Big Bang, carries acoustic ripples whose sizes pin down the densities of ordinary and dark matter to percent-level precision. And the present-day web of galaxies could not have grown from the early universe’s tiny fluctuations in the available time without dark matter’s extra gravity.</p>',
        '__FIG_BULLET__',
        '__STATS_COSMO__',
        '<div class="know"><div class="kh">How we know it is real</div><p>Rotation curves, cluster lensing, the microwave background, structure formation, and primordial-element abundances are independent probes resting on different physics. They do not merely permit the same answer — each separately demands it. That convergence, not any one measurement, is the foundation.</p></div>',
        '<h2>The acceleration nobody ordered</h2>',
        '<p>In 1998 two competing teams used Type Ia supernovae — exploding stars of nearly standard brightness — as distance markers across billions of light-years. They expected to measure cosmic expansion gradually slowing under gravity. Instead the distant supernovae were fainter, and so farther, than a decelerating universe allowed: the expansion is speeding up. Some component with effectively negative pressure — termed dark energy — dominates the universe and pushes it apart. The discovery earned the 2011 Nobel Prize in Physics.</p>',
        '<h2>The ledger, and the unknown</h2>',
        '<p>Stitching every line of evidence together yields a remarkably consistent budget: roughly 5% ordinary matter, 27% dark matter, 68% dark energy, stated to within a few percent. Yet we still do not know what dark matter is made of — direct-detection experiments have so far come up empty — and dark energy is less understood still. We have weighed the universe with real confidence and discovered that about 95% of it is, for now, a precise, well-measured mystery.</p>',
        '<div class="pull">We measured the whole thing to the percent — and found we have never seen 95% of what we measured.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "first-exoplanet": {
    field: "Planetary Science",
    era: "1995 CE",
    subject: "51 Pegasi b · 50 ly",
    kick: "Planetary Science · The Discovery Series",
    title: 'The night we found<br><i>a world around another sun.</i>',
    dek: "For thousands of years we wondered if other suns had other planets. We could not see them. In October 1995 two astronomers found one anyway — not by seeing it, but by watching its star wobble.",
    hero: "wobble",
    heroImage: { base: "first-exoplanet", w: 1280, h: 720, alt: "A hot-Jupiter gas giant half-lit by its nearby star, its banded storm clouds glowing.", credit: "Illustration · Celestium" },
    related: ["weighing-the-universe", "black-hole-image", "__scale"],
    depths: [
      [
        '<p><span class="lead">A</span> planet beside a star is like a firefly beside a lighthouse — a billion times fainter, swallowed in the glare. For most of history that ended the discussion. The way around it: a planet tugs on its star as much as the star tugs on it, and a heavy enough planet makes its star wobble by a few metres per second. In October 1995, Michel Mayor and Didier Queloz measured that wobble in a sun-like star fifty light-years away. The world they had found, 51 Pegasi b, was a gas giant whipping around its sun every four days — a configuration nobody had predicted. The count of known worlds has not stopped growing since.</p>',
        '__FIG_HOTJUP__',
        '<div class="know"><div class="kh">Why it matters</div><p>It answered a question philosophers had asked for two thousand years — and answered it with a planet so unlike our own that the textbook story of how solar systems form had to be rewritten.</p></div>'
      ],
      [
        '<h2>A question we could not answer</h2>',
        '<p><span class="lead">A</span>re there other worlds? Not in principle — we had inferred for decades that planets must be common. In practice: we could not point at a single one orbiting a normal star. A sun-like star is roughly a billion times brighter than the largest planet beside it, and at interstellar distances the two are an angular hair apart. Telescopes simply could not resolve them.</p>',
        '<p>The trick that broke the deadlock was indirect. A planet orbits a star, yes, but the star also orbits the planet — both circle their common centre of mass. A heavy planet close in makes its star trace out a small wobble several metres per second wide. Light coming from a wobbling star alternately shifts blue (toward us) and red (away), by a barely-detectable Doppler amount.</p>',
        '<div class="pull">Do not look for the planet. Listen for the star moving in time with one.<cite>The radial-velocity method</cite></div>',
        '<h2>The instrument</h2>',
        '<p>Building a spectrograph stable enough to feel a star moving at the speed of a fast jogger across fifty light-years is a precision problem first and an astronomy problem second. Mayor and Queloz had spent years building one — ELODIE, at the Haute-Provence Observatory in southern France — that could resolve velocities of about 13 metres per second. It was meant for stellar physics. They pointed it at a list of sun-like stars in 1994, expecting nothing dramatic.</p>',
        '__STATS_EXO__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The wobble had to repeat on a perfectly regular schedule and could not match any known stellar oscillation. Within days of the announcement, Geoff Marcy and Paul Butler in California pointed their own spectrograph at 51 Pegasi and recovered the same signal independently. Two unrelated instruments, two continents, one wobble.</p></div>',
        '<h2>October 1995</h2>',
        '<p>One of the stars on the list — 51 Pegasi, an unremarkable sun-like star fifty light-years away in the constellation Pegasus — was tugging with a perfect 4.23-day rhythm. The planet implied by that tug, 51 Pegasi b, was about half the mass of Jupiter and orbiting at a twentieth of Earth’s distance from the Sun, so close it would be roasting at over a thousand degrees.</p>',
        '<p>Nothing in the standard theory of planet formation expected a gas giant there. Gas giants were supposed to form far from their stars, where it is cold enough for ice. A "hot Jupiter" rewrote the script: planets, it turned out, migrate. Theory had to catch up with reality.</p>',
        '__FIG_HOTJUP__',
        '<h2>The flood</h2>',
        '<p>The first exoplanet around a sun-like star was a singular announcement; the thousandth was a Tuesday. New techniques — watching for the dimming of a star as a planet transits across it, gravitational microlensing, direct imaging of young hot worlds — pushed the count past five thousand confirmed planets. Mayor and Queloz shared the 2019 Nobel Prize in Physics. Astronomy was, for the first time, doing planetology around other suns.</p>'
      ],
      [
        '<h2>A two-thousand-year-old question</h2>',
        '<p><span class="lead">A</span>re there other worlds? Epicurus argued for infinite ones in the third century BC; Giordano Bruno was burned in 1600 partly for repeating the claim. For all the philosophical confidence, the actual scientific question — does a single planet orbit any star other than the Sun? — had no observational answer until almost the end of the twentieth century.</p>',
        '<p>The problem was contrast. A sun-like star is roughly a billion times brighter than the largest planet beside it, and at typical interstellar distances the angular gap between them is a small fraction of an arcsecond. Even the best optical telescopes of the 1990s could not separate that glare. A few earlier candidates around pulsars — Wolszczan and Frail in 1992 — had been confirmed by pulsar timing, but planets around normal sun-like stars stayed conjectural.</p>',
        '<div class="pull">For two thousand years the conjecture had been: surely. The evidence had been: silence.<cite>Where the question stood in 1995</cite></div>',
        '<h2>Why direct imaging fails</h2>',
        '<p>A planet is visible only by reflected starlight, which falls off as the square of distance to the star and again as the square of distance to us. A Jupiter-like world a few astronomical units from a star fifty light-years away reflects perhaps one part in a billion of the starlight. Diffraction smears the star’s image into a halo that drowns the planet entirely. Coronagraphs and starshades — instruments that physically block the starlight — only became plausible decades later, and only for unusually wide-orbit, very young worlds.</p>',
        '<h2>The radial-velocity method</h2>',
        '<p>The trick that worked is indirect. A star and its planet orbit their common centre of mass; both move. A Jupiter-mass planet on a tight orbit can make a sun-like star wobble at tens of metres per second — comparable to the speed of a sprinter. The Doppler effect shifts the star’s light blueward when it moves toward us and redward when it moves away, by parts in ten million. Resolve that shift in the absorption lines of stellar spectra and the planet is uncovered.</p>',
        '<p>The hard engineering is stability. The wavelength reference that the stellar spectrum is compared against has to remain steady at the same parts-in-ten-million precision across nights, seasons, and years. Mayor and Queloz had spent the previous decade building ELODIE, a fiber-fed cross-dispersed echelle spectrograph at the Observatoire de Haute-Provence, around exactly this requirement.</p>',
        '__STATS_EXO__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The signal had to be perfectly periodic with a fixed shape, distinguishable from the irregular oscillations real stars exhibit on their own. Within days of the 1995 announcement, Geoff Marcy and Paul Butler at Lick Observatory turned a competing spectrograph onto 51 Pegasi and recovered the same 4.23-day wobble. Independent instrument, independent team, identical result — the discovery was confirmed before the first paper was even six weeks old.</p></div>',
        '<h2>October 1995, and the impossible planet</h2>',
        '<p>The wobble Mayor and Queloz announced corresponded to a planet of roughly half a Jupiter mass orbiting 51 Pegasi every 4.23 days at about 0.05 astronomical units — one-twentieth of Earth’s distance from the Sun. At that range the planet sits in a furnace of stellar radiation; its day side reaches temperatures above a thousand degrees Celsius.</p>',
        '<p>Nothing in the standard model of planet formation, built around the Solar System, had predicted such an object. Gas giants were supposed to form beyond the snow line, where volatile ices can survive and accrete onto a rocky core. A Jupiter at four days seemed physically impossible — until it was sitting in the data. The resolution, worked out over the following years, was migration: gas giants form far out, then exchange angular momentum with the protoplanetary disk and spiral inward, sometimes catastrophically close.</p>',
        '__FIG_HOTJUP__',
        '<div class="pull">A single signal rewrote how solar systems are allowed to look.<cite>The theoretical aftermath</cite></div>',
        '<h2>The flood</h2>',
        '<p>Radial-velocity surveys produced steady detections through the late 1990s. The decisive jump came with transit photometry — watching for the small periodic dimming when a planet crosses in front of its star. NASA’s Kepler mission, staring at a single patch of sky from 2009 to 2018, alone confirmed thousands of worlds. Microlensing, direct imaging, and timing methods added more. The catalogue today exceeds five thousand confirmed exoplanets across more than three thousand systems, with statistical estimates suggesting most stars in the galaxy host at least one planet.</p>',
        '<p>Mayor and Queloz received the 2019 Nobel Prize in Physics for the original discovery. The James Webb Space Telescope now reads the atmospheres of transiting planets by taking the spectrum of starlight that has passed through them — searching for water, methane, carbon dioxide, and the disequilibrium chemistry that might suggest life.</p>',
        '<h2>The next question</h2>',
        '<p>The original question — does any other star host any planet at all — is closed. The replacement is more pointed: do any of those planets carry life, and how would we know across the void? Atmospheric biosignatures — gas ratios that abiotic chemistry cannot explain — are the current best candidate. We may yet answer the older question, the harder one, in a single human lifetime.</p>'
      ]
    ]
  },

  "double-slit": {
    field: "Quantum Reality",
    era: "1801 – now",
    subject: "The measurement problem",
    kick: "Quantum Reality · The Discovery Series",
    title: 'Does a particle exist<br><i>before you look?</i>',
    dek: "Fire single particles at a pair of slits and they build a pattern that only makes sense if each one passed through both at once. Try to catch which slit, and the pattern vanishes. A century on, the experiment still refuses to let reality be ordinary.",
    hero: "wave",
    heroImage: { base: "double-slit", w: 1280, h: 720, alt: "A quantum particle spreading into a wave of probability and blooming into interference fringes of light on black.", credit: "Illustration · Celestium" },
    related: ["gravitational-waves", "weighing-the-universe", "__scale"],
    depths: [
      [
        '<p><span class="lead">S</span>hine light through two narrow slits and it makes a striped interference pattern — the signature of a wave. The strange part: fire the light one particle at a time, and each lands as a single dot, yet over thousands of shots the same stripes appear. Each particle behaves as if it went through both slits and interfered with itself. Place a detector to see which slit it really took, and the stripes disappear — it goes back to behaving like a plain particle. Before you measure it, a quantum object does not seem to have a single definite path at all.</p>',
        '__FIG_DSLIT__',
        '<div class="know"><div class="kh">Why it matters</div><p>It is the cleanest demonstration that the quantum world is not just small — it is built on different rules, where "where is it?" has no answer until you ask.</p></div>'
      ],
      [
        '<h2>A wave, settled in 1801</h2>',
        '<p><span class="lead">I</span>n 1801 Thomas Young sent light through two close slits and found alternating bright and dark bands on a screen beyond. Only waves do that: where two crests meet they reinforce, where a crest meets a trough they cancel. The experiment was taken as proof that light is a wave, and for a century that was the end of it.</p>',
        '<p>Then the twentieth century complicated the picture. Light also arrives in discrete lumps — photons — and matter that everyone called particles, like electrons, turns out to make the very same interference bands. Whatever these things are, they are not simply waves or simply particles.</p>',
        '<div class="pull">Each particle arrives as one dot. Thousands of dots, one at a time, quietly assemble into stripes.<cite>The single-particle result</cite></div>',
        '<h2>One at a time</h2>',
        '<p>The decisive version fires the particles individually, so slow that only one is ever in the apparatus at once. Each makes a single point of impact — unmistakably a particle. But let the points accumulate and the interference pattern emerges from them. With nothing else present to interfere with, each particle must somehow interfere with itself, exploring both slits as a spread-out wave of possibility before landing as a point.</p>',
        '__FIG_DSLIT__',
        '<div class="stats"><div><div class="v">1 at a time</div><div class="l">Single particles still build the pattern</div></div><div><div class="v">2 slits</div><div class="l">Each takes both paths at once</div></div><div><div class="v">|&psi;|&#178;</div><div class="l">The wave gives only the odds of landing</div></div></div>',
        '<div class="know"><div class="kh">How we know it is real</div><p>It has been done with photons, electrons, neutrons, whole atoms, and even large molecules of hundreds of atoms. The heavier and more complex the object, the harder it is to keep it isolated — but when isolation holds, the stripes always come.</p></div>',
        '<h2>Try to catch it, and it stops</h2>',
        '<p>Add a detector that records which slit each particle goes through, and the stripes vanish — you get two plain bands, as if the particles were ordinary marbles. You cannot have both the which-path knowledge and the interference. Gaining information about the path destroys the wave behaviour. The act of measurement is not a passive look; it changes what happens.</p>',
        '<p>Before measurement, the particle is described by a wavefunction spread across both routes. The wave does not tell you where the particle is — only the probability of finding it at each spot. Reality, at this level, deals in odds until the moment something is recorded.</p>'
      ],
      [
        '<h2>The duality nobody could remove</h2>',
        '<p><span class="lead">Y</span>oung’s 1801 fringes established the wave nature of light, and for a hundred years the matter seemed closed. The crack opened in 1905, when Einstein explained the photoelectric effect by treating light as discrete quanta — photons. Light was somehow both. Worse, in 1927 Davisson and Germer found that electrons, the very emblem of a particle, diffract like waves. Wave-particle duality was not a quirk of light; it was a property of everything.</p>',
        '<p>The double slit distils the paradox to its sharpest point. A single quantum object, sent through two openings, produces a pattern that requires both openings to have been used — yet arrives at the screen as one indivisible dot, in one place.</p>',
        '<div class="pull">The wavefunction is not a thing moving through space. It is a catalogue of what could happen, and how likely each outcome is.<cite>What is actually spread across the slits</cite></div>',
        '<h2>The mathematics of maybe</h2>',
        '<p>Quantum mechanics describes the particle with a wavefunction that assigns a complex amplitude to every possible path. The amplitudes for the two slits add — and because they can be out of step, they can reinforce or cancel, producing the bands. Max Born’s 1926 rule supplies the link to experience: the probability of detecting the particle somewhere is the square of the amplitude there. The wave is real enough to interfere, but what it carries is possibility, not substance.</p>',
        '<p>Crucially, the interference only survives while the two paths remain genuinely indistinguishable. The instant any record exists — anywhere in the universe — of which slit was taken, the amplitudes can no longer interfere, and the pattern collapses to two bands.</p>',
        '__FIG_DSLIT__',
        '<div class="stats"><div><div class="v">1927</div><div class="l">Electrons shown to diffract — matter is wavelike</div></div><div><div class="v">10&#8315;&#185;&#8309; m</div><div class="l">Wavelength of a moving electron — tiny, but real</div></div><div><div class="v">2,000+</div><div class="l">Atoms in molecules that still interfere</div></div></div>',
        '<h2>Why looking matters</h2>',
        '<p>The popular phrase is that "observation collapses the wavefunction," which invites the wrong idea that consciousness is required. It is not. What matters is whether which-path information becomes recorded in the environment — a stray photon, a vibration, a detector click. That spreading-out of information, called decoherence, is enough to wash out interference even with no person watching. Measurement is a physical interaction, not a mental one.</p>',
        '<div class="know"><div class="kh">How we know it is real</div><p>Delayed-choice and quantum-eraser experiments take this further: the decision to record or erase which-path information can be made <em>after</em> each particle has passed the slits, and the pattern still appears or vanishes accordingly. The experiments are reproducible, quantitative, and agree with quantum theory to extraordinary precision.</p></div>',
        '<h2>What it does and does not settle</h2>',
        '<p>The experiment proves, beyond reasonable doubt, that a quantum object has no single definite path before it is measured, and that measurement yields one outcome drawn from a weighted set of possibilities. What it does <em>not</em> do is tell us what is "really" happening underneath. The Copenhagen view says the wavefunction simply collapses. The many-worlds view says every outcome occurs, in branching realities. The pilot-wave view restores definite particles guided by a real wave. All three reproduce the same fringes; experiment has not yet separated them.</p>',
        '<div class="pull">Two centuries on, we can predict the pattern to any precision we like — and still cannot agree on what it means.<cite>The standing puzzle</cite></div>'
      ]
    ]
  },

  "age-of-earth": {
    field: "Deep Time",
    era: "1956 CE",
    subject: "4.54 billion years",
    kick: "Deep Time · The Discovery Series",
    title: 'Reading four billion years<br><i>out of a rock.</i>',
    dek: "For most of history the Earth had no knowable age. Then radioactivity handed us a clock buried inside the rocks themselves — and a young chemist used it to weigh deep time to within one percent.",
    hero: "deep-field",
    heroImage: { base: "age-of-earth", w: 1280, h: 720, alt: "An ancient zircon crystal glowing in dark primordial rock, holding billions of years of time.", credit: "Illustration · Celestium" },
    related: ["first-exoplanet", "weighing-the-universe", "__scale"],
    depths: [
      [
        '<p><span class="lead">R</span>adioactive atoms decay at a fixed, unchangeable rate, ticking like a clock sealed inside a rock when it forms. Count how many parent atoms have turned into their decay products and you can read off how long the clock has run. In 1956 Clair Patterson applied this to meteorites — pristine leftovers from the birth of the Solar System — and measured the age of the Earth at about 4.55 billion years. Decades of independent methods have only sharpened the number: 4.54 billion years, give or take about one percent.</p>',
        '__FIG_DECAY__',
        '<div class="know"><div class="kh">Why it matters</div><p>It replaced thousands of years of guesswork with a measurement, and gave evolution and geology the vast stretch of time they require to make sense.</p></div>'
      ],
      [
        '<h2>An age nobody could read</h2>',
        '<p><span class="lead">F</span>or most of history the Earth’s age was a matter of scripture or guesswork — a few thousand years, or simply unknowable. Nineteenth-century attempts using ocean salt or the planet’s cooling gave wildly different answers and could not be trusted. The clock was missing.</p>',
        '<p>Radioactivity supplied it. Discovered at the turn of the twentieth century, radioactive decay turns one element into another at a rate set by a fixed half-life — the time for half the atoms to decay. That rate is immune to heat, pressure or chemistry. Lock some radioactive atoms into a crystal as it forms, and the steadily growing pile of decay products becomes a timer counting from that moment.</p>',
        '__FIG_DECAY__',
        '<div class="pull">The rock carries its own clock. You only have to learn to read it.<cite>The principle of radiometric dating</cite></div>',
        '<h2>Two clocks in one crystal</h2>',
        '<p>The most powerful timer uses uranium, which comes in two kinds that decay to two kinds of lead at very different rates — one with a half-life of about 4.5 billion years, the other about 700 million. Because a single mineral grain traps both, it contains two independent clocks that must agree on the same age. When they do, the result is trustworthy; when they disagree, the sample has been disturbed and is discarded.</p>',
        '<div class="stats"><div><div class="v">4.54 Gyr</div><div class="l">Age of the Earth</div></div><div><div class="v">&plusmn;1%</div><div class="l">Modern uncertainty</div></div><div><div class="v">4.40 Gyr</div><div class="l">Oldest known Earth crystal (a zircon)</div></div></div>',
        '<div class="know"><div class="kh">How we know it is real</div><p>Completely different decay systems — uranium-lead, rubidium-strontium, samarium-neodymium — date the same meteorites to the same age. Independent clocks built on different physics agreeing to within a percent is what turns a measurement into a fact.</p></div>',
        '<h2>Why a meteorite, not the ground</h2>',
        '<p>The Earth itself is a poor witness to its own birth. Its surface is endlessly recycled — melted, buried, eroded — so its oldest surviving rocks are younger than the planet. Meteorites are different: most are unchanged debris from the Solar System’s formation, frozen at the moment everything began. Date them and you date the Earth’s birth by proxy. In 1956 Clair Patterson did exactly that, and got 4.55 billion years.</p>'
      ],
      [
        '<h2>From curiosity to clock</h2>',
        '<p><span class="lead">W</span>hen Henri Becquerel and the Curies uncovered radioactivity at the close of the nineteenth century, no one saw a calendar in it. Ernest Rutherford did. He realised that because each radioactive isotope decays at a rate nothing can alter, the ratio of leftover parent atoms to accumulated daughter atoms in a mineral measures the time since that mineral crystallised. By 1907 the first crude radiometric dates already ran to more than a billion years — far beyond anything physics had allowed before, and the opening of deep time.</p>',
        '<p>The method rests on a single clean equation of exponential decay. Know the half-life, measure the surviving parent and the accumulated daughter, and the elapsed time follows. The art is in trusting the sample: the clock is only honest if the crystal has stayed closed since it formed, neither gaining nor losing atoms.</p>',
        '<div class="pull">A constant nothing can change — not heat, not pressure, not time itself — is exactly what a clock needs.<cite>Why decay rates make good timers</cite></div>',
        '<h2>The uranium-lead concordia</h2>',
        '<p>Uranium-lead dating is the gold standard because uranium offers two clocks at once: uranium-238 decays to lead-206 with a 4.47-billion-year half-life, and uranium-235 decays to lead-207 with a 704-million-year half-life. A mineral that has remained closed will give the same age on both systems — its measurements fall on a curve called the concordia. A grain that has leaked lead falls off the curve in a tell-tale way, so disturbed samples announce themselves rather than quietly lying.</p>',
        '__FIG_DECAY__',
        '<p>The mineral of choice is zircon, which incorporates uranium when it crystallises but violently rejects lead, so essentially all the lead it now contains was made inside it by decay. Zircons are also fantastically durable. The oldest yet found, from the Jack Hills of Western Australia, date to about 4.40 billion years — direct evidence of a solid crust, and even liquid water, within the Earth’s first 150 million years.</p>',
        '<div class="stats"><div><div class="v">4.47 Gyr</div><div class="l">Half-life of uranium-238</div></div><div><div class="v">0.70 Gyr</div><div class="l">Half-life of uranium-235</div></div><div><div class="v">4.55 Gyr</div><div class="l">Patterson&#8217;s 1956 meteorite age</div></div></div>',
        '<h2>Patterson, meteorites, and clean rooms</h2>',
        '<p>To date the planet rather than a single rock, Clair Patterson reasoned that the Earth and the meteorites condensed from the same cloud at the same time. Using the lead isotopes in iron and stony meteorites — including the Canyon Diablo meteorite for the Solar System’s primordial lead — he constructed an isochron that pinned the age at 4.55 &plusmn; 0.07 billion years in 1956. The figure has barely moved since.</p>',
        '<div class="know"><div class="kh">How we know it is real</div><p>Patterson’s greatest enemy was contamination: lead was everywhere — in dust, in solder, in the air — and a trace would ruin a measurement. Building some of the first ultra-clean laboratories to exclude it, he noticed modern samples were saturated with industrial lead. That accidental discovery launched his decades-long campaign that ended leaded petrol. The same obsessive cleanliness is why the meteorite age is believed.</p></div>',
        '<h2>The number that holds</h2>',
        '<p>Today the Earth and Solar System are dated to 4.54 billion years with an uncertainty near one percent — one of the best-determined numbers in all of science, cross-checked by half a dozen independent isotope systems and by the dating of the oldest meteorites and Moon rocks. The planet that once had no knowable age is now timed more precisely than almost anything else about it.</p>',
        '<div class="pull">We learned to read a clock that had been running, untouched, since before there was anyone to wind it.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "double-helix": {
    field: "Life & Origins",
    era: "1953 CE",
    subject: "The structure of DNA",
    kick: "Life & Origins · The Discovery Series",
    title: 'The shape that<br><i>copies itself.</i>',
    dek: "In 1953 the molecule of heredity turned out to be two strands wound into a spiral — and the instant its structure was clear, so was the secret it had been keeping: how life makes a copy of itself.",
    hero: "helix",
    heroImage: { base: "double-helix", w: 1280, h: 720, alt: "A luminous DNA double helix unwinding to copy itself, suspended in darkness.", credit: "Illustration · Celestium" },
    related: ["age-of-earth", "first-exoplanet", "__scale"],
    depths: [
      [
        '<p><span class="lead">D</span>NA carries the instructions for building a living thing, written along a molecule too small to see. In 1953 James Watson and Francis Crick — using a crucial X-ray image made by Rosalind Franklin — worked out its shape: two strands twisted into a double helix, their inward-facing chemical "letters" pairing up in a fixed way, A always with T and G always with C. That pairing was the punchline. Pull the two strands apart and each is a perfect template for rebuilding the other, so the molecule can copy itself. The structure did not just describe heredity; it explained it.</p>',
        '__FIG_HELIX__',
        '<div class="know"><div class="kh">Why it matters</div><p>It united chemistry and life: heredity became something you could draw, with a mechanism you could see. Nearly all of modern biology and medicine descends from that one diagram.</p></div>'
      ],
      [
        '<h2>The molecule nobody could read</h2>',
        '<p><span class="lead">B</span>y the 1940s it was known that genes are made of DNA, but no one knew how a single kind of molecule could store the vast, specific instructions for an organism — let alone copy them faithfully, generation after generation. The answer had to lie in its structure, and the structure was a mystery.</p>',
        '<p>Two clues were on the table. Erwin Chargaff had found that in any DNA the amount of adenine always equals thymine, and guanine always equals cytosine — a suspicious one-to-one pairing. And in London, Rosalind Franklin was making X-ray diffraction images of DNA fibres of extraordinary quality, including the famous "Photo 51," whose cross-shaped pattern was the fingerprint of a helix.</p>',
        '<div class="pull">The clue was hiding in the symmetry: every A matched a T, every G a C. A molecule built of matched pairs can always rebuild its partner.<cite>Chargaff&#8217;s rule, and what it implied</cite></div>',
        '<h2>Two strands, paired and antiparallel</h2>',
        '<p>In 1953 Watson and Crick, at Cambridge, assembled the pieces into a physical model. DNA is two long strands running in opposite directions, each a backbone of sugar and phosphate, twisted around a common axis into a right-handed double helix. Pointing inward from each backbone are the four bases. They meet in the middle and pair by hydrogen bonds — adenine only with thymine, guanine only with cytosine — so the two strands are complementary: read one and you know the other.</p>',
        '__FIG_HELIX__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The model had to reproduce Franklin&#8217;s measured diffraction pattern, fit the known chemistry of the bases, and obey Chargaff&#8217;s one-to-one rule — all at once. It did. Later X-ray work confirmed the helix in atomic detail, and the predicted copying mechanism was demonstrated directly in 1958.</p></div>',
        '<h2>The mechanism falls out of the shape</h2>',
        '<p>Watson and Crick ended their one-page paper with a famously understated line: it had not escaped their notice that the pairing immediately suggested a copying mechanism. Unzip the helix down the middle and each freed strand specifies, base by base, the partner that must be built against it. One molecule becomes two identical ones. In 1958 Matthew Meselson and Franklin Stahl showed replication works exactly this way — each new double helix keeps one old strand and one new one.</p>',
        '<p>Rosalind Franklin, whose data was central, was not credited at the time and died in 1958; the Nobel Prize went to Watson, Crick and Wilkins in 1962, and is not awarded posthumously. Her role is now recognised as indispensable.</p>'
      ],
      [
        '<h2>From "genes are DNA" to "but how?"</h2>',
        '<p><span class="lead">T</span>he 1944 Avery–MacLeod–McCarty experiment and Hershey and Chase in 1952 had pinned heredity on DNA rather than protein. That sharpened the real problem rather than solving it: DNA has only four kinds of subunit, and it was hard to see how so simple a molecule could both encode an organism’s full complexity and be copied without error each time a cell divides. Whatever the structure was, it had to make both of those things obvious.</p>',
        '<p>The raw material for an answer was accumulating. Chargaff’s base ratios hinted at pairing. And X-ray crystallography — bouncing X-rays off the regular atomic lattice of a fibre and reading structure from the diffraction pattern — was mature enough, in the right hands, to constrain the geometry of DNA tightly.</p>',
        '<div class="pull">Photo 51 was not a picture of DNA. It was the diffraction shadow from which the helix could be calculated — and it was decisive.<cite>The evidence that broke it open</cite></div>',
        '<h2>The decisive image</h2>',
        '<p>At King’s College London, Rosalind Franklin and Maurice Wilkins produced X-ray diffraction images of unmatched clarity. Franklin’s "Photo 51," taken with her student Raymond Gosling, showed a clear X-shaped pattern — the unmistakable signature of a helix — and her careful measurements fixed key dimensions: the spacing of repeating units and the diameter of the molecule. She had also distinguished two forms of DNA and characterised the wet, biologically relevant one.</p>',
        '<p>This image and Franklin’s unpublished measurements were shown to Watson and Crick at Cambridge, without her knowledge — a now-acknowledged ethical failure in how credit and data flowed. The information was, by Crick’s own later account, essential to the model.</p>',
        '<h2>Building the model</h2>',
        '<p>Watson and Crick did not run new experiments; they built scale models constrained by everyone else’s data. The breakthrough was the base pairing. Adenine bonds cleanly to thymine, and guanine to cytosine, and crucially each pair has the same width — so the two backbones stay an even distance apart all the way up, exactly as Franklin’s diffraction required. The strands run antiparallel, in opposite directions, and wind into a right-handed double helix roughly two nanometres across with one full turn about every ten base pairs.</p>',
        '__FIG_HELIX__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The structure simultaneously explained Chargaff’s A=T, G=C ratios, matched Franklin’s diffraction geometry, and was chemically sound — three independent constraints satisfied by one model. The replication mechanism it predicted was confirmed by the 1958 Meselson–Stahl experiment, and decades of higher-resolution crystallography have since resolved the helix atom by atom.</p></div>',
        '<h2>The sentence that started molecular biology</h2>',
        '<p>The two-strand, complementary structure means the molecule encodes information twice over and can be copied by templating. That single insight launched the genetic code, recombinant DNA, sequencing, and ultimately the reading of entire genomes. The 1953 paper closed with the deliberately quiet remark that the pairing "immediately suggests a possible copying mechanism for the genetic material" — perhaps the most consequential understatement in the history of biology.</p>',
        '<div class="pull">Life turned out to keep its instructions as a sequence of four letters, in a shape that carries its own way of being copied.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "ancient-dna": {
    field: "Human History",
    era: "2010 CE",
    subject: "Neanderthals & Denisovans",
    kick: "Human History · The Discovery Series",
    title: 'Reading the genomes<br><i>of the dead.</i>',
    dek: "DNA was thought to crumble into uselessness soon after death. Painstakingly, we learned to read it anyway — and the genomes of people gone for tens of thousands of years revealed that our own species is not as alone, or as pure, as we believed.",
    hero: "helix",
    heroImage: { base: "ancient-dna", w: 1280, h: 720, alt: "An ancient human ancestor emerging from shadow as fragments of DNA dissolve into the dark.", credit: "Illustration · Celestium" },
    related: ["double-helix", "age-of-earth", "__scale"],
    depths: [
      [
        '<p><span class="lead">A</span>fter death, DNA shatters into tiny fragments and is swamped by microbes and the DNA of everyone who has since handled the bone — so for decades, reading the genome of an ancient human looked impossible. Svante Pääbo and his colleagues spent years inventing the clean-room methods and controls to do it reliably. In 2010 they published the genome of a Neanderthal, and found something startling: people outside Africa carry about 1–2% Neanderthal DNA. Our ancestors interbred with them. The same year, a single finger bone yielded the genome of an entirely unknown human group — the Denisovans — identified from DNA alone.</p>',
        '__FIG_HOMININ__',
        '<div class="know"><div class="kh">Why it matters</div><p>It turned human prehistory from a story told by a handful of bones into one we can read in the genome — and showed that <em>Homo sapiens</em> shared the planet, and children, with other kinds of human. Pääbo received the 2022 Nobel Prize.</p></div>'
      ],
      [
        '<h2>A molecule that does not keep</h2>',
        '<p><span class="lead">D</span>NA begins to break down the moment an organism dies. Over millennia it fragments into pieces a few dozen letters long, chemically damaged, and vastly outnumbered by the DNA of soil bacteria and of every modern human who has touched the specimen. Early claims of DNA from dinosaurs or million-year-old insects collapsed under scrutiny: they were almost always contamination. The field had a credibility problem.</p>',
        '<p>Svante Pääbo’s contribution was less a single eureka than a decade of obsessive method. He built dedicated clean rooms, ran controls to detect contamination, and — crucially — learned to recognise genuine ancient DNA by its characteristic damage: short fragments, and a specific chemical change at their ends that accumulates only over very long times.</p>',
        '<div class="pull">The breakthrough was not a machine but a discipline — learning to tell the genome of the dead from the fingerprints of the living.<cite>Why ancient DNA became trustworthy</cite></div>',
        '<h2>The Neanderthal genome, 2010</h2>',
        '<p>Working from bones tens of thousands of years old, Pääbo’s team at the Max Planck Institute reconstructed a draft genome of a Neanderthal — our closest extinct relatives, who lived across Europe and western Asia until about 40,000 years ago. Comparing it to people living today revealed the twist: everyone whose ancestry lies outside Africa carries roughly 1–2% Neanderthal DNA. The two groups had met, and had children whose lines survive in us.</p>',
        '__FIG_HOMININ__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The signal is specific: Neanderthal-matching DNA is found in non-Africans but largely absent in sub-Saharan Africans, exactly as expected if the interbreeding happened after modern humans left Africa and met Neanderthals in Eurasia. Independent labs, independent samples, and the predictable pattern of damage all converge.</p></div>',
        '<h2>A human species found in a genome</h2>',
        '<p>Then came the stranger result. A small finger bone from Denisova Cave in Siberia yielded DNA that matched neither Neanderthals nor modern humans. It belonged to a previously unknown group of humans — the Denisovans — recognised, for the first time in history, not from skeletons but from their genome alone. Their DNA, too, lives on: many people in Asia and especially Oceania carry a Denisovan inheritance.</p>'
      ],
      [
        '<h2>The contamination wars</h2>',
        '<p><span class="lead">F</span>or much of the 1990s, "ancient DNA" was a byword for irreproducible results. Spectacular claims — DNA from dinosaur bones, from insects in amber — kept failing to replicate, because the tiny amounts of real ancient material were overwhelmed by modern contamination introduced during excavation and handling, then amplified along with everything else. Any method sensitive enough to find ancient DNA was sensitive enough to find a technician’s skin cells.</p>',
        '<p>Svante Pääbo, who as a student had secretly experimented on Egyptian mummies, spent years turning the field into a rigorous science. The tools were unglamorous: positive-pressure clean rooms, reagents screened for contamination, replication in independent labs, and a battery of controls designed to catch modern DNA masquerading as ancient.</p>',
        '<div class="pull">A method powerful enough to read a 40,000-year-old genome is powerful enough to read the lab around it. Telling them apart was the whole achievement.<cite>The central problem of the field</cite></div>',
        '<h2>Authenticating the dead</h2>',
        '<p>The decisive insight was that genuinely ancient DNA carries a signature of age. Over tens of thousands of years it breaks into very short fragments, and the chemical bases at the ends of those fragments undergo a characteristic deamination — cytosine drifting to uracil — that modern contaminating DNA does not show. By reading that damage pattern, Pääbo’s group could weigh how much of a sample was authentically old. Combined with high-throughput sequencing, which could read billions of fragments and reassemble the genome statistically, the impossible became routine.</p>',
        '__FIG_HOMININ__',
        '<h2>Two genomes, two surprises</h2>',
        '<p>The 2010 draft Neanderthal genome compared three present-day human populations against the ancient sequence and found that non-Africans share slightly more variants with Neanderthals than Africans do — the genetic echo of interbreeding in Eurasia after the migration out of Africa. The admixture is small, about 1–2%, but real and widespread, and individual Neanderthal gene variants influence traits in living people, from immunity to skin to the way some of us metabolise the cold.</p>',
        '<p>The Denisovans were even more radical. From a finger bone and a couple of teeth in a Siberian cave, the team sequenced a genome belonging to a sister group of the Neanderthals — and named a human population that no one had ever knowingly seen. Denisovan ancestry peaks in Melanesians and Aboriginal Australians at several percent, and one Denisovan gene variant helps Tibetans live at high altitude today.</p>',
        '<div class="know"><div class="kh">How we know it is real</div><p>The conclusions rest on the convergence of independent strands: the geographic pattern of shared variants matches the known timing of human migration; the damage signatures certify the DNA as ancient; multiple specimens and laboratories reproduce the result; and later, higher-quality genomes from better-preserved individuals confirmed the draft conclusions in fine detail.</p></div>',
        '<h2>A rewritten prehistory</h2>',
        '<p>Ancient genomics has since exploded, reading thousands of ancient individuals and tracing the great migrations and mixtures that produced today’s populations. The headline, though, was set in 2010: <em>Homo sapiens</em> is not the lone survivor of a clean family tree but a web of populations that met, mixed, and absorbed one another. Most living humans carry, in every cell, the DNA of people from species that vanished tens of thousands of years ago. Pääbo founded the field of palaeogenomics and was awarded the 2022 Nobel Prize in Physiology or Medicine.</p>',
        '<div class="pull">We did not just find our extinct relatives. We found them inside ourselves.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "cosmic-background": {
    field: "Origins",
    era: "1965 CE",
    subject: "The cosmic microwave background",
    kick: "Origins · The Discovery Series",
    title: 'The static that turned out to be<br><i>the Big Bang.</i>',
    dek: "Two engineers spent a year trying to scrub a faint hiss out of their antenna. They cleaned, they checked, they evicted the pigeons. The hiss would not go — because it was the cooling afterglow of the universe&#8217;s first light.",
    hero: "cmb",
    heroImage: { base: "cosmic-background", w: 1280, h: 720, alt: "The infant universe as it first turned transparent — a soft, almost uniform glow of primordial light.", credit: "Illustration · Celestium" },
    related: ["weighing-the-universe", "black-hole-image", "__scale"],
    depths: [
      [
        '<p><span class="lead">I</span>f the universe began hot and dense, that fire should still be glowing faintly everywhere — stretched by cosmic expansion from blinding light down into faint microwaves. In 1965 Arno Penzias and Robert Wilson, testing a radio antenna at Bell Labs, found an inexplicable hiss coming from every direction in the sky, day and night. It was exactly the predicted afterglow: the cosmic microwave background, light released about 380,000 years after the Big Bang, now cooled to 2.725 degrees above absolute zero. The Big Bang stopped being a theory and became something you could measure.</p>',
        '__FIG_CMB__',
        '<div class="know"><div class="kh">Why it matters</div><p>It is the single strongest piece of evidence that the universe had a hot beginning — a photograph of the cosmos as it was before the first star, found by accident in the noise of a radio antenna.</p></div>'
      ],
      [
        '<h2>A prediction sitting in the noise</h2>',
        '<p><span class="lead">I</span>n the 1940s a few physicists realised that a universe born hot and dense should leave a relic. As it expanded and cooled, there would come a moment when it was cool enough for atoms to form and light to travel freely. That first free light would still be streaming through space today — but stretched by billions of years of expansion into faint microwaves, filling the whole sky at a temperature only a few degrees above absolute zero. The prediction was made, then largely forgotten.</p>',
        '<p>In 1964, at Bell Labs in New Jersey, Arno Penzias and Robert Wilson were preparing a sensitive horn antenna for radio astronomy. They kept running into a persistent background hiss they could not explain. It came from every part of the sky equally, never changed with the time of day or the season, and refused every attempt to remove it.</p>',
        '<div class="pull">They even scrubbed out the pigeons nesting in the horn. The hiss stayed. It was coming from everywhere, because it filled everything.<cite>The year of elimination</cite></div>',
        '<h2>Two groups, one phone call</h2>',
        '<p>Forty kilometres away at Princeton, Robert Dicke&#8217;s team was deliberately building a detector to hunt for exactly this afterglow. Before they could finish, they heard about the strange noise at Bell Labs. A phone call connected the two: Penzias and Wilson had the signal; Dicke&#8217;s group had the explanation. The unremovable hiss was the cosmic microwave background.</p>',
        '__FIG_CMB__',
        '__STATS_CMB__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The signal is the same brightness in every direction, matches a single temperature with extraordinary precision, and has exactly the spectrum a cooling hot universe predicts. Later satellites confirmed it is the most perfect &#8220;blackbody&#8221; glow ever measured — something no ordinary collection of stars or galaxies could fake.</p></div>',
        '<h2>The seeds in the glow</h2>',
        '<p>The afterglow is almost perfectly smooth — but not quite. Buried in it are temperature ripples about one part in a hundred thousand, mapped from space by the COBE, WMAP and Planck satellites. Those tiny variations are the seeds from which galaxies later grew, and their pattern encodes the age, shape and composition of the universe. A hiss an engineer wanted to delete turned out to be the most information-rich photograph ever taken.</p>'
      ],
      [
        '<h2>The logic of a hot beginning</h2>',
        '<p><span class="lead">I</span>n the late 1940s George Gamow and his collaborators Ralph Alpher and Robert Herman followed the expanding universe backwards. If space is expanding now, it was denser and hotter in the past — and early enough, hot enough to be an opaque plasma of bare nuclei and free electrons, with light unable to travel far before scattering. As the universe expanded it cooled, until at about 380,000 years it reached roughly 3,000 kelvin: cool enough for electrons and nuclei to combine into neutral atoms. Suddenly light could fly freely. That released radiation has been travelling ever since, redshifting with the expansion. Alpher and Herman estimated its present temperature at a few kelvin. The work was published, admired briefly, and shelved — no one thought it could be detected.</p>',
        '<div class="pull">Run the expansion backwards and the universe must once have been an opaque fog of fire. The moment it cleared is the oldest thing light can show us.<cite>Recombination, 380,000 years in</cite></div>',
        '<h2>The accidental detection</h2>',
        '<p>In 1964 Penzias and Wilson took over a 6-metre horn-reflector antenna at Holmdel, built for early satellite communications, intending to do careful radio astronomy. To do that they had to account for every source of noise. One contribution would not go away: an excess antenna temperature of about 3.5 kelvin, isotropic, unpolarised, and constant across the year — ruling out the Sun, the galaxy, the atmosphere, and any single terrestrial source.</p>',
        '<p>They worked through the list methodically. They dismantled and cleaned the antenna; they removed a pair of nesting pigeons and the &#8220;white dielectric material&#8221; the birds had deposited inside the horn. The excess remained, identical in every direction. By elimination, the noise was neither instrumental nor local. It was a real signal arriving uniformly from the whole sky.</p>',
        '__FIG_CMB__',
        '<h2>The convergence</h2>',
        '<p>Independently, Robert Dicke, Jim Peebles, Peter Roll and David Wilkinson at Princeton had reasoned their way back to the same relic radiation and were building an antenna to find it. Word of the Holmdel anomaly reached them; a phone call and a visit settled it within weeks. In 1965 the two groups published back-to-back papers in the Astrophysical Journal — Penzias and Wilson reporting the excess temperature in studiously neutral terms, Dicke&#8217;s group supplying the cosmological interpretation. Penzias and Wilson received the 1978 Nobel Prize in Physics.</p>',
        '__STATS_CMB__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The decisive test is the spectrum. A hot early universe predicts that the background should be a near-perfect blackbody — the characteristic glow of matter and radiation in thermal equilibrium. In 1990 the COBE satellite&#8217;s FIRAS instrument measured that spectrum and found it matched a 2.725 K blackbody to within a fraction of a percent, the most precise blackbody known in nature. No assembly of discrete sources reproduces that curve; only a universe that was once hot and opaque does.</p></div>',
        '<h2>From a hiss to a map</h2>',
        '<p>The background is isotropic to about one part in a hundred thousand, but not perfectly. COBE first detected the minute anisotropies in 1992; WMAP and the Planck satellite later mapped them in fine detail. These temperature fluctuations are the imprint of tiny density variations in the infant universe — the gravitational seeds that grew into galaxies and clusters. Their statistical pattern, a series of acoustic peaks, pins down the geometry of space, the age of the universe at 13.8 billion years, and the relative amounts of ordinary matter, dark matter and dark energy.</p>',
        '<p>The same radiation also fixes a direction and rate to our own motion, faintly distinguishes what the early plasma was made of, and sets the stage on which all later structure was built. Smoot and Mather shared the 2006 Nobel Prize for the COBE results.</p>',
        '<div class="pull">An engineer&#8217;s unwanted noise became the most information-dense image ever recorded — the universe&#8217;s own baby photograph.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "plate-tectonics": {
    field: "Earth Science",
    era: "1912 – 1968",
    subject: "Continental drift",
    kick: "Earth Science · The Discovery Series",
    title: 'The discovery that<br><i>the ground is moving.</i>',
    dek: "A weather scientist noticed the continents fit together like torn pieces of paper, and proposed they drift. He was ridiculed for fifty years — until the seafloor itself was found to be keeping a record that proved him right.",
    hero: "seafloor",
    heroImage: { base: "plate-tectonics", w: 1280, h: 720, alt: "Glowing magma erupting along a mid-ocean ridge as new seafloor spreads outward in the dark abyss.", credit: "Illustration · Celestium" },
    related: ["age-of-earth", "weighing-the-universe", "__scale"],
    depths: [
      [
        '<p><span class="lead">L</span>ook at a map and South America seems to slot into Africa like two torn halves of a page. In 1912 Alfred Wegener argued this was no coincidence — the continents had once been joined and had since drifted apart. He had no force that could move them, so geologists dismissed the idea for half a century. The proof came from the bottom of the ocean: new seafloor erupts along undersea ridges and spreads outward, and as it cools it records the direction of Earth&#8217;s magnetic field. Because that field flips over geological time, the floor carries a striped barcode of reversals — and the stripes are mirror-symmetric about every ridge. The continents really do move, carried on vast plates.</p>',
        '__FIG_SEAFLOOR__',
        '<div class="know"><div class="kh">Why it matters</div><p>It is the organising idea of all of geology. Earthquakes, volcanoes, mountain ranges and the slow rearrangement of the continents are all the visible edges of a few dozen rigid plates riding a churning interior.</p></div>'
      ],
      [
        '<h2>A fit too good to be chance</h2>',
        '<p><span class="lead">A</span>lfred Wegener was a meteorologist, not a geologist, which may be why he trusted what the map plainly showed: the coastlines of South America and Africa interlock. In 1912 he assembled the case for what he called continental drift. Identical rock formations ran off the edge of one continent and resumed on another; fossils of the same land animals and plants — creatures that could never have crossed an ocean — turned up on both sides of the Atlantic; and glacial scars showed ice sheets had once covered regions now near the equator.</p>',
        '<p>It all made sense if the continents had once formed a single landmass — Pangaea — that later broke apart. But Wegener could not say what force could push continents through solid ocean floor. Geologists seized on that gap and rejected the whole idea, often harshly. He died in 1930 on the Greenland ice; his theory was treated as a curiosity for another generation.</p>',
        '<div class="pull">The evidence on land was overwhelming and the objection was fatal: nothing known could move a continent. Both things were true at once.<cite>Why a good idea waited fifty years</cite></div>',
        '<h2>The answer was underwater</h2>',
        '<p>After the Second World War, sonar and magnetic surveys began mapping the ocean floor, and it was nothing like the featureless mud everyone assumed. A continuous mountain range — the mid-ocean ridge — wound around the planet, with a rift running down its crest. In 1962 Harry Hess proposed seafloor spreading: molten rock rises at the ridge, hardens into new crust, and pushes the older floor steadily aside, like a pair of conveyor belts running away from the crest.</p>',
        '__FIG_SEAFLOOR__',
        '__STATS_TECTONICS__',
        '<div class="know"><div class="kh">How we know it is real</div><p>As new crust cools at a ridge, iron-bearing minerals lock in the direction of Earth&#8217;s magnetic field. That field reverses every so often, so the spreading floor records alternating bands of normal and reversed magnetism — and those stripes are mirror-symmetric on either side of the ridge. Drilling later confirmed the prediction directly: the seafloor gets progressively older the farther you go from the ridge.</p></div>',
        '<h2>One theory for the restless Earth</h2>',
        '<p>By 1968 the pieces had assembled into plate tectonics: Earth&#8217;s rigid outer shell is broken into about seven major plates that move a few centimetres a year, driven by slow convection in the mantle below. They pull apart at ridges, grind past one another along faults, and collide where one dives beneath another — building mountains, opening oceans, and shaking the ground. Wegener had been right about the conclusion, even though he had the mechanism wrong.</p>'
      ],
      [
        '<h2>Wegener&#8217;s case, and its fatal gap</h2>',
        '<p><span class="lead">B</span>y 1915 Alfred Wegener had gathered a remarkably modern body of evidence for continental drift. The jigsaw fit of the Atlantic coastlines was only the start. Matching geological provinces — the same rock types, ages and structures — lined up across the ocean when the continents were reassembled. Fossils of <em>Mesosaurus</em>, a small freshwater reptile, and of the <em>Glossopteris</em> fern appeared on continents now separated by thousands of kilometres of saltwater. Glacial deposits of the same age were strewn across South America, Africa, India and Australia, implying these now-tropical lands had once huddled together near the South Pole.</p>',
        '<p>Wegener proposed they had all been part of a supercontinent, Pangaea, which fragmented and dispersed. His weakness was dynamics. He suggested the continents plowed through the oceanic crust, driven by forces — tidal and rotational — that physicists quickly showed were orders of magnitude too weak. With no viable mechanism, the geological establishment, especially in North America, dismissed drift as fantasy. The objection was scientifically reasonable; it was also wrong about the conclusion.</p>',
        '<div class="pull">He was right that the continents had moved and wrong about how. Science punished the error and missed the truth for fifty years.<cite>The shape of the mistake</cite></div>',
        '<h2>Mapping the ocean floor</h2>',
        '<p>The case was reopened from an unexpected direction. Wartime and post-war oceanography — echo sounding, magnetometers towed behind ships, heat-flow probes — revealed that the deep seafloor had its own dramatic geology. The mid-ocean ridge system turned out to be the longest mountain chain on Earth, circling the globe for some 60,000 kilometres, split by a central rift valley and marked by shallow earthquakes and high heat flow.</p>',
        '<p>In 1962 Harry Hess synthesised this into seafloor spreading. Mantle material wells up beneath the ridge, solidifies into fresh oceanic crust, and is carried away symmetrically as still more rises behind it. The ocean floor is therefore young and constantly renewed, and old crust must be consumed somewhere — at the deep ocean trenches, where it bends downward and sinks back into the mantle in a process later called subduction. Hess, aware he was ahead of the evidence, called it &#8220;an essay in geopoetry.&#8221;</p>',
        '__FIG_SEAFLOOR__',
        '<h2>The barcode that settled it</h2>',
        '<p>Proof came in 1963 from Fred Vine and Drummond Matthews in Cambridge, and independently Lawrence Morley. They combined three facts: that Earth&#8217;s magnetic field reverses polarity at irregular intervals, recorded in lava flows on land; that cooling basalt freezes in the field direction of its moment; and that the seafloor is continuously created at ridges. The prediction was striking — the floor should be magnetised in alternating stripes, parallel to the ridge and mirror-symmetric across it, each stripe a span of time between two reversals.</p>',
        '<p>Magnetic surveys found exactly that pattern, and its symmetry about the ridge axis is almost impossible to explain any other way. The widths of the stripes, matched to the independently dated sequence of reversals, even gave the spreading rate: a few centimetres a year. It was the decisive confirmation.</p>',
        '__STATS_TECTONICS__',
        '<div class="know"><div class="kh">How we know it is real</div><p>Independent lines converge. The magnetic stripes are symmetric across every spreading ridge. Deep-sea drilling by the <em>Glomar Challenger</em> recovered seafloor that grows steadily older with distance from the ridge, exactly as spreading requires, with none older than about 200 million years. Earthquake foci trace dipping slabs descending into the mantle at trenches. And today, satellite positioning measures the plates moving in real time, at the rates the stripes implied.</p></div>',
        '<h2>The unifying theory</h2>',
        '<p>Between 1965 and 1968 the synthesis was completed. J. Tuzo Wilson identified transform faults — a third kind of plate boundary where plates slide past each other — and the concept of plates as rigid spherical caps was formalised by Jason Morgan, Dan McKenzie and Xavier Le Pichon. The result is plate tectonics: the lithosphere is divided into roughly seven major and several minor plates that move over the weak, ductile asthenosphere, driven largely by the pull of cold dense slabs sinking at subduction zones, with mantle convection beneath.</p>',
        '<p>Almost every large-scale feature of the planet falls out of this one picture. Mountain belts like the Himalaya rise where continents collide; volcanic arcs and the deepest earthquakes mark where plates dive; new oceans open along rifts; and the continents themselves are rafted slowly around the globe, assembling and breaking up supercontinents on a roughly 400-million-year rhythm. Wegener&#8217;s ridiculed intuition had become the foundation of the Earth sciences.</p>',
        '<div class="pull">The continents are not fixed stage and we the players. The stage itself is adrift, a few centimetres a year, and always has been.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "penicillin": {
    field: "Medicine",
    era: "1928 – 1945",
    subject: "The first antibiotic",
    kick: "Medicine · The Discovery Series",
    title: 'The mould that<br><i>beat infection.</i>',
    dek: "A bacteriologist came back from holiday to a contaminated, ruined culture plate. Most people would have washed it. He looked closer — and found a mould that could kill the bacteria that, until then, routinely killed us.",
    hero: "culture",
    heroImage: { base: "penicillin", w: 1280, h: 720, alt: "A petri dish with a Penicillium mould colony ringed by a clear zone where the bacteria have dissolved away.", credit: "Illustration · Celestium" },
    related: ["double-helix", "ancient-dna", "__scale"],
    depths: [
      [
        '<p><span class="lead">F</span>or all of history, a scratch or a chest infection could turn lethal, because nothing could stop bacteria once they took hold inside us. In 1928 Alexander Fleming noticed that a stray mould contaminating one of his culture plates had cleared a halo around itself where the bacteria simply would not grow. The mould, <i>Penicillium</i>, was releasing something that killed them. He called it penicillin. He could not purify it, and the discovery sat for a decade — until an Oxford team led by Howard Florey and Ernst Chain turned it into a medicine. It was the first antibiotic, and it changed what it means to be ill.</p>',
        '__FIG_INHIBITION__',
        '<div class="know"><div class="kh">Why it matters</div><p>Before antibiotics, ordinary infections — a cut, childbirth, pneumonia, surgery — were frequently death sentences. Penicillin opened the door to treating them, and to modern surgery, transplants and chemotherapy, which depend on holding infection at bay.</p></div>'
      ],
      [
        '<h2>The world before</h2>',
        '<p><span class="lead">U</span>ntil the twentieth century, medicine could set bones, ease pain and drain wounds, but it had almost no way to stop a bacterial infection already growing inside the body. A grazed knee could lead to fatal blood poisoning; pneumonia, meningitis and infected wounds killed routinely; childbirth carried a real risk of lethal infection. Doctors could diagnose these deaths but rarely prevent them.</p>',
        '<p>In 1928, returning from holiday to his lab at St Mary&#8217;s in London, Alexander Fleming sorted through a stack of old culture plates of <em>Staphylococcus</em> bacteria. One was contaminated by a blue-green mould — and around the mould was a clear ring where the bacterial colonies had dissolved away. Something the mould produced was killing them.</p>',
        '<div class="pull">A ruined plate most people would have rinsed and forgotten. Fleming kept it, and asked why the bacteria had died.<cite>The accident, and the attention</cite></div>',
        '<h2>A discovery that stalled</h2>',
        '<p>Fleming identified the mould as a <em>Penicillium</em> and named the active substance penicillin. He showed it killed many dangerous bacteria yet seemed harmless to animal cells. But penicillin was unstable and present only in tiny amounts, and Fleming was not a chemist; he could not concentrate or purify it. He published in 1929, and the finding languished, treated as a laboratory curiosity for nearly a decade.</p>',
        '__FIG_INHIBITION__',
        '__STATS_PENICILLIN__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The clear zone is reproducible and measurable: spot a sensitive bacterium and a penicillin source on the same plate and a ring of no growth always appears, its size tracking the dose. The same test, run against different microbes, shows which are susceptible — the principle still used to choose antibiotics today.</p></div>',
        '<h2>From curiosity to cure</h2>',
        '<p>At Oxford around 1939, Howard Florey, Ernst Chain and Norman Heatley took up the problem Fleming had left. They devised ways to purify penicillin and tested it: mice given a lethal dose of bacteria survived if treated. In 1941 they tried it on a dying patient, who improved dramatically before the tiny supply ran out. Scaling up production became a wartime priority, and by 1944 penicillin was treating Allied casualties in quantity. Fleming, Florey and Chain shared the 1945 Nobel Prize.</p>'
      ],
      [
        '<h2>An accident, and a prepared mind</h2>',
        '<p><span class="lead">T</span>he story is often told as pure luck, but the luck only mattered because of who was looking. In September 1928 Alexander Fleming, a bacteriologist at St Mary&#8217;s Hospital in London, returned from a summer break to find a Petri dish of <em>Staphylococcus aureus</em> spoiled by a mould that had blown in or drifted up from a lab below. What caught his eye was the geometry: in a ring surrounding the mould colony, the bacterial growth was not merely sparse but visibly lysed — dissolved. The mould was secreting something that destroyed the bacteria around it.</p>',
        '<p>Fleming cultured the mould, a species of <em>Penicillium</em>, and called its active product penicillin. Crucially, he tested its reach: it killed <em>Staphylococcus</em>, <em>Streptococcus</em>, the pneumococcus, the diphtheria and meningitis organisms and more, yet it did not harm white blood cells in the dish. That hinted at the property that makes a useful drug — selective toxicity, lethal to the pathogen but gentle to the host.</p>',
        '<div class="pull">Chance favours the prepared mind. The mould landed on thousands of plates across the world; on one, it landed in front of someone who asked the right question.<cite>Why 1928 was the turning point</cite></div>',
        '<h2>The decade of neglect</h2>',
        '<p>Fleming&#8217;s 1929 paper laid out the phenomenon clearly, but he hit a wall. Penicillin in his cultures was scarce, fragile and maddeningly hard to extract; it lost potency quickly and resisted the purification methods of the day. As a clinician-bacteriologist rather than a chemist, Fleming lacked the means — and arguably the conviction — to push it into a drug. He kept the mould alive and shared it with other labs, but for roughly ten years penicillin remained an interesting way to keep unwanted bacteria off culture plates, not a medicine.</p>',
        '<h2>The Oxford rescue</h2>',
        '<p>The transformation came at Oxford&#8217;s Sir William Dunn School of Pathology, where Howard Florey, Ernst Chain and Norman Heatley revisited antibacterial substances around 1939. Heatley&#8217;s ingenuity was decisive: he engineered methods to grow the mould at scale in improvised vessels — including hospital bedpans and ceramic culture pans — and a back-extraction technique to recover and stabilise the active compound. In May 1940 they ran the pivotal experiment: eight mice were given a lethal dose of streptococci; the four treated with penicillin lived, the four untreated died by morning.</p>',
        '<p>The first human trial, in 1941, was a 43-year-old policeman, Albert Alexander, dying of a rampant infection. Penicillin produced a striking recovery — but the team could not make it fast enough, even recovering the drug from the patient&#8217;s urine to re-administer it, and when the supply was exhausted he relapsed and died. The lesson was unmistakable: the science worked; the bottleneck was manufacturing.</p>',
        '__FIG_INHIBITION__',
        '__STATS_PENICILLIN__',
        '<div class="know"><div class="kh">How we know it is real — and why it is safe</div><p>Penicillin&#8217;s selective lethality has a clean mechanical explanation, worked out later: it blocks the enzymes that cross-link the bacterial cell wall, a structure animal cells simply do not have, so growing bacteria burst while our own cells are untouched. The effect is dose-dependent and reproducible in the zone-of-inhibition assay, and was confirmed in controlled animal experiments and then in patients before it was ever mass-produced.</p></div>',
        '<h2>Scaling a miracle</h2>',
        '<p>With wartime demand and British industry stretched, Florey and Heatley took the work to the United States in 1941. There, deep-tank fermentation, a high-yielding strain of <em>Penicillium</em> famously isolated from a mouldy cantaloupe in Peoria, Illinois, and the application of industrial chemistry raised output by orders of magnitude. By the Normandy landings in June 1944 penicillin was available in quantity to treat Allied wounded, saving limbs and lives that infection would otherwise have claimed. Fleming, Florey and Chain shared the 1945 Nobel Prize in Physiology or Medicine.</p>',
        '<h2>The double edge</h2>',
        '<p>Penicillin launched the antibiotic era — streptomycin, the tetracyclines, and dozens more followed — and with it modern surgery, intensive care, transplantation and cancer chemotherapy, all of which depend on controlling infection. But in his Nobel lecture Fleming issued a warning that has aged precisely: misuse the drug, expose bacteria to too little of it, and you will breed resistant strains. Antibiotic resistance is now one of the central challenges in medicine — the predictable evolutionary price of the most consequential drug ever found.</p>',
        '<div class="pull">In a single human lifetime, a bacterial infection went from a common cause of death to a routine inconvenience — and the bacteria began, just as he warned, to fight back.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "crispr": {
    field: "Biotechnology",
    era: "2012 CE",
    subject: "CRISPR–Cas9 gene editing",
    kick: "Biotechnology · The Discovery Series",
    title: 'We learned to edit<br><i>the code of life.</i>',
    dek: "Bacteria have fought viruses for billions of years with a molecular memory that recognises and cuts enemy DNA. In 2012 two scientists realised that system could be reprogrammed — turning an immune defence into a tool that rewrites genes to order.",
    hero: "helix",
    heroImage: { base: "crispr", w: 1280, h: 720, alt: "The Cas9 protein clasped around a DNA double helix at the instant of a precise cut.", credit: "Illustration · Celestium" },
    related: ["double-helix", "ancient-dna", "__scale"],
    depths: [
      [
        '<p><span class="lead">B</span>acteria defend themselves against viruses with a system called CRISPR: they keep snippets of past invaders&#8217; DNA as a memory, and use a protein — Cas9 — guided by a matching strand of RNA to find that exact sequence and cut it. In 2012 Jennifer Doudna and Emmanuelle Charpentier showed the guide could be rewritten to point Cas9 at <em>any</em> chosen DNA sequence. Suddenly there was a cheap, programmable tool to cut the genome at a precise spot and edit it. Within a decade it had reached the clinic, and in 2023 the first CRISPR therapy was approved.</p>',
        '__FIG_CAS9__',
        '<div class="know"><div class="kh">Why it matters</div><p>For the first time, changing a specific gene in a living cell became something an ordinary lab — or eventually a hospital — could do reliably and affordably. It is transforming biology, agriculture and medicine, and forcing hard questions about where editing should stop.</p></div>'
      ],
      [
        '<h2>A defence borrowed from bacteria</h2>',
        '<p><span class="lead">B</span>acteria have been at war with viruses for billions of years, and they evolved a remarkable weapon. In their DNA are strange repeated sequences — CRISPR — interspersed with fragments captured from viruses that attacked their ancestors. It is a genetic memory of past infections. When a remembered virus returns, the bacterium transcribes the stored fragment into a short guide RNA, which leads a cutting protein straight to the matching viral DNA and slices it apart.</p>',
        '<p>The key is how the protein knows where to cut. It does not recognise the DNA itself; it carries the guide RNA, and wherever the guide&#8217;s letters match the DNA&#8217;s letters, it cuts. Change the guide, and you change the target. That was the insight that turned a curiosity into a technology.</p>',
        '<div class="pull">Evolution had already built a search-and-cut machine that takes its instructions from a short, swappable piece of RNA. The trick was to write the instructions ourselves.<cite>The reprogramming idea</cite></div>',
        '<h2>2012: the tool</h2>',
        '<p>In 2012 Jennifer Doudna and Emmanuelle Charpentier, working together, simplified the bacterial system and showed that Cas9 could be programmed with a single, custom-designed guide RNA to cut any DNA sequence they chose, in a test tube. The following year, several groups showed it worked inside living human cells. A method that had taken months and serious expertise now took days and was within reach of almost any molecular-biology lab.</p>',
        '__FIG_CAS9__',
        '__STATS_CRISPR__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The cut site is exactly where the guide RNA matches, and changing a few letters of the guide moves the cut to a new, predicted location. The edits are confirmed by sequencing the DNA afterwards. Thousands of independent labs now use the technique routinely, on organisms from bacteria to plants to human cells — reproducibility on an industrial scale.</p></div>',
        '<h2>From bench to bedside</h2>',
        '<p>Once you can cut DNA at a chosen spot, the cell&#8217;s own repair machinery does the rest — disabling a gene, or, with a supplied template, rewriting it. CRISPR is now used to engineer disease-resistant crops, to build models of illness, and to treat patients. In late 2023 regulators approved the first CRISPR-based therapy, for sickle-cell disease and a related blood disorder. Doudna and Charpentier shared the 2020 Nobel Prize in Chemistry.</p>'
      ],
      [
        '<h2>The repeats nobody could explain</h2>',
        '<p><span class="lead">I</span>n 1987 Japanese researchers noticed an odd structure in bacterial DNA: a set of short, identical repeated sequences separated by unique &#8220;spacer&#8221; segments. Over the next two decades these clustered regularly interspaced short palindromic repeats — CRISPR — turned up across many bacteria and archaea. Francisco Mojica, who coined the name, made the pivotal observation around 2005 that the spacers matched fragments of viral DNA. The implication was startling: the repeats were an adaptive immune system, a heritable record of the viruses a microbial lineage had survived.</p>',
        '<p>In 2007 Rodolphe Barrangou and Philippe Horvath proved it experimentally in the bacteria used to make yogurt: expose the microbes to a virus, and the survivors had added that virus&#8217;s DNA as a new spacer, gaining resistance they passed to their descendants. The associated <em>cas</em> genes encoded the machinery. CRISPR was a genuine immune memory, written in DNA.</p>',
        '<div class="pull">A microbe that survives a virus files a copy of the enemy&#8217;s DNA into its own genome — and its children are born immune. Heredity and immunity, in the same molecule.<cite>What CRISPR is, in nature</cite></div>',
        '<h2>How the machine works</h2>',
        '<p>The system used as a tool, from <em>Streptococcus pyogenes</em>, centres on the Cas9 protein. In the bacterium, a stored spacer is transcribed into a short CRISPR RNA, which together with a second small RNA directs Cas9 to a matching 20-letter stretch of DNA. Cas9 first checks for a tiny adjacent signature called the PAM — a short motif that marks foreign DNA and protects the cell&#8217;s own CRISPR array from self-attack — then unwinds the double helix, lets the guide RNA test for a match, and if the letters pair, cuts both strands cleanly at that site.</p>',
        '<p>In 2012 Doudna and Charpentier&#8217;s team made the decisive engineering move. They fused the two natural RNAs into a single &#8220;single-guide RNA,&#8221; reducing the system to two components: Cas9 plus one programmable guide. By writing the guide&#8217;s 20 letters to match any sequence of interest, they could direct the cut anywhere they wanted — and demonstrated exactly that on purified DNA. They explicitly noted the potential for genome editing.</p>',
        '__FIG_CAS9__',
        '<h2>Into living cells</h2>',
        '<p>A cut is only useful because of what follows. The cell rushes to repair a double-strand break, and it does so in two main ways. Quick, error-prone rejoining tends to scramble a few letters at the break, reliably knocking out the targeted gene. Alternatively, if researchers supply a DNA template spanning the cut, the cell can copy it in during repair, allowing a precise, intended sequence to be written in — correcting a mutation, or inserting new code.</p>',
        '<p>In January 2013 several groups — including those of Feng Zhang and George Church — showed CRISPR-Cas9 editing working efficiently in mammalian and human cells. The barrier to entry collapsed. Where older gene-editing tools had to be laboriously re-engineered as a new protein for each target, CRISPR needed only a new strand of guide RNA, cheap to order and quick to make.</p>',
        '__STATS_CRISPR__',
        '<div class="know"><div class="kh">How we know it is real — and how careful we must be</div><p>Edits are verified by sequencing the DNA at and around the target, and the cut relocates predictably when the guide is changed. But the same tools reveal the technology&#8217;s main risk: off-target cuts at sites that resemble the intended one. A great deal of the field&#8217;s work goes into measuring and minimising these errors — higher-fidelity Cas9 variants, better guide design, and whole-genome checks — before any clinical use.</p></div>',
        '<h2>Promise, and a hard line</h2>',
        '<p>The applications arrived quickly: crops edited for disease resistance and better yield, livestock and lab models, and human therapies. The first approved CRISPR medicine, authorised in late 2023, treats sickle-cell disease and beta-thalassaemia by editing a patient&#8217;s own blood stem cells outside the body to switch on protective fetal haemoglobin, then returning them. Newer refinements — base editing and prime editing — can change single letters without cutting both strands, widening what can be corrected.</p>',
        '<p>The power forced an ethical reckoning. Editing a patient&#8217;s body cells affects only that person; editing eggs, sperm or embryos — the germ line — would change every future descendant. In 2018 a Chinese scientist, He Jiankui, announced he had edited the genomes of twin girls as embryos, drawing near-universal condemnation, a prison sentence, and a broad consensus that heritable human editing is not safe or justified with present knowledge. The science had outrun the wisdom to use it, and the field drew a line.</p>',
        '<div class="pull">In barely a decade, rewriting a chosen gene went from impossible to routine. The remaining questions are no longer mainly technical — they are about what we should choose to do.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "expanding-universe": {
    field: "Cosmology",
    era: "1929 CE",
    subject: "The expanding universe",
    kick: "Cosmology · The Discovery Series",
    title: 'The night we learned<br><i>the universe is growing.</i>',
    dek: "For all of history the cosmos was assumed to be fixed and eternal. Then someone measured the light of distant galaxies and found them all rushing away — and the faster, the farther. Space itself was stretching.",
    hero: "deep-field",
    heroImage: { base: "expanding-universe", w: 1280, h: 720, alt: "A deep field scattered with galaxies — distant ones reddened, nearer ones blue-white — drifting apart across the dark.", credit: "Illustration · Celestium" },
    related: ["weighing-the-universe", "cosmic-background", "__scale"],
    depths: [
      [
        '<p><span class="lead">L</span>ight from a galaxy moving away from us is stretched to redder wavelengths, like a receding siren drops in pitch. In 1929 Edwin Hubble compared the distances of galaxies with these redshifts and found a clean rule: the farther a galaxy, the faster it recedes. There is only one way every galaxy can see all the others fleeing — space itself is expanding, carrying the galaxies apart. Run that expansion backwards and everything was once together: the seed of the Big Bang.</p>',
        '__FIG_HUBBLE__',
        '<div class="know"><div class="kh">Why it matters</div><p>It overturned a universe believed to be static and eternal, and gave us a cosmos with a beginning and an age — about 13.8 billion years. Nearly all of modern cosmology starts here.</p></div>'
      ],
      [
        '<h2>A cosmos assumed to be still</h2>',
        '<p><span class="lead">F</span>or millennia the heavens were the very image of permanence. Even Einstein, applying general relativity to the whole universe in 1917, added a term to his equations to hold it static, because a changing universe seemed unthinkable. The tools to test the assumption did not yet exist.</p>',
        '<p>Two advances changed that. Vesto Slipher found that most &#8220;spiral nebulae&#8221; showed their light shifted toward the red — they were moving away at enormous speeds. And Henrietta Leavitt had discovered that a certain kind of pulsing star, the Cepheid, beats at a rate fixed by its true brightness, turning it into a ruler for measuring cosmic distance.</p>',
        '<div class="pull">Redshift told you how fast a galaxy was moving. Cepheids told you how far. Put them on the same graph and the universe confessed.<cite>The two measurements Hubble combined</cite></div>',
        '<h2>A straight line, 1929</h2>',
        '<p>Edwin Hubble, working with the giant telescope on Mount Wilson and the observations of Milton Humason, plotted recession speed against distance for a set of galaxies. The points fell along a rising straight line: double the distance, double the speed. Two years earlier Georges Lema&#238;tre had derived exactly this from relativity and even estimated the rate.</p>',
        '__FIG_HUBBLE__',
        '__STATS_HUBBLE__',
        '<div class="know"><div class="kh">How we know it is real</div><p>If only our galaxy were special, we might be at some centre. But a uniform expansion looks the same from every galaxy — each sees all the others receding, faster with distance. That is exactly what a stretching space predicts, and exactly what is seen. Later, far more precise surveys confirmed the linear law to great distances.</p></div>',
        '<h2>A universe with a birthday</h2>',
        '<p>An expanding universe was smaller and denser in the past. Wind the film back far enough and everything converges to a hot, dense beginning. The expansion also gives the cosmos an age, found by running it backwards: about 13.8 billion years. The static, eternal universe was gone for good.</p>'
      ],
      [
        '<h2>The assumption nobody questioned</h2>',
        '<p><span class="lead">A</span>n unchanging universe was so deeply assumed that when general relativity implied otherwise, the response was to change the theory. In 1917 Einstein introduced the cosmological constant, a repulsion finely tuned to balance gravity and keep the universe static. It was a fix for a problem that turned out not to exist; he later called it his greatest blunder, though the term has since returned in a different guise.</p>',
        '<p>Meanwhile the raw material for a different picture was accumulating. From 1912 Vesto Slipher, at the Lowell Observatory, painstakingly measured the spectra of spiral nebulae and found the great majority redshifted — receding at hundreds of kilometres per second, far faster than any star in our galaxy. No one yet knew how far away these objects were, or even whether they lay inside the Milky Way.</p>',
        '<div class="pull">The spectra screamed that the nebulae were fleeing. The missing number was their distance — and a pulsing star supplied it.<cite>The state of play in the 1920s</cite></div>',
        '<h2>A ruler made of starlight</h2>',
        '<p>The distance came from Henrietta Swan Leavitt. Studying Cepheid variable stars in the Magellanic Clouds, she found that a Cepheid&#8217;s pulsation period is tightly linked to its intrinsic luminosity. Measure how fast one blinks and you know its true brightness; compare that with how bright it appears and you have its distance. It was the first reliable rung of the cosmic distance ladder.</p>',
        '<p>In 1923&#8211;24 Edwin Hubble found Cepheids in the Andromeda &#8220;nebula&#8221; and used Leavitt&#8217;s relation to measure their distance. The answer placed Andromeda far outside the Milky Way: it was a separate galaxy, an island universe of its own. At a stroke the cosmos grew from one galaxy to countless.</p>',
        '<h2>The law, 1929</h2>',
        '<p>Hubble then combined the two threads. For about two dozen galaxies he had both a distance (from Cepheids and other indicators) and a recession velocity (from Slipher&#8217;s and Humason&#8217;s redshifts). Plotted together, velocity rose in direct proportion to distance: v = H&#8320;d, now called Hubble&#8217;s law. Georges Lema&#238;tre had published the same relation, derived from general relativity, in 1927 &#8212; an expanding-universe solution Einstein had dismissed.</p>',
        '__FIG_HUBBLE__',
        '__STATS_HUBBLE__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The decisive point is that the law has no centre. In a uniformly expanding space, an observer in any galaxy sees every other galaxy receding, with speed proportional to distance &#8212; raisins in a rising loaf all move apart. Coincidental motions cannot produce that pattern. Modern measurements, using supernovae and other standard candles out to billions of light-years, confirm the linear relation and refine the rate.</p></div>',
        '<h2>What the expansion means</h2>',
        '<p>Crucially, the galaxies are not flying through space like debris from an explosion; space itself is expanding and carrying them along. The redshift is space stretching the light in transit, not a simple Doppler shift. Extrapolated backwards, the expansion implies a hot, dense origin &#8212; the framework that became the Big Bang, later confirmed by the cosmic microwave background.</p>',
        '<p>Hubble&#8217;s own value for the expansion rate was far too large, the result of miscalibrated distances; the true rate is roughly 70 kilometres per second per megaparsec, giving an age near 13.8 billion years. Pinning that number down remains live science: two precise methods currently disagree slightly, a discrepancy called the Hubble tension that may yet point to something new.</p>',
        '<div class="pull">We did not watch the universe expand. We measured one straight line, and the whole history of the cosmos followed from its slope.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "periodic-table": {
    field: "Chemistry",
    era: "1869 CE",
    subject: "The periodic table",
    kick: "Chemistry · The Discovery Series",
    title: 'The table that<br><i>predicted the unknown.</i>',
    dek: "Arrange the elements in the right order and a rhythm appears — their properties repeat. Mendeleev trusted that rhythm so completely that he left blank squares for elements no one had found, and described them before they existed.",
    hero: "grid",
    heroImage: { base: "periodic-table", w: 1280, h: 720, alt: "A row of glowing gas-discharge tubes, each holding a different element's light — cool blues and violets beside a single warm amber.", credit: "Illustration · Celestium" },
    related: ["age-of-earth", "double-slit", "__scale"],
    depths: [
      [
        '<p><span class="lead">B</span>y the 1860s dozens of elements were known, but they looked like a junk drawer. In 1869 Dmitri Mendeleev laid them out in order of atomic weight and noticed that chemical properties recur at regular intervals &#8212; a periodic pattern. To keep the pattern intact he did something audacious: where no known element fit, he left a gap, and predicted the missing element&#8217;s weight and behaviour. Within twenty years gallium, scandium and germanium were discovered, matching his forecasts almost exactly. The table had predicted the unknown.</p>',
        '__FIG_PERIODIC__',
        '<div class="know"><div class="kh">Why it matters</div><p>It turned chemistry from a catalogue into a science with a deep structure &#8212; a structure later explained by the architecture of the atom itself. Every chemistry classroom on Earth still hangs the same map.</p></div>'
      ],
      [
        '<h2>A drawer full of elements</h2>',
        '<p><span class="lead">I</span>n the mid-nineteenth century chemists had isolated more than sixty elements and measured their atomic weights, but had no framework to organise them. Several people sensed a pattern in the numbers; the German chemist Julius Lothar Meyer was working toward one at the same time. The breakthrough belonged to Dmitri Mendeleev.</p>',
        '<p>Laying the elements out in order of increasing atomic weight, Mendeleev saw that properties &#8212; how an element bonds, what it reacts with, how it behaves &#8212; repeat at regular intervals. Start a new row at the right moment and elements with similar character line up in columns. He called it the periodic law.</p>',
        '<div class="pull">The genius was not the rows. It was trusting the pattern more than the data &#8212; leaving holes rather than forcing a bad fit.<cite>What set Mendeleev apart</cite></div>',
        '<h2>Blanks, filled in advance</h2>',
        '<p>Where the pattern demanded an element that no one had found, Mendeleev left an empty square and predicted what would fill it. For the gap below silicon &#8212; he called it &#8220;eka-silicon&#8221; &#8212; he foretold the atomic weight, the density, even the colour of its compounds. When germanium was isolated in 1886, the match was uncanny.</p>',
        '__FIG_PERIODIC__',
        '__STATS_PERIODIC__',
        '<div class="know"><div class="kh">How we know it is real</div><p>A good classification organises what you already know; a great one predicts what you do not. Mendeleev&#8217;s table forecast three elements &#8212; gallium, scandium and germanium &#8212; with specific properties, and all three were found, as described, within fifteen years. Predictions that risky, confirmed that precisely, are how a pattern proves it is real and not a coincidence.</p></div>',
        '<h2>Why it works</h2>',
        '<p>Mendeleev did not know why the elements repeat; he only knew that they do. The reason emerged decades later, with the discovery that the true order is the number of protons in the nucleus, and that the recurring properties come from how electrons fill shells around it. The table was a map of atomic structure drawn long before anyone could see the atom.</p>'
      ],
      [
        '<h2>Order out of sixty-three elements</h2>',
        '<p><span class="lead">B</span>y 1869 chemistry had assembled the pieces of a puzzle without the picture: sixty-odd elements, reasonably accurate atomic weights, and a growing sense that elements fall into families &#8212; the reactive alkali metals, the corrosive halogens, the inert-seeming earths. Several chemists had glimpsed periodicity. John Newlands proposed a &#8220;law of octaves&#8221; and was mocked; Lothar Meyer built a similar table near-simultaneously with Mendeleev. The problem was not noticing a pattern but committing to it.</p>',
        '<p>Mendeleev, the story goes, wrote the elements on cards and shuffled them like a game of patience until the structure fell out. Arranged by ascending atomic weight and broken into rows at the right points, elements of like character stacked into vertical groups. He published the periodic law in 1869.</p>',
        '<div class="pull">Newlands saw the octaves and was laughed at. Mendeleev saw them and bet his reputation that the gaps were elements waiting to be found.<cite>Pattern versus conviction</cite></div>',
        '<h2>The audacity of the gaps</h2>',
        '<p>Two features made Mendeleev&#8217;s table more than a tidy arrangement. First, where ordering strictly by weight broke the chemical pattern, he trusted the chemistry and adjusted &#8212; correctly anticipating that some accepted atomic weights were simply wrong. Second, and famously, he left blanks. Rather than crush a misfit element into the wrong slot, he asserted that the slot belonged to an element not yet discovered, and predicted its properties in detail.</p>',
        '<p>For eka-silicon he predicted an atomic weight near 72, a density around 5.5, a grey metal forming an oxide of a particular formula. In 1886 Clemens Winkler isolated germanium: atomic weight 72.6, density 5.35, every property close to the forecast. Gallium (eka-aluminium, 1875) and scandium (eka-boron, 1879) had already confirmed two earlier predictions. The table was not describing chemistry; it was anticipating it.</p>',
        '__FIG_PERIODIC__',
        '__STATS_PERIODIC__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The predictions are the proof. Three undiscovered elements, each forecast with specific numbers, each subsequently found matching those numbers &#8212; that is a classification making falsifiable claims about reality and passing. Later, the table survived an even sterner test: whole families of elements no one anticipated, the noble gases, were discovered in the 1890s, and slotted cleanly into a new column without breaking the structure.</p></div>',
        '<h2>The deeper law beneath</h2>',
        '<p>Mendeleev ordered by atomic weight, which mostly works but occasionally misfires &#8212; argon is heavier than potassium yet clearly belongs before it. In 1913 Henry Moseley resolved the anomalies by showing that the true ordering principle is the atomic number, the count of protons in the nucleus. The periodic recurrence itself was finally explained by quantum mechanics: properties repeat because electrons fill shells in a repeating pattern, and an element&#8217;s chemistry is set by its outermost electrons.</p>',
        '<p>The table has since grown to 118 elements, the heaviest of them fleeting creations of particle accelerators, each one slotting into the place the structure reserves for it. A map sketched from chemical intuition in 1869 turned out to be a map of the atom.</p>',
        '<div class="pull">He could not have known about protons or electron shells. He simply trusted the rhythm of the elements &#8212; and the rhythm was the atom, keeping time.<cite>The standing result</cite></div>'
      ]
    ]
  },

  "vaccination": {
    field: "Medicine",
    era: "1796 – 1980",
    subject: "Vaccination & smallpox",
    kick: "Medicine · The Discovery Series",
    title: 'How we taught the body<br><i>to remember a disease.</i>',
    dek: "Smallpox killed hundreds of millions and scarred or blinded millions more. Then a country doctor noticed that milkmaids never caught it — and turned that clue into the idea that would, two centuries later, wipe the disease from the Earth.",
    hero: "culture",
    heroImage: { base: "vaccination", w: 1280, h: 720, alt: "A single glass vaccine vial lit by cool blue light with a warm highlight, standing in darkness.", credit: "Illustration · Celestium" },
    related: ["penicillin", "double-helix", "__scale"],
    depths: [
      [
        '<p><span class="lead">T</span>he immune system remembers. Show it a harmless version of a threat and it builds defences, so that when the real pathogen arrives it is met and beaten before it can take hold. In 1796 Edward Jenner acted on a country observation &#8212; milkmaids who caught mild cowpox never got smallpox &#8212; and deliberately gave a boy cowpox, then exposed him to smallpox. The boy stayed well. That was the first vaccine. Refined and spread over two centuries, it ended with smallpox &#8212; a disease that killed perhaps 300 million people in the twentieth century alone &#8212; being declared eradicated in 1980, the only human disease ever erased.</p>',
        '__FIG_IMMUNE__',
        '<div class="know"><div class="kh">Why it matters</div><p>Vaccination is among the few interventions that have saved lives by the hundreds of millions, and the only one that has driven a human disease to extinction. Every modern vaccine descends from Jenner&#8217;s insight.</p></div>'
      ],
      [
        '<h2>The most feared disease</h2>',
        '<p><span class="lead">F</span>or most of history smallpox was a near-universal terror. It killed roughly a third of those it infected and left survivors scarred, often blinded. Older defences existed: variolation &#8212; deliberately infecting someone with a small dose of smallpox itself to induce mild illness and lasting immunity &#8212; was practised for centuries in China, India, Africa and the Ottoman world, and reached Britain in the 1720s. It worked, but it could kill, and it could start outbreaks.</p>',
        '<p>Edward Jenner, a physician in rural Gloucestershire, knew the local lore that milkmaids who caught cowpox &#8212; a mild disease of the udder &#8212; seemed immune to smallpox. In 1796 he tested it: he took matter from a cowpox sore on a milkmaid&#8217;s hand and inoculated an eight-year-old boy, James Phipps. Weeks later he exposed the boy to smallpox. Nothing happened. The protection of cowpox carried across to its deadly cousin.</p>',
        '<div class="pull">Variolation fought smallpox with smallpox, and sometimes lost. Jenner&#8217;s leap was to fight it with something milder that the body mistook for the same enemy.<cite>Why cowpox changed everything</cite></div>',
        '<h2>A safe substitute</h2>',
        '<p>Because cowpox is closely related to smallpox but far milder, the immune response it provokes also recognises smallpox &#8212; without the danger of giving someone the lethal disease. Jenner called the method vaccination, from <em>vacca</em>, the Latin for cow. He published in 1798. The practice spread across the world within years, long before anyone understood why it worked.</p>',
        '__FIG_IMMUNE__',
        '__STATS_VACCINE__',
        '<div class="know"><div class="kh">How we know it is real</div><p>The effect is repeatable and specific: vaccinated populations stop getting the disease, and the protection tracks the immune memory the vaccine creates. The ultimate proof was global. A coordinated campaign in the twentieth century pushed smallpox into ever-smaller pockets until the last natural case, in Somalia in 1977. After years of surveillance finding none, it was declared eradicated in 1980.</p></div>',
        '<h2>Memory, made visible</h2>',
        '<p>The mechanism, worked out by later immunology, is memory. The first encounter with a pathogen &#8212; or a vaccine &#8212; provokes a slow, modest response while the body learns the threat. But it keeps that lesson in long-lived memory cells. A second encounter triggers a response so large and so fast that the infection is often stopped before symptoms ever appear. A vaccine simply arranges that first, safe lesson in advance.</p>'
      ],
      [
        '<h2>A scourge, and an old defence</h2>',
        '<p><span class="lead">S</span>mallpox shaped human history as few diseases have, killing emperors and peasants alike and depopulating whole regions when it reached people with no prior exposure. Caused by the variola virus, it killed around 30 per cent of those infected and disfigured most survivors. Against it, societies had developed variolation: introducing material from a smallpox pustule into a healthy person, usually through a scratch, to provoke a milder infection and durable immunity.</p>',
        '<p>Variolation was genuinely effective and widely practised across Asia and Africa; Lady Mary Wortley Montagu, having seen it in Constantinople, championed it in England from 1721. But it carried real risk: a few per cent of those variolated died, and each one was briefly contagious, capable of seeding a fresh epidemic. A safer method was badly needed.</p>',
        '<div class="pull">The folk wisdom was hiding in plain sight on every dairy farm: the women who milked the cows did not get the pox.<cite>The clue Jenner followed</cite></div>',
        '<h2>The experiment of 1796</h2>',
        '<p>Edward Jenner formalised a piece of country knowledge &#8212; that cowpox seemed to protect against smallpox. On 14 May 1796 he took fluid from a cowpox lesion on the hand of a milkmaid, Sarah Nelmes, and introduced it into incisions on the arm of James Phipps, the young son of his gardener. The boy developed a brief mild illness and recovered. Then, in July, Jenner deliberately inoculated him with smallpox itself. No disease developed. He repeated the smallpox challenge later; still nothing. Cowpox had made the boy immune.</p>',
        '<p>By modern standards the experiment was ethically fraught &#8212; a child, deliberately exposed to a lethal disease. But the result was unambiguous and reproducible. Jenner published <em>An Inquiry into the Causes and Effects of the Variolae Vaccinae</em> in 1798, coining the term vaccine from the Latin for cow.</p>',
        '__FIG_IMMUNE__',
        '__STATS_VACCINE__',
        '<div class="know"><div class="kh">How we know it is real</div><p>Vaccination&#8217;s effect is specific, dose-dependent and reproducible, and it was tested at every scale &#8212; from Jenner&#8217;s repeated challenges of single subjects, to national programmes, to a global eradication effort. The decisive evidence is that smallpox no longer exists in the wild: relentless vaccination and case-tracing drove transmission to zero, with the last endemic case in 1977 and eradication certified in 1980.</p></div>',
        '<h2>Why a preview protects</h2>',
        '<p>The biology behind Jenner&#8217;s success was understood only much later. The immune system learns the molecular signatures of pathogens and retains them in memory B and T cells. A first exposure mounts a sluggish primary response; a later exposure to the same signature triggers a secondary response that is faster and far stronger &#8212; frequently fast enough to clear the invader before illness begins. A vaccine presents a harmless version of those signatures &#8212; a weakened or related microbe, an inactivated one, a fragment, or, more recently, instructions for the body to make a fragment itself &#8212; so the protective memory is built without the disease.</p>',
        '<p>From this one idea grew vaccines against polio, measles, tetanus, hepatitis, and more, sparing lives by the hundreds of millions. Smallpox remains the singular triumph: in 1980 the World Health Organization declared it eradicated, the first and still the only human disease ever deliberately wiped from the Earth.</p>',
        '<div class="pull">A country doctor noticed who did not get sick, and acted on it. Two centuries later, a disease that had haunted humanity since antiquity was simply gone.<cite>The standing result</cite></div>'
      ]
    ]
  }
};

export default DISCOVERIES;
