/**
 * Keyword-based topic tagging for headlines and posts. Rules are checked in order and the
 * first match wins, so more specific topics come first.
 */
export const TOPICS = [
  "Policy and government",
  "Safety and alignment",
  "Business and funding",
  "Labs and models",
  "Research",
  "Opinion",
  "General",
] as const;
export type Topic = (typeof TOPICS)[number];

const RULES: Array<[Topic, RegExp]> = [
  ["Opinion", /^(opinion|op-ed|column|analysis|commentary)\b|\bopinion\s*[|:]|\bwhy you shouldn|\blet me\b|\bexplains why\b/i],
  [
    "Policy and government",
    /\b(trump|biden|president|white house|government|congress|senat(e|or)|parliament|minist(er|ry)|federal|executive order|law|bill|act\b|regulat\w*|policy|eu\b|european union|un\b|united nations|imf|treaty|election|governor|state department|pentagon|military|national security)\b/i,
  ],
  [
    "Safety and alignment",
    /\b(safety|alignment|aligned|existential|x-risk|risk|dangerous|danger|kill switch|ban|pause|threat|catastroph\w*|control problem|doom|misaligned|guardrail\w*)\b/i,
  ],
  [
    "Business and funding",
    /(\$\d|\b(raises?|raised|funding|ipo|invest\w*|valuation|market|stocks?|shares|billion|million|revenue|ceo|startup|start-up|acquisition|acquires|softbank|nvidia|earnings)\b)/i,
  ],
  [
    "Labs and models",
    /\b(openai|anthropic|deepmind|google|meta|xai|microsoft|mistral|deepseek|gpt-?\d*|claude|gemini|llama|grok|model|lab|launch(es|ed)?|release[sd]?|chatbot|agent)\b/i,
  ],
  ["Research", /\b(research\w*|paper|study|studies|arxiv|scientists?|university|benchmark|experiment)\b/i],
];

export function classifyTopic(text: string): Topic {
  for (const [topic, re] of RULES) if (re.test(text)) return topic;
  return "General";
}
