import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { normalizeEmployee, type Employee } from '@/types/employee';
import { useAuthStore } from '@/stores/auth';
import { scheduleBackgroundSync } from '@/services/syncTrigger';

const STORAGE_KEY = 'dm_employees_v1';

function totalMastersLimit(): number {
  const authStore = useAuthStore();
  const p = (authStore.planId || 'free').toLowerCase();
  const limits: Record<string, number> = {
    free: 1,
    demo: 1,
    master: 1,
    pro: 3,
    corporate: 10,
  };
  return limits[p] ?? 1;
}

export const useEmployeesStore = defineStore('employees', () => {
  const employees = ref<Employee[]>([]);
  const isLoaded = ref(false);

  const activeEmployees = computed(() => employees.value.filter((e) => e.status === 'active'));

  const employeeCount = computed(() => employees.value.length);

  function getById(id: string): Employee | undefined {
    return employees.value.find((e) => e.id === id);
  }

  /** Дополнительные мастера в приложении; владелец считается отдельно (1 слот). */
  function canAddEmployee(): boolean {
    const limit = totalMastersLimit();
    return employees.value.length < limit - 1;
  }

  function getEmployeeLimit(): number {
    return totalMastersLimit();
  }

  function loadEmployees(force = false): void {
    if (isLoaded.value && !force) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
      employees.value = parsed.map((row) => normalizeEmployee(row as Record<string, unknown>));
    } catch {
      employees.value = [];
    }
    isLoaded.value = true;
  }

  function saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees.value));
    } catch {
      /* ignore */
    }
  }

  function replaceAllFromSync(next: Employee[]): void {
    employees.value = next.map((row) => normalizeEmployee(row as unknown as Record<string, unknown>));
    saveToStorage();
    isLoaded.value = true;
  }

  function addEmployee(
    employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
  ): Employee {
    const now = new Date().toISOString();
    const newEmployee = normalizeEmployee({
      ...(employee as unknown as Record<string, unknown>),
      id: undefined,
      createdAt: now,
      updatedAt: now,
    });
    employees.value.push(newEmployee);
    saveToStorage();
    scheduleBackgroundSync();
    return newEmployee;
  }

  function updateEmployee(id: string, changes: Partial<Employee>): void {
    const index = employees.value.findIndex((e) => e.id === id);
    if (index === -1) return;
    const cur = employees.value[index];
    const merged = normalizeEmployee({
      ...(cur as unknown as Record<string, unknown>),
      ...(changes as unknown as Record<string, unknown>),
      id,
      createdAt: cur.createdAt,
      updatedAt: new Date().toISOString(),
    });
    employees.value[index] = merged;
    saveToStorage();
  }

  function deleteEmployee(id: string): void {
    employees.value = employees.value.filter((e) => e.id !== id);
    saveToStorage();
    scheduleBackgroundSync();
  }

  return {
    employees,
    isLoaded,
    activeEmployees,
    employeeCount,
    getById,
    canAddEmployee,
    getEmployeeLimit,
    loadEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    replaceAllFromSync,
  };
});
