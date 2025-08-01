export class ScheduleUtils {
  
  /**
   * Calcula a diferença em minutos entre dois horários
   */
  static getTimeDifferenceInMinutes(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }

  /**
   * Verifica se um horário está dentro do range de trabalho
   */
  static isWithinWorkingHours(checkTime: string, startTime: string, endTime: string): boolean {
    const check = new Date(`2000-01-01T${checkTime}:00`);
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return check >= start && check <= end;
  }

  /**
   * Calcula se um funcionário está atrasado
   */
  static isLate(arrivalTime: string, scheduledTime: string, toleranceMinutes: number = 15): boolean {
    const arrival = new Date(`2000-01-01T${arrivalTime}:00`);
    const scheduled = new Date(`2000-01-01T${scheduledTime}:00`);
    const toleranceMs = toleranceMinutes * 60 * 1000;
    
    return arrival.getTime() > (scheduled.getTime() + toleranceMs);
  }

  /**
   * Calcula minutos de atraso
   */
  static getLateMinutes(arrivalTime: string, scheduledTime: string, toleranceMinutes: number = 15): number {
    const arrival = new Date(`2000-01-01T${arrivalTime}:00`);
    const scheduled = new Date(`2000-01-01T${scheduledTime}:00`);
    const toleranceMs = toleranceMinutes * 60 * 1000;
    const scheduledWithTolerance = scheduled.getTime() + toleranceMs;
    
    if (arrival.getTime() <= scheduledWithTolerance) {
      return 0;
    }
    
    return Math.round((arrival.getTime() - scheduledWithTolerance) / (1000 * 60));
  }

  /**
   * Verifica se um dia da semana é dia de trabalho
   */
  static isWorkDay(date: Date, workDays: number[]): boolean {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    return workDays.includes(dayOfWeek);
  }

  /**
   * Calcula horas trabalhadas entre entrada e saída
   */
  static getWorkedHours(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 0;
    
    const timeIn = new Date(`2000-01-01T${checkIn}:00`);
    const timeOut = new Date(`2000-01-01T${checkOut}:00`);
    
    const diffMs = timeOut.getTime() - timeIn.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Arredondar para 2 casas
  }

  /**
   * Formata minutos em formato HH:MM
   */
  static formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Gera horário de checkout automático baseado no schedule
   */
  static getAutoCheckoutTime(checkInTime: string, dailyHours: number): string {
    const checkIn = new Date(`2000-01-01T${checkInTime}:00`);
    const autoCheckout = new Date(checkIn.getTime() + (dailyHours * 60 * 60 * 1000));
    
    return autoCheckout.toTimeString().slice(0, 5); // Retorna HH:MM
  }

  /**
   * Valida se os dias de trabalho são válidos
   */
  static validateWorkDays(workDays: number[]): boolean {
    if (!Array.isArray(workDays) || workDays.length === 0) return false;
    return workDays.every(day => day >= 0 && day <= 6);
  }

  /**
   * Converte número do dia para nome em português
   */
  static getDayName(dayNumber: number): string {
    const days = {
      0: 'Domingo',
      1: 'Segunda-feira',
      2: 'Terça-feira', 
      3: 'Quarta-feira',
      4: 'Quinta-feira',
      5: 'Sexta-feira',
      6: 'Sábado'
    };
    return days[dayNumber as keyof typeof days] || 'Dia inválido';
  }

  /**
   * Calcula próximo dia útil
   */
  static getNextWorkDay(currentDate: Date, workDays: number[]): Date {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!this.isWorkDay(nextDay, workDays)) {
      nextDay.setDate(nextDay.getDate() + 1);
      // Proteção contra loop infinito
      if (nextDay.getTime() - currentDate.getTime() > 7 * 24 * 60 * 60 * 1000) {
        break;
      }
    }
    
    return nextDay;
  }
}
