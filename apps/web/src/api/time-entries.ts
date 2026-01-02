import { api } from './client';
import {
  TimeEntry,
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  StartTimerDto,
} from '@pm/shared';

export const timeEntriesApi = {
  getByTask: (taskId: string) =>
    api.get<TimeEntry[]>(`/tasks/${taskId}/time-entries`).then((r) => r.data),

  getByProject: (projectId: string) =>
    api.get<TimeEntry[]>(`/projects/${projectId}/time-entries`).then((r) => r.data),

  create: (data: CreateTimeEntryDto) =>
    api.post<TimeEntry>('/time-entries', data).then((r) => r.data),

  update: (entryId: string, data: UpdateTimeEntryDto) =>
    api.patch<TimeEntry>(`/time-entries/${entryId}`, data).then((r) => r.data),

  delete: (entryId: string) =>
    api.delete(`/time-entries/${entryId}`).then((r) => r.data),

  startTimer: (data: StartTimerDto) =>
    api.post<TimeEntry>('/time-entries/start', data).then((r) => r.data),

  stopTimer: (entryId: string) =>
    api.post<TimeEntry>(`/time-entries/${entryId}/stop`).then((r) => r.data),

  getRunningTimer: () =>
    api.get<TimeEntry | null>('/time-entries/running').then((r) => r.data),
};
