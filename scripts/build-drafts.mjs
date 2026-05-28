import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_WINDOWS = [7, 14, 30, 60, 90, 180];
const DEFAULT_ROWS = 50;
const DEFAULT_MIN_TOPIC_COUNT = 5;
const DEFAULT_DRAFT_LIMIT_PER_TOPIC = 5;
const DEFAULT_ARCHIVE_DAYS = 365;
const USER_AGENT = "PaperRev prototype; mailto=paperrev@example.com";
const OPENALEX_MAILTO = "paperrev@example.com";
const PUBMED_TOOL = "PaperRev";
const PUBMED_EMAIL = "paperrev@example.com";

const TOPIC_RULES = {
  "cognitive-aging": {
    strong: ["cognitive aging", "cognition", "cognitive function", "cognitive functioning", "cognitive decline", "memory", "episodic memory", "working memory"],
    medium: ["attention", "executive function", "processing speed", "dual-task", "neuropsychological", "cognitive performance", "cognitive trajectories", "pentagon-copy"],
    weak: ["brain", "learning", "reasoning", "decision making", "cognitive health", "handwriting kinematics"],
    negative: ["dementia", "alzheimer", "caregiver", "caregiving", "frailty"],
    journals: ["psychology-and-aging", "aging-neuropsychology-cognition", "experimental-aging-research", "gerontology-series-b"],
  },
  "emotional-aging": {
    strong: ["depression", "depressive", "anxiety", "mental health", "well-being", "emotional well-being"],
    medium: ["emotion", "emotional", "loneliness", "stress", "resilience", "quality of life", "distress"],
    weak: ["life satisfaction", "mood", "affect", "anger", "coping", "psychological"],
    negative: ["dementia care", "caregiver burden", "employment", "retirement"],
    journals: ["aging-and-mental-health", "clinical-gerontologist", "international-psychogeriatrics"],
  },
  "social-aging": {
    strong: ["social isolation", "social engagement", "social participation", "social support", "loneliness"],
    medium: ["social", "culture", "cultural", "relationship", "neighborhood", "age perception", "widowhood"],
    weak: ["old age", "environment", "urban", "rural", "immigrant", "identity", "inequality", "policy", "community-dwelling"],
    negative: ["cognitive impairment", "dementia", "caregiver", "physical activity", "employment", "digital handwriting", "kinematics", "physical performance"],
    journals: ["ageing-and-society", "research-on-aging", "the-gerontologist", "gerontology-series-b"],
  },
  "dementia-cognitive-impairment": {
    strong: ["dementia", "alzheimer", "mild cognitive impairment", "mci", "cognitive impairment", "adrd"],
    medium: ["screening", "diagnosis", "case-finding", "cognitive decline", "neurodegenerative", "memory clinic"],
    weak: ["biomarker", "amyloid", "tau", "neuropsychiatric", "informant", "cognitive assessment"],
    negative: ["employment", "retirement", "ageism", "healthy aging"],
    journals: ["dementia", "international-psychogeriatrics", "clinical-gerontologist", "aging-and-mental-health"],
  },
  "caregiving-family": {
    strong: ["caregiver", "caregiving", "carer", "family caregiver", "informal care", "unpaid care"],
    medium: ["care partner", "family", "care burden", "respite", "long-term care", "nursing home", "home care"],
    weak: ["transition", "hospital-to-home", "unmet need", "support", "care planning", "social care"],
    negative: ["employment", "retirement", "physical activity", "biomarker"],
    journals: ["dementia", "the-gerontologist", "journal-of-applied-gerontology", "bmc-geriatrics"],
  },
  "digital-health-behavior": {
    strong: ["digital health", "mhealth", "ehealth", "physical activity", "exercise", "falls", "fall prevention", "fall risk", "gait", "balance", "physical function", "physical performance"],
    medium: ["web-based", "technology", "mobile", "app", "wearable", "driving", "driving safety", "sleep", "health behavior", "digital handwriting", "kinematics"],
    weak: ["intervention", "telehealth", "remote", "sensor", "rehabilitation", "frailty", "functional decline", "healthspan"],
    negative: ["employment", "ageism", "caregiver burden", "dementia care"],
    journals: ["jmir-aging", "journal-of-aging-and-health", "gerontology-series-a", "age-and-ageing", "bmc-geriatrics"],
  },
  "work-retirement-ageism": {
    strong: ["ageism", "retirement", "employment", "older worker", "workplace", "work ability"],
    medium: ["work", "worker", "labor", "labour", "age-inclusive", "manager", "pension", "productive aging"],
    weak: ["job", "career", "volunteering", "discrimination", "organizational", "workforce"],
    negative: ["dementia", "caregiver", "falls", "biomarker", "health and retirement study", "polygenic", "kidney function", "immune aging", "mortality"],
    journals: ["ageing-and-society", "research-on-aging", "the-gerontologist", "gerontology-series-b"],
  },
};

const JOURNAL_FEATURED_PRIORITY = {
  "psychology-and-aging": 10,
  "gerontology-series-b": 10,
  "the-gerontologist": 9,
  "aging-and-mental-health": 9,
  "innovation-in-aging": 8,
  "jmir-aging": 8,
  "aging-neuropsychology-cognition": 8,
  "ageing-and-society": 8,
  "clinical-gerontologist": 7,
  "journal-of-aging-and-health": 7,
  "journal-of-applied-gerontology": 7,
  "dementia": 7,
  "international-psychogeriatrics": 7,
  "research-on-aging": 6,
  "age-and-ageing": 6,
  "bmc-geriatrics": 6,
  "gerontology": 6,
  "gerontology-series-a": 5,
  "experimental-aging-research": 5,
  "international-journal-aging-human-development": 5,
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

const normalizedDraftsBase = [...rawByDoi.values()]
  .map(normalizeRecord)
  .filter(Boolean)
  .map(classifyAndDraft)
  .sort(sortByDateDesc);
const normalizedDrafts = await enrichWithAdditionalSources(normalizedDraftsBase);
const { featuredDrafts, archiveRecords, reviewRecords } = splitFeaturedAndArchive(normalizedDrafts);
const featuredCoverageByTopic = coverageByTopic(featuredDrafts);
const publishStatusCounts = countBy(normalizedDrafts, "publishStatus");
const qualityFlagCounts = countQualityFlags(normalizedDrafts);
const sourceCoverageCounts = countSourceCoverage(normalizedDrafts);

const outputMeta = {
  generatedAt: new Date().toISOString(),
  source: "Crossref + OpenAlex + PubMed",
  windowsTried: windows,
  selectedWindow,
  minTopicCount,
  draftLimitPerTopic,
  archiveDays,
  coverageByTopic: lastCoverage,
  featuredCoverageByTopic,
  publishStatusCounts,
  qualityFlagCounts,
  sourceCoverageCounts,
  totalCollected: normalizedDrafts.length,
  featuredCount: featuredDrafts.length,
  archiveCount: archiveRecords.length,
  reviewCount: reviewRecords.length,
};

const output = {
  ...outputMeta,
  records: featuredDrafts,
  featuredDrafts,
  archiveRecords,
  reviewRecords,
};

const featuredOutput = {
  ...outputMeta,
  kind: "featured",
  records: featuredDrafts,
};

const archiveOutput = {
  ...outputMeta,
  kind: "archive",
  records: archiveRecords,
};

await mkdir(path.join(ROOT, "data", "raw"), { recursive: true });
await mkdir(path.join(ROOT, "data", "drafts"), { recursive: true });
await writeJson("data/raw/crossref-latest.json", {
  generatedAt: output.generatedAt,
  source: "Crossref + OpenAlex + PubMed",
  windowsTried: windows,
  selectedWindow,
  minTopicCount,
  draftLimitPerTopic,
  archiveDays,
  totalCollected: normalizedDrafts.length,
  publishStatusCounts,
  qualityFlagCounts,
  sourceCoverageCounts,
  records: [...rawByDoi.values()],
});
await writeJson("data/drafts/article-drafts.json", output);
await writeJson("data/drafts/featured-drafts.json", featuredOutput);
await writeJson("data/drafts/archive-records.json", archiveOutput);

console.log(`Saved ${normalizedDrafts.length} drafts to data/drafts/article-drafts.json`);
console.log(`Featured drafts: ${featuredDrafts.length}; archive records: ${archiveRecords.length}`);
console.log("Split data files: data/drafts/featured-drafts.json, data/drafts/archive-records.json");
console.log(`Needs review: ${reviewRecords.length}`);
console.log(`Windows tried: ${windows.join(", ")} days; selected window: ${selectedWindow} days`);
console.log(`Minimum topic target: ${minTopicCount}`);
console.log(`Featured draft limit per topic: ${draftLimitPerTopic}; archive days: ${archiveDays}`);
console.log(`Source coverage: ${Object.entries(sourceCoverageCounts).map(([source, count]) => `${source} ${count}`).join(", ")}`);
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
  const publishableRecords = records.filter((record) => record.publishStatus === "auto_publish");
  for (const topic of topics) {
    const topicRecords = publishableRecords.filter((record) => record.topicId === topic.id).sort(sortByFeaturedScore);
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

  const reviewRecords = records.filter((record) => record.needsReview).sort(sortByDateDesc);

  return { featuredDrafts, archiveRecords, reviewRecords };
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

  const topicResult = classifyTopic(article, haystack);
  const topicId = topicResult.topicId;

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

  const featuredScore = scoreFeatured(article, topicResult);
  const featuredSignals = buildFeaturedSignals(article, topicResult);
  const draft = {
    ...article,
    topicId,
    topicScore: topicResult.topicScore,
    topicScores: topicResult.topicScores,
    secondaryTopicIds: secondaryTopicIds(topicResult, topicId),
    classificationConfidence: topicResult.confidence,
    questionIds: primaryQuestionId ? [...new Set([primaryQuestionId, ...questionIds])] : [],
    cardTitle: buildCardTitleClean(article, topicId),
    deck: buildDeckClean(article, topicId, primaryQuestionId),
    koreanSummary: buildKoreanSummaryClean(article, topicId),
    featuredScore,
    featuredSignals,
    summary_status: "ai_draft",
  };
  return {
    ...draft,
    ...evaluatePublishQuality(draft),
  };
}

async function enrichWithAdditionalSources(records) {
  const openAlexByDoi = await fetchOpenAlexByDoi(records);
  const enriched = records.map((record) => mergeOpenAlex(record, openAlexByDoi.get(record.doi)));
  const featuredCandidates = [...enriched]
    .filter((record) => record.publishStatus === "auto_publish")
    .sort(sortByFeaturedScore)
    .slice(0, topics.length * draftLimitPerTopic * 2);
  const pubMedByDoi = await fetchPubMedByDoi(featuredCandidates);
  return enriched.map((record) => mergePubMed(record, pubMedByDoi.get(record.doi)));
}

async function fetchOpenAlexByDoi(records) {
  const byDoi = new Map();
  const doiUrls = [...new Set(records.map((record) => `https://doi.org/${record.doi}`))];
  for (const batch of chunk(doiUrls, 50)) {
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set("filter", `doi:${batch.join("|")}`);
    url.searchParams.set("per-page", `${batch.length}`);
    url.searchParams.set("mailto", OPENALEX_MAILTO);
    url.searchParams.set(
      "select",
      "id,doi,display_name,cited_by_count,open_access,primary_location,concepts,topics,publication_date,ids",
    );
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) {
        console.warn(`OpenAlex skipped: HTTP ${response.status}`);
        continue;
      }
      const json = await response.json();
      for (const item of json.results || []) {
        const doi = normalizeDoi(`${item.doi || ""}`.replace(/^https?:\/\/doi.org\//i, ""));
        if (doi) {
          byDoi.set(doi, item);
        }
      }
    } catch (error) {
      console.warn(`OpenAlex skipped: ${error.message}`);
    }
    await sleep(250);
  }
  return byDoi;
}

async function fetchPubMedByDoi(records) {
  const byDoi = new Map();
  for (const record of records) {
    if (!record.doi || byDoi.has(record.doi)) {
      continue;
    }
    const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
    url.searchParams.set("db", "pubmed");
    url.searchParams.set("term", `"${record.doi}"[doi]`);
    url.searchParams.set("retmode", "json");
    url.searchParams.set("retmax", "1");
    url.searchParams.set("tool", PUBMED_TOOL);
    url.searchParams.set("email", PUBMED_EMAIL);
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) {
        const json = await response.json();
        const pmid = json.esearchresult?.idlist?.[0];
        if (pmid) {
          byDoi.set(record.doi, {
            pmid,
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          });
        }
      }
    } catch (error) {
      console.warn(`PubMed skipped for ${record.doi}: ${error.message}`);
    }
    await sleep(350);
  }
  return byDoi;
}

function mergeOpenAlex(record, openAlex) {
  const sourceLinks = {
    crossref: record.crossrefUrl,
  };
  if (!openAlex) {
    return {
      ...record,
      sourceLinks,
      sourceCoverage: ["Crossref"],
    };
  }

  const openAccess = openAlex.open_access || {};
  const primaryLocation = openAlex.primary_location || {};
  const bestOaLocation = openAccess.oa_url || primaryLocation.landing_page_url || primaryLocation.pdf_url || "";
  return {
    ...record,
    openAlex: {
      id: openAlex.id || "",
      citedByCount: openAlex.cited_by_count || 0,
      publicationDate: openAlex.publication_date || "",
      isOpenAccess: Boolean(openAccess.is_oa),
      oaStatus: openAccess.oa_status || "",
      oaUrl: bestOaLocation,
      concepts: (openAlex.concepts || []).slice(0, 6).map((concept) => ({
        id: concept.id,
        name: concept.display_name,
        score: concept.score,
      })),
      topics: (openAlex.topics || []).slice(0, 4).map((topic) => ({
        id: topic.id,
        name: topic.display_name,
        score: topic.score,
      })),
    },
    access: openAccess.is_oa ? "open" : record.access,
    url: bestOaLocation || record.url,
    sourceLinks: {
      ...sourceLinks,
      openAlex: openAlex.id || "",
      openAccess: bestOaLocation || "",
    },
    sourceCoverage: ["Crossref", "OpenAlex"],
  };
}

function mergePubMed(record, pubMed) {
  if (!pubMed) {
    return {
      ...record,
      sourceLinks: {
        ...(record.sourceLinks || {}),
        pubMedSearch: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(record.doi)}`,
      },
    };
  }
  return {
    ...record,
    pubMed,
    sourceLinks: {
      ...(record.sourceLinks || {}),
      pubMed: pubMed.url,
    },
    sourceCoverage: [...new Set([...(record.sourceCoverage || ["Crossref"]), "PubMed"])],
  };
}

function classifyTopic(article, haystack) {
  const topicScores = topics
    .map((topic) => ({
      id: topic.id,
      score: scoreTopic(article, topic.id, haystack),
    }))
    .sort((a, b) => b.score - a.score);

  const top = topicScores[0];
  const runnerUp = topicScores[1];
  const topicId = top?.score > 0 ? top.id : fallbackTopic(article);
  const margin = Math.max(0, (top?.score || 0) - (runnerUp?.score || 0));
  const confidence = top?.score
    ? Math.min(1, Number(((margin + top.score * 0.25) / Math.max(top.score, 1)).toFixed(2)))
    : 0.15;

  return {
    topicId,
    topicScore: top?.score || 0,
    topicScores,
    confidence,
  };
}

function secondaryTopicIds(topicResult, primaryTopicId) {
  const topScore = topicResult.topicScores?.[0]?.score || 0;
  return (topicResult.topicScores || [])
    .filter((item) => item.id !== primaryTopicId)
    .filter((item) => item.score >= 12 || (topScore > 0 && item.score / topScore >= 0.45))
    .slice(0, 2)
    .map((item) => item.id);
}

function scoreTopic(article, topicId, haystack) {
  const rule = TOPIC_RULES[topicId] || {};
  const title = `${article.title}`.toLowerCase();
  const abstract = `${article.abstract}`.toLowerCase();
  const journal = `${article.journal}`.toLowerCase();
  const subjects = `${(article.topics || []).join(" ")}`.toLowerCase();

  let score = 0;
  score += fieldKeywordScore(title, rule.strong, 9);
  score += fieldKeywordScore(title, rule.medium, 5);
  score += fieldKeywordScore(title, rule.weak, 2);
  score += fieldKeywordScore(abstract, rule.strong, 4);
  score += fieldKeywordScore(abstract, rule.medium, 2);
  score += fieldKeywordScore(abstract, rule.weak, 1);
  score += fieldKeywordScore(subjects, rule.strong, 3);
  score += fieldKeywordScore(subjects, rule.medium, 2);
  score += fieldKeywordScore(journal, rule.strong, 3);
  score -= fieldKeywordScore(haystack, rule.negative, 3);

  if ((rule.journals || []).includes(article.journalId)) {
    score += 6;
  }

  return Math.max(0, score);
}


function coverageByTopic(records) {
  const coverage = Object.fromEntries(topics.map((topic) => [topic.id, 0]));
  for (const record of records) {
    coverage[record.topicId] = (coverage[record.topicId] || 0) + 1;
  }
  return coverage;
}

function evaluatePublishQuality(article) {
  const flags = [];
  const topScore = article.topicScores?.[0]?.score || 0;
  const runnerUpScore = article.topicScores?.[1]?.score || 0;
  const scoreGap = topScore - runnerUpScore;

  if (!article.abstract) {
    flags.push("missing_abstract");
  } else if (article.abstract.length < 250) {
    flags.push("short_abstract");
  }

  if ((article.classificationConfidence || 0) < 0.4) {
    flags.push("low_classification_confidence");
  }

  if (topScore > 0 && runnerUpScore >= 12 && scoreGap <= 6) {
    flags.push("topic_overlap");
  }

  if ((article.featuredScore || 0) < 70) {
    flags.push("low_featured_score");
  }

  if (hasBrokenText(article.cardTitle) || hasBrokenText(article.koreanSummary) || hasBrokenText(JSON.stringify(article.deck || {}))) {
    flags.push("text_encoding_issue");
  }

  return {
    publishStatus: flags.length ? "needs_review" : "auto_publish",
    needsReview: flags.length > 0,
    qualityFlags: flags,
  };
}

function hasBrokenText(value = "") {
  const text = `${value}`;
  return ["�", "怨", "醫", "移", "理", "?명솕", "?몄", "?뺤", "?쇰Ц", "?뚮큵"].some((token) =>
    text.includes(token),
  );
}

function countBy(records, key) {
  return records.reduce((counts, record) => {
    const value = record[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function countQualityFlags(records) {
  return records.reduce((counts, record) => {
    for (const flag of record.qualityFlags || []) {
      counts[flag] = (counts[flag] || 0) + 1;
    }
    return counts;
  }, {});
}

function countSourceCoverage(records) {
  return records.reduce((counts, record) => {
    for (const source of record.sourceCoverage || ["Crossref"]) {
      counts[source] = (counts[source] || 0) + 1;
    }
    return counts;
  }, {});
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

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
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

function fieldKeywordScore(text, keywords = [], weight = 1) {
  return keywords.reduce((score, keyword) => score + countKeyword(text, keyword) * weight, 0);
}

function countKeyword(text, keyword) {
  const escaped = `${keyword}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryStart = /^[a-z0-9]/i.test(keyword) ? "\\b" : "";
  const boundaryEnd = /[a-z0-9]$/i.test(keyword) ? "\\b" : "";
  const regex = new RegExp(`${boundaryStart}${escaped}${boundaryEnd}`, "gi");
  return text.match(regex)?.length || 0;
}

function scoreFeatured(article, topicResult) {
  const published = article.publishedDate ? new Date(`${article.publishedDate}T00:00:00Z`) : null;
  const ageDays = published ? Math.max(0, daysBetween(published, untilDate)) : 9999;
  const abstractLength = article.abstract?.length || 0;
  const studyDesign = inferStudyDesignClean(article);

  const recencyScore =
    ageDays <= 7 ? 30 : ageDays <= 14 ? 27 : ageDays <= 30 ? 22 : ageDays <= 90 ? 14 : ageDays <= 180 ? 8 : 3;
  const abstractScore =
    abstractLength >= 1200 ? 18 : abstractLength >= 700 ? 15 : abstractLength >= 350 ? 11 : abstractLength > 0 ? 6 : 0;
  const topicFitScore = Math.min(25, Math.round((topicResult.topicScore || 0) * 0.9));
  const confidenceScore = Math.round((topicResult.confidence || 0) * 10);
  const designScore = scoreStudyDesign(studyDesign);
  const accessScore = article.access === "open" ? 5 : 2;
  const journalScore = JOURNAL_FEATURED_PRIORITY[article.journalId] || 3;

  return recencyScore + abstractScore + topicFitScore + confidenceScore + designScore + accessScore + journalScore;
}

function buildFeaturedSignals(article, topicResult) {
  const published = article.publishedDate ? new Date(`${article.publishedDate}T00:00:00Z`) : null;
  return {
    recencyDays: published ? daysBetween(published, untilDate) : null,
    abstractLength: article.abstract?.length || 0,
    topicFit: topicResult.topicScore,
    classificationConfidence: topicResult.confidence,
    studyDesign: inferStudyDesignClean(article),
    access: article.access,
    journalPriority: JOURNAL_FEATURED_PRIORITY[article.journalId] || 3,
  };
}

function scoreStudyDesign(studyDesign) {
  const cleanWeights = {
    메타분석: 8,
    "체계적 문헌고찰": 7,
    "범위 문헌고찰": 5,
    "통합 문헌고찰": 5,
    "중재 연구": 7,
    "종단 연구": 6,
    "질적 연구": 4,
    "설문 연구": 3,
    "생물학적 지표 연구": 4,
    "최근 실증 연구": 3,
  };
  if (cleanWeights[studyDesign]) {
    return cleanWeights[studyDesign];
  }
  const weights = {
    메타분석: 8,
    "체계적 문헌고찰": 7,
    "범위 문헌고찰": 5,
    "통합 문헌고찰": 5,
    "중재 연구": 7,
    "종단 연구": 6,
    "질적 연구": 4,
    "설문 연구": 3,
    "생물학적 지표 연구": 4,
    "최근 실증 연구": 3,
  };
  return weights[studyDesign] || 3;
}

function daysBetween(start, end) {
  const millis = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) -
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  return Math.round(millis / 86400000);
}

function sortByFeaturedScore(a, b) {
  return (b.featuredScore || 0) - (a.featuredScore || 0) || sortByDateDesc(a, b);
}

function buildDeck(article, topicId, questionId) {
  const topic = topics.find((item) => item.id === topicId);
  const question = questions.find((item) => item.id === questionId);
  const studyDesign = inferStudyDesign(article);
  const focus = inferFocus(article, topicId);

  return {
    question: question?.question || `${topic?.name || "노화 심리"} 관점에서 이 논문은 어떤 문제를 다루는가?`,
    method: `${studyDesign}로 ${focus}을(를) 다룬 최근 논문입니다. 자동 초안 단계이므로 연구 설계와 표본은 원문에서 확인해야 합니다.`,
    finding: article.abstract
      ? `${focus}과(와) 관련된 결과를 보고합니다. 구체적인 효과 크기, 통계값, 적용 범위는 원문 초록과 본문에서 다시 확인해야 합니다.`
      : `Crossref 메타데이터에 초록이 없어 ${focus}에 대한 결론은 원문 또는 출판사 페이지 확인이 필요합니다.`,
    meaning: `${topic?.name || "노화 심리"} 분야에서 ${focus}을(를) 최근 연구 흐름으로 읽을 수 있습니다.`,
    caution: article.abstract
      ? "자동 초안이므로 원문 초록, 연구 설계, 표본, 결과 수치를 사람이 검토한 뒤 게시해야 합니다."
      : "초록이 없는 메타데이터 기반 초안이므로 게시 전 원문 확인이 필수입니다.",
  };
}

function buildKoreanSummary(article, topicId) {
  const topic = topics.find((item) => item.id === topicId);
  return `${topic?.name || "노화 심리"} 분야 카드뉴스 후보입니다. ${inferFocus(article, topicId)}을(를) 중심으로 원문 확인 후 게시할 수 있습니다.`;
}

function buildCardTitle(article, topicId) {
  const topic = topics.find((item) => item.id === topicId);
  return `${topic?.name || "노화 심리"} 최신 논문: ${inferFocus(article, topicId)}`;
}

function inferStudyDesign(article) {
  const text = `${article.title} ${article.abstract}`.toLowerCase();
  if (text.includes("meta-analysis") || text.includes("meta analysis")) return "메타분석";
  if (text.includes("systematic review")) return "체계적 문헌고찰";
  if (text.includes("scoping review")) return "범위 문헌고찰";
  if (text.includes("integrative review")) return "통합 문헌고찰";
  if (text.includes("randomized") || text.includes("randomised") || text.includes("trial")) return "중재 연구";
  if (text.includes("cohort") || text.includes("longitudinal")) return "종단 연구";
  if (text.includes("interview") || text.includes("qualitative")) return "질적 연구";
  if (text.includes("survey")) return "설문 연구";
  if (text.includes("biomarker") || text.includes("plasma") || text.includes("protein")) return "생물학적 지표 연구";
  return "최근 실증 연구";
}

function inferFocus(article, topicId) {
  const text = `${article.title} ${article.abstract}`.toLowerCase();
  const topic = topics.find((item) => item.id === topicId);
  const pairs = [
    ["mild cognitive impairment", "경도인지장애"],
    ["cognitive impairment", "인지장애"],
    ["dementia", "치매와 인지장애"],
    ["memory", "기억과 인지기능"],
    ["depression", "우울 증상"],
    ["anxiety", "불안 증상"],
    ["mental health", "정신건강"],
    ["caregiver", "돌봄자 부담과 지원"],
    ["caregiving", "돌봄 경험"],
    ["family", "가족 돌봄"],
    ["fall", "낙상 예방과 안전"],
    ["physical activity", "신체활동"],
    ["exercise", "운동 개입"],
    ["digital", "디지털헬스"],
    ["technology", "기술 사용"],
    ["ageism", "연령주의"],
    ["retirement", "은퇴 전환"],
    ["work", "일터와 고령 근로자"],
    ["loneliness", "외로움과 사회적 고립"],
    ["social", "사회적 관계와 환경"],
  ];
  return pairs.find(([keyword]) => text.includes(keyword))?.[1] || `${topic?.name || "노화 심리"}의 핵심 쟁점`;
}

function fallbackTopic(article) {
  const text = `${article.title} ${article.abstract} ${article.journal}`.toLowerCase();
  if (text.includes("dementia") || text.includes("alzheimer") || text.includes("cognitive impairment")) {
    return "dementia-cognitive-impairment";
  }
  if (text.includes("caregiver") || text.includes("caregiving") || text.includes("family care")) {
    return "caregiving-family";
  }
  if (text.includes("depression") || text.includes("anxiety") || text.includes("mental health")) {
    return "emotional-aging";
  }
  if (text.includes("memory") || text.includes("cognition") || text.includes("cognitive")) {
    return "cognitive-aging";
  }
  if (text.includes("digital") || text.includes("web") || text.includes("technology") || text.includes("exercise")) {
    return "digital-health-behavior";
  }
  if (text.includes("ageism") || text.includes("retirement") || text.includes("employment")) {
    return "work-retirement-ageism";
  }
  return "social-aging";
}

function buildDeckClean(article, topicId, questionId) {
  const topic = topics.find((item) => item.id === topicId);
  const question = questions.find((item) => item.id === questionId);
  const studyDesign = inferStudyDesignClean(article);
  const focus = inferFocusClean(article, topicId);

  return {
    question: question?.question || `${topic?.name || "노화 심리"} 관점에서 이 논문은 어떤 문제를 다루는가?`,
    method: `${studyDesign}로 ${focus}를 다룬 최근 논문입니다. 연구 설계와 표본은 원문 링크에서 함께 확인할 수 있습니다.`,
    finding: article.abstract
      ? `${focus}에 관한 핵심 결과를 보고합니다. 효과 크기, 통계값, 적용 범위는 원문 초록과 본문에서 함께 확인할 수 있습니다.`
      : `Crossref 메타데이터에 초록이 없어 ${focus}에 대한 결론은 원문 또는 출판사 페이지 확인이 필요합니다.`,
    meaning: `${topic?.name || "노화 심리"} 분야에서 ${focus}를 최근 연구 흐름으로 읽을 수 있습니다.`,
    caution: article.abstract
      ? "카드뉴스는 초록 기반 요약입니다. 해석할 때는 연구 설계, 표본, 결과 수치를 원문 기준으로 함께 보세요."
      : "초록이 없는 메타데이터 기반 카드이므로 게시 전 원문 확인이 필요합니다.",
  };
}

function buildKoreanSummaryClean(article, topicId) {
  const topic = topics.find((item) => item.id === topicId);
  return `${topic?.name || "노화 심리"} 분야 카드뉴스입니다. ${inferFocusClean(article, topicId)}를 중심으로 읽을 수 있습니다.`;
}

function buildCardTitleClean(article, topicId) {
  const topic = topics.find((item) => item.id === topicId);
  return `${topic?.name || "노화 심리"} 최신 논문: ${inferFocusClean(article, topicId)}`;
}

function inferStudyDesignClean(article) {
  const text = `${article.title} ${article.abstract}`.toLowerCase();
  if (text.includes("meta-analysis") || text.includes("meta analysis")) return "메타분석";
  if (text.includes("systematic review")) return "체계적 문헌고찰";
  if (text.includes("scoping review")) return "범위 문헌고찰";
  if (text.includes("integrative review")) return "통합 문헌고찰";
  if (text.includes("randomized") || text.includes("randomised") || text.includes("trial")) return "중재 연구";
  if (text.includes("cohort") || text.includes("longitudinal")) return "종단 연구";
  if (text.includes("interview") || text.includes("qualitative")) return "질적 연구";
  if (text.includes("survey")) return "설문 연구";
  if (text.includes("biomarker") || text.includes("plasma") || text.includes("protein")) return "생물학적 지표 연구";
  return "최근 실증 연구";
}

function inferFocusClean(article, topicId) {
  const text = `${article.title} ${article.abstract}`.toLowerCase();
  const topic = topics.find((item) => item.id === topicId);
  const pairs = [
    ["mild cognitive impairment", "경도인지장애"],
    ["cognitive impairment", "인지장애"],
    ["cognitive decline", "인지 저하"],
    ["cognitive function", "인지기능"],
    ["dementia", "치매와 인지장애"],
    ["memory", "기억과 인지기능"],
    ["depression", "우울 증상"],
    ["anxiety", "불안 증상"],
    ["mental health", "정신건강"],
    ["loneliness", "외로움과 사회적 고립"],
    ["caregiver", "돌봄자 부담과 지원"],
    ["caregiving", "돌봄 경험"],
    ["family", "가족 돌봄"],
    ["fall", "낙상 예방과 안전"],
    ["gait", "보행과 균형"],
    ["balance", "보행과 균형"],
    ["physical activity", "신체활동"],
    ["exercise", "운동 개입"],
    ["digital", "디지털헬스"],
    ["technology", "기술 사용"],
    ["ageism", "연령주의"],
    ["retirement", "은퇴 전환"],
    ["work", "일터와 고령 근로자"],
    ["social", "사회적 관계와 환경"],
  ];
  return pairs.find(([keyword]) => text.includes(keyword))?.[1] || `${topic?.name || "노화 심리"}의 핵심 쟁점`;
}
