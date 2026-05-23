import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_WINDOWS = [7, 14, 30, 60, 90, 180];
const DEFAULT_ROWS = 50;
const DEFAULT_MIN_TOPIC_COUNT = 5;
const DEFAULT_DRAFT_LIMIT_PER_TOPIC = 5;
const DEFAULT_ARCHIVE_DAYS = 365;
const USER_AGENT = "PaperRev prototype; mailto=paperrev@example.com";

const TOPIC_RULES = {
  "cognitive-aging": [
    "cognition",
    "cognitive",
    "memory",
    "attention",
    "executive",
    "processing speed",
    "dual-task",
    "neuropsychological",
    "brain",
  ],
  "emotional-aging": [
    "emotion",
    "emotional",
    "depression",
    "depressive",
    "anxiety",
    "mental health",
    "well-being",
    "loneliness",
    "stress",
    "quality of life",
  ],
  "social-aging": [
    "social",
    "culture",
    "cultural",
    "relationship",
    "community",
    "isolation",
    "old age",
    "age perception",
    "environment",
    "urban",
  ],
  "dementia-cognitive-impairment": [
    "dementia",
    "alzheimer",
    "mci",
    "mild cognitive impairment",
    "cognitive impairment",
    "case-finding",
    "screening",
    "diagnosis",
  ],
  "caregiving-family": [
    "caregiver",
    "caregiving",
    "carer",
    "family",
    "unpaid care",
    "transition",
    "hospital-to-home",
    "unmet need",
    "support",
  ],
  "digital-health-behavior": [
    "digital",
    "web-based",
    "technology",
    "app",
    "mobile",
    "exercise",
    "physical activity",
    "falls",
    "driving",
    "health behavior",
    "intervention",
  ],
  "work-retirement-ageism": [
    "work",
    "worker",
    "employment",
    "retirement",
    "ageism",
    "age-inclusive",
    "manager",
    "labour",
    "labor",
  ],
};

const QUESTION_RULES = {
  "does-memory-always-decline": ["memory", "cognitive", "cognition", "dual-task", "attention"],
  "what-supports-mental-health": ["mental health", "depression", "well-being", "urban", "environment"],
  "how-does-society-define-old-age": ["old age", "retirement", "employment", "age perception"],
  "what-happens-after-screening": ["screening", "case-finding", "diagnosis", "mci", "cognitive impairment"],
  "what-do-caregivers-need": ["caregiver", "caregiving", "carer", "family", "unmet need", "support"],
  "can-digital-health-help": ["digital", "web-based", "technology", "app", "mobile", "driving"],
  "can-ageism-change": ["ageism", "age-inclusive", "worker", "manager", "employment"],
  "how-culture-shapes-care": ["culture", "cultural", "latino", "family", "caregiving"],
};

const args = parseArgs(process.argv.slice(2));
const windows = parseWindows(args.windows || args.days || DEFAULT_WINDOWS.join(","));
const rows = Number.parseInt(args.rows || `${DEFAULT_ROWS}`, 10);
const minTopicCount = Number.parseInt(args.minTopicCount || args["min-topic-count"] || `${DEFAULT_MIN_TOPIC_COUNT}`, 10);
const draftLimitPerTopic = Number.parseInt(
  args.draftLimitPerTopic || args["draft-limit-per-topic"] || `${DEFAULT_DRAFT_LIMIT_PER_TOPIC}`,
  10,
);
const archiveDays = Number.parseInt(args.archiveDays || args["archive-days"] || `${DEFAULT_ARCHIVE_DAYS}`, 10);
const untilDate = args.until ? new Date(`${args.until}T00:00:00Z`) : new Date();

const journals = await readJson("data/journals.json");
const topics = await readJson("data/topics.json");
const questions = await readJson("data/questions.json");

const rawByDoi = new Map();
let selectedWindow = windows[windows.length - 1];
let lastCoverage = {};

for (const dayWindow of windows) {
  const fromDate = isoDate(addDays(untilDate, -(dayWindow - 1)));
  const fetched = await fetchWindow(dayWindow, fromDate);
  for (const record of fetched) {
    const doi = normalizeDoi(record.DOI);
    if (!doi || rawByDoi.has(doi)) {
      continue;
    }
    rawByDoi.set(doi, record);
  }

  const normalized = [...rawByDoi.values()].map(normalizeRecord).filter(Boolean);
  const classified = normalized.map(classifyAndDraft);
  lastCoverage = coverageByTopic(classified);
  selectedWindow = dayWindow;

  if (topics.every((topic) => lastCoverage[topic.id] >= minTopicCount)) {
    break;
  }
}

const normalizedDrafts = [...rawByDoi.values()]
  .map(normalizeRecord)
  .filter(Boolean)
  .map(classifyAndDraft)
  .sort(sortByDateDesc);
const { featuredDrafts, archiveRecords } = splitFeaturedAndArchive(normalizedDrafts);
const featuredCoverageByTopic = coverageByTopic(featuredDrafts);

const output = {
  generatedAt: new Date().toISOString(),
  source: "Crossref",
  windowsTried: windows,
  selectedWindow,
  minTopicCount,
  draftLimitPerTopic,
  archiveDays,
  coverageByTopic: lastCoverage,
  featuredCoverageByTopic,
  totalCollected: normalizedDrafts.length,
  featuredCount: featuredDrafts.length,
  archiveCount: archiveRecords.length,
  records: featuredDrafts,
  featuredDrafts,
  archiveRecords,
};

await mkdir(path.join(ROOT, "data", "raw"), { recursive: true });
await mkdir(path.join(ROOT, "data", "drafts"), { recursive: true });
await writeJson("data/raw/crossref-latest.json", {
  generatedAt: output.generatedAt,
  source: "Crossref",
  windowsTried: windows,
  selectedWindow,
  minTopicCount,
  draftLimitPerTopic,
  archiveDays,
  totalCollected: normalizedDrafts.length,
  records: [...rawByDoi.values()],
});
await writeJson("data/drafts/article-drafts.json", output);

console.log(`Saved ${normalizedDrafts.length} drafts to data/drafts/article-drafts.json`);
console.log(`Featured drafts: ${featuredDrafts.length}; archive records: ${archiveRecords.length}`);
console.log(`Windows tried: ${windows.join(", ")} days; selected window: ${selectedWindow} days`);
console.log(`Minimum topic target: ${minTopicCount}`);
console.log(`Featured draft limit per topic: ${draftLimitPerTopic}; archive days: ${archiveDays}`);
console.log("Coverage by topic:");
for (const topic of topics) {
  console.log(`- ${topic.name}: ${lastCoverage[topic.id] || 0}`);
}

async function fetchWindow(dayWindow, fromDate) {
  const records = [];
  for (const journal of journals) {
    const endpoint = journal.crossrefEndpoint;
    if (!endpoint) {
      continue;
    }

    const url = new URL(endpoint);
    url.searchParams.set("filter", `type:journal-article,from-pub-date:${fromDate}`);
    url.searchParams.set("sort", "published");
    url.searchParams.set("order", "desc");
    url.searchParams.set("rows", `${rows}`);
    url.searchParams.set(
      "select",
      "DOI,title,author,published-print,published-online,published,container-title,URL,abstract,type,created,subject",
    );

    console.log(`Fetching ${journal.shortName} (${dayWindow}d from ${fromDate})`);
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
      console.warn(`  skipped: HTTP ${response.status}`);
      await sleep(1200);
      continue;
    }

    const json = await response.json();
    for (const item of json.message?.items || []) {
      records.push({
        ...item,
        _paperRev: {
          journalId: journal.id,
          journalName: journal.name,
          journalShortName: journal.shortName,
          accessLabel: journal.accessLabel,
          fetchedWindowDays: dayWindow,
        },
      });
    }
    await sleep(1200);
  }
  return records;
}

function normalizeRecord(item) {
  const doi = normalizeDoi(item.DOI);
  const title = decodeEntities(firstText(item.title));
  if (!doi || !title) {
    return null;
  }

  const publishedDate = dateFromParts(
    item.published?.["date-parts"] ||
      item["published-online"]?.["date-parts"] ||
      item["published-print"]?.["date-parts"] ||
      item.created?.["date-parts"],
  );
  const journal = decodeEntities(firstText(item["container-title"]) || item._paperRev?.journalName || "");
  const abstract = cleanAbstract(item.abstract || "");
  const authors = Array.isArray(item.author)
    ? item.author.map(formatAuthor).filter(Boolean)
    : [];

  return {
    id: doiToId(doi),
    doi,
    title,
    journalId: item._paperRev?.journalId || "",
    journal,
    publishedDate,
    authors,
    topics: item.subject || [],
    access: isOpenAccess(item._paperRev?.accessLabel) ? "open" : "metadata",
    url: item.URL || `https://doi.org/${doi}`,
    crossrefUrl: `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
    abstract,
    source: "Crossref",
    fetchedWindowDays: item._paperRev?.fetchedWindowDays || null,
    summary_status: "normalized",
  };
}

function splitFeaturedAndArchive(records) {
  const featuredIds = new Set();
  const featuredDrafts = [];
  for (const topic of topics) {
    const topicRecords = records.filter((record) => record.topicId === topic.id).sort(sortByDateDesc);
    for (const record of topicRecords.slice(0, draftLimitPerTopic)) {
      featuredIds.add(record.id);
      featuredDrafts.push(record);
    }
  }

  featuredDrafts.sort(sortByDateDesc);

  const archiveStart = addDays(untilDate, -(archiveDays - 1));
  const archiveRecords = records
    .filter((record) => !featuredIds.has(record.id))
    .filter((record) => {
      const published = new Date(`${record.publishedDate || "1900-01-01"}T00:00:00Z`);
      return published >= archiveStart && published <= untilDate;
    })
    .sort(sortByDateDesc);

  return { featuredDrafts, archiveRecords };
}

function classifyAndDraft(article) {
  const haystack = [
    article.title,
    article.abstract,
    article.journal,
    article.topics.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const topicScores = topics.map((topic) => ({
    id: topic.id,
    score: scoreKeywords(haystack, TOPIC_RULES[topic.id] || []),
  }));
  topicScores.sort((a, b) => b.score - a.score);
  const topicId = topicScores[0]?.score > 0 ? topicScores[0].id : fallbackTopic(article);

  const questionIds = questions
    .filter((question) => question.topicId === topicId)
    .map((question) => ({
      id: question.id,
      score: scoreKeywords(haystack, QUESTION_RULES[question.id] || []),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.id);

  const primaryQuestionId = questionIds[0] || questions.find((question) => question.topicId === topicId)?.id;

  return {
    ...article,
    topicId,
    questionIds: primaryQuestionId ? [...new Set([primaryQuestionId, ...questionIds])] : [],
    deck: buildDeck(article, topicId, primaryQuestionId),
    koreanSummary: buildKoreanSummary(article, topicId),
    summary_status: "ai_draft",
  };
}

function buildDeck(article, topicId, questionId) {
  const topic = topics.find((item) => item.id === topicId);
  const question = questions.find((item) => item.id === questionId);
  const abstractSentences = splitSentences(article.abstract);
  const methodSentence = pickSentence(abstractSentences, [
    "method",
    "methods",
    "interview",
    "focus group",
    "survey",
    "cohort",
    "trial",
    "review",
    "analysis",
  ]);
  const resultSentence = pickSentence(abstractSentences, [
    "result",
    "results",
    "finding",
    "findings",
    "identified",
    "barriers",
    "facilitators",
    "participants",
    "greater",
    "lower",
    "associated",
    "showed",
    "revealed",
    "suggest",
  ]);
  const conclusionSentence = pickSentence(abstractSentences, [
    "conclusion",
    "discussion",
    "implication",
    "support",
    "highlight",
    "need",
  ]);

  return {
    question:
      question?.question ||
      `${topic?.name || "노화 심리"} 관점에서 이 논문은 어떤 문제를 다루는가?`,
    method: methodSentence
      ? `초록 기준으로, 이 연구는 ${methodSentence}`
      : `${article.journal}에 게재된 최근 논문으로, 초록과 메타데이터를 바탕으로 연구 설계를 검수해야 합니다.`,
    finding: resultSentence
      ? `주요 결과는 ${resultSentence}`
      : article.abstract
        ? `초록에서 핵심 결과 문장을 추가 검수해야 합니다. 현재 자동 추출 요약: ${shorten(article.abstract, 180)}`
        : "Crossref 메타데이터에는 초록이 없어 원문 또는 출판사 페이지 확인이 필요합니다.",
    meaning: conclusionSentence
      ? `이 논문은 ${topic?.name || "노화 심리"} 분야에서 ${conclusionSentence}`
      : `${topic?.name || "노화 심리"} 분야의 최근 동향을 보여주는 카드뉴스 후보입니다.`,
    caution: article.abstract
      ? "자동 초안이므로 원문 초록과 연구 설계, 표본, 결과 수치를 사람이 검수한 뒤 게시해야 합니다."
      : "초록이 없는 메타데이터 기반 초안이므로 게시 전 원문 확인이 필수입니다.",
  };
}

function buildKoreanSummary(article, topicId) {
  const topic = topics.find((item) => item.id === topicId);
  const base = article.abstract
    ? shorten(article.abstract, 220)
    : "Crossref에서 초록이 제공되지 않아 원문 확인이 필요합니다.";
  return `${topic?.name || "노화 심리"} 분야 카드뉴스 후보입니다. ${base}`;
}

function fallbackTopic(article) {
  const title = article.title.toLowerCase();
  if (title.includes("dementia") || title.includes("cognitive impairment")) {
    return "dementia-cognitive-impairment";
  }
  if (title.includes("care") || title.includes("caregiver") || title.includes("family")) {
    return "caregiving-family";
  }
  if (title.includes("digital") || title.includes("web") || title.includes("technology")) {
    return "digital-health-behavior";
  }
  return "social-aging";
}

function coverageByTopic(records) {
  const coverage = Object.fromEntries(topics.map((topic) => [topic.id, 0]));
  for (const record of records) {
    coverage[record.topicId] = (coverage[record.topicId] || 0) + 1;
  }
  return coverage;
}

function scoreKeywords(text, keywords) {
  return keywords.reduce((score, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    return score + (text.match(regex)?.length || 0);
  }, 0);
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function pickSentence(sentences, keywords) {
  const scored = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreKeywords(sentence.toLowerCase(), keywords) - backgroundPenalty(sentence),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.index - a.index);
  return scored[0]?.sentence;
}

function cleanAbstract(value) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b(Abstract|Background|Objective|Objectives|Methods|Results|Conclusions?|Discussion and Implications):?\b/gi, "")
    .trim();
}

function backgroundPenalty(sentence) {
  const lower = sentence.toLowerCase();
  let penalty = 0;
  if (lower.includes("however")) penalty += 1;
  if (lower.includes("aimed to")) penalty += 1;
  if (lower.includes("important for")) penalty += 1;
  return penalty;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function dateFromParts(dateParts) {
  const parts = Array.isArray(dateParts?.[0]) ? dateParts[0] : [];
  const [year, month = 1, day = 1] = parts;
  if (!year) {
    return "";
  }
  return [year, month, day].map((part) => `${part}`.padStart(2, "0")).join("-");
}

function firstText(value) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function formatAuthor(author) {
  return [author.given, author.family].filter(Boolean).join(" ").trim();
}

function normalizeDoi(value) {
  return `${value || ""}`.trim().toLowerCase();
}

function doiToId(doi) {
  return doi.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isOpenAccess(accessLabel = "") {
  return accessLabel.toLowerCase().includes("open access") || accessLabel.toLowerCase().includes("gold");
}

function sortByDateDesc(a, b) {
  return `${b.publishedDate}`.localeCompare(`${a.publishedDate}`);
}

function shorten(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function parseWindows(value) {
  return `${value}`
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item) && item > 0)
    .sort((a, b) => a - b);
}

function parseArgs(items) {
  const parsed = {};
  for (const item of items) {
    const match = item.match(/^--([^=]+)=(.*)$/);
    if (match) {
      parsed[match[1]] = match[2];
    }
  }
  return parsed;
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

async function writeJson(relativePath, value) {
  await writeFile(path.join(ROOT, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
