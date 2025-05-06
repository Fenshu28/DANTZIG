// graphProvider.js - Servicio para proporcionar diferentes visualizaciones de gráficos
// Este archivo centraliza la lógica de visualización y facilita la integración futura de gráficos 3D

// Importamos las funciones para generar datos de gráficos 2D
import { generateGraphData } from './simplexService';

// Constante para determinar si el 3D está disponible
// En el futuro, esto podría ser reemplazado por una comprobación real
const IS_3D_AVAILABLE = false;

/**
 * Verifica si un problema puede ser visualizado gráficamente
 * @param {Object} problem - Los datos del problema
 * @returns {Object} Objeto con información sobre la visualización
 */
export const canVisualizeProblem = (problem) => {
  if (!problem) {
    return {
      can2D: false,
      can3D: false,
      message: "No hay datos del problema para visualizar."
    };
  }

  const numVars = problem.numVars || 0;

  // Verificar visualización 2D
  const can2D = numVars === 2;

  // Verificar visualización 3D (futuro)
  const can3D = IS_3D_AVAILABLE && numVars === 3;

  let message = "";
  if (!can2D && !can3D) {
    message = "Este problema no puede ser visualizado gráficamente. La visualización está disponible solo para problemas de 2 variables (2D)."
      + (IS_3D_AVAILABLE ? " o 3 variables (3D)." : " Por ahora.");
  }

  return {
    can2D,
    can3D,
    message
  };
};

/**
 * Genera un objeto de configuración para la renderización de gráficos
 * @param {Object} problem - Los datos del problema
 * @param {Object} solution - Los datos de la solución
 * @param {String} type - Tipo de gráfico ('2d' o '3d')
 * @returns {Object} Configuración para renderizar el gráfico
 */
export const getGraphConfig = (problem, solution, type = '2d') => {
  // Por ahora, solo tenemos soporte para 2D
  if (type === '2d') {
    return {
      data: generateGraphData(problem, solution),
      renderer: '2d-canvas'
    };
  } else if (type === '3d' && IS_3D_AVAILABLE) {
    // En el futuro, aquí importaríamos funciones para generar datos 3D
    // Por ahora, devolvemos null para indicar que no está disponible
    return null;
  }

  return null;
};

/**
 * Devuelve las opciones de visualización disponibles para un problema
 * @param {Object} problem - Los datos del problema
 * @returns {Array} Lista de opciones de visualización disponibles
 */
export const getVisualizationOptions = (problem) => {
  const { can2D, can3D } = canVisualizeProblem(problem);

  const options = [];

  if (can2D) {
    options.push({
      id: '2d',
      name: 'Visualización 2D',
      description: 'Muestra la región factible, restricciones y punto óptimo en un plano cartesiano.'
    });
  }

  if (can3D) {
    options.push({
      id: '3d',
      name: 'Visualización 3D',
      description: 'Muestra la región factible y punto óptimo en un espacio tridimensional.'
    });
  }

  // Siempre incluimos la opción de iteraciones
  options.push({
    id: 'iterations',
    name: 'Tablas de Iteraciones',
    description: 'Muestra las iteraciones del algoritmo simplex en forma tabular.'
  });

  return options;
};

/**
 * Carga la biblioteca 3D necesaria (para uso futuro)
 * @returns {Promise} Promesa que se resuelve cuando la biblioteca está cargada
 */
export const load3DLibrary = async () => {
  // Esta función cargará la biblioteca 3D cuando esté disponible
  // Por ahora, simplemente devuelve una promesa rechazada
  return new Promise((resolve, reject) => {
    reject(new Error('La visualización 3D no está disponible actualmente.'));
  });
};

/**
 * Preparar los datos para la visualización 3D (para uso futuro)
 * @param {Object} problem - Los datos del problema
 * @param {Object} solution - Los datos de la solución
 * @returns {Object} Datos para la visualización 3D
 */
export const prepare3DData = (problem, solution) => {
  // Esta función preparará los datos para la visualización 3D cuando esté disponible
  // Por ahora, simplemente devuelve null
  return null;
};

// Exportamos un objeto con todas las funciones relacionadas con la visualización
export default {
  canVisualizeProblem,
  getGraphConfig,
  getVisualizationOptions,
  load3DLibrary,
  prepare3DData
};
