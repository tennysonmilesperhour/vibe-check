import React from "react";
import {
  Sun, HandHeart, Waves, Flame, Heart, Sprout, Award, Palette,
  Wind, Droplet, CloudLightning, Moon, CircleDashed, Orbit, Mountain, Zap,
  Footprints, Flower2, Feather, Leaf, Users, PenTool, BookOpen, Armchair,
  Wheat, Music2, SunMoon, MessagesSquare,
} from "lucide-react";

const SYMBOLS = {
  sun: Sun, "hand-heart": HandHeart, waves: Waves, flame: Flame, heart: Heart,
  sprout: Sprout, award: Award, palette: Palette, wind: Wind, droplet: Droplet,
  "cloud-lightning": CloudLightning, moon: Moon, "circle-dashed": CircleDashed,
  orbit: Orbit, mountain: Mountain, zap: Zap, footprints: Footprints, flower: Flower2,
  feather: Feather, leaf: Leaf, users: Users, "pen-tool": PenTool, "book-open": BookOpen,
  armchair: Armchair, wheat: Wheat, music: Music2, "sun-moon": SunMoon, messages: MessagesSquare,
};

/** A consistent fine-line symbol; the adjacent vocabulary label carries meaning. */
export default function VocabularyIcon({ name, size = 16 }) {
  const Icon = SYMBOLS[name];
  if (!Icon) return null;
  return <Icon size={size} strokeWidth={1.5} className="shrink-0" aria-hidden="true" focusable="false" />;
}
