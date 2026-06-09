import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function BugReportModal({ isOpen, onClose, currentUser }) {
  const [bugDescription, setBugDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!bugDescription.trim()) {
      toast.error('Por favor, escribe una descripción del error.');
      return;
    }
    try {
      const userName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Usuario Desconocido';
      const { error } = await supabase.from('system_bugs').insert([{
        user_id: currentUser?.id,
        user_name: userName,
        description: bugDescription,
        status: 'pending'
      }]);
      if (error) throw error;
      toast.success('Reporte de error enviado exitosamente. ¡Gracias!');
      setBugDescription('');
      onClose();
    } catch (err) {
      console.error('Error enviando bug:', err);
      toast.error('Hubo un error al enviar el reporte.');
    }
  };

  return (
    <div className="action-modal-overlay">
      <div className="action-modal">
        <button className="btn-close" onClick={() => { setBugDescription(''); onClose(); }}>
          <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
          </span>
        </button>
        <div className="action-modal-header">
          <AlertTriangle size={20} color="#f59e0b" />
          <h3>Reportar un Error</h3>
        </div>
        <p className="action-modal-desc">
          Por favor, describe detalladamente el error o problema que encontraste en la aplicación.
        </p>

        <div className="action-form-group">
          <label>DESCRIPCIÓN DEL ERROR</label>
          <textarea
            className="auth-input"
            placeholder="Ej. Al intentar buscar un pin en el edificio A, la pantalla se queda en blanco..."
            value={bugDescription}
            onChange={(e) => setBugDescription(e.target.value)}
          />
        </div>

        <button
          className="btn-modal-submit"
          style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}
          onClick={handleSubmit}
        >
          <AlertTriangle size={16} /> Enviar Reporte de Error
        </button>
      </div>
    </div>
  );
}
