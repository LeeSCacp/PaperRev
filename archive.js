const state = {
  topics: [],
  records: [],
  meta: {},
  visibleLimit: 30,
  pageSize: 30,
  filters: {
    search: "",
    topic: "all",
    access: "all",
  },
};

const els = {
  archiveCount: document.querySelector("#archiveCount"),
  archiveWindow: document.querySelector("#archiveWindow"),
  featuredCount: document.querySelector("#featuredCount"),
  searchInput: document.querySelector("#searchInput"),
  topicFilter: document.querySelector("#topicFilter"),
  accessFilter: document.querySelector("#accessFilter"),
  sourceList: document.querySelector("#sourceList"),
  archiveListStatus: document.querySelector("#archiveListStatus"),
  loadMoreArchive: document.querySelector("#loadMoreArchive"),
};

async function loadArchive() {
  const [topicsResponse, archiveData] = await Promise.all([
    fetch("./data/topics.json", { cache: "no-store" }),
    fetchArchiveData(),
  ]);

  state.topics = await topicsResponse.json();
  state.meta = archiveData;
  state.records = Array.isArray(state.meta.archiveRecords) ? state.meta.archiveRecords : [];
  populateTopicFilter();
  renderArchive();
}

async function fetchArchiveData() {
  const archiveResponse = await fetch("./data/drafts/archive-records.json", { cache: "no-store" });
  if (archiveResponse.ok) {
    const archivePayload = await archiveResponse.json();
    return {
      ...archivePayload,
      archiveRecords: Array.isArray(archivePayload.archiveRecords)
        ? archivePayload.archiveRecords
        : archivePayload.records || [],
    };
  }

  const draftResponse = await fetch("./data/drafts/article-drafts.json", { cache: "no-store" });
  const draftPayload = await draftResponse.json();
  return {
    ...draftPayload,
    archiveRecords: Array.isArray(draftPayload.archiveRecords) ? draftPayload.archiveRecords : [],
  };
}

function populateTopicFilter() {
  state.topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic.id;
    option.textContent = topic.name;
    els.topicFilter.append(option);
  });
}

function renderArchive() {
  const visibleRecords = filteredRecords();
  const renderedRecords = visibleRecords.slice(0, state.visibleLimit);
  els.archiveCount.textContent = state.records.length;
  els.archiveWindow.textContent = `${state.meta.archiveDays || 365}일`;
  els.featuredCount.textContent = state.meta.featuredCount || 0;

  if (!visibleRecords.length) {
    renderListControls(0, 0);
    els.sourceList.innerHTML = `
      <div class="empty-state">
        <h3>조건에 맞는 보관 논문이 없습니다.</h3>
        <p>검색어 또는 필터를 조정해 주세요.</p>
      </div>
    `;
    return;
  }

  renderListControls(renderedRecords.length, visibleRecords.length);
  els.sourceList.innerHTML = renderedRecords.map(renderSourceRow).join("");
}

function renderListControls(renderedCount, totalCount) {
  if (els.archiveListStatus) {
    els.archiveListStatus.textContent = totalCount
      ? `${totalCount}개 중 ${renderedCount}개 표시`
      : "표시할 논문이 없습니다";
  }

  if (els.loadMoreArchive) {
    els.loadMoreArchive.hidden = renderedCount >= totalCount;
    els.loadMoreArchive.textContent = `더 보기 ${Math.min(state.pageSize, Math.max(totalCount - renderedCount, 0))}개`;
  }
}

function resetVisibleLimit() {
  state.visibleLimit = state.pageSize;
}

function showMoreRecords() {
  state.visibleLimit += state.pageSize;
  renderArchive();
}

function renderSourceRow(article) {
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
}

function filteredRecords() {
  const term = state.filters.search.trim().toLowerCase();
  return state.records.filter((article) => {
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
    ]
      .join(" ")
      .toLowerCase();
    return topicMatch && accessMatch && searchable.includes(term);
  });
}

function topicById(topicId) {
  return state.topics.find((topic) => topic.id === topicId);
}

function renderTopicBadges(article) {
  const primaryTopic = topicById(article.topicId);
  const secondaryTopics = (article.secondaryTopicIds || [])
    .map((topicId) => topicById(topicId))
    .filter(Boolean);
  return `
    <div class="topic-badge-row">
      <span class="badge ${primaryTopic?.color || ""}">${primaryTopic?.name || "분류 대기"}</span>
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
    { label: "원문/DOI", url: doiUrl, primary: true },
    { label: "Crossref", url: crossrefUrl },
    { label: "OpenAlex", url: links.openAlex },
    { label: "PubMed", url: links.pubMed || links.pubMedSearch },
  ].filter((item) => item.url);

  return `
    <div class="article-actions">
      ${items
        .map(
          (item) => `
            <a class="button-link ${item.primary ? "primary" : ""}" href="${item.url}" target="_blank" rel="noreferrer">
              ${item.label}
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function formatAuthors(authors) {
  if (authors.length <= 3) {
    return authors.join(", ");
  }
  return `${authors.slice(0, 3).join(", ")} 외`;
}

els.searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value;
  resetVisibleLimit();
  renderArchive();
});

els.topicFilter.addEventListener("change", (event) => {
  state.filters.topic = event.target.value;
  resetVisibleLimit();
  renderArchive();
});

els.accessFilter.addEventListener("change", (event) => {
  state.filters.access = event.target.value;
  resetVisibleLimit();
  renderArchive();
});

els.loadMoreArchive?.addEventListener("click", showMoreRecords);

loadArchive().catch((error) => {
  document.querySelector("main").innerHTML = `
    <section class="section-block">
      <div class="empty-state">
        <h2>보관함 데이터를 불러오지 못했습니다.</h2>
        <p>${error.message}</p>
      </div>
    </section>
  `;
});
