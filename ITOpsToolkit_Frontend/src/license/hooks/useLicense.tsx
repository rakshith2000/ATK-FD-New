// Hook for component-level feature gating with licence.
import { useEffect, useState } from 'react';
import { verifyLicense } from '../utils/verify-license';
import type { LicensePayload } from '../types/license';
import isValidPayload from '../type-guards/is-valid-payload';
import logger from '@/shared/utils/logger';
import type { moduleIdMappings } from '../constants/module-id-mappings';

interface LicenseState {
    loading: boolean;
    valid: boolean;
    payload: LicensePayload | null;
}

export function useLicense() {
    const [state, setState] = useState<LicenseState>({
        loading: true,
        valid: false,
        payload: null,
    });

    useEffect(() => {
        let active = true;

        verifyLicense().then((result) => {
            if (!active) return;

            setState({
                loading: false,
                valid: result.valid,
                payload: (result.payload as LicensePayload) || null,
            });
        });

        return () => {
            active = false;
        };
    }, []);

    logger.debug('License state updated:', state);

    // Validate payload only if it exists
    if ((!state.valid || !state.payload || !isValidPayload(state.payload)) && !state.loading) {
        throw new Error(`Invalid License`);
    }

    return {
        ...state,
        hasModule: (moduleName: keyof typeof moduleIdMappings) => Boolean(state.payload?.modules?.[moduleName]),
        hasFeature: (featureName: string) => Boolean(state.payload?.features?.[featureName]),
    };
}
