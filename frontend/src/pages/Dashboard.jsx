import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  Menu, Search, Plus, Map as MapIcon, Globe, Lock, X, 
  MapPin, BookOpen, Coffee, Car, Microscope, Clock, Route,
  AlertTriangle, Trash2, LogOut, Shield
} from 'lucide-react';
import mapImage from '../assets/mapa_universidad.jpeg';
import { supabase } from '../lib/supabase';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState(null);
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private'
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [markerMode, setMarkerMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPinPos, setNewPinPos] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Menu sidebar state
  const [showMenuSidebar, setShowMenuSidebar] = useState(false);

  // Modals state
  const [showMakePublicModal, setShowMakePublicModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Make Public Form State
  const [hasSchedule, setHasSchedule] = useState(false);
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [availableDays, setAvailableDays] = useState(['L', 'M', 'Mi', 'J', 'V']);
  const [pinCategory, setPinCategory] = useState('Académico');

  // Report Form State
  const [reportReason, setReportReason] = useState('');
  
  const [userPins, setUserPins] = useState([]);
  
  // Pin Creator State
  const [newPinName, setNewPinName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pin');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [newPinCategory, setNewPinCategory] = useState('aulas'); // Default category

  // Admin logic
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchPins();
    fetchUser();
  }, [activeFilter, visibilityFilter, currentUser?.id]);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user);
      // Check if admin
      const { data } = await supabase.from('admin_users').select('*').eq('user_id', session.user.id).maybeSingle();
      if (data) setIsAdmin(true);
    } else {
      setCurrentUser(null);
      setIsAdmin(false);
    }
  };


  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const fetchPins = async () => {
    try {
      let query = supabase.from('pins').select('*');
      
      // If a category filter is active, filter pins by it
      if (activeFilter) {
        query = query.eq('category', activeFilter);
      }

      // If a visibility filter is active, filter pins accordingly
      if (visibilityFilter === 'public') {
        query = query.eq('is_public', true);
      } else if (visibilityFilter === 'private' && currentUser) {
        query = query.eq('is_public', false).eq('user_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        setUserPins(data);
      }
    } catch (error) {
      console.error('Error fetching database pins:', error);
    }
  };

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
      const filterLabel = filters.find(f => f.id === id)?.label || 'Opciones';
      setModalType(filterLabel);
      setShowModal(true);
      setMarkerMode(false);
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

  // Mocked Pins array removed

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
      
      {/* Search Bar (formerly below navbar) */}
      <div className="floating-ui top-bar">
        <button className="icon-btn" onClick={() => setShowMenuSidebar(!showMenuSidebar)}>
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

      {/* Menu Sidebar */}
      {showMenuSidebar && (
        <>
          <div className="menu-sidebar-overlay" onClick={() => setShowMenuSidebar(false)} />
          <div className="menu-sidebar">
            <div className="menu-sidebar-header">
              <span className="menu-sidebar-title">Menú</span>
              <button className="menu-sidebar-close" onClick={() => setShowMenuSidebar(false)}>
                <span style={{ display: 'flex', width: '20px', height: '20px', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} style={{ display: 'block', width: '20px', height: '20px' }} />
                </span>
              </button>
            </div>
            <div className="menu-sidebar-content">
              {isAdmin && (
                <button 
                  className="menu-sidebar-item"
                  onClick={() => navigate('/admin')}
                  style={{ marginBottom: '16px' }}
                >
                  <Shield size={20} color="#003056" />
                  <div className="menu-item-text">
                    <span className="menu-item-label" style={{ color: '#003056' }}>Panel de Control</span>
                    <span className="menu-item-desc">Gestión de pines y solicitudes</span>
                  </div>
                </button>
              )}
              <button 
                className="menu-sidebar-item text-danger"
                onClick={handleLogout}
                style={{ color: '#cf1010', marginTop: 'auto' }}
              >
                <LogOut size={20} />
                <div className="menu-item-text">
                  <span className="menu-item-label">Cerrar Sesión</span>
                  <span className="menu-item-desc">Salir de tu cuenta</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

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

          <div className="modal-section-title">CATEGORÍA</div>
          <select 
            className="pin-name-input" 
            style={{ marginBottom: '16px', background: 'white' }}
            value={newPinCategory}
            onChange={(e) => setNewPinCategory(e.target.value)}
          >
            {filters.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>

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
            <button className="pin-action-btn btn-save" onClick={async () => {
              if (!newPinName) {
                alert("Por favor, ponle un nombre a tu pin.");
                return;
              }
              try {
                // Get the logged in user
                const { data: { session } } = await supabase.auth.getSession();
                
                const newPin = {
                  user_id: session?.user?.id || null, // Optional if we allow anonymous, but RLS protects it normally
                  name: newPinName,
                  category: newPinCategory,
                  icon: selectedIcon,
                  color: selectedColor,
                  x_coordinate: newPinPos.x,
                  y_coordinate: newPinPos.y,
                  is_public: false // New pins are private by default
                };

                const { data, error } = await supabase
                  .from('pins')
                  .insert([newPin])
                  .select();
                  
                if (error) throw error;

                if (data && data.length > 0) {
                  setUserPins([...userPins, data[0]]);
                }
              } catch (error) {
                console.error("Error saving pin to Supabase:", error);
                alert("Hubo un error al guardar el pin. Intenta de nuevo.");
              } finally {
                setShowPinModal(false);
                setMarkerMode(false);
                setNewPinName('');
                setNewPinCategory('aulas'); // Reset category
              }
            }}>Guardar Pin</button>
          </div>
        </div>
      )}

      {/* Right Sidebar */}
      <div className="floating-ui right-sidebar">
        <button className="icon-btn sidebar-btn" title="Mapa">
          <MapIcon size={24} />
          <span className="sidebar-tooltip">Mapa</span>
        </button>
        <button 
          className={`icon-btn sidebar-btn ${visibilityFilter === 'public' ? 'sidebar-active active-filter' : ''}`} 
          onClick={() => setVisibilityFilter(visibilityFilter === 'public' ? 'all' : 'public')}
          style={{ background: visibilityFilter === 'public' ? '#E25E24' : '', color: visibilityFilter === 'public' ? 'white' : '' }}
          title="Ver pines públicos"
        >
          <Globe size={24} />
          <span className="sidebar-tooltip">Pines Públicos</span>
        </button>
        <button 
          className={`icon-btn sidebar-btn ${visibilityFilter === 'private' ? 'sidebar-active active-filter' : ''}`} 
          onClick={() => {
            if (!currentUser) {
              alert("Debes iniciar sesión para ver tus pines privados.");
              return;
            }
            setVisibilityFilter(visibilityFilter === 'private' ? 'all' : 'private');
          }}
          style={{ background: visibilityFilter === 'private' ? '#E25E24' : '', color: visibilityFilter === 'private' ? 'white' : '' }}
          title="Mis pines privados"
        >
          <Lock size={24} />
          <span className="sidebar-tooltip">Mis Pines</span>
        </button>
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
              {modalType === 'frecuentes' ? 'BÚSQUEDA FRECUENTE' : modalType?.toUpperCase() || 'RESULTADOS'}
            </span>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <span style={{ display: 'flex', width: '20px', height: '20px', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} style={{ display: 'block', width: '20px', height: '20px' }} />
              </span>
            </button>
          </div>
          
          <div className="modal-content">
            {userPins.length > 0 ? (
              userPins.map(pin => (
                <div key={pin.id} className="modal-item" onClick={() => {
                  setSelectedPin(pin);
                  setShowModal(false);
                }}>
                  <div className="modal-item-icon" style={{ color: pin.color || '#60a5fa', background: `${pin.color || '#60a5fa'}20` }}>
                    {renderPinIcon(pin.icon, pin.color || '#60a5fa')}
                  </div>
                  <div className="modal-item-text">
                    <div className="modal-item-title">{pin.name}</div>
                    <div className="modal-item-subtitle">{pin.category ? pin.category.toUpperCase() : 'CUALTOS CAMPUS'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', width: '100%' }}>No hay pines registrados</div>
            )}
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
          minScale={0.8}
          maxScale={3}
          centerOnInit={true}
          centerZoomedOut={true}
          limitToBounds={true}
          disabled={markerMode}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={mapImage} 
                alt="Mapa Universitario" 
                className="map-image"
              />
            {/* Render dynamically fetched user Pins */}
            {userPins.map(pin => (
              <div 
                key={pin.id} 
                className={`map-pin ${selectedPin?.id === pin.id ? 'selected' : ''}`}
                style={{ left: `${pin.x || pin.x_coordinate}%`, top: `${pin.y || pin.y_coordinate}%`, borderColor: pin.color, boxShadow: `0 4px 12px ${pin.color}40` }}
                title={pin.name || 'Pin'}
                onClick={(e) => {
                  e.stopPropagation(); // Avoid triggering map click
                  setSelectedPin(pin);
                  setMarkerMode(false);
                }}
              >
                <div className="pin-tooltip">{pin.name}</div>
                {renderPinIcon(pin.icon, pin.color)}
              </div>
            ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Pin Details Modal (Bottom Sheet) */}
      {selectedPin && (
        <div className="pin-details-sheet">
          <button className="close-sheet-btn" onClick={() => setSelectedPin(null)}>
            <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
               <X size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
            </span>
          </button>
          
          <div className="sheet-header">
            <h3>{selectedPin.name}</h3>
            <span className="sheet-subtitle">Centro Universitario de los Altos</span>
          </div>

          <div className="sheet-stats">
            <div className="stat-box">
              <span className="stat-label">DISTANCIA</span>
              <span className="stat-value">350 m</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">TIEMPO</span>
              <span className="stat-value">5 min</span>
            </div>
          </div>

          <div className="sheet-actions-secondary">
            {/* If the user owns the pin */}
            {currentUser && selectedPin.user_id === currentUser.id ? (
              <>
                {!selectedPin.is_public && (
                  <button className="btn-secondary btn-public" onClick={() => setShowMakePublicModal(true)}>
                    <Globe size={14} /> Hacer Público
                  </button>
                )}
                <button className="btn-secondary btn-danger" onClick={async () => {
                  if(window.confirm('¿Seguro que quieres borrar este pin?')) {
                    await supabase.from('pins').delete().eq('id', selectedPin.id);
                    setUserPins(userPins.filter(p => p.id !== selectedPin.id));
                    setSelectedPin(null);
                  }
                }}>
                  <Trash2 size={14} /> Borrar Pin
                </button>
              </>
            ) : (
              /* If it's a public pin not owned by the user */
              <button className="btn-secondary btn-danger" onClick={() => setShowReportModal(true)}>
                <AlertTriangle size={14} /> Reportar Pin
              </button>
            )}
          </div>

          <button className="btn-primary-large">
            <Route size={16} /> Iniciar Recorrido
          </button>
        </div>
      )}
      {/* MAKE PUBLIC MODAL */}
      {showMakePublicModal && (
        <div className="action-modal-overlay">
          <div className="action-modal">
            <button className="btn-close" onClick={() => setShowMakePublicModal(false)}>
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
              <label>DÍAS DISPONIBLE</label>
              <div className="days-selector">
                {['L', 'M', 'Mi', 'J', 'V', 'S', 'D'].map(day => (
                  <button 
                    key={day}
                    className={`day-btn ${availableDays.includes(day) ? 'selected' : ''}`}
                    onClick={() => setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="action-form-group">
              <label>CATEGORÍA</label>
              <select className="auth-input" value={pinCategory} onChange={(e) => setPinCategory(e.target.value)}>
                {filters.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            <button className="btn-primary-large" onClick={async () => {
              if (!ownerName) {
                alert('Por favor, indica a quién le pertenece este pin.');
                return;
              }
              
              if (!currentUser) return;
              
              try {
                const requestData = {
                  pin_id: selectedPin.id,
                  requester_id: currentUser.id,
                  requester_name: ownerName,
                  request_reason: 'Solicitud para hacer el pin público.',
                  has_schedule: hasSchedule,
                  open_time: openTime || null,
                  close_time: closeTime || null,
                  available_days: availableDays,
                  status: 'pending'
                };
                
                const { error } = await supabase.from('pin_requests').insert([requestData]);
                
                if (error) throw error;
                
                alert('Solicitud enviada a revisión exitosamente.');
                setShowMakePublicModal(false);
                setOwnerName('');
                setHasSchedule(false);
              } catch (e) {
                console.error("Error pidiendo pin público: ", e);
                alert("Hubo un error al enviar la solicitud.");
              }
            }}>
              <Globe size={16} /> Enviar Solicitud
            </button>
          </div>
        </div>
      )}

      {/* REPORT PIN MODAL */}
      {showReportModal && (
        <div className="action-modal-overlay">
          <div className="action-modal">
            <button className="btn-close" onClick={() => setShowReportModal(false)}>
              <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
              </span>
            </button>
            <div className="action-modal-header">
              <AlertTriangle size={20} color="#cf1010" />
              <h3 style={{ color: '#003056' }}>Reportar Pin</h3>
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
            <button className="btn-primary-large" style={{ background: '#cf1010' }} onClick={() => {
              if(!reportReason) {
                alert('Por favor, escribe una razón para el reporte.');
                return;
              }
              alert('Reporte enviado al administrador. ¡Gracias por tu ayuda!');
              setShowReportModal(false);
              setReportReason('');
            }}>
              <AlertTriangle size={16} /> Enviar Reporte
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
