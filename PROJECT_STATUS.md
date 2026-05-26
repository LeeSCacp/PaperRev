# PaperRev 프로젝트 상태

최종 업데이트: 2026-05-24 KST

## 프로젝트 목표

최신 심리학 저널 논문을 수집하고, 독자가 빠르게 훑어볼 수 있도록 한국어 요약과 원문/메타데이터 링크를 제공하는 단일 웹사이트를 만든다.

향후 다른 홈페이지에 병합될 수 있지만, 현재 단계에서는 독립 실행 가능한 단일 사이트로 기획한다.

## 현재 단계

- [x] 초기 프로젝트 폴더 상태 확인
- [x] 구현 전 기획 단계부터 시작
- [x] 1차 MVP 범위 정의
- [x] 후보 학술 메타데이터 출처 확인
- [x] 대상 독자와 논문 선별 규칙 1차 확정: Gerontology/Aging 우선
- [x] 첫 데이터 소스 전략 결정: Crossref 기반 수집, 공식 저널 지표 확인 병행
- [x] 프론트엔드/백엔드 기술 스택 결정: GitHub Pages용 정적 사이트 우선
- [x] 정적 클릭 가능 프로토타입 제작
- [ ] 논문 수집 및 캐시 구현
- [ ] 요약 초안/검수/게시 흐름 구현

## 2026-05-20 진행 기록

- 사용자가 1차 주제를 Gerontology, Aging 저널로 지정했다.
- 선정 기준은 접근 가능한 저널, Open Access 권장, SSCI/JCR 기준 상위권 저널 중 주제 부합 저널로 정했다.
- GitHub 게시 예정이므로, 1차 구현은 GitHub Pages에 올리기 쉬운 정적 사이트로 결정했다.
- `index.html`, `styles.css`, `app.js`, `data/journals.json`, `data/articles.json`, `scripts/fetch-crossref.ps1`, `README.md`, `.nojekyll`을 추가했다.
- Crossref에서 4개 후보 저널의 최신 논문 메타데이터 수집 가능성을 확인했다.
- JSON 문법 검증 완료: `data/journals.json`, `data/articles.json`.
- 로컬 서버 `http://localhost:8000`에서 프로토타입 표시와 검색 필터 동작을 확인했다.
- PowerShell 실행 정책 때문에 수집 스크립트는 `powershell -ExecutionPolicy Bypass -File .\scripts\fetch-crossref.ps1 ...` 방식으로 실행하도록 README에 기록했다.
- GitHub Pages 게시 준비를 위해 로컬 Git 저장소를 `main` 브랜치로 초기화했다.
- 현재 환경에는 GitHub CLI(`gh`)가 없어 원격 저장소 자동 생성은 불가하다. GitHub에서 빈 저장소를 만든 뒤 remote URL을 연결해야 한다.
- GitHub 원격 저장소 `https://github.com/LeeSCacp/PaperRev.git`의 초기 README 커밋과 로컬 작업을 병합했다.
- README 충돌은 로컬의 상세 README를 유지하는 방식으로 해결했다.
- `main` 브랜치를 GitHub 원격 저장소에 push 완료했다.
- 로컬 미리보기 서버 `http://localhost:8000`을 종료했다.
- 제품 방향을 재검토했다. 현재 프로토타입은 검색/필터 기반 논문 목록에 가깝지만, 목표 경험은 자동 수집된 논문을 노화 심리 하위 분야별로 정리해 사용자가 카드뉴스처럼 읽는 큐레이션 페이지에 더 가깝다.
- 분야별 매거진형 정보 구조를 실제 프로토타입에 반영했다.
- `data/topics.json`과 `data/questions.json`을 추가해 7개 하위 분야와 8개 독자 질문을 분리했다.
- `app.js`를 개편해 분야별 섹션, 질문 카드, 논문 5장 카드뉴스, 하단 원문 목록을 렌더링하도록 변경했다.
- 로컬 서버에서 새 화면 렌더링을 확인했다: 분야 카드 7개, 분야 섹션 7개, 질문 카드 8개, 카드뉴스 deck 5장, 원문 목록 9개.
- 브라우저 콘솔 오류 없음. 원문 보조 검색 동작 확인.
- 추천 개선안을 반영해 홈을 짧은 프리뷰 중심으로 줄이고, 분야 상세는 선택형 탭 뷰로 변경했다.
- 분야 상세에는 선택된 분야 1개만 표시되며, 질문 목록 -> 최신 카드뉴스 후보 -> 논문 5장 카드뉴스 흐름으로 구성했다.
- 카드뉴스 deck은 데스크톱/모바일 모두 가로 스크롤 슬라이드처럼 읽히도록 변경했다.
- 기본 선택 분야는 카드뉴스 후보가 있는 첫 분야로 잡아 빈 상세 화면이 먼저 보이지 않게 했다.
- 동적 작업 1-4단계의 첫 버전을 구현했다: Crossref 수집, 정규화, 규칙 기반 분야 분류, 규칙 기반 카드뉴스 초안 생성.
- `scripts/build-drafts.mjs`를 추가했다. 실행 명령은 `node .\scripts\build-drafts.mjs --windows=7,14,30 --rows=25`.
- 최근 7일 수집 후 분야 커버리지가 부족하면 14일, 30일까지 기간을 확장한다.
- 2026-05-20 실행 결과 7일 후 14일까지 확장했고, 총 34개 초안을 생성했다.
- 생성 결과: `data/raw/crossref-latest.json`, `data/drafts/article-drafts.json`.
- 14일 기준 분야 커버리지: 인지노화 6, 정서노화 1, 사회적 노화 11, 치매·인지장애 5, 돌봄·가족 5, 건강행동·디지털헬스 4, 일·은퇴·연령주의 2.
- 현재 카드뉴스 초안은 OpenAI API 없이 Crossref 초록에서 문장을 추출해 한국어 카드 프레임에 넣는 규칙 기반 `ai_draft`다.
- 사람 검수는 기술적으로 필수는 아니지만, 현재 규칙 기반 초안을 공개할 때는 자동 요약 표시와 보수적 문장 제한이 필요하다고 정리했다.
- OpenAI API 연결은 보류하고, 나머지 개선을 진행했다.
- 저널 목록을 4개에서 10개 핵심 저널로 확장했다: Psychology and Aging, Aging & Mental Health, Ageing & Society, Journal of Aging and Health, Journal of Applied Gerontology, Clinical Gerontologist 추가.
- 확장된 10개 저널 기준으로 `build-drafts.mjs`를 재실행했고, 최근 7일만으로 7개 분야 모두 커버되었다.
- 2026-05-22 실행 결과 총 24개 draft 생성: 인지노화 4, 정서노화 6, 사회적 노화 7, 치매·인지장애 1, 돌봄·가족 3, 건강행동·디지털헬스 2, 일·은퇴·연령주의 1.
- GitHub Actions 주간 자동 실행 파일 `.github/workflows/weekly-drafts.yml`을 추가했다. 매주 월요일 09:00 KST에 draft 생성 후 변경 시 자동 커밋한다.
- UX 개선: 원문 목록은 기본 접힘 영역으로 낮춰 카드뉴스 탐색을 우선하도록 조정했다.
- Crossref 결과의 제목/저널명 HTML entity 정리를 `build-drafts.mjs`에 추가했다.
- 저널 목록을 20개로 확장했다. 추가 확장: Research on Aging, The International Journal of Aging and Human Development, Aging Neuropsychology and Cognition, Experimental Aging Research, Dementia, International Psychogeriatrics, The Journals of Gerontology: Series A, Age and Ageing, BMC Geriatrics, Gerontology.
- `build-drafts.mjs`의 기본 탐색 기간을 `7,14,30,60,90,180`일로 확장하고, `--min-topic-count=5`를 추가했다.
- 확장된 20개 저널과 섹션별 최소 5개 조건으로 실행한 결과, 최근 14일 범위에서 총 136개 자동 draft가 생성되었다.
- 2026-05-23 실행 결과 섹션별 draft 수: 인지노화 24, 정서노화 24, 사회적 노화 47, 치매·인지장애 11, 돌봄·가족 14, 건강행동·디지털헬스 10, 일·은퇴·연령주의 6.
- 프론트엔드는 `data/drafts/article-drafts.json`이 있으면 이를 우선 읽고, 없으면 `data/articles.json`으로 fallback하도록 변경했다.
- 화면 상단에 자동 생성 draft 안내, 탐색 기간, 섹션별 최소 목표를 표시하도록 변경했다.

## 2026-05-23 추가 진행 기록

- 수집된 전체 논문을 그대로 카드뉴스 영역에 모두 노출하지 않도록 `data/drafts/article-drafts.json` 구조를 분리했다.
- `featuredDrafts`는 분야별 최신순 상위 5개만 담도록 했고, 현재 7개 분야 x 5개로 총 35개 카드뉴스 draft가 생성된다.
- `archiveRecords`는 `featuredDrafts`에 포함되지 않은 수집 논문만 담으며, `--archive-days=365` 기준으로 최근 1년 논문만 유지한다.
- 2026-05-23 재실행 결과: Crossref 수집 136개, `featuredDrafts` 35개, `archiveRecords` 101개, 선택 검색 기간 14일.
- `records` 필드는 이전 프론트 호환을 위해 유지하되 현재는 `featuredDrafts`와 동일하게 대표 draft만 가리킨다.
- `data/theories.json`을 추가해 카드뉴스 draft, 수집 보관함과 같은 수준의 `노화 이론` 섹션을 만들었다.
- 프론트엔드는 카드뉴스/분야 상세에는 `featuredDrafts`를 사용하고, 수집 보관함에는 `archiveRecords`만 사용하도록 변경했다.
- GitHub Actions 주간 draft 생성 명령에도 `--draft-limit-per-topic=5 --archive-days=365`를 반영했다.
- `data/theory-papers.json`을 추가해 10개 노화 이론별 대표 원전/핵심 논문 52개를 정리했다.
- 이론 문헌 정리는 현재 최신 draft와 연결하지 않았고, 이후 이론별 내용 정리와 이론-논문 자동 매칭의 입력 자료로 사용한다.
- DOI가 있는 49개 항목은 `https://doi.org/...` 링크 응답을 점검했고, 단행본/도서 성격의 3개 항목은 출판사 또는 도서 서지 링크로 관리한다.
- `data/theory-notes.json`을 추가해 10개 이론별 핵심 주장 5개, 대표 개념 4개, 개념 흐름, 다른 이론과의 관련성, 한계, 설명문 초안을 정리했다.
- 운영 원칙: `theory-papers.json`은 내부 참고문헌 seed로 유지하고, 실제 화면에는 `theory-notes.json`의 압축 설명과 이론별 anchor work 2-3개만 노출한다.
- 프론트의 노화 이론 섹션을 `data/theory-notes.json`, `data/theory-papers.json`과 연결했다.
- 노화 이론 카드를 선택하면 핵심 주장, 대표 개념, 주장과 개념의 흐름, 다른 이론과의 관련성, 한계, anchor 문헌 3개가 상세 패널에 표시된다.

다음 추천 순서:

1. 대표 draft 선정 기준을 단순 최신순에서 `최신성 + 초록 완성도 + 주제 적합도` 점수로 바꾼다.
2. 노화 이론과 논문 카드를 키워드 기반으로 자동 연결해 이론별 읽기 흐름을 만든다.
3. OpenAI API 연결 전까지 사용할 수 있는 `검수/승격` 스크립트 또는 리뷰 화면을 만든다.

## 1차 선정 저널

| 저널 | 접근성 | 선정 근거 | 수집 상태 |
| --- | --- | --- | --- |
| JMIR Aging | Gold open access | 공식 페이지 기준 JCR/Clarivate 지표 및 OA 확인, Gerontology 상위권 | Crossref 수집 확인 |
| Innovation in Aging | Open access | OUP/GSA 공식 About 기준 2024 IF 4.3, Gerontology IF rank 3/48 | Crossref 수집 확인 |
| The Gerontologist | Hybrid; metadata accessible | OUP/GSA 공식 About 기준 Gerontology JCI rank 2/48 | Crossref 수집 확인 |
| The Journals of Gerontology: Series B | Hybrid; metadata accessible | 심리·사회 노화 연구 직접 부합, Gerontology JCI rank 1/48 | Crossref 수집 확인 |
| Psychology and Aging | Hybrid; metadata accessible | APA 노화 심리 핵심 저널, SSCI indexed | Crossref 수집 확인 |
| Aging & Mental Health | Hybrid; metadata accessible | 노년기 정신건강, 정서노화, 치매·돌봄 주제 보강 | Crossref 수집 확인 |
| Ageing & Society | Hybrid; metadata accessible | 사회노년학, 문화, 정책, 관계 맥락 보강 | Crossref 수집 확인 |
| Journal of Aging and Health | Hybrid; metadata accessible | 노년기 건강, 건강행동, 정신건강 보강 | Crossref 수집 확인 |
| Journal of Applied Gerontology | Hybrid; metadata accessible | 실천·정책·지역사회 기반 노년학 보강 | Crossref 수집 확인 |
| Clinical Gerontologist | Hybrid; metadata accessible | 임상노년학과 geropsychology 보강 | Crossref 수집 확인 |
| Research on Aging | Hybrid; metadata accessible | 사회노년학, 생애과정, 건강 불평등, 정책 맥락 보강 | Crossref 수집 확인 |
| The International Journal of Aging and Human Development | Hybrid; metadata accessible | 생애발달, 적응, 정서, 사회관계 보강 | Crossref 수집 확인 |
| Aging, Neuropsychology, and Cognition | Hybrid; metadata accessible | 인지노화, 기억, 주의, 신경심리 보강 | Crossref 수집 확인 |
| Experimental Aging Research | Hybrid; metadata accessible | 실험노화, 인지·행동 변화 연구 보강 | Crossref 수집 확인 |
| Dementia | Hybrid; metadata accessible | 치매 경험, 가족, 서비스, 돌봄 맥락 보강 | Crossref 수집 확인 |
| International Psychogeriatrics | Hybrid; metadata accessible | 노년기 정신건강, 치매, psychogeriatrics 보강 | Crossref 수집 확인 |
| The Journals of Gerontology: Series A | Hybrid; metadata accessible | 건강, 기능, 질병 관련 gerontology 핵심 근거 보강 | Crossref 수집 확인 |
| Age and Ageing | Hybrid; metadata accessible | 임상노인의학 비중이 높지만 건강·기능·돌봄 근거 보강 | Crossref 수집 확인 |
| BMC Geriatrics | Open access | 오픈액세스 노년기 건강·돌봄·서비스 연구 보강 | Crossref 수집 확인 |
| Gerontology | Hybrid; metadata accessible | broad gerontology 핵심 저널, 심리 중심 분류 규칙으로 선별 수집 | Crossref 수집 확인 |

주의: 정확한 SSCI/JCR 전체 순위표는 보통 구독형 JCR에서 최종 확인해야 한다. 현재 프로토타입은 공개 공식 저널 페이지와 Crossref 수집 가능성을 기준으로 구성했다.

2차 확장 후보:

- `Geriatrics & Gerontology International`: 국제 노년의학·노년학 보강 후보
- `Aging Clinical and Experimental Research`: 임상·실험노화 보강 후보

## 확인된 로컬 상태

- 작업 폴더: `D:\PaperRev`
- 이 문서 작성 전 확인된 프로젝트 파일: 없음
- 디스크상 `AGENTS.md`: 현재 폴더에서는 발견되지 않음
- 사용자 제공 지침: 확인한 내용을 바탕으로 다음 단계 추천, 진행/남은 내용 체크, 프로젝트 내 진행 내용 기록 및 업데이트

## 제품 개념

PaperRev는 다음 세 가지 질문에 답하는 사이트여야 한다.

1. 최근 어떤 심리학 논문이 나왔는가?
2. 어떤 논문을 먼저 읽어볼 만한가?
3. 원 논문이나 DOI/메타데이터는 어디에서 확인할 수 있는가?

첫 버전은 거대한 학술 검색엔진이 아니라, 신뢰 가능한 출처에서 최근 논문을 모아 간결하게 보여주는 current-awareness 페이지로 시작한다.

### 방향 수정 메모

현재 정적 프로토타입은 데이터 구조와 수집 가능성을 확인하기 위한 1차 형태이며, 최종 사용자 경험의 중심은 검색창이 아니다. 사용자는 논문 데이터베이스를 직접 뒤지는 사람이 아니라, 이미 잘 정리된 노화 심리 카드뉴스 묶음을 읽는 독자로 가정한다.

다음 UX 개편 방향:

- 첫 화면은 검색 결과 목록보다 `이번 주 노화 심리 브리프`에 가깝게 구성한다.
- 논문은 인지노화, 정서노화, 사회적 노화, 치매/인지장애, 돌봄/가족, 건강행동/디지털헬스, 일/은퇴/연령주의 같은 하위 분야로 묶는다.
- 각 하위 분야는 1-3개의 핵심 카드로 요약한다.
- 개별 논문 카드는 원문 링크와 메타데이터를 유지하되, 전면에는 `핵심 질문`, `무엇을 했나`, `주요 결과`, `왜 중요한가`를 보여준다.
- 검색과 필터는 보조 기능으로 남기고, 기본 탐색은 편집된 카드뉴스 피드가 되도록 한다.

### 현재 프로토타입 정보 구조

```text
/
├─ 분야별 매거진 홈
│  ├─ 인지노화
│  ├─ 정서노화
│  ├─ 사회적 노화
│  ├─ 치매·인지장애
│  ├─ 돌봄·가족
│  ├─ 건강행동·디지털헬스
│  └─ 일·은퇴·연령주의
├─ 분야별 섹션
│  ├─ 이 분야의 질문
│  └─ 최신 카드뉴스
├─ 질문으로 읽기
│  ├─ 짧은 답
│  ├─ 공통 경향
│  └─ 남은 쟁점
├─ 논문 카드뉴스 예시
│  ├─ 핵심 질문
│  ├─ 무엇을 했나
│  ├─ 주요 결과
│  ├─ 왜 중요한가
│  └─ 조심해서 볼 점
└─ 원문 목록과 보조 검색
```

### 다음 UX 검토 포인트

- 홈의 `오늘 먼저 볼 카드`가 충분히 짧고 읽기 쉬운지 확인한다.
- 분야 탭/카드 선택 방식이 직관적인지 확인한다.
- 카드뉴스 가로 스크롤이 데스크톱과 모바일에서 실제 카드뉴스처럼 느껴지는지 확인한다.
- 원문 목록은 더 접어두거나 별도 상세 영역으로 분리할지 결정한다.

### 다음 동적 파이프라인 과제

- `data/drafts/article-drafts.json`을 사람이 검수한 뒤 `data/articles.json`으로 승격하는 게시 스크립트가 필요하다.
- 규칙 기반 초안은 영어 초록 문장을 한국어 프레임에 넣는 수준이므로, 자연스러운 한국어 요약을 위해 별도 요약 단계가 필요하다.
- draft preview/review 화면을 추가하면 게시 전 검수 흐름을 사이트 안에서 확인할 수 있다.
- GitHub Actions로 주기적 수집을 붙이려면 draft 파일을 자동 커밋할지, PR로 올릴지 결정해야 한다.

## 1차 MVP 범위

### 반드시 포함

- 선택한 심리학 저널 또는 심리학 관련 주제의 최신 논문 목록
- 논문 카드: 제목, 저널명, 출판일, 저자, DOI/출처 링크, 초록 유무, 한국어 요약
- 저널/주제/날짜/오픈액세스 여부 필터
- 수동 새로고침 또는 예약 수집 명령
- API를 매번 실시간 호출하지 않기 위한 로컬 캐시
- 각 논문별 출처 표시

### 있으면 좋은 기능

- 임상, 인지, 발달, 사회, 신경과학, 방법론, 리뷰/메타분석 등 독자용 태그
- 저널 매칭, 논문 유형, 오픈액세스 여부, 최신성 기반의 보수적 중요도 신호
- 요약을 게시 전 수정할 수 있는 로컬 검수 파일 또는 간단한 관리 화면

### MVP에서 제외

- 사용자 계정
- 개인화 추천
- 인용 네트워크 분석
- 출판사 웹사이트 전문 스크래핑
- 사람 검수 없는 임상적 함의 단정
- 다른 홈페이지와의 병합 작업

## 초기 독자 및 콘텐츠 가정

초기 독자:

- 한국어를 사용하는 심리학 연구자, 대학원생, 실무자
- 짧은 한국어 요약을 원하지만 원문 영어 논문 링크도 필요함
- 논문 수보다 출처 신뢰성과 선별 기준을 중시함

초기 콘텐츠 규칙:

- 저널 논문과 리뷰 논문을 우선 포함
- preprint는 사용자가 별도 섹션을 원하기 전까지 제외
- 처음에는 넓은 자동 수집보다 작은 저널/주제 allowlist로 시작

## 후보 데이터 소스

데이터 전략은 보수적으로 잡는다. 우선 메타데이터와 초록 기반으로만 요약하고, 모든 주장에는 원 출처 링크를 붙인다.

| 출처 | 역할 | 장점 | 주의점 |
| --- | --- | --- | --- |
| Crossref REST API | DOI 기반 광범위 메타데이터 수집 | 저널 ISSN별 works 조회, 날짜/색인 필터, DOI 중심 메타데이터 | 초록 제공이 불안정하고, 출판일만 기준으로 최신 논문을 잡으면 누락 가능 |
| OpenAlex API | 광범위한 공개 학술 색인 | 논문 유형, OA 여부, 주제/개념, 날짜 정렬/필터 활용 가능 | 주제 분류와 초록 완성도는 검증 필요 |
| PubMed / NCBI E-utilities | 임상/정신의학/건강심리/신경과학 인접 논문 | PubMed/PMC 공식 API, 의생명 분야 강점 | 심리학 전체 커버리지로는 부족 |
| Europe PMC | PMC 연계 검색 및 메타데이터 | 오픈 초록/전문 링크 확인에 유용 | 의생명 분야 중심 |
| DOAJ | 오픈액세스 저널/논문 확인 | OA 저널 메타데이터 확인에 유용 | 단독 데이터 소스로는 심리학 범위가 좁을 수 있음 |

현재 추천 경로:

1. 1차 MVP는 Crossref 또는 OpenAlex 중 하나를 주 데이터 소스로 선택한다.
2. 임상, 정신의학, 신경과학, 건강심리 쪽은 PubMed/Europe PMC를 보조 소스로 추가한다.
3. 오픈액세스 필터가 중요해지면 DOAJ 또는 OA 메타데이터 소스를 추가 검토한다.

## MVP 데이터 모델 초안

최소 논문 필드:

- `id`
- `doi`
- `title`
- `authors`
- `journal`
- `issn`
- `published_date`
- `source`
- `source_url`
- `abstract`
- `article_type`
- `open_access_status`
- `topics`
- `korean_summary`
- `summary_status`
- `ingested_at`
- `updated_at`

요약 상태:

- `raw_metadata`
- `needs_summary`
- `ai_draft`
- `human_reviewed`
- `published`

## 사이트 구조 초안

- `/` 최신 논문 대시보드
- `/topics/[topic]` 주제별 논문 목록
- `/journals/[journal]` 저널별 논문 목록
- `/articles/[id]` 논문 상세 페이지
- `/about` 출처 및 방법론 설명

## UX 방향

- 마케팅 랜딩 페이지가 아니라 논문을 바로 훑는 연구 대시보드로 설계
- 첫 화면에 최신 논문 목록을 바로 표시
- 필터와 논문 카드는 조밀하지만 읽기 쉽게 구성
- 방법론/출처 설명은 접근 가능하게 두되 보조 정보로 처리
- 원문/DOI/메타데이터 링크는 눈에 잘 보이게 배치

## 결정해야 할 기술 방향

### 선택지 1: 정적 우선 사이트

- 장점: 배포가 단순하고 빠르게 프로토타입 가능
- 적합한 경우: 하루 1회 또는 주 1회 업데이트
- 한계: 검수 흐름과 수집 자동화가 커지면 구조가 답답해질 수 있음

### 선택지 2: 작은 풀스택 앱

- 장점: 예약 수집, 로컬 DB, 검수/게시 흐름에 유리
- 적합한 경우: 계속 운영할 서비스로 키울 계획
- 한계: 초기 설정과 구현량이 늘어남

현재 추천:

- 먼저 정적 프로토타입으로 화면, 필터, 요약 형식을 검증한다.
- 그다음 수집/캐시/검수 흐름이 필요해지는 시점에 작은 풀스택 앱으로 확장한다.

## 바로 다음 단계

1. 첫 저널/주제 allowlist 정의
   - 완료 기준: 10-30개 대상 저널 또는 5-8개 심리학 주제 쿼리 확정

2. 첫 메타데이터 소스 선택
   - 완료 기준: MVP 수집에 사용할 1개 API와 보조 소스 1개 결정

3. 정적 프로토타입 제작
   - 완료 기준: 홈 화면에 현실적인 샘플 논문 카드, 필터, 상세 보기 구조 표시

4. 수집 PoC 구현
   - 완료 기준: 선택한 API에서 최근 논문을 가져와 정규화된 JSON으로 저장

5. 요약 워크플로 추가
   - 완료 기준: 논문 상태가 raw metadata -> ai draft -> human reviewed -> published로 이동 가능

## 열려 있는 질문

- 심리학 전체를 다룰지, 임상/인지/사회/발달/신경과학 등 특정 분야부터 시작할지
- 요약은 한국어만 둘지, 한국어 요약과 원문 영어 초록을 함께 보여줄지
- 업데이트 주기는 매일, 매주, 수동 중 무엇으로 할지
- 첫 버전에서 오픈액세스 논문만 포함할지, 유료 논문도 DOI/출처 링크와 함께 포함할지
- 개인/연구실 내부용인지, 공개 독자용인지

## 2026-05-20 외부 출처 확인 메모

- Crossref REST API는 공개 메타데이터 검색, 필터, 저널별 works 엔드포인트를 제공한다.
- Crossref 문서상 최신 수집에는 출판일만 쓰기보다 created/update/index date와 로컬 캐시를 고려해야 한다.
- OpenAlex works API는 논문 목록에서 필터, 날짜/인용/관련도 정렬, OA 여부 등을 사용할 수 있다.
- NCBI E-utilities는 PubMed/PMC 등 Entrez 데이터베이스 접근을 위한 공식 API다.
## 2026-05-24 진행 기록

- 노화 이론 섹션의 anchor 문헌 기준을 `대표 원전/핵심 이론 + 최신 핵심 실증논문 + 최신 메타분석`으로 재정리했다.
- `data/theory-papers.json`에 최신 실증/메타분석 후보 16개를 추가했고, 내부 참고문헌 seed는 총 68개가 되었다.
- `data/theory-notes.json`의 화면 노출용 `anchorWorkIds`를 이론별 3-5개로 제한했다.
- Continuity theory는 이론 자체를 직접 다루는 최근 메타분석/실증 anchor가 명확하지 않아, 기존 원전/핵심 확장 논문에 2019년 개념분석 논문을 최신 보조 anchor로 유지했다.
- JSON 검증 및 anchor ID 연결 검증 완료: 10개 이론 모두 missing anchor 없음.
- 공개-facing 문구 불일치를 줄이기 위해 히어로의 이번 호 구성 수치를 하드코딩에서 런타임 계산으로 변경했다.
- 메인 카드 제목을 반복 질문이 아니라 논문별 핵심 메시지로 표시하도록 바꾸고, `data/drafts/featured-curation.json`을 추가해 featured draft 35개의 한국어 카드 문장을 보정했다.
- 주간 자동 생성 스크립트가 앞으로 영어 초록 문장을 그대로 붙이지 않도록, 원문 문장 추출 대신 한국어 검수용 템플릿을 생성하게 수정했다.
- 수집 보관함은 메인 페이지의 접힘 목록에서 별도 `archive.html` 페이지로 분리했다. 메인에서는 CTA만 노출하고, 보관함 페이지에서 검색/분야/접근성 필터를 제공한다.

## 2026-05-24 분야 분류 규칙 및 featured 선정 점수화 업데이트

완료:

- `scripts/build-drafts.mjs`의 분야 분류 규칙을 단순 키워드 카운트에서 `strong / medium / weak / negative` 키워드와 저널 보정 점수를 함께 쓰는 방식으로 바꿨다.
- 각 논문 draft에 `topicScore`, `topicScores`, `classificationConfidence`를 저장해 왜 해당 분야로 분류됐는지 추적할 수 있게 했다.
- featured draft 선정 기준을 단순 최신순에서 `최신성 + 초록 충실도 + 분야 적합도 + 분류 신뢰도 + 연구설계 + 접근성 + 저널 우선순위` 합산 점수로 바꿨다.
- 각 논문 draft에 `featuredScore`와 `featuredSignals`를 저장해 featured 선정 근거를 검토할 수 있게 했다.
- 자동 생성 카드뉴스 기본 문구의 깨진 한국어 문자열을 새 생성분부터 정상 한국어 템플릿으로 덮어쓰도록 보정했다.
- `node scripts/build-drafts.mjs --windows=7,14,30,60,90,180 --rows=50 --min-topic-count=5 --draft-limit-per-topic=5 --archive-days=365`로 재생성했다.
- 재생성 결과: selected window 14일, total collected 133개, featured 35개, archive 98개.
- featured coverage는 7개 분야 모두 5개씩 유지된다.
- featured score 범위는 75-102점이며, featured 중 필수 점수 필드 누락과 낮은 분류 신뢰도 항목은 없었다.

남은 내용:

- 점수 기반 선정으로 featured 논문 구성이 바뀌었기 때문에 기존 `data/drafts/featured-curation.json`의 수동 보정 문구와 새 featured 목록이 완전히 일치하지 않는다. 현재는 일치하는 항목만 수동 보정을 적용하고, 나머지는 새 한국어 자동 템플릿을 사용한다.
- 다음 개선에서는 새 featured 목록을 기준으로 핵심 메시지 보정 작업을 다시 수행하거나, API 요약 연결 후 자동 보정 결과를 생성하는 흐름을 붙이는 것이 좋다.
- 분야 분류 점수와 featured 점수는 데이터에 저장되지만 아직 공개 화면에 직접 노출하지 않는다. 검수 화면을 만들 때 내부 판단 근거로 노출하면 된다.

다음 추천:

1. 새 점수 기반 featured 35개를 사용자 관점에서 훑어보고, 명백히 어색한 분야 배치가 있는지 1차 검수한다.
2. 검수 결과를 바탕으로 `TOPIC_RULES`의 negative keyword와 저널 보정값을 한 번 더 조정한다.
3. 그 다음 `featured-curation.json`을 새 featured 목록 기준으로 갱신하거나, OpenAI API 연결 이후 자동 한국어 핵심 메시지 생성으로 대체한다.

## 2026-05-24 featured 1차 검수 및 분류 규칙 2차 보정

완료:

- 새 featured 35개의 `topicId`, `featuredScore`, `topicScore`, `classificationConfidence`, 상위 3개 분야 점수를 함께 검수했다.
- `Health and Retirement Study`가 제목/초록에 포함된 생물학·의학 논문이 단순히 `retirement` 키워드 때문에 일·은퇴·연령주의로 들어가는 문제를 확인했다.
- `digital handwriting`, `kinematics`, `physical performance`, `community-dwelling` 조합의 논문이 사회적 노화로 들어가는 문제를 확인했다.
- `scripts/build-drafts.mjs`의 `TOPIC_RULES`를 보정했다.
  - 인지노화: `cognitive functioning`, `cognitive decline`, `cognitive trajectories`, `pentagon-copy` 보강.
  - 사회적 노화: `community`의 과대 분류를 줄이고, `digital handwriting`, `kinematics`, `physical performance`를 제외 신호로 추가.
  - 건강행동·디지털헬스: `fall risk`, `gait`, `balance`, `physical function`, `physical performance`, `digital handwriting`, `kinematics` 보강.
  - 일·은퇴·연령주의: `health and retirement study`, `polygenic`, `kidney function`, `immune aging`, `mortality`를 제외 신호로 추가.
- 같은 명령으로 draft를 재생성했다.
- 재생성 결과: selected window 30일, total collected 330개, featured 35개, archive 295개.
- 분야별 featured는 7개 분야 모두 5개씩 유지된다.

검수 결과:

- 명백한 오분류였던 `Digital Handwriting Kinematics and Physical Performance...`는 사회적 노화에서 건강행동·디지털헬스로 이동했다.
- `Evaluating the Predictive Utility of ... Polygenic Risk Scores for Kidney Function...`와 `Widowhood, Immune Aging, and Mortality...`는 일·은퇴·연령주의 featured에서 제외됐다.
- 일·은퇴·연령주의 분야는 오분류를 제거한 결과 14일 범위만으로 5개를 채우지 못해 30일 범위까지 확장됐다. 이는 분야별 최소 5개 확보 정책에 맞는 동작이다.
- 남은 애매한 사례는 교차 주제 성격이 강하다. 예: `Mindfulness and Rumination... Caregivers... Dementia`는 정서노화와 돌봄·가족이 겹치고, `Volunteering and cognitive functioning...`은 인지노화와 사회적 노화가 겹친다.

다음 추천:

1. 새 featured 35개 기준으로 `featured-curation.json`을 다시 맞춘다.
2. 이후 검수 화면에서 `topicScores`와 `featuredSignals`를 노출해, 사람이 “분야 유지/분야 변경/보류”를 판단할 수 있게 한다.
3. 교차 주제 논문은 단일 `topicId`만 쓰지 않고 `secondaryTopicIds`를 화면에 보조 배지로 표시하는 방식을 검토한다.

## 2026-05-24 새 featured 기준 curation 갱신

완료:

- `data/drafts/featured-curation.json`을 현재 featured 35개와 1:1로 맞춰 전면 갱신했다.
- 기존 파일에 남아 있던 이전 featured 키와 깨진 문자열을 제거했다.
- 35개 전체에 대해 읽을 수 있는 한국어 `cardTitle`과 5장 카드뉴스 deck(`question`, `method`, `finding`, `meaning`, `caution`)을 작성했다.
- `app.js`에 남아 있던 오래된 내장 curation fallback을 제거하고, JSON 데이터 fetch에 `cache: "no-store"`를 적용했다.
- `index.html`과 `archive.html`의 로컬 스크립트 URL에 버전 쿼리를 붙여 GitHub Pages에서 이전 JS가 캐시되어 보이는 문제를 줄였다.
- 검증 결과: featured 35개, curation 35개, 누락 0개, 초과 0개, 필수 deck 필드 누락 0개.

남은 내용:

- 일부 논문은 교차 주제 성격이 강하다. 예: 치매 가족돌봄자의 마음챙김 연구는 정서노화와 돌봄·가족이 겹치고, 자원봉사와 인지기능 연구는 인지노화와 사회적 노화가 겹친다.
- 다음 화면 개선에서는 `secondaryTopicIds` 또는 보조 분야 배지를 추가하면 사용자에게 더 자연스럽게 보일 수 있다.

다음 추천:

1. 검수용 preview/review 화면을 만든다.
2. 이 화면에서 `featuredScore`, `topicScores`, `classificationConfidence`, `featuredSignals`, curation deck을 함께 보여주고 “분야 유지/분야 변경/보류”를 선택할 수 있게 한다.
3. 그 뒤 OpenAI API 연결 시에는 이 검수 화면을 사람이 최종 승인하는 단계로 사용한다.

## 2026-05-27 자동 발행/예외 보류 정책 구현

목표:

- 매주 35개 카드뉴스를 사람이 전수 검수하지 않고 자동 발행한다.
- 위험한 카드만 별도 보류 큐로 분리해, 검수는 예외 처리 도구로만 사용한다.

완료:

- `scripts/build-drafts.mjs`에 `publishStatus`, `needsReview`, `qualityFlags`를 추가했다.
- `featuredDrafts`는 `publishStatus: "auto_publish"`인 논문 중에서만 분야별 5개씩 선정되도록 변경했다.
- 보류 대상은 `reviewRecords`에 별도로 저장한다.
- 전체 상태 집계용 `publishStatusCounts`, `qualityFlagCounts`, `reviewCount`를 `article-drafts.json`에 저장한다.
- 자동 생성 기본 카드 문구가 깨진 한국어로 생성되지 않도록 clean template 함수를 추가했다.
- `featured-curation.json`은 필수 검수 파일이 아니라, ID가 일치할 때만 문구를 덮어쓰는 선택적 보정 파일로 운용한다.

현재 보류 조건:

- `missing_abstract`: 초록 없음
- `short_abstract`: 초록이 너무 짧음
- `low_classification_confidence`: 분야 분류 신뢰도 낮음
- `topic_overlap`: 1위 분야와 2위 분야 점수 차이가 작음
- `low_featured_score`: featured 후보 점수 낮음
- `text_encoding_issue`: 깨진 문자열 감지

2026-05-27 재생성 결과:

- selected window: 30일
- total collected: 331개
- auto publish: 170개
- needs review: 161개
- featured: 35개
- archive: 296개
- featured 문제 항목: 0개
- featured 분야 분포: 7개 분야 모두 5개씩 유지

다음 추천:

1. GitHub Actions 주간 실행 결과에서도 `featuredProblemCount`가 0인지 확인한다.
2. `reviewRecords`는 공개 화면에 바로 노출하지 말고, 추후 내부 통계 또는 간단한 debug 페이지에서만 확인한다.
3. OpenAI API 연결 시 `auto_publish` 후보에만 카드뉴스 본문 생성을 적용하고, `needs_review` 후보는 비용을 쓰지 않도록 한다.
