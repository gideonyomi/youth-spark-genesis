import { describe, expect, it } from "vitest";
import { emptyRegistrationForm, validateRegistration } from "./registration-fields";

describe("NSS genotype requirement", () => {
  const validForm = {
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
      first_time_attendee: "Yes",
      zone_fellowship: "Central Fellowship",
  };

  it("requires a genotype for NSS registrations", () => {
    expect(validateRegistration("NSS", validForm)).toBe("Genotype is required for NSS registrations");
    expect(validateRegistration("NSS", { ...validForm, genotype: "AS" })).toBeNull();
  });

  it("does not require genotype for YEC or SSC", () => {
    expect(validateRegistration("YEC", validForm)).toBeNull();
    expect(validateRegistration("SSC", { ...validForm, class_level: "SS 1" })).toBeNull();
  });
});