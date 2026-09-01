import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Settings,
  Tags,
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

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/entradas', label: 'Entradas', icon: TrendingUp },
  { path: '/despesas', label: 'Despesas', icon: TrendingDown },
  { path: '/contas', label: 'Contas', icon: Wallet },
  { path: '/cartoes', label: 'Cartões', icon: CreditCard },
  { path: '/faturas', label: 'Faturas', icon: Receipt },
  { path: '/categorias', label: 'Categorias', icon: Tags },
  { path: '/transferencias', label: 'Transferências', icon: ArrowLeftRight },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

// Seção 11 do documento: só os módulos mais usados no mobile. "Entradas/Despesas" é citado
// como um único item no doc — aponto pra /entradas como destino primário (decisão de escopo,
// sem uma tela combinada ainda); dá pra revisar isso quando as telas reais existirem.
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/entradas', label: 'Entradas/Despesas', icon: TrendingUp },
  { path: '/cartoes', label: 'Cartões', icon: CreditCard },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
]

// Tudo que fica de fora do BottomNav (pro menu hambúrguer mobile), derivado por exclusão
// de path — garante que nenhum módulo do Sidebar fique inalcançável no mobile. Isso inclui
// Despesas e Contas além dos 4 citados no pedido (Categorias, Faturas, Relatórios,
// Transferências): a rota /despesas não está literalmente em BOTTOM_NAV_ITEMS (só /entradas
// está, como link do item combinado "Entradas/Despesas"), e Contas também não está em
// nenhum dos dois; sem isso os dois ficariam sem nenhum caminho de navegação no mobile.
const BOTTOM_NAV_PATHS = new Set(BOTTOM_NAV_ITEMS.map((item) => item.path))

export const OVERFLOW_NAV_ITEMS: NavItem[] = SIDEBAR_NAV_ITEMS.filter(
  (item) => !BOTTOM_NAV_PATHS.has(item.path),
)
