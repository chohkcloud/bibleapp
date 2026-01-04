// scripts/fetchBibleData.js
// 개역한글 성경 데이터 수집 스크립트
// API: getbible.net (무료 공개 API)

const fs = require('fs');
const path = require('path');
const https = require('https');

// 66권 메타데이터
const books = [
  // 구약 39권
  { id: 1, code: 'Gen', chapters: 50, name: '창세기' },
  { id: 2, code: 'Exod', chapters: 40, name: '출애굽기' },
  { id: 3, code: 'Lev', chapters: 27, name: '레위기' },
  { id: 4, code: 'Num', chapters: 36, name: '민수기' },
  { id: 5, code: 'Deut', chapters: 34, name: '신명기' },
  { id: 6, code: 'Josh', chapters: 24, name: '여호수아' },
  { id: 7, code: 'Judg', chapters: 21, name: '사사기' },
  { id: 8, code: 'Ruth', chapters: 4, name: '룻기' },
  { id: 9, code: '1Sam', chapters: 31, name: '사무엘상' },
  { id: 10, code: '2Sam', chapters: 24, name: '사무엘하' },
  { id: 11, code: '1Kgs', chapters: 22, name: '열왕기상' },
  { id: 12, code: '2Kgs', chapters: 25, name: '열왕기하' },
  { id: 13, code: '1Chr', chapters: 29, name: '역대상' },
  { id: 14, code: '2Chr', chapters: 36, name: '역대하' },
  { id: 15, code: 'Ezra', chapters: 10, name: '에스라' },
  { id: 16, code: 'Neh', chapters: 13, name: '느헤미야' },
  { id: 17, code: 'Esth', chapters: 10, name: '에스더' },
  { id: 18, code: 'Job', chapters: 42, name: '욥기' },
  { id: 19, code: 'Ps', chapters: 150, name: '시편' },
  { id: 20, code: 'Prov', chapters: 31, name: '잠언' },
  { id: 21, code: 'Eccl', chapters: 12, name: '전도서' },
  { id: 22, code: 'Song', chapters: 8, name: '아가' },
  { id: 23, code: 'Isa', chapters: 66, name: '이사야' },
  { id: 24, code: 'Jer', chapters: 52, name: '예레미야' },
  { id: 25, code: 'Lam', chapters: 5, name: '예레미야애가' },
  { id: 26, code: 'Ezek', chapters: 48, name: '에스겔' },
  { id: 27, code: 'Dan', chapters: 12, name: '다니엘' },
  { id: 28, code: 'Hos', chapters: 14, name: '호세아' },
  { id: 29, code: 'Joel', chapters: 3, name: '요엘' },
  { id: 30, code: 'Amos', chapters: 9, name: '아모스' },
  { id: 31, code: 'Obad', chapters: 1, name: '오바댜' },
  { id: 32, code: 'Jonah', chapters: 4, name: '요나' },
  { id: 33, code: 'Mic', chapters: 7, name: '미가' },
  { id: 34, code: 'Nah', chapters: 3, name: '나훔' },
  { id: 35, code: 'Hab', chapters: 3, name: '하박국' },
  { id: 36, code: 'Zeph', chapters: 3, name: '스바냐' },
  { id: 37, code: 'Hag', chapters: 2, name: '학개' },
  { id: 38, code: 'Zech', chapters: 14, name: '스가랴' },
  { id: 39, code: 'Mal', chapters: 4, name: '말라기' },
  // 신약 27권
  { id: 40, code: 'Matt', chapters: 28, name: '마태복음' },
  { id: 41, code: 'Mark', chapters: 16, name: '마가복음' },
  { id: 42, code: 'Luke', chapters: 24, name: '누가복음' },
  { id: 43, code: 'John', chapters: 21, name: '요한복음' },
  { id: 44, code: 'Acts', chapters: 28, name: '사도행전' },
  { id: 45, code: 'Rom', chapters: 16, name: '로마서' },
  { id: 46, code: '1Cor', chapters: 16, name: '고린도전서' },
  { id: 47, code: '2Cor', chapters: 13, name: '고린도후서' },
  { id: 48, code: 'Gal', chapters: 6, name: '갈라디아서' },
  { id: 49, code: 'Eph', chapters: 6, name: '에베소서' },
  { id: 50, code: 'Phil', chapters: 4, name: '빌립보서' },
  { id: 51, code: 'Col', chapters: 4, name: '골로새서' },
  { id: 52, code: '1Thess', chapters: 5, name: '데살로니가전서' },
  { id: 53, code: '2Thess', chapters: 3, name: '데살로니가후서' },
  { id: 54, code: '1Tim', chapters: 6, name: '디모데전서' },
  { id: 55, code: '2Tim', chapters: 4, name: '디모데후서' },
  { id: 56, code: 'Titus', chapters: 3, name: '디도서' },
  { id: 57, code: 'Phlm', chapters: 1, name: '빌레몬서' },
  { id: 58, code: 'Heb', chapters: 13, name: '히브리서' },
  { id: 59, code: 'Jas', chapters: 5, name: '야고보서' },
  { id: 60, code: '1Pet', chapters: 5, name: '베드로전서' },
  { id: 61, code: '2Pet', chapters: 3, name: '베드로후서' },
  { id: 62, code: '1John', chapters: 5, name: '요한일서' },
  { id: 63, code: '2John', chapters: 1, name: '요한이서' },
  { id: 64, code: '3John', chapters: 1, name: '요한삼서' },
  { id: 65, code: 'Jude', chapters: 1, name: '유다서' },
  { id: 66, code: 'Rev', chapters: 22, name: '요한계시록' }
];

// API에서 장 데이터 가져오기
function fetchChapter(bookCode, chapter) {
  return new Promise((resolve, reject) => {
    // getbible.net API 사용 (korean 버전)
    const url = `https://getbible.net/v2/korean/${bookCode.toLowerCase()}/${chapter}.json`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error(`Error fetching ${bookCode} ${chapter}: ${e.message}`);
      resolve(null);
    });
  });
}

// 지연 함수
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 전체 성경 데이터 수집
async function fetchAllBibleData() {
  const allVerses = [];
  let totalVerses = 0;

  console.log('개역한글 성경 데이터 수집 시작...\n');

  for (const book of books) {
    console.log(`${book.name} (${book.id}/66) 수집 중...`);
    const bookVerses = [];

    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const chapterData = await fetchChapter(book.code, chapter);

      if (chapterData && chapterData.verses) {
        for (const verseData of chapterData.verses) {
          bookVerses.push({
            bookId: book.id,
            chapter: chapter,
            verse: parseInt(verseData.verse),
            text: verseData.text.trim()
          });
        }
      }

      // API 요청 간격 조절 (100ms)
      await delay(100);
    }

    allVerses.push(...bookVerses);
    totalVerses += bookVerses.length;
    console.log(`  → ${bookVerses.length}절 수집 완료 (총 ${totalVerses}절)`);
  }

  return allVerses;
}

// 데이터를 파일로 저장
async function saveData(verses) {
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'bible');

  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 전체 데이터를 구약/신약으로 나누어 저장
  const otVerses = verses.filter(v => v.bookId <= 39);
  const ntVerses = verses.filter(v => v.bookId >= 40);

  // 구약 데이터 저장 (여러 파일로 분할)
  const otPart1 = otVerses.filter(v => v.bookId <= 19); // 창-시편
  const otPart2 = otVerses.filter(v => v.bookId >= 20 && v.bookId <= 39); // 잠-말

  fs.writeFileSync(
    path.join(outputDir, 'ot_part1.json'),
    JSON.stringify(otPart1, null, 2),
    'utf8'
  );
  console.log(`\n구약 Part1 저장: ${otPart1.length}절`);

  fs.writeFileSync(
    path.join(outputDir, 'ot_part2.json'),
    JSON.stringify(otPart2, null, 2),
    'utf8'
  );
  console.log(`구약 Part2 저장: ${otPart2.length}절`);

  // 신약 데이터 저장
  fs.writeFileSync(
    path.join(outputDir, 'nt.json'),
    JSON.stringify(ntVerses, null, 2),
    'utf8'
  );
  console.log(`신약 저장: ${ntVerses.length}절`);

  // 통계 정보 저장
  const stats = {
    totalBooks: 66,
    totalChapters: books.reduce((sum, b) => sum + b.chapters, 0),
    totalVerses: verses.length,
    otVerses: otVerses.length,
    ntVerses: ntVerses.length,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(outputDir, 'stats.json'),
    JSON.stringify(stats, null, 2),
    'utf8'
  );
  console.log(`\n통계 정보 저장 완료`);
  console.log(`총 ${stats.totalVerses}절 수집 완료!`);
}

// 메인 실행
async function main() {
  try {
    const verses = await fetchAllBibleData();
    await saveData(verses);
    console.log('\n성경 데이터 수집 완료!');
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

main();
