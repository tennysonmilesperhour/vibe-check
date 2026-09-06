import React, { useState } from "react";
import SkyField from "./SkyField";
import WeatherOrb from "@/features/today/WeatherOrb";
import { WEATHER_STATES, weatherForScore } from "@/features/today/weather";

const steps = [
  {
    title: "Keep the day",
    body: "Record mood, energy, sleep, feelings, activities, and any moment you want to remember.",
  },
  {
    title: "Notice what repeats",
    body: "After a few entries, see changes over time and the people or activities connected with better days.",
  },
  {
    title: "Return with context",
    body: "A private device reminder and Sunday review turn scattered entries into a practice you can sustain.",
  },
];

export default function PublicProductIntro({ onStart, onSignIn }) {
  const [previewScore, setPreviewScore] = useState(8);
  const previewWeather = weatherForScore(previewScore);

  return (
    <main className="public-product">
      <section className="public-product__intro" aria-labelledby="product-heading">
        <div>
          <p className="public-product__label">A private evening mood journal</p>
          <h1 id="product-heading">A clearer record of your real days.</h1>
        </div>
        <div>
          <p className="public-product__lede">
            Vibe Check turns a short nightly reflection into a useful personal history. The core journal works without astrology or AI; those tools stay optional.
          </p>
          <div className="public-product__actions">
            <button type="button" className="ink-button" onClick={onStart}>Create your account</button>
            <button type="button" className="secondary-action" onClick={onSignIn}>Sign in</button>
          </div>
        </div>
      </section>

      <SkyField moodScore={previewScore} veilIntensity={0.4} className="public-product__weather">
        <section className="public-product__weather-content" aria-labelledby="weather-preview-heading">
          <div className="public-product__weather-spacer" aria-hidden="true" />
          <p className="text-sm" style={{ color: "rgba(255,253,246,0.78)" }}>Try the first question</p>
          <h2 id="weather-preview-heading">What was the atmosphere inside you today?</h2>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,253,246,0.85)" }}>{previewWeather.description}</p>
          <div className="weather-choices mt-6" role="radiogroup" aria-label="Preview an inner weather">
            {WEATHER_STATES.map((weather) => (
              <button
                key={weather.id}
                type="button"
                role="radio"
                aria-checked={previewWeather.id === weather.id}
                className="weather-choice"
                onClick={() => setPreviewScore(weather.score)}
              >
                <WeatherOrb score={weather.score} size="choice" selected={previewWeather.id === weather.id} />
                <span>{weather.label}</span>
              </button>
            ))}
          </div>
        </section>
      </SkyField>

      <ol className="public-product__steps" aria-label="How Vibe Check works">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span aria-hidden="true">{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="public-product__privacy" aria-labelledby="privacy-heading">
        <div>
          <h2 id="privacy-heading">Your entries are yours.</h2>
          <p>Your account is private, exports can be encrypted, and account deletion is available in Settings. Vibe Check does not sell personal data or use it for advertising.</p>
        </div>
        <button type="button" className="ink-button" onClick={onStart}>Create your account</button>
      </section>

      <section className="public-product__faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Questions people ask</h2>
        <details>
          <summary>How long does a check-in take?</summary>
          <p>The guided flow is designed for about one minute. Only mood, energy, and sleep require an answer; the rest can be skipped.</p>
        </details>
        <details>
          <summary>Does Vibe Check provide medical advice?</summary>
          <p>No. It is a personal reflection and entertainment app, not a medical device or a substitute for professional care.</p>
        </details>
        <details>
          <summary>Are the tarot and cosmic tools required?</summary>
          <p>No. They are optional reflection lenses. Vibe Check does not present AI guesses as factual birth-chart calculations or astronomical forecasts.</p>
        </details>
        <details>
          <summary>Can I export or delete my information?</summary>
          <p>Yes. Settings includes full-history export, optional encrypted export, and permanent account deletion.</p>
        </details>
      </section>
    </main>
  );
}
