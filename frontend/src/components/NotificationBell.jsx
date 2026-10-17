import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, X, Flag, AlertTriangle, MapPin, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function NotificationBell({ currentUser }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new, ...prev]);
            setUnreadCount((prev) => prev + 1);
            toast(payload.new.title, {
              style: {
                background: '#333',
                color: '#fff',
              },
            });
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new : n))
            );
            setUnreadCount((prev) =>
              payload.new.is_read ? Math.max(0, prev - 1) : prev
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', currentUser.id);

    if (error) console.error('Error marking as read:', error);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
      .eq('user_id', currentUser.id);

    if (error) console.error('Error marking all as read:', error);
    else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();

    // Actualización optimista de la UI
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      setUnreadCount(filtered.filter((n) => !n.is_read).length);
      return filtered;
    });

    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif(null);
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isActionable = (type) => {
    return ['new_report', 'new_bug', 'pin_request'].includes(type);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_report':
        return <Flag size={15} color="#ef4444" style={{ flexShrink: 0 }} />;
      case 'new_bug':
        return <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />;
      case 'pin_request':
        return <MapPin size={15} color="#3b82f6" style={{ flexShrink: 0 }} />;
      case 'request_approved':
        return <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0 }} />;
      default:
        return <Info size={15} color="#6366f1" style={{ flexShrink: 0 }} />;
    }
  };

  const handleNotificationClick = async (notif) => {
    // 1. Marcar como leída
    if (!notif.is_read) {
      markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // 2. Cerrar dropdown de notificaciones
    setIsOpen(false);

    // 3. Navegación directa o apertura de modal
    if (notif.type === 'new_report') {
      toast.success('Abriendo reporte en panel de administrador...');
      navigate('/admin?tab=reports');
    } else if (notif.type === 'new_bug') {
      toast.success('Abriendo error en panel de administrador...');
      navigate('/admin?tab=bugs');
    } else if (notif.type === 'pin_request') {
      toast.success('Abriendo solicitudes en panel de administrador...');
      navigate('/admin?tab=requests');
    } else {
      // Para notificaciones generales (rechazos, aprobaciones, avisos informativos)
      setSelectedNotif(notif);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="icon-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', background: isOpen ? '#e5e7eb' : '' }}
        title="Notificaciones"
      >
        <Bell size={24} color={isOpen ? '#111827' : '#4b5563'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '120%',
          right: '0',
          width: '320px',
          maxHeight: '420px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{ 
                  background: 'none', border: 'none', color: '#3b82f6', 
                  fontSize: '13px', cursor: 'pointer', fontWeight: '500' 
                }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                <Bell size={32} color="#d1d5db" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: notif.is_read ? 'white' : '#f0f7ff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    position: 'relative',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = notif.is_read ? '#f9fafb' : '#e0f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notif.is_read ? 'white' : '#f0f7ff';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getNotificationIcon(notif.type)}
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827', paddingRight: '12px' }}>
                        {notif.title}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => deleteNotification(notif.id, e)}
                      style={{ 
                        background: 'none', border: 'none', padding: '3px', 
                        cursor: 'pointer', color: '#9ca3af' 
                      }}
                      title="Eliminar notificación"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                    {notif.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {formatTime(notif.created_at)}
                    </span>
                    {isActionable(notif.type) ? (
                      <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        Abrir <ExternalLink size={11} />
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        Ver detalle
                      </span>
                    )}
                  </div>
                  {!notif.is_read && (
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      right: '34px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb'
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalle de Notificación (para avisos, rechazos o lectura completa) */}
      {selectedNotif && (
        <div 
          className="action-modal-overlay" 
          style={{ zIndex: 1200 }} 
          onClick={() => setSelectedNotif(null)}
        >
          <div 
            className="action-modal" 
            style={{ maxWidth: '440px', padding: '24px', borderRadius: '16px', background: 'white' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getNotificationIcon(selectedNotif.type)}
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#003056' }}>
                  {selectedNotif.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
              {selectedNotif.message}
            </p>

            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
              {formatTime(selectedNotif.created_at)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => deleteNotification(selectedNotif.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} /> Eliminar
              </button>
              <button
                onClick={() => setSelectedNotif(null)}
                className="btn-modal-submit"
                style={{ 
                  background: '#003056', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 20px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
