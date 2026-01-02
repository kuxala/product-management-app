import { CustomFieldType } from '../enums/enums.schema';

export interface CustomFieldOption {
  id: string;
  label: string;
  color?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  description: string | null;
  required: boolean;
  options: CustomFieldOption[] | null;
  spaceId: string | null;
  projectId: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldValue {
  id: string;
  taskId: string;
  customFieldId: string;
  customField: CustomField;
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldDto {
  name: string;
  type: CustomFieldType;
  description?: string;
  required?: boolean;
  options?: CustomFieldOption[];
}

export interface UpdateCustomFieldDto {
  name?: string;
  description?: string;
  required?: boolean;
  options?: CustomFieldOption[];
}

export interface SetCustomFieldValueDto {
  value: unknown;
}
