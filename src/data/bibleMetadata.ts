// src/data/bibleMetadata.ts
// 성경 66권 메타데이터 (개역한글 기준)

export interface BookMetadata {
  bookId: number;
  bookCode: string;
  testament: 'OT' | 'NT';
  koreanName: string;
  koreanAbbrev: string;
  englishName: string;
  englishAbbrev: string;
  totalChapters: number;
  totalVerses: number;
  chaptersVerseCount: number[]; // 각 장별 절 수
}

// 구약 39권 메타데이터
export const oldTestamentBooks: BookMetadata[] = [
  {
    bookId: 1,
    bookCode: 'GEN',
    testament: 'OT',
    koreanName: '창세기',
    koreanAbbrev: '창',
    englishName: 'Genesis',
    englishAbbrev: 'Gen',
    totalChapters: 50,
    totalVerses: 1533,
    chaptersVerseCount: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26]
  },
  {
    bookId: 2,
    bookCode: 'EXO',
    testament: 'OT',
    koreanName: '출애굽기',
    koreanAbbrev: '출',
    englishName: 'Exodus',
    englishAbbrev: 'Exod',
    totalChapters: 40,
    totalVerses: 1213,
    chaptersVerseCount: [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38]
  },
  {
    bookId: 3,
    bookCode: 'LEV',
    testament: 'OT',
    koreanName: '레위기',
    koreanAbbrev: '레',
    englishName: 'Leviticus',
    englishAbbrev: 'Lev',
    totalChapters: 27,
    totalVerses: 859,
    chaptersVerseCount: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34]
  },
  {
    bookId: 4,
    bookCode: 'NUM',
    testament: 'OT',
    koreanName: '민수기',
    koreanAbbrev: '민',
    englishName: 'Numbers',
    englishAbbrev: 'Num',
    totalChapters: 36,
    totalVerses: 1288,
    chaptersVerseCount: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13]
  },
  {
    bookId: 5,
    bookCode: 'DEU',
    testament: 'OT',
    koreanName: '신명기',
    koreanAbbrev: '신',
    englishName: 'Deuteronomy',
    englishAbbrev: 'Deut',
    totalChapters: 34,
    totalVerses: 959,
    chaptersVerseCount: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12]
  },
  {
    bookId: 6,
    bookCode: 'JOS',
    testament: 'OT',
    koreanName: '여호수아',
    koreanAbbrev: '수',
    englishName: 'Joshua',
    englishAbbrev: 'Josh',
    totalChapters: 24,
    totalVerses: 658,
    chaptersVerseCount: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33]
  },
  {
    bookId: 7,
    bookCode: 'JDG',
    testament: 'OT',
    koreanName: '사사기',
    koreanAbbrev: '삿',
    englishName: 'Judges',
    englishAbbrev: 'Judg',
    totalChapters: 21,
    totalVerses: 618,
    chaptersVerseCount: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25]
  },
  {
    bookId: 8,
    bookCode: 'RUT',
    testament: 'OT',
    koreanName: '룻기',
    koreanAbbrev: '룻',
    englishName: 'Ruth',
    englishAbbrev: 'Ruth',
    totalChapters: 4,
    totalVerses: 85,
    chaptersVerseCount: [22,23,17,22]
  },
  {
    bookId: 9,
    bookCode: '1SA',
    testament: 'OT',
    koreanName: '사무엘상',
    koreanAbbrev: '삼상',
    englishName: '1 Samuel',
    englishAbbrev: '1Sam',
    totalChapters: 31,
    totalVerses: 810,
    chaptersVerseCount: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13]
  },
  {
    bookId: 10,
    bookCode: '2SA',
    testament: 'OT',
    koreanName: '사무엘하',
    koreanAbbrev: '삼하',
    englishName: '2 Samuel',
    englishAbbrev: '2Sam',
    totalChapters: 24,
    totalVerses: 695,
    chaptersVerseCount: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25]
  },
  {
    bookId: 11,
    bookCode: '1KI',
    testament: 'OT',
    koreanName: '열왕기상',
    koreanAbbrev: '왕상',
    englishName: '1 Kings',
    englishAbbrev: '1Kgs',
    totalChapters: 22,
    totalVerses: 816,
    chaptersVerseCount: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53]
  },
  {
    bookId: 12,
    bookCode: '2KI',
    testament: 'OT',
    koreanName: '열왕기하',
    koreanAbbrev: '왕하',
    englishName: '2 Kings',
    englishAbbrev: '2Kgs',
    totalChapters: 25,
    totalVerses: 719,
    chaptersVerseCount: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30]
  },
  {
    bookId: 13,
    bookCode: '1CH',
    testament: 'OT',
    koreanName: '역대상',
    koreanAbbrev: '대상',
    englishName: '1 Chronicles',
    englishAbbrev: '1Chr',
    totalChapters: 29,
    totalVerses: 942,
    chaptersVerseCount: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30]
  },
  {
    bookId: 14,
    bookCode: '2CH',
    testament: 'OT',
    koreanName: '역대하',
    koreanAbbrev: '대하',
    englishName: '2 Chronicles',
    englishAbbrev: '2Chr',
    totalChapters: 36,
    totalVerses: 822,
    chaptersVerseCount: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23]
  },
  {
    bookId: 15,
    bookCode: 'EZR',
    testament: 'OT',
    koreanName: '에스라',
    koreanAbbrev: '스',
    englishName: 'Ezra',
    englishAbbrev: 'Ezra',
    totalChapters: 10,
    totalVerses: 280,
    chaptersVerseCount: [11,70,13,24,17,22,28,36,15,44]
  },
  {
    bookId: 16,
    bookCode: 'NEH',
    testament: 'OT',
    koreanName: '느헤미야',
    koreanAbbrev: '느',
    englishName: 'Nehemiah',
    englishAbbrev: 'Neh',
    totalChapters: 13,
    totalVerses: 406,
    chaptersVerseCount: [11,20,32,23,19,19,73,18,38,39,36,47,31]
  },
  {
    bookId: 17,
    bookCode: 'EST',
    testament: 'OT',
    koreanName: '에스더',
    koreanAbbrev: '에',
    englishName: 'Esther',
    englishAbbrev: 'Esth',
    totalChapters: 10,
    totalVerses: 167,
    chaptersVerseCount: [22,23,15,17,14,14,10,17,32,3]
  },
  {
    bookId: 18,
    bookCode: 'JOB',
    testament: 'OT',
    koreanName: '욥기',
    koreanAbbrev: '욥',
    englishName: 'Job',
    englishAbbrev: 'Job',
    totalChapters: 42,
    totalVerses: 1070,
    chaptersVerseCount: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17]
  },
  {
    bookId: 19,
    bookCode: 'PSA',
    testament: 'OT',
    koreanName: '시편',
    koreanAbbrev: '시',
    englishName: 'Psalms',
    englishAbbrev: 'Ps',
    totalChapters: 150,
    totalVerses: 2461,
    chaptersVerseCount: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6]
  },
  {
    bookId: 20,
    bookCode: 'PRO',
    testament: 'OT',
    koreanName: '잠언',
    koreanAbbrev: '잠',
    englishName: 'Proverbs',
    englishAbbrev: 'Prov',
    totalChapters: 31,
    totalVerses: 915,
    chaptersVerseCount: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31]
  },
  {
    bookId: 21,
    bookCode: 'ECC',
    testament: 'OT',
    koreanName: '전도서',
    koreanAbbrev: '전',
    englishName: 'Ecclesiastes',
    englishAbbrev: 'Eccl',
    totalChapters: 12,
    totalVerses: 222,
    chaptersVerseCount: [18,26,22,16,20,12,29,17,18,20,10,14]
  },
  {
    bookId: 22,
    bookCode: 'SNG',
    testament: 'OT',
    koreanName: '아가',
    koreanAbbrev: '아',
    englishName: 'Song of Solomon',
    englishAbbrev: 'Song',
    totalChapters: 8,
    totalVerses: 117,
    chaptersVerseCount: [17,17,11,16,16,13,13,14]
  },
  {
    bookId: 23,
    bookCode: 'ISA',
    testament: 'OT',
    koreanName: '이사야',
    koreanAbbrev: '사',
    englishName: 'Isaiah',
    englishAbbrev: 'Isa',
    totalChapters: 66,
    totalVerses: 1292,
    chaptersVerseCount: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24]
  },
  {
    bookId: 24,
    bookCode: 'JER',
    testament: 'OT',
    koreanName: '예레미야',
    koreanAbbrev: '렘',
    englishName: 'Jeremiah',
    englishAbbrev: 'Jer',
    totalChapters: 52,
    totalVerses: 1364,
    chaptersVerseCount: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34]
  },
  {
    bookId: 25,
    bookCode: 'LAM',
    testament: 'OT',
    koreanName: '예레미야애가',
    koreanAbbrev: '애',
    englishName: 'Lamentations',
    englishAbbrev: 'Lam',
    totalChapters: 5,
    totalVerses: 154,
    chaptersVerseCount: [22,22,66,22,22]
  },
  {
    bookId: 26,
    bookCode: 'EZK',
    testament: 'OT',
    koreanName: '에스겔',
    koreanAbbrev: '겔',
    englishName: 'Ezekiel',
    englishAbbrev: 'Ezek',
    totalChapters: 48,
    totalVerses: 1273,
    chaptersVerseCount: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35]
  },
  {
    bookId: 27,
    bookCode: 'DAN',
    testament: 'OT',
    koreanName: '다니엘',
    koreanAbbrev: '단',
    englishName: 'Daniel',
    englishAbbrev: 'Dan',
    totalChapters: 12,
    totalVerses: 357,
    chaptersVerseCount: [21,49,30,37,31,28,28,27,27,21,45,13]
  },
  {
    bookId: 28,
    bookCode: 'HOS',
    testament: 'OT',
    koreanName: '호세아',
    koreanAbbrev: '호',
    englishName: 'Hosea',
    englishAbbrev: 'Hos',
    totalChapters: 14,
    totalVerses: 197,
    chaptersVerseCount: [11,23,5,19,15,11,16,14,17,15,12,14,16,9]
  },
  {
    bookId: 29,
    bookCode: 'JOL',
    testament: 'OT',
    koreanName: '요엘',
    koreanAbbrev: '욜',
    englishName: 'Joel',
    englishAbbrev: 'Joel',
    totalChapters: 3,
    totalVerses: 73,
    chaptersVerseCount: [20,32,21]
  },
  {
    bookId: 30,
    bookCode: 'AMO',
    testament: 'OT',
    koreanName: '아모스',
    koreanAbbrev: '암',
    englishName: 'Amos',
    englishAbbrev: 'Amos',
    totalChapters: 9,
    totalVerses: 146,
    chaptersVerseCount: [15,16,15,13,27,14,17,14,15]
  },
  {
    bookId: 31,
    bookCode: 'OBA',
    testament: 'OT',
    koreanName: '오바댜',
    koreanAbbrev: '옵',
    englishName: 'Obadiah',
    englishAbbrev: 'Obad',
    totalChapters: 1,
    totalVerses: 21,
    chaptersVerseCount: [21]
  },
  {
    bookId: 32,
    bookCode: 'JON',
    testament: 'OT',
    koreanName: '요나',
    koreanAbbrev: '욘',
    englishName: 'Jonah',
    englishAbbrev: 'Jonah',
    totalChapters: 4,
    totalVerses: 48,
    chaptersVerseCount: [17,10,10,11]
  },
  {
    bookId: 33,
    bookCode: 'MIC',
    testament: 'OT',
    koreanName: '미가',
    koreanAbbrev: '미',
    englishName: 'Micah',
    englishAbbrev: 'Mic',
    totalChapters: 7,
    totalVerses: 105,
    chaptersVerseCount: [16,13,12,13,15,16,20]
  },
  {
    bookId: 34,
    bookCode: 'NAM',
    testament: 'OT',
    koreanName: '나훔',
    koreanAbbrev: '나',
    englishName: 'Nahum',
    englishAbbrev: 'Nah',
    totalChapters: 3,
    totalVerses: 47,
    chaptersVerseCount: [15,19,13]
  },
  {
    bookId: 35,
    bookCode: 'HAB',
    testament: 'OT',
    koreanName: '하박국',
    koreanAbbrev: '합',
    englishName: 'Habakkuk',
    englishAbbrev: 'Hab',
    totalChapters: 3,
    totalVerses: 56,
    chaptersVerseCount: [17,20,19]
  },
  {
    bookId: 36,
    bookCode: 'ZEP',
    testament: 'OT',
    koreanName: '스바냐',
    koreanAbbrev: '습',
    englishName: 'Zephaniah',
    englishAbbrev: 'Zeph',
    totalChapters: 3,
    totalVerses: 53,
    chaptersVerseCount: [18,15,20]
  },
  {
    bookId: 37,
    bookCode: 'HAG',
    testament: 'OT',
    koreanName: '학개',
    koreanAbbrev: '학',
    englishName: 'Haggai',
    englishAbbrev: 'Hag',
    totalChapters: 2,
    totalVerses: 38,
    chaptersVerseCount: [15,23]
  },
  {
    bookId: 38,
    bookCode: 'ZEC',
    testament: 'OT',
    koreanName: '스가랴',
    koreanAbbrev: '슥',
    englishName: 'Zechariah',
    englishAbbrev: 'Zech',
    totalChapters: 14,
    totalVerses: 211,
    chaptersVerseCount: [21,13,10,14,11,15,14,23,17,12,17,14,9,21]
  },
  {
    bookId: 39,
    bookCode: 'MAL',
    testament: 'OT',
    koreanName: '말라기',
    koreanAbbrev: '말',
    englishName: 'Malachi',
    englishAbbrev: 'Mal',
    totalChapters: 4,
    totalVerses: 55,
    chaptersVerseCount: [14,17,18,6]
  }
];

// 신약 27권 메타데이터
export const newTestamentBooks: BookMetadata[] = [
  {
    bookId: 40,
    bookCode: 'MAT',
    testament: 'NT',
    koreanName: '마태복음',
    koreanAbbrev: '마',
    englishName: 'Matthew',
    englishAbbrev: 'Matt',
    totalChapters: 28,
    totalVerses: 1071,
    chaptersVerseCount: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20]
  },
  {
    bookId: 41,
    bookCode: 'MRK',
    testament: 'NT',
    koreanName: '마가복음',
    koreanAbbrev: '막',
    englishName: 'Mark',
    englishAbbrev: 'Mark',
    totalChapters: 16,
    totalVerses: 678,
    chaptersVerseCount: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20]
  },
  {
    bookId: 42,
    bookCode: 'LUK',
    testament: 'NT',
    koreanName: '누가복음',
    koreanAbbrev: '눅',
    englishName: 'Luke',
    englishAbbrev: 'Luke',
    totalChapters: 24,
    totalVerses: 1151,
    chaptersVerseCount: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53]
  },
  {
    bookId: 43,
    bookCode: 'JHN',
    testament: 'NT',
    koreanName: '요한복음',
    koreanAbbrev: '요',
    englishName: 'John',
    englishAbbrev: 'John',
    totalChapters: 21,
    totalVerses: 879,
    chaptersVerseCount: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25]
  },
  {
    bookId: 44,
    bookCode: 'ACT',
    testament: 'NT',
    koreanName: '사도행전',
    koreanAbbrev: '행',
    englishName: 'Acts',
    englishAbbrev: 'Acts',
    totalChapters: 28,
    totalVerses: 1007,
    chaptersVerseCount: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31]
  },
  {
    bookId: 45,
    bookCode: 'ROM',
    testament: 'NT',
    koreanName: '로마서',
    koreanAbbrev: '롬',
    englishName: 'Romans',
    englishAbbrev: 'Rom',
    totalChapters: 16,
    totalVerses: 433,
    chaptersVerseCount: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27]
  },
  {
    bookId: 46,
    bookCode: '1CO',
    testament: 'NT',
    koreanName: '고린도전서',
    koreanAbbrev: '고전',
    englishName: '1 Corinthians',
    englishAbbrev: '1Cor',
    totalChapters: 16,
    totalVerses: 437,
    chaptersVerseCount: [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24]
  },
  {
    bookId: 47,
    bookCode: '2CO',
    testament: 'NT',
    koreanName: '고린도후서',
    koreanAbbrev: '고후',
    englishName: '2 Corinthians',
    englishAbbrev: '2Cor',
    totalChapters: 13,
    totalVerses: 257,
    chaptersVerseCount: [24,17,18,18,21,18,16,24,15,18,33,21,14]
  },
  {
    bookId: 48,
    bookCode: 'GAL',
    testament: 'NT',
    koreanName: '갈라디아서',
    koreanAbbrev: '갈',
    englishName: 'Galatians',
    englishAbbrev: 'Gal',
    totalChapters: 6,
    totalVerses: 149,
    chaptersVerseCount: [24,21,29,31,26,18]
  },
  {
    bookId: 49,
    bookCode: 'EPH',
    testament: 'NT',
    koreanName: '에베소서',
    koreanAbbrev: '엡',
    englishName: 'Ephesians',
    englishAbbrev: 'Eph',
    totalChapters: 6,
    totalVerses: 155,
    chaptersVerseCount: [23,22,21,32,33,24]
  },
  {
    bookId: 50,
    bookCode: 'PHP',
    testament: 'NT',
    koreanName: '빌립보서',
    koreanAbbrev: '빌',
    englishName: 'Philippians',
    englishAbbrev: 'Phil',
    totalChapters: 4,
    totalVerses: 104,
    chaptersVerseCount: [30,30,21,23]
  },
  {
    bookId: 51,
    bookCode: 'COL',
    testament: 'NT',
    koreanName: '골로새서',
    koreanAbbrev: '골',
    englishName: 'Colossians',
    englishAbbrev: 'Col',
    totalChapters: 4,
    totalVerses: 95,
    chaptersVerseCount: [29,23,25,18]
  },
  {
    bookId: 52,
    bookCode: '1TH',
    testament: 'NT',
    koreanName: '데살로니가전서',
    koreanAbbrev: '살전',
    englishName: '1 Thessalonians',
    englishAbbrev: '1Thess',
    totalChapters: 5,
    totalVerses: 89,
    chaptersVerseCount: [10,20,13,18,28]
  },
  {
    bookId: 53,
    bookCode: '2TH',
    testament: 'NT',
    koreanName: '데살로니가후서',
    koreanAbbrev: '살후',
    englishName: '2 Thessalonians',
    englishAbbrev: '2Thess',
    totalChapters: 3,
    totalVerses: 47,
    chaptersVerseCount: [12,17,18]
  },
  {
    bookId: 54,
    bookCode: '1TI',
    testament: 'NT',
    koreanName: '디모데전서',
    koreanAbbrev: '딤전',
    englishName: '1 Timothy',
    englishAbbrev: '1Tim',
    totalChapters: 6,
    totalVerses: 113,
    chaptersVerseCount: [20,15,16,16,25,21]
  },
  {
    bookId: 55,
    bookCode: '2TI',
    testament: 'NT',
    koreanName: '디모데후서',
    koreanAbbrev: '딤후',
    englishName: '2 Timothy',
    englishAbbrev: '2Tim',
    totalChapters: 4,
    totalVerses: 83,
    chaptersVerseCount: [18,26,17,22]
  },
  {
    bookId: 56,
    bookCode: 'TIT',
    testament: 'NT',
    koreanName: '디도서',
    koreanAbbrev: '딛',
    englishName: 'Titus',
    englishAbbrev: 'Titus',
    totalChapters: 3,
    totalVerses: 46,
    chaptersVerseCount: [16,15,15]
  },
  {
    bookId: 57,
    bookCode: 'PHM',
    testament: 'NT',
    koreanName: '빌레몬서',
    koreanAbbrev: '몬',
    englishName: 'Philemon',
    englishAbbrev: 'Phlm',
    totalChapters: 1,
    totalVerses: 25,
    chaptersVerseCount: [25]
  },
  {
    bookId: 58,
    bookCode: 'HEB',
    testament: 'NT',
    koreanName: '히브리서',
    koreanAbbrev: '히',
    englishName: 'Hebrews',
    englishAbbrev: 'Heb',
    totalChapters: 13,
    totalVerses: 303,
    chaptersVerseCount: [14,18,19,16,14,20,28,13,28,39,40,29,25]
  },
  {
    bookId: 59,
    bookCode: 'JAS',
    testament: 'NT',
    koreanName: '야고보서',
    koreanAbbrev: '약',
    englishName: 'James',
    englishAbbrev: 'Jas',
    totalChapters: 5,
    totalVerses: 108,
    chaptersVerseCount: [27,26,18,17,20]
  },
  {
    bookId: 60,
    bookCode: '1PE',
    testament: 'NT',
    koreanName: '베드로전서',
    koreanAbbrev: '벧전',
    englishName: '1 Peter',
    englishAbbrev: '1Pet',
    totalChapters: 5,
    totalVerses: 105,
    chaptersVerseCount: [25,25,22,19,14]
  },
  {
    bookId: 61,
    bookCode: '2PE',
    testament: 'NT',
    koreanName: '베드로후서',
    koreanAbbrev: '벧후',
    englishName: '2 Peter',
    englishAbbrev: '2Pet',
    totalChapters: 3,
    totalVerses: 61,
    chaptersVerseCount: [21,22,18]
  },
  {
    bookId: 62,
    bookCode: '1JN',
    testament: 'NT',
    koreanName: '요한일서',
    koreanAbbrev: '요일',
    englishName: '1 John',
    englishAbbrev: '1John',
    totalChapters: 5,
    totalVerses: 105,
    chaptersVerseCount: [10,29,24,21,21]
  },
  {
    bookId: 63,
    bookCode: '2JN',
    testament: 'NT',
    koreanName: '요한이서',
    koreanAbbrev: '요이',
    englishName: '2 John',
    englishAbbrev: '2John',
    totalChapters: 1,
    totalVerses: 13,
    chaptersVerseCount: [13]
  },
  {
    bookId: 64,
    bookCode: '3JN',
    testament: 'NT',
    koreanName: '요한삼서',
    koreanAbbrev: '요삼',
    englishName: '3 John',
    englishAbbrev: '3John',
    totalChapters: 1,
    totalVerses: 15,
    chaptersVerseCount: [15]
  },
  {
    bookId: 65,
    bookCode: 'JUD',
    testament: 'NT',
    koreanName: '유다서',
    koreanAbbrev: '유',
    englishName: 'Jude',
    englishAbbrev: 'Jude',
    totalChapters: 1,
    totalVerses: 25,
    chaptersVerseCount: [25]
  },
  {
    bookId: 66,
    bookCode: 'REV',
    testament: 'NT',
    koreanName: '요한계시록',
    koreanAbbrev: '계',
    englishName: 'Revelation',
    englishAbbrev: 'Rev',
    totalChapters: 22,
    totalVerses: 404,
    chaptersVerseCount: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21]
  }
];

// 전체 66권
export const allBooks: BookMetadata[] = [...oldTestamentBooks, ...newTestamentBooks];

// 통계 정보
export const bibleStats = {
  totalBooks: 66,
  oldTestamentBooks: 39,
  newTestamentBooks: 27,
  totalChapters: 1189,
  totalVerses: 31102,
  oldTestamentVerses: 23145,
  newTestamentVerses: 7957
};

// 책 ID로 메타데이터 찾기
export function getBookById(bookId: number): BookMetadata | undefined {
  return allBooks.find(b => b.bookId === bookId);
}

// 책 코드로 메타데이터 찾기
export function getBookByCode(bookCode: string): BookMetadata | undefined {
  return allBooks.find(b => b.bookCode === bookCode);
}

// 특정 장의 절 수 가져오기
export function getVerseCount(bookId: number, chapter: number): number {
  const book = getBookById(bookId);
  if (!book || chapter < 1 || chapter > book.totalChapters) return 0;
  return book.chaptersVerseCount[chapter - 1];
}
