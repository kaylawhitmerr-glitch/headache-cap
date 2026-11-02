/* Headache Comfort Cap prototype: mock data only (read-only, no logic). See Claude.md section 4. */
window.MOCK_DATA = {
  version: 1,
  validCodes: ["HCC-4821", "HCC-7730", "HCC-1205"],

  zones: [
    { id: "eyes", label: "Eye area" },
    { id: "temples", label: "Temples" },
    { id: "above_ears", label: "Above the ears" },
    { id: "behind_ears", label: "Behind the ears" }
  ],
  sides: [
    { id: "left", label: "Left" },
    { id: "right", label: "Right" },
    { id: "both", label: "Both" }
  ],
  symptoms: [
    { id: "nausea", label: "Nausea" },
    { id: "light_sensitivity", label: "Light sensitivity" },
    { id: "sound_sensitivity", label: "Sound sensitivity" },
    { id: "neck_tension", label: "Neck tension" }
  ],
  activities: [
    { id: "screen_work", label: "Screen work" },
    { id: "meeting", label: "Meeting" },
    { id: "commuting", label: "Commuting" },
    { id: "exercise", label: "Exercise" },
    { id: "resting", label: "Resting" },
    { id: "sleeping", label: "Sleeping" },
    { id: "other", label: "Other" }
  ],
  timerOptions: [10, 20, 30], // minutes; "no timer" is always offered too
  durationRanges: [
    { id: "lt30", label: "Under 30 min" },
    { id: "30to60", label: "30–60 min" },
    { id: "1to2h", label: "1–2 h" },
    { id: "2to4h", label: "2–4 h" },
    { id: "gt4h", label: "Over 4 h" }
  ],

  // DRAFT, used by the insight rules
  thresholds: {
    minOccurrences: 3,
    highScreenHours: 6,
    lowWaterGlasses: 3,
    highCaffeineDrinks: 3
  },

  // DRAFT text, review before testing. The app adds "Not medical advice." next to each.
  suggestions: [
    { id: "s_screen", ruleId: "high_screen", draft: true,
      text: "On long screen days, you could try a short pause every hour: look at something far away, roll your shoulders, and lower the screen brightness if that feels more comfortable." },
    { id: "s_water", ruleId: "low_water", draft: true,
      text: "You might keep a glass of water within reach and sip through the day. Some people find it easier to have a glass with each meal." },
    { id: "s_caffeine", ruleId: "high_caffeine", draft: true,
      text: "If you like, try noting how many caffeinated drinks feel right for you, and swap a later one for water or a caffeine-free tea." }
  ],

  // Sample entries, 2026-09-07 to 2026-10-18 (see Claude.md section 4.4)
  seedEntries: [
    {
      id: "seed_01",
      occurredAt: "2026-09-07T14:30:00",
      createdAt: "2026-09-07T14:51:14",
      updatedAt: "2026-09-07T14:51:14",
      logOnly: false,
      session: {
        startedAt: "2026-09-07T14:30:00",
        endedAt: "2026-09-07T14:50:00",
        timerMinutes: 20,
        zones: [
          { zone: "temples", side: "both", thermal: "heat", pressure: true }
        ]
      },
      feedback: { methods: { heat: "helped", pressure: "unsure" }, duration: "30to60" },
      pain: 6,
      symptoms: ["light_sensitivity"],
      activity: "screen_work",
      screenTimeHours: 7,
      waterGlasses: 3,
      caffeineDrinks: 2
    },
    {
      id: "seed_02",
      occurredAt: "2026-09-08T09:15:00",
      createdAt: "2026-09-08T09:25:11",
      updatedAt: "2026-09-08T09:25:11",
      logOnly: true,
      session: null,
      feedback: null,
      pain: 4,
      symptoms: ["neck_tension"],
      activity: "commuting",
      screenTimeHours: null,
      waterGlasses: 5,
      caffeineDrinks: 1
    },
    {
      id: "seed_03",
      occurredAt: "2026-09-09T15:45:00",
      createdAt: "2026-09-09T16:02:12",
      updatedAt: "2026-09-09T16:02:12",
      logOnly: true,
      session: null,
      feedback: null,
      pain: null,
      symptoms: [],
      activity: null,
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: null
    },
    {
      id: "seed_04",
      occurredAt: "2026-09-12T19:20:00",
      createdAt: "2026-09-12T19:31:17",
      updatedAt: "2026-09-12T19:31:17",
      logOnly: false,
      session: {
        startedAt: "2026-09-12T19:20:00",
        endedAt: "2026-09-12T19:30:00",
        timerMinutes: 10,
        zones: [
          { zone: "eyes", side: "both", thermal: "cool", pressure: false }
        ]
      },
      feedback: { methods: { cool: "helped" }, duration: "lt30" },
      pain: 5,
      symptoms: ["light_sensitivity", "sound_sensitivity"],
      activity: "resting",
      screenTimeHours: 3,
      waterGlasses: 6,
      caffeineDrinks: 0
    },
    {
      id: "seed_05",
      occurredAt: "2026-09-14T13:10:00",
      createdAt: "2026-09-14T13:41:18",
      updatedAt: "2026-09-14T13:41:18",
      logOnly: false,
      session: {
        startedAt: "2026-09-14T13:10:00",
        endedAt: "2026-09-14T13:40:00",
        timerMinutes: 30,
        zones: [
          { zone: "temples", side: "both", thermal: "heat", pressure: false },
          { zone: "behind_ears", side: "both", thermal: "off", pressure: true }
        ]
      },
      feedback: { methods: { heat: "helped", pressure: "helped" }, duration: "1to2h" },
      pain: 7,
      symptoms: ["nausea", "light_sensitivity"],
      activity: "screen_work",
      screenTimeHours: 8,
      waterGlasses: 2,
      caffeineDrinks: 3
    },
    {
      id: "seed_06",
      occurredAt: "2026-09-17T08:40:00",
      createdAt: "2026-09-17T08:43:15",
      updatedAt: "2026-09-17T08:43:15",
      logOnly: true,
      session: null,
      feedback: null,
      pain: 3,
      symptoms: [],
      activity: "meeting",
      screenTimeHours: 4,
      waterGlasses: null,
      caffeineDrinks: 1
    },
    {
      id: "seed_07",
      occurredAt: "2026-09-22T16:05:00",
      createdAt: "2026-09-22T16:15:16",
      updatedAt: "2026-09-22T16:15:16",
      logOnly: false,
      session: null,
      feedback: null,
      pain: 5,
      symptoms: ["light_sensitivity"],
      activity: "screen_work",
      screenTimeHours: 6.5,
      waterGlasses: 4,
      caffeineDrinks: 2
    },
    {
      id: "seed_08",
      occurredAt: "2026-09-25T21:30:00",
      createdAt: "2026-09-25T21:47:17",
      updatedAt: "2026-09-25T21:47:17",
      logOnly: true,
      session: null,
      feedback: null,
      pain: null,
      symptoms: [],
      activity: null,
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: null
    },
    {
      id: "seed_09",
      occurredAt: "2026-09-27T10:50:00",
      createdAt: "2026-09-27T11:16:22",
      updatedAt: "2026-09-27T11:16:22",
      logOnly: false,
      session: {
        startedAt: "2026-09-27T10:50:00",
        endedAt: "2026-09-27T11:15:00",
        timerMinutes: null,
        zones: [
          { zone: "eyes", side: "both", thermal: "cool", pressure: true }
        ]
      },
      feedback: { methods: { cool: "unsure", pressure: "no" }, duration: "30to60" },
      pain: 4,
      symptoms: ["nausea"],
      activity: "other",
      screenTimeHours: null,
      waterGlasses: 7,
      caffeineDrinks: 0
    },
    {
      id: "seed_10",
      occurredAt: "2026-09-28T14:00:00",
      createdAt: "2026-09-28T14:21:23",
      updatedAt: "2026-09-28T14:21:23",
      logOnly: false,
      session: {
        startedAt: "2026-09-28T14:00:00",
        endedAt: "2026-09-28T14:20:00",
        timerMinutes: 20,
        zones: [
          { zone: "temples", side: "both", thermal: "heat", pressure: false }
        ]
      },
      feedback: { methods: { heat: "no" }, duration: "2to4h" },
      pain: 8,
      symptoms: ["nausea", "light_sensitivity", "sound_sensitivity"],
      activity: "meeting",
      screenTimeHours: 7,
      waterGlasses: 3,
      caffeineDrinks: 2
    },
    {
      id: "seed_11",
      occurredAt: "2026-09-30T07:25:00",
      createdAt: "2026-09-30T07:28:20",
      updatedAt: "2026-09-30T07:28:20",
      logOnly: true,
      session: null,
      feedback: null,
      pain: 2,
      symptoms: ["neck_tension"],
      activity: "exercise",
      screenTimeHours: 1,
      waterGlasses: 8,
      caffeineDrinks: 0
    },
    {
      id: "seed_12",
      occurredAt: "2026-10-01T12:45:00",
      createdAt: "2026-10-01T12:55:21",
      updatedAt: "2026-10-01T12:55:21",
      logOnly: true,
      session: null,
      feedback: null,
      pain: null,
      symptoms: [],
      activity: null,
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: null
    },
    {
      id: "seed_13",
      occurredAt: "2026-10-03T23:10:00",
      createdAt: "2026-10-03T23:27:22",
      updatedAt: "2026-10-03T23:27:22",
      logOnly: true,
      session: null,
      feedback: null,
      pain: 6,
      symptoms: ["light_sensitivity"],
      activity: "sleeping",
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: null
    },
    {
      id: "seed_14",
      occurredAt: "2026-10-05T15:20:00",
      createdAt: "2026-10-05T15:41:27",
      updatedAt: "2026-10-05T15:41:27",
      logOnly: false,
      session: {
        startedAt: "2026-10-05T15:20:00",
        endedAt: "2026-10-05T15:40:00",
        timerMinutes: 20,
        zones: [
          { zone: "temples", side: "right", thermal: "heat", pressure: false },
          { zone: "behind_ears", side: "right", thermal: "off", pressure: true }
        ]
      },
      feedback: { methods: { heat: "helped", pressure: "unsure" }, duration: "30to60" },
      pain: 6,
      symptoms: ["light_sensitivity", "neck_tension"],
      activity: "screen_work",
      screenTimeHours: 9,
      waterGlasses: 2,
      caffeineDrinks: 4
    },
    {
      id: "seed_15",
      occurredAt: "2026-10-06T18:40:00",
      createdAt: "2026-10-06T19:11:24",
      updatedAt: "2026-10-06T19:11:24",
      logOnly: true,
      session: null,
      feedback: null,
      pain: 5,
      symptoms: ["sound_sensitivity"],
      activity: "commuting",
      screenTimeHours: 2,
      waterGlasses: 5,
      caffeineDrinks: 1
    },
    {
      id: "seed_16",
      occurredAt: "2026-10-08T11:00:00",
      createdAt: "2026-10-08T11:11:29",
      updatedAt: "2026-10-08T11:11:29",
      logOnly: false,
      session: {
        startedAt: "2026-10-08T11:00:00",
        endedAt: "2026-10-08T11:10:00",
        timerMinutes: 10,
        zones: [
          { zone: "above_ears", side: "both", thermal: "cool", pressure: false }
        ]
      },
      feedback: { methods: { cool: "helped" }, duration: "lt30" },
      pain: 3,
      symptoms: [],
      activity: "meeting",
      screenTimeHours: 5,
      waterGlasses: 6,
      caffeineDrinks: 1
    },
    {
      id: "seed_17",
      occurredAt: "2026-10-11T20:15:00",
      createdAt: "2026-10-11T20:25:26",
      updatedAt: "2026-10-11T20:25:26",
      logOnly: true,
      session: null,
      feedback: null,
      pain: null,
      symptoms: ["nausea"],
      activity: "resting",
      screenTimeHours: null,
      waterGlasses: 4,
      caffeineDrinks: null
    },
    {
      id: "seed_18",
      occurredAt: "2026-10-12T13:35:00",
      createdAt: "2026-10-12T14:06:31",
      updatedAt: "2026-10-12T14:06:31",
      logOnly: false,
      session: {
        startedAt: "2026-10-12T13:35:00",
        endedAt: "2026-10-12T14:05:00",
        timerMinutes: 30,
        zones: [
          { zone: "eyes", side: "both", thermal: "cool", pressure: false },
          { zone: "temples", side: "both", thermal: "heat", pressure: true }
        ]
      },
      feedback: { methods: { heat: "helped", cool: "helped", pressure: "helped" }, duration: "1to2h" },
      pain: 7,
      symptoms: ["light_sensitivity"],
      activity: "screen_work",
      screenTimeHours: 6,
      waterGlasses: 3,
      caffeineDrinks: 2
    },
    {
      id: "seed_19",
      occurredAt: "2026-10-14T09:50:00",
      createdAt: "2026-10-14T10:14:28",
      updatedAt: "2026-10-14T10:14:28",
      logOnly: true,
      session: null,
      feedback: null,
      pain: null,
      symptoms: [],
      activity: null,
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: null
    },
    {
      id: "seed_20",
      occurredAt: "2026-10-16T16:30:00",
      createdAt: "2026-10-16T17:01:29",
      updatedAt: "2026-10-16T17:01:29",
      logOnly: true,
      session: null,
      feedback: null,
      pain: 4,
      symptoms: [],
      activity: "screen_work",
      screenTimeHours: 7.5,
      waterGlasses: null,
      caffeineDrinks: 1
    },
    {
      id: "seed_21",
      occurredAt: "2026-10-17T02:20:00",
      createdAt: "2026-10-17T02:23:30",
      updatedAt: "2026-10-17T02:23:30",
      logOnly: true,
      session: null,
      feedback: null,
      pain: 5,
      symptoms: [],
      activity: "other",
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: 0
    },
    {
      id: "seed_22",
      occurredAt: "2026-10-18T17:45:00",
      createdAt: "2026-10-18T18:06:35",
      updatedAt: "2026-10-18T18:06:35",
      logOnly: false,
      session: {
        startedAt: "2026-10-18T17:45:00",
        endedAt: "2026-10-18T18:05:00",
        timerMinutes: 20,
        zones: [
          { zone: "above_ears", side: "left", thermal: "heat", pressure: false }
        ]
      },
      feedback: { methods: { heat: "unsure" }, duration: null },
      pain: null,
      symptoms: [],
      activity: null,
      screenTimeHours: null,
      waterGlasses: null,
      caffeineDrinks: null
    }
  ]
};
