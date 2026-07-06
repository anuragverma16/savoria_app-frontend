/** Uniform ingredient chip style — same look for every item */
export const INGREDIENT_CHIP_CLASS = 'text-[10px] px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-white/70 font-medium'

export const INGREDIENT_CHIP_CLASS_SM = 'text-[9px] px-1.5 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/60 font-medium truncate max-w-[5rem]'

/** Customer order panel (Savoria theme) */
export const SV_INGREDIENT_CHIP_CLASS = 'text-[10px] px-2.5 py-1 rounded-full border border-[var(--sv-border)] bg-[var(--sv-accent-glow)] text-[var(--sv-text-muted)] font-medium'

export const SV_INGREDIENT_CHIP_CLASS_SM = 'text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--sv-border)] bg-[var(--sv-accent-glow)] text-[var(--sv-text-muted)] font-medium truncate max-w-[5rem]'

export function resolveMenuItemVisuals(ingredients = []) {
  const list = (ingredients || []).map((i) => String(i).trim()).filter(Boolean)
  return {
    ingredients: list,
    hasIngredients: list.length > 0,
  }
}
