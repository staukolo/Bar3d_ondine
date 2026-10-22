const API_URL = "https://www.thecocktaildb.com/api/json/v1/1";
const CACHE_KEY = "bar3d-cold-mocktails";

const HOT_CATEGORIES = ["Cocoa", "Coffee / Tea"];

const MAX_PARALLEL = 6;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, signal, retries = 2) {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (signal?.aborted || retries === 0) throw err;
    await wait(600);
    return fetchJson(url, signal, retries - 1);
  }
}

async function mapWithLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await task(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function readCache() {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeCache(drinks) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(drinks));
  } catch {
    return;
  }
}

export async function fetchColdMocktails(signal) {
  const cached = readCache();
  if (cached?.length) return cached;

  const list = await fetchJson(`${API_URL}/filter.php?a=Non_Alcoholic`, signal);

  const details = await mapWithLimit(list.drinks || [], MAX_PARALLEL, (d) =>
    fetchJson(`${API_URL}/lookup.php?i=${d.idDrink}`, signal)
      .then((data) => data.drinks?.[0])
      .catch((err) => {
        if (signal?.aborted) throw err;
        return null;
      })
  );

  const drinks = details.filter((d) => d && !HOT_CATEGORIES.includes(d.strCategory));
  if (drinks.length === 0) throw new Error("Aucune boisson reçue");

  writeCache(drinks);
  return drinks;
}
