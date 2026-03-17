import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [nip, setNip] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Validar correo institucional UDG
      // Acepta: @alumnos.udg.mx, @academicos.udg.mx, @administracion.udg.mx, @udg.mx
      const validEmailRegex = /^[a-zA-Z0-9._-]+@(alumnos\.|academicos\.|administracion\.)?udg\.mx$/;

      if (!validEmailRegex.test(email)) {
        setErrorMsg('Usa tu correo institucional UDG (ej. nombre.apellido1234@alumnos.udg.mx, nombre@academicos.udg.mx)');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: nip,
        options: {
          data: {
            nombre_completo: nombre,
          }
        }
      });

      if (error) throw error;
      
      setSuccessMsg('¡Registro exitoso! Ya puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000);
      
    } catch (error) {
      setErrorMsg(error.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ color: '#003056', fontSize: '28px', fontWeight: '800', lineHeight:'1.1' }}>
            NavegAltos<br/>
            <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280' }}>
              Centro Universitario de los Altos
            </span>
          </h1>
        </div>

        <h2 className="auth-title">CREAR CUENTA</h2>

        {errorMsg && <p style={{ color: 'red', fontSize: '13px', marginBottom: '10px' }}>{errorMsg}</p>}
        {successMsg && <p style={{ color: 'green', fontSize: '13px', marginBottom: '10px' }}>{successMsg}</p>}

        <form className="auth-form" onSubmit={handleRegister}>

          
          <div className="input-group">
            <User className="input-icon" />
            <input
              type="text"
              className="auth-input"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

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
            {isLoading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión</Link>
        </div>
      </div>

      <div className="page-footer">
        © 2026 Universidad de Guadalajara<br/>
        Centro Universitario de los Altos
      </div>
    </>
  );
}
