import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EmployeeService } from '../../services/employee.service';
import { Attendance, AttendanceStatus, WorkStatus } from '../../models/employee.model';
import { Chart } from 'chart.js/auto';
import * as XLSX from 'xlsx';
import { StatusService } from '../../services/status.service';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

interface MonthlyReport {
  employeeId: number; // Changed from string to number
  employeeName: string;
  totalWorkDays: number;
  totalLateDays: number;
  totalLateMinutes: number;
  attendanceRecords: Attendance[];
  overtimeBalance: number;
  weeklyStats: {
    week: number;
    totalHours: number;
    delayMinutes: number;
    absences: number;
  }[];
}

interface Department {
  id: number;
  name: string;
}

interface Employee {
  id: string; // Changed to string to match API
  name: string;
  departmentId: number;
  department?: string; // Added optional department field
}

interface DetailedReport {
  employeeName: string;
  departmentName: string;
  internal_code: string;
  check_in?: string;
  check_out?: string;
  totalDelay: number;
  totalDelayHours: number;
  attendanceRate: number;
}

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ThemeToggleComponent, AppHeaderComponent]
})
export class ReportPage implements OnInit, OnDestroy {
  @ViewChild('attendanceChart') attendanceChart!: ElementRef;
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  employees: Employee[] = [];
  monthlyReports: MonthlyReport[] = [];
  isLoading = false;
  selectedEmployee = 0; // Changed from string to number
  attendanceRecords: Attendance[] = [];
  selectedDate: string;
  maxDate: string;
  minDate: string;
  private attendanceChartInstance!: Chart;
  timelineView: 'day' | 'week' = 'day';

  // Date filters
  startDate: string;
  endDate: string;

  // Department filter
  departments: Department[] = [];
  selectedDepartment: number = 0;

  // Employee filter
  filteredEmployees: Employee[] = [];
  selectedEmployeeId: number = 0;

  // Report data
  detailedReports: DetailedReport[] = [];

  // Pagination properties
  itemsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  paginatedReports: DetailedReport[] = [];

  constructor(
    private employeeService: EmployeeService,
    private statusService: StatusService
  ) {
    const now = new Date();
    this.selectedDate = now.toISOString();

    // Definir intervalo de datas permitido (1 ano para trás e 1 mês para frente)
    const min = new Date();
    min.setFullYear(min.getFullYear() - 1);
    this.minDate = min.toISOString();

    const max = new Date();
    max.setMonth(max.getMonth() + 1);
    this.maxDate = max.toISOString();

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.startDate = firstDayOfMonth.toISOString();
    this.endDate = today.toISOString();
  }

  async ngOnInit() {
    await this.loadEmployees();
    this.generateReport();
    this.loadDepartments();
  }

  async loadEmployees() {
    try {
      const apiEmployees = await this.employeeService.getEmployees();
      this.employees = apiEmployees.map(emp => ({
        id: emp.id,
        name: emp.name,
        departmentId: parseInt(emp.department) || 0, // Convert department to number
        department: emp.department
      }));
      this.filteredEmployees = [...this.employees];
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  }

  async generateReport() { // Added async keyword
    try {
      this.isLoading = true;
      const attendanceRecords = await this.employeeService.getAttendanceByMonth(
        this.currentYear,
        this.currentMonth
      );
      const schedule = await this.employeeService.getWorkSchedule();

      this.monthlyReports = this.employees
        .filter(emp => !this.selectedEmployee || emp.id === this.selectedEmployee.toString())
        .map(employee => {
          const employeeRecords = attendanceRecords
            .filter(record => record.employee_id === employee.id)
            .map(record => ({
              ...record,
              status: this.statusService.determineAttendanceStatus(
                record.check_in,
                record.check_out,
                schedule.start_time
              )
            }));

          return {
            employeeId: parseInt(employee.id), // Convert string ID to number
            employeeName: employee.name,
            totalWorkDays: employeeRecords.length,
            totalLateDays: employeeRecords.filter(
              record => record.late_minutes && record.late_minutes > 0
            ).length,
            totalLateMinutes: employeeRecords.reduce(
              (total, record) => total + (record.late_minutes || 0),
              0
            ),
            attendanceRecords: employeeRecords.sort((a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
            overtimeBalance: 0, // Placeholder value
            weeklyStats: [] // Placeholder value
          };
        });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onMonthChange(event: any) {
    const date = new Date(event.detail.value);
    this.currentYear = date.getFullYear();
    this.currentMonth = date.getMonth() + 1;
    this.generateReport();
  }

  onEmployeeChange() {
    this.generateReport();
  }

  formatHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes}min`;
  }

  getEmployeeName(id: string): string { // Changed parameter type to string
    const employee = this.employees.find(emp => emp.id === id);
    return employee ? employee.name : 'Funcionário não encontrado';
  }

  getTotalWorkDays(): number {
    return this.monthlyReports.reduce((total, report) =>
      total + report.totalWorkDays, 0);
  }

  getTotalLateDays(): number {
    return this.monthlyReports.reduce((total, report) =>
      total + report.totalLateDays, 0);
  }

  getTotalAbsences(): number {
    const workDaysInMonth = this.getWorkDaysInMonth();
    const totalPresences = this.getTotalWorkDays();
    return Math.max(0, workDaysInMonth - totalPresences);
  }

  getWorkDaysInMonth(): number {
    const date = new Date(this.currentYear, this.currentMonth - 1, 1);
    const endDate = new Date(this.currentYear, this.currentMonth, 0);
    let workDays = 0;

    while (date <= endDate) {
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Exclui sábado e domingo
        workDays++;
      }
      date.setDate(date.getDate() + 1);
    }
    return workDays;
  }

  getStatusColor(status: AttendanceStatus | WorkStatus): string {
    return this.statusService.getStatusColor(status);
  }

  getPresencePercentage(): number {
    const totalDays = this.getWorkDaysInMonth();
    const totalPresences = this.getTotalWorkDays();
    return Math.round((totalPresences / totalDays) * 100);
  }

  getAverageDelay(): number {
    const totalLateMinutes = this.monthlyReports.reduce(
      (sum, report) => sum + report.totalLateMinutes, 0
    );
    const totalDays = this.getTotalWorkDays();
    return totalDays ? Math.round(totalLateMinutes / totalDays) : 0;
  }

  getTotalOvertime(): number {
    return this.monthlyReports.reduce(
      (sum, report) => sum + report.overtimeBalance, 0
    );
  }

  getEmployeePresencePercentage(report: MonthlyReport): number {
    const workDays = this.getWorkDaysInMonth();
    return Math.round((report.totalWorkDays / workDays) * 100);
  }

  getAverageDelayForEmployee(report: MonthlyReport): number {
    return report.totalWorkDays ?
      Math.round(report.totalLateMinutes / report.totalWorkDays) : 0;
  }

  updateTimeline() {
    // Por enquanto apenas recarrega os dados
    this.generateReport();
  }

  async exportReport() {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(this.generateExcelData());

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    XLSX.writeFile(workbook, `relatorio_${this.currentMonth}_${this.currentYear}.xlsx`);
  }

  private generateExcelData() {
    return this.monthlyReports.flatMap(report =>
      report.attendanceRecords.map(record => ({
        Funcionário: report.employeeName,
        Data: record.date,
        Entrada: record.check_in,
        Saída: record.check_out || '-',
        Atraso: record.late_minutes || 0,
        Status: record.status
      }))
    );
  }

  ngAfterViewInit() {
    if (this.attendanceChart) {
      this.initCharts();
    }
  }

  ngOnDestroy() {
    if (this.attendanceChartInstance) {
      this.attendanceChartInstance.destroy();
    }
  }

  private initCharts() {
    const ctx = this.attendanceChart.nativeElement.getContext('2d');

    if (this.attendanceChartInstance) {
      this.attendanceChartInstance.destroy();
    }

    this.attendanceChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.getLast30Days(),
        datasets: [{
          label: 'Presenças',
          data: this.getAttendanceData(),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private getLast30Days(): string[] {
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('pt-BR'));
    }
    return dates;
  }

  private getAttendanceData(): number[] {
    // Implementação básica - pode ser expandida conforme necessidade
    return this.getLast30Days().map(() =>
      Math.floor(Math.random() * 100)
    );
  }

  onDateChange() {
    this.updateReport();
  }

  onFilterChange() {
    this.updateFilteredEmployees();
    this.updateReport();
  }

  private updateFilteredEmployees() {
    if (this.selectedDepartment) {
      this.filteredEmployees = this.employees.filter(
        emp => emp.departmentId === this.selectedDepartment
      );
    } else {
      this.filteredEmployees = [...this.employees];
    }
  }

  private loadDepartments() {
    // TODO: Replace with actual API call
    this.departments = [
      { id: 1, name: 'Administrativo' },
      { id: 2, name: 'Operacional' },
      { id: 3, name: 'Comercial' }
    ];
  }

  private async updateReport() {
    this.isLoading = true;
    try {
      const attendanceRecords = await this.employeeService.getAttendanceByDateRange(
        this.startDate,
        this.endDate
      );

      const employees = await this.employeeService.getEmployees();
      const departments = await this.employeeService.getDepartments();

      this.detailedReports = employees
        .filter(emp => {
          const empDeptId = parseInt(emp.department) || 0;
          const matchesDepartment = !this.selectedDepartment || empDeptId === this.selectedDepartment;
          const matchesEmployee = !this.selectedEmployee || emp.id === String(this.selectedEmployee);
          return matchesDepartment && matchesEmployee;
        })
        .map(employee => {
          const employeeAttendance = attendanceRecords.filter(
            record => record.employee_id === employee.id
          );

          const totalDelay = this.calculateTotalDelay(employeeAttendance);
          const totalDelayHours = Number((totalDelay / 60).toFixed(2)); // Convert minutes to hours
          const attendanceRate = this.calculateAttendanceRate(employeeAttendance, this.startDate, this.endDate);

          const department = departments.find(
            d => d.id === parseInt(employee.department)
          );

          // Get the latest attendance record for check-in/check-out times
          const latestAttendance = employeeAttendance[0] || {};

          return {
            employeeName: employee.name,
            internal_code: employee.internal_code,
            departmentName: department?.name || 'Sem departamento',
            check_in: latestAttendance.check_in,
            check_out: latestAttendance.check_out,
            totalDelay: totalDelay,
            totalDelayHours: totalDelayHours,
            attendanceRate: attendanceRate
          };
        });

      this.updatePagination();

    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private updatePagination() {
    this.totalPages = Math.ceil(this.detailedReports.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedReports();
  }

  private updatePaginatedReports() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedReports = this.detailedReports.slice(startIndex, endIndex);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedReports();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedReports();
    }
  }

  async exportDetailedReport() {
    this.isLoading = true;
    try {
      const workbook = XLSX.utils.book_new();

      // Convert report data to Excel format
      const excelData = this.detailedReports.map(report => ({
        'Código': report.internal_code,
        'Nome': report.employeeName,
        'Total Atraso (Horas)': report.totalDelayHours
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório de Atrasos');

      // Generate filename with current date
      const date = new Date();
      const fileName = `relatorio_atrasos_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, fileName);

      console.log('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateExpectedHours(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const workDays = this.countWorkDays(start, end);
    return workDays * 8; // 8 hours per work day
  }

  private calculateWorkedHours(attendance: any[]): number {
    return attendance.reduce((total, record) => {
      if (record.check_in && record.check_out) {
        const checkIn = new Date(record.check_in);
        const checkOut = new Date(record.check_out);
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);
  }

  private calculateTotalDelay(attendance: any[]): number {
    return attendance.reduce((total, record) => {
      return total + (record.late_minutes || 0);
    }, 0);
  }

  private calculateAttendanceRate(attendance: any[], startDate: string, endDate: string): number {
    const workDays = this.countWorkDays(new Date(startDate), new Date(endDate));
    const daysPresent = new Set(attendance.map(record => record.date.split('T')[0])).size;
    return Math.round((daysPresent / workDays) * 100);
  }

  private countWorkDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) { // not weekend
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }
}
