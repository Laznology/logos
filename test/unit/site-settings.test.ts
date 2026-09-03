import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_SITE_SETTINGS,
  siteSettingsSchema,
} from "../../shared/types/settings";

describe("site settings", () => {
  it("keeps graph and registration enabled by default", () => {
    expect(DEFAULT_SITE_SETTINGS).toEqual({
      graphEnabledByDefault: true,
      registrationEnabled: true,
    });
  });

  it("accepts only boolean workspace settings", () => {
    expect(
      v.safeParse(siteSettingsSchema, {
        graphEnabledByDefault: false,
        registrationEnabled: true,
      }).success
    ).toBe(true);
    expect(
      v.safeParse(siteSettingsSchema, {
        graphEnabledByDefault: "false",
        registrationEnabled: true,
      }).success
    ).toBe(false);
  });
});
