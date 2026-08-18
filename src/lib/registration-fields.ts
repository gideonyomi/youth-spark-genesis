// Shared field options + validation used by BOTH the public registration form
// and the admin (manual) registration form, so the two never drift apart.

export const EVENT_META: Record<string, { tag: string; title: string; blurb: string }> = {
  yec: { tag: "YEC", title: "Youth Empowerment Conference", blurb: "Holiness. Empowerment. Purpose." },
  ssc: { tag: "SSC", title: "Student Success Camp", blurb: "Faith and excellence for the next generation." },
  nss: { tag: "NSS", title: "National Singles' Summit", blurb: "Purposeful living for singles, in holiness." },
};

export const AGE_RANGES_COMMON = ["16–20", "21–25", "25–30", "30+"];
export const AGE_RANGES_SSC = ["12–16", "16–20", "21–25"];
export const GENDERS = ["Male", "Female"];
export const MARITAL = ["Single", "Engaged", "Married"];

export const SSC_CLASSES = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3", "Seeking Admission", "100 Level", "200 Level"];
export const SSC_OCCUPATIONS = ["Student", "Employed", "Self-Employed"];
export const YEC_OCCUPATIONS = ["Undergraduate (300 Level and Above)", "Employed", "Self-Employed", "Unemployed"];
export const NSS_OCCUPATIONS = ["Employed", "Student", "Self-Employed"];

export type EventTag = "YEC" | "SSC" | "NSS";

export const rulesFor = (tag: string) => {
  const isSSC = tag === "SSC";
  const isYEC = tag === "YEC";
  return {
    isSSC,
    isYEC,
    isNSS: tag === "NSS",
    ageRanges: isSSC ? AGE_RANGES_SSC : AGE_RANGES_COMMON,
    occupationOptions: isYEC ? YEC_OCCUPATIONS : isSSC ? SSC_OCCUPATIONS : NSS_OCCUPATIONS,
    askFirstTime: isSSC || isYEC,
    askMarital: !isSSC,
    askClass: isSSC,
    // Email is compulsory for every event category, including SSC.
    emailRequired: true,
  };
};

export type RegistrationForm = {
  full_name: string; email: string; phone: string;
  country: string; state: string; city: string;
  age_range: string; gender: string;
  marital_status: string; occupation: string;
  class_level: string; first_time_attendee: string;
  zone_fellowship: string; notes: string;
};

export const emptyRegistrationForm: RegistrationForm = {
  full_name: "", email: "", phone: "",
  country: "Nigeria", state: "", city: "",
  age_range: "", gender: "",
  marital_status: "", occupation: "",
  class_level: "", first_time_attendee: "",
  zone_fellowship: "", notes: "",
};

/** Returns the first validation error message, or null when the form is valid. */
export const validateRegistration = (tag: string, form: RegistrationForm): string | null => {
  const r = rulesFor(tag);
  if (!form.full_name.trim()) return "Full name is required";
  if (!form.country) return "Please select a country";
  if (!form.state.trim()) return "Please enter the state/province/region";
  if (!form.city.trim()) return "Please enter the city";
  if (!form.gender) return "Please select gender";
  if (r.askMarital && !form.marital_status) return "Please select marital status";
  if (!form.occupation) return "Please select occupation";
  if (!form.age_range) return "Please select an age range";
  if (r.askClass && !form.class_level) return "Please select a class";
  if (r.askFirstTime && !form.first_time_attendee) return "Please answer the first-time attendee question";
  if (!form.zone_fellowship.trim()) return "Please enter the zone / fellowship";
  if (r.emailRequired && !form.email.trim()) return "Email is required";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email address";
  return null;
};
