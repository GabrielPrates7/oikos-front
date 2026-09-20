import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Sparkline } from '../../components/charts/Sparkline'
import { centsToBRL } from '../../utils/currency'
import './EntradasTotalCard.css'

// Ponto genérico (data + valor) — o componente serve Entradas e Transferências, cada tela
// mapeia o próprio tipo pra isso.
export interface TotalCardPoint {
  date: string
  amountCents: number
}

// Medido por pixel contra a referência — verde médio, mais discreto que o branco do texto
// (fica no fundo do card, atrás do valor). Hex fixo (não lightenHex) porque o alvo agora é
// um valor exato dado, não "clarear a cor de destaque que já existe".
const SPARKLINE_COLOR = '#3d6151'
// Mesma ideia (traço discreto, mais escuro que o texto) na família vermelha, derivado do token
// de tema em vez de um hex novo.
const SPARKLINE_COLOR_RED = 'color-mix(in srgb, var(--color-expense-glow-strong) 55%, transparent)'

interface EntradasTotalCardProps {
  sumCents: number
  points: TotalCardPoint[]
  // false esconde sparkline e seta — pra telas onde os pontos não são uma evolução no tempo
  // (Contas: cada ponto é o saldo de uma conta diferente, não um lançamento numa data).
  showTrend?: boolean
  // 'red' = variante do tema vermelho (Faturas): fundo de vidro em tint vermelho e sparkline
  // vermelha, em vez do gradiente verde padrão.
  tone?: 'green' | 'red'
  // false esconde só a linha de fundo (sparkline) e mantém a seta de tendência — usado em
  // Faturas, onde a linha vermelha cruzando o valor atrapalhava a leitura.
  showSparkline?: boolean
}

// Card com gradiente verde (mesmo princípio do "Saldo Real" do Dashboard) em vez do texto
// solto anterior (ListTotal) — só pra Entradas, as outras telas que usam ListTotal
// (Despesas, Transferências, Cartões) continuam com o texto simples, esse redesign é
// específico daqui.
export function EntradasTotalCard({
  sumCents,
  points,
  showTrend = true,
  tone = 'green',
  showSparkline = true,
}: EntradasTotalCardProps) {
  // Ordem cronológica (mais antiga primeiro) — é o que faz sentido pra "tendência": ler da
  // esquerda pra direita como "como isso evoluiu no tempo", não a ordem de exibição da
  // tabela (mais recente primeiro).
  const chronological = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const values = chronological.map((point) => point.amountCents)
  // Antes comparava só o 1º valor com o ÚLTIMO do período inteiro — com muitos pontos,
  // isso podia contradizer visualmente a curva (ex.: caiu bastante lá no início, subiu nos
  // últimos pontos: a linha sobe no final, mas a seta apontava pra baixo porque o último
  // valor ainda ficava abaixo do primeiro). Agora compara os 2 últimos pontos — é a
  // inclinação que o olho lê primeiro ao seguir a curva até a ponta direita, então a seta
  // sempre concorda com pra onde a linha está indo bem ali no final.
  const lastValue = values[values.length - 1] ?? 0
  const secondToLastValue = values[values.length - 2] ?? lastValue
  const isUp = lastValue >= secondToLastValue
  const hasTrend = showTrend && values.length >= 2

  return (
    <div className={`entradas-total-card${tone === 'red' ? ' entradas-total-card--red' : ''}`}>
      <div className="entradas-total-card__main">
        <span className="entradas-total-card__label">Total exibido</span>
        <div className="entradas-total-card__value-row">
          <span className="entradas-total-card__value">{centsToBRL(sumCents)}</span>
          {hasTrend && (
            <span
              className={`entradas-total-card__trend ${isUp ? 'entradas-total-card__trend--up' : 'entradas-total-card__trend--down'}`}
            >
              {isUp ? (
                <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <ArrowDownRight size={14} strokeWidth={1.5} aria-hidden="true" />
              )}
            </span>
          )}
        </div>
      </div>
      {hasTrend && showSparkline && (
        // width/height aqui são só a base lógica pro cálculo da curva — o tamanho/posição
        // visual real vem do CSS (.entradas-total-card .sparkline: position:absolute,
        // inset:0, width/height:100%) + preserveAspectRatio="none" no <svg>, que espalha o
        // traço pela altura INTEIRA do card (fundo, atrás do texto) em vez de uma tira
        // baixa — é isso que faz a curva "subir" na diagonal ocupando o card todo.
        <Sparkline
          values={values}
          width={220}
          height={70}
          color={tone === 'red' ? SPARKLINE_COLOR_RED : SPARKLINE_COLOR}
        />
      )}
    </div>
  )
}
