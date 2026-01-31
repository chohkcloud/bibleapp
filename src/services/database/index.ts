// src/services/database/index.ts
// DatabaseService 클래스 - SQLite 데이터베이스 관리

import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

// 성경 구절 타입 정의
type BibleVerse = {
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
};

// 웹 플랫폼 여부
const isWeb = Platform.OS === 'web';

// 개발 모드에서 DB 재생성
// 데이터 변경 후 이 값을 true로 설정하고 앱 데이터 삭제 후 실행, 그 후 false로 변경
const FORCE_DB_RECREATE = false;

class DatabaseService {
  private bibleDb: SQLiteDatabase | null = null;
  private userDb: SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (isWeb) {
      console.log('[DatabaseService] 웹 환경 - 목업 모드');
      this.isInitialized = true;
      return;
    }

    try {
      await this.initBibleDb();
      await this.initUserDb();
      this.isInitialized = true;
      console.log('[DatabaseService] 초기화 완료');
    } catch (error) {
      console.error('[DatabaseService] 초기화 실패:', error);
      throw error;
    }
  }

  private async initBibleDb(): Promise<void> {
    if (isWeb) return;
    const SQLite = require('expo-sqlite');
    const FileSystem = require('expo-file-system/legacy');
    const { documentDirectory } = FileSystem;
    const getInfoAsync = FileSystem.getInfoAsync;
    const makeDirectoryAsync = FileSystem.makeDirectoryAsync;
    const deleteAsync = FileSystem.deleteAsync;
    const dbDir = `${documentDirectory}SQLite`;
    const dbPath = `${dbDir}/bible.db`;
    const dirInfo = await getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(dbDir, { intermediates: true });
    }

    // 개발 모드에서 DB 강제 재생성
    if (FORCE_DB_RECREATE) {
      const fileInfo = await getInfoAsync(dbPath);
      if (fileInfo.exists) {
        try {
          // 기존 DB가 열려있으면 먼저 닫기
          const tempDb = await SQLite.openDatabaseAsync('bible.db');
          await tempDb.closeAsync();
        } catch (e) {
          // 무시
        }
        await deleteAsync(dbPath, { idempotent: true });
        console.log('[DatabaseService] 기존 bible.db 삭제됨 (개발 모드)');
      }
    }

    const fileInfo = await getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      this.bibleDb = await SQLite.openDatabaseAsync('bible.db');
      await this.createBibleSchema();
      await this.insertAllBibleData();
    } else {
      this.bibleDb = await SQLite.openDatabaseAsync('bible.db');
    }
  }

  private async createBibleSchema(): Promise<void> {
    if (!this.bibleDb) return;
    await this.bibleDb.execAsync(`
      CREATE TABLE IF NOT EXISTS languages (lang_id TEXT PRIMARY KEY, lang_name TEXT NOT NULL, is_active INTEGER DEFAULT 1);
      CREATE TABLE IF NOT EXISTS bibles (bible_id TEXT PRIMARY KEY, lang_id TEXT NOT NULL, version_name TEXT NOT NULL, version_abbr TEXT NOT NULL, copyright TEXT);
      CREATE TABLE IF NOT EXISTS books (book_id INTEGER PRIMARY KEY, book_code TEXT NOT NULL UNIQUE, testament TEXT NOT NULL, total_chapters INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS book_names (book_id INTEGER NOT NULL, lang_id TEXT NOT NULL, book_name TEXT NOT NULL, abbrev TEXT, PRIMARY KEY (book_id, lang_id));
      CREATE TABLE IF NOT EXISTS verses (verse_id INTEGER PRIMARY KEY AUTOINCREMENT, bible_id TEXT NOT NULL, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse_num INTEGER NOT NULL, text TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_verses_lookup ON verses(bible_id, book_id, chapter);
    `);
  }

  private async insertAllBibleData(): Promise<void> {
    if (!this.bibleDb) return;

    // 기본 언어 및 버전
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO languages VALUES ('ko', '한국어', 1);
      INSERT OR IGNORE INTO bibles VALUES ('KRV', 'ko', '개역한글', '개역', '대한성서공회');
    `);

    // 구약 39권
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO books VALUES (1, 'GEN', 'OT', 50);
      INSERT OR IGNORE INTO books VALUES (2, 'EXO', 'OT', 40);
      INSERT OR IGNORE INTO books VALUES (3, 'LEV', 'OT', 27);
      INSERT OR IGNORE INTO books VALUES (4, 'NUM', 'OT', 36);
      INSERT OR IGNORE INTO books VALUES (5, 'DEU', 'OT', 34);
      INSERT OR IGNORE INTO books VALUES (6, 'JOS', 'OT', 24);
      INSERT OR IGNORE INTO books VALUES (7, 'JDG', 'OT', 21);
      INSERT OR IGNORE INTO books VALUES (8, 'RUT', 'OT', 4);
      INSERT OR IGNORE INTO books VALUES (9, '1SA', 'OT', 31);
      INSERT OR IGNORE INTO books VALUES (10, '2SA', 'OT', 24);
      INSERT OR IGNORE INTO books VALUES (11, '1KI', 'OT', 22);
      INSERT OR IGNORE INTO books VALUES (12, '2KI', 'OT', 25);
      INSERT OR IGNORE INTO books VALUES (13, '1CH', 'OT', 29);
      INSERT OR IGNORE INTO books VALUES (14, '2CH', 'OT', 36);
      INSERT OR IGNORE INTO books VALUES (15, 'EZR', 'OT', 10);
      INSERT OR IGNORE INTO books VALUES (16, 'NEH', 'OT', 13);
      INSERT OR IGNORE INTO books VALUES (17, 'EST', 'OT', 10);
      INSERT OR IGNORE INTO books VALUES (18, 'JOB', 'OT', 42);
      INSERT OR IGNORE INTO books VALUES (19, 'PSA', 'OT', 150);
      INSERT OR IGNORE INTO books VALUES (20, 'PRO', 'OT', 31);
    `);
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO books VALUES (21, 'ECC', 'OT', 12);
      INSERT OR IGNORE INTO books VALUES (22, 'SNG', 'OT', 8);
      INSERT OR IGNORE INTO books VALUES (23, 'ISA', 'OT', 66);
      INSERT OR IGNORE INTO books VALUES (24, 'JER', 'OT', 52);
      INSERT OR IGNORE INTO books VALUES (25, 'LAM', 'OT', 5);
      INSERT OR IGNORE INTO books VALUES (26, 'EZK', 'OT', 48);
      INSERT OR IGNORE INTO books VALUES (27, 'DAN', 'OT', 12);
      INSERT OR IGNORE INTO books VALUES (28, 'HOS', 'OT', 14);
      INSERT OR IGNORE INTO books VALUES (29, 'JOL', 'OT', 3);
      INSERT OR IGNORE INTO books VALUES (30, 'AMO', 'OT', 9);
      INSERT OR IGNORE INTO books VALUES (31, 'OBA', 'OT', 1);
      INSERT OR IGNORE INTO books VALUES (32, 'JON', 'OT', 4);
      INSERT OR IGNORE INTO books VALUES (33, 'MIC', 'OT', 7);
      INSERT OR IGNORE INTO books VALUES (34, 'NAM', 'OT', 3);
      INSERT OR IGNORE INTO books VALUES (35, 'HAB', 'OT', 3);
      INSERT OR IGNORE INTO books VALUES (36, 'ZEP', 'OT', 3);
      INSERT OR IGNORE INTO books VALUES (37, 'HAG', 'OT', 2);
      INSERT OR IGNORE INTO books VALUES (38, 'ZEC', 'OT', 14);
      INSERT OR IGNORE INTO books VALUES (39, 'MAL', 'OT', 4);
    `);

    // 신약 27권
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO books VALUES (40, 'MAT', 'NT', 28);
      INSERT OR IGNORE INTO books VALUES (41, 'MRK', 'NT', 16);
      INSERT OR IGNORE INTO books VALUES (42, 'LUK', 'NT', 24);
      INSERT OR IGNORE INTO books VALUES (43, 'JHN', 'NT', 21);
      INSERT OR IGNORE INTO books VALUES (44, 'ACT', 'NT', 28);
      INSERT OR IGNORE INTO books VALUES (45, 'ROM', 'NT', 16);
      INSERT OR IGNORE INTO books VALUES (46, '1CO', 'NT', 16);
      INSERT OR IGNORE INTO books VALUES (47, '2CO', 'NT', 13);
      INSERT OR IGNORE INTO books VALUES (48, 'GAL', 'NT', 6);
      INSERT OR IGNORE INTO books VALUES (49, 'EPH', 'NT', 6);
      INSERT OR IGNORE INTO books VALUES (50, 'PHP', 'NT', 4);
      INSERT OR IGNORE INTO books VALUES (51, 'COL', 'NT', 4);
      INSERT OR IGNORE INTO books VALUES (52, '1TH', 'NT', 5);
      INSERT OR IGNORE INTO books VALUES (53, '2TH', 'NT', 3);
      INSERT OR IGNORE INTO books VALUES (54, '1TI', 'NT', 6);
      INSERT OR IGNORE INTO books VALUES (55, '2TI', 'NT', 4);
      INSERT OR IGNORE INTO books VALUES (56, 'TIT', 'NT', 3);
      INSERT OR IGNORE INTO books VALUES (57, 'PHM', 'NT', 1);
      INSERT OR IGNORE INTO books VALUES (58, 'HEB', 'NT', 13);
      INSERT OR IGNORE INTO books VALUES (59, 'JAS', 'NT', 5);
      INSERT OR IGNORE INTO books VALUES (60, '1PE', 'NT', 5);
      INSERT OR IGNORE INTO books VALUES (61, '2PE', 'NT', 3);
      INSERT OR IGNORE INTO books VALUES (62, '1JN', 'NT', 5);
      INSERT OR IGNORE INTO books VALUES (63, '2JN', 'NT', 1);
      INSERT OR IGNORE INTO books VALUES (64, '3JN', 'NT', 1);
      INSERT OR IGNORE INTO books VALUES (65, 'JUD', 'NT', 1);
      INSERT OR IGNORE INTO books VALUES (66, 'REV', 'NT', 22);
    `);

    // 구약 책 이름 (한글)
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO book_names VALUES (1, 'ko', '창세기', '창');
      INSERT OR IGNORE INTO book_names VALUES (2, 'ko', '출애굽기', '출');
      INSERT OR IGNORE INTO book_names VALUES (3, 'ko', '레위기', '레');
      INSERT OR IGNORE INTO book_names VALUES (4, 'ko', '민수기', '민');
      INSERT OR IGNORE INTO book_names VALUES (5, 'ko', '신명기', '신');
      INSERT OR IGNORE INTO book_names VALUES (6, 'ko', '여호수아', '수');
      INSERT OR IGNORE INTO book_names VALUES (7, 'ko', '사사기', '삿');
      INSERT OR IGNORE INTO book_names VALUES (8, 'ko', '룻기', '룻');
      INSERT OR IGNORE INTO book_names VALUES (9, 'ko', '사무엘상', '삼상');
      INSERT OR IGNORE INTO book_names VALUES (10, 'ko', '사무엘하', '삼하');
      INSERT OR IGNORE INTO book_names VALUES (11, 'ko', '열왕기상', '왕상');
      INSERT OR IGNORE INTO book_names VALUES (12, 'ko', '열왕기하', '왕하');
      INSERT OR IGNORE INTO book_names VALUES (13, 'ko', '역대상', '대상');
      INSERT OR IGNORE INTO book_names VALUES (14, 'ko', '역대하', '대하');
      INSERT OR IGNORE INTO book_names VALUES (15, 'ko', '에스라', '스');
      INSERT OR IGNORE INTO book_names VALUES (16, 'ko', '느헤미야', '느');
      INSERT OR IGNORE INTO book_names VALUES (17, 'ko', '에스더', '에');
      INSERT OR IGNORE INTO book_names VALUES (18, 'ko', '욥기', '욥');
      INSERT OR IGNORE INTO book_names VALUES (19, 'ko', '시편', '시');
      INSERT OR IGNORE INTO book_names VALUES (20, 'ko', '잠언', '잠');
    `);
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO book_names VALUES (21, 'ko', '전도서', '전');
      INSERT OR IGNORE INTO book_names VALUES (22, 'ko', '아가', '아');
      INSERT OR IGNORE INTO book_names VALUES (23, 'ko', '이사야', '사');
      INSERT OR IGNORE INTO book_names VALUES (24, 'ko', '예레미야', '렘');
      INSERT OR IGNORE INTO book_names VALUES (25, 'ko', '예레미야애가', '애');
      INSERT OR IGNORE INTO book_names VALUES (26, 'ko', '에스겔', '겔');
      INSERT OR IGNORE INTO book_names VALUES (27, 'ko', '다니엘', '단');
      INSERT OR IGNORE INTO book_names VALUES (28, 'ko', '호세아', '호');
      INSERT OR IGNORE INTO book_names VALUES (29, 'ko', '요엘', '욜');
      INSERT OR IGNORE INTO book_names VALUES (30, 'ko', '아모스', '암');
      INSERT OR IGNORE INTO book_names VALUES (31, 'ko', '오바댜', '옵');
      INSERT OR IGNORE INTO book_names VALUES (32, 'ko', '요나', '욘');
      INSERT OR IGNORE INTO book_names VALUES (33, 'ko', '미가', '미');
      INSERT OR IGNORE INTO book_names VALUES (34, 'ko', '나훔', '나');
      INSERT OR IGNORE INTO book_names VALUES (35, 'ko', '하박국', '합');
      INSERT OR IGNORE INTO book_names VALUES (36, 'ko', '스바냐', '습');
      INSERT OR IGNORE INTO book_names VALUES (37, 'ko', '학개', '학');
      INSERT OR IGNORE INTO book_names VALUES (38, 'ko', '스가랴', '슥');
      INSERT OR IGNORE INTO book_names VALUES (39, 'ko', '말라기', '말');
    `);

    // 신약 책 이름 (한글)
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO book_names VALUES (40, 'ko', '마태복음', '마');
      INSERT OR IGNORE INTO book_names VALUES (41, 'ko', '마가복음', '막');
      INSERT OR IGNORE INTO book_names VALUES (42, 'ko', '누가복음', '눅');
      INSERT OR IGNORE INTO book_names VALUES (43, 'ko', '요한복음', '요');
      INSERT OR IGNORE INTO book_names VALUES (44, 'ko', '사도행전', '행');
      INSERT OR IGNORE INTO book_names VALUES (45, 'ko', '로마서', '롬');
      INSERT OR IGNORE INTO book_names VALUES (46, 'ko', '고린도전서', '고전');
      INSERT OR IGNORE INTO book_names VALUES (47, 'ko', '고린도후서', '고후');
      INSERT OR IGNORE INTO book_names VALUES (48, 'ko', '갈라디아서', '갈');
      INSERT OR IGNORE INTO book_names VALUES (49, 'ko', '에베소서', '엡');
      INSERT OR IGNORE INTO book_names VALUES (50, 'ko', '빌립보서', '빌');
      INSERT OR IGNORE INTO book_names VALUES (51, 'ko', '골로새서', '골');
      INSERT OR IGNORE INTO book_names VALUES (52, 'ko', '데살로니가전서', '살전');
      INSERT OR IGNORE INTO book_names VALUES (53, 'ko', '데살로니가후서', '살후');
      INSERT OR IGNORE INTO book_names VALUES (54, 'ko', '디모데전서', '딤전');
      INSERT OR IGNORE INTO book_names VALUES (55, 'ko', '디모데후서', '딤후');
      INSERT OR IGNORE INTO book_names VALUES (56, 'ko', '디도서', '딛');
      INSERT OR IGNORE INTO book_names VALUES (57, 'ko', '빌레몬서', '몬');
      INSERT OR IGNORE INTO book_names VALUES (58, 'ko', '히브리서', '히');
      INSERT OR IGNORE INTO book_names VALUES (59, 'ko', '야고보서', '약');
      INSERT OR IGNORE INTO book_names VALUES (60, 'ko', '베드로전서', '벧전');
      INSERT OR IGNORE INTO book_names VALUES (61, 'ko', '베드로후서', '벧후');
      INSERT OR IGNORE INTO book_names VALUES (62, 'ko', '요한일서', '요일');
      INSERT OR IGNORE INTO book_names VALUES (63, 'ko', '요한이서', '요이');
      INSERT OR IGNORE INTO book_names VALUES (64, 'ko', '요한삼서', '요삼');
      INSERT OR IGNORE INTO book_names VALUES (65, 'ko', '유다서', '유');
      INSERT OR IGNORE INTO book_names VALUES (66, 'ko', '요한계시록', '계');
    `);

    // 구절 삽입
    await this.insertVerses();
  }

  private async insertChapter1Verses(): Promise<void> {
    if (!this.bibleDb) return;

    // 구약 1장 1절
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 2, 1, 1, '야곱의 아들들의 이름은 이러하니 각각 그의 가족과 함께 야곱을 따라 애굽에 이른 자는');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 3, 1, 1, '여호와께서 회막에서 모세를 부르시고 그에게 말씀하여 이르시되');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 4, 1, 1, '이스라엘 자손이 애굽 땅에서 나온 후 둘째 해 둘째 달 첫째 날에 여호와께서 시내 광야 회막에서 모세에게 말씀하여 이르시되');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 5, 1, 1, '이것은 모세가 요단 저쪽 광야 곧 수프 맞은편 바란과 도벨과 라반과 하세롯과 디사합 사이의 아라바에서 이스라엘 무리에게 선포한 말씀이니라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 6, 1, 1, '여호와의 종 모세가 죽은 후에 여호와께서 모세의 수종자 눈의 아들 여호수아에게 말씀하여 이르시되');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 7, 1, 1, '여호수아가 죽은 후에 이스라엘 자손이 여호와께 여쭈어 이르되 우리 가운데 누가 먼저 올라가서 가나안 족속과 싸우리이까');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 8, 1, 1, '사사들이 치리하던 때에 그 땅에 흉년이 드니라 유다 베들레헴에 한 사람이 그의 아내와 두 아들을 데리고 모압 지방에 가서 거류하였는데');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 9, 1, 1, '에브라임 산지 라마다임소빔에 에브라임 사람 엘가나라 하는 자가 있으니 그는 여로함의 아들이요');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 10, 1, 1, '사울이 죽은 후에 다윗이 아말렉 사람들을 쳐서 이기고 다윗이 시글락으로 돌아와 사흘을 거기 있더니');
    `);
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 11, 1, 1, '다윗 왕이 나이가 많아 늙으니 이불을 덮어도 따뜻하지 아니한지라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 12, 1, 1, '아합이 죽은 후에 모압이 이스라엘을 배반하니라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 13, 1, 1, '아담이 셋을 낳고 셋은 에노스를 낳고');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 14, 1, 1, '다윗의 아들 솔로몬이 그의 왕위가 견고하니 그의 하나님 여호와께서 함께 하사 그를 심히 존대하게 하셨더라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 15, 1, 1, '바사 왕 고레스 원년에 여호와께서 예레미야의 입으로 하신 말씀을 이루시려고 바사 왕 고레스의 마음을 감동시키시매');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 16, 1, 1, '하가랴의 아들 느헤미야의 말이라 아닥사스다 왕 이십 년 기슬르월에 내가 수산 궁에 있더니');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 17, 1, 1, '아하수에로 왕 때에 이 아하수에로는 인도로부터 구스까지 백이십칠 지방을 다스리는 왕이라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 18, 1, 1, '우스 땅에 욥이라 불리는 사람이 있었는데 그 사람은 온전하고 정직하여 하나님을 경외하며 악에서 떠난 자더라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 20, 1, 1, '다윗의 아들 이스라엘 왕 솔로몬의 잠언이라');
    `);
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 21, 1, 1, '다윗의 아들 예루살렘 왕 전도자의 말씀이라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 22, 1, 1, '솔로몬의 아가라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 23, 1, 1, '유다 왕 웃시야와 요담과 아하스와 히스기야 시대에 아모스의 아들 이사야가 유다와 예루살렘에 관하여 본 계시라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 24, 1, 1, '베냐민 땅 아나돗의 제사장 중 힐기야의 아들 예레미야의 말이라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 25, 1, 1, '슬프다 이 성이여 전에는 사람들이 많더니 이제는 어찌 그리 적막하게 앉았는고');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 26, 1, 1, '삼십 년 사월 초닷새에 내가 그발 강 가 포로 중에 있더니 하늘이 열리며 하나님의 모습이 내게 보이니라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 27, 1, 1, '유다 왕 여호야김이 다스린 지 삼 년에 바벨론 왕 느부갓네살이 예루살렘에 이르러 그것을 에워쌌더니');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 28, 1, 1, '웃시야와 요담과 아하스와 히스기야 시대에 브에리의 아들 호세아에게 임한 여호와의 말씀이라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 29, 1, 1, '브두엘의 아들 요엘에게 임한 여호와의 말씀이라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 30, 1, 1, '유다 왕 웃시야의 시대 곧 이스라엘 왕 요아스의 아들 여로보암의 시대 지진 전 이 년에 드고아 목자 중 아모스가 이스라엘에 대하여 본 말씀이라');
    `);
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 31, 1, 1, '에돔에 관한 오바댜의 계시라 주 여호와께서 에돔에 대하여 이같이 말씀하시니라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 32, 1, 1, '여호와의 말씀이 아밋대의 아들 요나에게 임하니라 이르시되');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 33, 1, 1, '유다 왕 요담과 아하스와 히스기야 시대에 모레셋 사람 미가에게 임한 여호와의 말씀 곧 그가 사마리아와 예루살렘에 관하여 본 계시라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 34, 1, 1, '니느웨에 관한 경고 곧 엘고스 사람 나훔의 계시를 기록한 책이라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 35, 1, 1, '선지자 하박국이 받은 경고라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 36, 1, 1, '유다 왕 아몬의 아들 요시야 시대에 스바냐에게 임한 여호와의 말씀이라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 37, 1, 1, '다리오 왕 이 년 여섯째 달 곧 그 달 첫째 날에 여호와의 말씀이 선지자 학개를 통하여 스알디엘의 아들 유다 총독 스룹바벨과 여호사닥의 아들 대제사장 여호수아에게 임하니라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 38, 1, 1, '다리오 왕 이 년 팔월에 여호와의 말씀이 잇도의 손자 베레갸의 아들 선지자 스가랴에게 임하니라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 39, 1, 1, '여호와의 말씀이니라 여호와께서 말라기를 통하여 이스라엘에게 말씀하신 경고라');
    `);

    // 신약 1장 1절
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 40, 1, 1, '아브라함과 다윗의 자손 예수 그리스도의 계보라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 41, 1, 1, '하나님의 아들 예수 그리스도의 복음의 시작이라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 42, 1, 1, '우리 중에 이루어진 사실에 대하여 처음부터 목격자와 말씀의 일꾼 된 자들이 전하여 준 그대로 내력을 저술하려고 붓을 든 사람이 많은지라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 44, 1, 1, '데오빌로여 내가 먼저 쓴 글에는 무릇 예수께서 행하시며 가르치시기를 시작하심부터');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 45, 1, 1, '예수 그리스도의 종 바울은 사도로 부르심을 받아 하나님의 복음을 위하여 택정함을 입었으니');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 46, 1, 1, '하나님의 뜻을 따라 그리스도 예수의 사도로 부르심을 받은 바울과 형제 소스데네는');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 47, 1, 1, '하나님의 뜻으로 말미암아 그리스도 예수의 사도 된 바울과 및 형제 디모데는 고린도에 있는 하나님의 교회와 온 아가야에 있는 모든 성도에게');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 48, 1, 1, '사람들에게서 난 것도 아니요 사람으로 말미암은 것도 아니요 오직 예수 그리스도와 그를 죽은 자 가운데서 살리신 하나님 아버지로 말미암아 사도 된 바울과');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 49, 1, 1, '하나님의 뜻으로 말미암아 그리스도 예수의 사도 된 바울은 에베소에 있는 성도들과 그리스도 예수 안에 있는 신실한 자들에게 편지하노니');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 50, 1, 1, '그리스도 예수의 종 바울과 디모데는 그리스도 예수 안에서 빌립보에 사는 모든 성도와 감독들과 집사들에게 편지하노니');
    `);
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 51, 1, 1, '하나님의 뜻으로 말미암아 그리스도 예수의 사도 된 바울과 형제 디모데는');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 52, 1, 1, '바울과 실루아노와 디모데는 하나님 아버지와 주 예수 그리스도 안에 있는 데살로니가인의 교회에 편지하노니 은혜와 평강이 너희에게 있을지어다');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 53, 1, 1, '바울과 실루아노와 디모데는 하나님 우리 아버지와 주 예수 그리스도 안에 있는 데살로니가인의 교회에 편지하노니');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 54, 1, 1, '우리 구주 하나님과 우리 소망이신 그리스도 예수의 명령을 따라 그리스도 예수의 사도 된 바울은');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 55, 1, 1, '하나님의 뜻으로 말미암아 그리스도 예수 안에 있는 생명의 약속대로 그리스도 예수의 사도 된 바울은');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 56, 1, 1, '하나님의 종이요 예수 그리스도의 사도인 바울 곧 나는 하나님이 택하신 자들의 믿음과 경건함에 속한 진리의 지식과');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 57, 1, 1, '그리스도 예수를 인하여 갇힌 자 된 바울과 형제 디모데는 우리의 사랑을 받는 자요 동역자인 빌레몬과');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 58, 1, 1, '옛적에 선지자들을 통하여 여러 부분과 여러 모양으로 우리 조상들에게 말씀하신 하나님이');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 59, 1, 1, '하나님과 주 예수 그리스도의 종 야고보는 흩어져 있는 열두 지파에게 문안하노라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 60, 1, 1, '예수 그리스도의 사도 베드로는 본도, 갈라디아, 갑바도기아, 아시아와 비두니아에 흩어진 나그네 곧');
    `);
    await this.bibleDb.execAsync(`
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 61, 1, 1, '예수 그리스도의 종이며 사도인 시몬 베드로는 우리 하나님과 구주 예수 그리스도의 의를 힘입어 동일하게 보배로운 믿음을 받은 자들에게 편지하노니');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 62, 1, 1, '태초부터 있는 생명의 말씀에 관하여는 우리가 들은 바요 눈으로 본 바요 자세히 보고 우리의 손으로 만진 바라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 63, 1, 1, '장로인 나는 택하심을 받은 부녀와 그의 자녀들에게 편지하노니 내가 참으로 사랑하는 자요');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 64, 1, 1, '장로인 나는 사랑하는 가이오에게 편지하노니 참으로 네 영혼이 잘됨 같이 네가 범사에 잘되고 강건하기를 바라노라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 65, 1, 1, '예수 그리스도의 종이요 야고보의 형제인 유다는 부르심을 받은 자 곧 하나님 아버지 안에서 사랑을 얻고 예수 그리스도를 위하여 지키심을 받은 자들에게 편지하노라');
      INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ('KRV', 66, 1, 1, '예수 그리스도의 계시라 이는 하나님이 그에게 주사 반드시 속히 일어날 일들을 그 종들에게 보이시려고 그의 천사를 그 종 요한에게 보내어 알게 하신 것이라');
    `);
  }

  private async insertVerses(): Promise<void> {
    if (!this.bibleDb) return;

    // 모든 책의 1장 1절 추가 (책 선택 시 기본 표시용)
    await this.insertChapter1Verses();

    // 외부 데이터 파일에서 구절 로드
    await this.insertVersesFromData();
  }

  // JSON 파일에서 전체 성경 구절 삽입 (31,102절)
  // 동적 import로 메모리 효율성 개선
  private async insertVersesFromData(): Promise<void> {
    if (!this.bibleDb) return;

    console.log('[DatabaseService] 성경 데이터 동적 로드 시작...');

    // 동적 import로 필요할 때만 데이터 로드
    const [otPart1Module, otPart2Module, ntModule] = await Promise.all([
      import('../../data/bible/ot_part1.json'),
      import('../../data/bible/ot_part2.json'),
      import('../../data/bible/nt.json'),
    ]);

    const otPart1 = otPart1Module.default as BibleVerse[];
    const otPart2 = otPart2Module.default as BibleVerse[];
    const ntData = ntModule.default as BibleVerse[];

    // 파트별로 순차 처리 (메모리 효율성)
    await this.insertVerseBatch(otPart1, '구약 1부');
    await this.insertVerseBatch(otPart2, '구약 2부');
    await this.insertVerseBatch(ntData, '신약');

    console.log('[DatabaseService] 전체 성경 데이터 삽입 완료');
  }

  // 배치 단위로 구절 삽입
  private async insertVerseBatch(verses: BibleVerse[], label: string): Promise<void> {
    if (!this.bibleDb || !verses || verses.length === 0) return;

    console.log(`[DatabaseService] ${label} ${verses.length}절 삽입 시작...`);
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);
      const values = batch.map(v =>
        `('KRV', ${v.bookId}, ${v.chapter}, ${v.verse}, '${v.text.replace(/'/g, "''")}')`
      ).join(',');

      await this.bibleDb.execAsync(`
        INSERT OR IGNORE INTO verses (bible_id, book_id, chapter, verse_num, text) VALUES ${values};
      `);
      inserted += batch.length;
    }
    console.log(`[DatabaseService] ${label} ${inserted}절 삽입 완료`);
  }

  private async initUserDb(): Promise<void> {
    if (isWeb) return;
    const SQLite = require('expo-sqlite');
    const FileSystem = require('expo-file-system/legacy');
    const { documentDirectory } = FileSystem;
    const getInfoAsync = FileSystem.getInfoAsync;
    const deleteAsync = FileSystem.deleteAsync;
    const dbDir = `${documentDirectory}SQLite`;
    const dbPath = `${dbDir}/user.db`;

    // 개발 모드에서 user.db도 강제 재생성
    if (FORCE_DB_RECREATE) {
      const fileInfo = await getInfoAsync(dbPath);
      if (fileInfo.exists) {
        try {
          const tempDb = await SQLite.openDatabaseAsync('user.db');
          await tempDb.closeAsync();
        } catch (e) {
          // 무시
        }
        await deleteAsync(dbPath, { idempotent: true });
        console.log('[DatabaseService] 기존 user.db 삭제됨 (개발 모드)');
      }
    }

    this.userDb = await SQLite.openDatabaseAsync('user.db');
    await this.userDb.execAsync(`
      CREATE TABLE IF NOT EXISTS memos (memo_id TEXT PRIMARY KEY, verse_id INTEGER, bible_id TEXT, book_id INTEGER, chapter INTEGER, verse_num INTEGER, content TEXT, tags TEXT, is_encrypted INTEGER DEFAULT 1, created_at TEXT, updated_at TEXT, is_deleted INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS memo_tags (tag_id INTEGER PRIMARY KEY AUTOINCREMENT, tag_name TEXT UNIQUE, color TEXT DEFAULT '#3B82F6', created_at TEXT);
      CREATE TABLE IF NOT EXISTS memo_tag_map (memo_id TEXT NOT NULL, tag_id INTEGER NOT NULL, PRIMARY KEY (memo_id, tag_id));
      CREATE TABLE IF NOT EXISTS bookmarks (bookmark_id TEXT PRIMARY KEY, verse_id INTEGER, bible_id TEXT, book_id INTEGER, chapter INTEGER, verse_num INTEGER, title TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS highlights (highlight_id TEXT PRIMARY KEY, verse_id INTEGER NOT NULL, bible_id TEXT, book_id INTEGER, chapter INTEGER, verse_num INTEGER, color TEXT DEFAULT '#FBBF24', created_at TEXT);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT);
      CREATE TABLE IF NOT EXISTS downloaded_versions (bible_id TEXT PRIMARY KEY, downloaded_at TEXT NOT NULL, file_size INTEGER, verse_count INTEGER, is_bundled INTEGER DEFAULT 0, last_used_at TEXT);
      CREATE INDEX IF NOT EXISTS idx_memos_verse ON memos(book_id, chapter, verse_num);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_verse ON bookmarks(book_id, chapter, verse_num);
      CREATE INDEX IF NOT EXISTS idx_highlights_chapter ON highlights(bible_id, book_id, chapter);
    `);

    // 마이그레이션: memos 테이블에 누락된 컬럼 추가
    const udb = this.userDb!;
    const memoColumns = await udb.getAllAsync<{ name: string }>(
      "PRAGMA table_info(memos)"
    );
    const columnNames = memoColumns.map((c) => c.name);
    if (!columnNames.includes('verse_start')) {
      await udb.execAsync('ALTER TABLE memos ADD COLUMN verse_start INTEGER;');
    }
    if (!columnNames.includes('verse_end')) {
      await udb.execAsync('ALTER TABLE memos ADD COLUMN verse_end INTEGER;');
    }
    if (!columnNames.includes('verse_range')) {
      await udb.execAsync('ALTER TABLE memos ADD COLUMN verse_range TEXT;');
    }
    if (!columnNames.includes('emotion_data')) {
      await udb.execAsync('ALTER TABLE memos ADD COLUMN emotion_data TEXT;');
    }
    if (!columnNames.includes('feedback_data')) {
      await udb.execAsync('ALTER TABLE memos ADD COLUMN feedback_data TEXT;');
    }
    if (!columnNames.includes('bible_text')) {
      await udb.execAsync('ALTER TABLE memos ADD COLUMN bible_text TEXT;');
    }

    // AI 분석 히스토리 테이블
    await udb.execAsync(`
      CREATE TABLE IF NOT EXISTS ai_analysis_history (
        history_id TEXT PRIMARY KEY,
        memo_id TEXT NOT NULL,
        analysis_type TEXT NOT NULL,
        result_data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (memo_id) REFERENCES memos(memo_id)
      );
      CREATE INDEX IF NOT EXISTS idx_ai_history_memo ON ai_analysis_history(memo_id, analysis_type);
    `);

    // 번들 버전(KRV) 기록
    await this.registerBundledVersion();
  }

  // 번들 버전 등록
  private async registerBundledVersion(): Promise<void> {
    if (!this.userDb) return;
    const now = new Date().toISOString();
    await this.userDb.execAsync(`
      INSERT OR IGNORE INTO downloaded_versions (bible_id, downloaded_at, file_size, verse_count, is_bundled, last_used_at)
      VALUES ('KRV', '${now}', 5800000, 31102, 1, '${now}');
    `);
  }

  getBibleDb(): SQLiteDatabase | null {
    if (isWeb) return null;
    return this.bibleDb;
  }

  getUserDb(): SQLiteDatabase | null {
    if (isWeb) return null;
    return this.userDb;
  }

  // null이 아닌 DB 반환 (웹이 아닌 환경에서 사용)
  requireBibleDb(): SQLiteDatabase {
    if (!this.bibleDb) {
      throw new Error('Bible database not initialized');
    }
    return this.bibleDb;
  }

  requireUserDb(): SQLiteDatabase {
    if (!this.userDb) {
      throw new Error('User database not initialized');
    }
    return this.userDb;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  isWebPlatform(): boolean {
    return isWeb;
  }

  async close(): Promise<void> {
    if (isWeb) return;
    if (this.bibleDb) { await this.bibleDb.closeAsync(); this.bibleDb = null; }
    if (this.userDb) { await this.userDb.closeAsync(); this.userDb = null; }
    this.isInitialized = false;
  }
}

export const databaseService = new DatabaseService();
