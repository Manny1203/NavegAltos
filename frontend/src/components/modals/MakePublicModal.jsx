import React, { useState } from 'react';
import { X, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function MakePublicModal({ isOpen, onClose, publicPinData, currentUser, filters }) {
  const [hasSchedule, setHasSchedule] = useState(false);
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [pinDescription, setPinDescription] = useState('');
  const [availableDays, setAvailableDays] = useState(['L', 'M', 'Mi', 'J', 'V']);
  const [pinCategory, setPinCategory] = useState('Académico');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expireDay, setExpireDay] = useState('');
  const [expireMonth, setExpireMonth] = useState('');
  const [expireYear, setExpireYear] = useState(new Date().getFullYear().toString());
  const [expireTime, setExpireTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!pinCategory) {
      toast.error('Por favor, selecciona una categoría para el pin.');
      return;
    }

    if (!ownerName) {
      toast.error('Por favor, indica a quién le pertenece este pin.');
      return;
    }

    let finalExpiresAt = null;

    if (isTemporary) {
      if (!expireDay || !expireMonth || !expireYear || !expireTime) {
        toast.error('Por favor, completa todos los campos de la fecha y hora de caducidad.');
        return;
      }
      
      const day = parseInt(expireDay);
      const month = parseInt(expireMonth);
      const year = parseInt(expireYear);
      
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2024) {
        toast.error('La fecha ingresada no es válida.');
        return;
      }
      
      // format to ISO string properly handling timezone
      // expireTime is HH:mm
      const formattedMonth = month.toString().padStart(2, '0');
      const formattedDay = day.toString().padStart(2, '0');
      const dateStr = `${year}-${formattedMonth}-${formattedDay}T${expireTime}:00`;
      
      try {
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) throw new Error("Invalid date");
        
        if (parsedDate < new Date()) {
          toast.error('La fecha de caducidad no puede estar en el pasado.');
          return;
        }

        finalExpiresAt = parsedDate.toISOString();
      } catch (err) {
        toast.error('La fecha/hora ingresada no es válida.');
        return;
      }
    }

    if (!currentUser || !publicPinData) {
      toast.error('Error de sesión o pin no seleccionado.');
      return;
    }

    try {
      const requestData = {
        pin_id: publicPinData.id,
        requester_id: currentUser.id,
        requester_name: ownerName,
        description: pinDescription,
        request_reason: 'Solicitud para hacer el pin público.',
        has_schedule: hasSchedule,
        open_time: openTime || null,
        close_time: closeTime || null,
        available_days: availableDays,
        status: 'pending',
        expires_at: finalExpiresAt
      };

      const { error } = await supabase.from('pin_requests').insert([requestData]);

      if (error) throw error;

      // Notificar a los administradores
      const { data: admins } = await supabase.from('admin_users').select('user_id');
      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          title: 'Nueva Solicitud',
          message: `El usuario ${ownerName} quiere hacer público el pin '${publicPinData.name}'.`,
          type: 'new_request'
        }));
        // We use try-catch here so that if it fails it doesn't break the user experience
        try {
          await supabase.from('notifications').insert(notifications);
        } catch (err) {
          console.error("Error sending admin notifications:", err);
        }
      }

      toast.success('Solicitud enviada a revisión. En breve revisamos tu pin.');
      
      // Reset state on success
      setOwnerName('');
      setPinDescription('');
      setHasSchedule(false);
      setOpenTime('');
      setCloseTime('');
      setAvailableDays(['L', 'M', 'Mi', 'J', 'V']);
      setPinCategory('Académico');
      setIsTemporary(false);
      setExpireDay('');
      setExpireMonth('');
      setExpireYear(new Date().getFullYear().toString());
      setExpireTime('');
      
      onClose();
    } catch (e) {
      console.error("Error pidiendo pin público: ", e);
      toast.error('Hubo un error al enviar la solicitud.');
    }
  };

  return (
    <div className="action-modal-overlay">
      <div className="action-modal">
        <button className="btn-close" onClick={onClose}>
          <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
          </span>
        </button>

        <div className="action-modal-header">
          <Globe size={20} color="#E25E24" />
          <h3>Hacer Público</h3>
        </div>
        <p className="action-modal-desc">
          Manda este pin a revisión para que todos puedan verlo en el mapa principal.
        </p>

        <div className="action-form-group">
          <label>¿TIENE HORARIO DE DISPONIBILIDAD?</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
            <input
              type="checkbox"
              checked={hasSchedule}
              onChange={(e) => setHasSchedule(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#E25E24', cursor: 'pointer' }}
            />
            <span style={{ cursor: 'pointer' }} onClick={() => setHasSchedule(!hasSchedule)}>
              Sí, tiene horario definido
            </span>
          </div>
        </div>

        {hasSchedule && (
          <div className="time-inputs" style={{ marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, display: 'block', marginBottom: '4px' }}>HORA DE APERTURA</label>
              <input type="time" className="auth-input" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, display: 'block', marginBottom: '4px' }}>HORA DE CIERRE</label>
              <input type="time" className="auth-input" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
            </div>
          </div>
        )}

        <div className="action-form-group">
          <label>¿ES UN EVENTO TEMPORAL?</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            <input 
              type="checkbox" 
              checked={isTemporary} 
              onChange={(e) => setIsTemporary(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: '#E25E24', cursor: 'pointer' }}
            />
            <span style={{ cursor: 'pointer' }} onClick={() => setIsTemporary(!isTemporary)}>
              Sí, este pin caducará automáticamente
            </span>
          </div>
          {isTemporary && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, display: 'block', marginBottom: '4px' }}>FECHA Y HORA DE CADUCIDAD</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  className="auth-input" 
                  placeholder="Día (DD)" 
                  min="1" max="31"
                  style={{ flex: 1, padding: '8px', textAlign: 'center' }}
                  value={expireDay} 
                  onChange={(e) => setExpireDay(e.target.value)} 
                />
                <input 
                  type="number" 
                  className="auth-input" 
                  placeholder="Mes (MM)" 
                  min="1" max="12"
                  style={{ flex: 1, padding: '8px', textAlign: 'center' }}
                  value={expireMonth} 
                  onChange={(e) => setExpireMonth(e.target.value)} 
                />
                <input 
                  type="number" 
                  className="auth-input" 
                  placeholder="Año" 
                  min="2024" max="2100"
                  style={{ flex: 1, padding: '8px', textAlign: 'center' }}
                  value={expireYear} 
                  onChange={(e) => setExpireYear(e.target.value)} 
                />
              </div>
              <div style={{ marginTop: '8px' }}>
                <input 
                  type="time" 
                  className="auth-input" 
                  style={{ width: '100%', padding: '8px' }}
                  value={expireTime} 
                  onChange={(e) => setExpireTime(e.target.value)} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="action-form-group">
          <label>¿A QUIÉN LE PERTENECE?</label>
          <input type="text" className="auth-input" placeholder="Ej. Club de Robótica" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </div>

        <div className="action-form-group">
          <label>DESCRIPCIÓN (Opcional)</label>
          <textarea
            className="auth-input"
            placeholder="Agrega notas o detalles sobre el pin"
            value={pinDescription}
            onChange={(e) => setPinDescription(e.target.value)}
            style={{ height: '60px', resize: 'none' }}
          />
        </div>

        <div className="action-form-group">
          <label>DÍAS DISPONIBLE</label>
          <div className="days-selector">
            {['L', 'M', 'Mi', 'J', 'V', 'S', 'D'].map(day => (
              <button
                key={day}
                className={`day-btn ${availableDays.includes(day) ? 'active' : ''}`}
                onClick={() => setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="action-form-group">
          <label>CATEGORÍA</label>
          <select className="auth-input" style={{ fontFamily: "'Inter', sans-serif" }} value={pinCategory} onChange={(e) => setPinCategory(e.target.value)}>
            <option value="" disabled>Selecciona una categoría</option>
            {filters.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        <button className="btn-modal-submit btn-public-submit" onClick={handleSubmit}>
          <Globe size={16} /> Enviar Solicitud
        </button>
      </div>
    </div>
  );
}
