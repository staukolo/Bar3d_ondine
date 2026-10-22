import { useEffect, useState } from "react";
import {
  getIngredients,
  getInstructions,
  translateAlcoholic,
  translateCategory,
  translateGlass,
  translateIngredient,
  translateMeasure,
} from "../utils/translations.js";
import { getIngredientColor, getRecipeLayers } from "../utils/recipe.js";

const FAVORITES_KEY = "bar3d-favorites";

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function writeFavorites(ids) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    return;
  }
}

function GlassIcon() {
  return (
    <svg viewBox="0 0 24 24" className="detail-glass-icon" aria-hidden="true">
      <path
        d="M7 3h10c0 5-1.5 8-5 8s-5-3-5-8zM12 11v8M8 21h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="heart-icon" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RecipeStack({ drink }) {
  const { layers, total } = getRecipeLayers(drink);
  const estimated = layers.some((layer) => layer.estimated);

  return (
    <div className="recipe-stack">
      <h3 className="detail-heading">La recette en couches</h3>
      <div className="recipe-stack-bar">
        {layers.map((layer, i) => (
          <span
            key={i}
            className="recipe-stack-segment"
            style={{
              flexGrow: layer.share,
              background: layer.color,
              animationDelay: `${0.15 + i * 0.12}s`,
            }}
          />
        ))}
      </div>
      <ul className="recipe-stack-legend">
        {layers.map((layer, i) => (
          <li key={i}>
            <span className="layer-swatch" style={{ background: layer.color }} />
            {layer.label}
            <span className="layer-share">
              {layer.estimated ? "≈ " : ""}
              {Math.max(1, Math.round(layer.share * 100))} %
            </span>
          </li>
        ))}
      </ul>
      <p className="recipe-stack-total">
        Total {estimated ? "≈ " : ""}
        {Math.round(total)} cl
      </p>
    </div>
  );
}

export default function DrinkDetail({ drink, open, layout, onClose }) {
  const [favorites, setFavorites] = useState(readFavorites);
  const isFavorite = drink && favorites.includes(drink.idDrink);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleFavorite = () => {
    const next = isFavorite
      ? favorites.filter((id) => id !== drink.idDrink)
      : [...favorites, drink.idDrink];
    setFavorites(next);
    writeFavorites(next);
  };

  return (
    <aside className={`detail detail-${layout} ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="detail-close" onClick={onClose} aria-label="Fermer">
        ✕
      </button>

      {drink && (
        <>
          <img className="detail-image" src={drink.strDrinkThumb} alt={drink.strDrink} />

          <h2 className="detail-title">{drink.strDrink}</h2>
          <p className="detail-subtitle">
            {translateCategory(drink.strCategory)} · {translateAlcoholic(drink.strAlcoholic)}
          </p>

          <h3 className="detail-heading">Ingrédients</h3>
          <ul className="detail-ingredients">
            {getIngredients(drink).map((ing, i) => {
              const measure = translateMeasure(ing.measure);
              return (
                <li key={i} style={{ "--dot-color": getIngredientColor(ing.name) }}>
                  {translateIngredient(ing.name)}
                  {measure && <span className="detail-measure"> ({measure})</span>}
                </li>
              );
            })}
          </ul>

          {layout === "full" && <RecipeStack key={drink.idDrink} drink={drink} />}

          <h3 className="detail-heading">Instructions</h3>
          <p className="detail-instructions">{getInstructions(drink)}</p>
          {!drink.strInstructionsFR && (
            <p className="detail-note">Texte original de l'API, en anglais.</p>
          )}

          <hr className="detail-separator" />

          <h3 className="detail-heading">Type de verre</h3>
          <p className="detail-glass">
            <GlassIcon />
            {translateGlass(drink.strGlass)}
          </p>

          <button
            className={`favorite-button ${isFavorite ? "is-active" : ""}`}
            onClick={toggleFavorite}
          >
            <HeartIcon filled={isFavorite} />
            {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          </button>
        </>
      )}
    </aside>
  );
}
