import { describe, expect, it } from "vitest";

import { DEFAULT_SITE_SETTINGS } from "../../shared/types/settings";

describe("site settings defaults", () => {
  it("keeps graph and registration enabled by default", () => {
    expect(DEFAULT_SITE_SETTINGS).toEqual({
      graphEnabledByDefault: true,
      registrationEnabled: true,
    });
  });
});
