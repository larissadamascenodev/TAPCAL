/** Id curto e único o bastante para registros locais (a nuvem gera os próprios na fase 5). */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
