import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  Menu, X, MapPin, Users, AlertTriangle, 
  Check, Edit2, Trash2, Search, ArrowLeft, BookOpen, Coffee, Car, Microscope
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import mapImage from '../assets/mapa_universidad.jpeg';
import '../styles/admin-dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'public_pins'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Data states
  const [requests, setRequests] = useState([]);
  const [publicPins, setPublicPins] = useState([]);
  
  // Edit State
  const [editingPin, setEditingPin] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  
  // Checking Auth
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    
    // Check if user is in admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
      
    if (error || !data) {
      alert('Acceso Denegado. No tienes permisos de administrador.');
      navigate('/dashboard');
      return;
    }
    
    setCurrentUser(session.user);
    loadData();
  };

  const loadData = async () => {
    // Load Pending Requests
    const { data: reqData, error: reqError } = await supabase
      .from('pin_requests')
      .select('*, pins(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (!reqError && reqData) setRequests(reqData);

    // Load Public Pins
    const { data: pinsData, error: pinsError } = await supabase
      .from('pins')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
      
    if (!pinsError && pinsData) setPublicPins(pinsData);
  };

  const handleApprove = async (request) => {
    try {
      // 1. Make the pin public
      const { error: pinError } = await supabase.from('pins').update({ is_public: true }).eq('id', request.pin_id);
      if (pinError) throw pinError;
      
      // 2. Mark request as approved
      const { error: reqError } = await supabase.from('pin_requests').update({ status: 'approved' }).eq('id', request.id);
      if (reqError) throw reqError;

      alert('¡Pin aprobado exitosamente! Ahora es público.');
      // Reload
      loadData();
    } catch (e) {
      console.error("Detalles del error al aprobar:", e);
      alert('Error aprobando. Revisa la base de datos o consola.');
    }
  };

  const handleReject = async (request) => {
    try {
      const { error } = await supabase.from('pin_requests').update({ status: 'rejected' }).eq('id', request.id);
      if (error) throw error;
      
      alert('Solicitud rechazada. El pin se mantendrá privado.');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error rechazando.');
    }
  };

  const handleDeletePin = async (pinId) => {
    try {
      if (!window.confirm("¿Seguro que quieres eliminar este pin público?")) return;
      
      const { error } = await supabase.from('pins').delete().eq('id', pinId);
      if (error) throw error;
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error borrando pin.');
    }
  };

  const handleUpdatePin = async () => {
    try {
      if (!editingPin.name) {
        alert("El pin debe tener al menos un nombre.");
        return;
      }
      
      const { error } = await supabase
        .from('pins')
        .update({ 
          name: editingPin.name,
          category: editingPin.category
        })
        .eq('id', editingPin.id);
        
      if (error) throw error;
      
      alert('Pin actualizado correctamente.');
      setEditingPin(null);
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el pin.');
    }
  };

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
    <div className="admin-layout">
      {/* Top Navbar */}
      <div className="admin-navbar">
        <div className="admin-nav-left">
          <button className="admin-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <span style={{ display: 'flex', width: '20px', height: '20px', alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={20} style={{ display: 'block', width: '20px', height: '20px' }} />
            </span>
          </button>
          <div className="admin-brand" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <MapPin size={24} color="#E25E24" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="brand-title">NavegAltos</span>
              <span className="brand-subtitle">PANEL DE CONTROL</span>
            </div>
          </div>
        </div>
        <button className="admin-back-btn" onClick={() => navigate('/dashboard')}>
           <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
             <ArrowLeft size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
           </span> 
           Volver
        </button>
      </div>

      <div className="admin-content-wrapper">
        {/* Left Sidebar */}
        <div 
          className="admin-sidebar" 
          style={{ 
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', 
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 50
          }}
        >
          
          <div className="admin-sidebar-menu">
            <button 
              className={`admin-nav-item ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <AlertTriangle size={18} />
              <span>Solicitudes</span>
              {requests.length > 0 && <span className="admin-badge">{requests.length}</span>}
            </button>
            <button 
              className={`admin-nav-item ${activeTab === 'public_pins' ? 'active' : ''}`}
              onClick={() => setActiveTab('public_pins')}
            >
              <MapPin size={18} />
              <span>Pines Públicos</span>
            </button>
            {/* Ocultamos Usuarios como pediste */}
          </div>

          <div className="admin-sidebar-section">
            <h4 className="section-title">
              {activeTab === 'requests' ? 'SOLICITUDES Y REPORTES' : 'GESTIÓN DE PINES'}
            </h4>
            
            <div className="admin-search">
              <Search size={16} color="#9ca3af" />
              <input type="text" placeholder="Buscar..." />
            </div>

            <div className="admin-list-container">
              {activeTab === 'requests' && (
                requests.length === 0 ? (
                  <p className="admin-empty">No hay solicitudes pendientes</p>
                ) : (
                  requests.map(req => (
                    <div key={req.id} className="admin-card">
                      <div className="admin-card-header">
                        <div className="admin-card-icon req-icon">
                          <AlertTriangle size={14} color="#ef4444" />
                        </div>
                        <div className="admin-card-title-group">
                          <h5>{req.title || 'Nueva Solicitud'}</h5>
                          <span className="admin-date">{new Date(req.created_at).toISOString().split('T')[0]}</span>
                        </div>
                      </div>
                      <p className="admin-card-desc">
                        {req.description || 'Sin descripción.'}<br/>
                        <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                          Por: {req.requester_name || req.requester_id}
                        </span>
                      </p>
                      <div className="admin-card-actions">
                        <button className="btn-reject" onClick={() => handleReject(req)}>Rechazar</button>
                        <button className="btn-approve" onClick={() => handleApprove(req)}>Aprobar</button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'public_pins' && (
                publicPins.length === 0 ? (
                  <p className="admin-empty">No hay pines públicos creados aún.</p>
                ) : (
                  publicPins.map(pin => (
                    <div key={pin.id} className="admin-item-row">
                      <div className="admin-item-info">
                        <h5>{pin.name}</h5>
                        <span>{pin.category || 'Sin categoría'}</span>
                      </div>
                      <div className="admin-item-actions">
                        <button className="icon-action" title="Editar" onClick={() => setEditingPin(pin)}>
                          <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
                            <Edit2 size={16} color="#4b5563" style={{ display: 'block', width: '16px', height: '16px' }} />
                          </span>
                        </button>
                        <button className="icon-action" title="Eliminar" onClick={() => handleDeletePin(pin.id)}>
                          <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={16} color="#ef4444" style={{ display: 'block', width: '16px', height: '16px' }} />
                          </span>
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area (Interactive Map) */}
        <div className="admin-map-area">
          <TransformWrapper
            initialScale={0.8}
            minScale={0.8}
            maxScale={3}
            centerOnInit={true}
            centerZoomedOut={true}
            limitToBounds={true}
          >
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={mapImage} 
                  alt="Mapa Universitario" 
                  className="map-image"
                />
                {publicPins.map(pin => (
                  <div 
                    key={pin.id} 
                    className={`map-pin ${selectedPin?.id === pin.id ? 'selected' : ''}`}
                    style={{ left: `${pin.x || pin.x_coordinate}%`, top: `${pin.y || pin.y_coordinate}%`, borderColor: pin.color || '#333', boxShadow: `0 4px 12px ${pin.color || '#333'}40` }}
                    title={pin.name || 'Pin'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPin(pin);
                    }}
                  >
                    <div className="pin-tooltip">{pin.name}</div>
                    {renderPinIcon(pin.icon, pin.color || '#333')}
                  </div>
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>

      {/* Pin Details Card (Admin Mode) */}
      {selectedPin && !editingPin && (
        <div style={{
          position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          width: '360px', background: 'white', borderRadius: '20px', padding: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 100
        }}>
          <button 
            style={{ position: 'absolute', top: '16px', right: '16px', background: '#f3f4f6', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => setSelectedPin(null)}
          >
            <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#6b7280" style={{ display: 'block', width: '16px', height: '16px' }} />
            </span>
          </button>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#003056' }}>{selectedPin.name}</h3>
            <span style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
              {selectedPin.category ? selectedPin.category.toUpperCase() : 'SIN CATEGORÍA'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: '#f3f4f6', color: '#4b5563', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              onClick={() => { setEditingPin(selectedPin); setSelectedPin(null); }}
            >
              <Edit2 size={16} /> Editar
            </button>
            <button 
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: '#fef2f2', color: '#cf1010', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              onClick={() => { handleDeletePin(selectedPin.id); setSelectedPin(null); }}
            >
              <Trash2 size={16} /> Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Edit Pin Modal */}
      {editingPin && (
        <div className="action-modal-overlay">
          <div className="action-modal" style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '360px', position: 'relative' }}>
            <button className="btn-close" onClick={() => setEditingPin(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <span style={{ display: 'flex', width: '20px', height: '20px', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color="#6b7280" style={{ display: 'block', width: '20px', height: '20px' }} />
              </span>
            </button>
            
            <div className="action-modal-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Edit2 size={24} color="#003056" />
              <h3 style={{ margin: 0, color: '#003056', fontSize: '18px' }}>Editar Pin</h3>
            </div>
            
            <div className="action-form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>NOMBRE</label>
              <input 
                type="text" 
                value={editingPin.name || ''} 
                onChange={(e) => setEditingPin({...editingPin, name: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }}
              />
            </div>

            <div className="action-form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>CATEGORÍA</label>
              <select 
                value={editingPin.category || ''} 
                onChange={(e) => setEditingPin({...editingPin, category: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }}
              >
                <option value="aulas">Aulas</option>
                <option value="canchas">Canchas</option>
                <option value="cafeteria">Cafetería</option>
                <option value="banos">Baños</option>
                <option value="laboratorios">Laboratorios</option>
              </select>
            </div>

            <button 
              onClick={handleUpdatePin}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#003056', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <Check size={18} /> Guardar Cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
