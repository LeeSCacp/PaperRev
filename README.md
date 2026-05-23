# PaperRev

Gerontology/Aging 분야의 최신 저널 논문을 수집하고 노화 심리 하위 분야별 카드뉴스 형태로 보여주는 정적 웹사이트 프로토타입입니다.

## 현재 범위

- 주제: Gerontology, Aging
- 화면 방향: 검색형 논문 목록이 아니라 분야별 매거진형 카드뉴스
- 1차 저널: Gerontology/Aging 및 노화 심리 관련 핵심 저널 20개
- 데이터 확인: Crossref에서 최신 논문 메타데이터 수집 가능 확인
- 배포 전제: GitHub Pages

## 정보 구조

- 분야별 매거진 홈: 인지노화, 정서노화, 사회적 노화, 치매·인지장애, 돌봄·가족, 건강행동·디지털헬스, 일·은퇴·연령주의
- 질문으로 읽기: 독자 질문, 짧은 답, 공통 경향, 남은 쟁점
- 논문 카드뉴스: 핵심 질문, 무엇을 했나, 주요 결과, 왜 중요한가, 조심해서 볼 점
- 원문 목록: DOI, Crossref, 저널 정보와 보조 검색

## 로컬 실행

```powershell
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## GitHub Pages 게시

1. GitHub에 새 저장소를 만듭니다.
2. 이 폴더의 파일을 저장소에 push합니다.
3. GitHub 저장소의 `Settings > Pages`에서 `Deploy from a branch`를 선택합니다.
4. `main` 브랜치와 `/root`를 선택합니다.

## 저널 추가 방법

1. 후보 저널의 공식 페이지에서 다음을 확인합니다.
   - Gerontology/Aging 주제 부합 여부
   - JCR/SSCI 또는 Clarivate 지표
   - Open access 또는 최소한 초록/메타데이터 접근 가능 여부
   - ISSN

2. `data/journals.json`에 항목을 추가합니다.

```json
{
  "id": "journal-id",
  "name": "Journal Name",
  "shortName": "Journal",
  "issn": "0000-0000",
  "accessLabel": "Open access",
  "metric": "2024 IF 0.0; Gerontology rank",
  "crossrefEndpoint": "https://api.crossref.org/journals/0000-0000/works",
  "selectionNote": "선정 근거"
}
```

3. Crossref 수집을 테스트합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fetch-crossref.ps1 -FromDate "2026-01-01" -Rows 3
```

4. 수집된 `scratch/crossref-latest.json`을 검토한 뒤 `data/articles.json`에 게시할 항목만 정리합니다.

## 자동 초안 생성

Crossref 수집, 정규화, 규칙 기반 분야 분류, 5장 카드뉴스 초안 생성을 한 번에 실행합니다.

```powershell
node .\scripts\build-drafts.mjs --windows=7,14,30,60,90,180 --rows=50 --min-topic-count=5 --draft-limit-per-topic=5 --archive-days=365
```

동작 방식:

- 최근 7일 논문을 먼저 수집합니다.
- 7개 하위 분야 중 5개 미만인 분야가 있으면 14일, 30일, 60일, 90일, 180일 순서로 기간을 넓힙니다.
- DOI 기준으로 중복을 제거합니다.
- Crossref JATS/HTML 태그와 entity를 정리합니다.
- 제목/초록 키워드로 `topicId`, `questionIds`를 자동 부여합니다.
- 논문별 카드뉴스 초안을 만듭니다.

생성 파일:

- `data/raw/crossref-latest.json`: Crossref 원본에 가까운 수집 데이터
- `data/drafts/article-drafts.json`: 정규화, 분류, 카드뉴스 초안이 포함된 검수 후보
- `data/theories.json`: 카드뉴스와 함께 보여줄 노화심리·노년학 핵심 이론
- `data/theory-papers.json`: 이론별 대표 원전과 핵심 논문 seed 목록
- `data/theory-notes.json`: 이론별 핵심 주장, 대표 개념, 한계, 이론 간 흐름, 설명문 초안

현재 draft 출력 구조:

- `featuredDrafts`: 분야별 최신순 상위 5개, 화면의 카드뉴스 draft에 표시
- `archiveRecords`: `featuredDrafts`에 포함되지 않은 나머지 수집 논문, 최근 1년만 유지
- `records`: 이전 프론트 호환을 위한 대표 draft 목록이며 현재는 `featuredDrafts`와 동일

이론 데이터 운영 방식:

- `data/theory-papers.json`은 내부 참고문헌 창고입니다. 화면에 모든 문헌을 노출하지 않습니다.
- `data/theory-notes.json`은 화면과 설명문 작성에 사용할 압축 정리본입니다.
- 공개 화면에서는 이론별 설명과 anchor work 2-3개만 보여주고, 전체 대표 문헌은 상세/참고문헌 영역에서만 사용합니다.
- 현재 노화 이론 섹션은 `theory-notes.json`과 `theory-papers.json`을 읽어 선택형 상세 패널을 렌더링합니다.

주의:

- 생성된 카드뉴스는 `summary_status: ai_draft` 상태입니다.
- 현재 스크립트는 OpenAI API를 호출하지 않고 규칙 기반 문장 추출과 템플릿으로 초안을 만듭니다.
- `data/articles.json`은 게시용 데이터이므로 자동 초안으로 바로 덮어쓰지 않습니다.

## 검수 정책

사람 검수는 기술적으로 필수는 아닙니다. 다만 현재처럼 자동 생성 초안을 그대로 공개할 경우, 사이트에는 자동 요약임을 명확히 표시하고 임상적 조언처럼 읽히는 문장은 피해야 합니다.

권장 운영 방식:

- 자동 생성: `data/drafts/article-drafts.json`
- 공개 게시: `data/articles.json`
- 게시 조건: 자동 초안 품질이 낮은 초기 단계에서는 사람이 확인한 항목만 승격

API 기반 한국어 요약을 붙이기 전까지는 `ai_draft`를 바로 게시 데이터로 덮어쓰지 않는 방식을 유지합니다.

## 주간 자동 실행

GitHub Actions 워크플로가 매주 월요일 09:00 KST에 실행되도록 설정되어 있습니다.

```text
.github/workflows/weekly-drafts.yml
```

동작:

- `node scripts/build-drafts.mjs --windows=7,14,30,60,90,180 --rows=50 --min-topic-count=5 --draft-limit-per-topic=5 --archive-days=365` 실행
- `data/raw/crossref-latest.json`, `data/drafts/article-drafts.json` 업데이트
- 변경사항이 있으면 자동 커밋 및 push

## 다음 구현 과제

- 사람이 검수한 초안만 `data/articles.json`으로 승격하는 게시 스크립트
- 대표 draft 선정 기준을 단순 최신순에서 점수 기반으로 개선
- 이론별 설명과 최신 논문 draft를 키워드 기반으로 자동 연결
- 초록 기반 카드뉴스 문장을 더 자연스러운 한국어로 바꾸는 요약 단계
- draft preview/review 화면
- GitHub Actions를 이용한 주기적 수집 자동화
