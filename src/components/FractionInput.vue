<!-- FractionInput.vue - Componente para ingresar coeficientes como fracciones -->
<template>
  <div class="fraction-input">
    <input type="text" class="form-control" :class="{ 'is-invalid': !isValid && isDirty }" :value="displayValue"
      @input="handleInput" @blur="handleBlur" :placeholder="placeholder" />
    <div v-if="!isValid && isDirty" class="invalid-feedback">
      Formato inválido. Use un número o una fracción (ej: 1/2).
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { isValidFractionString, parseFraction, fractionToString, fractionToDecimal } from '../services/fractionService';

// Props
const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: 0
  },
  placeholder: {
    type: String,
    default: "0"
  }
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Estado interno
const displayValue = ref('');
const isDirty = ref(false);
const isValid = ref(true);

// Inicializar el valor mostrado
const initDisplayValue = () => {
  try {
    // Si es un número, convertirlo a fracción
    if (typeof props.modelValue === 'number') {
      const fraction = isNaN(props.modelValue) ? { numerator: 0, denominator: 1 } :
        parseFraction(props.modelValue.toString());
      displayValue.value = fractionToString(fraction);
    }
    // Si es una cadena, verificar si es una fracción válida
    else if (typeof props.modelValue === 'string') {
      if (isValidFractionString(props.modelValue)) {
        displayValue.value = props.modelValue;
      } else {
        displayValue.value = '0';
      }
    } else {
      displayValue.value = '0';
    }
    isValid.value = true;
  } catch (error) {
    console.error('Error al inicializar el valor:', error);
    displayValue.value = '0';
    isValid.value = false;
  }
};

// Vigilar cambios en el valor del modelo
watch(() => props.modelValue, initDisplayValue, { immediate: true });

// Manejar la entrada del usuario
const handleInput = (event) => {
  const value = event.target.value;
  displayValue.value = value;

  // Validar la entrada
  isValid.value = isValidFractionString(value);

  // Si es válido, emitir el valor decimal
  if (isValid.value && value !== '') {
    try {
      const fraction = parseFraction(value);
      const decimal = fractionToDecimal(fraction);
      emit('update:modelValue', decimal);
    } catch (error) {
      console.error('Error al procesar la fracción:', error);
      isValid.value = false;
    }
  } else if (value === '') {
    emit('update:modelValue', 0);
  }
};

// Manejar el evento blur
const handleBlur = () => {
  isDirty.value = true;

  // Si está vacío o no es válido, resetear a 0
  if (displayValue.value === '' || !isValid.value) {
    displayValue.value = '0';
    emit('update:modelValue', 0);
    isValid.value = true;
  }
  // Si es válido, formatear la fracción
  else if (isValid.value) {
    try {
      const fraction = parseFraction(displayValue.value);
      displayValue.value = fractionToString(fraction);
    } catch (error) {
      console.error('Error al formatear la fracción:', error);
    }
  }
};
</script>

<style scoped>
.fraction-input {
  width: 100%;
}
</style>
