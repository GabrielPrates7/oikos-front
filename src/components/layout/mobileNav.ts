import { matchPath } from 'react-router-dom'

// Lógica pura da navegação mobile (BottomNav e folha "Mais"): qual posição da barra está ativa
// numa rota.

export type MobileNavKey = 'inicio' | 'entradas' | 'despesas' | 'cartoes' | 'mais'

const NAV_RULES: { key: MobileNavKey; patterns: string[] }[] = [
  { key: 'inicio', patterns: ['/dashboard'] },
  { key: 'entradas', patterns: ['/entradas'] },
  { key: 'despesas', patterns: ['/despesas'] },
  { key: 'cartoes', patterns: ['/cartoes'] },
  {
    key: 'mais',
    patterns: [
      '/transferencias',
      '/contas',
      '/faturas',
      '/plano',
      '/categorias',
      '/orcamentos',
      '/metas',
      '/relatorios',
      '/configuracoes',
    ],
  },
]

// Posição ativa da BottomNav para uma rota (prefixo por segmento: /cartoes/:id → Cartões;
// /contas/:id/extrato → Mais). Rota desconhecida → nenhuma.
export function getActiveNavKey(pathname: string): MobileNavKey | null {
  for (const rule of NAV_RULES) {
    for (const pattern of rule.patterns) {
      if (matchPath({ path: pattern, end: false }, pathname)) return rule.key
    }
  }
  return null
}
