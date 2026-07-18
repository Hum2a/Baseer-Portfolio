export const THEME_STORAGE_KEY = "baseer-theme";
export const DEFAULT_THEME_ID = "light";

export type ThemeGroup = "essentials" | "ridiculous";

export type ThemeMeta = {
  id: string;
  label: string;
  group: ThemeGroup;
  /** Swatch colors for the switcher UI (canvas, ink, primary, accent) */
  swatches: [string, string, string, string];
  blurb: string;
};

/**
 * Theme catalog. Token roles stay fixed in components:
 * fog = canvas, graphite = ink, steel = primary, amber = accent, mist = rules.
 */
export const themes: ThemeMeta[] = [
  {
    id: "light",
    label: "Light",
    group: "essentials",
    swatches: ["#F1F0EC", "#1C1D1F", "#35526E", "#C97D3D"],
    blurb: "Fog, graphite, steel — the house look.",
  },
  {
    id: "dark",
    label: "Dark",
    group: "essentials",
    swatches: ["#121316", "#E8E6E1", "#8FA8C4", "#E0A06A"],
    blurb: "Low-light editorial without the neon hangover.",
  },
  {
    id: "midnight-ink",
    label: "Midnight Ink",
    group: "ridiculous",
    swatches: ["#0B1220", "#E7EEF8", "#6EA8FF", "#F0C674"],
    blurb: "Navy folio with fountain-pen gold.",
  },
  {
    id: "terminal",
    label: "Terminal",
    group: "ridiculous",
    swatches: ["#0A0F0A", "#C8FACC", "#3DFF6A", "#A8FF60"],
    blurb: "CRT green. Please do not type `rm -rf`.",
  },
  {
    id: "hot-magenta",
    label: "Hot Magenta",
    group: "ridiculous",
    swatches: ["#1A0614", "#FFE6F7", "#FF2BD6", "#FFD166"],
    blurb: "Billboard energy. Sunglasses recommended.",
  },
  {
    id: "desert-dusk",
    label: "Desert Dusk",
    group: "ridiculous",
    swatches: ["#2A1A12", "#F6E7D4", "#D97941", "#F2C14E"],
    blurb: "Adobe walls and late sun.",
  },
  {
    id: "arctic-mint",
    label: "Arctic Mint",
    group: "ridiculous",
    swatches: ["#E7F7F4", "#10312C", "#1F8A7F", "#0E6B5F"],
    blurb: "Cool eucalyptus and glacier light.",
  },
  {
    id: "lava-lamp",
    label: "Lava Lamp",
    group: "ridiculous",
    swatches: ["#1B1024", "#F6E9FF", "#FF5C8A", "#FFB347"],
    blurb: "1970s living room, but make it KPI.",
  },
  {
    id: "broadsheet",
    label: "Broadsheet",
    group: "ridiculous",
    swatches: ["#F7F1E3", "#1A1A1A", "#222222", "#8B1E1E"],
    blurb: "Ink-stained paper and a red masthead rule.",
  },
  {
    id: "synthwave",
    label: "Synthwave",
    group: "ridiculous",
    swatches: ["#12081F", "#F2E9FF", "#FF4ECD", "#46E0FF"],
    blurb: "Sunset grid optional, attitude mandatory.",
  },
  {
    id: "matcha",
    label: "Matcha",
    group: "ridiculous",
    swatches: ["#F3F6EA", "#1E2A18", "#5B7A3A", "#C4A35A"],
    blurb: "Ceramic cup, quiet productivity.",
  },
  {
    id: "ocean-abyss",
    label: "Ocean Abyss",
    group: "ridiculous",
    swatches: ["#061820", "#D7F3F8", "#2BB7C7", "#F0A202"],
    blurb: "Deep water, bioluminescent accents.",
  },
  {
    id: "candy-floss",
    label: "Candy Floss",
    group: "ridiculous",
    swatches: ["#FFF0F7", "#4A2040", "#E85D9C", "#7EC8E3"],
    blurb: "Fairground pastel. Serious metrics, unserious vibes.",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    group: "ridiculous",
    swatches: ["#0C2A4A", "#E8F2FF", "#7EB6FF", "#F4D35E"],
    blurb: "Drafting table cyan and construction yellow.",
  },
  {
    id: "sepia-film",
    label: "Sepia Film",
    group: "ridiculous",
    swatches: ["#E8DCC8", "#2C2118", "#6B4F3A", "#A67C52"],
    blurb: "Contact sheet warmth, slight grain of nostalgia.",
  },
  {
    id: "neon-noir",
    label: "Neon Noir",
    group: "ridiculous",
    swatches: ["#0D0D0F", "#F0F0F2", "#39FF14", "#FF003C"],
    blurb: "Alleyway rain. Lime type. Red alert metrics.",
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    group: "ridiculous",
    swatches: ["#FFF4E5", "#3A2412", "#C26A2B", "#E8A838"],
    blurb: "Honey light across the campaign deck.",
  },
  {
    id: "ultraviolet",
    label: "Ultraviolet",
    group: "ridiculous",
    swatches: ["#12081C", "#F0E6FF", "#B14CFF", "#FF7AD9"],
    blurb: "The purple theme we swore we would not ship. We shipped it.",
  },
  {
    id: "matrix",
    label: "Matrix",
    group: "ridiculous",
    swatches: ["#020805", "#A7FFB0", "#00FF41", "#70FF9A"],
    blurb: "There is no spoon. There is a CTR.",
  },
  {
    id: "bubblegum",
    label: "Bubblegum",
    group: "ridiculous",
    swatches: ["#FFE5F0", "#2D1B2E", "#FF4FA3", "#5CE1E6"],
    blurb: "Chewing-gum pink with freezer-pop cyan.",
  },
  {
    id: "espresso",
    label: "Espresso",
    group: "ridiculous",
    swatches: ["#1A120E", "#F3E8DC", "#C4A484", "#E8B86D"],
    blurb: "Dark roast canvas, crema highlights.",
  },
  {
    id: "vapor-trail",
    label: "Vapor Trail",
    group: "ridiculous",
    swatches: ["#F5FBFF", "#1B2A41", "#5B8DEF", "#FF6B9D"],
    blurb: "Contrail sky with a jet-stream accent.",
  },
  {
    id: "chrome-punk",
    label: "Chrome Punk",
    group: "ridiculous",
    swatches: ["#141416", "#ECEFF1", "#9EA7B3", "#FF5E3A"],
    blurb: "Brushed metal and hazard orange.",
  },
  {
    id: "meadow",
    label: "Meadow",
    group: "ridiculous",
    swatches: ["#F4F8EC", "#1F2A14", "#4F7A2E", "#E09F3E"],
    blurb: "Wildflower field notes.",
  },
  {
    id: "ice-rink",
    label: "Ice Rink",
    group: "ridiculous",
    swatches: ["#F2F7FB", "#15202B", "#3D7EA6", "#C0392B"],
    blurb: "Cold boards, warm penalty-box red.",
  },
  {
    id: "disco-ball",
    label: "Disco Ball",
    group: "ridiculous",
    swatches: ["#1A1030", "#F7F0FF", "#FFD700", "#FF1493"],
    blurb: "Mirror tiles and an afterparty accent.",
  },
];

export const themeIds = themes.map((t) => t.id);

export function isThemeId(value: string | null | undefined): value is string {
  return !!value && themeIds.includes(value);
}

export function getTheme(id: string): ThemeMeta {
  return themes.find((t) => t.id === id) ?? themes[0]!;
}

export function themesByGroup(group: ThemeGroup): ThemeMeta[] {
  return themes.filter((t) => t.group === group);
}
