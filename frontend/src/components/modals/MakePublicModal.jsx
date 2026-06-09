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
        status: 'pending'
      };

      const { error } = await supabase.from('pin_requests').insert([requestData]);

      if (error) throw error;

      toast.success('Solicitud enviada a revision. En breve revisamos tu pin.');
      
      // Reset state on success
      setOwnerName('');
      setPinDescription('');
      setHasSchedule(false);
      setOpenTime('');
      setCloseTime('');
      setAvailableDays(['L', 'M', 'Mi', 'J', 'V']);
      setPinCategory('Académico');
      
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

        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={hasSchedule}
            onChange={(e) => setHasSchedule(e.target.checked)}
          />
          ¿Tiene horario de disponibilidad?
        </label>

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
