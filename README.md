# DANTZIG

Una moderna aplicación web para programación lineal y optimización de operaciones con una interfaz de usuario intuitiva y potente, impulsada por YALPS.

## Acerca de DANTZIG

DANTZIG es una aplicación web de programación lineal que ofrece una interfaz de usuario moderna y amigable para resolver problemas de optimización. Inspirada en el software TORA, pero desarrollada con tecnologías web contemporáneas, DANTZIG facilita la visualización y resolución de problemas de programación lineal y otras técnicas de investigación de operaciones.

Nombrada en honor a George Dantzig, el padre del algoritmo simplex, esta aplicación combina la potencia del motor de optimización YALPS con una interfaz de usuario elegante construida con Vue 3 y Composition API.

## Características principales

- **Interfaz de usuario moderna**: Diseño limpio e intuitivo optimizado para la experiencia del usuario
- **Motor YALPS**: Potente biblioteca de programación lineal para resolver problemas complejos
- **Visualización gráfica**: Representación visual de problemas y soluciones en 2D
- **Modo tutorial**: Explicaciones paso a paso para fines educativos
- **Múltiples módulos**: Soporte para programación lineal, transporte, asignación y más

## Modelos de optimización

DANTZIG permite trabajar con diversos modelos de programación lineal:

```javascript
// Ejemplo de modelo para YALPS
const modelo = {
  direction: "maximize",
  objective: "profit",
  constraints: {
    wood: { max: 300 },
    labor: { max: 110 }, 
    storage: { max: 400 },
  },
  variables: {
    table: { wood: 30, labor: 5, profit: 1200, storage: 30 },
    dresser: { wood: 20, labor: 10, profit: 1600, storage: 50 },
  },
  integers: ["table", "dresser"]
};
```

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Arquitectura

DANTZIG está construido con un diseño modular:

- **Core**: Motor de cálculo basado en YALPS para resolver problemas de optimización
- **UI**: Interfaz de usuario construida con Vue 3 y Composition API
- **Modules**: Diferentes módulos para tipos específicos de problemas de optimización
  - Programación lineal
  - Modelos de transporte
  - Problemas de asignación
  - Flujo en redes
  - Programación entera
  - CPM/PERT

## Interfaz de usuario

La interfaz de DANTZIG está diseñada para ser intuitiva y fácil de usar, con características como:

- Entrada de datos a través de formularios interactivos
- Visualización dinámica de restricciones y función objetivo
- Representación gráfica de soluciones
- Modo tutorial con explicaciones paso a paso
- Exportación de resultados en múltiples formatos

## Dependencias principales

- Vue 3 (Composition API)
- YALPS (motor de programación lineal)
- Bootstrap 5 (para estilos)
- Iconify (para iconos)
- Chart.js (para visualizaciones)

## Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Haga fork del repositorio
2. Cree una nueva rama (`git checkout -b feature/nueva-caracteristica`)
3. Haga commit de sus cambios (`git commit -am 'Agrega nueva característica'`)
4. Haga push a la rama (`git push origin feature/nueva-caracteristica`)
5. Cree un nuevo Pull Request

## Licencia

MIT