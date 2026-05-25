import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, LogIn, Download, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showNip, setShowNip] = useState(false);
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

    const lockoutUntil = localStorage.getItem('lockout_until');
    if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
      const remainingMinutes = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
      setErrorMsg(`Cuenta bloqueada temporalmente por seguridad. Intenta en ${remainingMinutes} minuto(s).`);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const validEmailRegex = /^[a-zA-Z0-9._-]+@(alumnos\.|academicos\.|administracion\.)?udg\.mx$/;
      if (!validEmailRegex.test(email)) {
        setErrorMsg('Usa tu correo institucional UDG (ej. nombre.apellido@alumnos.udg.mx)');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: nip,
      });

      if (error) throw error;
      
      // Reset attempts on successful login
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('lockout_until');
      localStorage.removeItem('guest_mode');
      
      const searchParams = location.state?.search || '';
      navigate(`/dashboard${searchParams}`); 
      
    } catch (error) {
      console.error(error);
      
      let attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
      localStorage.setItem('login_attempts', attempts);
      
      let baseError = "Credenciales incorrectas o error de red.";
      if (error.message.includes("Invalid login credentials")) {
        baseError = "El correo institucional o el NIP no coinciden.";
      } else if (error.message.includes("Email not confirmed")) {
        baseError = "Debes confirmar tu correo antes de iniciar sesión.";
      } else {
        baseError = error.message;
      }
      
      if (attempts >= 3) {
        localStorage.setItem('lockout_until', Date.now() + 3 * 60000); // 3 minutes lockout
        setErrorMsg('Demasiados intentos fallidos. Por seguridad, la cuenta ha sido bloqueada por 3 minutos.');
      } else {
        const remaining = 3 - attempts;
        setErrorMsg(`${baseError} Te quedan ${remaining} intento(s) antes de bloquearse.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard${location.state?.search || ''}`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al conectar con Google.');
    }
  };

  const handleGuestLogin = async () => {
    await supabase.auth.signOut();
    localStorage.setItem('guest_mode', 'true');
    const searchParams = location.state?.search || '';
    navigate(`/dashboard${searchParams}`);
  };

  return (
    <>
      <div className="auth-container">
        {/* Usamos una imagen genérica mientras el usuario nos pasa su logo, o texto con estilos si prefiere */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: 'var(--text-heading)', fontSize: '28px', fontWeight: '800', lineHeight:'1.1' }}>
            NavegAltos<br/>
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-muted)' }}>
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

          <div className="input-group" style={{ position: 'relative' }}>
            <Lock className="input-icon" />
            <input
              type={showNip ? 'text' : 'password'}
              className="auth-input"
              placeholder="NIP"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
              style={{ paddingRight: '44px' }}
            />
            <button
              type="button"
              onClick={() => setShowNip(!showNip)}
              style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', padding: 0
              }}
              tabIndex={-1}
            >
              {showNip ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            <LogIn size={18} />
            {isLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div style={{ width: '100%', textAlign: 'right', margin: '8px 0 14px 0' }}>
          <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '500' }}>
            ¿Olvidaste tu NIP?
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 14px 0' }}>
          <hr style={{ flex: 1, borderColor: 'var(--border-color)', borderTop: '1px' }} />
          <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>O</span>
          <hr style={{ flex: 1, borderColor: 'var(--border-color)', borderTop: '1px' }} />
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin}
          className="auth-button"
          style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
          Continuar con Google
        </button>

        <button 
          type="button" 
          onClick={handleGuestLogin}
          className="auth-button"
          style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          <User size={18} />
          Entrar como Invitado
        </button>

        <div className="auth-footer">
          ¿No tienes cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
        </div>

        {deferredPrompt && (
          <div style={{ marginTop: '16px' }}>
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
