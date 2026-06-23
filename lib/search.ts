interface SearchResult {
  query: string;
  answer?: string;
  abstract?: string;
  abstract_url?: string;
  topics: string[];
}

export async function webSearch(query: string): Promise<SearchResult> {
  if (!query.trim()) throw new Error('Query cannot be empty');

  // DuckDuckGo Instant Answer API — free, no key needed
  const url =
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}` +
    `&format=json&no_html=1&skip_disambig=1&t=stratos`;

  const res = await fetch(url, {
    headers: { 'Accept-Encoding': 'gzip' },
    // Next.js: skip cache so each request is fresh
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`DuckDuckGo API returned ${res.status}`);

  const data = await res.json() as {
    Answer?: string;
    AbstractText?: string;
    AbstractURL?: string;
    AbstractSource?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: unknown[] }>;
    Results?: Array<{ Text?: string; FirstURL?: string }>;
  };

  const result: SearchResult = { query, topics: [] };

  if (data.Answer) {
    result.answer = data.Answer;
  }

  if (data.AbstractText) {
    result.abstract = data.AbstractText;
    result.abstract_url = data.AbstractURL || undefined;
  }

  // Flatten RelatedTopics (may contain nested sub-topic arrays)
  const flatTopics: string[] = [];
  for (const t of data.RelatedTopics ?? []) {
    if (t.Text) flatTopics.push(t.Text);
  }
  result.topics = flatTopics.slice(0, 5);

  const hasContent = result.answer || result.abstract || result.topics.length > 0;
  if (!hasContent) {
    throw new Error(
      `No instant answer found for "${query}". ` +
      'DuckDuckGo Instant Answers works best for factual queries, definitions, ' +
      'well-known people, and calculator-style questions. ' +
      'Try rephrasing or ask a more specific factual question.'
    );
  }

  return result;
}
