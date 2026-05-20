# PaperRev

Gerontology/Aging 분야의 최신 저널 논문을 수집하고 한국어 브리프 형태로 보여주는 정적 웹사이트 프로토타입입니다.

## 현재 범위

- 주제: Gerontology, Aging
- 1차 저널: JMIR Aging, Innovation in Aging, The Gerontologist, The Journals of Gerontology: Series B
- 데이터 확인: Crossref에서 최신 논문 메타데이터 수집 가능 확인
- 배포 전제: GitHub Pages

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

## 다음 구현 과제

- Crossref 결과를 `data/articles.json` 형식으로 자동 정규화
- 초록에서 JATS 태그 제거 및 요약 후보 생성
- 사람이 검수한 요약만 게시하는 상태 관리
- GitHub Actions를 이용한 주기적 수집 자동화
