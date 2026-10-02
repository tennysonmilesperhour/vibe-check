import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParamState } from "@/lib/deeplink";
import { base44 } from "@/api/base44Client";
import { Person, Relationship, DailyCheckIn, JournalEntry } from "@/entities/all";
import PeopleOrbit from '@/features/people/PeopleOrbit';
import PlantVoice from '@/features/shell/PlantVoice';
import { synergyReading } from "@/lib/wisdom/readings";
import { harmRecordedWith, recentHardMoment } from "@/lib/symbolic-guard";
import GuardedReading from "@/features/cosmos/GuardedReading";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageTransition from "@/features/shell/PageTransition";
import { describeInteractionMix, interactionMix, migratePeople, peopleRecordedTogether, personCheckInStats, personTimeline } from "@/lib/people";
import { entryText, timelineEntries } from "@/lib/living-patterns";
import { formatDay } from "@/lib/dates";
import { createPageUrl } from "@/utils";
import { UserPlus, Users, RefreshCw, Trash2, Pencil, ArrowRight, ArrowUpRight } from "lucide-react";
import LoadingState from "@/features/shell/LoadingState";

const TYPES = ["family", "friend", "partner", "colleague", "community", "other"];
const EMPTY_FORM = { name: "", person_type: "friend", qualities: "", concerns: "", boundary_notes: "" };
const TIMELINE_PAGE = 8;

/** What an entry was, for a line in someone's timeline. */
const entryKind = (entry) => (entry.kind === "day" ? "Daily check-in" : entry.interaction_feeling ? `Interaction · ${entry.interaction_feeling}` : "Journal moment");

/** Everyone you're in orbit with: merged Relationships + Constellation. */
export default function People() {
  const { toast } = useToast();
  const [people, setPeople] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [journal, setJournal] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | person
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [timelineShown, setTimelineShown] = useState(TIMELINE_PAGE);
  const [form, setForm] = useState(EMPTY_FORM);
  const [synergyBusy, setSynergyBusy] = useState(false);
  // Synergy is part of Cosmos: it shows only once the person has chosen a system there.
  const [usesCosmos, setUsesCosmos] = useState(false);
  const [myChart, setMyChart] = useState(null);
  // Like the readings in Cosmos, synergy waits for a few days after a hard
  // moment, worked out from the history this page has already loaded.
  const guard = useMemo(() => ({ moment: recentHardMoment({ checkIns, journal }), checking: false }), [checkIns, journal]);
  const [readAnyway, setReadAnyway] = useState(false);
  const harm = useMemo(() => (detail ? harmRecordedWith(detail, journal) : false), [detail, journal]);
  // Asking for a reading is remembered; the reading itself is composed from
  // both charts each time, so it always uses today's wording.
  const askedForSynergy = Boolean(detail?.synergy_generated_at || detail?.synergy_reading);
  const synergyText = useMemo(
    () => (usesCosmos && askedForSynergy && !harm ? synergyReading(myChart || {}, detail.cosmic_snapshot, detail.name) : null),
    [usesCosmos, askedForSynergy, harm, myChart, detail],
  );

  const load = useCallback(async () => {
    try {
      await migratePeople({ Person, Relationship, auth: base44.auth }).catch(() => {});
      const [ppl, ci, entries, me] = await Promise.all([Person.all(), DailyCheckIn.all("-date"), JournalEntry.all('-date'), base44.auth.me().catch(() => null)]);
      // A failed account read keeps what was known, so readings don't vanish.
      if (me) {
        setUsesCosmos((me.cosmic_profile?.enabled_systems || []).length > 0);
        setMyChart(me.cosmic_profile || {});
      }
      setPeople(ppl);
      setCheckIns(ci);
      setJournal(entries.filter((entry) => !entry.is_draft));
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (person) => {
    setEditing(person || "new");
    setForm(person ? {
      name: person.name,
      person_type: person.person_type || "friend",
      qualities: (person.qualities || []).join(", "),
      concerns: (person.concerns || []).join(", "),
      boundary_notes: person.boundary_notes || "",
    } : EMPTY_FORM);
  };

  // The Add menu opens the form here with ?add=1, once the people have loaded.
  const [addParam, setAddParam] = useSearchParamState("add", "");
  useEffect(() => {
    if (loading || addParam !== "1") return;
    openEdit(null);
    setAddParam("");
  }, [loading, addParam]);

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      person_type: form.person_type,
      qualities: form.qualities.split(",").map((s) => s.trim()).filter(Boolean),
      concerns: form.concerns.split(",").map((s) => s.trim()).filter(Boolean),
      boundary_notes: form.boundary_notes,
    };
    if (!payload.name) return;
    try {
      if (editing === "new") await Person.create(payload);
      else await Person.update(editing.id, payload);
      setEditing(null);
      setDetail(null);
      load();
      toast({ title: editing === "new" ? `${payload.name} added` : "Saved" });
    } catch (err) {
      toast({ title: "Could not save", description: err?.message, variant: "destructive" });
    }
  };

  // Each person's timeline starts from its most recent entries.
  useEffect(() => { setTimelineShown(TIMELINE_PAGE); }, [detail?.id]);

  const askToRemove = (person) => {
    setRemoveError("");
    setDeleting(person);
  };

  // The dialog stays open until the removal is done, so a failure can say so.
  const remove = async (e) => {
    e.preventDefault();
    const person = deleting;
    if (!person || removing) return;
    setRemoving(true);
    setRemoveError("");
    try {
      await Person.delete(person.id);
      setPeople((list) => list.filter((other) => other.id !== person.id));
      setDeleting(null);
      setDetail(null);
    } catch {
      setRemoveError("This person couldn't be removed. Check your connection and try again.");
    } finally {
      setRemoving(false);
    }
  };

  /**
   * Remember that the person asked for a synergy reading. Another account's
   * chart can't be read from here, so the reading uses the chart saved for
   * this person.
   */
  const generateSynergy = async (person) => {
    if (harmRecordedWith(person, journal)) return;
    setSynergyBusy(true);
    try {
      // Only the request is stored; text saved by earlier versions is never shown.
      const updated = await Person.update(person.id, { synergy_generated_at: new Date().toISOString() });
      setDetail({ ...person, ...updated });
      load();
    } catch (err) {
      toast({ title: "Synergy reading failed", description: err?.message, variant: "destructive" });
    }
    setSynergyBusy(false);
  };

  if (loading) return <div className="field-wash min-h-screen" aria-busy="true"><div className="living-page"><LoadingState variant="page" label="Gathering your people…" /></div></div>;
  const entries = timelineEntries(checkIns, journal);

  return (
    <div className="field-wash min-h-screen">
      <PageTransition className="max-w-4xl mx-auto px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl" style={{ color: "var(--gh-ink)" }}>People</h1>
            <p className="text-sm mt-1" style={{ color: "var(--gh-ink-muted)" }}>Everyone you're in orbit with</p>
          </div>
          <button type="button" className="ink-button text-sm inline-flex items-center gap-2" onClick={() => openEdit(null)}>
            <UserPlus className="w-4 h-4" aria-hidden="true" /> Add person
          </button>
        </header>

        {loadError && <p role="alert" className="living-error mt-4">{loadError} <button className="underline" onClick={load}>Retry</button></p>}
        <div className="mt-6"><PlantVoice compact>Keep people here by a name or nickname that works for you. We can return to the experiences you recorded together. Adding someone sends no invitation or notification.</PlantVoice></div>
        <PeopleOrbit people={people} entries={entries} onChoose={setDetail} />

        {people.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-10 h-10 mx-auto" style={{ color: "var(--gh-ink-muted)" }} aria-hidden="true" />
            <h2 className="text-2xl mt-4" style={{ color: "var(--gh-ink)" }}>No one in orbit yet</h2>
            <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "var(--gh-ink-muted)" }}>
              Add the people who shape your days. Mention them in check-ins and this page starts showing how each one moves your sky.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 mt-8">
            {people.map((person) => {
              const stats = personCheckInStats(person, checkIns);
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setDetail(person)}
                  className="text-left p-4 transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl" style={{ color: "var(--gh-ink)" }}>{person.name}</h3>
                    <span className="text-xs px-2 py-0.5" style={{ border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 3px)", color: "var(--gh-ink-muted)" }}>
                      {person.person_type || "friend"}
                    </span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--gh-ink-muted)" }}>
                    {stats.mentions > 0
                      ? `${stats.mentions} tagged check-ins · daily mood ${stats.avgMood} · last ${formatDay(stats.lastMention, { style: 'short' })}`
                      : "Not yet part of a check-in"}
                  </p>
                  {(() => {
                    const mix = interactionMix(person, entries);
                    return mix.total > 0 ? (
                      <p className="text-xs mt-1" style={{ color: "var(--gh-ink-muted)" }}>
                        Interactions: {describeInteractionMix(mix)}{mix.unsafe > 0 && <span aria-hidden="true" style={{ color: "var(--feel-unsafe)" }}> ◆</span>}
                      </p>
                    ) : null;
                  })()}
                </button>
              );
            })}
          </div>
        )}

        {/* detail dialog */}
        <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
          <DialogContent>
            {detail && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between gap-3">
                    <DialogTitle className="font-display text-2xl min-w-0">{detail.name}</DialogTitle>
                    <span className="flex gap-2 shrink-0">
                      <button type="button" className="living-icon-button" aria-label={`Edit ${detail.name}`} onClick={() => openEdit(detail)}>
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button type="button" className="living-icon-button danger-icon" aria-label={`Delete ${detail.name}`} onClick={() => askToRemove(detail)}>
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                </DialogHeader>

                {(() => {
                  const stats = personCheckInStats(detail, checkIns);
                  return stats.mentions > 0 ? (
                    <p className="text-sm" style={{ color: "var(--gh-ink-soft)" }}>
                      {stats.mentions} check-ins tagged with this person{stats.avgMood != null ? `; average daily mood ${stats.avgMood} in those entries` : ""}.{" "}
                      <Link to={`${createPageUrl("Analytics")}?person=${detail.id}&range=all`} className="underline underline-offset-4" style={{ color: "var(--gh-accent)" }}>
                        See the pattern
                      </Link>
                    </p>
                  ) : null;
                })()}
                {(() => {
                  const timeline = personTimeline(detail, entries);
                  const mix = interactionMix(detail, entries);
                  return (
                    <section className="space-y-3" aria-labelledby="person-timeline-heading">
                      <h3 id="person-timeline-heading" className="text-xl">Your timeline with {detail.name}</h3>
                      {mix.total > 0 && <p className="text-sm">Interactions you recorded: {describeInteractionMix(mix)}.</p>}
                      {mix.unsafe > 0 && <Link className="living-text-link text-sm" to="/support-now?focus=relationship">Support for unsafe relationships <ArrowRight size={14} aria-hidden="true" /></Link>}
                      {timeline.length ? (
                        <ol className="person-timeline">
                          {timeline.slice(0, timelineShown).map((entry) => (
                            <li key={entry.key}>
                              <p className="living-label">{formatDay(entry.date)} · {entryKind(entry)}{entry.interaction_feeling === "unsafe" ? " ◆" : ""}{entry.mood_score != null ? ` · mood ${entry.mood_score}/10` : ""}</p>
                              {entryText(entry) && <p className="person-timeline-text">{entryText(entry).replace(/\s+/g, " ")}</p>}
                              <Link className="living-text-link text-sm" to={`/Analytics?tab=journal&entry=${encodeURIComponent(entry.key)}`}>Read the entry <ArrowUpRight size={13} aria-hidden="true" /></Link>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="living-muted text-sm">Nothing recorded with {detail.name} yet. Tag them in a check-in or a moment, and those entries gather here.</p>
                      )}
                      {timeline.length > timelineShown && (
                        <button type="button" className="living-secondary" onClick={() => setTimelineShown((count) => count + TIMELINE_PAGE)}>Show earlier entries ({timeline.length - timelineShown})</button>
                      )}
                    </section>
                  );
                })()}
                {(() => {
                  const companions = peopleRecordedTogether(detail, people, entries);
                  if (!companions.length) return null;
                  return (
                    <div>
                      <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>RECORDED TOGETHER</p>
                      <p className="living-muted text-sm mt-1">People you tagged in the same check-in or journal moment with the people picker.</p>
                      <div className="living-chips mt-2">
                        {companions.map(({ person, shared }) => (
                          <button
                            key={person.id}
                            type="button"
                            className="living-chip"
                            onClick={() => setDetail(person)}
                          >
                            {person.name} · {shared} {shared === 1 ? "entry" : "entries"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {detail.qualities?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>WHAT YOU VALUE</p>
                    <p className="text-sm mt-1" style={{ color: "var(--gh-ink)" }}>{detail.qualities.join(" · ")}</p>
                  </div>
                )}
                {detail.concerns?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>WHAT YOU WATCH</p>
                    <p className="text-sm mt-1" style={{ color: "var(--gh-ink)" }}>{detail.concerns.join(" · ")}</p>
                  </div>
                )}
                {detail.boundary_notes && (
                  <div>
                    <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>YOUR BOUNDARY</p>
                    <p className="text-sm mt-1" style={{ color: "var(--gh-ink)" }}>{detail.boundary_notes}</p>
                  </div>
                )}

                {usesCosmos && harm && (
                  <div className="hairline pt-4">
                    <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>NO SYNERGY READING</p>
                    <p className="text-sm mt-2" style={{ color: "var(--gh-ink)" }}>
                      A moment you recorded with {detail.name} in it is marked unsafe, or as one where a boundary wasn't respected. A chart can't weigh that, so no reading is offered. Your entries with {detail.name} stay in your history.{" "}
                      <Link to="/support-now?focus=relationship" className="underline underline-offset-4" style={{ color: "var(--gh-accent)" }}>Support for relationships</Link>
                    </p>
                  </div>
                )}
                {usesCosmos && !harm && <div className="hairline pt-4">
                  <GuardedReading guard={guard} readAnyway={readAnyway} onReadAnyway={() => setReadAnyway(true)} compact>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>SYNERGY READING · FROM COSMOS</p>
                      {!synergyText && (
                        <button
                          type="button"
                          className="text-xs font-bold inline-flex items-center gap-1 underline underline-offset-4"
                          style={{ color: "var(--gh-accent)" }}
                          onClick={() => generateSynergy(detail)}
                          disabled={synergyBusy}
                        >
                          <RefreshCw className={`w-3 h-3 ${synergyBusy ? "animate-spin" : ""}`} aria-hidden="true" />
                          {synergyBusy ? "Reading…" : "Generate"}
                        </button>
                      )}
                    </div>
                    {synergyText ? (
                      <p className="text-sm mt-2 whitespace-pre-line" style={{ color: "var(--gh-ink)" }}>{synergyText}</p>
                    ) : (
                      <p className="text-xs mt-2" style={{ color: "var(--gh-ink-muted)" }}>
                        A symbolic comparison of your chart with any chart details saved for {detail.name}. It can't tell you how you are treated. Shown here once you ask for it.
                      </p>
                    )}
                  </GuardedReading>
                </div>}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* add/edit dialog */}
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{editing === "new" ? "Add a person" : `Edit ${form.name}`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div>
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <Label>Relationship</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {TYPES.map((t) => (
                    <button key={t} type="button" aria-pressed={form.person_type === t} onClick={() => setForm({ ...form, person_type: t })}
                      className="px-3 py-1.5 text-xs"
                      style={form.person_type === t
                        ? { background: "var(--gh-ink)", color: "var(--gh-field)" }
                        : { border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 3px)", color: "var(--gh-ink-soft)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="p-qualities">Qualities you appreciate (comma separated)</Label>
                <Input id="p-qualities" value={form.qualities} onChange={(e) => setForm({ ...form, qualities: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="p-concerns">Concerns (comma separated)</Label>
                <Input id="p-concerns" value={form.concerns} onChange={(e) => setForm({ ...form, concerns: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="p-boundary">Boundary notes</Label>
                <Textarea id="p-boundary" value={form.boundary_notes} onChange={(e) => setForm({ ...form, boundary_notes: e.target.value })} rows={2} className="mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 text-sm" style={{ border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 3px)", color: "var(--gh-ink-soft)" }} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="ink-button text-sm">{editing === "new" ? "Add person" : "Save changes"}</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Their card and synergy reading are deleted. Past check-ins that mention them stay untouched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {removeError && <p className="living-error" role="alert">{removeError}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel>Keep them</AlertDialogCancel>
              <AlertDialogAction variant="destructive" aria-disabled={removing} onClick={remove}>{removing ? "Removing…" : "Remove person"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </div>
  );
}
