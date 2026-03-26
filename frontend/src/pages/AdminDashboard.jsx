import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  Menu, X, MapPin, Users, AlertTriangle, Flag,
  Check, CheckCircle2, Edit2, Trash2, Search, ArrowLeft, BookOpen, Coffee, Car, Microscope
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import mapImage from '../assets/mapa_universidad.jpeg';
import rectoriaPB from '../assets/rectoria_pb.jpeg';
import rectoriaN1 from '../assets/rectoria_n1.jpeg';
import '../styles/admin-dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'public_pins'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Data states
  const [requests, setRequests] = useState([]);
  const [publicPins, setPublicPins] = useState([]);
  const [reports, setReports] = useState([]);
  
  // Edit State
  const [editingPin, setEditingPin] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);

  // Building State
  const [currentBuilding, setCurrentBuilding] = useState(null); // null means 'main' map
  const [selectedFloor, setSelectedFloor] = useState('PB'); // 'PB' or 'N1'
  
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

    // Load Pin Reports
    const { data: reportsData, error: reportsError } = await supabase
      .from('pin_reports')
      .select('*, pins(name, category)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (!reportsError && reportsData) setReports(reportsData);
  };

  const handleApprove = async (request) => {
    try {
      // 1. Make the pin public
      const { error: pinError } = await supabase.from('pins').update({ 
        is_public: true,
        owner: request.requester_name || null,
        description: request.description || null,
        has_schedule: request.has_schedule || false,
        open_time: request.open_time || null,
        close_time: request.close_time || null,
        available_days: request.available_days || null
      }).eq('id', request.pin_id);
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

  const displayedPins = publicPins.filter(pin => {
      const pinMap = pin.map_id || 'main';
      if (currentBuilding) {
          return pinMap === currentBuilding && pin.floor === selectedFloor;
      }
      return pinMap === 'main';
  });

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

  const handleResolveReport = async (report) => {
    try {
      const { data, error } = await supabase
        .from('pin_reports')
        .update({ status: 'resolved' })
        .eq('id', report.id)
        .select();
      if (error) {
        console.error('Error RLS/DB al resolver:', JSON.stringify(error));
        alert('Error al resolver: ' + (error.message || JSON.stringify(error)));
        return;
      }
      console.log('Reporte resuelto:', data);
      alert('Reporte marcado como resuelto.');
      loadData();
    } catch (e) {
      console.error('Error inesperado al resolver reporte:', e);
      alert('Error inesperado: ' + e.message);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      const { data, error } = await supabase
        .from('pin_reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId)
        .select();
      if (error) {
        console.error('Error RLS/DB al descartar:', JSON.stringify(error));
        alert('Error al descartar: ' + (error.message || JSON.stringify(error)));
        return;
      }
      console.log('Reporte descartado:', data);
      loadData();
    } catch (e) {
      console.error('Error inesperado al descartar reporte:', e);
      alert('Error inesperado: ' + e.message);
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
            <button 
              className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Flag size={18} />
              <span>Reportes</span>
              {reports.length > 0 && <span className="admin-badge">{reports.length}</span>}
            </button>
            {/* Ocultamos Usuarios como pediste */}
          </div>

          <div className="admin-sidebar-section">
            <h4 className="section-title">
              {activeTab === 'requests' ? 'SOLICITUDES Y REPORTES' : activeTab === 'public_pins' ? 'GESTIÓN DE PINES' : 'REPORTES DE USUARIOS'}
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
                      <div className="admin-card-header" style={{ alignItems: 'flex-start' }}>
                        <div className="admin-card-icon req-icon" style={{ marginTop: '4px' }}>
                          <AlertTriangle size={14} color="#ef4444" />
                        </div>
                        <div className="admin-card-title-group" style={{ flex: 1 }}>
                          <h5 style={{ fontSize: '15px' }}>{req.pins?.name || 'Solicitud de Pin'}</h5>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                              {req.pins?.category?.toUpperCase() || 'SIN CATEGORÍA'}
                            </span>
                            <span className="admin-date" style={{ fontSize: '11px' }}>{new Date(req.created_at).toLocaleDateString('es-MX')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="admin-card-desc" style={{ padding: '0', marginTop: '12px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', fontStyle: req.description ? 'normal' : 'italic' }}>
                          {req.description || 'Sin descripción provista.'}
                        </p>
                        
                        <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                           <span style={{ display: 'flex', width: '14px', height: '14px', alignItems: 'center', justifyContent: 'center' }}>
                             <Users size={14} color="#6b7280" style={{ display: 'block', width: '14px', height: '14px' }} />
                           </span>
                           <span style={{ fontSize: '12px', color: '#334155', fontWeight: 'bold' }}>{req.requester_name || 'Desconocido'}</span>
                          </div>
                          
                          {req.has_schedule ? (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                              <div>
                                <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', display: 'block' }}>HORARIO</span>
                                <span style={{ fontSize: '12px', color: '#334155' }}>{req.open_time?.slice(0,5)} - {req.close_time?.slice(0,5)}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', display: 'block' }}>DÍAS</span>
                                <span style={{ fontSize: '12px', color: '#334155' }}>
                                  {Array.isArray(req.available_days) 
                                    ? req.available_days.join(', ') 
                                    : (typeof req.available_days === 'string' ? JSON.parse(req.available_days).join(', ') : 'No espec.')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Sin horario de disponibilidad</span>
                          )}
                        </div>
                      </div>
                      <div className="admin-card-actions">
                        <button className="btn-reject" onClick={() => handleReject(req)}>Rechazar</button>
                        <button className="btn-approve" onClick={() => handleApprove(req)}>Aprobar</button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'reports' && (
                reports.length === 0 ? (
                  <p className="admin-empty">No hay reportes pendientes.</p>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="admin-card">
                      <div className="admin-card-header">
                        <div className="admin-card-icon req-icon">
                          <Flag size={14} color="#ef4444" />
                        </div>
                        <div className="admin-card-title-group">
                          <h5>{report.pins?.name || 'Pin desconocido'}</h5>
                          <span className="admin-date">{new Date(report.created_at).toLocaleDateString('es-MX')}</span>
                        </div>
                      </div>
                      <p className="admin-card-desc">
                        <strong>Categoría:</strong> {report.pins?.category || '—'}<br/>
                        <strong>Razón:</strong> {report.reason}
                      </p>
                      <div className="admin-card-actions">
                        <button className="btn-reject" onClick={() => handleDismissReport(report.id)}>Descartar</button>
                        <button className="btn-approve" onClick={() => handleResolveReport(report)}>Resuelto</button>
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
                      setSelectedPin(null);
                    }}
                    title="Abrir Mapa de Rectoría"
                  >
                    <BookOpen size={20} />
                  </button>
                )}

                {displayedPins.map(pin => (
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
          
          {/* RECTORIA MODAL / OVERLAY FOR ADMINS */}
          {currentBuilding === 'rectoria' && (
            <div style={{
              position: 'absolute', top: '2%', left: '2%', width: '96%', height: '96%',
              backgroundColor: '#f1f5f9', borderRadius: '16px', zIndex: 90,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', border: '1px solid #e2e8f0'
            }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#003056', fontSize: '20px', fontWeight: 'bold' }}>Edificio de Rectoría</h2>
                  <span style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px', display: 'block' }}>
                    Gestión de Pines - {selectedFloor === 'PB' ? 'P. Baja' : '1er Nivel'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   {/* Floor Toggle */}
                   <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                     <button 
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: selectedFloor === 'PB' ? '#E25E24' : 'transparent', color: selectedFloor === 'PB' ? '#fff' : '#6b7280', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
                      onClick={() => setSelectedFloor('PB')}
                     >PB</button>
                     <button 
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: selectedFloor === 'N1' ? '#E25E24' : 'transparent', color: selectedFloor === 'N1' ? '#fff' : '#6b7280', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
                      onClick={() => setSelectedFloor('N1')}
                     >N1</button>
                   </div>
                   
                   <button 
                     style={{ background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                     onClick={() => { setCurrentBuilding(null); }}
                   >
                     <X size={18} color="#6b7280" />
                   </button>
                </div>
              </div>
              
              {/* Internal Map Area */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <TransformWrapper
                  initialScale={0.8}
                  minScale={0.5}
                  maxScale={3}
                  centerOnInit={true}
                  centerZoomedOut={true}
                  limitToBounds={false}
                >
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'inline-block' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={selectedFloor === 'PB' ? rectoriaPB : rectoriaN1}
                          alt="Rectoria" 
                          className="rectoria-map-image"
                          style={{ maxWidth: '700px', maxHeight: '60vh', objectFit: 'contain', display: 'block' }}
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
        </div>
      </div>

      {/* Pin Details Card (Admin Mode) */}
      {selectedPin && !editingPin && (
        <div style={{
          position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          width: '360px', background: 'white', borderRadius: '20px', padding: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 1000
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
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', background: '#ffffff', color: '#000000', boxSizing: 'border-box' }}
              />
            </div>

            <div className="action-form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>CATEGORÍA</label>
              <select 
                value={editingPin.category || ''} 
                onChange={(e) => setEditingPin({...editingPin, category: e.target.value})}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none', background: '#ffffff', color: '#000000', boxSizing: 'border-box' }}
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
