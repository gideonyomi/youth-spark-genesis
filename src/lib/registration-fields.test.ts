import { describe, expect, it } from "vitest";
import { emptyRegistrationForm, validateRegistration } from "./registration-fields";

describe("NSS genotype requirement", () => {
  it("requires a genotype for NSS registrations", () => {
    const form = {
      ...emptyRegistrationForm,
      full_name: "Test Attendee",
      email: "attendee@example.com",
      country: "Nigeria",
      state: "Lagos",
      city: "Ikeja",
      gender: "Male",
      marital_status: "Single",
      occupation: "Student",
      age_range: "21–25",
      zone_fellowship: "Central Fellowship",
    };

    expect(validateRegistration("NSS", form)).toBe("Genotype is required for NSS registrations");
    expect(validateRegistration("NSS", { ...form, genotype: "AS" })).toBeNull();
  });

  it("does not require genotype for YEC or SSC", () => {
    expect(validateRegistration("YEC", { ...emptyRegistrationForm, genotype: "" })).not.toBe("Genotype is required for NSS registrations");
    expect(validateRegistration("SSC", { ...emptyRegistrationForm, genotype: "" })).not.toBe("Genotype is required for NSS registrations");
  });
});