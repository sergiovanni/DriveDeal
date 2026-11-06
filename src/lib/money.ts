/**
 * Les montants sont toujours stockés en centimes (entiers) avec un code devise.
 * Devise par défaut : EUR (hypothèse de travail, voir docs/08 T-08).
 */
export function formaterPrix(centimes: number, devise = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    maximumFractionDigits: 0,
  })
    .format(centimes / 100)
    .replace(/ /g, " ");
}

/** Formate un kilométrage : 42000 -> « 42 000 km » (espace insécable). */
export function formaterKilometrage(km: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(km).replace(/ /g, " ")} km`;
}
