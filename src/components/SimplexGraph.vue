<!-- SimplexGraph.vue - Componente para visualizar gráficamente el problema Simplex en 2D -->
<template>
  <div class="simplex-graph-container" ref="graphContainer">
    <canvas ref="graphCanvas" class="simplex-graph-canvas"></canvas>
    <div v-if="loading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { generateGraphData } from '../services/simplexService';

// Props
const props = defineProps({
  problem: {
    type: Object,
    required: true
  },
  solution: {
    type: Object,
    default: () => ({})
  }
});

// Variables reactivas
const graphContainer = ref(null);
const graphCanvas = ref(null);
const loading = ref(true);
let ctx = null;

// Variables para dibujo
const padding = 40; // Espacio para ejes y etiquetas
const arrowSize = 8; // Tamaño de las flechas de los ejes
const pointRadius = 6; // Radio de los puntos
const lineWidth = 2; // Ancho de las líneas
const gridLineWidth = 0.5; // Ancho de las líneas de la cuadrícula
const axisColor = '#333333'; // Color de los ejes
const gridColor = '#dddddd'; // Color de la cuadrícula
const constraintColors = [
  '#3498db', // Azul
  '#e74c3c', // Rojo
  '#2ecc71', // Verde
  '#f39c12', // Naranja
  '#9b59b6', // Morado
  '#1abc9c', // Verde azulado
  '#d35400'  // Naranja oscuro
]; // Colores para las restricciones
const feasibleRegionColor = 'rgba(46, 204, 113, 0.2)'; // Verde semi-transparente
const optimalPointColor = '#e74c3c'; // Rojo

// Dibujar el gráfico
const drawGraph = () => {
  if (!graphCanvas.value || !graphContainer.value) return;

  loading.value = true;

  // Redimensionar el canvas para que coincida con el contenedor
  nextTick(() => {
    const containerWidth = graphContainer.value.clientWidth;
    const containerHeight = Math.min(containerWidth * 0.8, 400); // Proporción apropiada

    // Configurar el canvas con las dimensiones correctas (ojo con pixelRatio para pantallas HiDPI)
    const pixelRatio = window.devicePixelRatio || 1;
    graphCanvas.value.width = containerWidth * pixelRatio;
    graphCanvas.value.height = containerHeight * pixelRatio;
    graphCanvas.value.style.width = `${containerWidth}px`;
    graphCanvas.value.style.height = `${containerHeight}px`;

    // Obtener el contexto del canvas
    ctx = graphCanvas.value.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);

    // Generar datos para el gráfico
    const graphData = generateGraphData(props.problem, props.solution);

    if (!graphData) {
      drawNotSupported();
      loading.value = false;
      return;
    }

    // Calcular dimensiones efectivas para dibujo
    const width = containerWidth - 2 * padding;
    const height = containerHeight - 2 * padding;

    // Limpiar canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Dibujar cuadrícula y ejes
    drawGrid(width, height, graphData.xRange, graphData.yRange);
    drawAxes(width, height, graphData.xRange, graphData.yRange, graphData.variableLabels);

    // Dibujar región factible
    if (graphData.feasibleRegion && graphData.feasibleRegion.length > 0) {
      drawFeasibleRegion(width, height, graphData.xRange, graphData.yRange, graphData.feasibleRegion);
    }

    // Dibujar líneas de restricción
    if (graphData.constraintLines) {
      drawConstraintLines(width, height, graphData.xRange, graphData.yRange, graphData.constraintLines);
    }

    // Dibujar línea de función objetivo
    if (graphData.objectiveLine) {
      drawObjectiveLine(width, height, graphData.xRange, graphData.yRange, graphData.objectiveLine);
    }

    // Dibujar punto óptimo
    if (props.solution && props.solution.status === 'optimal') {
      drawOptimalPoint(width, height, graphData.xRange, graphData.yRange, props.solution.variables);
    }

    // Dibujar leyenda
    drawLegend(containerWidth, containerHeight, graphData);

    loading.value = false;
  });
};

// Dibujar cuadrícula
const drawGrid = (width, height) => {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = gridLineWidth;

  const xStep = width / 10;
  const yStep = height / 10;

  // Líneas verticales
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(padding + i * xStep, padding);
    ctx.lineTo(padding + i * xStep, padding + height);
    ctx.stroke();
  }

  // Líneas horizontales
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(padding, padding + i * yStep);
    ctx.lineTo(padding + width, padding + i * yStep);
    ctx.stroke();
  }
};

// Dibujar ejes
const drawAxes = (width, height, xRange, yRange, variableLabels) => {
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = axisColor;

  // Eje X
  ctx.beginPath();
  ctx.moveTo(padding, padding + height);
  ctx.lineTo(padding + width, padding + height);
  ctx.stroke();

  // Flecha del eje X
  ctx.beginPath();
  ctx.moveTo(padding + width, padding + height);
  ctx.lineTo(padding + width - arrowSize, padding + height - arrowSize / 2);
  ctx.lineTo(padding + width - arrowSize, padding + height + arrowSize / 2);
  ctx.fill();

  // Eje Y
  ctx.beginPath();
  ctx.moveTo(padding, padding + height);
  ctx.lineTo(padding, padding);
  ctx.stroke();

  // Flecha del eje Y
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding - arrowSize / 2, padding + arrowSize);
  ctx.lineTo(padding + arrowSize / 2, padding + arrowSize);
  ctx.fill();

  // Etiquetas de los ejes
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(variableLabels.x, padding + width - 10, padding + height + 25);

  ctx.textAlign = 'right';
  ctx.fillText(variableLabels.y, padding - 5, padding + 15);

  // Marcas y valores de la escala
  const xStep = width / 5;
  const yStep = height / 5;
  const xValueStep = (xRange.max - xRange.min) / 5;
  const yValueStep = (yRange.max - yRange.min) / 5;

  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  // Marcas del eje X
  for (let i = 0; i <= 5; i++) {
    const x = padding + i * xStep;
    const value = xRange.min + i * xValueStep;

    ctx.beginPath();
    ctx.moveTo(x, padding + height);
    ctx.lineTo(x, padding + height + 5);
    ctx.stroke();

    ctx.fillText(value.toFixed(0), x, padding + height + 20);
  }

  // Marcas del eje Y
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const y = padding + height - i * yStep;
    const value = yRange.min + i * yValueStep;

    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding - 5, y);
    ctx.stroke();

    ctx.fillText(value.toFixed(0), padding - 10, y + 4);
  }
};

// Convertir coordenadas del problema a coordenadas del canvas
const toCanvasCoords = (x, y, width, height, xRange, yRange) => {
  const xCanvas = padding + (x - xRange.min) / (xRange.max - xRange.min) * width;
  const yCanvas = padding + height - (y - yRange.min) / (yRange.max - yRange.min) * height;
  return { x: xCanvas, y: yCanvas };
};

// Dibujar las líneas de restricción
const drawConstraintLines = (width, height, xRange, yRange, constraintLines) => {
  constraintLines.forEach((line, index) => {
    ctx.strokeStyle = constraintColors[index % constraintColors.length];
    ctx.lineWidth = lineWidth;

    // Dibujar la línea
    if (line.data.length >= 2) {
      ctx.beginPath();

      const start = toCanvasCoords(line.data[0].x, line.data[0].y, width, height, xRange, yRange);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < line.data.length; i++) {
        const point = toCanvasCoords(line.data[i].x, line.data[i].y, width, height, xRange, yRange);
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();

      // Etiquetar la restricción
      const midPoint = line.data[Math.floor(line.data.length / 2)];
      const labelPos = toCanvasCoords(midPoint.x, midPoint.y, width, height, xRange, yRange);

      ctx.fillStyle = constraintColors[index % constraintColors.length];
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`R${index + 1}`, labelPos.x + 15, labelPos.y - 15);
    }
  });
};

// Dibujar la región factible
const drawFeasibleRegion = (width, height, xRange, yRange, feasibleRegion) => {
  if (feasibleRegion.length < 3) return; // Necesitamos al menos 3 puntos para un polígono

  ctx.fillStyle = feasibleRegionColor;
  ctx.beginPath();

  const start = toCanvasCoords(feasibleRegion[0].x, feasibleRegion[0].y, width, height, xRange, yRange);
  ctx.moveTo(start.x, start.y);

  for (let i = 1; i < feasibleRegion.length; i++) {
    const point = toCanvasCoords(feasibleRegion[i].x, feasibleRegion[i].y, width, height, xRange, yRange);
    ctx.lineTo(point.x, point.y);
  }

  ctx.closePath();
  ctx.fill();
};

// Dibujar la línea de la función objetivo
const drawObjectiveLine = (width, height, xRange, yRange, objectiveLine) => {
  ctx.strokeStyle = '#9b59b6'; // Morado
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([5, 3]); // Línea punteada

  // Si la pendiente es válida
  if (objectiveLine.slope !== null && !isNaN(objectiveLine.slope)) {
    const y1 = objectiveLine.slope * xRange.min + objectiveLine.intercept;
    const y2 = objectiveLine.slope * xRange.max + objectiveLine.intercept;

    const start = toCanvasCoords(xRange.min, y1, width, height, xRange, yRange);
    const end = toCanvasCoords(xRange.max, y2, width, height, xRange, yRange);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Vector de dirección para maximizar/minimizar
    const dirX = (props.problem.objective?.type === 'maximize') ? 1 : -1;
    const dirY = objectiveLine.objective[1] * dirX;

    // Punto medio del canvas
    const midX = (xRange.min + xRange.max) / 2;
    const midY = objectiveLine.slope * midX + objectiveLine.intercept;

    // Dibujar una flecha indicando la dirección de mejora
    const arrowStart = toCanvasCoords(midX, midY, width, height, xRange, yRange);

    // Normalizar vector de dirección
    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    const normDirX = dirX / magnitude;
    const normDirY = dirY / magnitude;

    const arrowEnd = {
      x: arrowStart.x + normDirX * 20,
      y: arrowStart.y - normDirY * 20
    };

    ctx.setLineDash([]); // Restaurar línea sólida
    ctx.beginPath();
    ctx.moveTo(arrowStart.x, arrowStart.y);
    ctx.lineTo(arrowEnd.x, arrowEnd.y);

    // Punta de flecha
    const angle = Math.atan2(arrowStart.y - arrowEnd.y, arrowStart.x - arrowEnd.x);
    ctx.lineTo(
      arrowEnd.x + Math.cos(angle - Math.PI / 6) * 10,
      arrowEnd.y + Math.sin(angle - Math.PI / 6) * 10
    );
    ctx.moveTo(arrowEnd.x, arrowEnd.y);
    ctx.lineTo(
      arrowEnd.x + Math.cos(angle + Math.PI / 6) * 10,
      arrowEnd.y + Math.sin(angle + Math.PI / 6) * 10
    );

    ctx.stroke();

    // Restaurar línea normal
    ctx.setLineDash([]);
  }
};

// Dibujar el punto óptimo
const drawOptimalPoint = (width, height, xRange, yRange, variables) => {
  if (!variables || variables.length < 2) return;

  const point = toCanvasCoords(variables[0], variables[1], width, height, xRange, yRange);

  // Dibujar punto
  ctx.fillStyle = optimalPointColor;
  ctx.beginPath();
  ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
  ctx.fill();

  // Etiquetar el punto
  ctx.fillStyle = optimalPointColor;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`(${variables[0].toFixed(2)}, ${variables[1].toFixed(2)})`, point.x, point.y - 15);
};

// Dibujar leyenda
const drawLegend = (containerWidth, containerHeight, graphData) => {
  const legendX = containerWidth - 150;
  const legendY = padding + 20;
  const legendWidth = 130;
  const legendHeight = 150;
  const itemHeight = 20;

  // Fondo de la leyenda
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = '#aaaaaa';
  ctx.lineWidth = 1;

  ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
  ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

  // Título de la leyenda
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Leyenda', legendX + legendWidth / 2, legendY + 15);

  // Elementos de la leyenda
  ctx.textAlign = 'left';
  let y = legendY + 35;

  // Restricciones
  graphData.constraintLines.forEach((line, index) => {
    if (index < 4) { // Mostrar solo las primeras 4 para no llenar la leyenda
      ctx.fillStyle = constraintColors[index % constraintColors.length];
      ctx.fillRect(legendX + 10, y, 15, 2);

      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.fillText(`Restricción ${index + 1}`, legendX + 30, y + 5);

      y += itemHeight;
    }
  });

  // Región factible
  ctx.fillStyle = feasibleRegionColor;
  ctx.fillRect(legendX + 10, y, 15, 15);

  ctx.fillStyle = '#333333';
  ctx.font = '12px Arial';
  ctx.fillText('Región factible', legendX + 30, y + 10);

  y += itemHeight;

  // Función objetivo
  ctx.strokeStyle = '#9b59b6';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(legendX + 10, y + 5);
  ctx.lineTo(legendX + 25, y + 5);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#333333';
  ctx.font = '12px Arial';
  ctx.fillText('Función objetivo', legendX + 30, y + 10);

  y += itemHeight;

  // Punto óptimo
  if (props.solution && props.solution.status === 'optimal') {
    ctx.fillStyle = optimalPointColor;
    ctx.beginPath();
    ctx.arc(legendX + 17, y + 5, pointRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.fillText('Punto óptimo', legendX + 30, y + 10);
  }
};

// Mensaje para casos no soportados
const drawNotSupported = () => {
  const containerWidth = graphContainer.value.clientWidth;
  const containerHeight = Math.min(containerWidth * 0.8, 400);

  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, containerWidth, containerHeight);

  ctx.fillStyle = '#666666';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(
    'La visualización gráfica solo está disponible para problemas de 2 variables.',
    containerWidth / 2,
    containerHeight / 2 - 20
  );

  ctx.font = '14px Arial';
  ctx.fillText(
    'Para visualizar este problema, utilice la vista de iteraciones.',
    containerWidth / 2,
    containerHeight / 2 + 20
  );
};

// Observar cambios en el problema y la solución
watch(() => props.problem, () => {
  if (props.problem.numVars === 2) {
    drawGraph();
  }
}, { deep: true });

watch(() => props.solution, () => {
  if (props.problem.numVars === 2) {
    drawGraph();
  }
}, { deep: true });

// Redimensionar el gráfico cuando cambia el tamaño de la ventana
const handleResize = () => {
  if (props.problem.numVars === 2) {
    drawGraph();
  }
};

// Ciclo de vida del componente
onMounted(() => {
  if (props.problem.numVars === 2) {
    drawGraph();
  } else {
    nextTick(() => {
      if (graphCanvas.value && graphContainer.value) {
        ctx = graphCanvas.value.getContext('2d');
        drawNotSupported();
        loading.value = false;
      }
    });
  }

  window.addEventListener('resize', handleResize);
});

// Limpiar eventos al desmontar el componente
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.simplex-graph-container {
  position: relative;
  width: 100%;
  min-height: 300px;
}

.simplex-graph-canvas {
  display: block;
  width: 100%;
  height: auto;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 10;
}
</style>
