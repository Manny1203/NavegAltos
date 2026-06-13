import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function RejectRequestModal({ isOpen, onClose, onConfirm, requestName }) {
  const [reason, setReason] = useState('No cumple con las normas de la comunidad');

  if (!isOpen) return null;

  return (
    <div className="action-modal-overlay">
      <div className="action-modal" style={{ maxWidth: '380px' }}>
        <div className="action-modal-header" style={{ color: '#ef4444' }}>
          <AlertCircle size={20} color="#ef4444" />
          <h3 style={{ color: '#ef4444', margin: 0 }}>Rechazar Solicitud</h3>
        </div>

        <p className="action-modal-desc" style={{ marginBottom: '16px' }}>
          Estás a punto de rechazar la solicitud para hacer público el pin <strong>{requestName}</strong>.
          Por favor, especifica un motivo para que el usuario sepa qué ocurrió.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Escribe el motivo del rechazo..."
          className="report-textarea"
          rows={3}
          style={{ 
            width: '100%', 
            marginBottom: '24px', 
            padding: '12px', 
            borderRadius: '8px',
            border: '1px solid var(--border-color, #e5e7eb)',
            background: 'var(--input-bg, #ffffff)',
            color: 'var(--text-main, #000000)',
            fontFamily: 'inherit'
          }}
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-modal-submit"
            style={{ background: '#f3f4f6', color: '#4b5563', flex: 1 }}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="btn-modal-submit"
            style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', flex: 1 }}
            onClick={() => {
              onConfirm(reason);
              setReason('No cumple con las normas de la comunidad'); // Reset for next time
            }}
          >
            Confirmar Rechazo
          </button>
        </div>
      </div>
    </div>
  );
}
