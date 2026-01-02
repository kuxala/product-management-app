import { api } from './client';
import { Attachment } from '@pm/shared';

export const attachmentsApi = {
  getByTask: (taskId: string) =>
    api.get<Attachment[]>(`/tasks/${taskId}/attachments`).then((r) => r.data),

  upload: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<Attachment>(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getById: (attachmentId: string) =>
    api.get<Attachment>(`/attachments/${attachmentId}`).then((r) => r.data),

  delete: (attachmentId: string) =>
    api.delete(`/attachments/${attachmentId}`).then((r) => r.data),
};
