import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_ID,
  isThemeId,
  themes,
  themesByGroup,
} from "./registry";

describe("theme registry", () => {
  it("includes light and dark essentials", () => {
    const essentials = themesByGroup("essentials").map((t) => t.id);
    expect(essentials).toEqual(["light", "dark"]);
    expect(DEFAULT_THEME_ID).toBe("light");
  });

  it("ships at least twenty ridiculous themes", () => {
    expect(themesByGroup("ridiculous").length).toBeGreaterThanOrEqual(20);
  });

  it("has unique ids and complete swatches", () => {
    const ids = themes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const theme of themes) {
      expect(theme.swatches).toHaveLength(4);
      expect(isThemeId(theme.id)).toBe(true);
    }
  });
});
