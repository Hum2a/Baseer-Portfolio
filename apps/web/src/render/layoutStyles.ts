import type { CSSProperties } from "react";
import type { Breakpoint, NodeLayout, NodeStyles } from "@baseer-portfolio/shared";

export function layoutToCss(
  layout?: NodeLayout,
  bp?: Breakpoint,
): CSSProperties {
  if (!layout) return {};
  const style: CSSProperties = {};
  if (layout.mode === "absolute") {
    style.position = "absolute";
    if (layout.x != null) style.left = layout.x;
    if (layout.y != null) style.top = layout.y;
  } else {
    style.position = "relative";
  }
  if (layout.display) style.display = layout.display;
  if (layout.flexDirection) style.flexDirection = layout.flexDirection;
  if (layout.justifyContent) style.justifyContent = layout.justifyContent;
  if (layout.alignItems) style.alignItems = layout.alignItems;
  if (layout.gap) style.gap = layout.gap;
  if (layout.gridTemplateColumns)
    style.gridTemplateColumns = layout.gridTemplateColumns;
  if (layout.gridTemplateRows) style.gridTemplateRows = layout.gridTemplateRows;
  if (layout.width) style.width = layout.width;
  if (layout.height) style.height = layout.height;
  if (layout.zIndex != null) style.zIndex = layout.zIndex;
  if (layout.padding) style.padding = layout.padding;
  if (layout.margin) style.margin = layout.margin;
  if (layout.maxWidth) style.maxWidth = layout.maxWidth;
  void bp;
  return style;
}

export function stylesToCss(styles?: NodeStyles): CSSProperties {
  if (!styles) return {};
  const style: CSSProperties = {};
  if (styles.color) style.color = styles.color;
  if (styles.background) style.background = styles.background;
  if (styles.fontFamily) style.fontFamily = styles.fontFamily;
  if (styles.fontSize) style.fontSize = styles.fontSize;
  if (styles.fontWeight) style.fontWeight = styles.fontWeight;
  if (styles.lineHeight) style.lineHeight = styles.lineHeight;
  if (styles.letterSpacing) style.letterSpacing = styles.letterSpacing;
  if (styles.textAlign) style.textAlign = styles.textAlign;
  if (styles.border) style.border = styles.border;
  if (styles.borderRadius) style.borderRadius = styles.borderRadius;
  if (styles.boxShadow) style.boxShadow = styles.boxShadow;
  if (styles.opacity != null) style.opacity = styles.opacity;
  if (styles.overflow) style.overflow = styles.overflow;
  if (styles.objectFit) style.objectFit = styles.objectFit;
  return style;
}

export function mergeNodeCss(
  layout?: NodeLayout,
  styles?: NodeStyles,
  layoutBp?: NodeLayout,
  stylesBp?: NodeStyles,
): CSSProperties {
  return {
    ...layoutToCss(layout),
    ...stylesToCss(styles),
    ...layoutToCss(layoutBp),
    ...stylesToCss(stylesBp),
  };
}
