// Sends the saves kept on this device to the account, each the way its page
// would have saved it (SendKeptSaves runs it).
import { CheckInDraft, DailyCheckIn, JournalEntry } from "@/api/entities";
import { changedElsewhere, holdsSave, sendKeptSaves } from "@/lib/send-kept-saves";

/**
 * Writes one kept save the way its page would have, safe to repeat. A day or
 * entry the account holds a different version of, saved somewhere else since
 * this one started, isn't replaced unless the person chooses this version.
 */
async function sendSave(userId, save) {
  if (save.kind === "check-in") {
    const [stored] = save.force ? [] : await DailyCheckIn.filter({ date: save.payload.date });
    // Already there: this check-in, sent before with its answer lost on the way back.
    if (!stored || !holdsSave(stored, save.payload)) {
      if (stored && stored.updated_at !== save.base) throw changedElsewhere("This day has a saved check-in that's different from this one. Saving this one replaces it.");
      // One check-in per day: sent again, it writes the same day again.
      await DailyCheckIn.upsertFor(userId, save.payload);
    }
    // The draft is done with, as when a check-in is kept online.
    const drafts = await CheckInDraft.filter({ date: save.payload.date }).catch(() => []);
    await Promise.all(drafts.map((draft) => CheckInDraft.delete(draft.id).catch(() => {})));
  } else if (save.edit) {
    if (!save.force) {
      const [stored] = await JournalEntry.filter({ id: save.id });
      if (!stored) throw changedElsewhere("This entry was deleted somewhere else. Saving this version brings it back.");
      if (holdsSave(stored, save.payload)) return;
      if (stored.updated_at !== save.base) throw changedElsewhere("This entry was changed somewhere else too. Saving this version replaces those changes.");
    }
    // Under its own id, so an entry deleted meanwhile comes back as it was.
    await JournalEntry.putWithId(userId, save.id, save.payload);
  } else {
    await JournalEntry.createOnce(userId, save.id, save.payload);
  }
}

/** @param {string} userId */
export const sendAll = (userId) => sendKeptSaves(userId, (save) => sendSave(userId, save));
