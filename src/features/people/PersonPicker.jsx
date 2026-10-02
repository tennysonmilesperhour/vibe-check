import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X, Plus, Users } from "lucide-react";
import { matchPersonByText, samePersonId, searchPeople } from "@/lib/people";
import { useAuth } from "@/lib/AuthContext";
import { putRecordRow, useRecordPart } from "@/features/patterns/useLivingData";

/**
 * Multi-select person picker. Replaces free-text who_involved.
 * value: array of person ids. onChange(nextIds).
 * Inline-creates a Person when the typed name is new; aliases match the existing person.
 */
export default function PersonPicker({ value = [], onChange, placeholder = "Who was involved?" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // The people every page shares: someone added in one picker shows in all.
  // Someone added here shows here even while that list can't load.
  const shared = useRecordPart("people").data;
  const [added, setAdded] = useState([]);
  const people = [...(shared || []), ...added.filter((person) => !shared?.some((row) => samePersonId(row.id, person.id)))];
  const client = useQueryClient();
  const { user } = useAuth();

  const selected = people.filter((p) => value.some((id) => samePersonId(id, p.id)));
  const queryTrimmed = query.trim();
  const matched = matchPersonByText(queryTrimmed, people);
  const visible = searchPeople(query, people);
  const isSelected = (id) => value.some((current) => samePersonId(current, id));

  const toggle = (id) => {
    onChange(isSelected(id) ? value.filter((v) => !samePersonId(v, id)) : [...value, id]);
  };

  const selectExisting = (person) => {
    if (!isSelected(person.id)) onChange([...value, person.id]);
    setQuery("");
  };

  const createInline = async () => {
    if (!queryTrimmed) return;
    if (matched) {
      selectExisting(matched);
      return;
    }
    try {
      const created = await base44.entities.Person.create({ name: queryTrimmed, person_type: "other" });
      setAdded((list) => [...list, created]);
      await putRecordRow(client, user?.id, "people", created);
      onChange([...value, created.id]);
      setQuery("");
    } catch {
      // keep the popover open; the user can retry
    }
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 border border-input bg-background px-3 py-2 text-sm text-left"
            aria-label="Choose people involved"
          >
            <Users className="w-4 h-4" style={{ color: "var(--gh-ink-muted)" }} />
            {selected.length === 0 ? (
              <span style={{ color: "var(--gh-ink-muted)" }}>{placeholder}</span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {selected.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
                    style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 6px)", color: "var(--gh-ink)" }}
                  >
                    {p.name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      role="button"
                      aria-label={`Remove ${p.name}`}
                      onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
                    />
                  </span>
                ))}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search or add a person" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>
                {queryTrimmed ? "No one by that name yet." : "No people yet. Type a name to add one."}
              </CommandEmpty>
              <CommandGroup>
                {visible.map((p) => (
                  <CommandItem key={p.id} value={`${p.id} ${p.name}`} onSelect={() => toggle(p.id)}>
                    <span className={isSelected(p.id) ? "font-bold" : ""}>{p.name}</span>
                    {p.legacy_names?.length > 0 && <span className="ml-2 text-xs opacity-70">{p.legacy_names.join(", ")}</span>}
                  </CommandItem>
                ))}
                {queryTrimmed && !matched && (
                  <CommandItem value={`add-${queryTrimmed}`} onSelect={createInline}>
                    <Plus className="w-4 h-4 mr-1" /> Add "{queryTrimmed}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
