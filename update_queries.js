const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/database/bibleQueries.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// getChapterVerses 함수 수정
const oldFunc1 = `/**
 * 특정 장 전체 구절 조회
 */
export async function getChapterVerses(
  bibleId: string,
  bookId: number,
  chapter: number
): Promise<Verse[]> {
  if (isWeb) {
    return MOCK_VERSES.filter(
      v => v.bible_id === bibleId && v.book_id === bookId && v.chapter === chapter
    );
  }
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Verse>(
    \`SELECT * FROM verses
     WHERE bible_id = ? AND book_id = ? AND chapter = ?
     ORDER BY verse_num\`,
    [bibleId, bookId, chapter]
  );
}`;

const newFunc1 = `/**
 * 특정 장 전체 구절 조회
 */
export async function getChapterVerses(
  bibleId: string,
  bookId: number,
  chapter: number
): Promise<Verse[]> {
  // 번들 버전 처리
  if (isBundledVersion(bibleId)) {
    const bundledVerses = bundledBibleService.getChapterVerses(bibleId, bookId, chapter);
    return bundledVerses.map((v) => ({
      verse_id: bookId * 1000000 + chapter * 1000 + v.verse,
      bible_id: bibleId,
      book_id: v.bookId,
      chapter: v.chapter,
      verse_num: v.verse,
      text: v.text,
    }));
  }

  if (isWeb) {
    return MOCK_VERSES.filter(
      v => v.bible_id === bibleId && v.book_id === bookId && v.chapter === chapter
    );
  }
  const db = databaseService.getBibleDb();
  return await db.getAllAsync<Verse>(
    \`SELECT * FROM verses
     WHERE bible_id = ? AND book_id = ? AND chapter = ?
     ORDER BY verse_num\`,
    [bibleId, bookId, chapter]
  );
}`;

if (content.includes(oldFunc1)) {
  content = content.replace(oldFunc1, newFunc1);
  console.log('getChapterVerses updated');
} else {
  console.log('getChapterVerses pattern not found, may already be updated');
}

// getVerse 함수도 수정
const oldFunc2 = `/**
 * 특정 구절 조회
 */
export async function getVerse(
  bibleId: string,
  bookId: number,
  chapter: number,
  verseNum: number
): Promise<Verse | null> {
  if (isWeb) {
    return MOCK_VERSES.find(
      v => v.bible_id === bibleId && v.book_id === bookId &&
           v.chapter === chapter && v.verse_num === verseNum
    ) ?? null;
  }
  const db = databaseService.getBibleDb();
  return await db.getFirstAsync<Verse>(
    \`SELECT * FROM verses
     WHERE bible_id = ? AND book_id = ? AND chapter = ? AND verse_num = ?\`,
    [bibleId, bookId, chapter, verseNum]
  );
}`;

const newFunc2 = `/**
 * 특정 구절 조회
 */
export async function getVerse(
  bibleId: string,
  bookId: number,
  chapter: number,
  verseNum: number
): Promise<Verse | null> {
  // 번들 버전 처리
  if (isBundledVersion(bibleId)) {
    const v = bundledBibleService.getVerse(bibleId, bookId, chapter, verseNum);
    if (!v) return null;
    return {
      verse_id: bookId * 1000000 + chapter * 1000 + v.verse,
      bible_id: bibleId,
      book_id: v.bookId,
      chapter: v.chapter,
      verse_num: v.verse,
      text: v.text,
    };
  }

  if (isWeb) {
    return MOCK_VERSES.find(
      v => v.bible_id === bibleId && v.book_id === bookId &&
           v.chapter === chapter && v.verse_num === verseNum
    ) ?? null;
  }
  const db = databaseService.getBibleDb();
  return await db.getFirstAsync<Verse>(
    \`SELECT * FROM verses
     WHERE bible_id = ? AND book_id = ? AND chapter = ? AND verse_num = ?\`,
    [bibleId, bookId, chapter, verseNum]
  );
}`;

if (content.includes(oldFunc2)) {
  content = content.replace(oldFunc2, newFunc2);
  console.log('getVerse updated');
} else {
  console.log('getVerse pattern not found, may already be updated');
}

// 파일 저장
fs.writeFileSync(filePath, content);
console.log('bibleQueries.ts updated successfully');
