import { translateCategory, translateIngredient } from "../utils/translations.js";

function CocktailIcon() {
  return (
    <svg className="logo-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M4 5h24L16 18z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 18v9M10 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 2l-3 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Header({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  ingredient,
  onIngredientChange,
  ingredients,
  muted,
  onToggleMute,
}) {
  return (
    <header className="header">
      <div className="logo">
        <CocktailIcon />
        <span>Bar 3D</span>
      </div>

      <label className={`search ${search ? "is-active" : ""}`}>
        <SearchIcon />
        <input
          type="search"
          placeholder="Rechercher un cocktail…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Rechercher un cocktail"
        />
      </label>

      <div className="filters">
        <select
          className={`filter ${category ? "is-active" : ""}`}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filtrer par catégorie"
        >
          <option value="">Catégorie</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {translateCategory(c)}
            </option>
          ))}
        </select>

        <select
          className={`filter ${ingredient ? "is-active" : ""}`}
          value={ingredient}
          onChange={(e) => onIngredientChange(e.target.value)}
          aria-label="Filtrer par ingrédient"
        >
          <option value="">Ingrédient</option>
          {ingredients.map((i) => (
            <option key={i} value={i}>
              {translateIngredient(i)}
            </option>
          ))}
        </select>
      </div>

      <button
        className="sound-toggle"
        onClick={onToggleMute}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        title={muted ? "Activer le son" : "Couper le son"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </header>
  );
}
