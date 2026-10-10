import { BookOpen, Coffee, Dumbbell, Heart, Hospital, MoonStar, PersonStanding, Star, Stethoscope, Sunrise, Utensils, HandHeart } from "lucide-react";
import type { ActivityIconName, AppointmentType } from "@/lib/planner";

export const ACTIVITY_ICONS: { id: ActivityIconName; label: string }[] = [
  { id: "utensils", label: "طعام" }, { id: "coffee", label: "استراحة" },
  { id: "dumbbell", label: "رياضة" }, { id: "prayer", label: "صلاة" },
  { id: "book", label: "قراءة" }, { id: "walk", label: "مشي" },
  { id: "heart", label: "صحة" }, { id: "star", label: "نشاط" },
];
const personalIcons = { utensils: Utensils, coffee: Coffee, dumbbell: Dumbbell, prayer: HandHeart, book: BookOpen, walk: PersonStanding, heart: Heart, star: Star };
const eventIcons = { hospital: Hospital, shift: MoonStar, ownClinic: Stethoscope, percentageClinic: Sunrise, lunch: Utensils, break: Coffee, gym: Dumbbell, prayer: HandHeart, other: Star };

export function EventIcon({ type, activityIcon, className = "h-4 w-4" }: { type: AppointmentType; activityIcon?: ActivityIconName | undefined; className?: string }) {
  const Icon = (type === "other" && activityIcon ? personalIcons[activityIcon] : eventIcons[type]) ?? Star;
  return <Icon className={`shrink-0 ${className}`} aria-hidden="true" />;
}