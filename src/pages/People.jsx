import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Person, Relationship, Connection, DailyCheckIn } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageTransition from "@/features/shell/PageTransition";
import { migratePeople, personCheckInStats } from "@/lib/people";
import { createPageUrl } from "@/utils";
import { UserPlus, Users, RefreshCw, Trash2, Pencil } from "lucide-react";
import PeopleOrbit from "@/features/people/PeopleOrbit";
import InsightReading from "@/features/shell/InsightReading";

const TYPES = ["family", "friend", "partner", "colleague", "community", "other"];
const EMPTY_FORM = { name: "", person_type: "friend", qualities: "", concerns: "", boundary_notes: "" };

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
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await migratePeople({ Person, Relationship, Connection, auth: base44.auth }).catch(() => {});
      const [ppl, ci] = await Promise.all([Person.list(), DailyCheckIn.list("-date", 120).catch(() => [])]);
      setPeople(ppl);
      setCheckIns(ci);
    } catch (error) {
      setLoadError(error?.message || "People could not be loaded.");
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

  const remove = async () => {
    if (!deleting) return;
    try {
      await Person.delete(deleting.id);
      setDeleting(null);
      setDetail(null);
      load();
    } catch (error) {
      setDeleting(null);
      toast({ title: "Could not delete person", description: error?.message || "Check your connection and try again.", variant: "destructive" });
    }
  };

  /** Refresh a linked friend's cosmic snapshot when theirs is newer, then read synergy. */
  const generateSynergy = async (person, force = false) => {
    if (person.synergy_reading && !force) return;
    setSynergyBusy(true);
    try {
      const snapshot = person.cosmic_snapshot;
      const me = await base44.auth.me();
      const text = await InvokeLLM({
        prompt: `You are a relational astrologer and systems reader. Compare these two cosmic profiles and describe the synergy: where these two people naturally feed each other, and where friction is structural rather than personal.

PERSON A (the reader): ${JSON.stringify(me?.cosmic_profile || {})}
PERSON B (${person.name}): ${JSON.stringify(snapshot || { note: "profile unknown; speak to what a connection needs when one chart is a mystery" })}

Warm, specific, honest. No em dashes. 2-3 short paragraphs.`,
      });
      const reading = typeof text === "string" ? text : text?.response || "";
      const updated = await Person.update(person.id, { synergy_reading: reading, synergy_generated_at: new Date().toISOString() });
      setDetail({ ...person, ...updated, synergy_reading: reading });
      load();
    } catch (err) {
      toast({ title: "Synergy reading failed", description: err?.message, variant: "destructive" });
    }
    setSynergyBusy(false);
  };

  if (loading) return <div className="min-h-[60vh] field-wash" aria-busy="true"><span className="sr-only">Loading people</span></div>;

  if (loadError) {
    return (
      <div className="field-wash min-h-screen">
        <main className="max-w-lg mx-auto px-6 py-20 text-center" role="alert">
          <h1 className="text-3xl" style={{ color: "var(--gh-ink)" }}>People are unavailable</h1>
          <p className="mt-3 text-sm" style={{ color: "var(--gh-ink-soft)" }}>{loadError}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--gh-ink-muted)" }}>No people or notes have been deleted.</p>
          <button type="button" className="ink-button mt-6" onClick={load}>Try again</button>
        </main>
      </div>
    );
  }

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
          <PeopleOrbit people={people} checkIns={checkIns} selectedId={detail?.id} onSelect={setDetail} />
        )}

        {detail && (() => {
          const stats = personCheckInStats(detail, checkIns);
          return (
            <section className="people-detail" aria-labelledby="person-detail-heading">
              <header>
                <div>
                  <p>{detail.person_type || "person"} in your orbit</p>
                  <h2 id="person-detail-heading">{detail.name}</h2>
                </div>
                <span className="people-detail__actions">
                  <button type="button" aria-label={`Edit ${detail.name}`} onClick={() => openEdit(detail)}><Pencil aria-hidden="true" /></button>
                  <button type="button" aria-label={`Delete ${detail.name}`} onClick={() => setDeleting(detail)}><Trash2 aria-hidden="true" /></button>
                  <button type="button" onClick={() => setDetail(null)}>Close</button>
                </span>
              </header>

              <div className="people-detail__facts">
                <p><strong>{stats.mentions}</strong><span>shared days</span></p>
                <p><strong>{stats.avgMood ?? "·"}</strong><span>average mood</span></p>
                <Link to={`${createPageUrl("Analytics")}?person=${detail.id}`}>Open this pattern</Link>
              </div>

              <div className="people-detail__notes">
                {detail.qualities?.length > 0 && <p><span>What you value</span>{detail.qualities.join(" · ")}</p>}
                {detail.concerns?.length > 0 && <p><span>What you watch</span>{detail.concerns.join(" · ")}</p>}
                {detail.boundary_notes && <p><span>Your boundary</span>{detail.boundary_notes}</p>}
              </div>

              <div className="people-detail__reading">
                <button type="button" className="secondary-action inline-flex items-center gap-2" onClick={() => generateSynergy(detail, !!detail.synergy_reading)} disabled={synergyBusy}>
                  <RefreshCw className={`w-4 h-4 ${synergyBusy ? "animate-spin" : ""}`} aria-hidden="true" />
                  {synergyBusy ? "Reading the connection…" : detail.synergy_reading ? "Refresh connection reading" : "Read this connection"}
                </button>
                {detail.synergy_reading ? (
                  <InsightReading
                    title="A reflection on this connection"
                    text={detail.synergy_reading}
                    evidence={["Your optional Cosmos profile", `${detail.name}'s saved Cosmos snapshot or an unknown profile`]}
                    note="Optional AI reflection. It cannot determine compatibility or the health of a relationship."
                  />
                ) : (
                  <p>A private, optional reflection on how two symbolic profiles meet. The result is saved with this person.</p>
                )}
              </div>
            </section>
          );
        })()}

        {/* add/edit dialog */}
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{editing === "new" ? "Add a person" : `Edit ${form.name}`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div>
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
              </div>
              <div>
                <Label>Relationship</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {TYPES.map((t) => (
                    <button key={t} type="button" aria-pressed={form.person_type === t} onClick={() => setForm({ ...form, person_type: t })}
                      className="min-h-11 px-3 py-2 text-xs"
                      style={form.person_type === t
                        ? { background: "var(--gh-ink)", color: "var(--gh-field)" }
                        : { border: "1px solid hsl(var(--border))", color: "var(--gh-ink-soft)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="p-qualities">Qualities you appreciate (comma separated)</Label>
                <Input id="p-qualities" value={form.qualities} maxLength={500} onChange={(e) => setForm({ ...form, qualities: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="p-concerns">Concerns (comma separated)</Label>
                <Input id="p-concerns" value={form.concerns} maxLength={500} onChange={(e) => setForm({ ...form, concerns: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="p-boundary">Boundary notes</Label>
                <Textarea id="p-boundary" value={form.boundary_notes} maxLength={1500} onChange={(e) => setForm({ ...form, boundary_notes: e.target.value })} rows={2} className="mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="min-h-11 px-4 py-2 text-sm" style={{ border: "1px solid hsl(var(--border))", color: "var(--gh-ink-soft)" }} onClick={() => setEditing(null)}>
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
