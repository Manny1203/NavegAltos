import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { calculateAffineCoefficients, transformCoordinates, findShortestPath, findClosestNode, calculateDistanceMap, mapDistanceToMeters } from '../lib/geoUtils';
import {
  Menu, Search, Plus, Map as MapIcon, Globe, Lock, X,
  MapPin, BookOpen, Coffee, Car, Microscope, Clock, Route,
  AlertTriangle, Trash2, LogOut, Shield, Utensils, HelpCircle, Minus, Navigation, Moon, Sun, Check, User, Share2, MoreHorizontal, Building, ChevronDown, ChevronUp, Heart
} from 'lucide-react';
import UserProfile from '../components/UserProfile';
import MakePublicModal from '../components/modals/MakePublicModal';
import ReportPinModal from '../components/modals/ReportPinModal';
import SharedPinReceptionModal from '../components/modals/SharedPinReceptionModal';
import ConfirmDeletePinModal from '../components/modals/ConfirmDeletePinModal';
import BugReportModal from '../components/modals/BugReportModal';
import mapImage from '../assets/mapaUniversidadVector.svg';
import mapImageA from '../assets/mapaUniversidadVectorEdificioA.svg';
import mapImageB from '../assets/mapaUniversidadVectorEdificioB.svg';
import mapImageC from '../assets/mapaUniversidadVectorEdificioC.svg';
import mapImageD from '../assets/mapaUniversidadVectorEdificioD.svg';
import mapImageE from '../assets/mapaUniversidadVectorEdificioE.svg';
import mapImageF from '../assets/mapaUniversidadVectorEdificioF.svg';
import mapImageG from '../assets/mapaUniversidadVectorEdificioG.svg';
import mapImageH from '../assets/mapaUniversidadVectorEdificioH.svg';
import mapImageI from '../assets/mapaUniversidadVectorEdificioI.svg';
import mapImageJ from '../assets/mapaUniversidadVectorEdificioJ.svg';
import mapImageK from '../assets/mapaUniversidadVectorEdificioK.svg';
import rectoriaPB from '../assets/rectoria_pb.jpeg';
import rectoriaN1 from '../assets/rectoria_n1.jpeg';
import { supabase } from '../lib/supabase';
import '../styles/dashboard.css';

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
  { id: 'default', name: 'Por Defecto', src: null },
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

const buildingMaps = {
  main: mapImage,
  A: mapImageA, B: mapImageB, C: mapImageC, D: mapImageD,
  E: mapImageE, F: mapImageF, G: mapImageG, H: mapImageH,
  I: mapImageI, J: mapImageJ, K: mapImageK
};

const parseDays = (days) => {
  if (!days) return ['L', 'M', 'Mi', 'J', 'V'];
  if (Array.isArray(days)) return days;
  if (typeof days === 'string') {
    if (days.startsWith('{') && days.endsWith('}')) {
      const inner = days.slice(1, -1);
      return inner ? inner.split(',').map(s => s.trim().replace(/^"|"$/g, '')) : [];
    }
    try {
      return JSON.parse(days);
    } catch (e) {
      return days.split(',').map(s => s.trim());
    }
  }
  return ['L', 'M', 'Mi', 'J', 'V'];
};

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
  const [showIconCustomizer, setShowIconCustomizer] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [userLocationIcon, setUserLocationIcon] = useState(() => {
    return localStorage.getItem('user-location-icon') || 'default';
  });

  useEffect(() => {
    localStorage.setItem('user-location-icon', userLocationIcon);
  }, [userLocationIcon]);

  // Modals state
  const [showMakePublicModal, setShowMakePublicModal] = useState(false);
  const [publicPinData, setPublicPinData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPinData, setReportPinData] = useState(null);

  // Shared pin state
  const [showSharedPinModal, setShowSharedPinModal] = useState(false);
  const [sharedPinData, setSharedPinData] = useState(null);

  // Confirm delete state
  const [pinToDelete, setPinToDelete] = useState(null);

  // Report Form State
  
  // Bug Report State
  const [showBugReportModal, setShowBugReportModal] = useState(false);

  const [userPins, setUserPins] = useState([]);

  // Pin Creator State
  const [newPinName, setNewPinName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pin');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [newPinCategory, setNewPinCategory] = useState('aulas'); // Default category

  // Admin logic
  const [isAdmin, setIsAdmin] = useState(false);

  // Buildings checklist state
  const [activeHighlights, setActiveHighlights] = useState([]);
  const [showMapMenu, setShowMapMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // GPS Tracking State
  const [userLocation, setUserLocation] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);

  // Route Editor State
  const [routeEditMode, setRouteEditMode] = useState(false);
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);

  // History for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = (nodes, edges) => {
    const newState = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!routeEditMode) return;
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setGraphNodes(history[newIndex].nodes);
          setGraphEdges(history[newIndex].edges);
        }
      } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setGraphNodes(history[newIndex].nodes);
          setGraphEdges(history[newIndex].edges);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [routeEditMode, history, historyIndex]);

  // UX State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('navegaltos-dark-mode');
    if (saved !== null) return saved === 'true';
    // First time: use OS preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('navegaltos-dark-mode', String(darkMode));
  }, [darkMode]);

  // Routing State
  const [campusGraph, setCampusGraph] = useState({ nodes: [], edges: [] });
  const [currentRoute, setCurrentRoute] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeTime, setRouteTime] = useState(0);

  // Traveling State
  const [isTraveling, setIsTraveling] = useState(false);
  const [destinationPin, setDestinationPin] = useState(null);
  const [isTripBarMinimized, setIsTripBarMinimized] = useState(false);

  // --- GPS CALIBRATION POINTS ---
  const calibrationPoints = [
    { lat: 20.84506154113727, lng: -102.78311189519502, x: 21.875, y: 82.01830328970385 }, // Pin 1 (Entrada)
    { lat: 20.848292209707036, lng: -102.7812475654753, x: 79.46428571428571, y: 72.64325219972991 }, // Pin 2 (Derecha abajo)
    { lat: 20.84826646582548, lng: -102.78449790698997, x: 50.89285714285714, y: 17.19652146759833 }  // Pin 3 (Izquierda arriba)
  ];
  const affineCoeffs = calculateAffineCoefficients(calibrationPoints[0], calibrationPoints[1], calibrationPoints[2]);

  useEffect(() => {
    let watchId;
    if (gpsEnabled) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const mapPos = transformCoordinates(latitude, longitude, affineCoeffs);
            if (mapPos) {
              if (mapPos.x < -5 || mapPos.x > 105 || mapPos.y < -5 || mapPos.y > 105) {
                setIsOutOfBounds(true);
                setUserLocation(null);
              } else {
                setIsOutOfBounds(false);
                // Limitar las coordenadas para evitar que el punto se salga del recuadro del mapa
                const clampedX = Math.max(0, Math.min(100, mapPos.x));
                const clampedY = Math.max(0, Math.min(100, mapPos.y));
                setUserLocation({ x: clampedX, y: clampedY, lat: latitude, lng: longitude });
              }
              setGpsError('');
            }
          },
          (error) => {
            console.error('Error de GPS:', error);
            setGpsError('Asegúrate de tener la ubicación activada y haber dado permisos.');
            setGpsEnabled(false);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      } else {
        setGpsError('Tu dispositivo no soporta GPS.');
        setGpsEnabled(false);
      }
    } else {
      setUserLocation(null);
      setIsOutOfBounds(false);
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [gpsEnabled]);

  const buildingFilters = {
    A: 'invert(40%) sepia(100%) saturate(10000%) hue-rotate(345deg) brightness(100%) contrast(100%)',
    B: 'invert(50%) sepia(100%) saturate(10000%) hue-rotate(5deg) brightness(100%) contrast(100%)',
    C: 'invert(60%) sepia(100%) saturate(10000%) hue-rotate(35deg) brightness(120%) contrast(100%)',
    D: 'invert(45%) sepia(100%) saturate(10000%) hue-rotate(90deg) brightness(100%) contrast(100%)',
    E: 'invert(55%) sepia(100%) saturate(10000%) hue-rotate(120deg) brightness(110%) contrast(100%)',
    F: 'invert(60%) sepia(100%) saturate(10000%) hue-rotate(150deg) brightness(120%) contrast(100%)',
    G: 'invert(45%) sepia(100%) saturate(10000%) hue-rotate(200deg) brightness(100%) contrast(100%)',
    H: 'invert(40%) sepia(100%) saturate(10000%) hue-rotate(240deg) brightness(100%) contrast(100%)',
    I: 'invert(50%) sepia(100%) saturate(10000%) hue-rotate(270deg) brightness(110%) contrast(100%)',
    J: 'invert(60%) sepia(100%) saturate(10000%) hue-rotate(300deg) brightness(110%) contrast(100%)',
    K: 'invert(50%) sepia(100%) saturate(10000%) hue-rotate(180deg) brightness(100%) contrast(100%)'
  };

  const buildingColorsHex = {
    A: '#ef4444', B: '#f97316', C: '#eab308', D: '#22c55e', E: '#10b981',
    F: '#06b6d4', G: '#3b82f6', H: '#8b5cf6', I: '#d946ef', J: '#ec4899', K: '#0ea5e9'
  };

  const toggleHighlight = (letter) => {
    setActiveHighlights(prev =>
      prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter]
    );
  };

  useEffect(() => {
    fetchPins();
    fetchUser();
    fetchCampusGraph();
  }, [activeFilter, visibilityFilter, currentUser?.id]);

  useEffect(() => {
    const checkUrlParams = async () => {
      const params = new URLSearchParams(window.location.search);
      const publicPinId = params.get('pin');
      const sharedPinId = params.get('shared');

      if (publicPinId) {
        const { data } = await supabase.from('pins').select('*').eq('id', publicPinId).eq('is_public', true).maybeSingle();
        if (data) {
          setSelectedPin(data);
          if (data.map_id && data.map_id !== 'main') {
            setCurrentBuilding(data.map_id);
            setSelectedFloor(data.floor || 'PB');
          }
        }
      } else if (sharedPinId) {
        const { data } = await supabase.from('shared_pins').select('*').eq('id', sharedPinId).maybeSingle();
        if (data) {
          const createdDate = new Date(data.created_at);
          const diffDays = Math.ceil(Math.abs(new Date() - createdDate) / (1000 * 60 * 60 * 24));

          if (diffDays > 7) {
            toast.error('Este enlace compartido ha caducado (tiene más de 7 días).');
          } else {
            setSharedPinData(data.pin_data);
            setShowSharedPinModal(true);
          }
        } else {
          toast.error('El pin compartido no existe o el enlace es incorrecto.');
        }
      }

      if (publicPinId || sharedPinId) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkUrlParams();
  }, []);

  const fetchCampusGraph = async () => {
    try {
      // 1. Intentar cargar desde Supabase
      const { data, error } = await supabase
        .from('campus_graphs')
        .select('graph_data')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data && data.graph_data) {
        setCampusGraph(data.graph_data);
        return;
      }
    } catch (err) {
      console.log('Error fetching from Supabase, trying local fallback...', err);
    }

    // 2. Fallback a archivo local
    try {
      const res = await fetch('/campus_graph.json');
      if (res.ok) {
        const localData = await res.json();
        setCampusGraph(localData);
      }
    } catch (err) {
      console.log('No custom graph found', err);
    }
  };

  const targetPin = isTraveling ? destinationPin : selectedPin;

  // Dijkstra Cache
  const cachedPathRef = useRef({ start: null, end: null, pathIds: null, graphVersion: 0 });

  // Route Calculation Effect
  useEffect(() => {
    if (!targetPin || !campusGraph.nodes.length) {
      setCurrentRoute(null);
      return;
    }

    const startPos = userLocation ? { x: userLocation.x, y: userLocation.y } : { x: 21.875, y: 82.018 };
    const endPos = { x: targetPin.x_coordinate, y: targetPin.y_coordinate };

    const startNode = findClosestNode(startPos.x, startPos.y, campusGraph.nodes);
    let endNode = null;

    // Si el pin tiene una puerta oficial asignada y ese nodo aún existe en el grafo
    if (targetPin.entrance_node_id) {
      endNode = campusGraph.nodes.find(n => n.id === targetPin.entrance_node_id);
    }

    // Si no tiene puerta o el nodo fue borrado, fallback a buscar el más cercano geográficamente
    if (!endNode) {
      endNode = findClosestNode(endPos.x, endPos.y, campusGraph.nodes);
    }

    if (startNode && endNode) {
      let pathIds = null;
      if (
        cachedPathRef.current.start === startNode.id &&
        cachedPathRef.current.end === endNode.id &&
        cachedPathRef.current.graphVersion === campusGraph.nodes.length
      ) {
        // Usa el cálculo guardado en memoria caché (Ahorra CPU y batería)
        pathIds = cachedPathRef.current.pathIds;
      } else {
        // Calcula una nueva ruta si los nodos inicio/fin cambiaron
        pathIds = findShortestPath(campusGraph.nodes, campusGraph.edges, startNode.id, endNode.id);
        cachedPathRef.current = {
          start: startNode.id,
          end: endNode.id,
          pathIds,
          graphVersion: campusGraph.nodes.length
        };
      }

      if (pathIds) {
        const pathNodes = pathIds.map(id => campusGraph.nodes.find(n => n.id === id));
        setCurrentRoute(pathNodes);

        let totalMapDist = 0;
        for (let i = 0; i < pathNodes.length - 1; i++) {
          totalMapDist += calculateDistanceMap(pathNodes[i], pathNodes[i + 1]);
        }
        totalMapDist += calculateDistanceMap(startPos, startNode);
        totalMapDist += calculateDistanceMap(endPos, endNode);

        const meters = mapDistanceToMeters(totalMapDist);
        setRouteDistance(Math.round(meters));
        setRouteTime(Math.ceil(meters / 84)); // Walking speed ~ 84m/min (5km/h)
      } else {
        setCurrentRoute(null);
        const dist = calculateDistanceMap(startPos, endPos);
        const meters = mapDistanceToMeters(dist);
        setRouteDistance(Math.round(meters));
        setRouteTime(Math.ceil(meters / 84));
      }
    }
  }, [targetPin, userLocation, campusGraph]);

  // Arrival Check Effect
  useEffect(() => {
    if (isTraveling && destinationPin && userLocation) {
      // Use direct line distance for arrival check to avoid node snapping issues
      const distMap = Math.hypot(userLocation.x - destinationPin.x_coordinate, userLocation.y - destinationPin.y_coordinate);
      const directDistanceMeters = mapDistanceToMeters(distMap);

      // TODO: Pruebas de campo requeridas.
      // 15 metros puede ser mucho en teoría, pero debido a la imprecisión
      // típica del GPS en dispositivos móviles (10-20m) puede ser necesario.
      // Ajustar después de pruebas físicas.
      if (directDistanceMeters < 15) { // 15 meters arrival radius
        toast.success('Has llegado a tu destino.');
        setIsTraveling(false);
        setDestinationPin(null);
        setIsTripBarMinimized(false);
      }
    }
  }, [userLocation, isTraveling, destinationPin]);

  const fetchUser = async () => {
    const isGuest = localStorage.getItem('guest_mode') === 'true';
    if (isGuest) {
      setCurrentUser(null);
      setIsAdmin(false);
      return;
    }

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

  const [userFavorites, setUserFavorites] = useState([]);

  const fetchFavorites = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('user_favorites').select('pin_id').eq('user_id', currentUser.id);
      if (!error && data) {
        setUserFavorites(data.map(f => f.pin_id));
      }
    } catch (e) {
      console.error('Error fetching favorites:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchFavorites();
    }
  }, [currentUser]);


  // Logout handler
  const handleLogout = async () => {
    localStorage.removeItem('guest_mode');
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

  let displayedPins = userPins.filter(pin => {
    // 1. Expiration Check
    if (pin.expires_at && new Date(pin.expires_at) < new Date()) {
      return false; // Pin has expired
    }

    // 2. Building/Floor Check
    const pinMap = pin.map_id || 'main';
    let isCorrectMap = false;
    if (currentBuilding) {
      isCorrectMap = (pinMap === currentBuilding && pin.floor === selectedFloor);
    } else {
      isCorrectMap = (pinMap === 'main');
    }
    return isCorrectMap;
  });

  if (searchQuery) {
    const fuse = new Fuse(displayedPins, {
      keys: ['name', 'category', 'description'],
      threshold: 0.4,
      ignoreLocation: true
    });
    displayedPins = fuse.search(searchQuery).map(result => result.item);
  }

  const filters = [
    { id: 'canchas', label: 'Canchas' },
    { id: 'cafeteria', label: 'Cafetería' },
    { id: 'aulas', label: 'Aulas' },
    { id: 'banos', label: 'Baños' },
    { id: 'laboratorios', label: 'Laboratorios' },
    { id: 'alimentos', label: 'Alimentos' },
    { id: 'edificios', label: 'Edificios' },
    { id: 'otros', label: 'Otros' }
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
      setSelectedPin(null);
    }
  };

  const toggleMarkerMode = () => {
    if (!currentUser && !markerMode) {
      toast.error('Debes iniciar sesión para crear pines.');
      return;
    }
    setMarkerMode(!markerMode);
    setShowPinModal(false);
    setSelectedPin(null);
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
      case 'utensils': return <Utensils color={color} />;
      case 'building': return <Building color={color} />;
      case 'more-horizontal': return <MoreHorizontal color={color} />;
      case 'help-circle': return <MoreHorizontal color={color} />; // Fallback para pines existentes
      default: return <MapPin color={color} />;
    }
  };

  const toggleFavorite = async (pinId) => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para guardar favoritos.');
      return;
    }
    const isFav = userFavorites.includes(pinId);
    if (isFav) {
      setUserFavorites(prev => prev.filter(id => id !== pinId));
      await supabase.from('user_favorites').delete().eq('user_id', currentUser.id).eq('pin_id', pinId);
    } else {
      setUserFavorites(prev => [...prev, pinId]);
      await supabase.from('user_favorites').insert([{ user_id: currentUser.id, pin_id: pinId }]);
    }
  };

  const handleSharePin = async (pin) => {
    try {
      const baseUrl = window.location.origin;
      let shareUrl = '';

      if (pin.is_public) {
        shareUrl = `${baseUrl}/dashboard?pin=${pin.id}`;
      } else {
        if (!currentUser) {
          toast.error('Debes iniciar sesión para compartir pines privados.');
          return;
        }
        const { data, error } = await supabase.from('shared_pins').insert([{
          shared_by: currentUser.id,
          pin_data: pin
        }]).select().single();

        if (error) throw error;
        shareUrl = `${baseUrl}/dashboard?shared=${data.id}`;
      }

      if (navigator.share) {
        await navigator.share({
          title: `Ubicación en NavegAltos: ${pin.name}`,
          text: `Mira esta ubicación en NavegAltos: ${pin.name}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Enlace copiado al portapapeles.');
      }
    } catch (err) {
      console.error('Error compartiendo pin:', err);
      toast.error('Hubo un error al compartir el pin.');
    }
  };

  return (
    <div className="dashboard-container">

      {/* Out of bounds warning */}
      {isOutOfBounds && (
        <div className="floating-ui" style={{ top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 200, width: '90%', maxWidth: '400px' }}>
          <div style={{ background: '#cf1010', color: 'white', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(207, 16, 16, 0.3)' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>Estás fuera del Centro Universitario. Acércate para iniciar el rastreo interno.</span>
          </div>
        </div>
      )}

      {/* Search Bar (formerly below navbar) */}
      {!routeEditMode && (
        <div className="floating-ui top-bar">
          <button className="icon-btn" onClick={() => { setShowMenuSidebar(!showMenuSidebar); setSelectedPin(null); }}>
            <Menu size={24} />
          </button>

          <div className="search-bar-container" style={{ cursor: 'text' }}>
            <Search size={20} color="#9ca3af" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="icon-btn"
            onClick={toggleMarkerMode}
            style={{ background: markerMode ? '#E25E24' : '', color: markerMode ? 'white' : '' }}
          >
            {markerMode ? <X size={24} /> : <Plus size={24} />}
          </button>
        </div>
      )}

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
                <>
                  <button
                    className="menu-sidebar-item"
                    onClick={() => navigate('/admin')}
                    style={{ marginBottom: '8px' }}
                  >
                    <Shield size={20} />
                    <div className="menu-item-text">
                      <span className="menu-item-label">Panel de Control</span>
                      <span className="menu-item-desc">Gestión de pines y solicitudes</span>
                    </div>
                  </button>
                  <button
                    className="menu-sidebar-item"
                    onClick={() => {
                      const nodes = campusGraph.nodes || [];
                      const edges = campusGraph.edges || [];
                      setGraphNodes(nodes);
                      setGraphEdges(edges);
                      setHistory([{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
                      setHistoryIndex(0);
                      setRouteEditMode(true);
                      setShowMenuSidebar(false);
                    }}
                    style={{ marginBottom: '16px' }}
                  >
                    <Route size={20} color="#E25E24" />
                    <div className="menu-item-text">
                      <span className="menu-item-label" style={{ color: '#E25E24' }}>Editor de Rutas</span>
                      <span className="menu-item-desc">Trazar caminos del mapa (Nodos)</span>
                    </div>
                  </button>
                </>
              )}

              {/* Personalizar Ícono */}
              <button
                className="menu-sidebar-item"
                onClick={() => { setShowIconCustomizer(true); setShowMenuSidebar(false); }}
                style={{ marginBottom: '8px' }}
              >
                <MapPin size={20} color="#3b82f6" />
                <div className="menu-item-text">
                  <span className="menu-item-label">Personalizar Ícono</span>
                  <span className="menu-item-desc">Cambia el estilo de tu ubicación</span>
                </div>
              </button>

              {/* Mi Perfil */}
              {currentUser && (
                <>
                  <button
                    className="menu-sidebar-item"
                    onClick={() => { setShowProfile(true); setShowMenuSidebar(false); }}
                    style={{ marginTop: isAdmin ? '0' : 'auto', marginBottom: '8px' }}
                  >
                    <User size={20} color="#3b82f6" />
                    <div className="menu-item-text">
                      <span className="menu-item-label">Mi Perfil</span>
                      <span className="menu-item-desc">Foto, tema, NIP y más</span>
                    </div>
                  </button>
                  
                  <button
                    className="menu-sidebar-item"
                    onClick={() => { setShowBugReportModal(true); setShowMenuSidebar(false); }}
                    style={{ marginBottom: '8px' }}
                  >
                    <AlertTriangle size={20} color="#f59e0b" />
                    <div className="menu-item-text">
                      <span className="menu-item-label">Reportar Error</span>
                      <span className="menu-item-desc">Avísanos si algo falló en la app</span>
                    </div>
                  </button>
                </>
              )}

              <button
                className="menu-sidebar-item text-danger"
                onClick={handleLogout}
                style={{ color: '#cf1010', marginTop: currentUser ? '0' : 'auto' }}
              >
                <LogOut size={20} />
                <div className="menu-item-text">
                  <span className="menu-item-label">{currentUser ? 'Cerrar Sesión' : 'Iniciar Sesión / Salir'}</span>
                  <span className="menu-item-desc">{currentUser ? 'Salir de tu cuenta' : 'Regresar al inicio de sesión'}</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Route Editor Toolbar */}
      {routeEditMode && (
        <div className="floating-ui" style={{ bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: '8px', background: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={{ background: deleteMode ? '#cf1010' : '#f3f4f6', color: deleteMode ? 'white' : '#333', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }} onClick={() => setDeleteMode(!deleteMode)}>
            <Trash2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Borrar
          </button>
          {selectedNodeId && (
            <select
              style={{ background: '#f59e0b', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', outline: 'none', border: 'none', cursor: 'pointer' }}
              onChange={async (e) => {
                const pinId = e.target.value;
                if (!pinId) return;
                try {
                  const { error } = await supabase.from('pins').update({ entrance_node_id: selectedNodeId }).eq('id', pinId);
                  if (error) throw error;
                  toast.success('Exito. Este nodo ahora es la puerta oficial de ese edificio.');
                  fetchPins();
                } catch (err) {
                  toast.error('Error al vincular: ' + err.message);
                }
                e.target.value = "";
              }}
            >
              <option value="">+ Vincular puerta a un pin...</option>
              {userPins.map(pin => (
                <option key={pin.id} value={pin.id}>{pin.name || pin.category}</option>
              ))}
            </select>
          )}
          <button style={{ background: '#f3f4f6', color: '#333', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }} onClick={() => setSelectedNodeId(null)}>
            Deseleccionar
          </button>
          <label style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Cargar JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target.result);
                    setGraphNodes(data.nodes || []);
                    setGraphEdges(data.edges || []);
                  } catch (err) { toast.error('Error al cargar archivo JSON'); }
                };
                reader.readAsText(file);
              }
            }} />
          </label>
          <button style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }} onClick={async () => {
            const newGraph = { nodes: graphNodes, edges: graphEdges };
            try {
              // 1. Guardar en Supabase
              const { error } = await supabase
                .from('campus_graphs')
                .upsert({ id: 1, graph_data: newGraph });

              if (error) throw error;

              // 2. Aplicar en vivo
              setCampusGraph(newGraph);

              // 3. Respaldo local
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(newGraph));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "campus_graph_backup.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();

              toast.success('Grafo guardado en la Nube y aplicado en vivo.');
            } catch (err) {
              console.error('Error guardando en Supabase:', err);
              toast.error('Error al guardar en la nube. Revisa consola.');
            }
          }}>
            Guardar
          </button>
          <button style={{ background: '#333', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }} onClick={() => { setRouteEditMode(false); setDeleteMode(false); }}>
            Cerrar
          </button>
        </div>
      )}

      {/* Marker Mode helper banner */}
      {markerMode && !showPinModal && (
        <div className="marker-mode-banner floating-ui" style={{ top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 999 }}>
          <MapPin size={24} className="marker-mode-icon" />
          <span className="marker-mode-title">Modo Marcador</span>
          <span className="marker-mode-subtitle">Toca el mapa para ubicar tu nuevo punto</span>
        </div>
      )}

      {/* Edificios Left Sidebar - Replaced by right floating map menu */}
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
            style={{ marginBottom: '16px', background: 'white', fontFamily: "'Inter', sans-serif" }}
            value={newPinCategory}
            onChange={(e) => setNewPinCategory(e.target.value)}
          >
            {filters.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <div className="modal-section-title">COLOR</div>
              <div className="pin-options-row" style={{ margin: 0, flexWrap: 'wrap', gap: '8px' }}>
                {['#ef4444', '#60a5fa', '#f97316', '#10b981', '#a855f7', '#ec4899', '#eab308', '#06b6d4'].map(color => (
                  <div
                    key={color}
                    className={`pin-option-btn color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color, borderColor: selectedColor === color ? '#333' : 'transparent', width: '32px', height: '32px' }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="modal-section-title">ÍCONO</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="pin-name-input"
                  style={{ margin: 0, padding: '8px', height: '42px', fontSize: '14px', background: 'white', flex: 1 }}
                  value={selectedIcon}
                  onChange={(e) => setSelectedIcon(e.target.value)}
                >
                  <option value="pin">Pin</option>
                  <option value="coffee">Cafetería</option>
                  <option value="car">Coche</option>
                  <option value="book">Libro</option>
                  <option value="microscope">Laboratorio</option>
                  <option value="utensils">Comida</option>
                  <option value="building">Edificio</option>
                  <option value="more-horizontal">Otros</option>
                </select>
                <div style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '8px', flexShrink: 0 }}>
                  {renderPinIcon(selectedIcon, selectedColor)}
                </div>
              </div>
            </div>
          </div>

          <div className="pin-actions">
            <button className="pin-action-btn btn-cancel" onClick={() => {
              setShowPinModal(false);
              setMarkerMode(false);
            }}>Cancelar</button>
            <button className="pin-action-btn btn-save" onClick={async () => {
              if (!newPinName) {
                toast.error('Por favor, ponle un nombre a tu pin.');
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
                toast.error('Hubo un error al guardar el pin. Intenta de nuevo.');
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

      {/* Right Sidebar and Bottom Filters */}
      {!routeEditMode && (
        <>
          <div className="floating-ui right-sidebar">
            <div style={{ position: 'relative' }}>
              <button
                className={`icon-btn sidebar-btn ${showMapMenu ? 'sidebar-active active-filter' : ''}`}
                onClick={() => setShowMapMenu(!showMapMenu)}
                title="Mapa"
              >
                <MapIcon size={24} />
                <span className="sidebar-tooltip">Mapa</span>
              </button>

              {showMapMenu && (
                <div className="map-menu-dropdown">
                  <div style={{ fontWeight: 'bold', color: '#003056', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                    Colores de Edificios
                  </div>
                  <div className="building-colors-grid">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(letter => (
                      <label key={letter} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px', fontSize: '14px', color: '#4b5563', padding: '4px 0' }}>
                        <input
                          type="checkbox"
                          checked={activeHighlights.includes(letter)}
                          onChange={() => toggleHighlight(letter)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: buildingColorsHex[letter] }}
                        />
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          backgroundColor: buildingColorsHex[letter],
                          border: '1px solid rgba(0,0,0,0.1)'
                        }} />
                        <span style={{ fontWeight: activeHighlights.includes(letter) ? 'bold' : 'normal', color: activeHighlights.includes(letter) ? '#003056' : '#4b5563' }}>
                          Edificio {letter}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              className={`icon-btn sidebar-btn ${visibilityFilter === 'public' ? 'sidebar-active active-filter' : ''}`}
              onClick={() => { setVisibilityFilter(visibilityFilter === 'public' ? 'all' : 'public'); setSelectedPin(null); }}
              title="Ver pines públicos"
            >
              <Globe size={24} />
              <span className="sidebar-tooltip">Pines Públicos</span>
            </button>
            <button
              className={`icon-btn sidebar-btn ${gpsEnabled ? 'sidebar-active active-filter' : ''}`}
              onClick={() => {
                if (gpsError && !gpsEnabled) toast.error(gpsError);
                setGpsEnabled(!gpsEnabled);
              }}
              title="Activar GPS"
            >
              <Navigation size={24} />
              <span className="sidebar-tooltip">Mi Ubicación</span>
            </button>
            <button
              className={`icon-btn sidebar-btn ${visibilityFilter === 'private' ? 'sidebar-active active-filter' : ''}`}
              onClick={() => {
                if (!currentUser) {
                  toast.error('Debes iniciar sesión para ver tus pines privados.');
                  return;
                }
                setVisibilityFilter(visibilityFilter === 'private' ? 'all' : 'private');
                setSelectedPin(null);
              }}
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
        </>
      )}

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

      {/* User Profile Panel */}
      {showProfile && (
        <UserProfile
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          userPins={userPins}
          userFavorites={userFavorites}
          setSelectedPin={setSelectedPin}
        />
      )}

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
              <h3 style={{ margin: 0 }}>Personalizar Ícono</h3>
            </div>
            <p className="action-modal-desc" style={{ marginBottom: '20px' }}>
              Selecciona un ícono para representar tu ubicación actual en el mapa.
            </p>

            <div className="icon-customizer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '4px 2px 4px 8px' }}>
              {locationIcons.map(icon => (
                <div
                  key={icon.id}
                  onClick={() => setUserLocationIcon(icon.id)}
                  className={`icon-option-card ${userLocationIcon === icon.id ? 'selected' : ''}`}
                >
                  <div className="icon-img-wrapper">
                    {icon.src ? (
                      <img src={icon.src} alt={icon.name} />
                    ) : (
                      <div className="default-icon-dot"></div>
                    )}
                  </div>
                  <span className="icon-name">
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

      {/* Interactive Map Area */}
      <div
        style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 1, cursor: markerMode || routeEditMode ? 'crosshair' : 'default' }}
        onClick={(e) => {
          if (routeEditMode) {
            const img = document.querySelector('.map-image');
            if (img) {
              const rect = img.getBoundingClientRect();
              if (
                e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom
              ) {
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                if (!deleteMode) {
                  // Auto-snap logic: check if there's a node within 1.5% distance
                  const SNAP_RADIUS = 1.5;
                  let closestNode = null;
                  let minDistance = SNAP_RADIUS;

                  graphNodes.forEach(node => {
                    const dist = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
                    if (dist < minDistance) {
                      minDistance = dist;
                      closestNode = node;
                    }
                  });

                  if (closestNode) {
                    if (selectedNodeId && selectedNodeId !== closestNode.id) {
                      const exists = graphEdges.find(ed => (ed.node1Id === selectedNodeId && ed.node2Id === closestNode.id) || (ed.node2Id === selectedNodeId && ed.node1Id === closestNode.id));
                      if (!exists) {
                        const newEdge = { id: Date.now().toString() + '_edge', node1Id: selectedNodeId, node2Id: closestNode.id };
                        const newEdges = [...graphEdges, newEdge];
                        setGraphEdges(newEdges);
                        saveToHistory(graphNodes, newEdges);
                      }
                    }
                    setSelectedNodeId(closestNode.id);
                  } else {
                    const newNode = { id: Date.now().toString(), x, y };
                    const newNodes = [...graphNodes, newNode];
                    let newEdges = [...graphEdges];

                    if (selectedNodeId) {
                      const newEdge = { id: Date.now().toString() + '_edge', node1Id: selectedNodeId, node2Id: newNode.id };
                      newEdges.push(newEdge);
                    }

                    setGraphNodes(newNodes);
                    setGraphEdges(newEdges);
                    saveToHistory(newNodes, newEdges);
                    setSelectedNodeId(newNode.id);
                  }
                }
              }
            }
            return;
          }

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
          initialScale={window.innerWidth > 768 ? 0.8 : 0.5}
          minScale={window.innerWidth > 768 ? 0.8 : 0.3}
          maxScale={5}
          centerOnInit={true}
          centerZoomedOut={true}
          limitToBounds={true}
          disabled={markerMode}
        >
          {({ zoomIn, zoomOut }) => (
            <React.Fragment>
              {/* Controles de Zoom para mapa principal */}
              <div className="floating-ui zoom-controls">
                <button className="icon-btn sidebar-btn" onClick={(e) => { e.stopPropagation(); zoomIn(0.2); }}>
                  <Plus size={24} />
                  <span className="sidebar-tooltip">Acercar</span>
                </button>
                <button className="icon-btn sidebar-btn" onClick={(e) => { e.stopPropagation(); zoomOut(0.2); }}>
                  <Minus size={24} />
                  <span className="sidebar-tooltip">Alejar</span>
                </button>
              </div>
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {/* Capas de edificios iluminados (se dibujan ABAJO del mapa base) */}
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(letter => (
                    <div
                      key={letter}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: buildingColorsHex[letter],
                        WebkitMaskImage: `url("${buildingMaps[letter]}")`,
                        maskImage: `url("${buildingMaps[letter]}")`,
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        pointerEvents: 'none',
                        opacity: activeHighlights.includes(letter) ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                        willChange: 'opacity',
                        zIndex: 1
                      }}
                    />
                  ))}
                  {/* Mapa base (las líneas del mapa cubrirán las máscaras de color) */}
                  <img
                    src={mapImage}
                    alt="Mapa Universitario"
                    className="map-image"
                    style={{ position: 'relative', display: 'block', zIndex: 2 }}
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
                        setMarkerMode(false);
                        setSelectedPin(null);
                      }}
                      title="Abrir Mapa de Rectoría"
                    >
                      <MapPin size={20} />
                    </button>
                  )}

                  {/* Route Editor SVGs */}
                  {routeEditMode && graphEdges.map(edge => {
                    const n1 = graphNodes.find(n => n.id === edge.node1Id);
                    const n2 = graphNodes.find(n => n.id === edge.node2Id);
                    if (!n1 || !n2) return null;
                    return (
                      <svg key={edge.id} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 11 }}>
                        <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="#E25E24" strokeWidth="0.3" opacity="0.8" />
                      </svg>
                    );
                  })}
                  {routeEditMode && graphNodes.map(node => {
                    const isDoor = userPins.some(p => p.entrance_node_id === node.id);
                    return (
                      <div
                        key={node.id}
                        style={{
                          position: 'absolute',
                          left: `${node.x}%`,
                          top: `${node.y}%`,
                          width: isDoor ? '14px' : '10px',
                          height: isDoor ? '14px' : '10px',
                          backgroundColor: selectedNodeId === node.id ? '#10b981' : (isDoor ? '#f59e0b' : '#3b82f6'),
                          border: '2px solid white',
                          borderRadius: isDoor ? '4px' : '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 12,
                          cursor: 'pointer',
                          boxShadow: '0 0 8px rgba(0,0,0,0.4)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deleteMode) {
                            const newNodes = graphNodes.filter(n => n.id !== node.id);
                            const newEdges = graphEdges.filter(edge => edge.node1Id !== node.id && edge.node2Id !== node.id);
                            setGraphNodes(newNodes);
                            setGraphEdges(newEdges);
                            saveToHistory(newNodes, newEdges);
                            if (selectedNodeId === node.id) setSelectedNodeId(null);
                          } else {
                            if (selectedNodeId && selectedNodeId !== node.id) {
                              const exists = graphEdges.find(ed => (ed.node1Id === selectedNodeId && ed.node2Id === node.id) || (ed.node2Id === selectedNodeId && ed.node1Id === node.id));
                              if (!exists) {
                                const newEdge = { id: Date.now().toString() + '_edge', node1Id: selectedNodeId, node2Id: node.id };
                                const newEdges = [...graphEdges, newEdge];
                                setGraphEdges(newEdges);
                                saveToHistory(graphNodes, newEdges);
                              }
                            }
                            setSelectedNodeId(node.id);
                          }
                        }}
                      />
                    )
                  })}

                  {/* Calculated Route SVG */}
                  {currentRoute && !routeEditMode && targetPin && (
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9 }}>
                      {/* Borde exterior suave (Google Maps style) */}
                      <polyline
                        points={[
                          `${userLocation ? userLocation.x : 21.875},${userLocation ? userLocation.y : 82.018}`,
                          ...currentRoute.map(n => `${n.x},${n.y}`)
                        ].join(' ')}
                        fill="none"
                        stroke="#1e40af"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
                      />
                      {/* Línea interior vibrante */}
                      <polyline
                        points={[
                          `${userLocation ? userLocation.x : 21.875},${userLocation ? userLocation.y : 82.018}`,
                          ...currentRoute.map(n => `${n.x},${n.y}`)
                        ].join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="0.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="1"
                      />
                    </svg>
                  )}

                  {/* Render dynamically fetched user Pins based on current building */}
                  {!routeEditMode && displayedPins.map(pin => (
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

                  {/* User Location */}
                  {userLocation && !currentBuilding && (() => {
                    const activeIcon = locationIcons.find(i => i.id === userLocationIcon) || locationIcons[0];
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${userLocation.x}%`,
                          top: `${userLocation.y}%`,
                          width: activeIcon.id === 'default' ? '18px' : '40px',
                          height: activeIcon.id === 'default' ? '18px' : '40px',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 20,
                          transition: 'left 1s linear, top 1s linear',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Tu Ubicación"
                      >
                        {activeIcon.id === 'default' ? (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%',
                            border: '3px solid white',
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                          }}>
                            <div className="gps-pulse"></div>
                          </div>
                        ) : (
                          <div style={{ position: 'relative', width: '100%', height: '100%', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' }}>
                            <img src={activeIcon.src} alt={activeIcon.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <div className="gps-pulse" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px' }}></div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      </div>

      {/* RECTORIA MODAL / OVERLAY */}
      {currentBuilding === 'rectoria' && (
        <div className="rectoria-modal">
          {/* Header */}
          <div className="rectoria-header">
            <div>
              <h2 className="rectoria-title">Edificio de Rectoría</h2>
              <span className="rectoria-subtitle">
                Plano de Planta - {selectedFloor === 'PB' ? 'P. Baja' : '1er Nivel'}
              </span>
            </div>

            <div className="rectoria-controls">
              {/* Floor Toggle */}
              <div className="rectoria-floor-toggle">
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
                className={`rectoria-action-btn ${markerMode ? 'active' : ''}`}
                onClick={() => {
                  if (!currentUser && !markerMode) {
                    toast.error('Debes iniciar sesión para crear pines.');
                    return;
                  }
                  setMarkerMode(!markerMode);
                }}
              >
                {markerMode ? <X size={16} /> : <Plus size={16} />}
                {markerMode ? 'Cancelar' : 'Agregar Pin'}
              </button>

              <button
                className="rectoria-close-btn"
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
              initialScale={1}
              minScale={1}
              maxScale={3}
              centerOnInit={true}
              centerZoomedOut={true}
              limitToBounds={false}
              disabled={markerMode}
            >
              {({ zoomIn, zoomOut }) => (
                <React.Fragment>
                  <div className="floating-ui zoom-controls" style={{ right: '40px', bottom: '40px' }}>
                    <button className="icon-btn sidebar-btn" onClick={(e) => { e.stopPropagation(); zoomIn(0.2); }}>
                      <Plus size={24} />
                      <span className="sidebar-tooltip">Acercar</span>
                    </button>
                    <button className="icon-btn sidebar-btn" onClick={(e) => { e.stopPropagation(); zoomOut(0.2); }}>
                      <Minus size={24} />
                      <span className="sidebar-tooltip">Alejar</span>
                    </button>
                  </div>
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                    <div className="rectoria-map-container">
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
                </React.Fragment>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}

      {/* Pin Details Modal (Bottom Sheet) */}
      {selectedPin && !isTraveling && (
        <div className="pin-details-sheet" style={{ zIndex: 1000 }}>
          <button className="close-sheet-btn" onClick={() => setSelectedPin(null)}>
            <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
            </span>
          </button>

          <button
            className="share-sheet-btn"
            onClick={() => handleSharePin(selectedPin)}
            title="Compartir Pin"
          >
            <Share2 size={14} />
          </button>

          <div className="sheet-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0 }}>{selectedPin.name}</h3>
              <button
                onClick={() => toggleFavorite(selectedPin.id)}
                title="Añadir a Favoritos"
                style={{
                  width: '28px', height: '28px', background: 'transparent', 
                  color: userFavorites.includes(selectedPin.id) ? '#ef4444' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none',
                  flexShrink: 0, padding: 0
                }}
              >
                <Heart size={16} fill={userFavorites.includes(selectedPin.id) ? '#ef4444' : 'none'} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <span className="sheet-subtitle" style={{ margin: 0 }}>
                {selectedPin.category ? selectedPin.category.toUpperCase() : 'SIN CATEGORÍA'}
              </span>
              {selectedPin.owner && (
                <span className="sheet-owner-text">
                  De: {selectedPin.owner}
                </span>
              )}
            </div>
          </div>

          {selectedPin.description && (
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginTop: '12px', marginBottom: '0' }}>
              {selectedPin.description}
            </p>
          )}

          <div className="sheet-stats">
            <div className="stat-box">
              <span className="stat-label">DISTANCIA</span>
              <span className="stat-value">{routeDistance > 0 ? `${routeDistance} m` : '---'}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">TIEMPO</span>
              <span className="stat-value">{routeTime > 0 ? `${routeTime} min` : '---'}</span>
            </div>
            {selectedPin.has_schedule && (
              <>
                <div className="stat-box">
                  <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> HORARIO
                  </span>
                  <span className="stat-value" style={{ fontSize: '14px' }}>
                    {selectedPin.open_time ? selectedPin.open_time.slice(0, 5) : '--:--'} - {selectedPin.close_time ? selectedPin.close_time.slice(0, 5) : '--:--'}
                  </span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">DÍAS</span>
                  <span className="stat-value" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                    {parseDays(selectedPin.available_days).join(', ')}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="sheet-actions-secondary" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {/* Private pin owned by the user: show Hacer Público + Borrar */}
            {currentUser && selectedPin.user_id === currentUser.id && !selectedPin.is_public ? (
              <>
                <button className="btn-secondary btn-public" onClick={() => {
                  setPublicPinData(selectedPin);
                  setShowMakePublicModal(true);
                  setSelectedPin(null);
                }}>
                  <Globe size={14} /> Hacer Público
                </button>
                <button className="btn-secondary btn-danger" onClick={() => setPinToDelete(selectedPin)}>
                  <Trash2 size={14} /> Borrar Pin
                </button>
              </>
            ) : (
              /* Public pin (even if owner sent it to review) or other user's pin: show Reportar */
              <button className="btn-report" onClick={() => { 
                if (!currentUser) {
                  toast.error('Debes iniciar sesión para reportar.');
                  return;
                }
                setReportPinData(selectedPin); setShowReportModal(true); setSelectedPin(null); 
              }}>
                <span style={{ display: 'flex', width: '14px', height: '14px', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={14} style={{ display: 'block', width: '14px', height: '14px' }} />
                </span>
                Reportar Pin
              </button>
            )}

            <button
              className="btn-primary-large"
              onClick={() => {
                setGpsEnabled(true);
                if (selectedPin.map_id === 'rectoria') {
                  setDestinationPin({
                    ...selectedPin,
                    x: 53.957,
                    y: 68.560,
                    x_coordinate: 53.957,
                    y_coordinate: 68.560,
                    map_id: 'main'
                  });
                } else {
                  setDestinationPin(selectedPin);
                }
                setIsTraveling(true);
                setIsTripBarMinimized(false);
                setSelectedPin(null);
                setCurrentBuilding(null);
              }}
            >
              <span style={{ display: 'flex', width: '16px', height: '16px', alignItems: 'center', justifyContent: 'center' }}>
                <Route size={16} style={{ display: 'block', width: '16px', height: '16px' }} />
              </span>
              Iniciar Recorrido
            </button>
          </div>
        </div>
      )}

      {/* Active Trip Card */}
      {isTraveling && destinationPin && (
        <div className={`active-trip-card floating-ui ${isTripBarMinimized ? 'minimized' : ''}`}>
          <div className="trip-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, cursor: isTripBarMinimized ? 'pointer' : 'default' }} onClick={() => isTripBarMinimized && setIsTripBarMinimized(false)}>
              <h3 style={{ margin: 0, fontSize: isTripBarMinimized ? '16px' : '18px', transition: 'all 0.2s' }}>
                En ruta hacia: {destinationPin.name}
              </h3>
              {!isTripBarMinimized && (
                <span className="trip-subtitle">{routeDistance > 0 ? `${routeDistance} metros restantes` : 'Calculando...'}</span>
              )}
            </div>
            <button 
              className="icon-btn" 
              style={{ 
                background: 'transparent', 
                color: 'var(--text-muted)', 
                boxShadow: 'none', 
                padding: '4px', 
                width: 'auto', 
                height: 'auto',
                marginLeft: '8px'
              }} 
              onClick={(e) => {
                e.stopPropagation();
                setIsTripBarMinimized(!isTripBarMinimized);
              }}
              title={isTripBarMinimized ? "Expandir" : "Minimizar"}
            >
              {isTripBarMinimized ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>
          
          {!isTripBarMinimized && (
            <>
              <div className="trip-stats">
                <div className="stat-box">
                  <span className="stat-label">DISTANCIA</span>
                  <span className="stat-value">{routeDistance > 0 ? `${routeDistance} m` : '---'}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">TIEMPO EST.</span>
                  <span className="stat-value">{routeTime > 0 ? `${routeTime} min` : '---'}</span>
                </div>
              </div>
              <button
                className="btn-cancel-trip"
                onClick={() => {
                  setIsTraveling(false);
                  setDestinationPin(null);
                  setIsTripBarMinimized(false);
                }}
              >
                <X size={18} /> Cancelar Viaje
              </button>
            </>
          )}
        </div>
      )}
      <MakePublicModal
        isOpen={showMakePublicModal}
        onClose={() => setShowMakePublicModal(false)}
        publicPinData={publicPinData}
        currentUser={currentUser}
        filters={filters}
      />

      <ReportPinModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportPinData={reportPinData}
        selectedPin={selectedPin}
        currentUser={currentUser}
      />

      <SharedPinReceptionModal
        isOpen={showSharedPinModal}
        onClose={() => { setShowSharedPinModal(false); setSharedPinData(null); }}
        sharedPinData={sharedPinData}
        currentUser={currentUser}
        fetchPins={fetchPins}
        setCurrentBuilding={setCurrentBuilding}
        setSelectedFloor={setSelectedFloor}
        setGpsEnabled={setGpsEnabled}
        setDestinationPin={setDestinationPin}
        setIsTraveling={setIsTraveling}
        setIsTripBarMinimized={setIsTripBarMinimized}
      />

      <BugReportModal
        isOpen={showBugReportModal}
        onClose={() => setShowBugReportModal(false)}
        currentUser={currentUser}
      />

      <ConfirmDeletePinModal
        pin={pinToDelete}
        onClose={() => setPinToDelete(null)}
        fetchPins={fetchPins}
        onPinDeleted={() => {
          if (selectedPin?.id === pinToDelete?.id) {
            setSelectedPin(null);
          }
        }}
      />
    </div>
  );
}

