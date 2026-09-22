import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Settings,
  Tags,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const DASHBOARD_ITEM: NavItem = { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
const ENTRADAS_ITEM: NavItem = { path: '/entradas', label: 'Entradas', icon: TrendingUp }
const DESPESAS_ITEM: NavItem = { path: '/despesas', label: 'Despesas', icon: TrendingDown }
const TRANSFERENCIAS_ITEM: NavItem = {
  path: '/transferencias',
  label: 'Transferências',
  icon: ArrowLeftRight,
}
const CONTAS_ITEM: NavItem = { path: '/contas', label: 'Contas', icon: Wallet }
const CARTOES_ITEM: NavItem = { path: '/cartoes', label: 'Cartões', icon: CreditCard }
const FATURAS_ITEM: NavItem = { path: '/faturas', label: 'Faturas', icon: Receipt }
const PLANO_ITEM: NavItem = { path: '/plano', label: 'Plano do mês', icon: ClipboardList }
const CATEGORIAS_ITEM: NavItem = { path: '/categorias', label: 'Categorias', icon: Tags }
const ORCAMENTOS_ITEM: NavItem = { path: '/orcamentos', label: 'Orçamentos', icon: PiggyBank }
const METAS_ITEM: NavItem = { path: '/metas', label: 'Metas', icon: Target }
const RELATORIOS_ITEM: NavItem = { path: '/relatorios', label: 'Relatórios', icon: BarChart3 }

// Fora dos grupos de propósito — fica fixo no rodapé do Sidebar (ver Sidebar.tsx), junto
// com nome do usuário e logout.
export const SETTINGS_NAV_ITEM: NavItem = {
  path: '/configuracoes',
  label: 'Configurações',
  icon: Settings,
}

export const SIDEBAR_NAV_GROUPS: NavGroup[] = [
  { label: 'Visão geral', items: [DASHBOARD_ITEM] },
  { label: 'Movimentações', items: [ENTRADAS_ITEM, DESPESAS_ITEM, TRANSFERENCIAS_ITEM] },
  { label: 'Financeiro', items: [CONTAS_ITEM, CARTOES_ITEM, FATURAS_ITEM] },
  { label: 'Planejamento', items: [PLANO_ITEM, CATEGORIAS_ITEM, ORCAMENTOS_ITEM, METAS_ITEM] },
  { label: 'Análises', items: [RELATORIOS_ITEM] },
]

export const SIDEBAR_NAV_ITEMS: NavItem[] = SIDEBAR_NAV_GROUPS.flatMap((group) => group.items)

// Folha "Mais" do mobile: o que não tem posição própria na BottomNav (Início, Entradas, Despesas
// e Cartões têm). Grupos do Sidebar, com Configurações em "Sistema" no fim. Conferido contra
// getActiveNavKey (mobileNav.ts): todas estas rotas → "Mais".
export const MORE_SHEET_GROUPS: NavGroup[] = [
  { label: 'Movimentações', items: [TRANSFERENCIAS_ITEM] },
  { label: 'Financeiro', items: [CONTAS_ITEM, FATURAS_ITEM] },
  { label: 'Planejamento', items: [PLANO_ITEM, CATEGORIAS_ITEM, ORCAMENTOS_ITEM, METAS_ITEM] },
  { label: 'Análises', items: [RELATORIOS_ITEM] },
  { label: 'Sistema', items: [SETTINGS_NAV_ITEM] },
]
