// Сотрудники (Stage 3): локальное хранение; облако — позже.

export type EmployeeRole = 'admin' | 'master';
export type AccessLevel = 'full' | 'limited' | 'view_only';
export type SalaryType = 'percent' | 'fixed';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface WorkSchedule {
  workDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  daysOff: string[];
  filledUntil?: string;
}

export interface SalarySettings {
  type: SalaryType;
  value: number;
  currency?: string;
}

export interface EmployeeNotifications {
  newBooking: boolean;
  bookingCancelled: boolean;
  reminder: boolean;
}

export interface Employee {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  surname?: string;
  photo?: string;
  role: EmployeeRole;
  status: 'active' | 'inactive';
  workExperienceYears?: number;
  specialization?: string;
  category?: string;
  position?: string;
  accessLevel: AccessLevel;
  linkedAccountPhone?: string;
  linkedAccountId?: string;
  salary: SalarySettings;
  schedule: WorkSchedule;
  services: string[];
  notifications: EmployeeNotifications;
  acceptsOnlineBooking: boolean;
  isVisibleInJournal: boolean;
  phone?: string;
  email?: string;
  notes?: string;
  /** Облачная синхронизация (Stage 8) */
  syncedAt?: string;
}

export function generateEmployeeId(): string {
  return `emp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultEmployee(): Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    role: 'master',
    status: 'active',
    accessLevel: 'limited',
    salary: { type: 'percent', value: 40 },
    schedule: {
      workDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      startTime: '09:00',
      endTime: '18:00',
      slotDurationMinutes: 60,
      daysOff: [],
    },
    services: ['Удаление вмятин без покраски'],
    notifications: {
      newBooking: true,
      bookingCancelled: true,
      reminder: true,
    },
    acceptsOnlineBooking: true,
    isVisibleInJournal: true,
  };
}

export function normalizeEmployee(raw: Record<string, unknown>): Employee {
  const def = createDefaultEmployee();
  const salaryRaw = raw.salary as SalarySettings | undefined;
  const scheduleRaw = raw.schedule as Partial<WorkSchedule> | undefined;
  const notificationsRaw = raw.notifications as Partial<EmployeeNotifications> | undefined;

  return {
    id: (raw.id as string) || generateEmployeeId(),
    createdAt: (raw.createdAt as string) || new Date().toISOString(),
    updatedAt: (raw.updatedAt as string) || new Date().toISOString(),
    name: (raw.name as string) || '',
    surname: raw.surname != null ? String(raw.surname) : undefined,
    photo: raw.photo != null ? String(raw.photo) : undefined,
    role: (raw.role as EmployeeRole) || 'master',
    status: (raw.status as Employee['status']) || 'active',
    workExperienceYears:
      raw.workExperienceYears != null && !Number.isNaN(Number(raw.workExperienceYears))
        ? Number(raw.workExperienceYears)
        : undefined,
    specialization: raw.specialization != null ? String(raw.specialization) : undefined,
    category: raw.category != null ? String(raw.category) : undefined,
    position: raw.position != null ? String(raw.position) : undefined,
    accessLevel: (raw.accessLevel as AccessLevel) || def.accessLevel,
    linkedAccountPhone:
      raw.linkedAccountPhone != null ? String(raw.linkedAccountPhone) : undefined,
    linkedAccountId: raw.linkedAccountId != null ? String(raw.linkedAccountId) : undefined,
    salary: {
      type: (salaryRaw?.type as SalaryType) || def.salary.type,
      value:
        salaryRaw?.value != null && !Number.isNaN(Number(salaryRaw.value))
          ? Number(salaryRaw.value)
          : def.salary.value,
      currency: salaryRaw?.currency ?? undefined,
    },
    schedule: {
      workDays: (scheduleRaw?.workDays as DayOfWeek[]) || [...def.schedule.workDays],
      startTime: scheduleRaw?.startTime || def.schedule.startTime,
      endTime: scheduleRaw?.endTime || def.schedule.endTime,
      slotDurationMinutes:
        scheduleRaw?.slotDurationMinutes != null
          ? Number(scheduleRaw.slotDurationMinutes)
          : def.schedule.slotDurationMinutes,
      daysOff: Array.isArray(scheduleRaw?.daysOff) ? [...scheduleRaw.daysOff] : [],
      filledUntil: scheduleRaw?.filledUntil != null ? String(scheduleRaw.filledUntil) : undefined,
    },
    services: Array.isArray(raw.services) ? [...raw.services] : [...def.services],
    notifications: {
      newBooking: notificationsRaw?.newBooking ?? def.notifications.newBooking,
      bookingCancelled: notificationsRaw?.bookingCancelled ?? def.notifications.bookingCancelled,
      reminder: notificationsRaw?.reminder ?? def.notifications.reminder,
    },
    acceptsOnlineBooking:
      raw.acceptsOnlineBooking != null ? Boolean(raw.acceptsOnlineBooking) : def.acceptsOnlineBooking,
    isVisibleInJournal:
      raw.isVisibleInJournal != null ? Boolean(raw.isVisibleInJournal) : def.isVisibleInJournal,
    phone: raw.phone != null ? String(raw.phone) : undefined,
    email: raw.email != null ? String(raw.email) : undefined,
    notes: raw.notes != null ? String(raw.notes) : undefined,
    syncedAt: raw.syncedAt != null ? String(raw.syncedAt) : undefined,
  };
}
