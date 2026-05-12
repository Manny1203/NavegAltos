import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const validEmailRegex = /^[a-zA-Z0-9._-]+@(alumnos\.|academicos\.|administracion\.)?udg\.mx$/;
      if (!validEmailRegex.test(email)) {
        setMsg({ text: 'Por favor ingresa un correo institucional válido.', type: 'error' });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMsg({ text: 'Hemos enviado un enlace de recuperación a tu correo.', type: 'success' });
    } catch (error) {
      console.error(error);
      setMsg({ text: 'Error al solicitar el cambio de NIP. Intenta de nuevo más tarde.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        <div style={{ width: '100%', marginBottom: '20px' }}>
          <Link to="/login" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>

        <h2 className="auth-title">RECUPERAR NIP</h2>
        <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4' }}>
          Ingresa tu correo institucional y te enviaremos un enlace seguro para crear un nuevo NIP.
        </p>

        {msg.text && (
          <p style={{ color: msg.type === 'error' ? 'red' : 'green', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {msg.text}
          </p>
        )}

        <form className="auth-form" onSubmit={handleReset}>
          <div className="input-group">
            <Mail className="input-icon" />
            <input
              type="email"
              className="auth-input"
              placeholder="Correo institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      </div>

      <div className="page-footer">
        © 2026 Universidad de Guadalajara<br/>
        Centro Universitario de los Altos
      </div>
    </>
  );
}
