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

export function calculateDistanceMap(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 1% of map roughly equals 7 meters based on calibration points.
export function mapDistanceToMeters(mapDist) {
  return mapDist * 7;
}

export function findShortestPath(nodes, edges, startNodeId, endNodeId) {
  if (!startNodeId || !endNodeId || !nodes.length) return null;

  const adjList = {};
  nodes.forEach(n => adjList[n.id] = []);
  
  edges.forEach(e => {
    const n1 = nodes.find(n => n.id === e.node1Id);
    const n2 = nodes.find(n => n.id === e.node2Id);
    if (n1 && n2) {
      const dist = calculateDistanceMap(n1, n2);
      adjList[e.node1Id].push({ id: e.node2Id, weight: dist });
      adjList[e.node2Id].push({ id: e.node1Id, weight: dist });
    }
  });

  const openSet = new Set([startNodeId]);
  const cameFrom = {};
  const gScore = {};
  const fScore = {};
  
  nodes.forEach(n => {
    gScore[n.id] = Infinity;
    fScore[n.id] = Infinity;
  });
  
  gScore[startNodeId] = 0;
  
  const endNode = nodes.find(n => n.id === endNodeId);
  if(!endNode) return null;
  
  fScore[startNodeId] = calculateDistanceMap(nodes.find(n => n.id === startNodeId), endNode);

  while (openSet.size > 0) {
    let current = null;
    let lowestFScore = Infinity;
    for (let nodeId of openSet) {
      if (fScore[nodeId] < lowestFScore) {
        lowestFScore = fScore[nodeId];
        current = nodeId;
      }
    }

    if (current === endNodeId) {
      const path = [current];
      while (cameFrom[current]) {
        current = cameFrom[current];
        path.unshift(current);
      }
      return path;
    }

    openSet.delete(current);
    if (!adjList[current]) continue;
    
    for (let neighbor of adjList[current]) {
      const tentativeGScore = gScore[current] + neighbor.weight;
      if (tentativeGScore < gScore[neighbor.id]) {
        cameFrom[neighbor.id] = current;
        gScore[neighbor.id] = tentativeGScore;
        fScore[neighbor.id] = gScore[neighbor.id] + calculateDistanceMap(nodes.find(n => n.id === neighbor.id), endNode);
        if (!openSet.has(neighbor.id)) {
          openSet.add(neighbor.id);
        }
      }
    }
  }
  
  return null;
}

export function findClosestNode(targetX, targetY, nodes) {
  if (!nodes || nodes.length === 0) return null;
  let closest = nodes[0];
  let minDistance = calculateDistanceMap({x: targetX, y: targetY}, closest);
  
  for (let i = 1; i < nodes.length; i++) {
    const dist = calculateDistanceMap({x: targetX, y: targetY}, nodes[i]);
    if (dist < minDistance) {
      minDistance = dist;
      closest = nodes[i];
    }
  }
  return closest;
}
