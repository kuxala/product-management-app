export interface Label {
  id: string;
  name: string;
  color: string;
  spaceId: string | null;
  projectId: string | null;
  createdAt: string;
}

export interface LabelWithTaskCount extends Label {
  taskCount: number;
}

export interface CreateLabelDto {
  name: string;
  color: string;
}

export interface UpdateLabelDto {
  name?: string;
  color?: string;
}

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  label: Label;
  createdAt: string;
}
