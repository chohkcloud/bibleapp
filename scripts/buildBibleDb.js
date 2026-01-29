/**
 * buildBibleDb.js
 * JSON 성경 데이터를 SQLite DB로 변환하는 스크립트
 *
 * 사용법: node scripts/buildBibleDb.js
 * 출력: assets/bible.db
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 경로 설정
const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'bible');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const DB_PATH = path.join(ASSETS_DIR, 'bible.db');

// assets 폴더 생성
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// 기존 DB 삭제
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('[삭제] 기존 bible.db 삭제됨');
}

// DB 생성
const db = new Database(DB_PATH);
console.log('[생성] bible.db 생성됨');

// 스키마 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS languages (
    lang_id TEXT PRIMARY KEY,
    lang_name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS bibles (
    bible_id TEXT PRIMARY KEY,
    lang_id TEXT NOT NULL,
    version_name TEXT NOT NULL,
    version_abbr TEXT NOT NULL,
    copyright TEXT
  );

  CREATE TABLE IF NOT EXISTS books (
    book_id INTEGER PRIMARY KEY,
    book_code TEXT NOT NULL UNIQUE,
    testament TEXT NOT NULL,
    total_chapters INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS book_names (
    book_id INTEGER NOT NULL,
    lang_id TEXT NOT NULL,
    book_name TEXT NOT NULL,
    abbrev TEXT,
    PRIMARY KEY (book_id, lang_id)
  );

  CREATE TABLE IF NOT EXISTS verses (
    verse_id INTEGER PRIMARY KEY AUTOINCREMENT,
    bible_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_num INTEGER NOT NULL,
    text TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_verses_lookup ON verses(bible_id, book_id, chapter);
  CREATE INDEX IF NOT EXISTS idx_verses_search ON verses(bible_id, text);
`);
console.log('[스키마] 테이블 생성 완료');

// 기본 데이터 삽입
db.exec(`
  INSERT OR IGNORE INTO languages VALUES ('ko', '한국어', 1);
  INSERT OR IGNORE INTO bibles VALUES ('KRV', 'ko', '개역한글', '개역', '대한성서공회');
`);

// 구약 39권
const otBooks = [
  [1, 'GEN', 'OT', 50], [2, 'EXO', 'OT', 40], [3, 'LEV', 'OT', 27], [4, 'NUM', 'OT', 36],
  [5, 'DEU', 'OT', 34], [6, 'JOS', 'OT', 24], [7, 'JDG', 'OT', 21], [8, 'RUT', 'OT', 4],
  [9, '1SA', 'OT', 31], [10, '2SA', 'OT', 24], [11, '1KI', 'OT', 22], [12, '2KI', 'OT', 25],
  [13, '1CH', 'OT', 29], [14, '2CH', 'OT', 36], [15, 'EZR', 'OT', 10], [16, 'NEH', 'OT', 13],
  [17, 'EST', 'OT', 10], [18, 'JOB', 'OT', 42], [19, 'PSA', 'OT', 150], [20, 'PRO', 'OT', 31],
  [21, 'ECC', 'OT', 12], [22, 'SNG', 'OT', 8], [23, 'ISA', 'OT', 66], [24, 'JER', 'OT', 52],
  [25, 'LAM', 'OT', 5], [26, 'EZK', 'OT', 48], [27, 'DAN', 'OT', 12], [28, 'HOS', 'OT', 14],
  [29, 'JOL', 'OT', 3], [30, 'AMO', 'OT', 9], [31, 'OBA', 'OT', 1], [32, 'JON', 'OT', 4],
  [33, 'MIC', 'OT', 7], [34, 'NAM', 'OT', 3], [35, 'HAB', 'OT', 3], [36, 'ZEP', 'OT', 3],
  [37, 'HAG', 'OT', 2], [38, 'ZEC', 'OT', 14], [39, 'MAL', 'OT', 4]
];

// 신약 27권
const ntBooks = [
  [40, 'MAT', 'NT', 28], [41, 'MRK', 'NT', 16], [42, 'LUK', 'NT', 24], [43, 'JHN', 'NT', 21],
  [44, 'ACT', 'NT', 28], [45, 'ROM', 'NT', 16], [46, '1CO', 'NT', 16], [47, '2CO', 'NT', 13],
  [48, 'GAL', 'NT', 6], [49, 'EPH', 'NT', 6], [50, 'PHP', 'NT', 4], [51, 'COL', 'NT', 4],
  [52, '1TH', 'NT', 5], [53, '2TH', 'NT', 3], [54, '1TI', 'NT', 6], [55, '2TI', 'NT', 4],
  [56, 'TIT', 'NT', 3], [57, 'PHM', 'NT', 1], [58, 'HEB', 'NT', 13], [59, 'JAS', 'NT', 5],
  [60, '1PE', 'NT', 5], [61, '2PE', 'NT', 3], [62, '1JN', 'NT', 5], [63, '2JN', 'NT', 1],
  [64, '3JN', 'NT', 1], [65, 'JUD', 'NT', 1], [66, 'REV', 'NT', 22]
];

const insertBook = db.prepare('INSERT OR IGNORE INTO books VALUES (?, ?, ?, ?)');
[...otBooks, ...ntBooks].forEach(b => insertBook.run(...b));
console.log('[데이터] 66권 책 정보 삽입 완료');

// 한글 책 이름
const bookNames = [
  [1, '창세기', '창'], [2, '출애굽기', '출'], [3, '레위기', '레'], [4, '민수기', '민'],
  [5, '신명기', '신'], [6, '여호수아', '수'], [7, '사사기', '삿'], [8, '룻기', '룻'],
  [9, '사무엘상', '삼상'], [10, '사무엘하', '삼하'], [11, '열왕기상', '왕상'], [12, '열왕기하', '왕하'],
  [13, '역대상', '대상'], [14, '역대하', '대하'], [15, '에스라', '스'], [16, '느헤미야', '느'],
  [17, '에스더', '에'], [18, '욥기', '욥'], [19, '시편', '시'], [20, '잠언', '잠'],
  [21, '전도서', '전'], [22, '아가', '아'], [23, '이사야', '사'], [24, '예레미야', '렘'],
  [25, '예레미야애가', '애'], [26, '에스겔', '겔'], [27, '다니엘', '단'], [28, '호세아', '호'],
  [29, '요엘', '욜'], [30, '아모스', '암'], [31, '오바댜', '옵'], [32, '요나', '욘'],
  [33, '미가', '미'], [34, '나훔', '나'], [35, '하박국', '합'], [36, '스바냐', '습'],
  [37, '학개', '학'], [38, '스가랴', '슥'], [39, '말라기', '말'],
  [40, '마태복음', '마'], [41, '마가복음', '막'], [42, '누가복음', '눅'], [43, '요한복음', '요'],
  [44, '사도행전', '행'], [45, '로마서', '롬'], [46, '고린도전서', '고전'], [47, '고린도후서', '고후'],
  [48, '갈라디아서', '갈'], [49, '에베소서', '엡'], [50, '빌립보서', '빌'], [51, '골로새서', '골'],
  [52, '데살로니가전서', '살전'], [53, '데살로니가후서', '살후'], [54, '디모데전서', '딤전'], [55, '디모데후서', '딤후'],
  [56, '디도서', '딛'], [57, '빌레몬서', '몬'], [58, '히브리서', '히'], [59, '야고보서', '약'],
  [60, '베드로전서', '벧전'], [61, '베드로후서', '벧후'], [62, '요한일서', '요일'], [63, '요한이서', '요이'],
  [64, '요한삼서', '요삼'], [65, '유다서', '유'], [66, '요한계시록', '계']
];

const insertBookName = db.prepare('INSERT OR IGNORE INTO book_names VALUES (?, \'ko\', ?, ?)');
bookNames.forEach(b => insertBookName.run(...b));
console.log('[데이터] 66권 한글 이름 삽입 완료');

// JSON 파일에서 구절 데이터 로드 및 삽입
console.log('[데이터] 성경 구절 삽입 시작...');

const insertVerse = db.prepare(
  'INSERT INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES (?, ?, ?, ?, ?)'
);

const insertMany = db.transaction((verses) => {
  for (const v of verses) {
    insertVerse.run('KRV', v.bookId, v.chapter, v.verse, v.text);
  }
});

// JSON 파일 로드 및 삽입
const files = ['ot_part1.json', 'ot_part2.json', 'nt.json'];
let totalVerses = 0;

files.forEach(file => {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`[오류] 파일 없음: ${filePath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  insertMany(data);
  totalVerses += data.length;
  console.log(`  - ${file}: ${data.length}절 삽입`);
});

console.log(`[완료] 총 ${totalVerses}절 삽입 완료`);

// DB 최적화
db.exec('VACUUM');
db.exec('ANALYZE');
console.log('[최적화] VACUUM, ANALYZE 완료');

// DB 닫기
db.close();

// 파일 크기 확인
const stats = fs.statSync(DB_PATH);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
console.log(`\n[결과] bible.db 생성 완료: ${sizeMB} MB`);
console.log(`[경로] ${DB_PATH}`);
