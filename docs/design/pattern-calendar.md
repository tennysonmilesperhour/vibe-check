# Pattern calendar

The live Patterns screen should answer: when do lower mood or higher stress recur, how do they cluster across months and weekdays, and what was recorded on those days?

Use a calendar heatmap at daily grain, with selectable mood, stress, energy, and sleep. Month previews reveal longer stretches; selecting a month opens numbered, scored days. A weekday comparison retains its sample counts. The interface uses the app's React components rather than a separate report artifact.

Mood, energy, and sleep use daily check-ins only. Stress uses the highest explicitly recorded score from any matching entry that day; do not average away a difficult moment. Every view follows the page's date, person, habit, feeling, and text filters. An untagged day is unknown. Missing scores, zero, excluded days, and future dates remain distinct. An unsafe interaction has an independent diamond marker even on a high-mood day.

Palette: fixed five-bin scales across every month (0–2, >2–4, >4–6, >6–8, >8–10). Mood uses clay through paper to evergreen; stress uses paper to dark clay. Energy and sleep use paper to evergreen. Scores, dates, labels, and a separate unsafe marker supply non-color distinctions. Sparse data retains gaps and counts; weekday means require three scored days. Never imply causation or diagnose a recurring state.

QA: verify date alignment for both week starts, leap days, missing/zero values, day-versus-moment aggregation, filter fidelity, keyboard/touch month and day selection, and desktop/mobile rendering with the full demo history. Ship through the existing Vercel production app.
