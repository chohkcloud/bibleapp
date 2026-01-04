# 데이터베이스 설계 (DATABASE.md)

## 데이터베이스 구조

```
┌─────────────────────────────────────────────────────────────┐
│                     로컬 저장소 구조                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   📁 Documents/                                             │
│   ├── 📄 bible.db          (읽기전용, ~25MB)               │
│   │   ├── languages        (언어 목록)                     │
│   │   ├── bibles           (성경 버전)                     │
│   │   ├── books            (성경 책 66권)                  │
│   │   ├── book_names       (다국어 책 이름)                │
│   │   └── verses           (성경 구절 + FTS 인덱스)        │
│   │                                                         │
│   └── 📄 user.db           (읽기/쓰기, 가변)               │
│       ├── memos            (묵상 메모)                     │
│       ├── memo_tags        (메모 태그)                     │
│       ├── memo_tag_map     (메모-태그 연결)                │
│       ├── bookmarks        (북마크)                        │
│       ├── highlights       (하이라이트)                    │
│       └── settings         (앱 설정)                       │
│                                                             │
│   🔐 SecureStore (Keychain/Keystore)                       │
│   ├── password_hash        (비밀번호 해시)                 │
│   ├── encryption_key       (AES 암호화 키)                 │
│   └── biometric_enabled    (생체인식 설정)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Bible.db 스키마 (읽기전용)

### languages 테이블

```sql
CREATE TABLE languages (
    lang_id     TEXT PRIMARY KEY,      -- 'ko', 'en', 'ja'
    lang_name   TEXT NOT NULL,         -- '한국어', 'English', '日本語'
    is_active   INTEGER DEFAULT 1      -- 1: 활성, 0: 비활성
);

-- 초기 데이터
INSERT INTO languages VALUES ('ko', '한국어', 1);
INSERT INTO languages VALUES ('en', 'English', 1);
INSERT INTO languages VALUES ('ja', '日本語', 1);
```

### bibles 테이블

```sql
CREATE TABLE bibles (
    bible_id      TEXT PRIMARY KEY,    -- 'KRV', 'NIV', 'KJV', 'JPN'
    lang_id       TEXT NOT NULL,       -- FK → languages
    version_name  TEXT NOT NULL,       -- '개역한글', 'NIV', '口語訳'
    version_abbr  TEXT NOT NULL,       -- '개역', 'NIV', '口語'
    copyright     TEXT,                -- 저작권 정보
    FOREIGN KEY (lang_id) REFERENCES languages(lang_id)
);

-- 초기 데이터
INSERT INTO bibles VALUES ('KRV', 'ko', '개역한글', '개역', '대한성서공회');
INSERT INTO bibles VALUES ('NIV', 'en', 'New International Version', 'NIV', 'Biblica');
INSERT INTO bibles VALUES ('KJV', 'en', 'King James Version', 'KJV', 'Public Domain');
INSERT INTO bibles VALUES ('JPN', 'ja', '口語訳聖書', '口語', 'Public Domain');
```

### books 테이블

```sql
CREATE TABLE books (
    book_id         INTEGER PRIMARY KEY,  -- 1-66
    book_code       TEXT NOT NULL UNIQUE, -- 'GEN', 'EXO', ... 'REV'
    testament       TEXT NOT NULL,        -- 'OT' | 'NT'
    total_chapters  INTEGER NOT NULL      -- 총 장 수
);

-- 초기 데이터 예시
INSERT INTO books VALUES (1, 'GEN', 'OT', 50);   -- 창세기
INSERT INTO books VALUES (2, 'EXO', 'OT', 40);   -- 출애굽기
-- ... (66권 전체)
INSERT INTO books VALUES (43, 'JHN', 'NT', 21);  -- 요한복음
INSERT INTO books VALUES (66, 'REV', 'NT', 22);  -- 요한계시록
```

### book_names 테이블

```sql
CREATE TABLE book_names (
    book_id     INTEGER NOT NULL,      -- FK → books
    lang_id     TEXT NOT NULL,         -- FK → languages
    book_name   TEXT NOT NULL,         -- '창세기', 'Genesis', '創世記'
    abbrev      TEXT,                  -- '창', 'Gen', '創'
    PRIMARY KEY (book_id, lang_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (lang_id) REFERENCES languages(lang_id)
);

-- 초기 데이터 예시
INSERT INTO book_names VALUES (1, 'ko', '창세기', '창');
INSERT INTO book_names VALUES (1, 'en', 'Genesis', 'Gen');
INSERT INTO book_names VALUES (1, 'ja', '創世記', '創');
INSERT INTO book_names VALUES (43, 'ko', '요한복음', '요');
INSERT INTO book_names VALUES (43, 'en', 'John', 'Jhn');
INSERT INTO book_names VALUES (43, 'ja', 'ヨハネによる福音書', 'ヨハネ');
```

### verses 테이블

```sql
CREATE TABLE verses (
    verse_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    bible_id    TEXT NOT NULL,         -- FK → bibles
    book_id     INTEGER NOT NULL,      -- FK → books
    chapter     INTEGER NOT NULL,      -- 장 번호
    verse_num   INTEGER NOT NULL,      -- 절 번호
    text        TEXT NOT NULL,         -- 성경 본문
    FOREIGN KEY (bible_id) REFERENCES bibles(bible_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id)
);

-- 복합 인덱스 (빠른 조회)
CREATE INDEX idx_verses_lookup ON verses(bible_id, book_id, chapter);
CREATE INDEX idx_verses_bible_book ON verses(bible_id, book_id);

-- 전문검색(FTS) 인덱스
CREATE VIRTUAL TABLE verses_fts USING fts5(
    text,
    content='verses',
    content_rowid='verse_id'
);

-- FTS 트리거 (자동 동기화)
CREATE TRIGGER verses_ai AFTER INSERT ON verses BEGIN
    INSERT INTO verses_fts(rowid, text) VALUES (new.verse_id, new.text);
END;
```

### 예시 데이터 (요한복음 3:16)

```sql
-- verse_id는 자동 생성
INSERT INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES
('KRV', 43, 3, 16, '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라'),
('NIV', 43, 3, 16, 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'),
('JPN', 43, 3, 16, '神はそのひとり子を賜わったほどに、この世を愛して下さった。それは御子を信じる者がひとりも滅びないで、永遠の命を得るためである。');
```

---

## User.db 스키마 (읽기/쓰기)

### memos 테이블

```sql
CREATE TABLE memos (
    memo_id       TEXT PRIMARY KEY,     -- UUID
    verse_id      INTEGER NOT NULL,     -- FK → verses
    bible_id      TEXT NOT NULL,        -- 작성 시점 성경 버전
    book_id       INTEGER NOT NULL,
    chapter       INTEGER NOT NULL,
    verse_num     INTEGER NOT NULL,
    content       TEXT NOT NULL,        -- 암호화된 메모 내용
    is_encrypted  INTEGER DEFAULT 1,    -- 1: 암호화됨
    created_at    TEXT NOT NULL,        -- ISO 8601
    updated_at    TEXT NOT NULL,
    is_deleted    INTEGER DEFAULT 0     -- Soft delete
);

CREATE INDEX idx_memos_verse ON memos(bible_id, book_id, chapter, verse_num);
CREATE INDEX idx_memos_created ON memos(created_at);
CREATE INDEX idx_memos_deleted ON memos(is_deleted);
```

### memo_tags 테이블

```sql
CREATE TABLE memo_tags (
    tag_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_name    TEXT NOT NULL UNIQUE,
    color       TEXT DEFAULT '#3B82F6',  -- Hex color
    created_at  TEXT NOT NULL
);

-- 기본 태그
INSERT INTO memo_tags (tag_name, color, created_at) VALUES
('감사', '#22C55E', datetime('now')),
('기도', '#8B5CF6', datetime('now')),
('묵상', '#3B82F6', datetime('now')),
('암송', '#F59E0B', datetime('now'));
```

### memo_tag_map 테이블

```sql
CREATE TABLE memo_tag_map (
    memo_id     TEXT NOT NULL,
    tag_id      INTEGER NOT NULL,
    PRIMARY KEY (memo_id, tag_id),
    FOREIGN KEY (memo_id) REFERENCES memos(memo_id),
    FOREIGN KEY (tag_id) REFERENCES memo_tags(tag_id)
);
```

### bookmarks 테이블

```sql
CREATE TABLE bookmarks (
    bookmark_id   TEXT PRIMARY KEY,     -- UUID
    bible_id      TEXT NOT NULL,
    book_id       INTEGER NOT NULL,
    chapter       INTEGER NOT NULL,
    verse_num     INTEGER,              -- NULL이면 장 전체 북마크
    title         TEXT,                 -- 선택적 제목
    created_at    TEXT NOT NULL
);

CREATE INDEX idx_bookmarks_verse ON bookmarks(bible_id, book_id, chapter);
```

### highlights 테이블

```sql
CREATE TABLE highlights (
    highlight_id  TEXT PRIMARY KEY,     -- UUID
    verse_id      INTEGER NOT NULL,
    bible_id      TEXT NOT NULL,
    book_id       INTEGER NOT NULL,
    chapter       INTEGER NOT NULL,
    verse_num     INTEGER NOT NULL,
    color         TEXT DEFAULT '#FBBF24', -- 하이라이트 색상
    created_at    TEXT NOT NULL
);

CREATE INDEX idx_highlights_verse ON highlights(bible_id, book_id, chapter);
```

### settings 테이블

```sql
CREATE TABLE settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

-- 기본 설정
INSERT INTO settings VALUES ('theme', 'light', datetime('now'));
INSERT INTO settings VALUES ('font_size', '16', datetime('now'));
INSERT INTO settings VALUES ('default_bible', 'KRV', datetime('now'));
INSERT INTO settings VALUES ('language', 'ko', datetime('now'));
INSERT INTO settings VALUES ('auto_lock_minutes', '5', datetime('now'));
```

---

## 주요 쿼리

### 성경 읽기

```typescript
// 특정 장 전체 조회
const getChapter = `
  SELECT v.verse_id, v.verse_num, v.text,
         (SELECT COUNT(*) FROM memos m 
          WHERE m.verse_id = v.verse_id AND m.is_deleted = 0) as memo_count,
         (SELECT h.color FROM highlights h 
          WHERE h.verse_id = v.verse_id) as highlight_color
  FROM verses v
  WHERE v.bible_id = ? AND v.book_id = ? AND v.chapter = ?
  ORDER BY v.verse_num
`;

// 사용
const verses = await db.getAllAsync(getChapter, [bibleId, bookId, chapter]);
```

### 성경 검색

```typescript
// 전문 검색 (FTS5)
const searchVerses = `
  SELECT v.verse_id, v.bible_id, v.book_id, v.chapter, v.verse_num, v.text,
         bn.book_name
  FROM verses v
  JOIN verses_fts fts ON v.verse_id = fts.rowid
  JOIN book_names bn ON v.book_id = bn.book_id AND bn.lang_id = ?
  WHERE v.bible_id = ? AND verses_fts MATCH ?
  ORDER BY rank
  LIMIT 100
`;

// 사용 (예: 한글 성경에서 "사랑" 검색)
const results = await db.getAllAsync(searchVerses, ['ko', 'KRV', '사랑']);
```

### 메모 CRUD

```typescript
// 메모 생성
const createMemo = `
  INSERT INTO memos (memo_id, verse_id, bible_id, book_id, chapter, verse_num, 
                     content, is_encrypted, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
`;

// 메모 조회 (특정 구절)
const getMemosByVerse = `
  SELECT m.*, GROUP_CONCAT(t.tag_name) as tags
  FROM memos m
  LEFT JOIN memo_tag_map mtm ON m.memo_id = mtm.memo_id
  LEFT JOIN memo_tags t ON mtm.tag_id = t.tag_id
  WHERE m.bible_id = ? AND m.book_id = ? AND m.chapter = ? AND m.verse_num = ?
    AND m.is_deleted = 0
  GROUP BY m.memo_id
  ORDER BY m.created_at DESC
`;

// 메모 수정
const updateMemo = `
  UPDATE memos 
  SET content = ?, updated_at = ?
  WHERE memo_id = ?
`;

// 메모 삭제 (Soft Delete)
const deleteMemo = `
  UPDATE memos SET is_deleted = 1, updated_at = ? WHERE memo_id = ?
`;
```

### 통계/분석

```typescript
// 자주 묵상한 구절 TOP 10
const getTopVerses = `
  SELECT m.book_id, m.chapter, m.verse_num, bn.book_name,
         COUNT(*) as memo_count
  FROM memos m
  JOIN book_names bn ON m.book_id = bn.book_id AND bn.lang_id = ?
  WHERE m.is_deleted = 0
  GROUP BY m.book_id, m.chapter, m.verse_num
  ORDER BY memo_count DESC
  LIMIT 10
`;

// 일별 묵상 통계 (최근 30일)
const getDailyStats = `
  SELECT DATE(created_at) as date, COUNT(*) as count
  FROM memos
  WHERE is_deleted = 0 
    AND created_at >= DATE('now', '-30 days')
  GROUP BY DATE(created_at)
  ORDER BY date DESC
`;

// 월별 묵상 통계
const getMonthlyStats = `
  SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
  FROM memos
  WHERE is_deleted = 0
  GROUP BY strftime('%Y-%m', created_at)
  ORDER BY month DESC
  LIMIT 12
`;

// 특정 구절의 모든 메모 (예: 요한 3:16 관련 모든 메모)
const getMemosByReference = `
  SELECT m.*, bn.book_name
  FROM memos m
  JOIN book_names bn ON m.book_id = bn.book_id AND bn.lang_id = ?
  WHERE m.book_id = ? AND m.chapter = ? AND m.verse_num = ?
    AND m.is_deleted = 0
  ORDER BY m.created_at DESC
`;
```

---

## 데이터베이스 초기화 코드

```typescript
// src/services/database.ts

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

class DatabaseService {
  private bibleDb: SQLite.SQLiteDatabase | null = null;
  private userDb: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    await this.initBibleDb();
    await this.initUserDb();
  }

  private async initBibleDb(): Promise<void> {
    const dbPath = `${FileSystem.documentDirectory}SQLite/bible.db`;
    
    // Assets에서 복사 (최초 1회)
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}SQLite`,
        { intermediates: true }
      );
      
      const asset = Asset.fromModule(require('../../assets/database/bible.db'));
      await asset.downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri!,
        to: dbPath
      });
    }
    
    this.bibleDb = await SQLite.openDatabaseAsync('bible.db');
  }

  private async initUserDb(): Promise<void> {
    this.userDb = await SQLite.openDatabaseAsync('user.db');
    
    // 테이블 생성
    await this.userDb.execAsync(`
      CREATE TABLE IF NOT EXISTS memos (
        memo_id TEXT PRIMARY KEY,
        verse_id INTEGER NOT NULL,
        bible_id TEXT NOT NULL,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse_num INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_encrypted INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS memo_tags (
        tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3B82F6',
        created_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS memo_tag_map (
        memo_id TEXT NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (memo_id, tag_id)
      );
      
      CREATE TABLE IF NOT EXISTS bookmarks (
        bookmark_id TEXT PRIMARY KEY,
        bible_id TEXT NOT NULL,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse_num INTEGER,
        title TEXT,
        created_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS highlights (
        highlight_id TEXT PRIMARY KEY,
        verse_id INTEGER NOT NULL,
        bible_id TEXT NOT NULL,
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse_num INTEGER NOT NULL,
        color TEXT DEFAULT '#FBBF24',
        created_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_memos_verse 
        ON memos(bible_id, book_id, chapter, verse_num);
      CREATE INDEX IF NOT EXISTS idx_memos_created 
        ON memos(created_at);
    `);
  }

  getBibleDb(): SQLite.SQLiteDatabase {
    if (!this.bibleDb) throw new Error('Bible DB not initialized');
    return this.bibleDb;
  }

  getUserDb(): SQLite.SQLiteDatabase {
    if (!this.userDb) throw new Error('User DB not initialized');
    return this.userDb;
  }
}

export const databaseService = new DatabaseService();
```

---

## 타입 정의

```typescript
// src/types/database.ts

export interface Language {
  lang_id: string;
  lang_name: string;
  is_active: number;
}

export interface Bible {
  bible_id: string;
  lang_id: string;
  version_name: string;
  version_abbr: string;
  copyright: string | null;
}

export interface Book {
  book_id: number;
  book_code: string;
  testament: 'OT' | 'NT';
  total_chapters: number;
}

export interface BookName {
  book_id: number;
  lang_id: string;
  book_name: string;
  abbrev: string | null;
}

export interface Verse {
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  text: string;
}

export interface VerseWithMeta extends Verse {
  memo_count: number;
  highlight_color: string | null;
  book_name?: string;
}

export interface Memo {
  memo_id: string;
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  content: string;
  is_encrypted: number;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  tags?: string;
}

export interface MemoTag {
  tag_id: number;
  tag_name: string;
  color: string;
  created_at: string;
}

export interface Bookmark {
  bookmark_id: string;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number | null;
  title: string | null;
  created_at: string;
}

export interface Highlight {
  highlight_id: string;
  verse_id: number;
  bible_id: string;
  book_id: number;
  chapter: number;
  verse_num: number;
  color: string;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// 통계 타입
export interface TopVerse {
  book_id: number;
  chapter: number;
  verse_num: number;
  book_name: string;
  memo_count: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface MonthlyStat {
  month: string;
  count: number;
}
```
