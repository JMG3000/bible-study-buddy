export const siteConfig = {
  name: "Bible Study Buddy: Free",
  shortName: "Bible Study Buddy: Free",
  description:
    "Create, share, and browse free Bible study lesson plans for small groups, classrooms, and church gatherings.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://bible-study-buddy-free.example.com",
};

export const topicOptions = [
  "Prayer",
  "Discipleship",
  "Community",
  "Faith in Action",
  "Identity in Christ",
  "Mercy",
  "Peace",
  "Leadership",
];

export const audienceOptions = [
  "Adults",
  "Young Adults",
  "Students",
  "Small Groups",
  "Families",
  "New Believers",
];

export const denominationOptions = [
  "Non-denominational",
  "Baptist",
  "Methodist",
  "Presbyterian",
  "Lutheran",
  "Pentecostal",
];

export const durationOptions = [
  { value: "short", label: "Up to 30 minutes" },
  { value: "medium", label: "31 to 60 minutes" },
  { value: "long", label: "61+ minutes" },
];
