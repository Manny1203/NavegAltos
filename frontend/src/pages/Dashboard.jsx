import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  Menu, Search, Plus, Map as MapIcon, Globe, Lock, X, 
  MapPin, BookOpen, Coffee, Car, Microscope, Clock, Route,
  AlertTriangle, Trash2, LogOut, Shield
} from 'lucide-react';
import mapImage from '../assets/mapa_universidad.jpeg';
import rectoriaPB from '../assets/rectoria_pb.jpeg';
import rectoriaN1 from '../assets/rectoria_n1.jpeg';
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

  // Building State
  const [currentBuilding, setCurrentBuilding] = useState(null); // null means 'main' map
  const [selectedFloor, setSelectedFloor] = useState('PB'); // 'PB' or 'N1'

  // Menu sidebar state
  const [showMenuSidebar, setShowMenuSidebar] = useState(false);

  // Modals state
  const [showMakePublicModal, setShowMakePublicModal] = useState(false);
  const [publicPinData, setPublicPinData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Make Public Form State
  const [hasSchedule, setHasSchedule] = useState(false);
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [pinDescription, setPinDescription] = useState('');
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

  const displayedPins = userPins.filter(pin => {
      const pinMap = pin.map_id || 'main';
      if (currentBuilding) {
          return pinMap === currentBuilding && pin.floor === selectedFloor;
      }
      return pinMap === 'main';
  });

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
          <div className="marker-mode-banner floating-ui" style={{ top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 999 }}>
            <MapPin size={24} className="marker-mode-icon" />
            <span className="marker-mode-title">Modo Marcador</span>
            <span className="marker-mode-subtitle">Toca el mapa para ubicar tu nuevo punto</span>
          </div>
        )}
      {/* Pin Creator Modal */}
      {showPinModal && (
        <div className="pin-creator-modal floating-ui" style={{ zIndex: 1000 }}>
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
                  is_public: false, // New pins are private by default
                  map_id: currentBuilding || 'main',
                  floor: currentBuilding ? selectedFloor : null
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
              
              {/* Botón estático para Rectoría */}
              {!currentBuilding && (
                <button 
                  style={{
                    position: 'absolute',
                    left: '52.5%',
                    top: '66.5%',
                    width: '44px',
                    height: '44px',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    backgroundColor: '#003056',
                    color: 'white',
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBuilding('rectoria');
                    setMarkerMode(false);
                    setSelectedPin(null);
                  }}
                  title="Abrir Mapa de Rectoría"
                >
                  <MapPin size={20} />
                </button>
              )}

            {/* Render dynamically fetched user Pins based on current building */}
            {displayedPins.map(pin => (
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

      {/* RECTORIA MODAL / OVERLAY */}
      {currentBuilding === 'rectoria' && (
        <div style={{
          position: 'fixed', top: '5%', left: '5%', width: '90%', height: '90%',
          backgroundColor: '#f1f5f9', borderRadius: '24px', zIndex: 90,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #e2e8f0'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, color: '#003056', fontSize: '24px', fontWeight: 'bold' }}>Edificio de Rectoría</h2>
              <span style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px', display: 'block' }}>
                Plano de Planta - {selectedFloor === 'PB' ? 'P. Baja' : '1er Nivel'}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               {/* Floor Toggle */}
               <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                 <button 
                  style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: selectedFloor === 'PB' ? '#E25E24' : 'transparent', color: selectedFloor === 'PB' ? '#fff' : '#6b7280', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedFloor('PB')}
                 >PB</button>
                 <button 
                  style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: selectedFloor === 'N1' ? '#E25E24' : 'transparent', color: selectedFloor === 'N1' ? '#fff' : '#6b7280', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedFloor('N1')}
                 >N1</button>
               </div>
               
               <button 
                 style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', background: markerMode ? '#E25E24' : '#f8fafc', color: markerMode ? 'white' : '#003056', border: '1px solid #e2e8f0', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                 onClick={() => setMarkerMode(!markerMode)}
               >
                 {markerMode ? <X size={16} /> : <Plus size={16} />}
                 {markerMode ? 'Cancelar' : 'Agregar Pin'}
               </button>
               
               <button 
                 style={{ background: '#f3f4f6', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                 onClick={() => { setCurrentBuilding(null); setMarkerMode(false); }}
               >
                 <X size={20} color="#6b7280" />
               </button>
            </div>
          </div>
          
          {/* Internal Map Area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: markerMode ? 'crosshair' : 'default' }}
            onClick={(e) => {
              if (markerMode && !showPinModal) {
                const img = document.querySelector('.rectoria-map-image');
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
              minScale={0.5}
              maxScale={3}
              centerOnInit={true}
              centerZoomedOut={true}
              limitToBounds={false}
              disabled={markerMode}
            >
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'inline-block' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={selectedFloor === 'PB' ? rectoriaPB : rectoriaN1}
                      alt="Rectoria" 
                      className="rectoria-map-image"
                      style={{ maxWidth: '800px', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
                    />
                    {displayedPins.map(pin => (
                      <div 
                        key={pin.id} 
                        className={`map-pin ${selectedPin?.id === pin.id ? 'selected' : ''}`}
                        style={{ 
                          left: `${pin.x || pin.x_coordinate}%`, 
                          top: `${pin.y || pin.y_coordinate}%`, 
                          borderColor: pin.color || '#333', 
                          boxShadow: `0 4px 12px ${(pin.color || '#333')}40` 
                        }}
                        title={pin.name || 'Pin'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPin(pin);
                          setMarkerMode(false);
                        }}
                      >
                        <div className="pin-tooltip">{pin.name}</div>
                        {renderPinIcon(pin.icon, pin.color || '#333')}
                      </div>
                    ))}
                  </div>
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>
        </div>
      )}

      {/* Pin Details Modal (Bottom Sheet) */}
      {selectedPin && (
        <div className="pin-details-sheet" style={{ zIndex: 1000 }}>
          <button className="close-sheet-btn" onClick={() => setSelectedPin(null)}>
            <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
            </span>
          </button>
          
          <div className="sheet-header">
            <h3>{selectedPin.name}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <span className="sheet-subtitle" style={{ margin: 0 }}>
                {selectedPin.category ? selectedPin.category.toUpperCase() : 'SIN CATEGORÍA'}
              </span>
              {selectedPin.owner && (
                <span style={{ fontSize: '13px', color: '#003056', fontWeight: '600' }}>
                  De: {selectedPin.owner}
                </span>
              )}
            </div>
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

          {selectedPin.has_schedule && (
            <div style={{ display: 'flex', gap: '12px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#9ca3af', marginBottom: '4px' }}>
                  <Clock size={12} /> HORARIO
                </span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  {selectedPin.open_time ? selectedPin.open_time.slice(0, 5) : '--:--'} - {selectedPin.close_time ? selectedPin.close_time.slice(0, 5) : '--:--'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#9ca3af', marginBottom: '4px' }}>DÍAS</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  {Array.isArray(selectedPin.available_days) 
                    ? selectedPin.available_days.join(', ') 
                    : (typeof selectedPin.available_days === 'string' ? JSON.parse(selectedPin.available_days).join(', ') : 'L, M, Mi, J, V')}
                </span>
              </div>
            </div>
          )}

          <div className="sheet-actions-secondary">
            {/* Private pin owned by the user: show Hacer Público + Borrar */}
            {currentUser && selectedPin.user_id === currentUser.id && !selectedPin.is_public ? (
              <>
                <button className="btn-secondary btn-public" onClick={() => { setPublicPinData(selectedPin); setShowMakePublicModal(true); }}>
                  <Globe size={14} /> Hacer Público
                </button>
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
              /* Public pin (even if owner sent it to review) or other user's pin: show Reportar */
              <button className="btn-report" onClick={() => setShowReportModal(true)}>
                <span style={{ display: 'flex', width: '14px', height: '14px', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={14} style={{ display: 'block', width: '14px', height: '14px' }} />
                </span>
                Reportar Pin
              </button>
            )}
          </div>

          <button className="btn-primary-large">
            <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
              <Route size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
            </span>
            Iniciar Recorrido
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
              
              if (!currentUser || !publicPinData) {
                alert('Error de sesión o pin no seleccionado.');
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
                
                alert('Solicitud enviada a revisión exitosamente.');
                setShowMakePublicModal(false);
                setOwnerName('');
                setPinDescription('');
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
            <button className="btn-primary-large" style={{ background: '#cf1010' }} onClick={async () => {
              if(!reportReason.trim()) {
                alert('Por favor, escribe una razón para el reporte.');
                return;
              }
              try {
                const { error } = await supabase.from('pin_reports').insert([{
                  pin_id: selectedPin.id,
                  reporter_id: currentUser?.id || null,
                  reason: reportReason.trim(),
                  status: 'pending'
                }]);
                if (error) throw error;
                alert('Reporte enviado al administrador. ¡Gracias por tu ayuda!');
                setShowReportModal(false);
                setReportReason('');
              } catch (e) {
                console.error('Error enviando reporte:', e);
                alert('Hubo un error al enviar el reporte. Inténtalo de nuevo.');
              }
            }}>
              <AlertTriangle size={16} /> Enviar Reporte
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
