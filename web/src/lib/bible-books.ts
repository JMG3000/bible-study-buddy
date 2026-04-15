export interface BibleBook {
  bookCode: number;
  slug: string;
  displayName: string;
  testament: "old" | "new";
  osisCode: string;
  usfmCode: string;
}

export const bibleBooks: BibleBook[] = [
  { bookCode: 1, slug: "genesis", displayName: "Genesis", testament: "old", osisCode: "Gen", usfmCode: "GEN" },
  { bookCode: 2, slug: "exodus", displayName: "Exodus", testament: "old", osisCode: "Exod", usfmCode: "EXO" },
  { bookCode: 3, slug: "leviticus", displayName: "Leviticus", testament: "old", osisCode: "Lev", usfmCode: "LEV" },
  { bookCode: 4, slug: "numbers", displayName: "Numbers", testament: "old", osisCode: "Num", usfmCode: "NUM" },
  { bookCode: 5, slug: "deuteronomy", displayName: "Deuteronomy", testament: "old", osisCode: "Deut", usfmCode: "DEU" },
  { bookCode: 6, slug: "joshua", displayName: "Joshua", testament: "old", osisCode: "Josh", usfmCode: "JOS" },
  { bookCode: 7, slug: "judges", displayName: "Judges", testament: "old", osisCode: "Judg", usfmCode: "JDG" },
  { bookCode: 8, slug: "ruth", displayName: "Ruth", testament: "old", osisCode: "Ruth", usfmCode: "RUT" },
  { bookCode: 9, slug: "1-samuel", displayName: "1 Samuel", testament: "old", osisCode: "1Sam", usfmCode: "1SA" },
  { bookCode: 10, slug: "2-samuel", displayName: "2 Samuel", testament: "old", osisCode: "2Sam", usfmCode: "2SA" },
  { bookCode: 11, slug: "1-kings", displayName: "1 Kings", testament: "old", osisCode: "1Kgs", usfmCode: "1KI" },
  { bookCode: 12, slug: "2-kings", displayName: "2 Kings", testament: "old", osisCode: "2Kgs", usfmCode: "2KI" },
  { bookCode: 13, slug: "1-chronicles", displayName: "1 Chronicles", testament: "old", osisCode: "1Chr", usfmCode: "1CH" },
  { bookCode: 14, slug: "2-chronicles", displayName: "2 Chronicles", testament: "old", osisCode: "2Chr", usfmCode: "2CH" },
  { bookCode: 15, slug: "ezra", displayName: "Ezra", testament: "old", osisCode: "Ezra", usfmCode: "EZR" },
  { bookCode: 16, slug: "nehemiah", displayName: "Nehemiah", testament: "old", osisCode: "Neh", usfmCode: "NEH" },
  { bookCode: 17, slug: "esther", displayName: "Esther", testament: "old", osisCode: "Esth", usfmCode: "EST" },
  { bookCode: 18, slug: "job", displayName: "Job", testament: "old", osisCode: "Job", usfmCode: "JOB" },
  { bookCode: 19, slug: "psalms", displayName: "Psalms", testament: "old", osisCode: "Ps", usfmCode: "PSA" },
  { bookCode: 20, slug: "proverbs", displayName: "Proverbs", testament: "old", osisCode: "Prov", usfmCode: "PRO" },
  { bookCode: 21, slug: "ecclesiastes", displayName: "Ecclesiastes", testament: "old", osisCode: "Eccl", usfmCode: "ECC" },
  { bookCode: 22, slug: "song-of-songs", displayName: "Song of Songs", testament: "old", osisCode: "Song", usfmCode: "SNG" },
  { bookCode: 23, slug: "isaiah", displayName: "Isaiah", testament: "old", osisCode: "Isa", usfmCode: "ISA" },
  { bookCode: 24, slug: "jeremiah", displayName: "Jeremiah", testament: "old", osisCode: "Jer", usfmCode: "JER" },
  { bookCode: 25, slug: "lamentations", displayName: "Lamentations", testament: "old", osisCode: "Lam", usfmCode: "LAM" },
  { bookCode: 26, slug: "ezekiel", displayName: "Ezekiel", testament: "old", osisCode: "Ezek", usfmCode: "EZK" },
  { bookCode: 27, slug: "daniel", displayName: "Daniel", testament: "old", osisCode: "Dan", usfmCode: "DAN" },
  { bookCode: 28, slug: "hosea", displayName: "Hosea", testament: "old", osisCode: "Hos", usfmCode: "HOS" },
  { bookCode: 29, slug: "joel", displayName: "Joel", testament: "old", osisCode: "Joel", usfmCode: "JOL" },
  { bookCode: 30, slug: "amos", displayName: "Amos", testament: "old", osisCode: "Amos", usfmCode: "AMO" },
  { bookCode: 31, slug: "obadiah", displayName: "Obadiah", testament: "old", osisCode: "Obad", usfmCode: "OBA" },
  { bookCode: 32, slug: "jonah", displayName: "Jonah", testament: "old", osisCode: "Jonah", usfmCode: "JON" },
  { bookCode: 33, slug: "micah", displayName: "Micah", testament: "old", osisCode: "Mic", usfmCode: "MIC" },
  { bookCode: 34, slug: "nahum", displayName: "Nahum", testament: "old", osisCode: "Nah", usfmCode: "NAM" },
  { bookCode: 35, slug: "habakkuk", displayName: "Habakkuk", testament: "old", osisCode: "Hab", usfmCode: "HAB" },
  { bookCode: 36, slug: "zephaniah", displayName: "Zephaniah", testament: "old", osisCode: "Zeph", usfmCode: "ZEP" },
  { bookCode: 37, slug: "haggai", displayName: "Haggai", testament: "old", osisCode: "Hag", usfmCode: "HAG" },
  { bookCode: 38, slug: "zechariah", displayName: "Zechariah", testament: "old", osisCode: "Zech", usfmCode: "ZEC" },
  { bookCode: 39, slug: "malachi", displayName: "Malachi", testament: "old", osisCode: "Mal", usfmCode: "MAL" },
  { bookCode: 40, slug: "matthew", displayName: "Matthew", testament: "new", osisCode: "Matt", usfmCode: "MAT" },
  { bookCode: 41, slug: "mark", displayName: "Mark", testament: "new", osisCode: "Mark", usfmCode: "MRK" },
  { bookCode: 42, slug: "luke", displayName: "Luke", testament: "new", osisCode: "Luke", usfmCode: "LUK" },
  { bookCode: 43, slug: "john", displayName: "John", testament: "new", osisCode: "John", usfmCode: "JHN" },
  { bookCode: 44, slug: "acts", displayName: "Acts", testament: "new", osisCode: "Acts", usfmCode: "ACT" },
  { bookCode: 45, slug: "romans", displayName: "Romans", testament: "new", osisCode: "Rom", usfmCode: "ROM" },
  { bookCode: 46, slug: "1-corinthians", displayName: "1 Corinthians", testament: "new", osisCode: "1Cor", usfmCode: "1CO" },
  { bookCode: 47, slug: "2-corinthians", displayName: "2 Corinthians", testament: "new", osisCode: "2Cor", usfmCode: "2CO" },
  { bookCode: 48, slug: "galatians", displayName: "Galatians", testament: "new", osisCode: "Gal", usfmCode: "GAL" },
  { bookCode: 49, slug: "ephesians", displayName: "Ephesians", testament: "new", osisCode: "Eph", usfmCode: "EPH" },
  { bookCode: 50, slug: "philippians", displayName: "Philippians", testament: "new", osisCode: "Phil", usfmCode: "PHP" },
  { bookCode: 51, slug: "colossians", displayName: "Colossians", testament: "new", osisCode: "Col", usfmCode: "COL" },
  { bookCode: 52, slug: "1-thessalonians", displayName: "1 Thessalonians", testament: "new", osisCode: "1Thess", usfmCode: "1TH" },
  { bookCode: 53, slug: "2-thessalonians", displayName: "2 Thessalonians", testament: "new", osisCode: "2Thess", usfmCode: "2TH" },
  { bookCode: 54, slug: "1-timothy", displayName: "1 Timothy", testament: "new", osisCode: "1Tim", usfmCode: "1TI" },
  { bookCode: 55, slug: "2-timothy", displayName: "2 Timothy", testament: "new", osisCode: "2Tim", usfmCode: "2TI" },
  { bookCode: 56, slug: "titus", displayName: "Titus", testament: "new", osisCode: "Titus", usfmCode: "TIT" },
  { bookCode: 57, slug: "philemon", displayName: "Philemon", testament: "new", osisCode: "Phlm", usfmCode: "PHM" },
  { bookCode: 58, slug: "hebrews", displayName: "Hebrews", testament: "new", osisCode: "Heb", usfmCode: "HEB" },
  { bookCode: 59, slug: "james", displayName: "James", testament: "new", osisCode: "Jas", usfmCode: "JAS" },
  { bookCode: 60, slug: "1-peter", displayName: "1 Peter", testament: "new", osisCode: "1Pet", usfmCode: "1PE" },
  { bookCode: 61, slug: "2-peter", displayName: "2 Peter", testament: "new", osisCode: "2Pet", usfmCode: "2PE" },
  { bookCode: 62, slug: "1-john", displayName: "1 John", testament: "new", osisCode: "1John", usfmCode: "1JN" },
  { bookCode: 63, slug: "2-john", displayName: "2 John", testament: "new", osisCode: "2John", usfmCode: "2JN" },
  { bookCode: 64, slug: "3-john", displayName: "3 John", testament: "new", osisCode: "3John", usfmCode: "3JN" },
  { bookCode: 65, slug: "jude", displayName: "Jude", testament: "new", osisCode: "Jude", usfmCode: "JUD" },
  { bookCode: 66, slug: "revelation", displayName: "Revelation", testament: "new", osisCode: "Rev", usfmCode: "REV" },
];

export function getBookBySlug(slug: string) {
  return bibleBooks.find((book) => book.slug === slug);
}

export function getBookByCode(bookCode: number) {
  return bibleBooks.find((book) => book.bookCode === bookCode);
}
