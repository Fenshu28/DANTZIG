<!-- SimplexSolution.vue - Componente para mostrar la solución del método simplex con soporte para fracciones -->

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import SimplexGraph from './SimplexGraph.vue';
import { toFractionString } from '../services/fractionService';

// Props
const props = defineProps({
  problem: {
    type: Object,
    required: true
  },
  solution: {
    type: Object,
    default: () => ({
      status: null,
      variables: [],
      objectiveValue: 0,
      slackVariables: [],
      iterations: []
    })
  }
});

// Referencias
const graphContainer = ref(null);

// Estado local
const viewMode = ref('final');
const currentIteration = ref(0);

// Computed
const canShowGraph = computed(() => {
  return props.problem.numVars === 2 && props.solution.status === 'optimal';
});

const shouldDisplayAsFraction = computed(() => {
  return props.problem.displayAsFraction === undefined ? true : props.problem.displayAsFraction;
});

// Métodos
const formatNumber = (value) => {
  if (value === undefined || value === null) return '-';

  // Si se debe mostrar como fracción, usar el servicio de fracciones
  if (shouldDisplayAsFraction.value) {
    return toFractionString(value);
  }

  // De lo contrario, mostrar como decimal
  return Number.isInteger(value) ? value : Number(value).toFixed(2);
};

const formatVariableName = (index) => {
  const varChar = props.problem.variableChar || 'x';
  return `${varChar}${index + 1}`;
};

const getCurrentIteration = () => {
  if (!props.solution.iterations || props.solution.iterations.length === 0) {
    return { tableHeaders: [], tableRows: [], enteringVar: null, leavingVar: null, pivotElement: null, currentZ: 0 };
  }
  return props.solution.iterations[currentIteration.value];
};

// Método para dibujar el gráfico 2D
const drawGraph = () => {
  if (!canShowGraph.value || !graphContainer.value) return;

  // Aquí iría la lógica para dibujar el gráfico 2D
  // Utilizando los datos del problema y la solución
  // Con una biblioteca como Chart.js, D3, o similar

  // Por ejemplo con Chart.js:
  // Aquí se dibujaría la región factible y el punto óptimo
};

// Watches
watch(() => props.solution, () => {
  if (props.solution.status === 'optimal') {
    // Resetear a la primera iteración cuando cambia la solución
    currentIteration.value = 0;

    // Dibujar el gráfico con la nueva solución
    nextTick(drawGraph);
  }
}, { deep: true });

// Ciclo de vida
onMounted(() => {
  if (canShowGraph.value) {
    drawGraph();
  }
});
</script>

<template>
  <div class="card">
    <div class="card-header bg-info text-white">
      <h5 class="mb-0">Solución del Problema</h5>
    </div>
    <div class="card-body">
      <!-- Selector de modo de visualización -->
      <div class="mb-4">
        <div class="btn-group w-100" role="group">
          <input type="radio" class="btn-check" name="viewMode" id="viewFinal" autocomplete="off" v-model="viewMode"
            value="final" checked>
          <label class="btn btn-outline-primary" for="viewFinal">
            <iconify-icon icon="mdi:flag-checkered" class="me-1"></iconify-icon>
            Solución Final
          </label>

          <input type="radio" class="btn-check" name="viewMode" id="viewIterations" autocomplete="off"
            v-model="viewMode" value="iterations">
          <label class="btn btn-outline-primary" for="viewIterations">
            <iconify-icon icon="mdi:table-pivot" class="me-1"></iconify-icon>
            Por Iteraciones
          </label>
        </div>
      </div>

      <!-- Estado de la solución -->
      <div v-if="solution.status">
        <div v-if="solution.status === 'optimal'" class="alert alert-success">
          <iconify-icon icon="mdi:check-circle" class="me-2"></iconify-icon>
          <strong>Solución óptima encontrada</strong>
        </div>

        <div v-else-if="solution.status === 'unbounded'" class="alert alert-warning">
          <iconify-icon icon="mdi:alert" class="me-2"></iconify-icon>
          <strong>Problema no acotado</strong> - El valor de la función objetivo puede crecer indefinidamente.
        </div>

        <div v-else-if="solution.status === 'infeasible'" class="alert alert-danger">
          <iconify-icon icon="mdi:close-circle" class="me-2"></iconify-icon>
          <strong>Problema no factible</strong> - No existe solución que satisfaga todas las restricciones.
        </div>

        <div v-else-if="solution.status === 'processing'" class="alert alert-info">
          <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <span>Procesando solución...</span>
          </div>
        </div>
      </div>

      <!-- Vista: Solución Final -->
      <div v-if="viewMode === 'final'" class="mt-4">
        <!-- Valor óptimo -->
        <div v-if="solution.status === 'optimal'" class="mb-4">
          <h6>Valor óptimo:</h6>
          <div class="card bg-light mb-3">
            <div class="card-body">
              <p class="mb-0 fs-5">
                <strong>Z {{ solution.objective?.type === 'maximize' ? 'máx' : 'mín' }} = </strong>
                <span class="text-success fw-bold">{{ formatNumber(solution.objectiveValue) }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Variables de decisión -->
        <div v-if="solution.status === 'optimal'" class="mb-4">
          <h6>Variables de decisión:</h6>
          <div class="card bg-light">
            <div class="card-body">
              <div class="row">
                <div v-for="(value, index) in solution.variables" :key="index" class="col-md-3 mb-2">
                  <div class="d-flex align-items-center">
                    <span class="me-2">{{ formatVariableName(index) }} =</span>
                    <span class="fw-bold">{{ formatNumber(value) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Variables de holgura -->
        <div v-if="solution.status === 'optimal' && solution.slackVariables?.length" class="mb-4">
          <h6>Variables de holgura:</h6>
          <div class="card bg-light">
            <div class="card-body">
              <div class="row">
                <div v-for="(value, index) in solution.slackVariables" :key="index" class="col-md-3 mb-2">
                  <div class="d-flex align-items-center">
                    <span class="me-2">s{{ index + 1 }} =</span>
                    <span class="fw-bold">{{ formatNumber(value) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Visualización gráfica 2D (solo para problemas de 2 variables) -->
        <div v-if="canShowGraph" class="mt-4">
          <h6>Visualización gráfica:</h6>
          <div class="card mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-center">
                <SimplexGraph :problem="problem" :solution="solution" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista: Iteraciones -->
      <div v-if="viewMode === 'iterations'" class="mt-4">
        <!-- Controles de iteración -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <button class="btn btn-sm btn-outline-secondary" :disabled="currentIteration <= 0"
            @click="currentIteration--">
            <iconify-icon icon="mdi:arrow-left" class="me-1"></iconify-icon>
            Anterior
          </button>

          <div class="px-3">
            <span class="badge bg-primary">Iteración {{ currentIteration + 1 }} de {{ solution.iterations?.length || 0
              }}</span>
          </div>

          <button class="btn btn-sm btn-outline-secondary"
            :disabled="currentIteration >= (solution.iterations?.length - 1)" @click="currentIteration++">
            Siguiente
            <iconify-icon icon="mdi:arrow-right" class="ms-1"></iconify-icon>
          </button>
        </div>

        <!-- Tabla Simplex de la iteración actual -->
        <div v-if="solution.iterations && solution.iterations.length > 0" class="table-responsive">
          <h6>Tabla Simplex:</h6>
          <table class="table table-bordered table-sm">
            <thead class="table-light">
              <tr>
                <th class="text-center">Base</th>
                <th v-for="(header, index) in getCurrentIteration().tableHeaders.slice(1, -1)" :key="index"
                  class="text-center">
                  {{ header }}
                </th>
                <th class="text-center table-primary">RHS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in getCurrentIteration().tableRows" :key="rowIndex">
                <th class="text-center table-light">{{ row.base }}</th>
                <td v-for="(cell, cellIndex) in row.cells" :key="cellIndex" class="text-center" :class="{
                  'table-primary': cellIndex === row.cells.length - 1,
                  'table-warning': cell.isPivot
                }">
                  {{ formatNumber(cell.value) }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Información de la iteración -->
          <div class="mt-3 mb-4">
            <div class="card bg-light">
              <div class="card-body">
                <p><strong>Variable entrante:</strong> {{ getCurrentIteration().enteringVar || 'Ninguna' }}</p>
                <p><strong>Variable saliente:</strong> {{ getCurrentIteration().leavingVar || 'Ninguna' }}</p>
                <p><strong>Elemento pivote:</strong> {{ formatNumber(getCurrentIteration().pivotElement) }}</p>
                <p class="mb-0"><strong>Valor actual de Z:</strong> {{ formatNumber(getCurrentIteration().currentZ) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph-container {
  width: 100%;
  height: 400px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

/* Animaciones para transiciones entre iteraciones */
.table-responsive {
  transition: opacity 0.3s ease;
}

/* Tabla simplex más compacta */
.table-sm td,
.table-sm th {
  padding: 0.5rem;
}
</style>
