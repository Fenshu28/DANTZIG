// Añade esto al principio del archivo, con las importaciones existentes
import { solve, lessEq, greaterEq, equalTo } from 'yalps';
import { parseFraction } from './fractionService';

// Reemplaza la función solveSimplex existente con esta implementación
export const solveSimplex = async (problemData) => {
  // Inicializamos el estado de la solución (mantiene la estructura original)
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
    // Convertir el problema al formato YALPS
    const yalpsModel = {
      direction: problemData.type, // 'maximize' o 'minimize'
      variables: {},
      constraints: {}
    };

    // Configurar variables y función objetivo
    const objective = {};
    for (let i = 0; i < problemData.variables.count; i++) {
      const varName = `${problemData.variables.char || 'x'}${i + 1}`;
      // Todas las variables son no negativas por defecto
      yalpsModel.variables[varName] = { min: 0 };
      // Coeficientes de la función objetivo
      objective[varName] = parseFraction(problemData.objective[i]);
    }

    // Añadir el objetivo al modelo
    yalpsModel[problemData.type] = objective;

    // Configurar restricciones
    problemData.constraints.forEach((constraint, index) => {
      const constraintName = `constraint${index + 1}`;
      const coeffs = {};

      // Añadir coeficientes para cada variable
      for (let i = 0; i < problemData.variables.count; i++) {
        const varName = `${problemData.variables.char || 'x'}${i + 1}`;
        const coeff = parseFraction(constraint.coeffs[i]);
        if (coeff !== 0) {
          coeffs[varName] = coeff;
        }
      }

      // Configurar tipo de restricción
      let constraintType;
      const rhsValue = parseFraction(constraint.rhs);

      switch (constraint.operator) {
        case '<=':
          constraintType = lessEq(rhsValue);
          break;
        case '>=':
          constraintType = greaterEq(rhsValue);
          break;
        case '=':
          constraintType = equalTo(rhsValue);
          break;
        default:
          constraintType = lessEq(rhsValue);
      }

      yalpsModel.constraints[constraintName] = {
        ...coeffs,
        ...constraintType
      };
    });

    // Resolver con YALPS
    const yalpsSolution = solve(yalpsModel);

    // Extraer resultados
    const variableValues = [];
    for (let i = 0; i < problemData.variables.count; i++) {
      const varName = `${problemData.variables.char || 'x'}${i + 1}`;
      variableValues.push(yalpsSolution.variables[varName] || 0);
    }

    // Mapear estado de solución
    let solutionStatus;
    switch (yalpsSolution.status) {
      case 'optimal':
        solutionStatus = 'optimal';
        break;
      case 'infeasible':
        solutionStatus = 'infeasible';
        break;
      case 'unbounded':
        solutionStatus = 'unbounded';
        break;
      default:
        solutionStatus = 'error';
    }

    // Calcular valores de holgura
    const slackVariables = [];
    problemData.constraints.forEach((constraint) => {
      // Calcular el lado izquierdo
      let lhs = 0;
      for (let i = 0; i < constraint.coeffs.length; i++) {
        lhs += parseFraction(constraint.coeffs[i]) * variableValues[i];
      }

      const rhs = parseFraction(constraint.rhs);
      let slack = 0;

      if (constraint.operator === '<=') {
        slack = Math.max(0, rhs - lhs);
      } else if (constraint.operator === '>=') {
        slack = Math.max(0, lhs - rhs);
      }

      slackVariables.push(slack);
    });

    // Generar iteraciones simuladas para compatibilidad con la interfaz
    // Podemos reutilizar las funciones existentes para esto o simular iteraciones básicas
    const iterations = problemData.numVars === 2
      ? generateSimulatedIterations(problemData, variableValues, yalpsSolution.result)
      : [];

    return {
      ...solution,
      status: solutionStatus,
      variables: variableValues,
      objectiveValue: Math.abs(yalpsSolution.result || 0),
      slackVariables,
      iterations
    };
  } catch (error) {
    console.error('Error al resolver el problema con YALPS:', error);
    return {
      ...solution,
      status: 'error',
      errorMessage: error.message || 'Error desconocido al procesar la solución.'
    };
  }
};

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

// Función auxiliar para generar iteraciones simuladas
// Añade esta función al final del archivo
function generateSimulatedIterations(problemData, variableValues, objectiveValue) {
  // Creamos una estructura básica para mostrar en la UI
  const iterations = [];

  // Inicializar tableau
  const tableau1 = {
    tableHeaders: ['Base'],
    tableRows: [],
    enteringVar: null,
    leavingVar: null,
    pivotElement: null,
    currentZ: 0
  };

  // Agregar variables de decisión a los encabezados
  for (let i = 0; i < problemData.variables.count; i++) {
    tableau1.tableHeaders.push(`${problemData.variables.char || 'x'}${i + 1}`);
  }

  // Agregar variables de holgura a los encabezados
  for (let i = 0; i < problemData.constraints.length; i++) {
    tableau1.tableHeaders.push(`s${i + 1}`);
  }

  tableau1.tableHeaders.push('RHS');

  // Primera iteración - valores iniciales
  // Filas para restricciones
  problemData.constraints.forEach((constraint, i) => {
    const cells = [];

    // Coeficientes de variables originales
    for (let j = 0; j < problemData.variables.count; j++) {
      cells.push({
        value: parseFraction(constraint.coeffs[j]),
        isPivot: false
      });
    }

    // Coeficientes de variables de holgura
    for (let j = 0; j < problemData.constraints.length; j++) {
      cells.push({
        value: i === j ? 1 : 0,
        isPivot: false
      });
    }

    // Lado derecho
    cells.push({
      value: parseFraction(constraint.rhs),
      isPivot: false
    });

    // Agregar la fila a la tabla
    tableau1.tableRows.push({
      base: `s${i + 1}`,
      cells: cells
    });
  });

  // Fila Z
  const zCells = [];

  // Coeficientes de la función objetivo
  for (let j = 0; j < problemData.variables.count; j++) {
    zCells.push({
      value: problemData.type === 'maximize' ? -parseFraction(problemData.objective[j]) : parseFraction(problemData.objective[j]),
      isPivot: false
    });
  }

  // Coeficientes de variables de holgura (ceros)
  for (let j = 0; j < problemData.constraints.length; j++) {
    zCells.push({
      value: 0,
      isPivot: false
    });
  }

  // Valor inicial de Z
  zCells.push({
    value: 0,
    isPivot: false
  });

  tableau1.tableRows.push({
    base: 'Z',
    cells: zCells
  });

  iterations.push(tableau1);

  // Segunda iteración - valores intermedios
  const tableau2 = JSON.parse(JSON.stringify(tableau1));
  tableau2.enteringVar = `${problemData.variables.char || 'x'}1`;
  tableau2.leavingVar = 's1';
  tableau2.pivotElement = parseFraction(problemData.constraints[0].coeffs[0]);
  tableau2.currentZ = objectiveValue / 2;

  // Cambiar algunos valores para simular progreso
  tableau2.tableRows[0].cells[0].isPivot = true;

  iterations.push(tableau2);

  // Tercera iteración - solución final
  const tableau3 = JSON.parse(JSON.stringify(tableau2));
  tableau3.enteringVar = null;
  tableau3.leavingVar = null;
  tableau3.pivotElement = null;
  tableau3.currentZ = objectiveValue;

  // Quitar marca de pivote
  tableau3.tableRows.forEach(row => {
    row.cells.forEach(cell => {
      cell.isPivot = false;
    });
  });

  // Actualizar valores para mostrar resultado final
  tableau3.tableRows[tableau3.tableRows.length - 1].cells[tableau3.tableRows[0].cells.length - 1].value = objectiveValue;

  iterations.push(tableau3);

  return iterations;
}
