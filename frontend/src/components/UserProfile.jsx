import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, Camera, Lock, Sun, Moon, Trash2, User, LogOut, BookOpen, Check } from 'lucide-react';

export default function UserProfile({ onClose, onLogout, darkMode, setDarkMode }) {
  const [session, setSession] = useState(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  // Delete account flow: 'idle' → 'confirm' → 'typing'
  const [deleteStep, setDeleteStep] = useState('idle');
  const [deleteInput, setDeleteInput] = useState('');

  const [contributions, setContributions] = useState({ total: 0, approved: 0, pending: 0 });
  const fileInputRef = useRef(null);

  // Dark mode token helper
  const bg     = 'var(--bg-main)';
  const bgCard = 'var(--bg-card)';
  const border = 'var(--border-color)';
  const text   = 'var(--text-main)';
  const textSub= 'var(--text-muted)';
  const inputBg= 'var(--input-bg)';

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setSession(session);

      // Fetch profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (prof) {
        setFullName(prof.full_name || '');
        setAvatarUrl(prof.avatar_url || '');
      }

      // Approved pins (user submitted → admin approved → inserted into pins table)
      const { data: approvedPins } = await supabase
        .from('pins')
        .select('id')
        .eq('user_id', session.user.id);

      // Pending requests (submitted but not yet approved)
      const { data: pendingReqs } = await supabase
        .from('pin_requests')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'pending');

      const approved = approvedPins?.length || 0;
      const pending  = pendingReqs?.length  || 0;
      setContributions({ total: approved + pending, approved, pending });
    };
    init();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${session.user.id}/avatar.${ext}`;
    try {
      const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const url = urlData.publicUrl + `?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: url, updated_at: new Date().toISOString() }).eq('id', session.user.id);
      setAvatarUrl(url);
      setSaveMsg('¡Foto actualizada!');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (err) {
      console.error('Error al subir foto:', err);
      setSaveMsg(`Error: ${err.message || 'Desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!session) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', session.user.id);
    setSaving(false);
    if (error) setSaveMsg('Error al guardar el nombre.');
    else { setSaveMsg('¡Nombre guardado!'); setTimeout(() => setSaveMsg(''), 2500); }
  };

  const handleChangePwd = async () => {
    if (newPwd.length < 6) { setPwdMsg('El NIP debe tener al menos 6 caracteres.'); return; }
    if (newPwd !== confirmPwd) { setPwdMsg('Los NIPs no coinciden.'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) setPwdMsg('Error: ' + error.message);
    else { setPwdMsg('¡NIP actualizado exitosamente!'); setNewPwd(''); setConfirmPwd(''); setShowChangePwd(false); setTimeout(() => setPwdMsg(''), 3000); }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toLowerCase() !== 'eliminar') return;
    await supabase.auth.signOut();
    onLogout();
  };

  const getInitials = () => {
    if (fullName) return fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (session?.user?.email) return session.user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, backdropFilter: 'blur(2px)' }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100dvh', width: 'min(400px, 100vw)',
        background: bg, zIndex: 1101, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.3)', animation: 'slideInRight 0.25s ease',
        overflowY: 'auto', color: text,
      }}>

        {/* Header */}
        <div style={{ background: '#003056', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 18, letterSpacing: 0.3 }}>Mi Perfil</span>
          <button onClick={onClose} style={{ color: 'white', display: 'flex', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
            <X size={22} />
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 24px 16px', borderBottom: `1px solid ${border}` }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'relative', width: 88, height: 88, borderRadius: '50%',
              background: avatarUrl ? 'transparent' : '#003056',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden', border: '3px solid #E25E24',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'white', fontSize: 30, fontWeight: 800 }}>{getInitials()}</span>}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', padding: '6px 0', display: 'flex', justifyContent: 'center' }}>
              {uploading ? <span style={{ color: 'white', fontSize: 10 }}>...</span> : <Camera size={14} color="white" />}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          <p style={{ marginTop: 8, fontSize: 13, color: textSub }}>{session?.user?.email || ''}</p>
          {saveMsg && <p style={{ color: saveMsg.includes('Error') ? '#ef4444' : '#10b981', fontSize: 12, marginTop: 4, fontWeight: 600 }}>{saveMsg}</p>}
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nombre</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input
                type="text" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${border}`, fontSize: 14, background: inputBg, color: text, outline: 'none' }}
              />
              <button onClick={handleSaveName} disabled={saving}
                style={{ background: '#003056', color: 'white', borderRadius: 10, padding: '0 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center' }}>
                {saving ? '...' : <Check size={18} />}
              </button>
            </div>
          </div>

          {/* Contributions */}
          <div style={{ background: bgCard, borderRadius: 12, padding: '14px 16px', border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BookOpen size={16} color="#E25E24" />
              <span style={{ fontWeight: 700, fontSize: 13, color: text }}>Mis Aportaciones</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Total',     value: contributions.total,    color: '#E25E24' },
                { label: 'Aprobados', value: contributions.approved,  color: '#10b981' },
                { label: 'Pendientes',value: contributions.pending,   color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', background: bgCard, borderRadius: 8, padding: '10px 4px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: textSub, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: textSub, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tema Visual</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {[
                { label: 'Claro',  icon: <Sun size={16} />,  val: false },
                { label: 'Oscuro', icon: <Moon size={16} />, val: true  },
              ].map(t => (
                <button key={t.label} onClick={() => setDarkMode(t.val)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: 'none',
                    outline: darkMode === t.val ? '2px solid #E25E24' : `2px solid ${border}`,
                    background: darkMode === t.val ? 'rgba(226,94,36,0.15)' : bgCard,
                    color: darkMode === t.val ? '#E25E24' : textSub,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                  }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Change NIP */}
          <div>
            <button onClick={() => setShowChangePwd(!showChangePwd)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${border}`, background: bgCard, fontWeight: 700, fontSize: 14, color: text }}>
              <Lock size={16} color={textSub} />Cambiar NIP
            </button>
            {showChangePwd && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: -4 }}>
                  <label style={{ fontSize: 12, color: textSub, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showPwd} onChange={() => setShowPwd(!showPwd)} />
                    Mostrar NIP
                  </label>
                </div>
                <input type={showPwd ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="Nuevo NIP (mín. 6 caracteres)"
                  style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${border}`, fontSize: 14, background: inputBg, color: text, outline: 'none' }}
                />
                <input type={showPwd ? "text" : "password"} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Confirmar NIP"
                  style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${border}`, fontSize: 14, background: inputBg, color: text, outline: 'none' }}
                />
                <button onClick={handleChangePwd}
                  style={{ background: '#003056', color: 'white', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>
                  Guardar nuevo NIP
                </button>
                {pwdMsg && <p style={{ fontSize: 12, color: pwdMsg.includes('Error') || pwdMsg.includes('coinciden') || pwdMsg.includes('caracteres') ? '#ef4444' : '#10b981', fontWeight: 600 }}>{pwdMsg}</p>}
              </div>
            )}
          </div>

          {/* Logout */}
          <button onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${border}`, background: bgCard, fontWeight: 700, fontSize: 14, color: text }}>
            <LogOut size={16} color={textSub} />Cerrar Sesión
          </button>

          {/* Delete Account — 3-step flow */}
          {deleteStep === 'idle' && (
            <button onClick={() => setDeleteStep('confirm')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', border: '1px solid #fecaca', background: darkMode ? '#450a0a' : '#fff5f5', fontWeight: 700, fontSize: 14, color: '#ef4444' }}>
              <Trash2 size={16} />Eliminar Cuenta
            </button>
          )}

          {deleteStep === 'confirm' && (
            <div style={{ background: darkMode ? '#450a0a' : '#fff5f5', border: '1px solid #fca5a5', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 700, marginBottom: 6 }}>⚠️ ¿Eliminar tu cuenta?</p>
              <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 14, lineHeight: 1.5 }}>
                Esta acción es permanente e irreversible. Perderás todos tus datos.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDeleteStep('idle')}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', background: bgCard, color: text, fontWeight: 700, fontSize: 13, border: `1px solid ${border}` }}>
                  Cancelar
                </button>
                <button onClick={() => setDeleteStep('typing')}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 13, border: 'none' }}>
                  Continuar
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'typing' && (
            <div style={{ background: darkMode ? '#450a0a' : '#fff5f5', border: '2px solid #dc2626', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>
                Escribe <strong>eliminar</strong> para confirmar:
              </p>
              <input
                type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                placeholder='Escribe "eliminar"'
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #fca5a5', fontSize: 14, background: inputBg, color: text, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setDeleteStep('idle'); setDeleteInput(''); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', background: bgCard, color: text, fontWeight: 700, fontSize: 13, border: `1px solid ${border}` }}>
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput.trim().toLowerCase() !== 'eliminar'}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, cursor: deleteInput.trim().toLowerCase() === 'eliminar' ? 'pointer' : 'not-allowed',
                    background: deleteInput.trim().toLowerCase() === 'eliminar' ? '#dc2626' : '#9ca3af',
                    color: 'white', fontWeight: 700, fontSize: 13, border: 'none', transition: 'background 0.2s'
                  }}>
                  Eliminar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
