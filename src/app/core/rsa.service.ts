import { Injectable } from '@angular/core';

/**
 * Servicio para operaciones criptográficas RSA.
 * Usa terminología "codificar/descodificar" en lugar de "encriptar/desencriptar".
 */
@Injectable({
  providedIn: 'root'
})
export class RsaService {

  /**
   * Verifica si un número es primo usando trial division optimizado.
   * Prueba divisores hasta √n saltando pares después del 2.
   */
  isPrime(n: number): boolean {
    if (n <= 1) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    const sqrt = Math.floor(Math.sqrt(n));
    for (let i = 3; i <= sqrt; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  /**
   * Calcula el máximo común divisor usando el algoritmo de Euclides.
   */
  gcd(a: number, b: number): number {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  /**
   * Algoritmo Extendido de Euclides.
   * Retorna { g, x, y } donde g = gcd(a, b) y a*x + b*y = g
   */
  egcd(a: number, b: number): { g: number; x: number; y: number } {
    if (b === 0) {
      return { g: a, x: 1, y: 0 };
    }
    
    const { g, x: x1, y: y1 } = this.egcd(b, a % b);
    const x = y1;
    const y = x1 - Math.floor(a / b) * y1;
    
    return { g, x, y };
  }

  /**
   * Calcula el inverso modular de e mod phi.
   * Lanza error si no existe (cuando gcd(e, phi) !== 1).
   */
  modInverse(e: number, phi: number): number {
    const { g, x } = this.egcd(e, phi);
    
    if (g !== 1) {
      throw new Error('El inverso modular no existe (gcd(e, φ(n)) !== 1)');
    }
    
    // Asegurar que d sea positivo
    return ((x % phi) + phi) % phi;
  }

  /**
   * Exponenciación modular rápida (square-and-multiply).
   * Calcula (base^exp) mod mod de forma eficiente.
   */
  modPow(base: number, exp: number, mod: number): number {
    if (mod === 1) return 0;
    
    let result = 1;
    base = base % mod;
    
    while (exp > 0) {
      // Si el bit actual es 1, multiplicar base al resultado
      if (exp % 2 === 1) {
        result = (result * base) % mod;
      }
      // Desplazar exp a la derecha (dividir por 2)
      exp = Math.floor(exp / 2);
      // Elevar base al cuadrado
      base = (base * base) % mod;
    }
    
    return result;
  }

  /**
   * Codifica un código de carácter usando la clave pública (e, n).
   */
  encodeChar(code: number, e: number, n: number): number {
    return this.modPow(code, e, n);
  }

  /**
   * Descodifica un código de carácter usando la clave privada (d, n).
   */
  decodeChar(code: number, d: number, n: number): number {
    return this.modPow(code, d, n);
  }

  /**
   * Genera candidatos válidos para e dado φ(n).
   * Filtra números que cumplen: 1 < e < phi y gcd(e, phi) === 1
   * Genera TODOS los candidatos posibles, no solo una lista predefinida.
   */
  getCandidateEs(phi: number): number[] {
    const candidates: number[] = [];
    
    // Iterar desde 3 hasta phi-1, probando solo números impares
    // (2 casi nunca es válido porque phi suele ser par)
    for (let e = 3; e < phi; e += 2) {
      if (this.gcd(e, phi) === 1) {
        candidates.push(e);
      }
    }
    
    // Si 2 es válido (raro pero posible), agregarlo al inicio
    if (this.gcd(2, phi) === 1) {
      candidates.unshift(2);
    }
    
    return candidates;
  }

  /**
   * Valida que e sea válido para el φ(n) dado.
   */
  isValidE(e: number, phi: number): boolean {
    return e > 1 && e < phi && this.gcd(e, phi) === 1;
  }

  /**
   * Genera los pasos del algoritmo extendido de Euclides para visualización.
   * Retorna tabla con iteraciones mostrando k, r, q, x, y.
   */
  getEgcdSteps(a: number, b: number): Array<{ k: number; r: number; q: number; x: number; y: number }> {
    const steps: Array<{ k: number; r: number; q: number; x: number; y: number }> = [];
    
    let r0 = a, r1 = b;
    let x0 = 1, x1 = 0;
    let y0 = 0, y1 = 1;
    let k = 0;
    
    steps.push({ k, r: r0, q: 0, x: x0, y: y0 });
    k++;
    steps.push({ k, r: r1, q: 0, x: x1, y: y1 });
    
    while (r1 !== 0) {
      const q = Math.floor(r0 / r1);
      const r2 = r0 % r1;
      const x2 = x0 - q * x1;
      const y2 = y0 - q * y1;
      
      k++;
      steps.push({ k, r: r2, q, x: x2, y: y2 });
      
      r0 = r1; r1 = r2;
      x0 = x1; x1 = x2;
      y0 = y1; y1 = y2;
    }
    
    return steps;
  }

  /**
   * Obtiene divisores probados para verificar primalidad (para visualización).
   */
  getTrialDivisors(n: number): number[] {
    if (n <= 1) return [];
    
    const divisors: number[] = [2];
    if (n === 2) return divisors;
    
    const sqrt = Math.floor(Math.sqrt(n));
    for (let i = 3; i <= sqrt; i += 2) {
      divisors.push(i);
    }
    
    return divisors;
  }
}
