<!-- SimplexInterface.vue (actualizado) - Interfaz mejorada para el método simplex con soporte de fracciones -->

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import SimplexSolution from './SimplexSolution.vue';
import { solveSimplex } from '../services/simplexService';
import { parseFraction, isValidFraction } from '../services/fractionService';

// Configuración del problema
const problemConfig = reactive({
  objective: {
    type: 'maximize'
  },
  variableChar: 'x',
  method: 'simplex',
  numVars: 2,
  numConstraints: 3,
  displayAsFraction: true // Nueva propiedad para controlar si se muestran fracciones
});

// Estado de la interfaz
const showSolution = ref(false);
const solutionData = ref({});
const isProcessing = ref(false);

// Matriz de coeficientes (almacenados como strings para mantener formato de fracción)
const coeffMatrix = reactive({
  objective: ['3', '5'],
  constraints: [
    { coeffs: ['1', '0'], operator: '<=', rhs: '4' },
    { coeffs: ['0', '2'], operator: '<=', rhs: '12' },
    { coeffs: ['3', '2'], operator: '<=', rhs: '18' }
  ]
});

// Computed properties
const isValidProblem = computed(() => {
  // Verificar que la función objetivo tenga valores válidos
  const hasValidObjective = coeffMatrix.objective.every(val => isValidFraction(val));

  // Verificar que todas las restricciones tengan valores válidos
  const hasValidConstraints = coeffMatrix.constraints.every(constraint => {
    return constraint.coeffs.every(val => isValidFraction(val)) && isValidFraction(constraint.rhs);
  });

  return hasValidObjective && hasValidConstraints;
});

// Métodos
const updateProblemDimensions = () => {
  // Asegurar que los valores son válidos
  if (problemConfig.numVars < 1) problemConfig.numVars = 1;
  if (problemConfig.numConstraints < 1) problemConfig.numConstraints = 1;

  // Actualizar la matriz de coeficientes
  // Función objetivo
  if (coeffMatrix.objective.length < problemConfig.numVars) {
    // Agregar nuevos coeficientes
    const newCoeffs = Array(problemConfig.numVars - coeffMatrix.objective.length).fill('0');
    coeffMatrix.objective = [...coeffMatrix.objective, ...newCoeffs];
  } else if (coeffMatrix.objective.length > problemConfig.numVars) {
    // Reducir coeficientes
    coeffMatrix.objective = coeffMatrix.objective.slice(0, problemConfig.numVars);
  }

  // Restricciones
  if (coeffMatrix.constraints.length < problemConfig.numConstraints) {
    // Agregar nuevas restricciones
    const newConstraints = Array(problemConfig.numConstraints - coeffMatrix.constraints.length)
      .fill()
      .map(() => ({
        coeffs: Array(problemConfig.numVars).fill('0'),
        operator: '<=',
        rhs: '0'
      }));

    coeffMatrix.constraints = [...coeffMatrix.constraints, ...newConstraints];
  } else if (coeffMatrix.constraints.length > problemConfig.numConstraints) {
    // Reducir restricciones
    coeffMatrix.constraints = coeffMatrix.constraints.slice(0, problemConfig.numConstraints);
  }

  // Actualizar coeficientes de cada restricción
  coeffMatrix.constraints.forEach(constraint => {
    if (constraint.coeffs.length < problemConfig.numVars) {
      // Agregar nuevos coeficientes
      const newCoeffs = Array(problemConfig.numVars - constraint.coeffs.length).fill('0');
      constraint.coeffs = [...constraint.coeffs, ...newCoeffs];
    } else if (constraint.coeffs.length > problemConfig.numVars) {
      // Reducir coeficientes
      constraint.coeffs = constraint.coeffs.slice(0, problemConfig.numVars);
    }
  });
};

const resetMatrix = () => {
  showSolution.value = false;
  // Reiniciar todos los coeficientes a cero
  coeffMatrix.objective = Array(problemConfig.numVars).fill('0');

  coeffMatrix.constraints = Array(problemConfig.numConstraints).fill().map(() => ({
    coeffs: Array(problemConfig.numVars).fill('0'),
    operator: '<=',
    rhs: '0'
  }));
};

const generateExample = () => {
  // Cargar un ejemplo predefinido según el número de variables
  if (problemConfig.numVars === 2) {
    // Ejemplo clásico de 2 variables con fracciones
    problemConfig.objective.type = 'maximize';
    coeffMatrix.objective = ['3', '5'];
    coeffMatrix.constraints = [
      { coeffs: ['1', '0'], operator: '<=', rhs: '4' },
      { coeffs: ['0', '2'], operator: '<=', rhs: '12' },
      { coeffs: ['3/2', '2'], operator: '<=', rhs: '18' } // Añadimos una fracción
    ];
  } else if (problemConfig.numVars === 3) {
    // Ejemplo con 3 variables y fracciones
    problemConfig.objective.type = 'maximize';
    coeffMatrix.objective = ['2', '3', '4'];
    coeffMatrix.constraints = [
      { coeffs: ['3', '2', '1/2'], operator: '<=', rhs: '10' },
      { coeffs: ['2', '5/2', '3'], operator: '<=', rhs: '15' },
      { coeffs: ['1', '0', '2'], operator: '<=', rhs: '4' }
    ];
  } else {
    // Ejemplo genérico con algunas fracciones
    problemConfig.objective.type = 'maximize';

    // Generar coeficientes aleatorios para la función objetivo
    coeffMatrix.objective = Array(problemConfig.numVars).fill().map(() => {
      const num = Math.floor(Math.random() * 10) + 1;
      // A veces generamos fracciones
      return Math.random() > 0.7 ?
        `${num}/${Math.floor(Math.random() * 3) + 2}` : // Fracción
        `${num}`; // Entero
    });

    // Generar restricciones aleatorias
    coeffMatrix.constraints = Array(problemConfig.numConstraints).fill().map(() => ({
      coeffs: Array(problemConfig.numVars).fill().map(() => {
        const num = Math.floor(Math.random() * 5) + 1;
        // A veces generamos fracciones
        return Math.random() > 0.7 ?
          `${num}/${Math.floor(Math.random() * 3) + 2}` : // Fracción
          `${num}`; // Entero
      }),
      operator: '<=',
      rhs: `${Math.floor(Math.random() * 20) + 5}`
    }));
  }
};

const variableLabel = (index) => {
  const char = problemConfig.variableChar || 'x';
  return `${char}${index}`;
};

const formatObjectiveFunction = () => {
  const terms = [];

  coeffMatrix.objective.forEach((coeff, index) => {
    const numValue = parseFraction(coeff);
    if (numValue !== 0 && numValue !== null) {
      const sign = numValue > 0 ? (index === 0 ? '' : '+ ') : '- ';
      const absCoeff = Math.abs(numValue);
      const coeffStr = absCoeff === 1 ? '' : `${coeff} `;

      terms.push(`${sign}${coeffStr}${variableLabel(index + 1)}`);
    }
  });

  return terms.length > 0 ? terms.join(' ') : '0';
};

const formatConstraint = (constraint) => {
  const terms = [];

  constraint.coeffs.forEach((coeff, index) => {
    const numValue = parseFraction(coeff);
    if (numValue !== 0 && numValue !== null) {
      const sign = numValue > 0 ? (terms.length === 0 ? '' : '+ ') : '- ';
      const absCoeff = Math.abs(numValue);
      const coeffStr = absCoeff === 1 ? '' : `${Math.abs(numValue) === 1 ? '' : coeff} `;

      terms.push(`${sign}${coeffStr}${variableLabel(index + 1)}`);
    }
  });

  const lhs = terms.length > 0 ? terms.join(' ') : '0';
  let operator = '≤';

  switch (constraint.operator) {
    case '<=': operator = '≤'; break;
    case '=': operator = '='; break;
    case '>=': operator = '≥'; break;
  }

  return `${lhs} ${operator} ${constraint.rhs}`;
};

// Convertir los valores de texto de la matriz a números para el procesamiento
const prepareNumericMatrix = () => {
  const objective = coeffMatrix.objective.map(val => parseFraction(val) || 0);

  const constraints = coeffMatrix.constraints.map(constraint => ({
    coeffs: constraint.coeffs.map(val => parseFraction(val) || 0),
    operator: constraint.operator,
    rhs: parseFraction(constraint.rhs) || 0
  }));

  return {
    objective,
    constraints
  };
};

// Obtener los datos del problema estructurados para YALPS
const getProblemData = () => {
  const numericMatrix = prepareNumericMatrix();

  return {
    type: problemConfig.objective.type,
    variables: {
      count: problemConfig.numVars,
      char: problemConfig.variableChar
    },
    objective: numericMatrix.objective,
    constraints: numericMatrix.constraints,
    method: problemConfig.method,
    numVars: problemConfig.numVars,
    numConstraints: problemConfig.numConstraints,
    variableChar: problemConfig.variableChar,
    displayAsFraction: problemConfig.displayAsFraction
  };
};

const solveProblem = async () => {
  // Mostrar el panel de solución con estado de procesamiento
  showSolution.value = true;
  isProcessing.value = true;

  // Estado inicial de la solución (procesando)
  solutionData.value = {
    status: 'processing',
    objective: {
      type: problemConfig.objective.type
    }
  };

  try {
    // Enviar los datos del problema al servicio Simplex
    const result = await solveSimplex(getProblemData());

    // Actualizar con la solución
    solutionData.value = result;
  } catch (error) {
    // Manejar errores
    console.error('Error al resolver el problema:', error);
    solutionData.value = {
      status: 'error',
      errorMessage: error.message || 'Ocurrió un error al procesar la solución.'
    };
  } finally {
    isProcessing.value = false;
  }
};

// Validar un campo de fracción y limpiar si es necesario
const validateFractionInput = (value) => {
  if (!value) return '0';

  // Si ya es válido, devolverlo
  if (isValidFraction(value)) return value;

  // Intentar limpiar y validar
  // Eliminar todos los caracteres que no sean números, slash o signo negativo
  const cleaned = value.replace(/[^\d\/-]/g, '');

  if (isValidFraction(cleaned)) return cleaned;

  // Si no se puede validar, devolver 0
  return '0';
};

// Formatear como fracción al cambiar foco
const formatAsFraction = (event, index, rowIndex, isRhs = false) => {
  const value = event.target.value;

  if (!value) {
    if (isRhs) {
      coeffMatrix.constraints[rowIndex].rhs = '0';
    } else if (rowIndex === undefined) {
      coeffMatrix.objective[index] = '0';
    } else {
      coeffMatrix.constraints[rowIndex].coeffs[index] = '0';
    }
    return;
  }

  const validValue = validateFractionInput(value);

  if (isRhs) {
    coeffMatrix.constraints[rowIndex].rhs = validValue;
  } else if (rowIndex === undefined) {
    coeffMatrix.objective[index] = validValue;
  } else {
    coeffMatrix.constraints[rowIndex].coeffs[index] = validValue;
  }
};

// Hook del ciclo de vida
onMounted(() => {
  // Inicializar el componente
  updateProblemDimensions();
});
</script>

<template>
  <div class="container-fluid py-3">
    <div class="row">
      <!-- Título -->
      <div class="col-12 mb-3 text-center">
        <h1>Optimizador de Programación Lineal</h1>
      </div>

      <!-- Configuración inicial -->
      <div class="col-12 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Configuración del Problema</h5>
          </div>
          <div class="card-body">
            <!-- Tipo de problema -->
            <div class="row mb-3">
              <div class="col-md-3">
                <label class="form-label">Tipo de problema:</label>
                <div class="d-flex">
                  <div class="form-check me-4">
                    <input class="form-check-input" type="radio" name="objectiveType" id="maximize" value="maximize"
                      v-model="problemConfig.objective.type" />
                    <label class="form-check-label" for="maximize">Maximizar</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="objectiveType" id="minimize" value="minimize"
                      v-model="problemConfig.objective.type" />
                    <label class="form-check-label" for="minimize">Minimizar</label>
                  </div>
                </div>
              </div>

              <!-- Carácter para las variables -->
              <div class="col-md-3">
                <label class="form-label">Carácter para variables:</label>
                <div class="input-group">
                  <input type="text" class="form-control" v-model="problemConfig.variableChar" maxlength="1"
                    placeholder="x" />
                  <span class="input-group-text">
                    Ejemplo: {{ problemConfig.variableChar || 'x' }}₁, {{ problemConfig.variableChar || 'x' }}₂, ...
                  </span>
                </div>
              </div>

              <!-- Método de solución -->
              <div class="col-md-3">
                <label class="form-label">Método de solución:</label>
                <select class="form-select" v-model="problemConfig.method">
                  <option value="simplex">Método Simplex</option>
                  <option value="twoPhase" disabled>Método de Dos Fases (próximamente)</option>
                  <option value="bigM" disabled>Método de la Gran M (próximamente)</option>
                </select>
              </div>

              <!-- Opción para mostrar fracciones -->
              <div class="col-md-3">
                <label class="form-label">Formato de visualización:</label>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" id="displayFractions"
                    v-model="problemConfig.displayAsFraction" />
                  <label class="form-check-label" for="displayFractions">
                    Mostrar como fracciones
                  </label>
                </div>
              </div>
            </div>

            <!-- Dimensiones del problema -->
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Número de variables:</label>
                <div class="input-group">
                  <input type="number" class="form-control" v-model.number="problemConfig.numVars" min="1"
                    @change="updateProblemDimensions" />
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label">Número de restricciones:</label>
                <div class="input-group">
                  <input type="number" class="form-control" v-model.number="problemConfig.numConstraints" min="1"
                    @change="updateProblemDimensions" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Matriz de coeficientes -->
      <div class="col-12 mb-4">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">Matriz de Coeficientes</h5>
          </div>
          <div class="card-body">
            <div class="alert alert-info mb-3">
              <iconify-icon icon="mdi:information" class="me-1"></iconify-icon>
              <strong>Tip:</strong> Puedes ingresar valores como números enteros, decimales o fracciones (ej: 3/4, -1/2)
            </div>

            <div class="table-responsive">
              <table class="table table-bordered">
                <thead>
                  <tr>
                    <th scope="col" class="text-center" style="width: 150px;">
                      {{ problemConfig.objective.type === 'maximize' ? 'Maximizar' : 'Minimizar' }}
                    </th>
                    <th v-for="j in problemConfig.numVars" :key="`header-var-${j}`" class="text-center">
                      {{ variableLabel(j) }}
                    </th>
                    <th class="text-center">Operador</th>
                    <th class="text-center">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Filas para las restricciones -->
                  <tr v-for="(constraint, i) in coeffMatrix.constraints" :key="`constraint-${i}`">
                    <th scope="row" class="text-center align-middle">Restricción {{ i + 1 }}</th>
                    <td v-for="(coeff, j) in constraint.coeffs" :key="`a-${i}-${j}`">
                      <input type="text" class="form-control"
                        v-model="coeffMatrix.constraints[i].coeffs[j]"
                        placeholder="0"
                        @blur="formatAsFraction($event, j, i)" />
                    </td>
                    <td class="text-center align-middle">
                      <select class="form-select" v-model="coeffMatrix.constraints[i].operator">
                        <option value="<=">≤</option>
                        <option value="=">＝</option>
                        <option value=">=">≥</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" class="form-control"
                        v-model="coeffMatrix.constraints[i].rhs"
                        placeholder="0"
                        @blur="formatAsFraction($event, null, i, true)" />
                    </td>
                  </tr>
                  <!-- Fila para la función objetivo -->
                  <tr>
                    <th scope="row" class="text-center align-middle">Z</th>
                    <td v-for="(coeff, j) in coeffMatrix.objective" :key="`obj-${j}`">
                      <input type="text" class="form-control"
                        v-model="coeffMatrix.objective[j]"
                        placeholder="0"
                        @blur="formatAsFraction($event, j)" />
                    </td>
                    <td class="text-center align-middle">-</td>
                    <td class="text-center align-middle">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Vista previa del problema -->
            <div class="mt-4">
              <h6>Vista previa del problema:</h6>
              <div class="card bg-light">
                <div class="card-body">
                  <!-- Función objetivo -->
                  <p class="mb-2">
                    <strong>{{ problemConfig.objective.type === 'maximize' ? 'Maximizar' : 'Minimizar' }}:</strong>
                    Z = {{ formatObjectiveFunction() }}
                  </p>

                  <!-- Restricciones -->
                  <p class="mb-2"><strong>Sujeto a:</strong></p>
                  <ul class="mb-0">
                    <li v-for="(constraint, index) in coeffMatrix.constraints" :key="`preview-${index}`">
                      {{ formatConstraint(constraint) }}
                    </li>
                    <li>{{ variableLabel(1) }}, {{ variableLabel(2) }}, ..., {{ variableLabel(problemConfig.numVars) }}
                      ≥ 0</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="d-flex justify-content-between mt-4">
              <button class="btn btn-outline-secondary" @click="resetMatrix">
                <iconify-icon icon="mdi:refresh" class="me-1"></iconify-icon>
                Reiniciar valores
              </button>

              <div>
                <button class="btn btn-outline-primary me-2" @click="generateExample">
                  <iconify-icon icon="mdi:lightbulb" class="me-1"></iconify-icon>
                  Cargar ejemplo
                </button>

                <button :disabled="!isValidProblem" class="btn btn-success" @click="solveProblem">
                  <iconify-icon icon="mdi:calculator" class="me-1"></iconify-icon>
                  Resolver problema
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección para la solución (inicialmente oculta) -->
      <div v-if="showSolution" class="col-12">
        <SimplexSolution
          :problem="getProblemData()"
          :solution="solutionData"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transiciones para elementos que aparecen/desaparecen */
.card {
  transition: all 0.3s ease;
}

/* Asegurar que los inputs number no tengan las flechas en algunos navegadores */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>
