// Formatea el importe en un string a euros
export function formatEuros(amount: number): string {
  return amount.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

// Convierte una fecha Date a formato "AAAA-MM"
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Devuelve el nombre abreviado del mes ("Ene", "Feb", etc.)
export function formatShortMonth(date: Date): string {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return meses[date.getMonth()];
}