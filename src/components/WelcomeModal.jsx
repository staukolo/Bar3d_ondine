import { useEffect, useRef, useState } from "react";

const STEPS = [
  { icon: "🍹", title: "Parcourir", text: "Flèches ou clavier pour défiler." },
  { icon: "👆", title: "Cliquer", text: "Un verre ouvre sa recette." },
  { icon: "🔍", title: "Filtrer", text: "Par nom, catégorie ou ingrédient." },
  { icon: "🖱️", title: "Tourner", text: "Glisser pour pivoter, molette pour zoomer." },
];

const CLOSE_DURATION = 400;

export default function WelcomeModal({ onLeave, onEnter }) {
  const [closing, setClosing] = useState(false);
  const buttonRef = useRef(null);

  const enter = () => {
    if (closing) return;
    setClosing(true);
    onLeave();
    setTimeout(onEnter, CLOSE_DURATION);
  };

  useEffect(() => {
    buttonRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className={`welcome ${closing ? "is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <p className="welcome-kicker">Bienvenue au</p>
        <h1 id="welcome-title" className="welcome-title">
          Bar <span>3D</span>
        </h1>
        <p className="welcome-intro">
          Le bar 100 % sans alcool : chaque verre est une vraie recette de mocktail.
        </p>

        <ul className="welcome-steps">
          {STEPS.map((step) => (
            <li key={step.title} className="welcome-step">
              <span className="welcome-step-icon" aria-hidden="true">
                {step.icon}
              </span>
              <div>
                <h2 className="welcome-step-title">{step.title}</h2>
                <p className="welcome-step-text">{step.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <button ref={buttonRef} className="welcome-button" onClick={enter}>
          Entrer dans le bar
        </button>
      </div>
    </div>
  );
}
