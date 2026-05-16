import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    // Supabase automáticamente maneja el token en la URL y crea una sesión
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMsg({ text: 'El enlace de recuperación no es válido o ha expirado.', type: 'error' });
      }
    };
    checkSession();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg({ text: 'El NIP debe tener al menos 6 caracteres.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ text: 'Los NIPs no coinciden.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMsg({ text: '¡NIP actualizado correctamente! Redirigiendo...', type: 'success' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error(error);
      setMsg({ text: 'Hubo un error al actualizar el NIP.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        <h2 className="auth-title">NUEVO NIP</h2>
        
        {msg.text && (
          <p style={{ color: msg.type === 'error' ? 'red' : 'green', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {msg.text}
          </p>
        )}

        {msg.type !== 'error' || msg.text === 'El NIP debe tener al menos 6 caracteres.' || msg.text === 'Hubo un error al actualizar el NIP.' ? (
          <form className="auth-form" onSubmit={handleUpdate}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                Mostrar NIP
              </label>
            </div>
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Ingresa tu nuevo NIP"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Confirmar NIP"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Guardar Nuevo NIP"}
            </button>
          </form>
        ) : (
          <button onClick={() => navigate('/login')} className="auth-button" style={{ width: '100%' }}>
            Ir a Iniciar Sesión
          </button>
        )}
      </div>

      <div className="page-footer">
        © 2026 Universidad de Guadalajara<br/>
        Centro Universitario de los Altos
      </div>
    </>
  );
}
