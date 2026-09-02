import { Link } from 'react-router-dom'
import { RegisterForm } from './RegisterForm'
import './AuthPage.css'

export function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1 className="auth-page__title">Oikos</h1>
        <p className="auth-page__subtitle">Crie sua conta</p>
        <RegisterForm />
        <p className="auth-page__switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
