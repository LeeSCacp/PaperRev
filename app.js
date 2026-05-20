const state = {
  journals: [],
  articles: [],
  filters: {
    search: "",
    journal: "all",
    topic: "all",
    access: "all",
  },
};

const els = {
  searchInput: document.querySelector("#searchInput"),
  journalFilter: document.querySelector("#journalFilter"),
  topicFilter: document.querySelector("#topicFilter"),
  accessFilter: document.querySelector("#accessFilter"),
  journalList: document.querySelector("#journalList"),
  articleList: document.querySelector("#articleList"),
  articleCount: document.querySelector("#articleCount"),
  openCount: document.querySelector("#openCount"),
};

async function loadData() {
  const [journalsResponse, articlesResponse] = await Promise.all([
    fetch("./data/journals.json"),
    fetch("./data/articles.json"),
  ]);

  state.journals = await journalsResponse.json();
  state.articles = await articlesResponse.json();
  populateFilters();
  render();
}

function populateFilters() {
  state.journals.forEach((journal) => {
    const option = document.createElement("option");
    option.value = journal.id;
    option.textContent = journal.shortName;
    els.journalFilter.append(option);
  });

  const topics = new Set(state.articles.flatMap((article) => article.topics));
  [...topics].sort().forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    els.topicFilter.append(option);
  });
}

function render() {
  const visibleArticles = filterArticles();
  renderJournals();
  renderArticles(visibleArticles);
  els.articleCount.textContent = visibleArticles.length;
  els.openCount.textContent = visibleArticles.filter((article) => article.access === "open").length;
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function filterArticles() {
  const term = state.filters.search.trim().toLowerCase();

  return state.articles.filter((article) => {
    const journalMatch =
      state.filters.journal === "all" || article.journalId === state.filters.journal;
    const topicMatch =
      state.filters.topic === "all" || article.topics.includes(state.filters.topic);
    const accessMatch =
      state.filters.access === "all" || article.access === state.filters.access;

    const searchable = [
      article.title,
      article.journal,
      article.koreanSummary,
      article.authors.join(" "),
      article.topics.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return journalMatch && topicMatch && accessMatch && searchable.includes(term);
  });
}

function renderJournals() {
  els.journalList.innerHTML = state.journals
    .map(
      (journal) => `
        <article class="journal-card">
          <h3>${journal.name}</h3>
          <p>${journal.selectionNote}</p>
          <div class="badge-row">
            <span class="badge">${journal.accessLabel}</span>
            <span class="badge blue">ISSN ${journal.issn}</span>
            <span class="badge rose">${journal.metric}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderArticles(articles) {
  if (!articles.length) {
    els.articleList.innerHTML = `
      <article class="article-card">
        <h3>조건에 맞는 논문이 없습니다.</h3>
        <p class="summary">검색어나 필터를 조정해 주세요.</p>
      </article>
    `;
    return;
  }

  els.articleList.innerHTML = articles
    .map(
      (article) => `
        <article class="article-card">
          <div class="article-topline">
            <span class="badge ${article.access === "open" ? "" : "gold"}">
              ${article.access === "open" ? "Open access" : "Metadata/abstract"}
            </span>
            ${article.topics.map((topic) => `<span class="badge blue">${topic}</span>`).join("")}
          </div>
          <div>
            <h3>${article.title}</h3>
            <div class="article-meta">
              <span>${article.journal}</span>
              <span>${article.publishedDate}</span>
              <span>${formatAuthors(article.authors)}</span>
            </div>
          </div>
          <p class="summary">${article.koreanSummary}</p>
          <div class="article-actions">
            <a class="button-link primary" href="${article.url}" target="_blank" rel="noreferrer">
              <i data-lucide="external-link"></i>
              원문/DOI
            </a>
            <a class="button-link" href="${article.crossrefUrl}" target="_blank" rel="noreferrer">
              <i data-lucide="database"></i>
              Crossref
            </a>
          </div>
        </article>
      `,
    )
    .join("");
}

function formatAuthors(authors) {
  if (authors.length <= 3) {
    return authors.join(", ");
  }
  return `${authors.slice(0, 3).join(", ")} 외`;
}

els.searchInput.addEventListener("input", (event) => {
  state.filters.search = event.target.value;
  render();
});

els.journalFilter.addEventListener("change", (event) => {
  state.filters.journal = event.target.value;
  render();
});

els.topicFilter.addEventListener("change", (event) => {
  state.filters.topic = event.target.value;
  render();
});

els.accessFilter.addEventListener("change", (event) => {
  state.filters.access = event.target.value;
  render();
});

loadData().catch((error) => {
  els.articleList.innerHTML = `
    <article class="article-card">
      <h3>데이터를 불러오지 못했습니다.</h3>
      <p class="summary">${error.message}</p>
    </article>
  `;
});
