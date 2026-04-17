import { getBookByCode } from "@/lib/bible-books";
import type { LessonPlan, Report, ScriptureRef } from "@/lib/types";

function makeScriptureRef(
  id: string,
  sequence: number,
  bookCode: number,
  chapterStart: number,
  verseStart: number,
  chapterEnd: number,
  verseEnd: number,
  displayLabel?: string,
): ScriptureRef {
  const book = getBookByCode(bookCode);

  if (!book) {
    throw new Error(`Missing book metadata for code ${bookCode}`);
  }

  return {
    id,
    sequence,
    bookCode,
    bookName: book.displayName,
    osisCode: book.osisCode,
    usfmCode: book.usfmCode,
    chapterStart,
    verseStart,
    chapterEnd,
    verseEnd,
    displayLabel:
      displayLabel ??
      `${book.displayName} ${chapterStart}:${verseStart}-${chapterEnd}:${verseEnd}`,
  };
}

export const lessonPlans: LessonPlan[] = [
  {
    id: "plan-acts-2-table",
    slug: "acts-2-at-the-table",
    authorId: "user-rachel",
    authorName: "Rachel Monroe",
    authorHandle: "rachel-monroe",
    authorRole: "creator",
    status: "published",
    moderationState: "none",
    title: "Acts 2 at the Table",
    summary:
      "A communal Bible study on worship, generosity, and spiritual rhythms for adults or mixed-age small groups.",
    teachingObjective:
      "Help a group identify three tangible practices from the early church that can shape modern community life.",
    durationMinutes: 55,
    topicTags: ["Community", "Discipleship", "Prayer"],
    audienceTags: ["Adults", "Small Groups"],
    denominationTags: ["Non-denominational", "Methodist"],
    customTags: ["shared meals", "hospitality"],
    openingPrayer:
      "Ask God to make the group attentive to the work of the Spirit and eager to serve one another.",
    icebreaker:
      "Invite each person to share a meal tradition or community practice that makes them feel at home.",
    facilitatorNotes:
      "Leave room for testimony. The discussion often opens naturally into stories about hospitality and generosity.",
    materials: ["Bibles", "Pens", "Whiteboard or paper for prayer requests"],
    activities: [
      "Map the four rhythms named in Acts 2:42-47 and discuss how each one appears in your church life.",
      "End by pairing people to pray for one concrete next step in community.",
    ],
    discussionQuestions: [
      "Which practice in Acts 2 feels most familiar to your group right now?",
      "What does shared life look like without becoming performative?",
      "How can prayer, generosity, and gathering reinforce each other in ordinary weeks?",
    ],
    prayerPrompts: [
      "Pray for open homes and open schedules.",
      "Pray for courage to notice and meet needs in the body of Christ.",
    ],
    handoutUrls: ["https://example.com/handouts/acts-2-community-guide.pdf"],
    scriptures: [
      makeScriptureRef("scripture-acts-2", 1, 44, 2, 42, 2, 47, "Acts 2:42-47"),
    ],
    seriesMemberships: [],
    publishedAt: "2026-04-02T14:00:00.000Z",
    createdAt: "2026-03-29T18:30:00.000Z",
    updatedAt: "2026-04-05T08:45:00.000Z",
    featured: true,
  },
  {
    id: "plan-psalm-23-rest",
    slug: "psalm-23-for-anxious-hearts",
    authorId: "user-adrian",
    authorName: "Adrian Lewis",
    authorHandle: "adrian-lewis",
    authorRole: "creator",
    status: "published",
    moderationState: "none",
    title: "Psalm 23 for Anxious Hearts",
    summary:
      "A calming, discussion-friendly lesson focused on God’s care, presence, and guidance in seasons of stress.",
    teachingObjective:
      "Lead participants to identify how the imagery of Psalm 23 speaks to fear, scarcity, and trust.",
    durationMinutes: 35,
    topicTags: ["Peace", "Prayer", "Identity in Christ"],
    audienceTags: ["Young Adults", "Adults", "New Believers"],
    denominationTags: ["Baptist", "Non-denominational"],
    customTags: ["anxiety care", "trust"],
    openingPrayer:
      "Invite the Shepherd to quiet anxious thoughts and guide the group into deeper trust.",
    icebreaker:
      "Ask everyone to describe a place where they feel safe enough to breathe deeply.",
    facilitatorNotes:
      "This lesson works well in pastoral care settings. Keep the pace gentle and leave silence between questions.",
    materials: ["Printed Psalm 23 handout", "Journals"],
    activities: [
      "Read the passage slowly twice, using two different voices.",
      "Invite participants to rewrite one verse as a personal prayer.",
    ],
    discussionQuestions: [
      "Which image in Psalm 23 feels most life-giving right now?",
      "How does the Psalm describe God's presence in both green pastures and dark valleys?",
      "What would it look like to trust the Shepherd this week?",
    ],
    prayerPrompts: [
      "Pray for people carrying hidden fear.",
      "Pray for deep rest in God's presence.",
    ],
    handoutUrls: [],
    scriptures: [makeScriptureRef("scripture-psalm-23", 1, 19, 23, 1, 23, 6, "Psalm 23:1-6")],
    seriesMemberships: [],
    publishedAt: "2026-04-10T16:00:00.000Z",
    createdAt: "2026-04-08T13:15:00.000Z",
    updatedAt: "2026-04-10T16:00:00.000Z",
    featured: true,
  },
  {
    id: "plan-matthew-5-mercy",
    slug: "mercy-in-the-sermon-on-the-mount",
    authorId: "user-hannah",
    authorName: "Hannah Porter",
    authorHandle: "hannah-porter",
    authorRole: "creator",
    status: "published",
    moderationState: "none",
    title: "Mercy in the Sermon on the Mount",
    summary:
      "A youth-friendly session on mercy, integrity, and the upside-down kingdom of Jesus in Matthew 5.",
    teachingObjective:
      "Show how the Beatitudes move students beyond performative goodness into kingdom-shaped character.",
    durationMinutes: 45,
    topicTags: ["Mercy", "Discipleship", "Leadership"],
    audienceTags: ["Students", "Young Adults"],
    denominationTags: ["Pentecostal", "Non-denominational"],
    customTags: ["beatitudes", "student ministry"],
    openingPrayer:
      "Ask Jesus to form merciful hearts and illuminate the values of His kingdom.",
    icebreaker:
      "Have the group share a time when kindness changed the tone of a difficult moment.",
    facilitatorNotes:
      "Invite students to name practical school, family, or online situations where mercy is hard.",
    materials: ["Highlighters", "Poster board", "Sticky notes"],
    activities: [
      "Create a Beatitudes wall: one note per quality Jesus celebrates.",
      "Role-play a conflict and ask how mercy could transform the response.",
    ],
    discussionQuestions: [
      "Why do Jesus' blessings feel surprising?",
      "What does mercy look like when you still need wisdom and boundaries?",
      "How can a student group embody the kingdom in ordinary places?",
    ],
    prayerPrompts: [
      "Pray for the courage to be peacemakers.",
      "Pray for soft hearts and truthful words.",
    ],
    handoutUrls: ["https://example.com/handouts/beatitudes-student-sheet.pdf"],
    scriptures: [
      makeScriptureRef("scripture-matthew-5", 1, 40, 5, 1, 5, 12, "Matthew 5:1-12"),
    ],
    seriesMemberships: [],
    publishedAt: "2026-04-12T11:20:00.000Z",
    createdAt: "2026-04-11T17:00:00.000Z",
    updatedAt: "2026-04-12T11:20:00.000Z",
  },
  {
    id: "plan-james-2-active-faith",
    slug: null,
    authorId: "user-rachel",
    authorName: "Rachel Monroe",
    authorHandle: "rachel-monroe",
    authorRole: "creator",
    status: "draft",
    moderationState: "none",
    title: "Faith That Moves Into Action",
    summary:
      "A draft lesson for adult classes on James 2 that connects belief, mercy, and visible obedience.",
    teachingObjective:
      "Equip a group to articulate how living faith produces embodied care for neighbors in need.",
    durationMinutes: 50,
    topicTags: ["Faith in Action", "Discipleship"],
    audienceTags: ["Adults", "Small Groups"],
    denominationTags: ["Presbyterian"],
    customTags: ["service", "mercy"],
    openingPrayer:
      "Ask God to keep the group from empty belief and awaken practical compassion.",
    icebreaker:
      "Invite participants to name one ordinary act of service that helped them feel seen this week.",
    facilitatorNotes:
      "This draft needs final polishing around the application section before publication.",
    materials: ["Bibles", "Index cards"],
    activities: [
      "Ask participants to compare James' examples with modern church life.",
    ],
    discussionQuestions: [
      "What is James correcting in this passage?",
      "Where do we confuse agreement with obedience?",
    ],
    prayerPrompts: ["Pray for faith that shows up in mercy and generosity."],
    handoutUrls: [],
    scriptures: [makeScriptureRef("scripture-james-2", 1, 59, 2, 14, 2, 26, "James 2:14-26")],
    seriesMemberships: [],
    publishedAt: null,
    createdAt: "2026-04-13T14:30:00.000Z",
    updatedAt: "2026-04-14T09:10:00.000Z",
  },
  {
    id: "plan-john-13-serving-love",
    slug: "serving-love-in-john-13",
    authorId: "user-adrian",
    authorName: "Adrian Lewis",
    authorHandle: "adrian-lewis",
    authorRole: "creator",
    status: "unpublished",
    moderationState: "actioned",
    title: "Serving Love in John 13",
    summary:
      "A formerly published lesson on servant leadership that is now paused for edits after review.",
    teachingObjective:
      "Help leaders understand how Jesus ties authority to humility and service.",
    durationMinutes: 40,
    topicTags: ["Leadership", "Community"],
    audienceTags: ["Adults", "Young Adults"],
    denominationTags: ["Lutheran"],
    customTags: ["servant leadership"],
    openingPrayer:
      "Ask Jesus to shape servant hearts that mirror His humility.",
    icebreaker:
      "Share an example of leadership that felt deeply Christlike.",
    facilitatorNotes:
      "Currently unpublished while the author revises citations and clarifies one application section.",
    materials: ["Bibles", "Basins or towels for symbolic reflection activity"],
    activities: [
      "Invite the group to list surprising traits of Jesus' leadership in John 13.",
    ],
    discussionQuestions: [
      "What makes servant leadership feel costly?",
      "How does Jesus redefine power in this scene?",
    ],
    prayerPrompts: ["Pray for humility, courage, and willingness to serve quietly."],
    handoutUrls: [],
    scriptures: [makeScriptureRef("scripture-john-13", 1, 43, 13, 1, 13, 17, "John 13:1-17")],
    seriesMemberships: [],
    publishedAt: "2026-03-25T15:00:00.000Z",
    createdAt: "2026-03-20T17:40:00.000Z",
    updatedAt: "2026-04-11T09:00:00.000Z",
  },
];

export const savedPlanIds = ["plan-acts-2-table", "plan-matthew-5-mercy"];

export const reports: Report[] = [
  {
    id: "report-1",
    lessonPlanId: "plan-john-13-serving-love",
    lessonPlanTitle: "Serving Love in John 13",
    reporterName: "Maya Thompson",
    reason: "inaccurate",
    details:
      "One application note cites the wrong verse reference for the foot washing sequence.",
    status: "reviewing",
    createdAt: "2026-04-10T18:25:00.000Z",
  },
  {
    id: "report-2",
    lessonPlanId: "plan-matthew-5-mercy",
    lessonPlanTitle: "Mercy in the Sermon on the Mount",
    reporterName: "Daniel Ruiz",
    reason: "other",
    details:
      "Requested clearer wording in one discussion prompt for mixed-age youth groups.",
    status: "open",
    createdAt: "2026-04-13T12:05:00.000Z",
  },
];
