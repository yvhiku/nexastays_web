export const LAYERS = {
  base: 0,
  content: 10,
  header: 40,
  sticky: 50,
  dropdown: 1000,
  popover: 1100,
  datePicker: 1200,
  commandPalette: 1300,
  drawer: 1400,
  modal: 1500,
  toast: 1600,
  tooltip: 1700,
} as const;

export type LayerName = keyof typeof LAYERS;

export const LAYER_CLASS: Record<LayerName, string> = {
  base: "z-layer-base",
  content: "z-layer-content",
  header: "z-layer-header",
  sticky: "z-layer-sticky",
  dropdown: "z-layer-dropdown",
  popover: "z-layer-popover",
  datePicker: "z-layer-date-picker",
  commandPalette: "z-layer-command-palette",
  drawer: "z-layer-drawer",
  modal: "z-layer-modal",
  toast: "z-layer-toast",
  tooltip: "z-layer-tooltip",
};

export function layerStyle(layer: LayerName): React.CSSProperties {
  return { zIndex: LAYERS[layer] };
}
