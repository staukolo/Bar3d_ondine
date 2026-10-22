import { getIngredients, translateIngredient, translateMeasure } from "./translations.js";

const INGREDIENT_COLORS = {
  water: "#9fd8f5",
  "soda water": "#c8ecfa",
  "carbonated soft drink": "#e3f4c9",
  "ginger ale": "#e8c27a",
  "coca-cola": "#4a2414",
  sugar: "#f7f1e3",
  "brown sugar": "#b5763a",
  "sugar syrup": "#f3e9c8",
  honey: "#f0a830",
  yoghurt: "#f6efe2",
  milk: "#fbf8f2",
  cream: "#fff3d6",
  sherbet: "#ffb3c7",
  "orange juice": "#ffa53a",
  orange: "#ff9a2e",
  "lemon juice": "#f7e463",
  lemon: "#f5dc3c",
  "lime juice": "#b7e05a",
  lime: "#9ccc3c",
  "lime peel": "#7fb135",
  "pineapple juice": "#ffd84d",
  pineapple: "#ffcf3a",
  "apple juice": "#e9b949",
  apple: "#d9e46a",
  "grapefruit juice": "#ff8a7a",
  "cranberry juice": "#c4183c",
  grenadine: "#d0103a",
  "grape juice": "#6b1f5c",
  grapes: "#7d3c98",
  "passion fruit juice": "#f6b622",
  "guava juice": "#ff8f8f",
  "peach nectar": "#ffb07a",
  "tomato juice": "#d8392b",
  "fruit juice": "#ff9f43",
  fruit: "#ff7f6e",
  berries: "#8e2a5a",
  strawberries: "#ff4d6d",
  banana: "#f8e08e",
  mango: "#ffb627",
  papaya: "#ff9248",
  kiwi: "#8bc34a",
  cantaloupe: "#ffb88c",
  carrot: "#ff8c1a",
  ginger: "#e6c37a",
  mint: "#4caf7d",
  "mint syrup": "#3ddc97",
  "chocolate syrup": "#5d3420",
  "almond flavoring": "#f1dfc0",
  "maraschino cherry": "#c2002f",
  salt: "#eeeeee",
  "celery salt": "#d9dcc4",
  cinnamon: "#a0522d",
  cloves: "#6d3b1f",
  "cumin seed": "#a67c3d",
  "cayenne pepper": "#c0392b",
  asafoetida: "#d8c9a3",
};

const FALLBACK_COLORS = ["#e84b35", "#ffc857", "#721849", "#f5f0ff", "#7ad3c4"];

export function getIngredientColor(name) {
  const key = name.trim().toLowerCase();
  if (INGREDIENT_COLORS[key]) return INGREDIENT_COLORS[key];
  const hash = [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

const PORTION_CL = {
  banana: 12,
  mango: 20,
  orange: 8,
  apple: 12,
  kiwi: 6,
  papaya: 30,
  pineapple: 40,
  lemon: 4,
  lime: 3,
  carrot: 10,
  cantaloupe: 30,
  "maraschino cherry": 1,
};

const GARNISHES = new Set([
  "salt",
  "celery salt",
  "cinnamon",
  "cloves",
  "mint",
  "lime peel",
  "maraschino cherry",
  "cayenne pepper",
  "asafoetida",
  "cumin seed",
]);

const DEFAULT_CL = 5;
const GARNISH_CL = 1;

function parseQuantity(text) {
  const toNumber = (part) =>
    part
      .trim()
      .split(/\s+/)
      .reduce((sum, piece) => {
        if (piece.includes("/")) {
          const [a, b] = piece.split("/").map(Number);
          return sum + a / b;
        }
        return sum + Number(piece.replace(",", "."));
      }, 0);

  const range = text.match(/^([\d.,/ ]+?)\s*à\s*([\d.,/ ]+)/);
  if (range) return (toNumber(range[1]) + toNumber(range[2])) / 2;
  const single = text.match(/^[\d.,/ ]+/);
  return single ? toNumber(single[0]) : NaN;
}

function measureToCl(measure, ingredientKey) {
  const quantity = parseQuantity(measure);

  if (/\b(cl|dl|L|g)\b/.test(measure) && !Number.isNaN(quantity)) {
    const unit = measure.match(/\b(cl|dl|L|g)\b/)[1];
    const factor = { cl: 1, dl: 10, L: 100, g: 0.1 }[unit];
    return { cl: quantity * factor, estimated: false };
  }
  if (/c\. à café/.test(measure)) return { cl: (quantity || 1) * 0.5, estimated: false };
  if (/c\. à soupe/.test(measure)) return { cl: (quantity || 1) * 1.5, estimated: false };
  if (/\bparts?\b/.test(measure)) return { cl: (quantity || 1) * 3, estimated: false };
  if (/jus d'1\/2/.test(measure)) return { cl: 2, estimated: true };
  if (/jus d'1/.test(measure)) return { cl: 4, estimated: true };
  if (/cm|mm|gouttes|trait|pincée/.test(measure)) return { cl: GARNISH_CL, estimated: false };

  if (GARNISHES.has(ingredientKey)) return { cl: GARNISH_CL, estimated: true };
  if (!Number.isNaN(quantity) && quantity > 0) {
    return { cl: quantity * (PORTION_CL[ingredientKey] ?? DEFAULT_CL), estimated: true };
  }
  return { cl: DEFAULT_CL, estimated: true };
}

export function getRecipeLayers(drink) {
  const layers = getIngredients(drink)
    .filter(({ name }) => name.toLowerCase() !== "ice")
    .map(({ name, measure }) => {
      const key = name.toLowerCase();
      const translatedMeasure = translateMeasure(measure);
      const { cl, estimated } = measureToCl(translatedMeasure, key);
      return {
        key,
        label: translateIngredient(name),
        measure: translatedMeasure,
        cl,
        estimated,
        color: getIngredientColor(name),
      };
    });

  const total = layers.reduce((sum, layer) => sum + layer.cl, 0) || 1;
  return {
    total,
    layers: layers.map((layer) => ({ ...layer, share: layer.cl / total })),
  };
}
