/**
 * Normaliza un string eliminando acentos y convirtiendo a minúsculas
 * para comparaciones sin distinguir mayúsculas, minúsculas o acentos
 */
export function normalizarString(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (acentos)
    .trim();
}

/**
 * Compara dos strings sin distinguir mayúsculas, minúsculas o acentos
 */
export function compararStrings(str1: string, str2: string): boolean {
  return normalizarString(str1) === normalizarString(str2);
}

