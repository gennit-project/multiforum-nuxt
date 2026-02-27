import { describe, it, expect } from 'vitest';
import type {
  PluginField,
  PluginFieldValidation,
  PluginFormSection,
  PluginSecretStatus,
} from '@/types/pluginForms';

// Test the type definitions and utility logic
describe('Plugin Form Types', () => {
  describe('PluginFieldValidation', () => {
    it('should allow min/max for number fields', () => {
      const validation: PluginFieldValidation = {
        min: 0,
        max: 100,
        required: true,
      };

      expect(validation.min).toBe(0);
      expect(validation.max).toBe(100);
      expect(validation.required).toBe(true);
    });

    it('should allow minLength/maxLength for text fields', () => {
      const validation: PluginFieldValidation = {
        minLength: 1,
        maxLength: 255,
        pattern: '^[a-z]+$',
      };

      expect(validation.minLength).toBe(1);
      expect(validation.maxLength).toBe(255);
      expect(validation.pattern).toBe('^[a-z]+$');
    });
  });

  describe('PluginField', () => {
    it('should support all field types', () => {
      const textField: PluginField = {
        key: 'name',
        type: 'text',
        label: 'Name',
        description: 'Enter your name',
        placeholder: 'John Doe',
        default: '',
        validation: { required: true },
      };

      expect(textField.type).toBe('text');
      expect(textField.label).toBe('Name');

      const numberField: PluginField = {
        key: 'maxItems',
        type: 'number',
        label: 'Max Items',
        default: 10,
        validation: { min: 1, max: 100 },
      };

      expect(numberField.type).toBe('number');
      expect(numberField.default).toBe(10);

      const booleanField: PluginField = {
        key: 'enabled',
        type: 'boolean',
        label: 'Enabled',
        default: false,
      };

      expect(booleanField.type).toBe('boolean');
      expect(booleanField.default).toBe(false);

      const selectField: PluginField = {
        key: 'mode',
        type: 'select',
        label: 'Mode',
        options: [
          { value: 'auto', label: 'Automatic' },
          { value: 'manual', label: 'Manual' },
        ],
      };

      expect(selectField.type).toBe('select');
      expect(selectField.options).toHaveLength(2);

      const secretField: PluginField = {
        key: 'apiKey',
        type: 'secret',
        label: 'API Key',
        description: 'Your secret API key',
        validation: { required: true },
      };

      expect(secretField.type).toBe('secret');

      const textareaField: PluginField = {
        key: 'description',
        type: 'textarea',
        label: 'Description',
        placeholder: 'Enter a description...',
      };

      expect(textareaField.type).toBe('textarea');
    });
  });

  describe('PluginFormSection', () => {
    it('should group fields into sections', () => {
      const section: PluginFormSection = {
        title: 'General Settings',
        description: 'Configure general plugin settings',
        fields: [
          { key: 'name', type: 'text', label: 'Plugin Name' },
          { key: 'enabled', type: 'boolean', label: 'Enabled' },
        ],
      };

      expect(section.title).toBe('General Settings');
      expect(section.fields).toHaveLength(2);
    });

    it('should allow sections without description', () => {
      const section: PluginFormSection = {
        title: 'Advanced',
        fields: [{ key: 'debug', type: 'boolean', label: 'Debug Mode' }],
      };

      expect(section.description).toBeUndefined();
      expect(section.fields).toHaveLength(1);
    });
  });

  describe('PluginSecretStatus', () => {
    it('should track secret status correctly', () => {
      const notSet: PluginSecretStatus = {
        key: 'API_KEY',
        status: 'NOT_SET',
      };
      expect(notSet.status).toBe('NOT_SET');

      const setUntested: PluginSecretStatus = {
        key: 'API_KEY',
        status: 'SET_UNTESTED',
      };
      expect(setUntested.status).toBe('SET_UNTESTED');

      const valid: PluginSecretStatus = {
        key: 'API_KEY',
        status: 'VALID',
        lastValidatedAt: '2024-01-15T10:00:00Z',
      };
      expect(valid.status).toBe('VALID');
      expect(valid.lastValidatedAt).toBeDefined();

      const invalid: PluginSecretStatus = {
        key: 'API_KEY',
        status: 'INVALID',
        validationError: 'API key is expired',
      };
      expect(invalid.status).toBe('INVALID');
      expect(invalid.validationError).toBe('API key is expired');
    });
  });
});

describe('Plugin Field Component Logic', () => {
  describe('PluginTextField computed values', () => {
    it('should return default value when modelValue is undefined', () => {
      const field: PluginField = {
        key: 'name',
        type: 'text',
        label: 'Name',
        default: 'Default Name',
      };
      const modelValue: string | undefined = undefined;

      const inputValue = modelValue ?? (field.default as string) ?? '';
      expect(inputValue).toBe('Default Name');
    });

    it('should return modelValue when provided', () => {
      const field: PluginField = {
        key: 'name',
        type: 'text',
        label: 'Name',
        default: 'Default Name',
      };
      const modelValue = 'Custom Name';

      const inputValue = modelValue ?? (field.default as string) ?? '';
      expect(inputValue).toBe('Custom Name');
    });

    it('should build correct validation attributes', () => {
      const field: PluginField = {
        key: 'name',
        type: 'text',
        label: 'Name',
        validation: {
          minLength: 3,
          maxLength: 50,
          pattern: '^[A-Za-z]+$',
          required: true,
        },
      };

      const attrs: Record<string, any> = {};
      if (field.validation) {
        if (field.validation.minLength !== undefined) {
          attrs.minlength = field.validation.minLength;
        }
        if (field.validation.maxLength !== undefined) {
          attrs.maxlength = field.validation.maxLength;
        }
        if (field.validation.pattern) {
          attrs.pattern = field.validation.pattern;
        }
        if (field.validation.required) {
          attrs.required = true;
        }
      }

      expect(attrs.minlength).toBe(3);
      expect(attrs.maxlength).toBe(50);
      expect(attrs.pattern).toBe('^[A-Za-z]+$');
      expect(attrs.required).toBe(true);
    });
  });

  describe('PluginNumberField computed values', () => {
    it('should parse string values to numbers', () => {
      const parseValue = (value: number | string): number | undefined => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(numValue) ? undefined : numValue;
      };

      expect(parseValue('42')).toBe(42);
      expect(parseValue('3.14')).toBe(3.14);
      expect(parseValue(100)).toBe(100);
      expect(parseValue('invalid')).toBeUndefined();
      expect(parseValue('')).toBeUndefined();
    });

    it('should build range hint correctly', () => {
      const getRangeHint = (validation?: PluginFieldValidation): string | null => {
        if (!validation) return null;
        if (validation.min !== undefined && validation.max !== undefined) {
          return `Range: ${validation.min} - ${validation.max}`;
        }
        if (validation.min !== undefined) {
          return `Minimum: ${validation.min}`;
        }
        if (validation.max !== undefined) {
          return `Maximum: ${validation.max}`;
        }
        return null;
      };

      expect(getRangeHint({ min: 0, max: 100 })).toBe('Range: 0 - 100');
      expect(getRangeHint({ min: 5 })).toBe('Minimum: 5');
      expect(getRangeHint({ max: 50 })).toBe('Maximum: 50');
      expect(getRangeHint({})).toBeNull();
      expect(getRangeHint()).toBeNull();
    });
  });

  describe('PluginBooleanField computed values', () => {
    it('should return default value when modelValue is undefined', () => {
      const field: PluginField = {
        key: 'enabled',
        type: 'boolean',
        label: 'Enabled',
        default: true,
      };
      const modelValue: boolean | undefined = undefined;

      const inputValue = modelValue ?? (field.default as boolean) ?? false;
      expect(inputValue).toBe(true);
    });

    it('should return false as ultimate default', () => {
      const field: PluginField = {
        key: 'enabled',
        type: 'boolean',
        label: 'Enabled',
      };
      const modelValue: boolean | undefined = undefined;

      const inputValue = modelValue ?? (field.default as boolean) ?? false;
      expect(inputValue).toBe(false);
    });
  });

  describe('PluginSelectField computed values', () => {
    it('should return default value when modelValue is undefined', () => {
      const field: PluginField = {
        key: 'mode',
        type: 'select',
        label: 'Mode',
        default: 'auto',
        options: [
          { value: 'auto', label: 'Automatic' },
          { value: 'manual', label: 'Manual' },
        ],
      };
      const modelValue: string | undefined = undefined;

      const inputValue = modelValue ?? field.default ?? '';
      expect(inputValue).toBe('auto');
    });

    it('should handle numeric option values', () => {
      const field: PluginField = {
        key: 'level',
        type: 'select',
        label: 'Level',
        default: 1,
        options: [
          { value: 1, label: 'Low' },
          { value: 2, label: 'Medium' },
          { value: 3, label: 'High' },
        ],
      };

      expect(field.options?.[0].value).toBe(1);
      expect(field.options?.[1].value).toBe(2);
    });
  });

  describe('PluginSecretField computed values', () => {
    it('should determine if value is set from status', () => {
      const hasValueFromStatus = (status?: PluginSecretStatus): boolean => {
        if (!status) return false;
        return status.status !== 'NOT_SET';
      };

      expect(hasValueFromStatus({ key: 'key', status: 'NOT_SET' })).toBe(false);
      expect(hasValueFromStatus({ key: 'key', status: 'SET_UNTESTED' })).toBe(true);
      expect(hasValueFromStatus({ key: 'key', status: 'VALID' })).toBe(true);
      expect(hasValueFromStatus({ key: 'key', status: 'INVALID' })).toBe(true);
      expect(hasValueFromStatus(undefined)).toBe(false);
    });

    it('should return correct status color class', () => {
      const getStatusColor = (status: PluginSecretStatus['status']): string => {
        switch (status) {
          case 'VALID':
            return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
          case 'INVALID':
            return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
          case 'SET_UNTESTED':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
          default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
      };

      expect(getStatusColor('VALID')).toContain('green');
      expect(getStatusColor('INVALID')).toContain('red');
      expect(getStatusColor('SET_UNTESTED')).toContain('yellow');
      expect(getStatusColor('NOT_SET')).toContain('gray');
    });

    it('should return correct status text', () => {
      const getStatusText = (status: PluginSecretStatus['status']): string => {
        switch (status) {
          case 'VALID':
            return 'Valid';
          case 'INVALID':
            return 'Invalid';
          case 'SET_UNTESTED':
            return 'Set';
          default:
            return 'Not set';
        }
      };

      expect(getStatusText('VALID')).toBe('Valid');
      expect(getStatusText('INVALID')).toBe('Invalid');
      expect(getStatusText('SET_UNTESTED')).toBe('Set');
      expect(getStatusText('NOT_SET')).toBe('Not set');
    });

    it('should return write-only placeholder when secret is set', () => {
      const getPlaceholder = (hasValue: boolean, fieldPlaceholder?: string): string => {
        return hasValue ? '[encrypted - cannot be viewed]' : (fieldPlaceholder || '');
      };

      expect(getPlaceholder(true)).toBe('[encrypted - cannot be viewed]');
      expect(getPlaceholder(true, 'Enter API key')).toBe('[encrypted - cannot be viewed]');
      expect(getPlaceholder(false, 'Enter API key')).toBe('Enter API key');
      expect(getPlaceholder(false)).toBe('');
    });

    it('should show write-only indicator when secret is already set', () => {
      const shouldShowWriteOnlyIndicator = (
        hasValue: boolean,
        secretStatus?: PluginSecretStatus
      ): boolean => {
        return hasValue && !!secretStatus && secretStatus.status !== 'NOT_SET';
      };

      expect(shouldShowWriteOnlyIndicator(true, { key: 'k', status: 'SET_UNTESTED' })).toBe(true);
      expect(shouldShowWriteOnlyIndicator(true, { key: 'k', status: 'VALID' })).toBe(true);
      expect(shouldShowWriteOnlyIndicator(true, { key: 'k', status: 'INVALID' })).toBe(true);
      expect(shouldShowWriteOnlyIndicator(true, { key: 'k', status: 'NOT_SET' })).toBe(false);
      expect(shouldShowWriteOnlyIndicator(false, { key: 'k', status: 'SET_UNTESTED' })).toBe(false);
      expect(shouldShowWriteOnlyIndicator(true, undefined)).toBe(false);
    });

    it('should skip pattern validation for secrets', () => {
      // Secret fields should not validate patterns - backend validates when used
      const validateSecretField = (
        value: string,
        validation?: PluginFieldValidation
      ): string | null => {
        if (!validation) return null;

        // Only validate required and length constraints, not pattern
        if (validation.required && value.trim().length === 0) {
          return 'Field is required';
        }
        if (validation.minLength !== undefined && value.length < validation.minLength) {
          return `Must be at least ${validation.minLength} characters`;
        }
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          return `Must be at most ${validation.maxLength} characters`;
        }
        // Pattern validation is intentionally skipped for secrets
        return null;
      };

      // Even with a pattern defined, secret validation should pass
      expect(validateSecretField('any-value', { pattern: '^[a-f0-9]{64}$' })).toBeNull();
      expect(validateSecretField('short', { pattern: '^[a-f0-9]{64}$' })).toBeNull();

      // But still validate required and length
      expect(validateSecretField('', { required: true })).toBe('Field is required');
      expect(validateSecretField('ab', { minLength: 5 })).toBe('Must be at least 5 characters');
    });
  });
});

describe('PluginSettingsForm Logic', () => {
  describe('Field value management', () => {
    it('should update individual field values', () => {
      const formValues: Record<string, any> = {
        name: 'Test',
        enabled: true,
        maxItems: 10,
      };

      const updateFieldValue = (values: Record<string, any>, key: string, value: any) => {
        return { ...values, [key]: value };
      };

      const updated = updateFieldValue(formValues, 'name', 'Updated Name');
      expect(updated.name).toBe('Updated Name');
      expect(updated.enabled).toBe(true);
      expect(updated.maxItems).toBe(10);
    });

    it('should get field values with defaults', () => {
      const formValues: Record<string, any> = {
        name: 'Test',
      };

      const field: PluginField = {
        key: 'enabled',
        type: 'boolean',
        label: 'Enabled',
        default: false,
      };

      const getFieldValue = (values: Record<string, any>, key: string, defaultValue?: any) => {
        return values[key] ?? defaultValue;
      };

      expect(getFieldValue(formValues, 'name')).toBe('Test');
      expect(getFieldValue(formValues, 'enabled', field.default)).toBe(false);
      expect(getFieldValue(formValues, 'missing', 'fallback')).toBe('fallback');
    });
  });

  describe('Field component resolution', () => {
    it('should return correct component for each field type', () => {
      const getComponentName = (type: string): string => {
        switch (type) {
          case 'text':
          case 'textarea':
            return 'PluginTextField';
          case 'number':
            return 'PluginNumberField';
          case 'boolean':
            return 'PluginBooleanField';
          case 'select':
            return 'PluginSelectField';
          case 'secret':
            return 'PluginSecretField';
          default:
            return 'PluginTextField';
        }
      };

      expect(getComponentName('text')).toBe('PluginTextField');
      expect(getComponentName('textarea')).toBe('PluginTextField');
      expect(getComponentName('number')).toBe('PluginNumberField');
      expect(getComponentName('boolean')).toBe('PluginBooleanField');
      expect(getComponentName('select')).toBe('PluginSelectField');
      expect(getComponentName('secret')).toBe('PluginSecretField');
      expect(getComponentName('unknown')).toBe('PluginTextField');
    });
  });

  describe('Form validation', () => {
    it('should validate required fields', () => {
      const sections: PluginFormSection[] = [
        {
          title: 'Settings',
          fields: [
            { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
            { key: 'optional', type: 'text', label: 'Optional' },
            { key: 'count', type: 'number', label: 'Count', validation: { required: true } },
          ],
        },
      ];

      const validateForm = (
        sections: PluginFormSection[],
        values: Record<string, any>
      ): Record<string, string> => {
        const errors: Record<string, string> = {};

        for (const section of sections) {
          for (const field of section.fields) {
            if (field.validation?.required) {
              const value = values[field.key];
              if (value === undefined || value === null || value === '') {
                errors[field.key] = `${field.label} is required`;
              }
            }
          }
        }

        return errors;
      };

      // Test with missing required fields
      const errors1 = validateForm(sections, {});
      expect(errors1.name).toBe('Name is required');
      expect(errors1.optional).toBeUndefined();
      expect(errors1.count).toBe('Count is required');

      // Test with all required fields filled
      const errors2 = validateForm(sections, { name: 'Test', count: 5 });
      expect(Object.keys(errors2)).toHaveLength(0);

      // Test with empty string (should still be an error)
      const errors3 = validateForm(sections, { name: '', count: 0 });
      expect(errors3.name).toBe('Name is required');
      expect(errors3.count).toBeUndefined(); // 0 is a valid number
    });

    it('should validate number ranges', () => {
      const validateNumberRange = (
        value: number | undefined,
        validation?: PluginFieldValidation
      ): string | null => {
        if (value === undefined) return null;
        if (!validation) return null;

        if (validation.min !== undefined && value < validation.min) {
          return `Value must be at least ${validation.min}`;
        }
        if (validation.max !== undefined && value > validation.max) {
          return `Value must be at most ${validation.max}`;
        }

        return null;
      };

      expect(validateNumberRange(5, { min: 0, max: 10 })).toBeNull();
      expect(validateNumberRange(-1, { min: 0 })).toBe('Value must be at least 0');
      expect(validateNumberRange(15, { max: 10 })).toBe('Value must be at most 10');
      expect(validateNumberRange(50, {})).toBeNull();
      expect(validateNumberRange(50)).toBeNull();
    });

    it('should validate string length', () => {
      const validateStringLength = (
        value: string | undefined,
        validation?: PluginFieldValidation
      ): string | null => {
        if (value === undefined) return null;
        if (!validation) return null;

        if (validation.minLength !== undefined && value.length < validation.minLength) {
          return `Must be at least ${validation.minLength} characters`;
        }
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          return `Must be at most ${validation.maxLength} characters`;
        }

        return null;
      };

      expect(validateStringLength('hello', { minLength: 3, maxLength: 10 })).toBeNull();
      expect(validateStringLength('hi', { minLength: 3 })).toBe('Must be at least 3 characters');
      expect(validateStringLength('hello world!', { maxLength: 10 })).toBe(
        'Must be at most 10 characters'
      );
    });

    it('should validate pattern', () => {
      const validatePattern = (
        value: string | undefined,
        validation?: PluginFieldValidation
      ): string | null => {
        if (value === undefined) return null;
        if (!validation?.pattern) return null;

        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          return 'Invalid format';
        }

        return null;
      };

      expect(validatePattern('abc', { pattern: '^[a-z]+$' })).toBeNull();
      expect(validatePattern('ABC', { pattern: '^[a-z]+$' })).toBe('Invalid format');
      expect(validatePattern('abc123', { pattern: '^[a-z]+$' })).toBe('Invalid format');
    });
  });

  describe('Secret confirmation flow', () => {
    it('should track which secret is awaiting confirmation', () => {
      let confirmingSecret: string | null = null;

      const requestConfirmation = (key: string) => {
        confirmingSecret = key;
      };

      const cancelConfirmation = () => {
        confirmingSecret = null;
      };

      expect(confirmingSecret).toBeNull();

      requestConfirmation('API_KEY');
      expect(confirmingSecret).toBe('API_KEY');

      cancelConfirmation();
      expect(confirmingSecret).toBeNull();
    });

    it('should reset confirmation when hiding input', () => {
      let confirmingSecret: string | null = 'API_KEY';
      const showSecretInputs: Record<string, boolean> = { API_KEY: true };

      const updateShowSecretInput = (key: string, value: boolean) => {
        showSecretInputs[key] = value;
        if (!value) {
          confirmingSecret = null;
        }
      };

      expect(confirmingSecret).toBe('API_KEY');

      updateShowSecretInput('API_KEY', false);
      expect(showSecretInputs['API_KEY']).toBe(false);
      expect(confirmingSecret).toBeNull();
    });

    it('should emit set-secret only after confirmation', () => {
      const emittedSecrets: Array<{ key: string; value: string }> = [];
      let confirmingSecret: string | null = null;
      const secretValues: Record<string, string> = { API_KEY: 'test-secret-value' };

      const requestConfirmation = (key: string) => {
        confirmingSecret = key;
      };

      const confirmAndSave = (key: string) => {
        emittedSecrets.push({ key, value: secretValues[key] || '' });
        confirmingSecret = null;
      };

      // First click: request confirmation
      requestConfirmation('API_KEY');
      expect(confirmingSecret).toBe('API_KEY');
      expect(emittedSecrets).toHaveLength(0);

      // Second click: confirm and save
      confirmAndSave('API_KEY');
      expect(confirmingSecret).toBeNull();
      expect(emittedSecrets).toHaveLength(1);
      expect(emittedSecrets[0]).toEqual({ key: 'API_KEY', value: 'test-secret-value' });
    });
  });

  describe('Secret field interactions', () => {
    it('should track validating secrets', () => {
      const validatingSecrets = new Set<string>();

      // Add a secret being validated
      validatingSecrets.add('API_KEY');
      expect(validatingSecrets.has('API_KEY')).toBe(true);
      expect(validatingSecrets.has('OTHER_KEY')).toBe(false);

      // Remove when done
      validatingSecrets.delete('API_KEY');
      expect(validatingSecrets.has('API_KEY')).toBe(false);
    });

    it('should find secret status by key', () => {
      const secretStatuses: PluginSecretStatus[] = [
        { key: 'API_KEY', status: 'VALID' },
        { key: 'SECRET_TOKEN', status: 'NOT_SET' },
        { key: 'WEBHOOK_SECRET', status: 'SET_UNTESTED' },
      ];

      const getSecretStatus = (
        statuses: PluginSecretStatus[],
        key: string
      ): PluginSecretStatus | undefined => {
        return statuses.find((s) => s.key === key);
      };

      expect(getSecretStatus(secretStatuses, 'API_KEY')?.status).toBe('VALID');
      expect(getSecretStatus(secretStatuses, 'SECRET_TOKEN')?.status).toBe('NOT_SET');
      expect(getSecretStatus(secretStatuses, 'UNKNOWN')).toBeUndefined();
    });
  });
});
