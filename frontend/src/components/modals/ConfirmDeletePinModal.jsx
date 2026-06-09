import React from 'react';
import { X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function ConfirmDeletePinModal({ pin, onClose, fetchPins, onPinDeleted }) {
  if (!pin) return null;

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('pins').delete().eq('id', pin.id);
      if (error) throw error;
      toast.success('Pin borrado correctamente.');
      fetchPins();
      if (onPinDeleted) onPinDeleted();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Hubo un error al borrar el pin.');
    }
  };

  return (
    <div className="action-modal-overlay">
      <div className="action-modal" style={{ maxWidth: '340px' }}>
        <div className="action-modal-header" style={{ color: '#ef4444' }}>
          <Trash2 size={20} color="#ef4444" />
          <h3 style={{ color: '#ef4444' }}>Borrar Pin</h3>
        </div>
        <p className="action-modal-desc" style={{ marginBottom: '24px' }}>
          ¿Estás seguro de que deseas borrar el pin <strong>{pin.name}</strong>? Esta acción no se puede deshacer.
        </p>
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
            onClick={handleDelete}
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}
