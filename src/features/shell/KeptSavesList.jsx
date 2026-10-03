import { useState } from "react";
import { formatDay } from "@/lib/dates";
import { dropSave, needsChoice, sendAgain } from "@/lib/kept-saves";

const describe = (save) => {
  const day = save.payload?.date ? formatDay(save.payload.date) : "an earlier day";
  if (save.kind === "check-in") return `Check-in for ${day}`;
  return save.edit ? `Changes to your entry from ${day}` : `Moment from ${day}`;
};
const excerpt = (save) => {
  const notes = String(save.payload?.notes || "").trim();
  return notes.length > 80 ? `${notes.slice(0, 80)}…` : notes;
};

/**
 * Saves kept on this device, each with what it is, and the choice any of
 * them waits on: saving it over a different version in the account, trying
 * one the account refused again, or discarding it.
 */
export default function KeptSavesList({ userId, saves }) {
  const [discarding, setDiscarding] = useState(null);
  return (
    <ul className="space-y-3">
      {saves.map((save) => (
        <li key={save.id} className="text-sm">
          {/* Each choice names the save it's for, as several can wait at once. */}
          <p id={`kept-save-${save.id}`}>
            <span className="font-medium">{describe(save)}</span>
            {save.kind === "check-in" && save.payload?.mood_score != null && ` · mood ${save.payload.mood_score} of 10`}
            {excerpt(save) && ` · ${excerpt(save)}`}
          </p>
          {save.conflict && <p className="living-muted mt-1">{save.conflict}</p>}
          {save.refused && <p className="living-error mt-1">Your account didn't accept this: {save.refused}</p>}
          {needsChoice(save) && (discarding === save.id ? (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span>Discard it for good? It's only on this device.</span>
              <button type="button" className="living-secondary" autoFocus aria-describedby={`kept-save-${save.id}`} onClick={() => setDiscarding(null)}>Keep it</button>
              <button type="button" className="danger-link" aria-describedby={`kept-save-${save.id}`} onClick={() => { setDiscarding(null); dropSave(userId, save.id); }}>Discard</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 mt-2">
              <button type="button" className="living-secondary" aria-describedby={`kept-save-${save.id}`} onClick={() => sendAgain(userId, save.id)}>{save.conflict ? "Save this version" : "Try again"}</button>
              <button type="button" className="danger-link" aria-describedby={`kept-save-${save.id}`} onClick={() => setDiscarding(save.id)}>{save.conflict ? "Discard this version" : "Discard it"}</button>
            </div>
          ))}
        </li>
      ))}
    </ul>
  );
}
