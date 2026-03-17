import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, MapPin, Users, AlertTriangle, 
  Check, Edit2, Trash2, Search, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import mapImage from '../assets/mapa_universidad.jpeg';
import '../styles/admin-dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'public_pins'
  
  // Data states
  const [requests, setRequests] = useState([]);
  const [publicPins, setPublicPins] = useState([]);
  
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
      const { error } = await supabase.from('pins').delete().eq('id', pinId);
      if (error) throw error;
      loadData();
    } catch (e) {
      console.error(e);
      alert('Error borrando pin.');
    }
  };

  return (
    <div className="admin-layout">
      {/* Top Navbar */}
      <div className="admin-navbar">
        <div className="admin-nav-left">
          <button className="admin-menu-btn">
            <Menu size={20} />
          </button>
          <div className="admin-brand">
            <span className="brand-title">NavegAltos</span>
            <span className="brand-subtitle">PANEL DE CONTROL</span>
          </div>
        </div>
        <button className="admin-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      <div className="admin-content-wrapper">
        {/* Left Sidebar */}
        <div className="admin-sidebar">
          
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
                        <button className="icon-action" title="Editar"><Edit2 size={14} /></button>
                        <button className="icon-action" title="Eliminar" onClick={() => handleDeletePin(pin.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area (Blurred Map) */}
        <div className="admin-map-area">
          <div className="admin-map-overlay"></div>
          <img src={mapImage} alt="Mapa Fondo" className="admin-bg-map" />
        </div>
      </div>
    </div>
  );
}
