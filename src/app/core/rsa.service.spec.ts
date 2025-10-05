import { TestBed } from '@angular/core/testing';
import { RsaService } from './rsa.service';

describe('RsaService', () => {
  let service: RsaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RsaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isPrime', () => {
    it('should return false for numbers <= 1', () => {
      expect(service.isPrime(0)).toBeFalse();
      expect(service.isPrime(1)).toBeFalse();
      expect(service.isPrime(-5)).toBeFalse();
    });

    it('should return true for 2', () => {
      expect(service.isPrime(2)).toBeTrue();
    });

    it('should return false for even numbers > 2', () => {
      expect(service.isPrime(4)).toBeFalse();
      expect(service.isPrime(10)).toBeFalse();
      expect(service.isPrime(100)).toBeFalse();
    });

    it('should return true for prime numbers', () => {
      expect(service.isPrime(3)).toBeTrue();
      expect(service.isPrime(5)).toBeTrue();
      expect(service.isPrime(7)).toBeTrue();
      expect(service.isPrime(11)).toBeTrue();
      expect(service.isPrime(13)).toBeTrue();
      expect(service.isPrime(17)).toBeTrue();
      expect(service.isPrime(19)).toBeTrue();
      expect(service.isPrime(23)).toBeTrue();
      expect(service.isPrime(97)).toBeTrue();
    });

    it('should return false for composite numbers', () => {
      expect(service.isPrime(9)).toBeFalse();
      expect(service.isPrime(15)).toBeFalse();
      expect(service.isPrime(21)).toBeFalse();
      expect(service.isPrime(25)).toBeFalse();
      expect(service.isPrime(91)).toBeFalse(); // 7 * 13
    });
  });

  describe('gcd', () => {
    it('should calculate gcd correctly', () => {
      expect(service.gcd(48, 18)).toBe(6);
      expect(service.gcd(17, 416)).toBe(1);
      expect(service.gcd(100, 50)).toBe(50);
      expect(service.gcd(7, 13)).toBe(1);
    });

    it('should handle edge cases', () => {
      expect(service.gcd(0, 5)).toBe(5);
      expect(service.gcd(5, 0)).toBe(5);
    });
  });

  describe('egcd', () => {
    it('should calculate extended gcd correctly', () => {
      const result = service.egcd(17, 416);
      expect(result.g).toBe(1);
      // Verificar que a*x + b*y = g
      expect(17 * result.x + 416 * result.y).toBe(result.g);
    });

    it('should work with coprimes', () => {
      const result = service.egcd(7, 13);
      expect(result.g).toBe(1);
      expect(7 * result.x + 13 * result.y).toBe(1);
    });
  });

  describe('modInverse', () => {
    it('should calculate modular inverse correctly', () => {
      // 17 * 233 ≡ 1 (mod 416)
      const d = service.modInverse(17, 416);
      expect((17 * d) % 416).toBe(1);
    });

    it('should throw error when inverse does not exist', () => {
      expect(() => service.modInverse(4, 8)).toThrow();
    });

    it('should return positive result', () => {
      const d = service.modInverse(17, 416);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThan(416);
    });
  });

  describe('modPow', () => {
    it('should calculate modular exponentiation correctly', () => {
      // Ejemplo del enunciado: 65^17 mod 437 = 297
      expect(service.modPow(65, 17, 437)).toBe(297);
    });

    it('should work with inverse operation', () => {
      // 297^233 mod 437 = 65
      expect(service.modPow(297, 233, 437)).toBe(65);
    });

    it('should handle small values', () => {
      expect(service.modPow(2, 3, 5)).toBe(3); // 8 mod 5 = 3
      expect(service.modPow(3, 4, 7)).toBe(4); // 81 mod 7 = 4
    });

    it('should handle large exponents efficiently', () => {
      const result = service.modPow(2, 100, 1000);
      expect(result).toBeDefined();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1000);
    });
  });

  describe('encodeChar and decodeChar', () => {
    it('should encode and decode correctly with example values', () => {
      const n = 437; // 19 * 23
      const e = 17;
      const d = 233;
      const ascii = 65; // 'A'

      const encoded = service.encodeChar(ascii, e, n);
      expect(encoded).toBe(297);

      const decoded = service.decodeChar(encoded, d, n);
      expect(decoded).toBe(ascii);
    });

    it('should work for different characters', () => {
      const n = 437;
      const e = 17;
      const d = 233;

      // Test multiple characters
      const testChars = [65, 67, 73, 83]; // A, C, I, S
      testChars.forEach(ascii => {
        const encoded = service.encodeChar(ascii, e, n);
        const decoded = service.decodeChar(encoded, d, n);
        expect(decoded).toBe(ascii);
      });
    });
  });

  describe('getCandidateEs', () => {
    it('should return valid candidates for e', () => {
      const phi = 416; // (19-1) * (23-1)
      const candidates = service.getCandidateEs(phi);

      // Debe tener muchos candidatos
      expect(candidates.length).toBeGreaterThan(50);

      // Todos deben ser menores que phi
      candidates.forEach(e => {
        expect(e).toBeLessThan(phi);
      });

      // Todos deben ser coprimos con phi
      candidates.forEach(e => {
        expect(service.gcd(e, phi)).toBe(1);
      });

      // Debe incluir 17 (ejemplo del enunciado)
      expect(candidates).toContain(17);
      
      // Debe incluir otros valores comunes
      expect(candidates).toContain(5);
      expect(candidates).toContain(7);
      expect(candidates).toContain(13);
    });

    it('should generate all valid candidates', () => {
      const phi = 100;
      const candidates = service.getCandidateEs(phi);

      // Verificar que todos los candidatos sean válidos
      candidates.forEach(e => {
        expect(e).toBeGreaterThan(1);
        expect(e).toBeLessThan(phi);
        expect(service.gcd(e, phi)).toBe(1);
      });

      // No debe incluir números que no sean coprimos con 100
      expect(candidates).not.toContain(4);
      expect(candidates).not.toContain(10);
      expect(candidates).not.toContain(25);
      expect(candidates).not.toContain(50);
    });
  });

  describe('isValidE', () => {
    it('should validate e correctly', () => {
      const phi = 416;

      expect(service.isValidE(17, phi)).toBeTrue();
      expect(service.isValidE(5, phi)).toBeTrue();
    });

    it('should reject invalid e values', () => {
      const phi = 416;

      expect(service.isValidE(1, phi)).toBeFalse(); // e <= 1
      expect(service.isValidE(416, phi)).toBeFalse(); // e >= phi
      expect(service.isValidE(4, phi)).toBeFalse(); // gcd(4, 416) != 1
    });
  });

  describe('getEgcdSteps', () => {
    it('should generate steps for visualization', () => {
      const steps = service.getEgcdSteps(17, 416);

      // Debe tener al menos 2 pasos
      expect(steps.length).toBeGreaterThan(2);

      // Primer paso debe tener r = 17
      expect(steps[0].r).toBe(17);

      // Segundo paso debe tener r = 416
      expect(steps[1].r).toBe(416);

      // Último paso debe tener r = 0 o r = gcd
      const lastStep = steps[steps.length - 1];
      expect([0, 1].includes(lastStep.r)).toBeTrue();
    });
  });

  describe('getTrialDivisors', () => {
    it('should return divisors to test for primality', () => {
      const divisors = service.getTrialDivisors(19);

      // Debe incluir 2
      expect(divisors).toContain(2);

      // Debe incluir impares hasta √19 ≈ 4.3
      expect(divisors).toContain(3);

      // No debe incluir números mayores que √19
      expect(divisors.every(d => d * d <= 19)).toBeTrue();
    });

    it('should handle small numbers', () => {
      expect(service.getTrialDivisors(2)).toEqual([2]);
      expect(service.getTrialDivisors(3)).toEqual([2]);
    });

    it('should return empty for invalid numbers', () => {
      expect(service.getTrialDivisors(1)).toEqual([]);
      expect(service.getTrialDivisors(0)).toEqual([]);
    });
  });
});
