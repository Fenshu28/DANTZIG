// fractionService.js - Servicio para manejar fracciones en la aplicación

/**
 * Convierte una cadena que puede contener una fracción a número decimal
 * Acepta formatos como "1/2", "1.5", "-3/4", etc.
 * @param {string} value - Cadena a convertir
 * @returns {number|null} - Valor numérico o null si es inválido
 */
export const parseFraction = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Si ya es un número, devolverlo directamente
  if (typeof value === 'number') {
    return value;
  }

  // Eliminar espacios en blanco
  const trimmedValue = String(value).trim();

  // Verificar si es un número decimal normal
  if (!isNaN(trimmedValue) && trimmedValue !== '') {
    return Number(trimmedValue);
  }

  // Verificar si es una fracción con formato "a/b"
  const fractionRegex = /^-?\d+\/\d+$/;
  if (fractionRegex.test(trimmedValue)) {
    const parts = trimmedValue.split('/');
    const numerator = parseInt(parts[0], 10);
    const denominator = parseInt(parts[1], 10);

    // Evitar división por cero
    if (denominator === 0) {
      return null;
    }

    return numerator / denominator;
  }

  // Si llega aquí, el formato no es válido
  return null;
};

/**
 * Convierte un número decimal a su representación fraccionaria más simple
 * @param {number} value - Número decimal a convertir
 * @param {number} tolerance - Tolerancia para aproximar fracciones (por defecto 1e-6)
 * @returns {string} - Representación como fracción o número decimal
 */
export const toFractionString = (value, tolerance = 1e-6) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  // Si es un número entero, devolverlo como tal
  if (Number.isInteger(value)) {
    return value.toString();
  }

  // Para números muy pequeños o muy grandes, mantener notación decimal
  if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
    return value.toFixed(4);
  }

  // Algoritmo para encontrar la fracción más cercana con tolerancia
  const sign = value < 0 ? -1 : 1;
  const absValue = Math.abs(value);

  let n = 1;
  let d = 1;

  // Algoritmo de aproximación de fracciones
  // (variante simplificada del algoritmo de fracciones continuas)
  let bestError = Math.abs(absValue - n / d);

  for (let denominator = 1; denominator <= 100; denominator++) {
    const numerator = Math.round(absValue * denominator);
    const error = Math.abs(absValue - numerator / denominator);

    if (error < bestError) {
      bestError = error;
      n = numerator;
      d = denominator;

      // Si el error es menor que la tolerancia, hemos encontrado una buena aproximación
      if (error < tolerance) {
        break;
      }
    }
  }

  // Si es una fracción simple, devolver en formato fraccionario
  if (d === 1) {
    return (sign * n).toString();
  } else if (bestError < tolerance) {
    return (sign < 0 ? '-' : '') + (n + '/' + d);
  }

  // Si no se puede aproximar bien como fracción, devolver decimal con 2 decimales
  return (sign * absValue).toFixed(2);
};

/**
 * Determina si una cadena es una fracción válida
 * @param {string} value - Cadena a verificar
 * @returns {boolean} - True si es una fracción válida, False en caso contrario
 */
export const isValidFraction = (value) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  // Eliminar espacios en blanco
  const trimmedValue = String(value).trim();

  // Verificar si es un número decimal
  if (!isNaN(trimmedValue) && trimmedValue !== '') {
    return true;
  }

  // Verificar si es una fracción con formato "a/b"
  const fractionRegex = /^-?\d+\/\d+$/;
  if (fractionRegex.test(trimmedValue)) {
    const parts = trimmedValue.split('/');
    const denominator = parseInt(parts[1], 10);

    // Verificar que el denominador no sea cero
    return denominator !== 0;
  }

  return false;
};

/**
 * Valida un array de valores que pueden ser fracciones
 * @param {Array} values - Array de valores a validar
 * @returns {boolean} - True si todos los valores son válidos
 */
export const validateFractionArray = (values) => {
  if (!Array.isArray(values)) {
    return false;
  }

  return values.every(val => {
    if (typeof val === 'number') {
      return !isNaN(val);
    }
    return isValidFraction(val);
  });
};
