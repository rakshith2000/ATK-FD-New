import type { ConditionalValidation, FieldConfig, FieldValidation } from './types';

/** Validate a single value against FieldValidation rules imperatively */
function validateValueAgainstRules(value: unknown, rules: FieldValidation, allValues: Record<string, unknown>): string | undefined {
    if (rules.minLength !== undefined && typeof value === 'string' && value.length < rules.minLength) {
        return rules.minLengthMessage ?? `Minimum ${rules.minLength} characters`;
    }
    if (rules.maxLength !== undefined && typeof value === 'string' && value.length > rules.maxLength) {
        return rules.maxLengthMessage ?? `Maximum ${rules.maxLength} characters`;
    }
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return rules.patternMessage ?? 'Invalid format';
    }
    // min/max for numbers
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        return rules.minMessage ?? `Minimum value is ${rules.min}`;
    }
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        return rules.maxMessage ?? `Maximum value is ${rules.max}`;
    }
    // min/max for arrays (multiselect)
    if (rules.min !== undefined && Array.isArray(value) && value.length < rules.min) {
        return rules.minMessage ?? `Select at least ${rules.min} item${rules.min === 1 ? '' : 's'}`;
    }
    if (rules.max !== undefined && Array.isArray(value) && value.length > rules.max) {
        return rules.maxMessage ?? `Select at most ${rules.max} item${rules.max === 1 ? '' : 's'}`;
    }
    if (rules.custom) {
        return rules.custom(value, allValues);
    }
    return undefined;
}

/** Resolve which conditional validation rules apply given current form values */
function resolveConditionalRules(conditions: ConditionalValidation[], allValues: Record<string, unknown>): FieldValidation | undefined {
    const merged: FieldValidation = {};
    for (const cv of conditions) {
        const dep = cv.when;
        const applies = 'fields' in dep ? dep.condition(allValues) : dep.condition(allValues[dep.field], allValues);
        if (applies) {
            Object.assign(merged, cv.rules);
        }
    }
    return Object.keys(merged).length > 0 ? merged : undefined;
}

/** Check if a value counts as "empty" for required validation */
function isEmpty(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

/**
 * Build an onDynamic validator function for a field.
 * Both static validation and conditional validation are applied together.
 * Returns undefined if no validation is needed.
 */
export function buildFieldValidator(fieldConfig: FieldConfig, getAllValues: () => Record<string, unknown>): ((opts: { value: unknown }) => string | undefined) | undefined {
    const hasRequired = fieldConfig.required;
    const hasRequiredWhen = !!fieldConfig.requiredWhen;
    const hasValidation = !!fieldConfig.validation;
    const hasConditionalValidation = !!fieldConfig.conditionalValidation && fieldConfig.conditionalValidation.length > 0;

    if (!hasRequired && !hasRequiredWhen && !hasValidation && !hasConditionalValidation) return undefined;

    return ({ value }: { value: unknown }) => {
        const allValues = getAllValues();

        // If hidden, skip validation entirely
        if (fieldConfig.hidden) return undefined;

        // If visibleWhen exists and field is not visible, skip validation
        if (fieldConfig.visibleWhen) {
            const dep = fieldConfig.visibleWhen;
            const visible = 'fields' in dep ? dep.condition(allValues) : dep.condition(allValues[dep.field], allValues);
            if (!visible) return undefined;
        }

        // Required check (static)
        if (hasRequired && isEmpty(value)) {
            return `${fieldConfig.label} is required`;
        }

        // Required check (conditional - requiredWhen)
        if (hasRequiredWhen && !hasRequired) {
            const dep = fieldConfig.requiredWhen!;
            const isRequired = 'fields' in dep ? dep.condition(allValues) : dep.condition(allValues[dep.field], allValues);
            if (isRequired && isEmpty(value)) {
                return `${fieldConfig.label} is required`;
            }
        }

        // Apply static validation rules
        if (hasValidation) {
            const error = validateValueAgainstRules(value, fieldConfig.validation!, allValues);
            if (error) return error;
        }

        // Apply conditional validation rules (both run together with static)
        if (hasConditionalValidation) {
            const conditionalRules = resolveConditionalRules(fieldConfig.conditionalValidation!, allValues);
            if (conditionalRules) {
                const error = validateValueAgainstRules(value, conditionalRules, allValues);
                if (error) return error;
            }
        }

        return undefined;
    };
}
