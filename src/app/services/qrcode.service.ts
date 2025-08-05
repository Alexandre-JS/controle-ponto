import { Injectable } from '@angular/core';
import { EmployeeService } from './employee.service';
import { NetworkService } from './network.service';
import { Employee } from '../models/employee.model';

interface QRCodeCacheItem {
  data: string;
  employeeCode: string;
  generated: number; // timestamp
  expiresAt: number; // timestamp
}

interface QRVerificationResult {
  valid: boolean;
  employeeCode?: string;
  error?: string;
  expired?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private readonly QRCODE_CACHE_KEY = 'qrcode_cache';
  private readonly QR_EXPIRATION_HOURS = 24; // QR codes expire after 24 hours
  
  constructor(
    private employeeService: EmployeeService,
    private networkService: NetworkService
  ) {}

  async generateQRCode(employeeId: string): Promise<string> {
    try {
      // Verificar se já tem um QR code em cache válido (não expirado)
      const cachedQrCodes = this.getQrCodeCache();
      const cachedQrCode = cachedQrCodes[employeeId];
      
      const now = Date.now();
      if (cachedQrCode && cachedQrCode.expiresAt > now) {
        console.log('Usando QR code do cache (válido)');
        return cachedQrCode.data;
      }
      
      // Se não tiver em cache ou expirou, gerar um novo
      console.log('Gerando novo QR code');
      
      let employee: Employee | null = null;
      
      // Buscar do servidor
      if (this.networkService.isOnline()) {
        try {
          employee = await this.employeeService.findEmployeeById(employeeId);
          if (!employee) {
            throw new Error('Funcionário não encontrado');
          }
        } catch (error) {
          console.warn('Erro ao buscar funcionário para QR code:', error);
        }
      }
      
      if (!employee) {
        throw new Error('Funcionário não encontrado');
      }
      
      // Usar código interno como base do QR Code + timestamp para segurança
      const timestamp = now;
      const expiresAt = now + (this.QR_EXPIRATION_HOURS * 60 * 60 * 1000);
      const qrData = JSON.stringify({
        code: employee.internal_code,
        ts: timestamp,
        exp: expiresAt,
        v: 1  // versão do formato
      });
      
      // Salvar no cache
      cachedQrCodes[employeeId] = {
        data: qrData,
        employeeCode: employee.internal_code,
        generated: timestamp,
        expiresAt: expiresAt
      };
      localStorage.setItem(this.QRCODE_CACHE_KEY, JSON.stringify(cachedQrCodes));
      
      return qrData;
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      throw error;
    }
  }
  
  verifyQRCode(qrData: string): QRVerificationResult {
    try {
      const data = JSON.parse(qrData);
      
      // Verificar formato
      if (!data.code || !data.ts || !data.v) {
        return { valid: false, error: 'Formato de QR code inválido' };
      }
      
      // Verificar expiração
      const now = Date.now();
      const expiresAt = data.exp || data.ts + (this.QR_EXPIRATION_HOURS * 60 * 60 * 1000);
      
      if (now > expiresAt) {
        return { 
          valid: false, 
          expired: true,
          employeeCode: data.code,
          error: 'QR code expirado' 
        };
      }
      
      // Retornar o código interno para identificação do funcionário
      return { 
        valid: true,
        employeeCode: data.code 
      };
    } catch (error) {
      console.error('Erro ao verificar QR code:', error);
      return { valid: false, error: 'QR code inválido ou danificado' };
    }
  }
  
  private getQrCodeCache(): { [employeeId: string]: QRCodeCacheItem } {
    const cache = localStorage.getItem(this.QRCODE_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  }
  
  clearQrCodeCache(): void {
    localStorage.removeItem(this.QRCODE_CACHE_KEY);
  }
  
  refreshQrCode(employeeId: string): void {
    const cachedQrCodes = this.getQrCodeCache();
    delete cachedQrCodes[employeeId];
    localStorage.setItem(this.QRCODE_CACHE_KEY, JSON.stringify(cachedQrCodes));
  }

  // Novo método para limpar códigos expirados
  cleanExpiredCodes(): void {
    const cachedQrCodes = this.getQrCodeCache();
    const now = Date.now();
    let cleaned = false;
    
    Object.keys(cachedQrCodes).forEach(employeeId => {
      if (cachedQrCodes[employeeId].expiresAt < now) {
        delete cachedQrCodes[employeeId];
        cleaned = true;
      }
    });
    
    if (cleaned) {
      localStorage.setItem(this.QRCODE_CACHE_KEY, JSON.stringify(cachedQrCodes));
    }
  }

  // Verificar se tem QR code válido no cache
  hasValidQrCode(employeeId: string): boolean {
    const cachedQrCodes = this.getQrCodeCache();
    const cachedQrCode = cachedQrCodes[employeeId];
    
    if (!cachedQrCode) return false;
    
    const now = Date.now();
    return cachedQrCode.expiresAt > now;
  }
}
