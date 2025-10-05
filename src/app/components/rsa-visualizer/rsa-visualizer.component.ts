import { Component, OnInit, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RsaService } from '../../core/rsa.service';

interface CharOperation {
  char: string;
  ascii: number;
  operation: string;
  result: number;
  resultChar: string;
}

@Component({
  selector: 'app-rsa-visualizer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatStepperModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './rsa-visualizer.component.html',
  styleUrls: ['./rsa-visualizer.component.scss']
})
export class RsaVisualizerComponent implements OnInit, AfterViewChecked {
  private previousIsCalculating: boolean = false;
  primesForm: FormGroup;
  eForm: FormGroup;
  messageForm: FormGroup;

  // Referencia a Math para usar en el template
  Math = Math;

  // Valores calculados
  n: number | null = null;
  phi: number | null = null;
  d: number | null = null;
  candidateEs: number[] = [];
  
  // Datos para visualización del cálculo de d
  kIterations: Array<{k: number, e: number, remainder: number, result: string, isValid: boolean}> = [];
  selectedK = 0;

  // Mensajes codificados/descodificados
  encodedMessage: number[] = [];
  decodedMessage: string = '';
  encodedPrivateMessage: number[] = [];
  decodedPublicMessage: string = '';

  // Datos para visualización paso a paso
  primeCheckP: { divisors: number[]; isPrime: boolean } | null = null;
  primeCheckQ: { divisors: number[]; isPrime: boolean } | null = null;
  egcdSteps: Array<{ k: number; r: number; q: number; x: number; y: number }> = [];
  encodeOperations: CharOperation[] = [];
  decodeOperations: CharOperation[] = [];
  encodePrivateOperations: CharOperation[] = [];
  decodePublicOperations: CharOperation[] = [];

  // Estado UI
  isCalculating = false;
  showSteps = false;

  constructor(
    private fb: FormBuilder,
    private rsaService: RsaService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    // Formulario para p y q sin valores pre-cargados
    this.primesForm = this.fb.group({
      p: [null, [Validators.required, Validators.min(3)]],
      q: [null, [Validators.required, Validators.min(3)]]
    });

    // Formulario para e sin valor pre-cargado
    this.eForm = this.fb.group({
      e: [null, [Validators.required, Validators.min(2)]]
    });

    // Formulario para mensaje sin valor pre-cargado
    this.messageForm = this.fb.group({
      message: ['', Validators.required],
      encodingType: ['ASCII', Validators.required]
    });
  }

  ngOnInit(): void {
    // No pre-calcular, dejar que el usuario ingrese los valores
  }

  ngAfterViewChecked(): void {
    // Detectar cambios solo si isCalculating realmente cambió
    if (this.previousIsCalculating !== this.isCalculating) {
      this.previousIsCalculating = this.isCalculating;
    }
  }

  /**
   * Valida p y q, y calcula n y φ(n).
   */
  validateAndCalculate(): void {
    const p = this.primesForm.get('p')?.value;
    const q = this.primesForm.get('q')?.value;

    // Validar que sean números enteros > 2
    if (!Number.isInteger(p) || !Number.isInteger(q) || p <= 2 || q <= 2) {
      this.showValidationAlert('Valores Inválidos', 'p y q deben ser enteros mayores que 2');
      return;
    }

    // Validar que sean diferentes
    if (p === q) {
      this.showValidationAlert('Valores Inválidos', 'p y q deben ser diferentes');
      return;
    }

    // Verificar primalidad
    const pIsPrime = this.rsaService.isPrime(p);
    const qIsPrime = this.rsaService.isPrime(q);

    // Guardar resultados de verificación para visualización
    this.primeCheckP = {
      divisors: this.rsaService.getTrialDivisors(p),
      isPrime: pIsPrime
    };
    this.primeCheckQ = {
      divisors: this.rsaService.getTrialDivisors(q),
      isPrime: qIsPrime
    };

    if (!pIsPrime) {
      this.showValidationAlert('Número No Primo', `El valor p = ${p} no es un número primo`);
      return;
    }

    if (!qIsPrime) {
      this.showValidationAlert('Número No Primo', `El valor q = ${q} no es un número primo`);
      return;
    }

    // Calcular n y φ(n)
    this.n = p * q;
    this.phi = (p - 1) * (q - 1);

    // Obtener candidatos válidos para e
    this.candidateEs = this.rsaService.getCandidateEs(this.phi);

    // Si el e actual es válido, calculamos d automáticamente
    const currentE = this.eForm.get('e')?.value;
    if (currentE && this.rsaService.isValidE(currentE, this.phi)) {
      this.calculateD();
    }

    this.snackBar.open('¡Valores válidos! n y φ(n) calculados', 'Cerrar', { duration: 2000 });
  }

  /**
   * Calcula d y genera los pasos del algoritmo extendido de Euclides.
   */
  calculateD(): void {
    const e = this.eForm.get('e')?.value;

    if (!this.phi) {
      this.snackBar.open('Primero calcula n y φ(n)', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validar que e esté en la lista de candidatos
    if (!this.candidateEs.includes(e)) {
      this.showInvalidExponentAlert();
      return;
    }

    if (!this.rsaService.isValidE(e, this.phi)) {
      this.snackBar.open('e no es coprimo con φ(n)', 'Cerrar', { duration: 3000 });
      return;
    }

    try {
      // Calcular d usando el inverso modular
      this.d = this.rsaService.modInverse(e, this.phi);
      this.egcdSteps = this.rsaService.getEgcdSteps(e, this.phi);
      
      // Generar las iteraciones de k para mostrar el proceso educativo
      this.kIterations = [];
      let k = 1;
      let found = false;
      
      // Mostrar hasta 10 iteraciones para visualización educativa
      while (k <= 10 && !found) {
        const numerator = 1 + k * this.phi;
        const remainder = numerator % e;
        const isValid = remainder === 0;
        
        this.kIterations.push({
          k: k,
          e: e,
          remainder: remainder,
          result: isValid ? '✓' : '✗',
          isValid: isValid
        });
        
        if (isValid && !found) {
          this.selectedK = k;
          found = true;
        }
        
        k++;
      }
      
      // Si no se encontró en las primeras 10 iteraciones, calcular el k correcto
      if (!found) {
        // El k correcto se puede calcular con: k = (d * e - 1) / phi
        this.selectedK = Math.floor((this.d * e - 1) / this.phi);
        
        // Agregar el k correcto a la tabla
        const numerator = 1 + this.selectedK * this.phi;
        this.kIterations.push({
          k: this.selectedK,
          e: e,
          remainder: numerator % e,
          result: '✓',
          isValid: true
        });
      }
      
      this.snackBar.open(`d calculado: ${this.d}`, 'Cerrar', { duration: 2000 });
    } catch (error) {
      this.snackBar.open('Error calculando d: ' + (error as Error).message, 'Cerrar', { duration: 3000 });
    }
  }

  /**
   * Muestra alerta personalizada genérica con el emoji.
   */
  showValidationAlert(title: string, message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                  background: rgba(0,0,0,0.7); display: flex; align-items: center; 
                  justify-content: center; z-index: 10000;">
        <div style="background: white; padding: 30px; border-radius: 16px; 
                    text-align: center; max-width: 450px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          <img src="https://images.emojiterra.com/google/android-10/512px/1f595-1f3fc.png" 
               style="width: 80px; height: 80px; margin-bottom: 20px;" />
          <h2 style="color: #d32f2f; margin: 0 0 16px 0; font-size: 1.5rem;">${title}</h2>
          <p style="color: #666; margin: 0 0 24px 0; font-size: 1rem;">
            ${message}
          </p>
          <button id="closeAlert" style="background: #1976d2; color: white; border: none; 
                  padding: 12px 32px; border-radius: 8px; font-size: 1rem; cursor: pointer; 
                  font-weight: 500; transition: background 0.3s;">
            Entendido
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(alertDiv);
    
    const closeBtn = document.getElementById('closeAlert');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(alertDiv);
      });
      closeBtn.addEventListener('mouseover', () => {
        closeBtn.style.background = '#1565c0';
      });
      closeBtn.addEventListener('mouseout', () => {
        closeBtn.style.background = '#1976d2';
      });
    }
  }

  /**
   * Muestra alerta personalizada cuando el exponente no está en la tabla.
   */
  showInvalidExponentAlert(): void {
    const e = this.eForm.get('e')?.value;
    this.showValidationAlert(
      '¡Exponente Inválido!',
      `El número escogido <strong>${e}</strong> no está en la tabla de candidatos válidos.`
    );
  }

  /**
   * Codifica el mensaje usando la clave pública (e, n).
   */
  encodePublic(): void {
    const message = this.messageForm.get('message')?.value;
    const e = this.eForm.get('e')?.value;

    if (!this.n || !e) {
      this.snackBar.open('Completa todos los pasos anteriores', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!message || message.trim() === '') {
      this.snackBar.open('Ingresa un mensaje para codificar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isCalculating = true;
    this.cdr.detectChanges(); // Forzar detección antes del proceso
    
    this.encodeOperations = [];
    this.encodedMessage = [];

    // Procesar de forma asíncrona
    Promise.resolve().then(() => {
      const operations: CharOperation[] = [];
      const encoded: number[] = [];
      
      for (let i = 0; i < message.length; i++) {
        const char = message[i];
        const ascii = char.charCodeAt(0);
        const encodedValue = this.rsaService.encodeChar(ascii, e, this.n!);
        
        encoded.push(encodedValue);
        operations.push({
          char,
          ascii,
          operation: `${ascii}^${e} mod ${this.n}`,
          result: encodedValue,
          resultChar: String.fromCharCode(encodedValue < 128 ? encodedValue : ascii)
        });
      }

      this.encodedMessage = encoded;
      this.encodeOperations = operations;
      this.showSteps = true;
      this.isCalculating = false;
      this.cdr.detectChanges(); // Forzar detección después del proceso
      
      this.snackBar.open('Mensaje codificado con clave pública', 'Cerrar', { duration: 2000 });
    });
  }

  /**
   * Descodifica el mensaje usando la clave privada (d, n).
   */
  decodePrivate(): void {
    const d = this.d;

    if (!this.n || !d || this.encodedMessage.length === 0) {
      this.snackBar.open('Primero codifica un mensaje', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isCalculating = true;
    this.cdr.detectChanges();
    
    this.decodeOperations = [];
    this.decodedMessage = '';

    // Procesar de forma asíncrona
    Promise.resolve().then(() => {
      const operations: CharOperation[] = [];
      let decodedText = '';
      
      for (let i = 0; i < this.encodedMessage.length; i++) {
        const encoded = this.encodedMessage[i];
        const decoded = this.rsaService.decodeChar(encoded, d, this.n!);
        const char = String.fromCharCode(decoded);
        
        decodedText += char;
        operations.push({
          char: `[${encoded}]`,
          ascii: encoded,
          operation: `${encoded}^${d} mod ${this.n}`,
          result: decoded,
          resultChar: char
        });
      }

      this.decodedMessage = decodedText;
      this.decodeOperations = operations;
      this.isCalculating = false;
      this.cdr.detectChanges();
      
      this.snackBar.open('Mensaje descodificado con clave privada', 'Cerrar', { duration: 2000 });
    });
  }

  /**
   * Codifica el mensaje usando la clave privada (d, n) - para firma.
   */
  encodePrivate(): void {
    const message = this.messageForm.get('message')?.value;
    const d = this.d;

    if (!this.n || !d) {
      this.snackBar.open('Completa todos los pasos anteriores', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!message || message.trim() === '') {
      this.snackBar.open('Ingresa un mensaje para codificar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isCalculating = true;
    this.cdr.detectChanges();
    
    this.encodePrivateOperations = [];
    this.encodedPrivateMessage = [];

    // Procesar de forma asíncrona
    Promise.resolve().then(() => {
      const operations: CharOperation[] = [];
      const encoded: number[] = [];
      
      for (let i = 0; i < message.length; i++) {
        const char = message[i];
        const ascii = char.charCodeAt(0);
        const encodedValue = this.rsaService.encodeChar(ascii, d, this.n!);
        
        encoded.push(encodedValue);
        operations.push({
          char,
          ascii,
          operation: `${ascii}^${d} mod ${this.n}`,
          result: encodedValue,
          resultChar: String.fromCharCode(encodedValue < 128 ? encodedValue : ascii)
        });
      }

      this.encodedPrivateMessage = encoded;
      this.encodePrivateOperations = operations;
      this.showSteps = true;
      this.isCalculating = false;
      this.cdr.detectChanges();
      
      this.snackBar.open('Mensaje codificado con clave privada (firma)', 'Cerrar', { duration: 2000 });
    });
  }

  /**
   * Descodifica el mensaje usando la clave pública (e, n) - para verificación.
   */
  decodePublic(): void {
    const e = this.eForm.get('e')?.value;

    if (!this.n || !e || this.encodedPrivateMessage.length === 0) {
      this.snackBar.open('Primero codifica un mensaje con clave privada', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isCalculating = true;
    this.cdr.detectChanges();
    
    this.decodePublicOperations = [];
    this.decodedPublicMessage = '';

    // Procesar de forma asíncrona
    Promise.resolve().then(() => {
      const operations: CharOperation[] = [];
      let decodedText = '';
      
      for (let i = 0; i < this.encodedPrivateMessage.length; i++) {
        const encoded = this.encodedPrivateMessage[i];
        const decoded = this.rsaService.decodeChar(encoded, e, this.n!);
        const char = String.fromCharCode(decoded);
        
        decodedText += char;
        operations.push({
          char: `[${encoded}]`,
          ascii: encoded,
          operation: `${encoded}^${e} mod ${this.n}`,
          result: decoded,
          resultChar: char
        });
      }

      this.decodedPublicMessage = decodedText;
      this.decodePublicOperations = operations;
      this.isCalculating = false;
      this.cdr.detectChanges();
      
      this.snackBar.open('Mensaje descodificado con clave pública (verificación)', 'Cerrar', { duration: 2000 });
    });
  }

  /**
   * Copia los resultados al portapapeles.
   */
  copyResults(): void {
    const results = `
RSA - Resultados
================
p = ${this.primesForm.get('p')?.value}
q = ${this.primesForm.get('q')?.value}
n = ${this.n}
φ(n) = ${this.phi}
e = ${this.eForm.get('e')?.value}
d = ${this.d}

Mensaje original: ${this.messageForm.get('message')?.value}
Codificado (público): [${this.encodedMessage.join(', ')}]
Descodificado (privado): ${this.decodedMessage}
    `.trim();

    navigator.clipboard.writeText(results).then(() => {
      this.snackBar.open('Resultados copiados al portapapeles', 'Cerrar', { duration: 2000 });
    });
  }

  /**
   * Selecciona un candidato de exponente al hacer click.
   */
  selectCandidate(candidate: number): void {
    this.eForm.patchValue({ e: candidate });
    this.snackBar.open(`Exponente ${candidate} seleccionado`, 'Cerrar', { duration: 1500 });
  }

  /**
   * Reinicia todos los valores.
   */
  reset(): void {
    this.primesForm.reset({ p: null, q: null });
    this.eForm.reset({ e: null });
    this.messageForm.reset({ message: '', encodingType: 'ASCII' });
    
    this.n = null;
    this.phi = null;
    this.d = null;
    this.candidateEs = [];
    this.encodedMessage = [];
    this.decodedMessage = '';
    this.encodedPrivateMessage = [];
    this.decodedPublicMessage = '';
    this.primeCheckP = null;
    this.primeCheckQ = null;
    this.egcdSteps = [];
    this.encodeOperations = [];
    this.decodeOperations = [];
    this.encodePrivateOperations = [];
    this.decodePublicOperations = [];
    this.showSteps = false;

    this.snackBar.open('Valores reiniciados', 'Cerrar', { duration: 2000 });
  }
}
