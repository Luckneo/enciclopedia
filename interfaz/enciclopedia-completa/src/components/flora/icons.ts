import {
  Home, Boxes, GitBranch, Globe2, Sparkles, Lock, FlaskRound, Gem,
  Telescope, Compass, Leaf, History, Landmark, Map, Bird, Swords,
  PawPrint, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Home, Boxes, GitBranch, Globe2, Sparkles, Lock, FlaskRound, Gem,
  Telescope, Compass, Leaf, History, Landmark, Map, Bird, Swords, PawPrint,
};

export const getIcon = (name: string): LucideIcon => ICONS[name] ?? Leaf;
