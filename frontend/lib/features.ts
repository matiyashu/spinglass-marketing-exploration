export const FEATURES = [
  "ad_recall",
  "brand_link",
  "distinctive_asset",
  "trust",
  "value_for_money",
  "premium",
  "fun",
  "personal_relevance",
  "consideration",
  "competitor_salience",
] as const;

export type Feature = (typeof FEATURES)[number];

export interface FeatureMeta {
  key: Feature;
  label: string;
  description: string;
  example: string;
  encoding: "binary" | "likert_or_binary";
}

export const FEATURE_META: FeatureMeta[] = [
  {
    key: "ad_recall",
    label: "Ad recall",
    description: "Respondent remembers seeing the ad or campaign asset.",
    example: "“Have you seen any advertising for [Brand] in the last 4 weeks?”",
    encoding: "binary",
  },
  {
    key: "brand_link",
    label: "Brand link",
    description: "The remembered ad is correctly linked back to the brand.",
    example: "“Which brand was the ad you just remembered for?” (correct = 1)",
    encoding: "binary",
  },
  {
    key: "distinctive_asset",
    label: "Distinctive asset",
    description: "A logo, colour, character, jingle, or codified asset is recognised.",
    example: "“Without seeing the name, which brand does this image belong to?”",
    encoding: "binary",
  },
  {
    key: "trust",
    label: "Trust",
    description: "Brand is perceived as dependable, honest, safe to choose.",
    example: "“[Brand] is a brand I can trust.” (pick any / agree)",
    encoding: "likert_or_binary",
  },
  {
    key: "value_for_money",
    label: "Value for money",
    description: "Brand is seen as offering fair value at its price point.",
    example: "“[Brand] gives good value for money.”",
    encoding: "likert_or_binary",
  },
  {
    key: "premium",
    label: "Premium",
    description: "Brand is seen as upscale, prestigious, worth a price premium.",
    example: "“[Brand] is a premium / high-end brand.”",
    encoding: "likert_or_binary",
  },
  {
    key: "fun",
    label: "Fun",
    description: "Brand evokes enjoyment, energy, lightness.",
    example: "“[Brand] is fun.”",
    encoding: "likert_or_binary",
  },
  {
    key: "personal_relevance",
    label: "Personal relevance",
    description: "Brand feels relevant to the respondent's needs and identity.",
    example: "“[Brand] is for people like me.”",
    encoding: "likert_or_binary",
  },
  {
    key: "consideration",
    label: "Consideration",
    description: "Respondent would consider buying the brand next time.",
    example: "“Would you consider [Brand] for your next purchase?”",
    encoding: "binary",
  },
  {
    key: "competitor_salience",
    label: "Competitor salience",
    description: "A competing brand is top-of-mind in the same moment.",
    example: "Mentions a competitor in an unaided question about the category.",
    encoding: "binary",
  },
];

export const FEATURE_LABEL: Record<Feature, string> = Object.fromEntries(
  FEATURE_META.map((f) => [f.key, f.label]),
) as Record<Feature, string>;
