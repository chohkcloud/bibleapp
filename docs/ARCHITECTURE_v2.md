# Bible App Architecture v2.0

## 신규 기능 요구사항

### 1. 비교 성경 (Parallel Bible View)
- 성경 본문에서 비교 아이콘 클릭 시 다국어 성경 동시 표시
- 지원 조합: 한/영, 한/일, 일/영, 한/히(Strong's), 한/헬(Strong's)
- Strong's 번호가 있는 경우 원어 사전 연동

### 2. 통합 검색 (Unified Search)
- 검색 시 성경 구절 + 성경 사전 동시 검색
- 탭 또는 섹션으로 결과 구분
- Strong's 번호로 원어 검색 지원

### 3. 단어별 선택 (Word-level Selection)
- 절 전체가 아닌 개별 단어 선택 가능
- 선택한 단어로 사전 검색, Strong's 조회
- 터치/클릭으로 단어 하이라이트

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  Screens                                                         │
│  ├── ReadingScreen (확장)                                        │
│  │   ├── ParallelBibleModal     ← 비교 성경 모달                 │
│  │   └── WordSelectionOverlay   ← 단어 선택 오버레이             │
│  ├── SearchScreen (확장)                                         │
│  │   ├── VerseResults           ← 성경 검색 결과                 │
│  │   └── DictionaryResults      ← 사전 검색 결과                 │
│  └── DictionaryScreen (신규)                                     │
│      ├── StrongSearch           ← Strong's 검색                  │
│      └── BibleDicSearch         ← 성경 사전 검색                 │
│                                                                  │
│  Components                                                      │
│  ├── bible/                                                      │
│  │   ├── VerseText.tsx          ← 단어별 터치 가능한 절 렌더링   │
│  │   ├── ParallelVerseRow.tsx   ← 비교 성경 행                   │
│  │   └── StrongWordLink.tsx     ← Strong 번호 연결 단어          │
│  └── dictionary/                                                 │
│      ├── DictionaryCard.tsx     ← 사전 항목 카드                 │
│      ├── StrongEntry.tsx        ← Strong's 사전 항목             │
│      └── WordPopover.tsx        ← 단어 선택 시 팝오버            │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         STATE LAYER (Zustand)                    │
├─────────────────────────────────────────────────────────────────┤
│  bibleStore.ts (확장)                                            │
│  ├── parallelVersions: string[]      // 비교 성경 버전 목록      │
│  ├── showParallel: boolean           // 비교 모드 활성화         │
│  └── selectedWord: SelectedWord      // 선택된 단어 정보         │
│                                                                  │
│  searchStore.ts (확장)                                           │
│  ├── verseResults: SearchResult[]    // 성경 검색 결과           │
│  ├── dictResults: DictResult[]       // 사전 검색 결과           │
│  └── activeTab: 'verses' | 'dict'    // 활성 탭                  │
│                                                                  │
│  dictionaryStore.ts (신규)                                       │
│  ├── currentEntry: DictEntry         // 현재 조회 중인 항목      │
│  ├── strongEntry: StrongEntry        // Strong's 항목            │
│  ├── recentWords: string[]           // 최근 검색어              │
│  └── favorites: string[]             // 즐겨찾기 단어            │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  bundledBibleService.ts (확장)                                   │
│  ├── getParallelVerses(book, ch, verse, versions[])             │
│  │   → { version: string, text: string }[]                      │
│  └── getStrongVerse(book, ch, verse)                            │
│      → { words: { text, strongH?, strongG? }[] }                │
│                                                                  │
│  dictionaryService.ts (신규)                                     │
│  ├── searchBibleDictionary(term)                                │
│  │   → DictEntry[]                                              │
│  ├── getStrongHebrew(number)                                    │
│  │   → StrongEntry                                              │
│  ├── getStrongGreek(number)                                     │
│  │   → StrongEntry                                              │
│  ├── searchStrong(term, lang: 'H' | 'G')                        │
│  │   → StrongEntry[]                                            │
│  └── getWordStrong(word, bookId)                                │
│      → { strongNum, original, transliteration, meaning }        │
│                                                                  │
│  searchService.ts (확장)                                         │
│  └── unifiedSearch(query)                                       │
│      → { verses: SearchResult[], dictionary: DictResult[] }     │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  src/data/versions/bundled/                                      │
│  ├── hcv.json          # 개역한글 (기존)                         │
│  ├── kjv.json          # KJV 영어 (기존)                         │
│  ├── jpm.json          # 일본어 (기존)                           │
│  ├── hstrong.json      # 히브리어 Strong's 사전 (신규)           │
│  ├── gstrong.json      # 헬라어 Strong's 사전 (신규)             │
│  ├── bibleDic.json     # 성경 사전 (신규)                        │
│  └── wordStrong.json   # 단어-Strong 매핑 (신규)                 │
│                                                                  │
│  src/types/dictionary.ts (신규)                                  │
│  ├── StrongEntry                                                 │
│  ├── DictEntry                                                   │
│  ├── WordStrongMapping                                           │
│  └── SelectedWord                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 데이터 스키마

### 1. Strong's 사전 (hstrong.json, gstrong.json)

```typescript
interface StrongEntry {
  num: string;           // "H1", "G3056" 등
  original: string;      // 원어 (히브리어/헬라어)
  transliteration: string; // 음역 (영문)
  pronunciation: string; // 발음
  meaning: string;       // 영문 의미
  meaningKo: string;     // 한글 의미
  usage: string;         // 용례 설명
  related: string[];     // 관련 Strong 번호
}

// 예시
{
  "num": "H1",
  "original": "אָב",
  "transliteration": "'ab",
  "pronunciation": "awb",
  "meaning": "father",
  "meaningKo": "아버지",
  "usage": "As a noun: father, head of household...",
  "related": ["H2", "H25"]
}
```

### 2. 성경 사전 (bibleDic.json)

```typescript
interface DictEntry {
  id: number;
  term: string;          // 표제어
  termEn?: string;       // 영문 표제어
  category: string;      // 분류 (인물/지명/개념/...)
  definition: string;    // 정의
  references: string[];  // 관련 구절 (예: ["창1:1", "요1:1"])
  related: string[];     // 관련 항목
}

// 예시
{
  "id": 1,
  "term": "아브라함",
  "termEn": "Abraham",
  "category": "인물",
  "definition": "이스라엘 민족의 조상으로 하나님과 언약을 맺은 믿음의 조상...",
  "references": ["창12:1", "창15:6", "롬4:3"],
  "related": ["이삭", "야곱", "언약"]
}
```

### 3. 단어-Strong 매핑 (wordStrong.json)

```typescript
interface WordStrongMapping {
  bookId: number;
  chapter: number;
  verse: number;
  wordIndex: number;     // 절 내 단어 위치 (0-based)
  word: string;          // 한글 단어
  strongNum: string;     // Strong 번호
}

// 예시 (창 1:1 "태초에")
{
  "bookId": 1,
  "chapter": 1,
  "verse": 1,
  "wordIndex": 0,
  "word": "태초에",
  "strongNum": "H7225"
}
```

---

## 컴포넌트 설계

### 1. VerseText (단어별 선택 가능한 절)

```tsx
// src/components/bible/VerseText.tsx

interface VerseTextProps {
  bookId: number;
  chapter: number;
  verseNum: number;
  text: string;
  strongMappings?: WordStrongMapping[];
  onWordPress?: (word: string, strongNum?: string) => void;
  highlightWord?: string;
}

const VerseText: React.FC<VerseTextProps> = ({
  text,
  strongMappings,
  onWordPress,
  highlightWord
}) => {
  const words = text.split(/(\s+)/);

  return (
    <Text>
      {words.map((word, index) => {
        const mapping = strongMappings?.find(m => m.wordIndex === index);
        const isHighlighted = word === highlightWord;

        return (
          <Text
            key={index}
            onPress={() => onWordPress?.(word, mapping?.strongNum)}
            style={[
              styles.word,
              mapping && styles.hasStrong,
              isHighlighted && styles.highlighted
            ]}
          >
            {word}
          </Text>
        );
      })}
    </Text>
  );
};
```

### 2. ParallelBibleModal (비교 성경 모달)

```tsx
// src/components/bible/ParallelBibleModal.tsx

interface ParallelBibleModalProps {
  visible: boolean;
  onClose: () => void;
  bookId: number;
  chapter: number;
  verse: number;
  versions: ParallelVersion[];
}

type ParallelVersion =
  | 'hcv'      // 개역한글
  | 'kjv'      // KJV 영어
  | 'jpm'      // 일본어
  | 'hstrong'  // 한글 + 히브리어 Strong
  | 'gstrong'; // 한글 + 헬라어 Strong

const ParallelBibleModal: React.FC<ParallelBibleModalProps> = ({
  visible,
  bookId,
  chapter,
  verse,
  versions
}) => {
  const parallelVerses = useMemo(() =>
    bundledBibleService.getParallelVerses(bookId, chapter, verse, versions),
    [bookId, chapter, verse, versions]
  );

  return (
    <Modal visible={visible}>
      <ScrollView>
        {parallelVerses.map(({ version, text, strongWords }) => (
          <View key={version} style={styles.versionRow}>
            <Text style={styles.versionLabel}>{VERSION_NAMES[version]}</Text>
            {strongWords ? (
              <StrongVerseText words={strongWords} />
            ) : (
              <Text style={styles.verseText}>{text}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </Modal>
  );
};
```

### 3. WordPopover (단어 선택 팝오버)

```tsx
// src/components/dictionary/WordPopover.tsx

interface WordPopoverProps {
  word: string;
  strongNum?: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSearchDictionary: () => void;
  onViewStrong: () => void;
}

const WordPopover: React.FC<WordPopoverProps> = ({
  word,
  strongNum,
  position,
  onClose,
  onSearchDictionary,
  onViewStrong
}) => {
  return (
    <View style={[styles.popover, { top: position.y, left: position.x }]}>
      <Text style={styles.word}>{word}</Text>

      {strongNum && (
        <TouchableOpacity onPress={onViewStrong}>
          <Text>📖 원어 보기 ({strongNum})</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onSearchDictionary}>
        <Text>🔍 사전에서 찾기</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose}>
        <Text>✕ 닫기</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 서비스 설계

### dictionaryService.ts

```typescript
// src/services/dictionaryService.ts

import hstrongData from '../data/versions/bundled/hstrong.json';
import gstrongData from '../data/versions/bundled/gstrong.json';
import bibleDicData from '../data/versions/bundled/bibleDic.json';
import wordStrongData from '../data/versions/bundled/wordStrong.json';

class DictionaryService {
  private hstrongIndex: Map<string, StrongEntry>;
  private gstrongIndex: Map<string, StrongEntry>;
  private dicIndex: Map<string, DictEntry>;
  private wordStrongIndex: Map<string, WordStrongMapping[]>;

  constructor() {
    this.buildIndexes();
  }

  private buildIndexes() {
    // Strong's 인덱스 구축
    this.hstrongIndex = new Map(
      hstrongData.map(e => [e.num, e])
    );
    this.gstrongIndex = new Map(
      gstrongData.map(e => [e.num, e])
    );

    // 성경사전 인덱스
    this.dicIndex = new Map(
      bibleDicData.map(e => [e.term, e])
    );

    // 단어-Strong 매핑 인덱스 (bookId-chapter-verse 키)
    this.wordStrongIndex = new Map();
    for (const mapping of wordStrongData) {
      const key = `${mapping.bookId}-${mapping.chapter}-${mapping.verse}`;
      if (!this.wordStrongIndex.has(key)) {
        this.wordStrongIndex.set(key, []);
      }
      this.wordStrongIndex.get(key)!.push(mapping);
    }
  }

  // Strong's 번호로 조회
  getStrongHebrew(num: string): StrongEntry | null {
    const key = num.startsWith('H') ? num : `H${num}`;
    return this.hstrongIndex.get(key) || null;
  }

  getStrongGreek(num: string): StrongEntry | null {
    const key = num.startsWith('G') ? num : `G${num}`;
    return this.gstrongIndex.get(key) || null;
  }

  // Strong's 검색 (원어, 음역, 의미로 검색)
  searchStrong(query: string, lang: 'H' | 'G' = 'H'): StrongEntry[] {
    const index = lang === 'H' ? this.hstrongIndex : this.gstrongIndex;
    const results: StrongEntry[] = [];
    const lowerQuery = query.toLowerCase();

    for (const entry of index.values()) {
      if (
        entry.original.includes(query) ||
        entry.transliteration.toLowerCase().includes(lowerQuery) ||
        entry.meaning.toLowerCase().includes(lowerQuery) ||
        entry.meaningKo.includes(query)
      ) {
        results.push(entry);
      }
    }

    return results.slice(0, 50); // 최대 50개
  }

  // 성경사전 검색
  searchBibleDictionary(query: string): DictEntry[] {
    const results: DictEntry[] = [];
    const lowerQuery = query.toLowerCase();

    for (const entry of this.dicIndex.values()) {
      if (
        entry.term.includes(query) ||
        entry.termEn?.toLowerCase().includes(lowerQuery) ||
        entry.definition.includes(query)
      ) {
        results.push(entry);
      }
    }

    return results.slice(0, 50);
  }

  // 절의 단어별 Strong 매핑 조회
  getVerseStrongMappings(
    bookId: number,
    chapter: number,
    verse: number
  ): WordStrongMapping[] {
    const key = `${bookId}-${chapter}-${verse}`;
    return this.wordStrongIndex.get(key) || [];
  }

  // 통합 검색 (성경 구절 + 사전)
  unifiedSearch(query: string): {
    dictionary: DictEntry[];
    strongH: StrongEntry[];
    strongG: StrongEntry[];
  } {
    return {
      dictionary: this.searchBibleDictionary(query),
      strongH: this.searchStrong(query, 'H'),
      strongG: this.searchStrong(query, 'G')
    };
  }
}

export const dictionaryService = new DictionaryService();
```

---

## 네비게이션 확장

```typescript
// src/navigation/types.ts (확장)

export type SearchStackParamList = {
  Search: undefined;
  SearchResult: {
    query: string;
    tab?: 'verses' | 'dictionary' | 'strong';
  };
  DictionaryDetail: {
    entryId: number;
  };
  StrongDetail: {
    strongNum: string;  // "H1234" or "G5678"
  };
};

export type BibleStackParamList = {
  // ... 기존 ...
  ParallelBible: {
    bookId: number;
    chapter: number;
    verse: number;
    versions: string[];
  };
};
```

---

## UI 플로우

### 1. 비교 성경 플로우

```
ReadingScreen
    │
    ├─[절 선택]─► ActionModal
    │               │
    │               ├─ 📖 주석 보기
    │               ├─ 📚 비교 성경 ◄── 신규
    │               ├─ 🖍️ 하이라이트
    │               └─ 📝 메모
    │
    └─[비교 성경 선택]─► ParallelBibleModal
                           │
                           ├─ 버전 선택 체크박스
                           │   □ 개역한글 (HCV)
                           │   □ KJV (영어)
                           │   □ 日本語 (일본어)
                           │   □ 히브리어 원문 (Strong)
                           │   □ 헬라어 원문 (Strong)
                           │
                           └─ 선택된 버전들 병렬 표시
                               ┌──────────────────────┐
                               │ [HCV] 태초에 하나님이│
                               │ 천지를 창조하시니라  │
                               ├──────────────────────┤
                               │ [KJV] In the begin-  │
                               │ ning God created...  │
                               ├──────────────────────┤
                               │ [Strong] 태초에(H7225)│
                               │ 하나님이(H430)...    │
                               └──────────────────────┘
```

### 2. 통합 검색 플로우

```
SearchScreen
    │
    ├─[검색어 입력: "아브라함"]
    │
    └─► SearchResultScreen
           │
           ├─ [탭: 성경] ─────────────────────┐
           │   • 창 12:1 "...아브라함에게..."  │
           │   • 창 15:6 "아브람이 여호와를..." │
           │   • (총 234개 결과)               │
           │                                   │
           ├─ [탭: 사전] ─────────────────────┤
           │   📖 아브라함                     │
           │   이스라엘 민족의 조상...         │
           │   [관련: 이삭, 야곱, 언약]        │
           │                                   │
           └─ [탭: Strong] ────────────────────┘
               H85 אַבְרָהָם
               'Abraham (아브라함)
               "많은 무리의 아버지"
```

### 3. 단어 선택 플로우

```
ReadingScreen (단어 선택 모드)
    │
    │  "태초에 하나님이 천지를 창조하시니라"
    │   ↑
    │   [터치: "하나님이"]
    │
    └─► WordPopover
           │
           ├─ 하나님이 (H430)
           │
           ├─ [📖 원어 보기] ─► StrongDetailModal
           │                      אֱלֹהִים (Elohim)
           │                      "신, 하나님"
           │                      창세기에서 2606회 사용
           │
           ├─ [🔍 사전 검색] ─► SearchScreen(query="하나님")
           │
           └─ [✕ 닫기]
```

---

## 구현 우선순위

### Phase 1: 데이터 준비
1. Strong's 사전 변환 스크립트 작성 (HSTRONG4, GSTRONG4)
2. 성경사전 변환 스크립트 작성 (DIC1, DIC2)
3. 단어-Strong 매핑 데이터 생성 (WRD2STR)

### Phase 2: 서비스 레이어
1. dictionaryService.ts 구현
2. bundledBibleService.ts 확장 (getParallelVerses)
3. 타입 정의 추가

### Phase 3: UI 컴포넌트
1. VerseText 컴포넌트 (단어별 터치)
2. WordPopover 컴포넌트
3. ParallelBibleModal 컴포넌트

### Phase 4: 화면 통합
1. ReadingScreen에 비교 성경 버튼 추가
2. SearchScreen 검색 결과 확장
3. 사전 상세 화면 추가

---

## 파일 구조 변경 요약

```
src/
├── components/
│   ├── bible/
│   │   ├── VerseText.tsx           ← 신규 (단어별 렌더링)
│   │   ├── ParallelBibleModal.tsx  ← 신규
│   │   ├── ParallelVerseRow.tsx    ← 신규
│   │   └── StrongWordLink.tsx      ← 신규
│   └── dictionary/                 ← 신규 폴더
│       ├── WordPopover.tsx
│       ├── DictionaryCard.tsx
│       ├── StrongEntry.tsx
│       └── index.ts
├── services/
│   ├── dictionaryService.ts        ← 신규
│   ├── bundledBibleService.ts      ← 확장
│   └── index.ts                    ← 확장 (export 추가)
├── store/
│   ├── dictionaryStore.ts          ← 신규
│   ├── bibleStore.ts               ← 확장
│   └── index.ts                    ← 확장
├── types/
│   ├── dictionary.ts               ← 신규
│   └── index.ts                    ← 확장
├── data/
│   └── versions/bundled/
│       ├── hstrong.json            ← 신규
│       ├── gstrong.json            ← 신규
│       ├── bibleDic.json           ← 신규
│       └── wordStrong.json         ← 신규
└── screens/
    ├── search/
    │   └── SearchResultScreen.tsx  ← 확장 (사전 탭 추가)
    └── dictionary/                 ← 신규 폴더
        ├── StrongDetailScreen.tsx
        └── DictionaryDetailScreen.tsx
```
