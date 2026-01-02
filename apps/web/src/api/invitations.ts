import { api } from './client';
import { Invitation, CreateInvitationDto, AcceptInvitationResult } from '@pm/shared';

export const invitationsApi = {
  getAll: (workspaceId: string) =>
    api.get<Invitation[]>(`/workspaces/${workspaceId}/invitations`).then((r) => r.data),

  create: (workspaceId: string, data: CreateInvitationDto) =>
    api
      .post<Invitation>(`/workspaces/${workspaceId}/invitations`, data)
      .then((r) => r.data),

  resend: (workspaceId: string, invitationId: string) =>
    api
      .post<Invitation>(
        `/workspaces/${workspaceId}/invitations/${invitationId}/resend`,
      )
      .then((r) => r.data),

  cancel: (workspaceId: string, invitationId: string) =>
    api
      .delete(`/workspaces/${workspaceId}/invitations/${invitationId}`)
      .then((r) => r.data),

  getByToken: (token: string) =>
    api.get<Invitation>(`/invitations/${token}`).then((r) => r.data),

  accept: (token: string) =>
    api
      .post<AcceptInvitationResult>(`/invitations/${token}/accept`)
      .then((r) => r.data),
};
