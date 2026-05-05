import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Acepta: @alumnos.udg.mx, @academicos.udg.mx, @administracion.udg.mx, @udg.mx
      const validEmailRegex = /^[a-zA-Z0-9._-]+@(alumnos\.|academicos\.|administracion\.)?udg\.mx$/;

      if (!validEmailRegex.test(email)) {
        setErrorMsg('Usa tu correo institucional UDG (ej. nombre.apellido1234@alumnos.udg.mx)');
        setIsLoading(false);
        return;
      }

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
              type="email"
              className="auth-input"
              placeholder="Correo institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        {deferredPrompt && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              type="button" 
              onClick={handleInstallClick}
              style={{
                background: '#003056',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0, 48, 86, 0.2)',
                width: '100%',
                justifyContent: 'center',
                fontSize: '15px'
              }}
            >
              <Download size={18} />
              Instalar App NavegAltos
            </button>
          </div>
        )}
      </div>

      <div className="page-footer">
        © 2026 Universidad de Guadalajara<br/>
        Centro Universitario de los Altos
      </div>
    </>
  );
}
