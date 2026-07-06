export const PORTION_UNITS = [
  { value: 'ml', label: 'ml (millilitre)' },
  { value: 'gm', label: 'gm (gram)' },
  { value: 'l', label: 'L (litre)' },
  { value: 'kg', label: 'kg (kilogram)' },
  { value: 'pcs', label: 'pcs (pieces)' },
  { value: 'plate', label: 'plate' },
]

/** Extra units shown only on admin menu add/edit form */
export const MENU_FORM_PORTION_UNITS = [
  ...PORTION_UNITS,
  { value: 'cm', label: 'cm (pizza)' },
]

const UNIT_LABEL = {
  ml: 'ml',
  gm: 'gm',
  l: 'L',
  kg: 'kg',
  pcs: 'pcs',
  plate: 'plate',
  cm: 'cm',
}

export function formatPortionSize(item) {
  const size = Number(item?.portionSize)
  const unit = item?.portionUnit
  if (!size || size <= 0 || !unit || !UNIT_LABEL[unit]) return null
  return `${size} ${UNIT_LABEL[unit]}`
}
