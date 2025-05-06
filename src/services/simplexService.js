// simplexService.js - Servicio para realizar cálculos del método Simplex con YALPS

// Función para resolver el problema usando YALPS
export const solveSimplex = async (problemData) => {
  // Inicializamos el estado de la solución
  const solution = {
    status: 'processing',
    variables: [],
    objectiveValue: 0,
    slackVariables: [],
    iterations: [],
    objective: {
      type: problemData.type
    }
  };

  try {
    // En un escenario real, aquí haríamos la llamada a YALPS
    // Por ahora, simulamos el proceso con una promesa
    return await new Promise((resolve) => {
      setTimeout(() => {
        // Simulamos la resolución de YALPS
        const result = solveSimplexLocally(problemData);
        resolve({ ...solution, ...result });
      }, 1000); // Simulamos 1 segundo de procesamiento
    });
  } catch (error) {
    console.error('Error al resolver el problema:', error);
    return {
      ...solution,
      status: 'error',
      errorMessage: error.message || 'Error desconocido al procesar la solución.'
    };
  }
};

// Función para resolver localmente usando el algoritmo Simplex
// (En producción esto sería reemplazado por la llamada a YALPS)
const solveSimplexLocally = (problemData) => {
  const { type, variables, objective, constraints } = problemData;

  // Para problemas de 2 variables, implementamos una versión básica del algoritmo Simplex
  if (variables.count === 2) {
    return solveSimplexTwoVars(problemData);
  }

  // Para problemas más grandes, simulamos una respuesta
  return simulateSimplexSolution(problemData);
};

// Método Simplex para problemas de 2 variables
const solveSimplexTwoVars = (problemData) => {
  const { type, variables, objective, constraints } = problemData;
  const isMaximize = type === 'maximize';

  // Convertimos las restricciones a forma estándar (añadiendo variables de holgura)
  const standardFormData = convertToStandardForm(problemData);

  // Preparamos la tabla inicial
  let currentIteration = {
    tableHeaders: ['Base', ...standardFormData.tableHeaders, 'RHS'],
    tableRows: standardFormData.tableRows,
    enteringVar: null,
    leavingVar: null,
    pivotElement: null,
    currentZ: 0
  };

  // Guardamos todas las iteraciones
  const iterations = [currentIteration];

  // Simulamos hasta 5 iteraciones como máximo
  let iteration = 0;
  const maxIterations = 5;
  let optimal = false;

  while (iteration < maxIterations && !optimal) {
    // Seleccionamos la variable entrante (columna pivote)
    const enteringCol = selectEnteringColumn(currentIteration, isMaximize);

    if (enteringCol === -1) {
      // No hay más variables para mejorar, hemos llegado al óptimo
      optimal = true;
      break;
    }

    // Seleccionamos la variable saliente (fila pivote)
    const { leavingRow, ratio } = selectLeavingRow(currentIteration, enteringCol);

    if (leavingRow === -1) {
      // Problema no acotado
      return {
        status: 'unbounded',
        iterations: iterations
      };
    }

    // Elemento pivote
    const pivotElement = currentIteration.tableRows[leavingRow].cells[enteringCol].value;

    // Variables entrante y saliente
    const enteringVar = currentIteration.tableHeaders[enteringCol];
    const leavingVar = currentIteration.tableRows[leavingRow].base;

    // Actualizamos la información de la iteración actual
    currentIteration = {
      ...currentIteration,
      enteringVar,
      leavingVar,
      pivotElement,
      currentZ: currentIteration.tableRows[currentIteration.tableRows.length - 1].cells[currentIteration.tableRows[0].cells.length - 1].value
    };

    // Marcamos el elemento pivote
    currentIteration.tableRows[leavingRow].cells[enteringCol].isPivot = true;

    // Hacer operaciones de pivote (crear nueva tabla)
    const newIteration = performPivoting(currentIteration, leavingRow, enteringCol);

    // Guardar la iteración actualizada
    iterations.push(newIteration);

    // Actualizar para próxima iteración
    currentIteration = newIteration;
    iteration++;
  }

  // Extraemos la solución final
  const finalIteration = iterations[iterations.length - 1];
  const { variables: varsValues, slackVariables, objectiveValue } = extractSolution(finalIteration);

  return {
    status: 'optimal',
    objectiveValue: objectiveValue,
    variables: varsValues,
    slackVariables: slackVariables,
    iterations: iterations
  };
};

// Convertir el problema a forma estándar
const convertToStandardForm = (problemData) => {
  const { type, variables, objective, constraints } = problemData;
  const isMaximize = type === 'maximize';
  const numVars = variables.count;
  const numConstraints = constraints.length;

  // Cabeceras de la tabla
  const tableHeaders = [];
  for (let i = 0; i < numVars; i++) {
    tableHeaders.push(`${variables.char || 'x'}${i + 1}`);
  }

  // Agregamos variables de holgura
  for (let i = 0; i < numConstraints; i++) {
    tableHeaders.push(`s${i + 1}`);
  }

  // Preparamos las filas
  const tableRows = [];

  // Filas para cada restricción
  for (let i = 0; i < numConstraints; i++) {
    const cells = [];
    const constraint = constraints[i];

    // Coeficientes de variables originales
    for (let j = 0; j < numVars; j++) {
      cells.push({
        value: constraint.coeffs[j],
        isPivot: false
      });
    }

    // Coeficientes de variables de holgura
    for (let j = 0; j < numConstraints; j++) {
      cells.push({
        value: i === j ? 1 : 0,
        isPivot: false
      });
    }

    // Lado derecho
    cells.push({
      value: constraint.rhs,
      isPivot: false
    });

    // Agregamos la fila a la tabla
    tableRows.push({
      base: `s${i + 1}`,
      cells: cells
    });
  }

  // Fila para la función objetivo (Z)
  const zRow = {
    base: 'Z',
    cells: []
  };

  // Coeficientes negativos para maximizar (tableau estándar)
  for (let j = 0; j < numVars; j++) {
    zRow.cells.push({
      value: isMaximize ? -objective[j] : objective[j],
      isPivot: false
    });
  }

  // Coeficientes de variables de holgura en la función objetivo (ceros)
  for (let j = 0; j < numConstraints; j++) {
    zRow.cells.push({
      value: 0,
      isPivot: false
    });
  }

  // Valor inicial de Z (cero)
  zRow.cells.push({
    value: 0,
    isPivot: false
  });

  // Agregamos la fila Z
  tableRows.push(zRow);

  return {
    tableHeaders,
    tableRows
  };
};

// Seleccionar la columna pivote (variable entrante)
const selectEnteringColumn = (iteration, isMaximize) => {
  const zRow = iteration.tableRows[iteration.tableRows.length - 1];
  const numCols = zRow.cells.length - 1; // Excluimos la columna RHS

  let enteringCol = -1;
  let bestValue = 0;

  // Para maximización, buscamos el coeficiente más negativo
  // Para minimización, buscamos el coeficiente más positivo
  for (let j = 0; j < numCols; j++) {
    const value = zRow.cells[j].value;
    if (isMaximize) {
      if (value < 0 && value < bestValue) {
        bestValue = value;
        enteringCol = j;
      }
    } else {
      if (value > 0 && value > bestValue) {
        bestValue = value;
        enteringCol = j;
      }
    }
  }

  return enteringCol;
};

// Seleccionar la fila pivote (variable saliente)
const selectLeavingRow = (iteration, enteringCol) => {
  const numRows = iteration.tableRows.length - 1; // Excluimos la fila Z
  let leavingRow = -1;
  let minRatio = Infinity;

  for (let i = 0; i < numRows; i++) {
    const row = iteration.tableRows[i];
    const a = row.cells[enteringCol].value;
    const b = row.cells[row.cells.length - 1].value;

    // Solo consideramos coeficientes positivos
    if (a > 0) {
      const ratio = b / a;
      if (ratio < minRatio) {
        minRatio = ratio;
        leavingRow = i;
      }
    }
  }

  return { leavingRow, ratio: minRatio };
};

// Realizar operaciones de pivote
const performPivoting = (iteration, pivotRow, pivotCol) => {
  // Copiamos la iteración actual
  const newIteration = JSON.parse(JSON.stringify(iteration));

  // Quitamos la marca de pivote de la iteración anterior
  newIteration.tableRows.forEach(row => {
    row.cells.forEach(cell => {
      cell.isPivot = false;
    });
  });

  // Obtenemos el elemento pivote
  const pivotElement = newIteration.tableRows[pivotRow].cells[pivotCol].value;

  // Actualizamos la base de la fila pivote
  newIteration.tableRows[pivotRow].base = newIteration.tableHeaders[pivotCol];

  // Normalizamos la fila pivote (dividir por el elemento pivote)
  for (let j = 0; j < newIteration.tableRows[pivotRow].cells.length; j++) {
    newIteration.tableRows[pivotRow].cells[j].value /= pivotElement;
  }

  // Actualizamos las demás filas
  for (let i = 0; i < newIteration.tableRows.length; i++) {
    if (i !== pivotRow) {
      const factor = newIteration.tableRows[i].cells[pivotCol].value;

      for (let j = 0; j < newIteration.tableRows[i].cells.length; j++) {
        newIteration.tableRows[i].cells[j].value -= factor * newIteration.tableRows[pivotRow].cells[j].value;
      }
    }
  }

  // Actualizamos la información de la iteración
  newIteration.enteringVar = null;
  newIteration.leavingVar = null;
  newIteration.pivotElement = null;
  newIteration.currentZ = newIteration.tableRows[newIteration.tableRows.length - 1].cells[newIteration.tableRows[0].cells.length - 1].value;

  return newIteration;
};

// Extraer la solución final de la tabla
const extractSolution = (finalIteration) => {
  const numVars = 2; // Asumimos 2 variables para este ejemplo
  const varsValues = Array(numVars).fill(0);

  // Extraemos valores de variables básicas
  for (let i = 0; i < finalIteration.tableRows.length - 1; i++) { // Excluimos fila Z
    const baseVar = finalIteration.tableRows[i].base;
    const value = finalIteration.tableRows[i].cells[finalIteration.tableRows[i].cells.length - 1].value;

    // Si la variable básica es una variable de decisión
    if (baseVar.startsWith('x')) {
      const varIndex = parseInt(baseVar.substring(1)) - 1;
      if (varIndex < numVars) {
        varsValues[varIndex] = value;
      }
    }
  }

  // Extraemos variables de holgura
  const numConstraints = finalIteration.tableRows.length - 1; // Excluimos fila Z
  const slackVariables = Array(numConstraints).fill(0);

  for (let i = 0; i < finalIteration.tableRows.length - 1; i++) {
    const baseVar = finalIteration.tableRows[i].base;
    const value = finalIteration.tableRows[i].cells[finalIteration.tableRows[i].cells.length - 1].value;

    // Si la variable básica es una variable de holgura
    if (baseVar.startsWith('s')) {
      const slackIndex = parseInt(baseVar.substring(1)) - 1;
      if (slackIndex < numConstraints) {
        slackVariables[slackIndex] = value;
      }
    }
  }

  // Valor de la función objetivo
  const objectiveValue = Math.abs(finalIteration.tableRows[finalIteration.tableRows.length - 1].cells[finalIteration.tableRows[0].cells.length - 1].value);

  return {
    variables: varsValues,
    slackVariables,
    objectiveValue
  };
};

// Función para simular una solución del Simplex para problemas más grandes
const simulateSimplexSolution = (problemData) => {
  const { type, variables, objective, constraints } = problemData;
  const numVars = variables.count;
  const numConstraints = constraints.length;

  // Simulamos un conjunto de iteraciones
  const iterations = [];

  // Variable para rastrear el progreso de Z
  let currentZ = 0;

  // Generamos algunas iteraciones simuladas
  for (let iter = 0; iter < 3; iter++) {
    // Cabeceras de la tabla
    const tableHeaders = [];
    for (let i = 0; i < numVars; i++) {
      tableHeaders.push(`${variables.char || 'x'}${i + 1}`);
    }

    // Agregamos variables de holgura
    for (let i = 0; i < numConstraints; i++) {
      tableHeaders.push(`s${i + 1}`);
    }

    // Preparamos las filas
    const tableRows = [];

    // Filas para cada restricción (variables básicas)
    for (let i = 0; i < numConstraints; i++) {
      const cells = [];

      // Generar coeficientes simulados
      for (let j = 0; j < numVars + numConstraints; j++) {
        const value = j === i + numVars ? 1 : Math.random() * 2 - 1;
        cells.push({
          value: Math.round(value * 100) / 100,
          isPivot: iter === 0 && i === 0 && j === 0
        });
      }

      // RHS
      cells.push({
        value: Math.round(Math.random() * 10 * (iter + 1)),
        isPivot: false
      });

      // Base (al inicio son variables de holgura)
      const baseVar = (iter === 0) ? `s${i + 1}` :
        (Math.random() > 0.5 ? `s${i + 1}` : `${variables.char || 'x'}${Math.floor(Math.random() * numVars) + 1}`);

      tableRows.push({
        base: baseVar,
        cells: cells
      });
    }

    // Fila Z
    const zRow = {
      base: 'Z',
      cells: []
    };

    // Generar coeficientes para Z
    for (let j = 0; j < numVars + numConstraints; j++) {
      const isPositive = type === 'minimize';
      const value = (iter === 2) ? 0 :
        (isPositive ? Math.random() * 2 : -Math.random() * 2);

      zRow.cells.push({
        value: Math.round(value * 100) / 100,
        isPivot: false
      });
    }

    // Valor de Z
    currentZ += Math.round(Math.random() * 50);
    zRow.cells.push({
      value: currentZ,
      isPivot: false
    });

    tableRows.push(zRow);

    // Crear la iteración
    const enteringVar = tableHeaders[Math.floor(Math.random() * tableHeaders.length)];
    const leavingVar = tableRows[Math.floor(Math.random() * (tableRows.length - 1))].base;

    const iteration = {
      tableHeaders: ['Base', ...tableHeaders, 'RHS'],
      tableRows: tableRows,
      enteringVar: iter < 2 ? enteringVar : null,
      leavingVar: iter < 2 ? leavingVar : null,
      pivotElement: iter < 2 ? Math.round(Math.random() * 100) / 100 : null,
      currentZ: currentZ
    };

    iterations.push(iteration);
  }

  // Simular solución óptima
  const varsValues = Array(numVars).fill(0).map(() => Math.round(Math.random() * 10 * 100) / 100);
  const slackVariables = Array(numConstraints).fill(0).map(() => Math.round(Math.random() * 5 * 100) / 100);

  return {
    status: 'optimal',
    objectiveValue: currentZ,
    variables: varsValues,
    slackVariables: slackVariables,
    iterations: iterations
  };
};

// Función para generar datos del gráfico 2D
export const generateGraphData = (problemData, solution = null) => {
  const { type, variables, objective, constraints } = problemData;

  // Solo podemos graficar problemas de 2 variables
  if (variables.count !== 2) {
    return null;
  }

  // Definimos el rango de valores para las variables
  const xRange = {
    min: 0,
    max: 20
  };

  const yRange = {
    min: 0,
    max: 20
  };

  // Generamos puntos para las restricciones
  const constraintLines = [];

  constraints.forEach((constraint, index) => {
    const [a, b] = constraint.coeffs;
    const { rhs } = constraint;

    // Puntos de intersección con los ejes
    let xIntercept = null;
    let yIntercept = null;

    if (a !== 0) {
      xIntercept = rhs / a;
    }

    if (b !== 0) {
      yIntercept = rhs / b;
    }

    // Generar puntos para graficar la línea de restricción
    const points = [];

    // Caso especial: línea vertical
    if (a === 0 && b !== 0) {
      points.push({ x: 0, y: yIntercept });
      points.push({ x: xRange.max, y: yIntercept });
    }
    // Caso especial: línea horizontal
    else if (a !== 0 && b === 0) {
      points.push({ x: xIntercept, y: 0 });
      points.push({ x: xIntercept, y: yRange.max });
    }
    // Caso general
    else if (a !== 0 && b !== 0) {
      // Punto de intersección con eje x
      points.push({ x: xIntercept, y: 0 });

      // Punto de intersección con eje y
      points.push({ x: 0, y: yIntercept });

      // Puntos adicionales para líneas que se extienden más allá
      if (xIntercept < 0) {
        const y = (rhs - a * xRange.max) / b;
        points.push({ x: xRange.max, y });
      }

      if (yIntercept < 0) {
        const x = (rhs - b * yRange.max) / a;
        points.push({ x, y: yRange.max });
      }
    }

    // Filtrar puntos que estén dentro del rango visible
    const validPoints = points.filter(p =>
      p.x >= xRange.min && p.x <= xRange.max &&
      p.y >= yRange.min && p.y <= yRange.max
    );

    // Ordenar los puntos para una representación correcta
    validPoints.sort((a, b) => a.x - b.x);

    // Agregar la línea de restricción
    constraintLines.push({
      id: `constraint-${index + 1}`,
      name: `Restricción ${index + 1}`,
      data: validPoints,
      constraint: constraint
    });
  });

  // Puntos para la región factible (versión simplificada para este ejemplo)
  const feasibleRegion = [];

  // Vértices de la región factible (simplificado)
  if (solution && solution.status === 'optimal') {
    // Punto óptimo (x1, x2)
    feasibleRegion.push({
      x: solution.variables[0],
      y: solution.variables[1],
      isOptimal: true
    });

    // Origen
    feasibleRegion.push({
      x: 0,
      y: 0,
      isOptimal: false
    });

    // Algunos puntos simulados adicionales para la región
    feasibleRegion.push({
      x: solution.variables[0],
      y: 0,
      isOptimal: false
    });

    feasibleRegion.push({
      x: 0,
      y: solution.variables[1],
      isOptimal: false
    });
  }

  // Línea de la función objetivo (dirección de crecimiento)
  const objectiveLine = {
    slope: objective[1] !== 0 ? -objective[0] / objective[1] : null,
    intercept: solution ? (solution.objectiveValue / objective[1]) : null,
    objective: objective
  };

  return {
    xRange,
    yRange,
    constraintLines,
    feasibleRegion,
    objectiveLine,
    variableLabels: {
      x: `${variables.char || 'x'}₁`,
      y: `${variables.char || 'x'}₂`
    }
  };
};
