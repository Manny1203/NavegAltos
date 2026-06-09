import React from 'react';
import { X, Share2, Route } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function SharedPinReceptionModal({
  isOpen,
  onClose,
  sharedPinData,
  currentUser,
  fetchPins,
  setCurrentBuilding,
  setSelectedFloor,
  setGpsEnabled,
  setDestinationPin,
  setIsTraveling,
  setIsTripBarMinimized
}) {
  if (!isOpen || !sharedPinData) return null;

  const handleSavePin = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para guardar el pin en tu cuenta.');
      return;
    }
    const { id, created_at, updated_at, owner, has_schedule, open_time, close_time, available_days, entrance_node_id, ...restOfPin } = sharedPinData;
    const newPin = {
      ...restOfPin,
      user_id: currentUser.id,
      is_public: false
    };
    const { error } = await supabase.from('pins').insert([newPin]);
    if (error) {
      toast.error('Error al guardar el pin: ' + error.message);
      console.error('Error insertando pin clonado:', error);
    } else {
      toast.success('Pin guardado en tu cuenta exitosamente.');
      fetchPins();
      onClose();
    }
  };

  const handleStartTrip = () => {
    const tempPin = { ...sharedPinData, id: 'temp-' + Date.now() };
    if (tempPin.map_id && tempPin.map_id !== 'main') {
      setCurrentBuilding(tempPin.map_id);
      setSelectedFloor(tempPin.floor || 'PB');
    }
    setGpsEnabled(true);
    if (tempPin.map_id === 'rectoria') {
      setDestinationPin({
        ...tempPin,
        x: 53.957,
        y: 68.560,
        x_coordinate: 53.957,
        y_coordinate: 68.560,
        map_id: 'main'
      });
    } else {
      setDestinationPin(tempPin);
    }
    setIsTraveling(true);
    setIsTripBarMinimized(false);
    onClose();
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
          <Share2 size={20} color="#3b82f6" />
          <h3>Pin Compartido</h3>
        </div>
        <p className="action-modal-desc" style={{ marginBottom: '20px' }}>
          Alguien te ha compartido el pin privado: <strong>{sharedPinData.name}</strong>.
          <br /><br />¿Qué deseas hacer con él?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn-modal-submit btn-success-submit" onClick={handleSavePin}>
            Guardar en Mis Pines
          </button>

          <button className="btn-modal-submit" style={{ background: 'rgba(14, 165, 233, 0.08)', color: '#0ea5e9' }} onClick={handleStartTrip}>
            <Route size={16} /> Solo Iniciar Viaje
          </button>
        </div>
      </div>
    </div>
  );
}
