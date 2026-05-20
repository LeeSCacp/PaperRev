# PaperRev

Gerontology/Aging 분야의 최신 저널 논문을 수집하고 노화 심리 하위 분야별 카드뉴스 형태로 보여주는 정적 웹사이트 프로토타입입니다.

## 현재 범위

- 주제: Gerontology, Aging
- 화면 방향: 검색형 논문 목록이 아니라 분야별 매거진형 카드뉴스
- 1차 저널: JMIR Aging, Innovation in Aging, The Gerontologist, The Journals of Gerontology: Series B
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
node .\scripts\build-drafts.mjs --windows=7,14,30 --rows=25
```

동작 방식:

- 최근 7일 논문을 먼저 수집합니다.
- 7개 하위 분야 중 비어 있는 분야가 있으면 14일, 30일 순서로 기간을 넓힙니다.
- DOI 기준으로 중복을 제거합니다.
- Crossref JATS/HTML 태그와 entity를 정리합니다.
- 제목/초록 키워드로 `topicId`, `questionIds`를 자동 부여합니다.
- 논문별 카드뉴스 초안을 만듭니다.

생성 파일:

- `data/raw/crossref-latest.json`: Crossref 원본에 가까운 수집 데이터
- `data/drafts/article-drafts.json`: 정규화, 분류, 카드뉴스 초안이 포함된 검수 후보

주의:

- 생성된 카드뉴스는 `summary_status: ai_draft` 상태입니다.
- 현재 스크립트는 OpenAI API를 호출하지 않고 규칙 기반 문장 추출과 템플릿으로 초안을 만듭니다.
- `data/articles.json`은 게시용 데이터이므로 자동 초안으로 바로 덮어쓰지 않습니다.

## 다음 구현 과제

- 사람이 검수한 초안만 `data/articles.json`으로 승격하는 게시 스크립트
- 초록 기반 카드뉴스 문장을 더 자연스러운 한국어로 바꾸는 요약 단계
- draft preview/review 화면
- GitHub Actions를 이용한 주기적 수집 자동화
