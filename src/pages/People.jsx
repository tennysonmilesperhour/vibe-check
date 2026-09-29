import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Person, Relationship, Connection, DailyCheckIn, JournalEntry, User } from "@/entities/all";
import PeopleOrbit from '@/features/people/PeopleOrbit';
import PlantVoice from '@/features/shell/PlantVoice';
import { synergyReading } from "@/lib/wisdom/readings";
import { harmRecordedWith } from "@/lib/symbolic-guard";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageTransition from "@/features/shell/PageTransition";
import { entryInvolvesPerson, migratePeople, peopleRecordedTogether, personCheckInStats } from "@/lib/people";
import { timelineEntries } from "@/lib/living-patterns";
import { parseLocalDate } from "@/lib/dates";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { UserPlus, Users, Sparkle, RefreshCw, Trash2, Pencil } from "lucide-react";

const TYPES = ["family", "friend", "partner", "colleague", "community", "other"];
const EMPTY_FORM = { name: "", person_type: "friend", qualities: "", concerns: "", boundary_notes: "", linked_user_email: "" };

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
  const [form, setForm] = useState(EMPTY_FORM);
  const [synergyBusy, setSynergyBusy] = useState(false);
  // Synergy is part of Cosmos: it shows only once the person has chosen a system there.
  const [usesCosmos, setUsesCosmos] = useState(false);

  const load = useCallback(async () => {
    try {
      await migratePeople({ Person, Relationship, Connection, auth: base44.auth }).catch(() => {});
      const [ppl, ci, entries, me] = await Promise.all([Person.all(), DailyCheckIn.all("-date"), JournalEntry.all('-date'), base44.auth.me().catch(() => null)]);
      // A failed account read keeps what was known, so readings don't vanish.
      if (me) setUsesCosmos((me.cosmic_profile?.enabled_systems || []).length > 0);
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
      linked_user_email: person.linked_user_email || "",
    } : EMPTY_FORM);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      person_type: form.person_type,
      qualities: form.qualities.split(",").map((s) => s.trim()).filter(Boolean),
      concerns: form.concerns.split(",").map((s) => s.trim()).filter(Boolean),
      boundary_notes: form.boundary_notes,
      linked_user_email: form.linked_user_email.trim() || undefined,
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

  const remove = async () => {
    if (!deleting) return;
    try {
      await Person.delete(deleting.id);
      setDeleting(null);
      setDetail(null);
      load();
    } catch {
      setDeleting(null);
    }
  };

  /** Refresh a linked friend's cosmic snapshot when theirs is newer, then read synergy. */
  const generateSynergy = async (person, force = false) => {
    if ((person.synergy_reading && !force) || harmRecordedWith(person, journal)) return;
    setSynergyBusy(true);
    try {
      let snapshot = person.cosmic_snapshot;
      if (person.linked_user_email) {
        const [friend] = await User.filter({ email: person.linked_user_email }).catch(() => []);
        if (friend?.cosmic_profile && (!person.snapshot_updated_at || (friend.updated_date && friend.updated_date > person.snapshot_updated_at))) {
          snapshot = friend.cosmic_profile;
          await Person.update(person.id, { cosmic_snapshot: snapshot, snapshot_updated_at: new Date().toISOString() });
        }
      }
      const me = await base44.auth.me();
      // Composed locally by comparing both blueprints — no API.
      const reading = synergyReading(me?.cosmic_profile || {}, snapshot, person.name);
      const updated = await Person.update(person.id, { synergy_reading: reading, synergy_generated_at: new Date().toISOString() });
      setDetail({ ...person, ...updated, synergy_reading: reading });
      load();
    } catch (err) {
      toast({ title: "Synergy reading failed", description: err?.message, variant: "destructive" });
    }
    setSynergyBusy(false);
  };

  if (loading) return <div className="min-h-[60vh] field-wash" aria-busy="true" />;
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
                      ? `${stats.mentions} tagged check-ins · daily mood ${stats.avgMood} · last ${format(parseLocalDate(stats.lastMention), "MMM d")}`
                      : "Not yet part of a check-in"}
                  </p>
                  {person.linked_user_email && (
                    <p className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: "var(--gh-accent)" }}>
                      <Sparkle className="w-3 h-3" aria-hidden="true" /> On vibe check
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* detail dialog */}
        <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {detail && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl flex items-center justify-between">
                    {detail.name}
                    <span className="flex gap-1">
                      <button type="button" aria-label={`Edit ${detail.name}`} onClick={() => openEdit(detail)}>
                        <Pencil className="w-4 h-4" style={{ color: "var(--gh-ink-muted)" }} />
                      </button>
                      <button type="button" aria-label={`Delete ${detail.name}`} onClick={() => setDeleting(detail)}>
                        <Trash2 className="w-4 h-4" style={{ color: "var(--gh-ink-muted)" }} />
                      </button>
                    </span>
                  </DialogTitle>
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
                <div className="living-inset"><p className="living-muted">{journal.filter((entry) => entryInvolvesPerson(entry, detail)).length} journal moments linked to this person.</p><Link className="living-text-link mt-2" to={`/Analytics?tab=journal&person=${detail.id}&range=all`}>Read the full relationship history</Link></div>
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

                {usesCosmos && harmRecordedWith(detail, journal) && (
                  <div className="hairline pt-4">
                    <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>NO SYNERGY READING</p>
                    <p className="text-sm mt-2" style={{ color: "var(--gh-ink)" }}>
                      A moment you recorded with {detail.name} in it is marked unsafe, or as one where a boundary wasn't respected. A chart can't weigh that, so no reading is offered. Your entries with {detail.name} stay in your history.{" "}
                      <Link to="/support-now?focus=relationship" className="underline underline-offset-4" style={{ color: "var(--gh-accent)" }}>Support for relationships</Link>
                    </p>
                  </div>
                )}
                {usesCosmos && !harmRecordedWith(detail, journal) && <div className="hairline pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>SYNERGY READING · FROM COSMOS</p>
                    <button
                      type="button"
                      className="text-xs font-bold inline-flex items-center gap-1 underline underline-offset-4"
                      style={{ color: "var(--gh-accent)" }}
                      onClick={() => generateSynergy(detail, !!detail.synergy_reading)}
                      disabled={synergyBusy}
                    >
                      <RefreshCw className={`w-3 h-3 ${synergyBusy ? "animate-spin" : ""}`} aria-hidden="true" />
                      {synergyBusy ? "Reading…" : detail.synergy_reading ? "Refresh" : "Generate"}
                    </button>
                  </div>
                  {detail.synergy_reading ? (
                    <p className="text-sm mt-2 whitespace-pre-line" style={{ color: "var(--gh-ink)" }}>{detail.synergy_reading}</p>
                  ) : (
                    <p className="text-xs mt-2" style={{ color: "var(--gh-ink-muted)" }}>
                      A symbolic comparison of your chart with any chart details saved for {detail.name}. It can't tell you how you are treated. Saved here once made.
                    </p>
                  )}
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
              <div>
                <Label htmlFor="p-email">Their vibe check email (optional, links profiles for synergy)</Label>
                <Input id="p-email" type="email" value={form.linked_user_email} onChange={(e) => setForm({ ...form, linked_user_email: e.target.value })} className="mt-1" />
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
            <AlertDialogFooter>
              <AlertDialogCancel>Keep them</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Remove person</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </div>
  );
}
