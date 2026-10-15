import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de carga
export const options = {
  stages: [
    { duration: '10s', target: 5 },  // Calentamiento: subir a 5 usuarios virtuales
    { duration: '20s', target: 10 }, // Carga sostenida: 10 usuarios concurrentes
    { duration: '10s', target: 0 },  // Enfriamiento: descender a 0
  ],
  thresholds: {
    // El 95% de las peticiones deben responder en menos de 800ms
    http_req_duration: ['p(95)<800'],
    // La tasa de fallo debe ser menor al 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'https://uxuivgazwybtfrelwaxc.supabase.co';
const ANON_KEY = 'sb_publishable_8yXULLzgA_RflwtyUKOfmw_5HKxDno8';

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

export default function () {
  // 1. Simulación de carga del mapa: consulta real de pines
  const resPins = http.get(`${BASE_URL}/rest/v1/pins?select=id,name,category,x_coordinate,y_coordinate&limit=20`, {
    headers: headers,
    tags: { name: 'GetPins' },
  });

  check(resPins, {
    'GetPins status es 200': (r) => r.status === 200,
    'GetPins tiempo < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5); // Pausa de navegación simulada

  // 2. Consulta rápida de verificación
  const resHealth = http.get(`${BASE_URL}/rest/v1/pins?select=id&limit=1`, {
    headers: headers,
    tags: { name: 'HealthCheck' },
  });

  check(resHealth, {
    'HealthCheck status es 200': (r) => r.status === 200,
  });

  sleep(1);
}
