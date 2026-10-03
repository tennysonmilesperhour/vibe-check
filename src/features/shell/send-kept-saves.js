// Sends the saves kept on this device to the account, each the way its page
// would have saved it (SendKeptSaves runs it).
import { CheckInDraft, DailyCheckIn, JournalEntry } from "@/api/entities";
import { signedInAs } from "@/api/supabase";
import { keptSaves } from "@/lib/kept-saves";
import { changedElsewhere, holdsSave, sendKeptSaves, writtenHere } from "@/lib/send-kept-saves";
import { isNewerVersion } from "@/lib/writing-buffer";

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
      if (stored && stored.updated_at !== save.base && !writtenHere(stored, save)) throw changedElsewhere("This day has a saved check-in that's different from this one. Saving this one replaces it.");
      // One check-in per day: sent again, it writes the same day again.
      await DailyCheckIn.upsertFor(userId, save.payload);
    }
    // Drafts this check-in holds are done with, as when one is kept online. A
    // draft saved since (on another device) stays for the person to see.
    const drafts = await CheckInDraft.filter({ date: save.payload.date }).catch(() => []);
    await Promise.all(drafts.filter((draft) => !isNewerVersion(draft.updated_at, save.seen)).map((draft) => CheckInDraft.delete(draft.id).catch(() => {})));
  } else if (save.edit) {
    if (!save.force) {
      const [stored] = await JournalEntry.filter({ id: save.id });
      if (!stored) throw changedElsewhere("This entry was deleted somewhere else. Saving this version brings it back.");
      if (holdsSave(stored, save.payload)) return;
      if (stored.updated_at !== save.base && !writtenHere(stored, save)) throw changedElsewhere("This entry was changed somewhere else too. Saving this version replaces those changes.");
    }
    // Under its own id, so an entry deleted meanwhile comes back as it was.
    await JournalEntry.putWithId(userId, save.id, save.payload);
  } else {
    await JournalEntry.createOnce(userId, save.id, save.payload);
  }
}

/**
 * Sends the person's kept saves, once their requests go out signed in. After
 * a long time offline the session waits to be renewed for up to a minute;
 * meanwhile requests would go out signed out, reads would come back empty and
 * writes refused, so nothing is sent until then.
 * @param {string} userId
 */
export async function sendAll(userId) {
  if (!(await signedInAs(userId))) return { sent: 0, waiting: keptSaves(userId).length, kinds: new Set() };
  return sendKeptSaves(userId, (save) => sendSave(userId, save));
}
