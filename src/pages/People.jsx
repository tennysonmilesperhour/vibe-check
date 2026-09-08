import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Person, Relationship, Connection, DailyCheckIn, User } from "@/entities/all";
import { synergyReading } from "@/lib/wisdom/readings";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageTransition from "@/features/shell/PageTransition";
import { migratePeople, personCheckInStats } from "@/lib/people";
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
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | person
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [synergyBusy, setSynergyBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      await migratePeople({ Person, Relationship, Connection, auth: base44.auth }).catch(() => {});
      const [ppl, ci] = await Promise.all([Person.list(), DailyCheckIn.list("-date", 120).catch(() => [])]);
      setPeople(ppl);
      setCheckIns(ci);
    } catch {
      // empty state below
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
    if (person.synergy_reading && !force) return;
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
                      ? `${stats.mentions} shared ${stats.mentions === 1 ? "day" : "days"} · mood ${stats.avgMood} together · last ${format(parseLocalDate(stats.lastMention), "MMM d")}`
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
                      {stats.mentions} shared days, average mood {stats.avgMood} when together.{" "}
                      <Link to={`${createPageUrl("Analytics")}?person=${detail.id}`} className="underline underline-offset-4" style={{ color: "var(--gh-accent)" }}>
                        See the pattern
                      </Link>
                    </p>
                  ) : null;
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

                <div className="hairline pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>SYNERGY READING</p>
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
                      A one-time reading of how your charts meet. Saved here once generated.
                    </p>
                  )}
                </div>
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
