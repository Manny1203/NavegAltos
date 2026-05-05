/**
 * Funciones de utilidad para calibración geométrica de GPS.
 * Utiliza Transformación Afín 2D (Affine Transformation) para mapear
 * coordenadas globales (Latitud, Longitud) a porcentajes 2D en una imagen (X, Y).
 */

export function calculateAffineCoefficients(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return null;

  // El sistema resuelve:
  // X = A*lat + B*lng + C
  // Y = D*lat + E*lng + F
  
  const denom = p1.lat * (p2.lng - p3.lng) + p2.lat * (p3.lng - p1.lng) + p3.lat * (p1.lng - p2.lng);
  
  if (denom === 0) {
    console.error("Los 3 puntos de anclaje son colineales (están en línea recta). Necesitan formar un triángulo para calibrar.");
    return null;
  }

  const A = (p1.x * (p2.lng - p3.lng) + p2.x * (p3.lng - p1.lng) + p3.x * (p1.lng - p2.lng)) / denom;
  const B = (p1.x * (p3.lat - p2.lat) + p2.x * (p1.lat - p3.lat) + p3.x * (p2.lat - p1.lat)) / denom;
  const C = (p1.x * (p2.lat * p3.lng - p3.lat * p2.lng) + p2.x * (p3.lat * p1.lng - p1.lat * p3.lng) + p3.x * (p1.lat * p2.lng - p2.lat * p1.lng)) / denom;

  const D = (p1.y * (p2.lng - p3.lng) + p2.y * (p3.lng - p1.lng) + p3.y * (p1.lng - p2.lng)) / denom;
  const E = (p1.y * (p3.lat - p2.lat) + p2.y * (p1.lat - p3.lat) + p3.y * (p2.lat - p1.lat)) / denom;
  const F = (p1.y * (p2.lat * p3.lng - p3.lat * p2.lng) + p2.y * (p3.lat * p1.lng - p1.lat * p3.lng) + p3.y * (p1.lat * p2.lng - p2.lat * p1.lng)) / denom;

  return { A, B, C, D, E, F };
}

export function transformCoordinates(lat, lng, coeffs) {
  if (!coeffs) return null;
  return {
    x: coeffs.A * lat + coeffs.B * lng + coeffs.C,
    y: coeffs.D * lat + coeffs.E * lng + coeffs.F
  };
}
