import './PreferenciasTab.css'

const PALETTE = [
  { token: '--color-bg-base', label: 'Fundo' },
  { token: '--color-bg-surface', label: 'Superfície' },
  { token: '--color-bg-elevated', label: 'Elevado' },
  { token: '--color-accent', label: 'Destaque' },
  { token: '--color-accent-income', label: 'Entrada' },
  { token: '--color-accent-expense', label: 'Despesa' },
  { token: '--color-warning', label: 'Atenção' },
  { token: '--color-text-primary', label: 'Texto' },
  { token: '--color-text-muted', label: 'Texto secundário' },
]

export function PreferenciasTab() {
  return (
    <div className="preferencias-tab">
      <h2 className="preferencias-tab__section-title">Paleta atual</h2>
      <div className="preferencias-tab__swatches">
        {PALETTE.map(({ token, label }) => (
          <div key={token} className="preferencias-tab__swatch">
            <span
              className="preferencias-tab__swatch-color"
              style={{ background: `var(${token})` }}
              aria-hidden="true"
            />
            <span className="preferencias-tab__swatch-label">{label}</span>
          </div>
        ))}
      </div>
      <p className="preferencias-tab__note">Mais temas em breve.</p>
    </div>
  )
}
