import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Users } from "lucide-react";

/**
 * Multi-select person picker. Replaces free-text who_involved.
 * value: array of person ids. onChange(nextIds).
 * Inline-creates a Person when the typed name is new.
 */
export default function PersonPicker({ value = [], onChange, placeholder = "Who was involved?" }) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    base44.entities.Person.list().then(setPeople).catch(() => setPeople([]));
  }, []);

  const selected = people.filter((p) => value.includes(p.id));
  const queryTrimmed = query.trim();
  const exactExists = people.some((p) => p.name.toLowerCase() === queryTrimmed.toLowerCase());

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const createInline = async () => {
    if (!queryTrimmed) return;
    setCreateError(null);
    try {
      const created = await base44.entities.Person.create({ name: queryTrimmed.slice(0, 100), person_type: "other" });
      setPeople((prev) => [...prev, created]);
      onChange([...value, created.id]);
      setQuery("");
    } catch (error) {
      setCreateError(error?.message || "Could not add this person. Check your connection and try again.");
    }
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="min-h-11 w-full flex items-center gap-2 border border-input bg-background px-3 py-2 text-sm text-left"
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
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium"
                    style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", color: "var(--gh-ink)" }}
                  >
                    {p.name}
                  </span>
                ))}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72" align="start">
          <Command>
            <CommandInput placeholder="Search or add a person" value={query} onValueChange={setQuery} />
            <CommandList>
              {createError && <p role="alert" className="px-3 py-2 text-xs" style={{ color: "hsl(var(--destructive))" }}>{createError}</p>}
              <CommandEmpty>
                {queryTrimmed ? "No one by that name yet." : "No people yet. Type a name to add one."}
              </CommandEmpty>
              <CommandGroup>
                {people.map((p) => (
                  <CommandItem key={p.id} value={p.name} onSelect={() => toggle(p.id)}>
                    <span className={value.includes(p.id) ? "font-bold" : ""}>{p.name}</span>
                  </CommandItem>
                ))}
                {queryTrimmed && !exactExists && (
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
