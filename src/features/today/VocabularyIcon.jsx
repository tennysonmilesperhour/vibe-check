import React from "react";
import {
  Sun, Waves, Heart, Sprout, Droplet, Wind, Zap, EyeOff, Moon, CircleDashed,
  Footprints, Flower2, Feather, Leaf, Users, PenTool, BookOpen, Armchair,
  Wheat, Music2, SunMoon, MessagesSquare,
} from "lucide-react";

// Feelings take their family's symbol; each activity has its own.
const SYMBOLS = {
  sun: Sun, waves: Waves, heart: Heart, sprout: Sprout, droplet: Droplet, wind: Wind,
  zap: Zap, "eye-off": EyeOff, moon: Moon, "circle-dashed": CircleDashed,
  footprints: Footprints, flower: Flower2, feather: Feather, leaf: Leaf, users: Users,
  "pen-tool": PenTool, "book-open": BookOpen, armchair: Armchair, wheat: Wheat,
  music: Music2, "sun-moon": SunMoon, messages: MessagesSquare,
};

/** A consistent fine-line symbol; the adjacent vocabulary label carries meaning. */
export default function VocabularyIcon({ name, size = 16 }) {
  const Icon = SYMBOLS[name];
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={1.5} className="shrink-0" aria-hidden="true" focusable="false" />;
}
