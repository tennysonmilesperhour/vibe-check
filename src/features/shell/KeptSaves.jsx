import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { KEPT_SAVES_EVENT, SEND_KEPT_SAVES_EVENT, keptSaves, needsChoice } from "@/lib/kept-saves";
// Part of the first load: a failed import() stays failed until the page
// reloads, so loading this later could fail offline and never send.
import { sendAll } from "./send-kept-saves";

/** The person's saves kept on this device, kept current across tabs. */
export function useKeptSaves(userId) {
  const [saves, setSaves] = useState(() => keptSaves(userId));
  useEffect(() => {
    const read = () => setSaves(keptSaves(userId));
    read();
    window.addEventListener(KEPT_SAVES_EVENT, read);
    // Another tab keeping or sending one.
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(KEPT_SAVES_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [userId]);
  return saves;
}

const RETRY_MS = 60_000;

/**
 * Sends the saves kept while offline: on opening, when the connection
 * returns, when the tab comes back into view, when the person asks, and
 * every minute while any wait. One tab sends at a time.
 */
export default function SendKeptSaves({ userId }) {
  const client = useQueryClient();
  const { toast } = useToast();
  const sending = useRef(false);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    // Asked for while a send was under way: sent once that one is done.
    let again = false;
    const run = async () => {
      if (sending.current) { again = true; return; }
      // The device reports no connection: the "online" event says when to try.
      if (navigator.onLine === false || !keptSaves(userId).some((save) => !needsChoice(save))) return;
      sending.current = true;
      try {
        const choices = keptSaves(userId).filter(needsChoice).length;
        const send = () => sendAll(userId);
        const { sent } = navigator.locks?.request ? await navigator.locks.request(`vibe-kept-saves:${userId}`, send) : await send();
        if (sent && active) {
          await client.invalidateQueries({ queryKey: ["living", userId] });
          toast({ title: sent === 1 ? "Saved to your account" : `${sent} entries saved to your account`, description: "What you kept on this device while offline is in your record now." });
        }
        if (active && keptSaves(userId).filter(needsChoice).length > choices) {
          toast({ title: "A kept entry needs your choice", description: "Open Today to see it and choose what happens to it." });
        }
      } catch {
        // Tried again on the next chance.
      } finally {
        sending.current = false;
      }
      if (again && active) {
        again = false;
        run();
      }
    };
    run();
    const onVisible = () => { if (document.visibilityState === "visible") run(); };
    window.addEventListener("online", run);
    window.addEventListener(SEND_KEPT_SAVES_EVENT, run);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(run, RETRY_MS);
    return () => {
      active = false;
      window.removeEventListener("online", run);
      window.removeEventListener(SEND_KEPT_SAVES_EVENT, run);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [userId, client, toast]);

  return null;
}
