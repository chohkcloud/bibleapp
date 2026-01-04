// scripts/parseBibleFile.js
// 개역한글 성경 텍스트 파일을 JSON으로 변환

const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// 책 코드 매핑 (파일의 영문 코드 -> bookId)
const bookCodeMap = {
  // 구약 39권
  'Gen': 1, 'Exo': 2, 'Lev': 3, 'Num': 4, 'Deu': 5,
  'Jos': 6, 'Jdg': 7, 'Rut': 8, '1Sa': 9, '2Sa': 10,
  '1Ki': 11, '2Ki': 12, '1Ch': 13, '2Ch': 14, 'Ezr': 15,
  'Neh': 16, 'Est': 17, 'Job': 18, 'Psa': 19, 'Pro': 20,
  'Ecc': 21, 'Sol': 22, 'Isa': 23, 'Jer': 24, 'Lam': 25,
  'Eze': 26, 'Dan': 27, 'Hos': 28, 'Joe': 29, 'Amo': 30,
  'Oba': 31, 'Jon': 32, 'Mic': 33, 'Nah': 34, 'Hab': 35,
  'Zep': 36, 'Hag': 37, 'Zec': 38, 'Mal': 39,
  // 신약 27권
  'Mat': 40, 'Mar': 41, 'Luk': 42, 'Joh': 43, 'Act': 44,
  'Rom': 45, '1Co': 46, '2Co': 47, 'Gal': 48, 'Eph': 49,
  'Phi': 50, 'Col': 51, '1Th': 52, '2Th': 53, '1Ti': 54,
  '2Ti': 55, 'Tit': 56, 'Phm': 57, 'Heb': 58, 'Jam': 59,
  '1Pe': 60, '2Pe': 61, '1Jo': 62, '2Jo': 63, '3Jo': 64,
  'Jud': 65, 'Rev': 66
};

// 책 이름
const bookNames = {
  1: '창세기', 2: '출애굽기', 3: '레위기', 4: '민수기', 5: '신명기',
  6: '여호수아', 7: '사사기', 8: '룻기', 9: '사무엘상', 10: '사무엘하',
  11: '열왕기상', 12: '열왕기하', 13: '역대상', 14: '역대하', 15: '에스라',
  16: '느헤미야', 17: '에스더', 18: '욥기', 19: '시편', 20: '잠언',
  21: '전도서', 22: '아가', 23: '이사야', 24: '예레미야', 25: '예레미야애가',
  26: '에스겔', 27: '다니엘', 28: '호세아', 29: '요엘', 30: '아모스',
  31: '오바댜', 32: '요나', 33: '미가', 34: '나훔', 35: '하박국',
  36: '스바냐', 37: '학개', 38: '스가랴', 39: '말라기',
  40: '마태복음', 41: '마가복음', 42: '누가복음', 43: '요한복음', 44: '사도행전',
  45: '로마서', 46: '고린도전서', 47: '고린도후서', 48: '갈라디아서', 49: '에베소서',
  50: '빌립보서', 51: '골로새서', 52: '데살로니가전서', 53: '데살로니가후서', 54: '디모데전서',
  55: '디모데후서', 56: '디도서', 57: '빌레몬서', 58: '히브리서', 59: '야고보서',
  60: '베드로전서', 61: '베드로후서', 62: '요한일서', 63: '요한이서', 64: '요한삼서',
  65: '유다서', 66: '요한계시록'
};

function parseBibleFile(filePath) {
  console.log('성경 파일 읽는 중...');

  // EUC-KR 인코딩으로 파일 읽기
  const buffer = fs.readFileSync(filePath);
  const content = iconv.decode(buffer, 'euc-kr');
  const lines = content.split('\n');

  console.log(`총 ${lines.length} 라인 발견`);

  const verses = [];
  let skipped = 0;

  // 정규식: "BookCode Chapter:Verse Text"
  const regex = /^(\d?[A-Za-z]+)\s+(\d+):(\d+)\s+(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(regex);
    if (match) {
      const [, bookCode, chapter, verse, text] = match;
      const bookId = bookCodeMap[bookCode];

      if (bookId) {
        verses.push({
          bookId,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          text: text.trim()
        });
      } else {
        skipped++;
        if (skipped <= 5) {
          console.log(`알 수 없는 책 코드: ${bookCode}`);
        }
      }
    } else {
      skipped++;
    }
  }

  console.log(`파싱 완료: ${verses.length}절, 스킵: ${skipped}라인`);
  return verses;
}

function saveVerses(verses) {
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'bible');

  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 구약/신약 분리
  const otVerses = verses.filter(v => v.bookId <= 39);
  const ntVerses = verses.filter(v => v.bookId >= 40);

  // 구약 파트 분할 (파일 크기 관리)
  const otPart1 = otVerses.filter(v => v.bookId <= 19); // 창-시편
  const otPart2 = otVerses.filter(v => v.bookId >= 20 && v.bookId <= 39); // 잠-말

  // JSON 파일 저장
  fs.writeFileSync(
    path.join(outputDir, 'ot_part1.json'),
    JSON.stringify(otPart1),
    'utf8'
  );
  console.log(`구약 Part1 저장: ${otPart1.length}절 (창세기-시편)`);

  fs.writeFileSync(
    path.join(outputDir, 'ot_part2.json'),
    JSON.stringify(otPart2),
    'utf8'
  );
  console.log(`구약 Part2 저장: ${otPart2.length}절 (잠언-말라기)`);

  fs.writeFileSync(
    path.join(outputDir, 'nt.json'),
    JSON.stringify(ntVerses),
    'utf8'
  );
  console.log(`신약 저장: ${ntVerses.length}절`);

  // 통계 저장
  const stats = {
    totalBooks: 66,
    totalVerses: verses.length,
    otVerses: otVerses.length,
    ntVerses: ntVerses.length,
    byBook: {}
  };

  for (let i = 1; i <= 66; i++) {
    const count = verses.filter(v => v.bookId === i).length;
    stats.byBook[i] = { name: bookNames[i], verses: count };
  }

  fs.writeFileSync(
    path.join(outputDir, 'stats.json'),
    JSON.stringify(stats, null, 2),
    'utf8'
  );

  console.log('\n=== 통계 ===');
  console.log(`총 구절: ${stats.totalVerses}`);
  console.log(`구약: ${stats.otVerses}절`);
  console.log(`신약: ${stats.ntVerses}절`);
}

// 메인 실행
const inputFile = path.join(__dirname, '..', '..', '개역한글 (1).txt');
console.log(`입력 파일: ${inputFile}\n`);

const verses = parseBibleFile(inputFile);
saveVerses(verses);

console.log('\n성경 데이터 변환 완료!');
