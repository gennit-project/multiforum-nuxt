// Types for plugin UI form schema

export interface PluginFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
}

export interface PluginFieldOption {
  value: string | number | boolean;
  label: string;
}

export interface PluginField {
  key: string;
  type: 'text' | 'number' | 'boolean' | 'toggle' | 'select' | 'secret' | 'textarea';
  label: string;
  description?: string;
  default?: string | number | boolean;
  placeholder?: string;
  validation?: PluginFieldValidation;
  options?: PluginFieldOption[]; // For select fields
}

export interface PluginFormSection {
  title: string;
  description?: string;
  fields: PluginField[];
}

// Secret status from the backend
export interface PluginSecretStatus {
  key: string;
  status: 'NOT_SET' | 'SET_UNTESTED' | 'VALID' | 'INVALID';
  lastValidatedAt?: string;
  validationError?: string;
}
