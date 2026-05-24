import {
  BookOpen, Users, Heart, Mic, MapPin, GraduationCap, Globe, Globe2, Sparkles,
  BookMarked, Megaphone, Tent, HeartHandshake, HandHeart, Star, Flame, Cross,
  Music, Compass, Shield, Calendar, type LucideIcon
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  BookOpen, Users, Heart, Mic, MapPin, GraduationCap, Globe, Globe2, Sparkles,
  BookMarked, Megaphone, Tent, HeartHandshake, HandHeart, Star, Flame, Cross,
  Music, Compass, Shield, Calendar,
};

export const getIcon = (name?: string | null, fallback: LucideIcon = Sparkles): LucideIcon =>
  (name && map[name]) || fallback;
