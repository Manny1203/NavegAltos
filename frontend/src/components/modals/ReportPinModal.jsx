import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function ReportPinModal({ isOpen, onClose, reportPinData, selectedPin, currentUser }) {
  const [reportReason, setReportReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reportReason.trim()) {
      toast.error('Por favor, escribe una razón para el reporte.');
      return;
    }
    try {
      const { error } = await supabase.from('pin_reports').insert([{
        pin_id: reportPinData?.id || selectedPin?.id,
        reporter_id: currentUser?.id || null,
        reason: reportReason.trim(),
        status: 'pending'
      }]);
      if (error) throw error;
      toast.success('Reporte enviado. Gracias por tu ayuda.');
      setReportReason('');
      onClose();
    } catch (e) {
      console.error('Error enviando reporte:', e);
      toast.error('Hubo un error al enviar el reporte. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="action-modal-overlay">
      <div className="action-modal">
        <button className="btn-close" onClick={() => { setReportReason(''); onClose(); }}>
          <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
          </span>
        </button>
        <div className="action-modal-header">
          <AlertTriangle size={20} color="#cf1010" />
          <h3>Reportar Pin</h3>
        </div>
        <p className="action-modal-desc">
          Ayúdanos a mantener el mapa limpio. Cuéntanos por qué este pin es innecesario o incorrecto.
        </p>
        <div className="action-form-group">
          <label>RAZÓN DEL REPORTE</label>
          <textarea
            className="auth-input"
            placeholder="Escribe los detalles aquí..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
        </div>
        <button className="btn-modal-submit btn-report-submit" onClick={handleSubmit}>
          <AlertTriangle size={16} /> Enviar Reporte
        </button>
      </div>
    </div>
  );
}
