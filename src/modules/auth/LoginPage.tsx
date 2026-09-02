import { Link } from 'react-router-dom'
import { LoginForm } from './LoginForm'
import './AuthPage.css'

export function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Oikos</h1>
        <p className="auth-page__subtitle">Entre na sua conta</p>
        <LoginForm />
        <p className="auth-page__switch">
          Não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}
