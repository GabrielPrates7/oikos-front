import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CategoryBadge } from '../../components/ui/CategoryBadge'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
import { Pagination } from '../../components/ui/Pagination'
import { CardSwatch } from '../../components/forms/LaunchFields'
import { centsToBRL } from '../../utils/currency'
import { totalPages } from '../../utils/pagination'
import type { PlanKind, PlanLine } from './plano.types'
import { PLAN_COLORS, SITUATION_LABELS, formatDayMonth } from './planoFormat'
import './PlanList.css'

// 10 por página — mesmo componente de paginação de Entradas/Despesas (components/ui/Pagination.tsx),
// mas as linhas do plano já vêm todas de uma vez no summary (sem paginação no servidor); a página aqui
// só corta, no cliente, a lista já ordenada como a API manda.
export const PLAN_PAGE_SIZE = 10

interface PlanListProps {
  kind: PlanKind
  title: string
  // Subtotal planejado (soma das linhas que CONTAM no mês) — vem do summary, de TODAS as linhas
  // (não só da página exibida); nada é somado aqui.
  subtotalCents: number
  lines: PlanLine[]
  categoryColors: Map<string, string>
  page: number
  onPageChange: (page: number) => void
  // Abre "Do sistema" (na aba do tipo) ou o formulário manual (com o tipo já escolhido).
  onAdd: (kind: PlanKind, way: 'system' | 'manual', trigger: HTMLElement | null) => void
  onEdit: (line: PlanLine) => void
  onRemove: (line: PlanLine) => Promise<void>
}

// Remoção em duas etapas dentro do menu "⋮": o 1º clique pede confirmação (e diz que o lançamento
// original NÃO é excluído); o 2º clique remove só a linha do plano. O menu desmonta ao fechar, então
// o pedido de confirmação não "vaza" para a próxima abertura.
function RemoveMenuItem({
  line,
  close,
  onRemove,
}: {
  line: PlanLine
  close: () => void
  onRemove: (line: PlanLine) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const linked = line.source_type !== null
  return (
    <>
      <button
        type="button"
        className="dropdown-menu__item dropdown-menu__item--danger plan-menu__item"
        role="menuitem"
        disabled={busy}
        onClick={() => {
          if (!confirming) {
            setConfirming(true)
            return
          }
          setBusy(true)
          void onRemove(line).finally(() => {
            setBusy(false)
            close()
          })
        }}
      >
        <Trash2 size={14} aria-hidden="true" />
        {confirming ? 'Confirmar: remover do plano' : 'Remover do plano'}
      </button>
      {confirming && (
        <p className="plan-menu__note" role="status">
          {linked
            ? 'Só a linha sai do plano. O lançamento original NÃO é excluído.'
            : 'A linha manual será apagada do plano.'}
        </p>
      )}
    </>
  )
}

function SituationBadge({ line }: { line: PlanLine }) {
  return (
    <span className={`plan-badge plan-badge--${line.situation}`}>
      {SITUATION_LABELS[line.situation]}
    </span>
  )
}

function PlanRow({
  line,
  categoryColors,
  onEdit,
  onRemove,
}: {
  line: PlanLine
  categoryColors: Map<string, string>
  onEdit: (line: PlanLine) => void
  onRemove: (line: PlanLine) => Promise<void>
}) {
  const isInvoice = line.source_type === 'invoice'
  const source = line.source
  const cardName = source?.type === 'invoice' ? source.credit_card.name : null
  const dueDate = source?.type === 'invoice' ? source.due_date : null
  const amountColor = line.kind === 'expense' ? PLAN_COLORS.red : PLAN_COLORS.green

  return (
    <li className={`plan-row${line.counts_in_month ? '' : ' plan-row--muted'}`}>
      <div className="plan-row__main">
        <span className="plan-row__description">
          {isInvoice && cardName ? <CardSwatch name={cardName} /> : line.description}
        </span>
        <span className="plan-row__meta">
          {isInvoice && <span className="plan-badge plan-badge--invoice">Fatura</span>}
          {line.category && (
            <CategoryBadge
              name={line.category.name}
              icon={line.category.icon}
              color={categoryColors.get(line.category.name) ?? 'var(--color-text-muted)'}
            />
          )}
          <span className="plan-row__date">
            {isInvoice && dueDate
              ? `vence ${formatDayMonth(dueDate)}`
              : line.planned_date
                ? formatDayMonth(line.planned_date)
                : 'sem data'}
          </span>
          {line.is_essential === false && (
            <span className="plan-badge plan-badge--soft">Supérfluo</span>
          )}
        </span>
        {!line.counts_in_month && (
          <span className="plan-row__flag" role="note">
            Liquidado antes do mês
            <span className="plan-row__flag-help">
              {' '}
              — já está no saldo de abertura; não entra nas somas.
            </span>
          </span>
        )}
      </div>
      <div className="plan-row__amounts">
        <span className="plan-row__planned" style={{ color: amountColor }}>
          {centsToBRL(line.planned_amount_cents)}
        </span>
        {line.realized_amount !== null && (
          <span className="plan-row__realized">
            {line.kind === 'income' ? 'Recebido' : 'Pago'} {centsToBRL(line.realized_amount)}
            {line.delta !== null && line.delta !== 0 && (
              <span
                className="plan-row__delta"
                style={{
                  color:
                    line.delta > 0 === (line.kind === 'income')
                      ? PLAN_COLORS.green
                      : PLAN_COLORS.red,
                }}
              >
                {' '}
                ({line.delta > 0 ? '+' : '−'}
                {centsToBRL(Math.abs(line.delta))})
              </span>
            )}
          </span>
        )}
      </div>
      <div className="plan-row__side">
        <SituationBadge line={line} />
        <DropdownMenu
          label={`Ações de ${line.description}`}
          floating
          triggerClassName="dropdown-menu__trigger plan-row__menu-trigger"
        >
          {(close) => (
            <>
              <button
                type="button"
                className="dropdown-menu__item plan-menu__item"
                role="menuitem"
                onClick={() => {
                  close()
                  onEdit(line)
                }}
              >
                <Pencil size={14} aria-hidden="true" />
                Editar
              </button>
              <RemoveMenuItem line={line} close={close} onRemove={onRemove} />
            </>
          )}
        </DropdownMenu>
      </div>
    </li>
  )
}

// Lista em vidro de um lado do plano (entradas previstas ou saídas previstas): cabeçalho com o
// subtotal e o botão de adicionar, e as linhas (cartões no mobile).
export function PlanList({
  kind,
  title,
  subtotalCents,
  lines,
  categoryColors,
  page,
  onPageChange,
  onAdd,
  onEdit,
  onRemove,
}: PlanListProps) {
  const headingId = `plan-list-${kind}`
  const pages = totalPages(lines.length, PLAN_PAGE_SIZE)
  const pageLines = lines.slice((page - 1) * PLAN_PAGE_SIZE, page * PLAN_PAGE_SIZE)
  return (
    <section className="plan-list" aria-labelledby={headingId}>
      <header className="plan-list__header">
        <div className="plan-list__heading">
          <h2 id={headingId} className="plan-list__title">
            {title}
          </h2>
          <span
            className="plan-list__subtotal"
            style={{ color: kind === 'expense' ? PLAN_COLORS.red : PLAN_COLORS.green }}
          >
            {centsToBRL(subtotalCents)}
          </span>
        </div>
        <DropdownMenu
          label={kind === 'income' ? 'Adicionar entrada ao plano' : 'Adicionar saída ao plano'}
          floating
          triggerClassName="plan-list__add"
          trigger={
            <>
              <Plus size={16} aria-hidden="true" />
              Adicionar
            </>
          }
        >
          {(close) => {
            const open = (way: 'system' | 'manual', element: HTMLElement) => {
              const trigger = element
                .closest('.dropdown-menu')
                ?.querySelector<HTMLElement>('button[aria-haspopup="menu"]')
              close()
              onAdd(kind, way, trigger ?? null)
            }
            return (
              <>
                <button
                  type="button"
                  className="dropdown-menu__item plan-menu__item"
                  role="menuitem"
                  onClick={(event) => open('system', event.currentTarget)}
                >
                  Do sistema
                </button>
                <button
                  type="button"
                  className="dropdown-menu__item plan-menu__item"
                  role="menuitem"
                  onClick={(event) => open('manual', event.currentTarget)}
                >
                  Manual
                </button>
              </>
            )
          }}
        </DropdownMenu>
      </header>
      {lines.length === 0 ? (
        <p className="plan-list__empty">
          {kind === 'income' ? 'Nenhuma entrada no plano.' : 'Nenhuma saída no plano.'}
        </p>
      ) : (
        <>
          <ul className="plan-list__rows">
            {pageLines.map((line) => (
              <PlanRow
                key={line.id}
                line={line}
                categoryColors={categoryColors}
                onEdit={onEdit}
                onRemove={onRemove}
              />
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={pages}
            onPageChange={onPageChange}
            totalItems={lines.length}
            pageSize={PLAN_PAGE_SIZE}
            itemLabel={kind === 'income' ? 'entradas' : 'saídas'}
            alwaysShow
          />
        </>
      )}
    </section>
  )
}
