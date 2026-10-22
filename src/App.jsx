import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Header from "./components/Header.jsx";
import BarScene from "./components/BarScene.jsx";
import DrinkDetail from "./components/DrinkDetail.jsx";
import WelcomeModal from "./components/WelcomeModal.jsx";
import { getIngredients, translateIngredient } from "./utils/translations.js";
import { fetchColdMocktails } from "./api/cocktails.js";
import { isMuted, playClick, playGlass, setMuted } from "./utils/sounds.js";

function getPerPage(width) {
  if (width >= 1100) return 7;
  if (width >= 700) return 5;
  return 3;
}

function getLayout(width, height) {
  if (width < 600 || height < 500) return "full";
  if (width < 900) return "sheet";
  return "side";
}

const readViewport = () => ({ width: window.innerWidth, height: window.innerHeight });

function useViewport() {
  const [viewport, setViewport] = useState(readViewport);
  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return viewport;
}

export default function App() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [rawPage, setPage] = useState(0);

  const [selectedDrink, setSelectedDrink] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [barBlurred, setBarBlurred] = useState(true);
  const [muted, setMutedState] = useState(isMuted);

  const viewport = useViewport();
  const perPage = getPerPage(viewport.width);
  const layout = getLayout(viewport.width, viewport.height);

  useEffect(() => {
    const controller = new AbortController();

    fetchColdMocktails(controller.signal)
      .then((result) => {
        setDrinks(result);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const modelIndexById = useMemo(
    () => Object.fromEntries(drinks.map((d, i) => [d.idDrink, i])),
    [drinks]
  );

  const categories = useMemo(
    () => [...new Set(drinks.map((d) => d.strCategory))].sort(),
    [drinks]
  );

  const ingredients = useMemo(() => {
    const counts = {};
    drinks.forEach((d) =>
      getIngredients(d).forEach(({ name }) => {
        const key = name.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      })
    );
    return Object.keys(counts)
      .filter((key) => counts[key] >= 2)
      .sort((a, b) => translateIngredient(a).localeCompare(translateIngredient(b), "fr"));
  }, [drinks]);

  const filteredDrinks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drinks.filter(
      (d) =>
        (!query || d.strDrink.toLowerCase().includes(query)) &&
        (!category || d.strCategory === category) &&
        (!ingredient || getIngredients(d).some(({ name }) => name.toLowerCase() === ingredient))
    );
  }, [drinks, search, category, ingredient]);

  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  const pageCount = Math.max(1, Math.ceil(filteredDrinks.length / perPage));
  const page = Math.min(rawPage, pageCount - 1);
  const pageDrinks = filteredDrinks.slice(page * perPage, (page + 1) * perPage);

  const goToPage = useCallback(
    (next) => setPage((next + pageCount) % pageCount),
    [pageCount]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (showWelcome) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "ArrowRight") goToPage(page + 1);
      if (e.key === "ArrowLeft") goToPage(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToPage, page, showWelcome]);

  const selectDrink = (drink) => {
    playGlass();
    setSelectedDrink(drink);
    setPanelOpen(true);
  };

  const toggleMute = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  useEffect(() => {
    const onClick = (e) => {
      if (e.target.closest("button")) playClick();
    };
    const onChange = (e) => {
      if (e.target.tagName === "SELECT") playClick();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
    };
  }, []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const surprise = () => {
    const candidates = filteredDrinks.filter((d) => d.idDrink !== selectedDrink?.idDrink);
    if (candidates.length === 0) return;
    const drink = candidates[Math.floor(Math.random() * candidates.length)];
    setPage(Math.floor(filteredDrinks.indexOf(drink) / perPage));
    selectDrink(drink);
  };

  return (
    <div className={`app-background ${barBlurred ? "is-blurred" : ""}`}>
      <Header
        search={search}
        onSearchChange={withPageReset(setSearch)}
        category={category}
        onCategoryChange={withPageReset(setCategory)}
        categories={categories}
        ingredient={ingredient}
        onIngredientChange={withPageReset(setIngredient)}
        ingredients={ingredients}
        muted={muted}
        onToggleMute={toggleMute}
      />

      <main className={`stage ${panelOpen && layout === "sheet" ? "is-sheet-open" : ""}`}>
        <Canvas camera={{ position: [0, 2, 10], fov: 40 }} onPointerMissed={closePanel}>
          <Suspense fallback={null}>
            <BarScene
              drinks={pageDrinks}
              modelIndexById={modelIndexById}
              perPage={perPage}
              layout={layout}
              selectedId={panelOpen ? selectedDrink?.idDrink : null}
              onSelectDrink={selectDrink}
            />
          </Suspense>
        </Canvas>

        {!loading && filteredDrinks.length > 1 && (
          <button className="surprise-button" onClick={surprise}>
            <span aria-hidden="true">🎲</span> Surprends-moi
          </button>
        )}

        {loading && (
          <div className="status">
            <span className="loader-glass" aria-hidden="true">🍹</span>
            Chargement des cocktails…
          </div>
        )}
        {error && <div className="status">Impossible de charger les cocktails.</div>}
        {!loading && !error && filteredDrinks.length === 0 && (
          <div className="status">Aucun cocktail ne correspond à ta recherche.</div>
        )}

        {pageCount > 1 && (
          <>
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={() => goToPage(page - 1)}
              aria-label="Cocktails précédents"
            >
              ‹
            </button>
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={() => goToPage(page + 1)}
              aria-label="Cocktails suivants"
            >
              ›
            </button>
            {pageCount <= 8 ? (
              <div className="carousel-dots">
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    className={`carousel-dot ${i === page ? "is-active" : ""}`}
                    onClick={() => setPage(i)}
                    aria-label={`Page ${i + 1}`}
                  />
                ))}
              </div>
            ) : (
              <p className="carousel-dots carousel-counter">
                <strong>{page + 1}</strong> / {pageCount}
              </p>
            )}
          </>
        )}

        <p className="credits">
          Données :{" "}
          <a href="https://www.thecocktaildb.com/" target="_blank" rel="noreferrer">
            TheCocktailDB
          </a>
        </p>
      </main>

      <DrinkDetail drink={selectedDrink} open={panelOpen} layout={layout} onClose={closePanel} />

      {showWelcome && (
        <WelcomeModal onLeave={() => setBarBlurred(false)} onEnter={() => setShowWelcome(false)} />
      )}
    </div>
  );
}
