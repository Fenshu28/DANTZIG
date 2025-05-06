<!-- SimplexInterface.vue - Interfaz mejorada para el método simplex -->
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
              <div class="col-md-4">
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
              <div class="col-md-4">
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
              <div class="col-md-4">
                <label class="form-label">Método de solución:</label>
                <select class="form-select" v-model="problemConfig.method">
                  <option value="simplex">Método Simplex</option>
                  <option value="twoPhase" disabled>Método de Dos Fases (próximamente)</option>
                  <option value="bigM" disabled>Método de la Gran M (próximamente)</option>
                </select>
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
                  <!-- Fila para la función objetivo -->
                  <tr>
                    <th scope="row" class="text-center align-middle">Z</th>
                    <td v-for="j in problemConfig.numVars" :key="`obj-${j}`">
                      <input type="number" class="form-control" v-model.number="coeffMatrix.objective[j - 1]"
                        step="0.1" />
                    </td>
                    <td class="text-center align-middle">-</td>
                    <td class="text-center align-middle">-</td>
                  </tr>

                  <!-- Filas para las restricciones -->
                  <tr v-for="i in problemConfig.numConstraints" :key="`constraint-${i}`">
                    <th scope="row" class="text-center align-middle">Restricción {{ i }}</th>
                    <td v-for="j in problemConfig.numVars" :key="`a-${i}-${j}`">
                      <input type="number" class="form-control"
                        v-model.number="coeffMatrix.constraints[i - 1].coeffs[j - 1]" step="0.1" />
                    </td>
                    <td class="text-center align-middle">
                      <select class="form-select" v-model="coeffMatrix.constraints[i - 1].operator">
                        <option value="<=">≤</option>
                        <option value="=">＝</option>
                        <option value=">=">≥</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" class="form-control" v-model.number="coeffMatrix.constraints[i - 1].rhs"
                        step="0.1" />
                    </td>
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
                <button :disabled="!problemConfig.numVars" class="btn btn-success" @click="solveProblem">
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
        <div class="card">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">Solución del Problema</h5>
          </div>
          <div class="card-body">
            <p class="text-center">
              Aquí se mostrará la solución del problema
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

// Configuración del problema
const problemConfig = reactive({
  objective: {
    type: 'maximize'
  },
  variableChar: 'x',
  method: 'simplex',
  numVars: 2,
  numConstraints: 3
});

// Estado de la interfaz
const showSolution = ref(false);

// Matriz de coeficientes
const coeffMatrix = reactive({
  objective: [3, 5],
  constraints: [
    { coeffs: [1, 0], operator: '<=', rhs: 4 },
    { coeffs: [0, 2], operator: '<=', rhs: 12 },
    { coeffs: [3, 2], operator: '<=', rhs: 18 }
  ]
});

// Métodos
const updateProblemDimensions = () => {
  // Asegurar que los valores son válidos
  if (problemConfig.numVars < 1) problemConfig.numVars = 1;
  if (problemConfig.numConstraints < 1) problemConfig.numConstraints = 1;
};

const resetMatrix = () => {
  // Reiniciar todos los coeficientes a cero
  coeffMatrix.objective = Array(problemConfig.numVars).fill(0);

  coeffMatrix.constraints = Array(problemConfig.numConstraints).fill().map(() => ({
    coeffs: Array(problemConfig.numVars).fill(1),
    operator: '<=',
    rhs: 1
  }));
};

const variableLabel = (index) => {
  const char = problemConfig.variableChar || 'x';
  return `${char}${index}`;
};

const formatObjectiveFunction = () => {
  const terms = [];

  coeffMatrix.objective.forEach((coeff, index) => {
    if (coeff !== 0) {
      const sign = coeff > 0 ? (index === 0 ? '' : '+ ') : '- ';
      const absCoeff = Math.abs(coeff);
      const coeffStr = absCoeff === 1 ? '' : `${absCoeff}`;

      terms.push(`${sign}${coeffStr}${variableLabel(index + 1)}`);
    }
  });

  return terms.length > 0 ? terms.join(' ') : '0';
};

const formatConstraint = (constraint) => {
  const terms = [];

  constraint.coeffs.forEach((coeff, index) => {
    if (coeff !== 0) {
      const sign = coeff > 0 ? (terms.length === 0 ? '' : '+ ') : '- ';
      const absCoeff = Math.abs(coeff);
      const coeffStr = absCoeff === 1 ? '' : `${absCoeff}`;

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

const solveProblem = () => {
  // Esta función enviará los datos del problema a YALPS para resolverlo
  // Por ahora, solo mostraremos el panel de solución
  showSolution.value = true;

  // Aquí se emitiría un evento con los datos del problema para que YALPS lo resuelva
  console.log('Datos del problema:', {
    type: problemConfig.objective.type,
    variables: {
      count: problemConfig.numVars,
      char: problemConfig.variableChar
    },
    objective: coeffMatrix.objective,
    constraints: coeffMatrix.constraints,
    method: problemConfig.method
  });
};
</script>

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
