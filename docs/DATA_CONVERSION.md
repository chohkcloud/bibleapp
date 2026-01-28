# 데이터 변환 결과 요약

## 생성된 데이터 파일

| 파일명 | 크기 | 항목 수 | 설명 |
|--------|------|---------|------|
| hstrong.json | 4.82 MB | 8,853 | 히브리어 Strong's 사전 |
| gstrong.json | 4.38 MB | 8,853 | 헬라어 Strong's 사전 |
| bibleDic.json | 14.66 MB | 84,798 | 성경 사전 |
| wordStrong.json | 5.89 MB | 83,892 | 단어-Strong 번호 매핑 |

## 데이터 스키마

### Strong's 사전 (hstrong.json, gstrong.json)

```json
{
  "num": "H1",
  "original": "ba'",
  "transliteration": "ba'",
  "pronunciation": "awb",
  "pronunciationKo": "아브",
  "meaning": "{awb}\n\na root; TWOT - 4a; n m\n\nAV - father 1205...",
  "meaningKo": "기본어;문자적·직접적 의미에서나...",
  "usage": "",
  "related": []
}
```

### 성경 사전 (bibleDic.json)

```json
{
  "id": 1,
  "term": "가난",
  "termHanja": "",
  "termEn": "Poor",
  "category": "기타",
  "shortMeaning": "물질적인 가난...",
  "definition": "물질적인 가난, 유약, 불행 혹은 고통받는 상태...",
  "references": [],
  "related": []
}
```

### 단어-Strong 매핑 (wordStrong.json)

```json
{
  "word": "Ihsou'",
  "strongNums": ["G2424"]
}
```

## 변환 스크립트

| 스크립트 | 입력 | 출력 |
|----------|------|------|
| convert_strong.js | HSTRONG4.DBF/SMT, GSTRONG4.DBF/SMT | hstrong.json, gstrong.json |
| convert_bibleDic.js | DIC1.DBF/SMT, DIC2.DBF/SMT | bibleDic.json |
| convert_wordStrong.js | WRD2STR.DBF | wordStrong.json |

## 제한 사항

1. **단어-Strong 매핑의 절 위치 정보 부재**
   - WRD2STR.DBF는 단어와 Strong 번호만 포함
   - 성경 본문 내 위치(책, 장, 절, 단어 인덱스) 정보 없음
   - 절별 단어-Strong 매핑은 외부 데이터 필요

2. **원어 문자 부재**
   - Strong's 사전의 original 필드는 로마자 음역
   - 실제 히브리어/헬라어 문자는 미포함
   - Unicode 히브리어/헬라어 문자 추가 필요 시 외부 소스 활용

3. **성경 사전 분류 자동화 한계**
   - 자동 분류 정확도 낮음 (대부분 '기타'로 분류)
   - 수동 분류 또는 AI 기반 분류 개선 필요

## 다음 단계

1. **dictionaryService.ts 구현** - 사전 검색/조회 서비스
2. **UI 컴포넌트 개발** - WordPopover, StrongEntry 등
3. **ReadingScreen 통합** - 비교 성경, 단어 선택 기능
4. **SearchScreen 확장** - 사전 검색 결과 탭 추가

## 원본 파일 위치

```
reference/mbook45/Dic/
├── HSTRONG4.DBF/SMT   # 히브리어 Strong's
├── GSTRONG4.DBF/SMT   # 헬라어 Strong's
├── DIC1.DBF/SMT       # 성경 사전 1
├── DIC2.DBF/SMT       # 성경 사전 2 (영어)
└── WRD2STR.DBF        # 단어-Strong 매핑
```
