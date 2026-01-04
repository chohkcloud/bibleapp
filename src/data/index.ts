// src/data/index.ts
// 성경 데이터 통합 인덱스

import { allBibleVerses, BibleVerse } from './bibleVerses';
import { allOTVerses } from './bibleVersesOT';
import { allNTVerses } from './bibleVersesNT';

// 모든 성경 구절 통합
export const completeBibleVerses: BibleVerse[] = [
  ...allBibleVerses,
  ...allOTVerses,
  ...allNTVerses,
];

// 중복 제거 함수 (같은 책, 장, 절은 하나만 유지)
function removeDuplicates(verses: BibleVerse[]): BibleVerse[] {
  const seen = new Set<string>();
  return verses.filter(v => {
    const key = `${v.bookId}-${v.chapter}-${v.verse}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 중복 제거된 최종 성경 구절
export const allVerses = removeDuplicates(completeBibleVerses);

// 특정 책의 구절 가져오기
export function getVersesByBook(bookId: number): BibleVerse[] {
  return allVerses.filter(v => v.bookId === bookId);
}

// 특정 장의 구절 가져오기
export function getVersesByChapter(bookId: number, chapter: number): BibleVerse[] {
  return allVerses.filter(v => v.bookId === bookId && v.chapter === chapter);
}

// SQL INSERT 문 생성 (배치 처리)
export function generateInsertSQL(verses: BibleVerse[], batchSize: number = 50): string[] {
  const batches: string[] = [];

  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, i + batchSize);
    const values = batch.map(v =>
      `('KRV', ${v.bookId}, ${v.chapter}, ${v.verse}, '${v.text.replace(/'/g, "''")}')`
    ).join(',\n      ');

    batches.push(`INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES
      ${values};`);
  }

  return batches;
}

export { BibleVerse };
