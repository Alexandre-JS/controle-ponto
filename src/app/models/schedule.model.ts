export interface ScheduleData {
  id?: string;
  startTime: string;
  endTime: string;
  workDays: number[];
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface DailyRecord {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  workHours: number;
  userId?: string;
  createdAt: Date;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: 'schedule' | 'record' | 'employee' | 'attendance' | 'work_schedule';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retryCount: number;
}
