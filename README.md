# Visualizador RSA Paso a Paso 🔐

Aplicación Angular standalone que permite visualizar el algoritmo RSA de forma didáctica, mostrando cada paso del proceso de codificación y descodificación.

## 📋 Características

- ✅ **Validación de números primos** con algoritmo optimizado (trial division)
- 🔢 **Cálculo automático** de n y φ(n)
- 🎯 **Selección inteligente de e** con candidatos válidos pre-filtrados
- 🔐 **Algoritmo Extendido de Euclides** para calcular d
- 📊 **Visualización paso a paso** con stepper interactivo
- 💬 **Codificación/Descodificación** carácter por carácter con ASCII
- 🔏 **Firma digital** (codificar con clave privada)
- ✔️ **Verificación de firma** (descodificar con clave pública)
- 📋 **Copiar resultados** al portapapeles
- ♿ **Accesible** con ARIA labels y alto contraste
- 📱 **Responsive** para móviles y tablets

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 18.x o superior
- **npm** 9.x o superior
- **Angular CLI** 20.x

## 📚 Documentación de Componentes

### 🔧 `src/app/core/rsa.service.ts`

**Propósito**: Servicio Angular que contiene toda la lógica matemática del algoritmo RSA como funciones puras.

**Responsabilidades**:
- ✅ Verificación de primalidad usando trial division optimizado
- ✅ Cálculos matemáticos: GCD, inverso modular, exponenciación modular
- ✅ Generación de candidatos válidos para el exponente e
- ✅ Codificación/descodificación de caracteres individuales
- ✅ Generación de datos para visualización paso a paso

**Métodos principales**:

```typescript
// Verificación de primalidad
isPrime(n: number): boolean
getTrialDivisors(n: number): number[]

// Algoritmos matemáticos
gcd(a: number, b: number): number
egcd(a: number, b: number): { gcd: number; x: number; y: number }
modInverse(e: number, phi: number): number
modPow(base: number, exp: number, mod: number): number

// RSA específico
getCandidateEs(phi: number): number[]
isValidE(e: number, phi: number): boolean
encodeChar(code: number, e: number, n: number): number
decodeChar(code: number, d: number, n: number): number

// Visualización
getEgcdSteps(a: number, b: number): Array<{k, r, q, x, y}>

### 🎨 `src/app/components/rsa-visualizer/rsa-visualizer.component.ts`

**Propósito**: Componente principal que maneja la lógica de la interfaz y orquesta el flujo RSA.

**Responsabilidades**:
- ✅ Manejo de formularios reactivos (p, q, e, mensaje)
- ✅ Validación de entradas del usuario
- ✅ Coordinación con RsaService para cálculos
- ✅ Gestión del estado de la UI (spinner, resultados, stepper)
- ✅ Generación de datos para visualización paso a paso
- ✅ Notificaciones al usuario (snackbars, alertas)
- ✅ Procesamiento asíncrono para no bloquear el UI

**Propiedades principales**:

```typescript
// Formularios
primesForm: FormGroup;      // p, q
eForm: FormGroup;           // exponente e
messageForm: FormGroup;      // mensaje y tipo de codificación

// Valores calculados
n: number | null;           // módulo
phi: number | null;         // totiente de Euler
d: number | null;           // exponente privado
candidateEs: number[];      // candidatos válidos para e
kIterations: Array<...>;    // iteraciones de k para visualización

// Mensajes procesados
encodedMessage: number[];           // mensaje codificado (pública)
decodedMessage: string;             // mensaje descodificado (privada)
encodedPrivateMessage: number[];    // firma digital
decodedPublicMessage: string;       // verificación de firma

// Visualización paso a paso
encodeOperations: CharOperation[];   // operaciones de codificación
decodeOperations: CharOperation[];   // operaciones de descodificación
egcdSteps: Array<...>;              // pasos del Euclides Extendido

// Estado UI
isCalculating: boolean;     // mostrar spinner
showSteps: boolean;         // mostrar stepper
```

**Métodos principales**:

```typescript
// Ciclo de vida
ngOnInit(): void
ngAfterViewChecked(): void  // Previene ExpressionChangedAfterItHasBeenCheckedError

// Validación y cálculos
validateAndCalculate(): void     // Valida p, q y calcula n, φ(n)
calculateD(): void               // Calcula d con Teorema de Euler
selectCandidate(e): void         // Selecciona exponente de la tabla

// Codificación/Descodificación
encodePublic(): void     // Codifica con clave pública (e, n)
decodePrivate(): void    // Descodifica con clave privada (d, n)
encodePrivate(): void    // Firma digital con clave privada
decodePublic(): void     // Verifica firma con clave pública

// Utilidades
showValidationAlert(title, message): void  // Popup con emoji
showInvalidExponentAlert(): void           // Alerta de exponente inválido
copyResults(): void                        // Copia resultados al portapapeles
reset(): void                              // Reinicia todos los valores
```

### 📊 Flujo de datos

```
Usuario → Component (HTML)
           ↓ (evento)
Component (TS) → Validación
           ↓
Component → RsaService → Cálculos matemáticos
           ↓
RsaService → Component
           ↓
Component → Actualiza propiedades
           ↓
Change Detection → Re-render
           ↓
Template (HTML) → UI actualizada
```

