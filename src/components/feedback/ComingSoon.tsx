import './ComingSoon.css'

interface ComingSoonProps {
  title: string
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="coming-soon">
      <h1>{title}</h1>
      <p>Em construção — chega numa próxima fase.</p>
    </div>
  )
}
