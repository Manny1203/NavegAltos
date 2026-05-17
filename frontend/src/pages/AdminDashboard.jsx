import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  Menu, X, MapPin, Users, AlertTriangle, Flag, Globe, FileText,
  Check, CheckCircle2, Edit2, Trash2, Search, ArrowLeft, BookOpen, Coffee, Car, Microscope, Clock, Move, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import mapImage from '../assets/mapaUniversidadVector.svg';
import rectoriaPB from '../assets/rectoria_pb.jpeg';
import rectoriaN1 from '../assets/rectoria_n1.jpeg';
import '../styles/admin-dashboard.css';

// Location Icons
import avionIcon from '../assets/iconosLocalizacion/Avión.svg';
import camaronIcon from '../assets/iconosLocalizacion/Camarón.svg';
import chincheIcon from '../assets/iconosLocalizacion/Chinche.svg';
import huevoIcon from '../assets/iconosLocalizacion/Huevo.svg';
import joeIcon from '../assets/iconosLocalizacion/Joe.svg';
import leoIcon from '../assets/iconosLocalizacion/Leo.svg';
import pin2Icon from '../assets/iconosLocalizacion/Pin 2.svg';
import pinIcon from '../assets/iconosLocalizacion/Pin.svg';
import pollitoIcon from '../assets/iconosLocalizacion/Pollito.svg';
import ranaIcon from '../assets/iconosLocalizacion/Rana.svg';
import vacaIcon from '../assets/iconosLocalizacion/Vaca.svg';

const locationIcons = [
  { id: 'default', name: 'Predeterminado', src: null },
  { id: 'avion', name: 'Avión', src: avionIcon },
  { id: 'camaron', name: 'Camarón', src: camaronIcon },
  { id: 'chinche', name: 'Chinche', src: chincheIcon },
  { id: 'huevo', name: 'Huevo', src: huevoIcon },
  { id: 'joe', name: 'Joe', src: joeIcon },
  { id: 'leo', name: 'Leo', src: leoIcon },
  { id: 'pin2', name: 'Pin 2', src: pin2Icon },
  { id: 'pin', name: 'Pin', src: pinIcon },
  { id: 'pollito', name: 'Pollito', src: pollitoIcon },
  { id: 'rana', name: 'Rana', src: ranaIcon },
  { id: 'vaca', name: 'Vaca', src: vacaIcon }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'public_pins'
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  // Data states
  const [requests, setRequests] = useState([]);
  const [publicPins, setPublicPins] = useState([]);
  const [reports, setReports] = useState([]);
  const [historyTickets, setHistoryTickets] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);
  const [movingPin, setMovingPin] = useState(null);

  // Edit State
  const [editingPin, setEditingPin] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);

  // Building State
  const [currentBuilding, setCurrentBuilding] = useState(null); // null means 'main' map
  const [selectedFloor, setSelectedFloor] = useState('PB'); // 'PB' or 'N1'

  // Icon Customizer State
  const [showIconCustomizer, setShowIconCustomizer] = useState(false);
  const [userLocationIcon, setUserLocationIcon] = useState(() => {
    return localStorage.getItem('user-location-icon') || 'default';
  });

  useEffect(() => {
    localStorage.setItem('user-location-icon', userLocationIcon);
  }, [userLocationIcon]);

  // Checking Auth
  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUser(session.user);
      loadData();
    }
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
      .select('*, pins(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!reportsError && reportsData) setReports(reportsData);

    // Load History Tickets
    const { data: histReqData } = await supabase
      .from('pin_requests')
      .select('*, pins(*)')
      .neq('status', 'pending');

    const { data: histRepData } = await supabase
      .from('pin_reports')
      .select('*, pins(*)')
      .neq('status', 'pending');

    let combinedHistory = [];
    if (histReqData) {
      combinedHistory = [...combinedHistory, ...histReqData.map(item => ({ ...item, ticket_type: 'request' }))];
    }
    if (histRepData) {
      combinedHistory = [...combinedHistory, ...histRepData.map(item => ({ ...item, ticket_type: 'report' }))];
    }
    combinedHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setHistoryTickets(combinedHistory);
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

      toast.success('Pin aprobado. Ya es visible al publico.');
      loadData();
    } catch (e) {
      console.error("Detalles del error al aprobar:", e);
      toast.error('Error aprobando. Revisa la base de datos o consola.');
    }
  };

  const handleReject = async (request) => {
    try {
      const { error } = await supabase.from('pin_requests').update({ status: 'rejected' }).eq('id', request.id);
      if (error) throw error;

      toast.success('Solicitud rechazada. El pin sigue siendo privado.');
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error al rechazar.');
    }
  };

  const displayedPins = publicPins.filter(pin => {
    let pinMap = pin.map_id || 'main';
    let isCorrectMap = false;
    if (currentBuilding) {
      isCorrectMap = (pinMap === currentBuilding && pin.floor === selectedFloor);
    } else {
      isCorrectMap = (pinMap === 'main');
    }
    if (!isCorrectMap) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return pin.name?.toLowerCase().includes(q) || pin.category?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return req.pins?.name?.toLowerCase().includes(q) || req.pins?.category?.toLowerCase().includes(q) || req.requester_name?.toLowerCase().includes(q);
  });

  const filteredReports = reports.filter(rep => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return rep.pins?.name?.toLowerCase().includes(q) || rep.reason?.toLowerCase().includes(q);
  });

  const filteredPublicPins = publicPins.filter(pin => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return pin.name?.toLowerCase().includes(q) || pin.category?.toLowerCase().includes(q);
  });

  const handleDeletePin = async (pinId) => {
    try {
      const { error } = await supabase.from('pins').delete().eq('id', pinId);
      if (error) throw error;
      toast.success('Pin eliminado correctamente.');
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error borrando pin.');
    }
  };

  const handleMapClick = async (e, mapId) => {
    if (!isZenMode || !movingPin) return;
    e.stopPropagation();

    // Find the img element within the clicked container to get its true rendered size
    const img = e.currentTarget.querySelector('img');
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    // Validate collision
    const collisionThreshold = 3;
    let collision = false;
    for (const pin of publicPins) {
      if (pin.id === movingPin.id) continue;
      const pMapId = pin.map_id || 'main';
      const mapToCheck = mapId || 'main';
      if (pMapId !== mapToCheck) continue;
      if (mapToCheck !== 'main' && pin.floor !== selectedFloor) continue;

      const pinX = pin.x || pin.x_coordinate;
      const pinY = pin.y || pin.y_coordinate;

      const dist = Math.hypot(pinX - x, pinY - y);
      if (dist < collisionThreshold) {
        collision = true;
        break;
      }
    }

    if (collision) {
      toast.error('Esta ubicación está muy cerca de otro pin. Selecciona un lugar más despejado.');
      return;
    }

    try {
      const { error } = await supabase
        .from('pins')
        .update({ x_coordinate: x, y_coordinate: y })
        .eq('id', movingPin.id);

      if (error) throw error;
      toast.success('Pin movido exitosamente.');
      setIsZenMode(false);
      setMovingPin(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error moviendo pin: ' + (err.message || JSON.stringify(err)));
    }
  };

  const handleUpdateRequest = async () => {
    try {
      let days = editingRequest.available_days;
      if (Array.isArray(days)) {
        days = JSON.stringify(days);
      }

      const { error } = await supabase
        .from('pin_requests')
        .update({
          requester_name: editingRequest.requester_name,
          description: editingRequest.description,
          has_schedule: editingRequest.has_schedule,
          open_time: editingRequest.open_time,
          close_time: editingRequest.close_time,
          available_days: days
        })
        .eq('id', editingRequest.id);

      if (error) throw error;

      toast.success('Solicitud actualizada correctamente.');
      setEditingRequest(null);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error al actualizar solicitud.');
    }
  };

  const handleUpdatePin = async () => {
    try {
      if (!editingPin.name) {
        toast.error('El pin debe tener al menos un nombre.');
        return;
      }

      let days = editingPin.available_days;
      if (Array.isArray(days)) {
        days = JSON.stringify(days);
      }

      const { error } = await supabase
        .from('pins')
        .update({
          name: editingPin.name,
          category: editingPin.category,
          description: editingPin.description,
          icon: editingPin.icon,
          color: editingPin.color,
          has_schedule: editingPin.has_schedule,
          open_time: editingPin.open_time,
          close_time: editingPin.close_time,
          available_days: days
        })
        .eq('id', editingPin.id);

      if (error) throw error;

      toast.success('Pin actualizado correctamente.');
      setEditingPin(null);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Error al actualizar el pin.');
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
        toast.error('Error al resolver: ' + (error.message || JSON.stringify(error)));
        return;
      }
      console.log('Reporte resuelto:', data);
      toast.success('Reporte marcado como resuelto.');
      loadData();
    } catch (e) {
      console.error('Error inesperado al resolver reporte:', e);
      toast.error('Error inesperado: ' + e.message);
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
        toast.error('Error al descartar: ' + (error.message || JSON.stringify(error)));
        return;
      }
      console.log('Reporte descartado:', data);
      toast.success('Reporte descartado.');
      loadData();
    } catch (e) {
      console.error('Error inesperado al descartar reporte:', e);
      toast.error('Error inesperado: ' + e.message);
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
        {/* Mobile Overlay */}
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', zIndex: 40 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {isZenMode && (
          <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', background: '#003056', color: 'white', padding: '12px 24px', borderRadius: '24px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <span style={{ fontWeight: 'bold' }}>Modo Relocalización: Haz clic en el mapa para mover el pin</span>
            <button onClick={() => { setIsZenMode(false); setMovingPin(null); setIsSidebarOpen(true); }} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancelar
            </button>
          </div>
        )}
        
        {/* Left Sidebar */}
        <div
          className="admin-sidebar"
          style={{
            transform: (isSidebarOpen && !isZenMode) ? 'translateX(0)' : 'translateX(-100%)',
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
            <button
              className={`admin-nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FileText size={18} />
              <span>Historial</span>
            </button>
            <button
              className="admin-nav-item"
              onClick={() => { setShowIconCustomizer(true); if(window.innerWidth <= 768) setIsSidebarOpen(false); }}
            >
              <MapPin size={18} />
              <span>Personalizar Ícono</span>
            </button>
            {/* Ocultamos Usuarios como pediste */}
          </div>

          <div className="admin-sidebar-section">
            <h4 className="section-title">
              {activeTab === 'requests' ? 'SOLICITUDES Y REPORTES' : activeTab === 'public_pins' ? 'GESTIÓN DE PINES' : 'REPORTES DE USUARIOS'}
            </h4>

            <div className="admin-search">
              <Search size={16} color="#9ca3af" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-list-container">
              {activeTab === 'requests' && (
                filteredRequests.length === 0 ? (
                  <p className="admin-empty">No hay solicitudes pendientes</p>
                ) : (
                  filteredRequests.map(req => (
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
                                <span style={{ fontSize: '12px', color: '#334155' }}>{req.open_time?.slice(0, 5)} - {req.close_time?.slice(0, 5)}</span>
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
                      <div className="admin-card-actions" style={{ flexWrap: 'wrap' }}>
                        <button style={{ flex: '1 1 45%', padding: '8px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setSelectedPin(req.pins)}>Ver Ubicación</button>
                        <button style={{ flex: '1 1 45%', padding: '8px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setEditingRequest(req)}>Editar</button>
                        <button className="btn-reject" style={{ flex: '1 1 45%' }} onClick={() => handleReject(req)}>Rechazar</button>
                        <button className="btn-approve" style={{ flex: '1 1 45%' }} onClick={() => handleApprove(req)}>Aprobar</button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'reports' && (
                filteredReports.length === 0 ? (
                  <p className="admin-empty">No hay reportes pendientes.</p>
                ) : (
                  filteredReports.map(report => (
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
                        <strong>Categoría:</strong> {report.pins?.category || '—'}<br />
                        <strong>Razón:</strong> {report.reason}
                      </p>
                      <div className="admin-card-actions">
                        <button className="btn-reject" onClick={() => handleDismissReport(report.id)}>Descartar</button>
                        <button style={{ flex: 1, padding: '8px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => {
                          const pin = report.pins;
                          if (!pin) return;
                          // Switch to the correct map first
                          const mapId = pin.map_id || 'main';
                          if (mapId !== 'main') {
                            setCurrentBuilding(mapId);
                            if (pin.floor) setSelectedFloor(pin.floor);
                          } else {
                            setCurrentBuilding(null);
                          }
                          setSelectedPin(pin);
                        }}>Ver Pin</button>
                        <button className="btn-approve" onClick={() => handleResolveReport(report)}>Resuelto</button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'history' && (
                historyTickets.length === 0 ? (
                  <p className="admin-empty">No hay historial de tickets.</p>
                ) : (
                  historyTickets.map(ticket => (
                    <div key={ticket.id + ticket.ticket_type} className="admin-card" style={{ opacity: 0.8 }}>
                      <div className="admin-card-header">
                        <div className={`admin-card-icon ${ticket.ticket_type === 'request' ? 'req-icon' : ''}`} style={{ background: ticket.ticket_type === 'request' ? '#dbeafe' : '#fee2e2' }}>
                          {ticket.ticket_type === 'request' ? <Globe size={14} color="#3b82f6" /> : <Flag size={14} color="#ef4444" />}
                        </div>
                        <div className="admin-card-title-group">
                          <h5>{ticket.pins?.name || 'Pin desconocido'}</h5>
                          <span className="admin-date">{new Date(ticket.created_at).toLocaleDateString('es-MX')}</span>
                        </div>
                      </div>
                      <p className="admin-card-desc">
                        <strong>Tipo:</strong> {ticket.ticket_type === 'request' ? 'Solicitud Público' : 'Reporte'}<br />
                        <strong>Estado:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{ticket.status}</span>
                      </p>
                    </div>
                  ))
                )
              )}

              {activeTab === 'public_pins' && (
                filteredPublicPins.length === 0 ? (
                  <p className="admin-empty">No hay pines públicos creados aún.</p>
                ) : (
                  filteredPublicPins.map(pin => (
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

        {/* Icon Customizer Modal */}
        {showIconCustomizer && (
          <div className="action-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="action-modal" style={{ maxWidth: '400px' }}>
              <button className="btn-close" onClick={() => setShowIconCustomizer(false)}>
                <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
                </span>
              </button>
              <div className="action-modal-header" style={{ marginBottom: '16px' }}>
                <MapPin size={24} color="#3b82f6" />
                <h3 style={{ margin: 0, color: '#003056' }}>Personalizar Ícono</h3>
              </div>
              <p className="action-modal-desc" style={{ marginBottom: '20px' }}>
                Selecciona un ícono para representar tu ubicación actual en el mapa.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                {locationIcons.map(icon => (
                  <div 
                    key={icon.id}
                    onClick={() => setUserLocationIcon(icon.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: userLocationIcon === icon.id ? '#eff6ff' : '#f9fafb',
                      border: `2px solid ${userLocationIcon === icon.id ? '#3b82f6' : 'transparent'}`,
                      transition: 'all 0.2s ease',
                      boxShadow: userLocationIcon === icon.id ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      {icon.src ? (
                        <img src={icon.src} alt={icon.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: '18px', height: '18px', backgroundColor: '#3b82f6', borderRadius: '50%', border: '3px solid white', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}></div>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: userLocationIcon === icon.id ? 'bold' : 'normal', color: userLocationIcon === icon.id ? '#1d4ed8' : '#4b5563', textAlign: 'center' }}>
                      {icon.name}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                className="btn-modal-submit" 
                style={{ marginTop: '20px', background: '#3b82f6' }}
                onClick={() => setShowIconCustomizer(false)}
              >
                <Check size={16} /> Listo
              </button>
            </div>
          </div>
        )}

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
              <div style={{ position: 'relative', display: 'inline-block', cursor: isZenMode ? 'crosshair' : 'default' }} onClick={(e) => handleMapClick(e, 'main')}>
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
                      left: '53.957%',
                      top: '68.560%',
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
            <div className="rectoria-modal" style={{ position: 'absolute', top: '2%', left: '2%', width: '96%', height: '96%' }}>
              {/* Header */}
              <div className="rectoria-header">
                <div>
                  <h2 className="rectoria-title">Edificio de Rectoría</h2>
                  <span className="rectoria-subtitle">
                    Gestión de Pines - {selectedFloor === 'PB' ? 'P. Baja' : '1er Nivel'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Floor Toggle */}
                  <div className="rectoria-floor-toggle">
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
                    className="rectoria-close-btn"
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
                    <div className="rectoria-map-container">
                      <div style={{ position: 'relative', display: 'inline-block', cursor: isZenMode ? 'crosshair' : 'default' }} onClick={(e) => handleMapClick(e, currentBuilding)}>
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
        <div className="admin-pin-card">
          <button
            style={{ position: 'absolute', top: '16px', right: '16px', background: '#f3f4f6', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            className="rectoria-close-btn"
            onClick={() => setSelectedPin(null)}
          >
            <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#6b7280" style={{ display: 'block', width: '16px', height: '16px' }} />
            </span>
          </button>

          <div style={{ marginBottom: '24px' }}>
            <h3>{selectedPin.name}</h3>
            <span style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
              {selectedPin.category ? selectedPin.category.toUpperCase() : 'SIN CATEGORÍA'}
            </span>
            {selectedPin.owner && (
              <span className="sheet-owner-text" style={{ display: 'block', marginTop: '4px' }}>
                De: {selectedPin.owner}
              </span>
            )}
            
            {selectedPin.description && (
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginTop: '12px', marginBottom: '0' }}>
                {selectedPin.description}
              </p>
            )}
          </div>

          {selectedPin.has_schedule && (
            <div className="sheet-schedule-box">
              <div style={{ flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700', color: '#9ca3af', marginBottom: '4px' }}>
                  <Clock size={12} /> HORARIO
                </span>
                <span className="schedule-value">
                  {selectedPin.open_time ? selectedPin.open_time.slice(0, 5) : '--:--'} - {selectedPin.close_time ? selectedPin.close_time.slice(0, 5) : '--:--'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#9ca3af', marginBottom: '4px' }}>DÍAS</span>
                <span className="schedule-value">
                  {Array.isArray(selectedPin.available_days)
                    ? selectedPin.available_days.join(', ')
                    : (typeof selectedPin.available_days === 'string' ? JSON.parse(selectedPin.available_days).join(', ') : 'L, M, Mi, J, V')}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: '#f3f4f6', color: '#4b5563', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => { setEditingPin(selectedPin); setSelectedPin(null); }}
            >
              <Edit2 size={14} /> Editar
            </button>
            <button
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: '#e0f2fe', color: '#0369a1', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => { setMovingPin(selectedPin); setIsZenMode(true); setSelectedPin(null); }}
            >
              <Move size={14} /> Mover
            </button>
            <button
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: '#fef2f2', color: '#cf1010', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => { handleDeletePin(selectedPin.id); setSelectedPin(null); }}
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {editingRequest && (
        <div className="action-modal-overlay">
          <div className="admin-edit-modal">
            <button className="rectoria-close-btn" onClick={() => setEditingRequest(null)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <X size={16} color="#6b7280" />
            </button>

            <div className="action-modal-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Edit2 size={24} color="#003056" />
              <h3 style={{ margin: 0, fontSize: '18px' }}>Editar Solicitud</h3>
            </div>

            <div className="action-form-group" style={{ marginBottom: '16px' }}>
              <label>DUEÑO PROPUESTO</label>
              <input
                type="text"
                value={editingRequest.requester_name || ''}
                onChange={(e) => setEditingRequest({ ...editingRequest, requester_name: e.target.value })}
              />
            </div>

            <div className="action-form-group" style={{ marginBottom: '16px' }}>
              <label>DESCRIPCIÓN</label>
              <textarea
                rows="3"
                value={editingRequest.description || ''}
                onChange={(e) => setEditingRequest({ ...editingRequest, description: e.target.value })}
              />
            </div>

            <div className="action-form-group" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="req_has_schedule"
                checked={editingRequest.has_schedule || false}
                onChange={(e) => setEditingRequest({ ...editingRequest, has_schedule: e.target.checked })}
                style={{ width: 'auto' }}
              />
              <label htmlFor="req_has_schedule" style={{ margin: 0 }}>TIENE HORARIO</label>
            </div>

            {editingRequest.has_schedule && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div className="action-form-group" style={{ flex: 1 }}>
                    <label>APERTURA</label>
                    <input
                      type="time"
                      value={editingRequest.open_time || '08:00'}
                      onChange={(e) => setEditingRequest({ ...editingRequest, open_time: e.target.value })}
                    />
                  </div>
                  <div className="action-form-group" style={{ flex: 1 }}>
                    <label>CIERRE</label>
                    <input
                      type="time"
                      value={editingRequest.close_time || '18:00'}
                      onChange={(e) => setEditingRequest({ ...editingRequest, close_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="action-form-group" style={{ marginBottom: '24px' }}>
                  <label>DÍAS DISPONIBLES</label>
                  <div className="day-checkboxes">
                    {['L', 'M', 'Mi', 'J', 'V', 'S', 'D'].map(day => {
                      let currentDays = ['L', 'M', 'Mi', 'J', 'V'];
                      if (editingRequest.available_days) {
                        try {
                          currentDays = Array.isArray(editingRequest.available_days) 
                            ? editingRequest.available_days 
                            : JSON.parse(editingRequest.available_days);
                        } catch (e) {
                          console.error("Error parsing days", e);
                        }
                      }
                      const isActive = currentDays.includes(day);
                      return (
                        <button
                          key={day}
                          className={`day-btn ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            const newDays = isActive ? currentDays.filter(d => d !== day) : [...currentDays, day];
                            setEditingRequest({ ...editingRequest, available_days: newDays });
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleUpdateRequest}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#003056', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <Check size={18} /> Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Edit Pin Modal */}
      {editingPin && (
        <div className="action-modal-overlay">
          <div className="admin-edit-modal">
            <button className="rectoria-close-btn" onClick={() => setEditingPin(null)} style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <X size={16} color="#6b7280" />
            </button>

            <div className="action-modal-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Edit2 size={24} color="#003056" />
              <h3 style={{ margin: 0, fontSize: '18px' }}>Editar Pin</h3>
            </div>

            <div className="action-form-group" style={{ marginBottom: '16px' }}>
              <label>NOMBRE</label>
              <input
                type="text"
                value={editingPin.name || ''}
                onChange={(e) => setEditingPin({ ...editingPin, name: e.target.value })}
              />
            </div>

            <div className="action-form-group" style={{ marginBottom: '16px' }}>
              <label>CATEGORÍA</label>
              <select
                value={editingPin.category || ''}
                onChange={(e) => setEditingPin({ ...editingPin, category: e.target.value })}
              >
                <option value="aulas">Aulas</option>
                <option value="canchas">Canchas</option>
                <option value="cafeteria">Cafetería</option>
                <option value="banos">Baños</option>
                <option value="laboratorios">Laboratorios</option>
                <option value="oficinas">Oficinas</option>
                <option value="edificios">Edificios</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className="action-form-group" style={{ marginBottom: '16px' }}>
              <label>DESCRIPCIÓN</label>
              <textarea
                rows="3"
                value={editingPin.description || ''}
                onChange={(e) => setEditingPin({ ...editingPin, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div className="action-form-group" style={{ flex: 1 }}>
                <label>COLOR</label>
                <div className="admin-color-picker" style={{ flexWrap: 'wrap', height: 'auto', gap: '8px' }}>
                  {['#ef4444', '#60a5fa', '#f97316', '#10b981', '#a855f7', '#ec4899', '#eab308', '#06b6d4'].map(color => (
                    <div
                      key={color}
                      className={`admin-color-circle ${editingPin.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingPin({ ...editingPin, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="action-form-group" style={{ flex: 1 }}>
                <label>ICONO</label>
                <select
                  value={editingPin.icon || 'map-pin'}
                  onChange={(e) => setEditingPin({ ...editingPin, icon: e.target.value })}
                >
                  <option value="map-pin">Pin</option>
                  <option value="coffee">Cafetería</option>
                  <option value="book-open">Libro</option>
                  <option value="car">Coche</option>
                  <option value="microscope">Laboratorio</option>
                  <option value="users">Usuarios</option>
                  <option value="building">Edificio</option>
                  <option value="more-horizontal">Otros</option>
                </select>
              </div>
            </div>

            <div className="action-form-group" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="has_schedule"
                checked={editingPin.has_schedule || false}
                onChange={(e) => setEditingPin({ ...editingPin, has_schedule: e.target.checked })}
                style={{ width: 'auto' }}
              />
              <label htmlFor="has_schedule" style={{ margin: 0 }}>TIENE HORARIO</label>
            </div>

            {editingPin.has_schedule && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div className="action-form-group" style={{ flex: 1 }}>
                    <label>APERTURA</label>
                    <input
                      type="time"
                      value={editingPin.open_time || '08:00'}
                      onChange={(e) => setEditingPin({ ...editingPin, open_time: e.target.value })}
                    />
                  </div>
                  <div className="action-form-group" style={{ flex: 1 }}>
                    <label>CIERRE</label>
                    <input
                      type="time"
                      value={editingPin.close_time || '18:00'}
                      onChange={(e) => setEditingPin({ ...editingPin, close_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="action-form-group" style={{ marginBottom: '24px' }}>
                  <label>DÍAS DISPONIBLES</label>
                  <div className="day-checkboxes">
                    {['L', 'M', 'Mi', 'J', 'V', 'S', 'D'].map(day => {
                      let currentDays = ['L', 'M', 'Mi', 'J', 'V'];
                      if (editingPin.available_days) {
                        try {
                          currentDays = Array.isArray(editingPin.available_days) 
                            ? editingPin.available_days 
                            : JSON.parse(editingPin.available_days);
                        } catch (e) {
                          console.error("Error parsing days", e);
                        }
                      }
                      const isActive = currentDays.includes(day);
                      return (
                        <button
                          key={day}
                          className={`day-btn ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            const newDays = isActive ? currentDays.filter(d => d !== day) : [...currentDays, day];
                            setEditingPin({ ...editingPin, available_days: newDays });
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

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
