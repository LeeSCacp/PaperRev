const curation = {};

const state = {
  topics: [],
  questions: [],
  articles: [],
  archiveArticles: [],
  theories: [],
  theoryNotes: [],
  theoryPapers: [],
  articleCuration: {},
  articleMeta: {},
  articleDataMode: "published",
  selectedTopicId: "cognitive-aging",
  selectedArticleId: null,
  selectedTheoryId: null,
  filters: {
    search: "",
    topic: "all",
    access: "all",
  },
};

const els = {
  topicGrid: document.querySelector("#topicGrid"),
  homeQuestionList: document.querySelector("#homeQuestionList"),
  homeArticleList: document.querySelector("#homeArticleList"),
  topicTabs: document.querySelector("#topicTabs"),
  topicDetail: document.querySelector("#topicDetail"),
  theoryList: document.querySelector("#theoryList"),
  theoryDetail: document.querySelector("#theoryDetail"),
  sourceList: document.querySelector("#sourceList"),
  dataNotice: document.querySelector("#dataNotice"),
  searchInput: document.querySelector("#searchInput"),
  topicFilter: document.querySelector("#topicFilter"),
  accessFilter: document.querySelector("#accessFilter"),
  articleCount: document.querySelector("#articleCount"),
  topicCount: document.querySelector("#topicCount"),
  issueWindow: document.querySelector("#issueWindow"),
  issueSummary: document.querySelector("#issueSummary"),
};

async function loadData() {
  const [topicsResponse, questionsResponse, theoriesResponse, theoryNotesResponse, theoryPapersResponse, curationResponse, articleData] =
    await Promise.all([
    fetch("./data/topics.json", { cache: "no-store" }),
    fetch("./data/questions.json", { cache: "no-store" }),
    fetch("./data/theories.json", { cache: "no-store" }),
    fetch("./data/theory-notes.json", { cache: "no-store" }),
    fetch("./data/theory-papers.json", { cache: "no-store" }),
    fetch("./data/drafts/featured-curation.json", { cache: "no-store" }),
    fetchArticleData(),
  ]);

  state.topics = await topicsResponse.json();
  state.questions = await questionsResponse.json();
  state.theories = await theoriesResponse.json();
  state.theoryNotes = (await theoryNotesResponse.json()).notes || [];
  state.theoryPapers = (await theoryPapersResponse.json()).theories || [];
  state.articleCuration = curationResponse.ok ? await curationResponse.json() : {};
  state.articleMeta = articleData.meta;
  state.articleDataMode = articleData.mode;
  state.articles = articleData.records.map(enrichArticle);
  state.archiveArticles = articleData.archiveRecords.map(enrichArticle);
  const firstTopicWithArticle = state.topics.find((topic) => articlesForTopic(topic.id).length > 0);
  state.selectedTopicId = firstTopicWithArticle?.id || state.topics[0]?.id || "cognitive-aging";
  state.selectedArticleId = articlesForTopic(state.selectedTopicId)[0]?.id || state.articles[0]?.id;
  state.selectedTheoryId = state.theories[0]?.id || null;
  populateFilters();
  render();
}

async function fetchArticleData() {
  const draftResponse = await fetch("./data/drafts/article-drafts.json", { cache: "no-store" });
  if (draftResponse.ok) {
    const draftPayload = await draftResponse.json();
    const featuredDrafts = Array.isArray(draftPayload.featuredDrafts)
      ? draftPayload.featuredDrafts
      : draftPayload.records;
    const archiveRecords = Array.isArray(draftPayload.archiveRecords) ? draftPayload.archiveRecords : [];
    if (Array.isArray(featuredDrafts) && featuredDrafts.length) {
      return {
        mode: "draft",
        meta: draftPayload,
        records: featuredDrafts,
        archiveRecords,
      };
    }
  }

  const publishedResponse = await fetch("./data/articles.json", { cache: "no-store" });
  const records = await publishedResponse.json();
  return {
    mode: "published",
    meta: {},
    records,
    archiveRecords: [],
  };
}

function enrichArticle(article) {
  const item = state.articleCuration[article.id] || curation[article.id] || {};
  return {
    ...article,
    cardTitle: item.cardTitle || article.cardTitle,
    topicId: item.topicId || article.topicId || "social-aging",
    secondaryTopicIds: item.secondaryTopicIds || article.secondaryTopicIds || [],
    questionIds: item.questionIds || article.questionIds || [],
    deck: item.deck || article.deck || {
      question: article.title,
      method: "초록 기반 자동 요약 대기 중입니다.",
      finding: article.koreanSummary,
      meaning: "이 논문이 노화 심리 연구에서 갖는 의미를 카드뉴스로 정리합니다.",
      caution: "원문 링크를 함께 제공해 세부 내용을 확인할 수 있습니다.",
    },
  };
}

function populateFilters() {
  if (!els.topicFilter) {
    return;
  }
  state.topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic.id;
    option.textContent = topic.name;
    els.topicFilter.append(option);
  });
}

function render() {
  els.articleCount.textContent = state.articles.length;
  els.topicCount.textContent = state.topics.length;
  els.issueWindow.textContent = state.articleMeta.selectedWindow
    ? `${state.articleMeta.selectedWindow}일`
    : "샘플";
  if (els.issueSummary) {
    els.issueSummary.textContent = `${state.topics.length}개 하위 분야 · ${state.articles.length}개 카드뉴스 · ${state.questions.length}개 독자 질문`;
  }
  renderDataNotice();
  renderTopicGrid();
  renderHomePreview();
  renderTopicTabs();
  renderTopicDetail();
  renderTheories();
  renderSources();
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderDataNotice() {
  if (state.articleDataMode === "draft") {
    const featuredCount = state.articleMeta.featuredCount || state.articles.length;
    const archiveCount = state.articleMeta.archiveCount || state.archiveArticles.length;
    const totalCollected = state.articleMeta.totalCollected || featuredCount + archiveCount;
    const coverage = state.articleMeta.sourceCoverageCounts || {};
    const sourceLabel = Object.entries(coverage)
      .filter(([, count]) => count > 0)
      .map(([source, count]) => `${source} ${count}건`)
      .join(" · ");
    els.dataNotice.innerHTML = `
      <p>
        최근 ${state.articleMeta.selectedWindow || "-"}일 범위에서 논문 ${totalCollected}개를 수집했고,
        자동 게시 기준을 통과한 <strong>카드뉴스 ${featuredCount}개</strong>를 메인에 표시합니다.
        메인에 포함하지 않은 ${archiveCount}개 논문은 최근 ${state.articleMeta.archiveDays || 365}일 기준 보관함에서 확인할 수 있습니다.
        ${sourceLabel ? `수집원 연결 상태: ${sourceLabel}.` : ""}
      </p>
    `;
    return;
  }

  els.dataNotice.innerHTML = `
    <p>현재 화면은 게시용 기본 데이터를 표시합니다.</p>
  `;
}

function renderTopicGrid() {
  els.topicGrid.innerHTML = state.topics
    .map((topic) => {
      const count = articlesForTopic(topic.id).length;
      return `
        <button class="topic-tile ${topic.color}" type="button" data-topic-id="${topic.id}">
          <span>${topic.kicker}</span>
          <strong>${topic.name}</strong>
          <p>${topic.description}</p>
          <em>${count}개 카드뉴스</em>
        </button>
      `;
    })
    .join("");

  els.topicGrid.querySelectorAll("[data-topic-id]").forEach((button) => {
    button.addEventListener("click", () => selectTopic(button.dataset.topicId));
  });
}

function renderHomePreview() {
  els.homeQuestionList.innerHTML = state.questions
    .slice(0, 3)
    .map(renderQuestionMini)
    .join("");

  els.homeArticleList.innerHTML = state.articles
    .slice(0, 3)
    .map(renderArticlePreview)
    .join("");
}

function renderTopicTabs() {
  els.topicTabs.innerHTML = state.topics
    .map(
      (topic) => `
        <button
          class="topic-tab ${topic.id === state.selectedTopicId ? "active" : ""}"
          type="button"
          data-topic-id="${topic.id}"
        >
          ${topic.name}
        </button>
      `,
    )
    .join("");

  els.topicTabs.querySelectorAll("[data-topic-id]").forEach((button) => {
    button.addEventListener("click", () => selectTopic(button.dataset.topicId));
  });
}

function renderTopicDetail() {
  const topic = topicById(state.selectedTopicId) || state.topics[0];
  const topicQuestions = questionsForTopic(topic.id);
  const topicArticles = articlesForTopic(topic.id);
  const selectedArticle =
    topicArticles.find((article) => article.id === state.selectedArticleId) ||
    topicArticles[0];

  if (selectedArticle) {
    state.selectedArticleId = selectedArticle.id;
  }

  els.topicDetail.innerHTML = `
    <section class="topic-section active-topic">
      <div class="topic-intro">
        <div>
          <p class="eyebrow">${topic.kicker}</p>
          <h2>${topic.name}</h2>
        </div>
        <p>${topic.editorPick}</p>
      </div>
      <div class="topic-body">
        <aside class="question-stack">
          <h3>질문으로 읽기</h3>
          ${topicQuestions.map(renderQuestionMini).join("") || "<p>질문 설계 대기 중입니다.</p>"}
        </aside>
        <section class="article-stack">
          <div class="stack-heading">
            <h3>최신 카드뉴스</h3>
            <span>${topicArticles.length}개</span>
          </div>
          <div class="paper-strip">
            ${topicArticles.map((article) => renderArticleSelector(article)).join("") || "<p>수집된 논문이 아직 없습니다.</p>"}
          </div>
        </section>
      </div>
    </section>
    ${selectedArticle ? renderArticleDeck(selectedArticle) : ""}
  `;

  els.topicDetail.querySelectorAll("[data-article-id]").forEach((button) => {
    button.addEventListener("click", () => selectArticle(button.dataset.articleId));
  });
}

function renderArticleDeck(article) {
  return `
    <section class="article-deck-shell">
      <div class="feature-summary">
        ${renderTopicBadges(article)}
        <h3>${displayCardTitle(article)}</h3>
        <p class="source-title">${article.title}</p>
        <p>${article.journal} · ${article.publishedDate} · ${formatAuthors(article.authors || [])}</p>
        ${renderSourceCoverage(article)}
        ${renderArticleLinks(article)}
      </div>
      <div class="deck-area">
        <div class="deck-toolbar">
          <strong>카드뉴스 5장</strong>
          <div class="deck-progress" aria-label="card progress">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          </div>
        </div>
        <div class="card-news-deck" aria-label="article card news" tabindex="0">
          ${renderDeckCard("1", "핵심 질문", article.deck.question, "circle-help")}
          ${renderDeckCard("2", "무엇을 했나", article.deck.method, "clipboard-list")}
          ${renderDeckCard("3", "핵심 메시지", article.deck.finding, "chart-no-axes-combined")}
          ${renderDeckCard("4", "왜 중요한가", article.deck.meaning, "sparkles")}
          ${renderDeckCard("5", "조심해서 볼 점", article.deck.caution, "triangle-alert")}
        </div>
        <p class="deck-scroll-hint">가로로 넘기며 읽을 수 있습니다.</p>
      </div>
    </section>
  `;
}

function renderTheories() {
  if (!els.theoryList || !els.theoryDetail) {
    return;
  }

  els.theoryList.innerHTML = state.theories
    .map((theory) => {
      const note = theoryNoteById(theory.id);
      const relatedTopics = theory.relatedTopicIds
        .map((topicId) => topicById(topicId))
        .filter(Boolean)
        .slice(0, 3);
      return `
        <button class="theory-card ${theory.id === state.selectedTheoryId ? "selected" : ""}" type="button" data-theory-id="${theory.id}">
          <div class="theory-card-top">
            <span class="badge">${theory.shortName}</span>
            <small>${theory.domain}</small>
          </div>
          <h3>${theory.name}</h3>
          <p>${note?.oneLine || theory.summary}</p>
          <div class="theory-why">
            <strong>핵심 질문</strong>
            <span>${note?.explainerDraft?.cardLead || theory.whyItMatters}</span>
          </div>
          <div class="theory-topic-list">
            ${relatedTopics.map((topic) => `<span class="badge ${topic.color}">${topic.name}</span>`).join("")}
          </div>
        </button>
      `;
    })
    .join("");

  els.theoryList.querySelectorAll("[data-theory-id]").forEach((button) => {
    button.addEventListener("click", () => selectTheory(button.dataset.theoryId));
  });

  renderTheoryDetail();
}

function renderTheoryDetail() {
  const theory = theoryById(state.selectedTheoryId) || state.theories[0];
  const note = theoryNoteById(theory?.id);
  const paperSet = theoryPaperSetById(theory?.id);
  if (!theory || !note) {
    els.theoryDetail.innerHTML = `
      <div class="empty-state">
        <h3>이론 상세 정리가 아직 없습니다.</h3>
        <p>theory-notes.json을 확인해 주세요.</p>
      </div>
    `;
    return;
  }

  const anchorWorks = note.anchorWorkIds
    .map((workId) => paperSet?.works.find((work) => work.id === workId))
    .filter(Boolean);

  els.theoryDetail.innerHTML = `
    <article class="theory-detail-panel">
      <div class="theory-detail-hero">
        <div>
          <p class="eyebrow">${theory.shortName} · ${theory.domain}</p>
          <h3>${theory.name}</h3>
          <p>${note.headline}</p>
        </div>
        <div class="theory-detail-summary">
          <strong>설명문 초안</strong>
          <span>${note.explainerDraft.short}</span>
        </div>
      </div>

      <div class="theory-detail-grid">
        ${renderTheoryBlock("핵심 주장", note.coreClaims.map((item) => `<li>${item}</li>`).join(""), "ol")}
        ${renderConceptBlock(note.keyConcepts)}
      </div>

      <div class="theory-flow-grid">
        <section class="theory-flow-card">
          <h4>주장과 개념의 흐름</h4>
          <ol>${note.conceptualFlow.map((item) => `<li>${item}</li>`).join("")}</ol>
        </section>
        <section class="theory-flow-card">
          <h4>다른 이론과의 관련성</h4>
          <div class="relation-list">
            ${note.relations
              .map((relation) => {
                const target = theoryById(relation.targetTheoryId);
                return `
                  <article>
                    <strong>${target?.name || relation.targetTheoryId}</strong>
                    <p>${relation.relation}</p>
                  </article>
                `;
              })
              .join("")}
          </div>
        </section>
      </div>

      <div class="theory-detail-grid">
        ${renderTheoryBlock("한계와 주의점", note.limitations.map((item) => `<li>${item}</li>`).join(""), "ul")}
        <section class="theory-flow-card anchor-work-card">
          <h4>화면 노출용 anchor 문헌</h4>
          <p>전체 대표 문헌은 내부 seed로 유지하고, 이론 설명에는 원전, 핵심 이론, 최신 실증/메타분석 anchor 3-5개만 노출합니다.</p>
          <div class="anchor-work-list">
            ${anchorWorks.map(renderAnchorWork).join("")}
          </div>
        </section>
      </div>
    </article>
  `;
}

function renderTheoryBlock(title, body, listType) {
  return `
    <section class="theory-flow-card">
      <h4>${title}</h4>
      <${listType}>${body}</${listType}>
    </section>
  `;
}

function renderConceptBlock(concepts) {
  return `
    <section class="theory-flow-card">
      <h4>대표 개념</h4>
      <div class="concept-list">
        ${concepts
          .map(
            (concept) => `
              <article>
                <strong>${concept.term}</strong>
                <p>${concept.meaningKo}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderAnchorWork(work) {
  return `
    <article class="anchor-work">
      <span class="badge">${formatAnchorRole(work.role)}</span>
      <p>${work.citation}</p>
      <a href="${work.url}" target="_blank" rel="noreferrer">${work.doi ? `DOI ${work.doi}` : "서지 링크"}</a>
    </article>
  `;
}

function renderSources() {
  if (!els.sourceList) {
    return;
  }
  const visibleArticles = filteredArticles();
  if (!visibleArticles.length) {
    els.sourceList.innerHTML = `
      <div class="empty-state">
        <h3>조건에 맞는 보관 논문이 없습니다.</h3>
        <p>카드뉴스 draft에 포함된 논문은 이 보관함에서 제외됩니다.</p>
      </div>
    `;
    return;
  }

  els.sourceList.innerHTML = visibleArticles
    .map((article) => {
      return `
        <article class="source-row">
          <div>
            ${renderTopicBadges(article)}
            <h3>${article.title}</h3>
            <p>${article.journal} · ${article.publishedDate} · ${formatAuthors(article.authors || [])}</p>
            ${renderSourceCoverage(article)}
          </div>
          ${renderArticleLinks(article)}
        </article>
      `;
    })
    .join("");
}

function renderQuestionMini(question) {
  return `
    <article class="mini-question">
      <strong>${question.question}</strong>
      <p>${question.shortAnswer}</p>
    </article>
  `;
}

function renderArticlePreview(article) {
  return `
    <article class="paper-card">
      <div>
        ${renderTopicBadges(article)}
        <h4>${displayCardTitle(article)}</h4>
        <p>${article.deck.finding}</p>
      </div>
      <div class="paper-card-footer">
        <span>${article.journal}</span>
        <a href="${article.url}" target="_blank" rel="noreferrer">원문 보기</a>
      </div>
    </article>
  `;
}

function renderArticleSelector(article) {
  return `
    <button
      class="paper-card selector ${article.id === state.selectedArticleId ? "selected" : ""}"
      type="button"
      data-article-id="${article.id}"
    >
      ${renderTopicBadges(article)}
      <h4>${displayCardTitle(article)}</h4>
      <p>${article.deck.finding}</p>
      <span class="paper-card-footer">${article.journal}</span>
    </button>
  `;
}

function renderDeckCard(number, title, body, icon) {
  return `
    <article class="deck-card">
      <div class="deck-card-top">
        <span>${number}</span>
        <i data-lucide="${icon}"></i>
      </div>
      <h4>${title}</h4>
      <p>${body}</p>
    </article>
  `;
}

function renderTopicBadges(article) {
  const primaryTopic = topicById(article.topicId);
  const secondaryTopics = (article.secondaryTopicIds || [])
    .map((topicId) => topicById(topicId))
    .filter(Boolean);
  return `
    <div class="topic-badge-row">
      <span class="badge ${primaryTopic?.color || ""}">${primaryTopic?.name || "노화 심리"}</span>
      ${secondaryTopics.map((topic) => `<span class="badge subtle ${topic.color}">+ ${topic.name}</span>`).join("")}
      <span class="badge ${article.access === "open" ? "green" : "gold"}">
        ${article.access === "open" ? "Open access" : "Metadata/abstract"}
      </span>
    </div>
  `;
}

function renderSourceCoverage(article) {
  const coverage = article.sourceCoverage || ["Crossref"];
  if (!coverage.length) {
    return "";
  }
  return `<p class="source-coverage">수집원: ${coverage.join(" · ")}</p>`;
}

function renderArticleLinks(article) {
  const links = article.sourceLinks || {};
  const doiUrl = links.openAccess || article.url;
  const crossrefUrl = links.crossref || article.crossrefUrl;
  const items = [
    { label: "원문/DOI", url: doiUrl, icon: "external-link", primary: true },
    { label: "Crossref", url: crossrefUrl, icon: "database" },
    { label: "OpenAlex", url: links.openAlex, icon: "network" },
    { label: "PubMed", url: links.pubMed || links.pubMedSearch, icon: "library" },
  ].filter((item) => item.url);

  return `
    <div class="article-actions">
      ${items
        .map(
          (item) => `
            <a class="button-link ${item.primary ? "primary" : ""}" href="${item.url}" target="_blank" rel="noreferrer">
              <i data-lucide="${item.icon}"></i>
              ${item.label}
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function displayCardTitle(article) {
  return article.cardTitle || article.deck?.headline || article.deck?.question || article.title;
}

function formatAnchorRole(role = "") {
  const labels = {
    origin_concept: "대표 원전",
    origin_article: "대표 원전",
    origin_book: "대표 원전",
    origin_core_theory: "핵심 이론",
    core_theory: "핵심 이론",
    core_model_origin: "핵심 이론",
    core_model_statement: "핵심 이론",
    stereotype_embodiment_theory: "핵심 이론",
    contemporary_synthesis: "현대 종합",
    consensus_definition: "합의 정의",
    empirical_extension: "핵심 실증",
    recent_empirical: "최신 실증",
    recent_empirical_qualitative: "최신 실증",
    recent_empirical_multicohort: "최신 실증",
    recent_meta_analysis: "최신 메타분석",
    meta_analysis: "메타분석",
    recent_scoping_review: "최신 범위문헌고찰",
    review: "핵심 리뷰",
    critical_review: "비판적 리뷰",
    critical_extension: "비판적 확장",
    concept_analysis: "개념분석",
  };
  return labels[role] || role.replaceAll("_", " ");
}

function selectTopic(topicId) {
  state.selectedTopicId = topicId;
  state.selectedArticleId = articlesForTopic(topicId)[0]?.id || state.selectedArticleId;
  renderTopicTabs();
  renderTopicDetail();
  if (window.lucide) {
    window.lucide.createIcons();
  }
  document.querySelector("#detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectArticle(articleId) {
  state.selectedArticleId = articleId;
  renderTopicDetail();
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function selectTheory(theoryId) {
  state.selectedTheoryId = theoryId;
  renderTheories();
  if (window.lucide) {
    window.lucide.createIcons();
  }
  document.querySelector("#theoryDetail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function filteredArticles() {
  const term = state.filters.search.trim().toLowerCase();
  return state.archiveArticles.filter((article) => {
    const topicMatch =
      state.filters.topic === "all" ||
      article.topicId === state.filters.topic ||
      (article.secondaryTopicIds || []).includes(state.filters.topic);
    const accessMatch = state.filters.access === "all" || article.access === state.filters.access;
    const searchable = [
      article.title,
      article.journal,
      article.koreanSummary,
      (article.authors || []).join(" "),
      (article.topics || []).join(" "),
      (article.sourceCoverage || []).join(" "),
      (article.openAlex?.concepts || []).map((concept) => concept.name).join(" "),
      (article.openAlex?.topics || []).map((topic) => topic.name).join(" "),
      article.deck.question,
      article.deck.finding,
    ]
      .join(" ")
      .toLowerCase();
    return topicMatch && accessMatch && searchable.includes(term);
  });
}

function articlesForTopic(topicId) {
  return state.articles.filter((article) => article.topicId === topicId);
}

function questionsForTopic(topicId) {
  return state.questions.filter((question) => question.topicId === topicId);
}

function topicById(topicId) {
  return state.topics.find((topic) => topic.id === topicId);
}

function theoryById(theoryId) {
  return state.theories.find((theory) => theory.id === theoryId);
}

function theoryNoteById(theoryId) {
  return state.theoryNotes.find((note) => note.theoryId === theoryId);
}

function theoryPaperSetById(theoryId) {
  return state.theoryPapers.find((paperSet) => paperSet.theoryId === theoryId);
}

function formatAuthors(authors) {
  authors = authors || [];
  if (authors.length <= 3) {
    return authors.join(", ");
  }
  return `${authors.slice(0, 3).join(", ")} 외`;
}

els.searchInput?.addEventListener("input", (event) => {
  state.filters.search = event.target.value;
  renderSources();
});

els.topicFilter?.addEventListener("change", (event) => {
  state.filters.topic = event.target.value;
  renderSources();
});

els.accessFilter?.addEventListener("change", (event) => {
  state.filters.access = event.target.value;
  renderSources();
});

loadData().catch((error) => {
  document.querySelector("main").innerHTML = `
    <section class="section-block">
      <div class="empty-state">
        <h2>데이터를 불러오지 못했습니다.</h2>
        <p>${error.message}</p>
      </div>
    </section>
  `;
});
