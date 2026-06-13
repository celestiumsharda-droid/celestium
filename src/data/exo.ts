/* CELESTIUM — EXOPLANET SYSTEMS (data). 22 real systems (NASA Exoplanet
   Archive, 2026) at their true J2000 sky positions. Radii/masses/orbits/
   periods real (Kepler's law fills gaps for directly-imaged worlds); star
   colour+radius from temperature/class; albedo maps are scientific
   interpretations — no exoplanet surface has been resolved. */
export interface ExoPlanet { key: string; name: string; rE: number; au: number; per: number; kind: string; massE: number | null; tempK: number | null; }
export interface ExoSystem { pack: string; star: string; ra: number; dec: number; ly: number; tempK: number | null; spec: string; rSun: number; col: number; pulsar: boolean; kindStar: string; planets: ExoPlanet[]; }
const EXO_SYSTEMS: ExoSystem[] = [
 {
  "pack": "Proxima_Centauri",
  "star": "Proxima Cen",
  "ra": 14.4956,
  "dec": -62.676,
  "ly": 4.247,
  "tempK": 2900,
  "spec": "M5.5 V",
  "rSun": 0.141,
  "col": 16748382,
  "pulsar": false,
  "kindStar": "M-type main-sequence star",
  "planets": [
   {
    "key": "d",
    "name": "Proxima Cen d",
    "rE": 0.7,
    "au": 0.0288,
    "per": 5.12,
    "kind": "temperate rocky planet",
    "massE": 0.26,
    "tempK": 282
   },
   {
    "key": "b",
    "name": "Proxima Cen b",
    "rE": 1,
    "au": 0.048,
    "per": 11.19,
    "kind": "cold rocky planet",
    "massE": 1,
    "tempK": 216
   }
  ]
 },
 {
  "pack": "Kepler-186",
  "star": "Kepler-186",
  "ra": 19.9112,
  "dec": 43.954,
  "ly": 579,
  "tempK": 3751,
  "spec": "",
  "rSun": 0.443,
  "col": 16748382,
  "pulsar": false,
  "kindStar": "M-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "Kepler-186 b",
    "rE": 0.97,
    "au": 0.0371,
    "per": 3.89,
    "kind": "warm rocky planet",
    "massE": null,
    "tempK": 571
   },
   {
    "key": "c",
    "name": "Kepler-186 c",
    "rE": 1.14,
    "au": 0.0564,
    "per": 7.27,
    "kind": "warm rocky planet",
    "massE": null,
    "tempK": 464
   },
   {
    "key": "d",
    "name": "Kepler-186 d",
    "rE": 1.29,
    "au": 0.0845,
    "per": 13.34,
    "kind": "temperate rocky planet",
    "massE": null,
    "tempK": 379
   },
   {
    "key": "e",
    "name": "Kepler-186 e",
    "rE": 1.15,
    "au": 0.1194,
    "per": 22.41,
    "kind": "temperate rocky planet",
    "massE": null,
    "tempK": 319
   },
   {
    "key": "f",
    "name": "Kepler-186 f",
    "rE": 1.18,
    "au": 0.3855,
    "per": 129.95,
    "kind": "cold rocky planet",
    "massE": null,
    "tempK": 177
   }
  ]
 },
 {
  "pack": "Kepler-22",
  "star": "Kepler-22",
  "ra": 19.2682,
  "dec": 47.89,
  "ly": 638,
  "tempK": 5596,
  "spec": "",
  "rSun": 0.868,
  "col": 16773846,
  "pulsar": false,
  "kindStar": "K-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "Kepler-22 b",
    "rE": 2.1,
    "au": 0.812,
    "per": 289.86,
    "kind": "sub-Neptune / volatile-rich mini-Neptune",
    "massE": 9.1,
    "tempK": 279
   }
  ]
 },
 {
  "pack": "Kepler-62",
  "star": "Kepler-62",
  "ra": 18.879,
  "dec": 45.349,
  "ly": 980,
  "tempK": 4925,
  "spec": "K2 V",
  "rSun": 0.639,
  "col": 16767392,
  "pulsar": false,
  "kindStar": "K-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "Kepler-62 b",
    "rE": 1.31,
    "au": 0.0553,
    "per": 5.71,
    "kind": "warm rocky planet",
    "massE": 9,
    "tempK": 750
   },
   {
    "key": "c",
    "name": "Kepler-62 c",
    "rE": 0.54,
    "au": 0.0929,
    "per": 12.44,
    "kind": "warm rocky planet",
    "massE": 4,
    "tempK": 578
   },
   {
    "key": "d",
    "name": "Kepler-62 d",
    "rE": 1.95,
    "au": 0.12,
    "per": 18.16,
    "kind": "sub-Neptune / volatile-rich mini-Neptune",
    "massE": 14,
    "tempK": 510
   },
   {
    "key": "e",
    "name": "Kepler-62 e",
    "rE": 1.61,
    "au": 0.427,
    "per": 122.39,
    "kind": "temperate rocky planet",
    "massE": 36,
    "tempK": 270
   },
   {
    "key": "f",
    "name": "Kepler-62 f",
    "rE": 1.41,
    "au": 0.718,
    "per": 267.29,
    "kind": "cold rocky planet",
    "massE": 35,
    "tempK": 208
   }
  ]
 },
 {
  "pack": "Kepler-452",
  "star": "Kepler-452",
  "ra": 19.7442,
  "dec": 44.278,
  "ly": 1810,
  "tempK": 5578,
  "spec": "",
  "rSun": 0.793,
  "col": 16773846,
  "pulsar": false,
  "kindStar": "K-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "Kepler-452 b",
    "rE": 1.13,
    "au": 0.9892,
    "per": 384.84,
    "kind": "cold rocky planet",
    "massE": null,
    "tempK": 220
   }
  ]
 },
 {
  "pack": "TOI-700",
  "star": "TOI-700",
  "ra": 6.444,
  "dec": -65.578,
  "ly": 101,
  "tempK": 3461,
  "spec": "",
  "rSun": 0.424,
  "col": 16748382,
  "pulsar": false,
  "kindStar": "ultra-cool dwarf star",
  "planets": [
   {
    "key": "b",
    "name": "TOI-700 b",
    "rE": 1.04,
    "au": 0.0677,
    "per": 9.98,
    "kind": "warm rocky planet",
    "massE": null,
    "tempK": 417
   },
   {
    "key": "c",
    "name": "TOI-700 c",
    "rE": 2.65,
    "au": 0.0929,
    "per": 16.05,
    "kind": "sub-Neptune / volatile-rich mini-Neptune",
    "massE": null,
    "tempK": 356
   },
   {
    "key": "e",
    "name": "TOI-700 e",
    "rE": 0.95,
    "au": 0.134,
    "per": 27.81,
    "kind": "rocky exoplanet",
    "massE": null,
    "tempK": null
   },
   {
    "key": "d",
    "name": "TOI-700 d",
    "rE": 1.14,
    "au": 0.1633,
    "per": 37.42,
    "kind": "temperate rocky planet",
    "massE": null,
    "tempK": 268.8
   }
  ]
 },
 {
  "pack": "LHS_1140",
  "star": "LHS 1140",
  "ra": 0.73,
  "dec": -15.271,
  "ly": 48.9,
  "tempK": 3216,
  "spec": "",
  "rSun": 0.214,
  "col": 16748382,
  "pulsar": false,
  "kindStar": "ultra-cool dwarf star",
  "planets": [
   {
    "key": "c",
    "name": "LHS 1140 c",
    "rE": 1.28,
    "au": 0.0267,
    "per": 3.78,
    "kind": "warm rocky planet",
    "massE": 1.81,
    "tempK": 438
   },
   {
    "key": "b",
    "name": "LHS 1140 b",
    "rE": 1.43,
    "au": 0.0875,
    "per": 24.74,
    "kind": "temperate rocky planet",
    "massE": 6.65,
    "tempK": 230
   }
  ]
 },
 {
  "pack": "Teegardens_Star",
  "star": "Teegarden's Star",
  "ra": 2.8917,
  "dec": 16.88,
  "ly": 12.5,
  "tempK": 3034,
  "spec": "",
  "rSun": 0.12,
  "col": 16748382,
  "pulsar": false,
  "kindStar": "ultra-cool dwarf star",
  "planets": [
   {
    "key": "b",
    "name": "Teegarden's Star b",
    "rE": 1.04,
    "au": 0.0259,
    "per": 4.91,
    "kind": "temperate rocky planet",
    "massE": 1.16,
    "tempK": 277
   },
   {
    "key": "c",
    "name": "Teegarden's Star c",
    "rE": 1.01,
    "au": 0.0455,
    "per": 11.42,
    "kind": "cold rocky planet",
    "massE": 1.05,
    "tempK": 209
   },
   {
    "key": "d",
    "name": "Teegarden's Star d",
    "rE": 0.95,
    "au": 0.0791,
    "per": 26.13,
    "kind": "rocky exoplanet",
    "massE": 0.82,
    "tempK": 159
   }
  ]
 },
 {
  "pack": "HR_8799",
  "star": "HR 8799",
  "ra": 23.0696,
  "dec": 21.134,
  "ly": 133,
  "tempK": 7400,
  "spec": "A5",
  "rSun": 1.25,
  "col": 16774378,
  "pulsar": false,
  "kindStar": "A-type main-sequence star",
  "planets": [
   {
    "key": "e",
    "name": "HR 8799 e",
    "rE": 13.11,
    "au": 16.4,
    "per": 21697.07,
    "kind": "gas giant",
    "massE": 3178.3,
    "tempK": 1150
   },
   {
    "key": "d",
    "name": "HR 8799 d",
    "rE": 13,
    "au": 24,
    "per": 37000,
    "kind": "gas giant",
    "massE": 3000,
    "tempK": null
   },
   {
    "key": "c",
    "name": "HR 8799 c",
    "rE": 13,
    "au": 38,
    "per": 69000,
    "kind": "gas giant",
    "massE": 3000,
    "tempK": null
   },
   {
    "key": "b",
    "name": "HR 8799 b",
    "rE": 13,
    "au": 68,
    "per": 170000,
    "kind": "gas giant",
    "massE": 2000,
    "tempK": null
   }
  ]
 },
 {
  "pack": "Beta_Pictoris",
  "star": "bet Pic",
  "ra": 5.7881,
  "dec": -51.066,
  "ly": 63.4,
  "tempK": null,
  "spec": "",
  "rSun": 0.85,
  "col": 16773846,
  "pulsar": false,
  "kindStar": "main-sequence star",
  "planets": [
   {
    "key": "c",
    "name": "bet Pic c",
    "rE": 1.3,
    "au": 2.72,
    "per": 1230,
    "kind": "hot rocky planet",
    "massE": 2606.1929374,
    "tempK": 1250
   },
   {
    "key": "b",
    "name": "bet Pic b",
    "rE": 16.8,
    "au": 8.9,
    "per": 10518.79,
    "kind": "gas giant",
    "massE": 6356,
    "tempK": 1650
   }
  ]
 },
 {
  "pack": "Fomalhaut",
  "star": "Fomalhaut",
  "ra": 22.9608,
  "dec": -29.622,
  "ly": 25.1,
  "tempK": 8590,
  "spec": "A3 V",
  "rSun": 1.829,
  "col": 15265535,
  "pulsar": false,
  "kindStar": "A-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "Fomalhaut b",
    "rE": 5.5,
    "au": 115,
    "per": 874666,
    "kind": "gas giant / directly imaged planet",
    "massE": 1000,
    "tempK": 290
   }
  ]
 },
 {
  "pack": "PDS_70",
  "star": "PDS 70",
  "ra": 14.1373,
  "dec": -41.403,
  "ly": 370,
  "tempK": 3972,
  "spec": "",
  "rSun": 0.6,
  "col": 16767392,
  "pulsar": false,
  "kindStar": "M-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "PDS 70 b",
    "rE": 30.49,
    "au": 20,
    "per": 42175.44,
    "kind": "gas giant",
    "massE": 953.49,
    "tempK": 1204
   },
   {
    "key": "c",
    "name": "PDS 70 c",
    "rE": 22.87,
    "au": 34,
    "per": 93483.07,
    "kind": "gas giant",
    "massE": 635.66,
    "tempK": 995
   }
  ]
 },
 {
  "pack": "AU_Microscopii",
  "star": "AU Mic",
  "ra": 20.7521,
  "dec": -31.341,
  "ly": 31.7,
  "tempK": 3665,
  "spec": "",
  "rSun": 0.819,
  "col": 16748382,
  "pulsar": false,
  "kindStar": "M-type main-sequence star",
  "planets": [
   {
    "key": "e",
    "name": "AU Mic e",
    "rE": 1.3,
    "au": 0.1899,
    "per": 33.39,
    "kind": "rocky exoplanet",
    "massE": 35.2,
    "tempK": null
   },
   {
    "key": "d",
    "name": "AU Mic d",
    "rE": 1.01,
    "au": 0.0999,
    "per": 12.74,
    "kind": "rocky exoplanet",
    "massE": 1.053,
    "tempK": null
   },
   {
    "key": "b",
    "name": "AU Mic b",
    "rE": 4.07,
    "au": 0.0645,
    "per": 8.46,
    "kind": "ice giant / sub-Neptune",
    "massE": 17,
    "tempK": 593
   },
   {
    "key": "c",
    "name": "AU Mic c",
    "rE": 3.24,
    "au": 0.1101,
    "per": 18.86,
    "kind": "warm rocky planet",
    "massE": 13.6,
    "tempK": 454
   }
  ]
 },
 {
  "pack": "51_Pegasi",
  "star": "51 Peg",
  "ra": 22.9609,
  "dec": 20.769,
  "ly": 50.4,
  "tempK": null,
  "spec": "",
  "rSun": 0.85,
  "col": 16773846,
  "pulsar": false,
  "kindStar": "main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "51 Peg b",
    "rE": 11,
    "au": 0.052,
    "per": 4.23,
    "kind": "gas giant",
    "massE": 146.2018,
    "tempK": null
   }
  ]
 },
 {
  "pack": "55_Cancri",
  "star": "55 Cnc",
  "ra": 8.0526,
  "dec": 28.33,
  "ly": 41.1,
  "tempK": 5234,
  "spec": "",
  "rSun": 0.942,
  "col": 16773846,
  "pulsar": false,
  "kindStar": "K-type main-sequence star",
  "planets": [
   {
    "key": "e",
    "name": "55 Cnc e",
    "rE": 2.08,
    "au": 0.0154,
    "per": 0.74,
    "kind": "ultra-hot rocky / lava world",
    "massE": 7.81,
    "tempK": 1958
   },
   {
    "key": "b",
    "name": "55 Cnc b",
    "rE": 1.3,
    "au": 0.113,
    "per": 14.6,
    "kind": "warm rocky planet",
    "massE": 254.25,
    "tempK": 700
   },
   {
    "key": "c",
    "name": "55 Cnc c",
    "rE": 1.3,
    "au": 0.2306,
    "per": 44.39,
    "kind": "rocky exoplanet",
    "massE": 48.7,
    "tempK": null
   },
   {
    "key": "f",
    "name": "55 Cnc f",
    "rE": 1.3,
    "au": 0.75,
    "per": 260.54,
    "kind": "rocky exoplanet",
    "massE": 40.4,
    "tempK": null
   },
   {
    "key": "d",
    "name": "55 Cnc d",
    "rE": 11,
    "au": 5.257,
    "per": 4517.4,
    "kind": "gas giant",
    "massE": 1243.35096,
    "tempK": null
   }
  ]
 },
 {
  "pack": "Upsilon_Andromedae",
  "star": "ups And",
  "ra": 1.6171,
  "dec": 41.406,
  "ly": 44,
  "tempK": 6200,
  "spec": "F8 V",
  "rSun": 1.25,
  "col": 16774378,
  "pulsar": false,
  "kindStar": "F-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "ups And b",
    "rE": 11,
    "au": 0.057,
    "per": 4.61,
    "kind": "gas giant",
    "massE": 216.1244,
    "tempK": null
   },
   {
    "key": "c",
    "name": "ups And c",
    "rE": 11,
    "au": 0.821,
    "per": 238.1,
    "kind": "gas giant",
    "massE": 715.09,
    "tempK": null
   },
   {
    "key": "d",
    "name": "ups And d",
    "rE": 11,
    "au": 2.51,
    "per": 1274.6,
    "kind": "gas giant",
    "massE": 1255.38,
    "tempK": null
   }
  ]
 },
 {
  "pack": "WASP-12",
  "star": "WASP-12",
  "ra": 6.5085,
  "dec": 29.672,
  "ly": 1410,
  "tempK": 6250,
  "spec": "",
  "rSun": 1.618,
  "col": 16774378,
  "pulsar": false,
  "kindStar": "G-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "WASP-12 b",
    "rE": 20.46,
    "au": 0.0231,
    "per": 1.09,
    "kind": "gas giant",
    "massE": 454.4969,
    "tempK": 2523
   }
  ]
 },
 {
  "pack": "WASP-121",
  "star": "WASP-121",
  "ra": 7.1813,
  "dec": -39.097,
  "ly": 858,
  "tempK": 6459,
  "spec": "F6 V",
  "rSun": 1.457,
  "col": 16774378,
  "pulsar": false,
  "kindStar": "F-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "WASP-121 b",
    "rE": 20.9,
    "au": 0.0254,
    "per": 1.27,
    "kind": "gas giant",
    "massE": 375.99289,
    "tempK": 2358
   }
  ]
 },
 {
  "pack": "KELT-9",
  "star": "KELT-9",
  "ra": 20.5161,
  "dec": 39.956,
  "ly": 670,
  "tempK": 10170,
  "spec": "B9.5-A0",
  "rSun": 2.36,
  "col": 11193599,
  "pulsar": false,
  "kindStar": "B-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "KELT-9 b",
    "rE": 21.2,
    "au": 0.0346,
    "per": 1.48,
    "kind": "gas giant",
    "massE": 915.3504,
    "tempK": 4050
   }
  ]
 },
 {
  "pack": "HD_189733",
  "star": "HD 189733",
  "ra": 20.0047,
  "dec": 22.711,
  "ly": 64.5,
  "tempK": 5040,
  "spec": "",
  "rSun": 0.755,
  "col": 16767392,
  "pulsar": false,
  "kindStar": "K-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "HD 189733 b",
    "rE": 12.76,
    "au": 0.031,
    "per": 2.22,
    "kind": "gas giant",
    "massE": 363.582,
    "tempK": 1201
   }
  ]
 },
 {
  "pack": "PSR_B1257+12",
  "star": "PSR B1257+12",
  "ra": 13.0058,
  "dec": 12.683,
  "ly": 1955,
  "tempK": null,
  "spec": "",
  "rSun": 0.85,
  "col": 16773846,
  "pulsar": true,
  "kindStar": "main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "PSR B1257+12 b",
    "rE": 0.32,
    "au": 0.19,
    "per": 25.34,
    "kind": "pulsar-orbiting rocky planet",
    "massE": 0.015,
    "tempK": null
   },
   {
    "key": "c",
    "name": "PSR B1257+12 c",
    "rE": 1.39,
    "au": 0.36,
    "per": 66.56,
    "kind": "pulsar-orbiting rocky planet",
    "massE": 3.4,
    "tempK": null
   },
   {
    "key": "d",
    "name": "PSR B1257+12 d",
    "rE": 1.44,
    "au": 0.46,
    "per": 98.21,
    "kind": "pulsar-orbiting rocky planet",
    "massE": 3.9,
    "tempK": null
   }
  ]
 },
 {
  "pack": "47_Ursae_Majoris",
  "star": "47 UMa",
  "ra": 10.953,
  "dec": 40.431,
  "ly": 45.9,
  "tempK": 5829.16,
  "spec": "",
  "rSun": 1.135,
  "col": 16773846,
  "pulsar": false,
  "kindStar": "K-type main-sequence star",
  "planets": [
   {
    "key": "b",
    "name": "47 UMa b",
    "rE": 11,
    "au": 2.059,
    "per": 1076.6,
    "kind": "gas giant",
    "massE": 774.86565627,
    "tempK": null
   },
   {
    "key": "c",
    "name": "47 UMa c",
    "rE": 11,
    "au": 3.404,
    "per": 2287,
    "kind": "gas giant",
    "massE": 157.96071828,
    "tempK": null
   },
   {
    "key": "d",
    "name": "47 UMa d",
    "rE": 11,
    "au": 11.6,
    "per": 14002,
    "kind": "gas giant",
    "massE": 521.22,
    "tempK": null
   }
  ]
 }
];
export default EXO_SYSTEMS;
