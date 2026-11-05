// Shared classes of the report flow (UI.md "Fixit design", ticket 32: variant B of the location
// step prototypes). Merge them with `cn`, never through `buttonVariants({ className })`.

// UI.md "Surfaces, cards and spacing": a white card on the ground, rounded-2xl, the border colour
// as its ring and a soft shadow
export const FLOW_CARD = "rounded-2xl ring-border shadow-[0_1px_2px_rgb(23_33_47/0.08)]"

// the bar at the bottom of every step: the main action (if any) and „Odustani", always visible
export const FLOW_BAR =
  "flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"

// UI.md "Main action button": the one `highlight` button of a step, 48 px, full width
export const FLOW_MAIN = "h-12 w-full text-base shadow-[0_4px_12px_rgb(23_33_47/0.18)]"
