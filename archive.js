const state = {
  topics: [],
  records: [],
  meta: {},
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
};

async function loadArchive() {
  const [topicsResponse, draftResponse] = await Promise.all([
    fetch("./data/topics.json"),
    fetch("./data/drafts/article-drafts.json"),
  ]);

  state.topics = await topicsResponse.json();
  state.meta = await draftResponse.json();
  state.records = Array.isArray(state.meta.archiveRecords) ? state.meta.archiveRecords : [];
  populateTopicFilter();
  renderArchive();
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
  els.archiveCount.textContent = state.records.length;
  els.archiveWindow.textContent = `${state.meta.archiveDays || 365}일`;
  els.featuredCount.textContent = state.meta.featuredCount || 0;

  if (!visibleRecords.length) {
    els.sourceList.innerHTML = `
      <div class="empty-state">
        <h3>조건에 맞는 보관 논문이 없습니다.</h3>
        <p>검색어 또는 필터를 조정해 주세요.</p>
      </div>
    `;
    return;
  }

  els.sourceList.innerHTML = visibleRecords.map(renderSourceRow).join("");
}

function renderSourceRow(article) {
  const topic = topicById(article.topicId);
  return `
    <article class="source-row">
      <div>
        <span class="badge ${topic?.color || ""}">${topic?.name || "분류 대기"}</span>
        <h3>${article.title}</h3>
        <p>${article.journal} · ${article.publishedDate} · ${formatAuthors(article.authors || [])}</p>
      </div>
      <div class="article-actions">
        <a class="button-link primary" href="${article.url}" target="_blank" rel="noreferrer">DOI</a>
        <a class="button-link" href="${article.crossrefUrl}" target="_blank" rel="noreferrer">Crossref</a>
      </div>
    </article>
  `;
}

function filteredRecords() {
  const term = state.filters.search.trim().toLowerCase();
  return state.records.filter((article) => {
    const topicMatch = state.filters.topic === "all" || article.topicId === state.filters.topic;
    const accessMatch = state.filters.access === "all" || article.access === state.filters.access;
    const searchable = [
      article.title,
      article.journal,
      article.koreanSummary,
      (article.authors || []).join(" "),
      (article.topics || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return topicMatch && accessMatch && searchable.includes(term);
  });
}

function topicById(topicId) {
  return state.topics.find((topic) => topic.id === topicId);
}

function formatAuthors(authors) {
  if (authors.length <= 3) {
    return authors.join(", ");
  }
  return `${authors.slice(0, 3).join(", ")} 외`;
}

els.searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value;
  renderArchive();
});

els.topicFilter.addEventListener("change", (event) => {
  state.filters.topic = event.target.value;
  renderArchive();
});

els.accessFilter.addEventListener("change", (event) => {
  state.filters.access = event.target.value;
  renderArchive();
});

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
