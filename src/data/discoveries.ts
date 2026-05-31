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
    related: ["gravitational-waves", "weighing-the-universe", "__scale"],
    depths: [
      [
        '<p><span class="lead">A</span> black hole traps light, so it cannot be seen directly. But the superheated gas swirling around one glows — and a black hole carves a dark, precisely-sized "shadow" out of that glow. In April 2019 the Event Horizon Telescope — eight radio dishes turned into one Earth-sized instrument — released the first image of that shadow, around the giant black hole in galaxy M87. Its size matched Einstein’s general relativity to within the error bars. In 2022 the same team imaged the one at the centre of our own galaxy.</p>',
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
    related: ["black-hole-image", "weighing-the-universe", "__scale"],
    depths: [
      [
        '<p><span class="lead">E</span>instein predicted that violent events should send ripples through spacetime — gravitational waves — stretching and squeezing space as they pass. They are so faint he doubted they could ever be detected. On 14 September 2015 two detectors in the United States caught one: the merger of two black holes about 1.3 billion light-years away. The wave changed each detector’s 4-kilometre arms by about a ten-thousandth the width of a proton. It opened an entirely new way to observe the universe — by listening instead of looking.</p>',
        '<div class="know"><div class="kh">Why it matters</div><p>Every telescope in history collected light. This was the first time humanity sensed the universe through gravity itself — and confirmed a 1916 prediction in the same instant.</p></div>'
      ],
      [
        '<h2>Ripples nobody expected to catch</h2>',
        '<p><span class="lead">I</span>n 1916 Einstein showed that masses in violent, asymmetric motion should radiate energy as waves in the fabric of spacetime — alternately stretching and compressing distance itself. The effect is almost unimaginably tiny. Einstein himself doubted it would ever be measured.</p>',
        '<p>The strongest sources are cataclysms: two dense, massive objects spiralling into each other. As they merge they briefly outshine — in gravitational power — every star in the observable universe combined. Yet by the time that signal crosses cosmic distance to Earth, it distorts space by less than one part in a billion trillion.</p>',
        '<div class="pull">The merger releases more power than all the stars in the universe — and arrives as a whisper smaller than an atom.<cite>The detection challenge</cite></div>',
        '<h2>An instrument that measures almost nothing</h2>',
        '<p>LIGO answers this with two L-shaped detectors, in Washington and Louisiana, each with arms four kilometres long. A laser is split down both arms, bounced off suspended mirrors, and recombined. A passing gravitational wave lengthens one arm while shortening the other, and the recombined light shifts. The change being measured is around a ten-thousandth the diameter of a proton.</p>',
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
    related: ["black-hole-image", "gravitational-waves", "__scale"],
    depths: [
      [
        '<p><span class="lead">Y</span>ou cannot weigh a galaxy directly, so astronomers let gravity do it: the faster things orbit, the more mass must be pulling on them. Do this carefully and the visible stars and gas fall far short — galaxies behave as if wrapped in vast halos of unseen matter. Add the way light bends around clusters and the geometry of the infant universe, and the books only balance if ordinary matter is about 5% of the total, with roughly 27% "dark matter" and 68% "dark energy." We have weighed the universe with confidence — and found we cannot see almost any of it.</p>',
        '<div class="know"><div class="kh">Why it matters</div><p>Independent methods, using completely different physics, all demand the same invisible 95%. That agreement is why dark matter and dark energy are taken seriously rather than dismissed.</p></div>'
      ],
      [
        '<h2>Weighing without a scale</h2>',
        '<p><span class="lead">G</span>ravity is a balance you can read from a distance. Watch how fast stars circle a galaxy, or how galaxies swarm within a cluster, and Newton and Einstein let you infer the mass doing the pulling. In 1933 Fritz Zwicky did this for a cluster of galaxies and found them moving far too fast for their visible matter to hold them together. The discrepancy was so large it was largely set aside for forty years.</p>',
        '<p>In the 1970s Vera Rubin and Kent Ford measured how orbital speed changes with distance from a galaxy’s centre. It should fall off at the edges, the way outer planets orbit the Sun more slowly. Instead it stayed stubbornly flat — implying a huge, invisible halo of mass extending well beyond the visible stars.</p>',
        '<div class="pull">The stars at a galaxy’s edge move as if held by something enormous that emits no light at all.<cite>The rotation-curve problem</cite></div>',
        '<h2>Three witnesses, one verdict</h2>',
        '<p>Rotation curves alone could be a fluke of one method. They are not alone. Massive clusters bend the light of galaxies behind them — gravitational lensing — and the bending reveals far more mass than any glowing matter present. And the faint afterglow of the Big Bang, the cosmic microwave background, encodes the precise composition of the early universe in its pattern of ripples.</p>',
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
    related: ["weighing-the-universe", "black-hole-image", "__scale"],
    depths: [
      [
        '<p><span class="lead">A</span> planet beside a star is like a firefly beside a lighthouse — a billion times fainter, swallowed in the glare. For most of history that ended the discussion. The way around it: a planet tugs on its star as much as the star tugs on it, and a heavy enough planet makes its star wobble by a few metres per second. In October 1995, Michel Mayor and Didier Queloz measured that wobble in a sun-like star fifty light-years away. The world they had found, 51 Pegasi b, was a gas giant whipping around its sun every four days — a configuration nobody had predicted. The count of known worlds has not stopped growing since.</p>',
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
        '<div class="pull">A single signal rewrote how solar systems are allowed to look.<cite>The theoretical aftermath</cite></div>',
        '<h2>The flood</h2>',
        '<p>Radial-velocity surveys produced steady detections through the late 1990s. The decisive jump came with transit photometry — watching for the small periodic dimming when a planet crosses in front of its star. NASA’s Kepler mission, staring at a single patch of sky from 2009 to 2018, alone confirmed thousands of worlds. Microlensing, direct imaging, and timing methods added more. The catalogue today exceeds five thousand confirmed exoplanets across more than three thousand systems, with statistical estimates suggesting most stars in the galaxy host at least one planet.</p>',
        '<p>Mayor and Queloz received the 2019 Nobel Prize in Physics for the original discovery. The James Webb Space Telescope now reads the atmospheres of transiting planets by taking the spectrum of starlight that has passed through them — searching for water, methane, carbon dioxide, and the disequilibrium chemistry that might suggest life.</p>',
        '<h2>The next question</h2>',
        '<p>The original question — does any other star host any planet at all — is closed. The replacement is more pointed: do any of those planets carry life, and how would we know across the void? Atmospheric biosignatures — gas ratios that abiotic chemistry cannot explain — are the current best candidate. We may yet answer the older question, the harder one, in a single human lifetime.</p>'
      ]
    ]
  }
};

export default DISCOVERIES;
