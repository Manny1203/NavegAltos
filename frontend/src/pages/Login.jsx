import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [nip, setNip] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Usamos el código como prefijo de un email dummy ya que Supabase Auth requiere email
      const email = `${codigo}@alumnos.udg.mx`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: nip,
      });

      if (error) throw error;
      
      // Simplemente navegamos al home o dashboard por ahora (no creado aun, redirigimos a una ruta dummy)
      navigate('/dashboard'); 
      
    } catch (error) {
      setErrorMsg('Credenciales inválidas o error de red.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        {/* Usamos una imagen genérica mientras el usuario nos pasa su logo, o texto con estilos si prefiere */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#003056', fontSize: '28px', fontWeight: '800', lineHeight:'1.1' }}>
            NavegAltos<br/>
            <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280' }}>
              Centro Universitario de los Altos
            </span>
          </h1>
        </div>

        {errorMsg && <p style={{ color: 'red', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</p>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <User className="input-icon" />
            <input
              type="text"
              className="auth-input"
              placeholder="Código de alumno o Admin"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" />
            <input
              type="password"
              className="auth-input"
              placeholder="NIP"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            <LogIn size={18} />
            {isLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="auth-footer">
          ¿No tienes cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
        </div>
      </div>

      <div className="page-footer">
        © 2026 Universidad de Guadalajara<br/>
        Centro Universitario de los Altos
      </div>
    </>
  );
}
