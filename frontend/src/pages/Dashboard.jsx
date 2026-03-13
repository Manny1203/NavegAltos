import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  Menu, Search, Plus, Map as MapIcon, Globe, Unlock, X, 
  MapPin, BookOpen, Coffee, Car, Microscope
} from 'lucide-react';
import mapImage from '../assets/mapa_universidad.jpeg';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [markerMode, setMarkerMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPinPos, setNewPinPos] = useState(null);
  
  // En lugar de una base de datos temporalmente, los guardamos en estado local
  const [userPins, setUserPins] = useState([]);
  
  // Pin Creator State
  const [newPinName, setNewPinName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pin');
  const [selectedColor, setSelectedColor] = useState('#ef4444');

  const filters = [
    { id: 'canchas', label: 'Canchas' },
    { id: 'cafeteria', label: 'Cafetería' },
    { id: 'aulas', label: 'Aulas' },
    { id: 'banos', label: 'Baños' },
    { id: 'laboratorios', label: 'Laboratorios' }
  ];

  const handleFilterClick = (id) => {
    if (activeFilter === id) {
      setActiveFilter(null);
      setShowModal(false);
    } else {
      setActiveFilter(id);
      if (id === 'aulas' || id === 'cafeteria') {
        setModalType(id);
        setShowModal(true);
        setMarkerMode(false);
      } else {
        setShowModal(false);
      }
    }
  };

  const toggleMarkerMode = () => {
    setMarkerMode(!markerMode);
    setShowPinModal(false);
    if (!markerMode) {
      setActiveFilter(null);
      setShowModal(false);
    }
  };

  // Mocked Pins array (like the reference image)
  const pins = [
    { id: 1, x: 25, y: 55, icon: 'book', color: '#10b981' }, // Green book
    { id: 2, x: 40, y: 65, icon: 'microscope', color: '#3b82f6' }, // Blue microscope
    { id: 3, x: 43, y: 54, icon: 'coffee', color: '#f97316' }, // Orange coffee
    { id: 4, x: 55, y: 48, icon: 'pin', color: '#a855f7' }, // Purple pin
    { id: 5, x: 56, y: 65, icon: 'pin', color: '#60a5fa' }, // Light blue pin
    { id: 6, x: 67, y: 54, icon: 'pin', color: '#f97316' }, // Orange pin
    { id: 7, x: 67, y: 25, icon: 'pin', color: '#ef4444' }, // Red pin
    { id: 8, x: 74, y: 35, icon: 'pin', color: '#10b981' }, // Green pin
  ];

  const renderPinIcon = (type, color) => {
    switch (type) {
      case 'book': return <BookOpen color={color} />;
      case 'coffee': return <Coffee color={color} />;
      case 'car': return <Car color={color} />;
      case 'microscope': return <Microscope color={color} />;
      default: return <MapPin color={color} />;
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* Top Bar Navigation */}
      <div className="floating-ui top-bar">
        <button className="icon-btn">
          <Menu size={24} />
        </button>
        
        <div className="search-bar-container" onClick={() => { setShowModal(true); setModalType('frecuentes'); setMarkerMode(false); }}>
          <Search size={20} color="#9ca3af" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar ubicación..." 
            readOnly 
          />
        </div>
        
        <button 
          className="icon-btn" 
          onClick={toggleMarkerMode}
          style={{ background: markerMode ? '#E25E24' : 'white', color: markerMode ? 'white' : '#333' }}
        >
          {markerMode ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

        {/* Marker Mode helper banner */}
        {markerMode && !showPinModal && (
          <div className="marker-mode-banner floating-ui" style={{ top: '80px', left: '50%', transform: 'translateX(-50%)' }}>
            <MapPin size={24} className="marker-mode-icon" />
            <span className="marker-mode-title">Modo Marcador</span>
            <span className="marker-mode-subtitle">Toca el mapa para ubicar tu nuevo punto</span>
          </div>
        )}
      {/* Pin Creator Modal */}
      {showPinModal && (
        <div className="pin-creator-modal floating-ui">
          <div className="modal-section-title">NOMBRE</div>
          <input 
            type="text" 
            className="pin-name-input" 
            placeholder="Ej. Mi salón favorito"
            value={newPinName}
            onChange={(e) => setNewPinName(e.target.value)}
          />

          <div className="modal-section-title">ICONO Y COLOR</div>
          <div className="pin-options-row">
            {['pin', 'coffee', 'car', 'book', 'microscope'].map(icon => (
              <div 
                key={icon}
                className={`pin-option-btn icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                onClick={() => setSelectedIcon(icon)}
              >
                {renderPinIcon(icon, selectedIcon === icon ? 'white' : '#9ca3af')}
              </div>
            ))}
          </div>
          
          <div className="pin-options-row">
            {['#ef4444', '#60a5fa', '#f97316', '#10b981', '#a855f7'].map(color => (
              <div 
                key={color}
                className={`pin-option-btn color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color, borderColor: selectedColor === color ? '#333' : 'transparent' }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>

          <div className="pin-actions">
            <button className="pin-action-btn btn-cancel" onClick={() => {
              setShowPinModal(false);
              setMarkerMode(false);
            }}>Cancelar</button>
            <button className="pin-action-btn btn-save" onClick={() => {
              const newPin = {
                id: Date.now(),
                x: newPinPos.x,
                y: newPinPos.y,
                name: newPinName,
                icon: selectedIcon,
                color: selectedColor
              };
              setUserPins([...userPins, newPin]);
              setShowPinModal(false);
              setMarkerMode(false);
              setNewPinName('');
            }}>Guardar Pin</button>
          </div>
        </div>
      )}

      {/* Right Sidebar */}
      <div className="floating-ui right-sidebar">
        <button className="icon-btn"><MapIcon size={24} /></button>
        <button className="icon-btn"><Globe size={24} /></button>
        <button className="icon-btn"><Unlock size={24} /></button>
      </div>

      {/* Bottom Filters */}
      <div className="floating-ui bottom-filters">
        {filters.map(filter => (
          <button 
            key={filter.id}
            className={`filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => handleFilterClick(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Pop-up Modals for Filters */}
      {showModal && (
        <div className="modal-overlay floating-ui">
          <div className="modal-header">
            <span className="modal-title">
              {modalType === 'frecuentes' ? 'FRECUENTES' : modalType === 'aulas' ? 'Aulas' : 'Opciones'}
            </span>
            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
          </div>
          
          <div className="modal-content">
            <div className="modal-item">
              <div className="modal-item-icon" style={{ color: '#60a5fa', background: '#eff6ff' }}><MapPin size={20}/></div>
              <div className="modal-item-text">
                <div className="modal-item-title">Edificio de Rectoría</div>
                <div className="modal-item-subtitle">CUALTOS CAMPUS</div>
              </div>
            </div>
            <div className="modal-item">
              <div className="modal-item-icon" style={{ color: '#10b981', background: '#ecfdf5' }}><BookOpen size={20}/></div>
              <div className="modal-item-text">
                <div className="modal-item-title">Biblioteca Mario Rivas Souza</div>
                <div className="modal-item-subtitle">CUALTOS CAMPUS</div>
              </div>
            </div>
            <div className="modal-item">
              <div className="modal-item-icon" style={{ color: '#f97316', background: '#fff7ed' }}><MapPin size={20}/></div>
              <div className="modal-item-text">
                <div className="modal-item-title">Aulas Agroindustrias (D)</div>
                <div className="modal-item-subtitle">CUALTOS CAMPUS</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map Area */}
      <div 
        style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 1, cursor: markerMode ? 'crosshair' : 'default' }}
        onClick={(e) => {
          if (markerMode && !showPinModal) {
            // Check if click was inside the image bounding box
            const img = document.querySelector('.map-image');
            if (img) {
              const rect = img.getBoundingClientRect();
              if (
                e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom
              ) {
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setNewPinPos({ x, y });
                setShowPinModal(true);
              }
            }
          }
        }}
      >
        <TransformWrapper
          initialScale={0.8}
          minScale={0.2}
          maxScale={4}
          centerOnInit={true}
          centerZoomedOut={true}
          limitToBounds={false}
          disabled={markerMode}
        >
          <TransformComponent wrapperClass="map-wrapper">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={mapImage} 
                alt="Mapa Universitario" 
                className="map-image"
              />
            {/* Render Mock Pins and newly created user Pins */}
            {[...pins, ...userPins].map(pin => (
              <div 
                key={pin.id} 
                className="map-pin"
                style={{ left: `${pin.x}%`, top: `${pin.y}%`, borderColor: pin.color, boxShadow: `0 4px 12px ${pin.color}40` }}
              >
                {renderPinIcon(pin.icon, pin.color)}
              </div>
            ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

    </div>
  );
}
