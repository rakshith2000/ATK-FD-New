import type { AuthProviderType, KeycloakAuthIdentityProvider } from '@/shared/modules/auth/types/auth';
import { resolvePublicAssetPath } from '@/shared/utils/resolve-public-asset-path';

export interface AppConfig {
    cosmotics: {
        brandName: string;
        enableViewingModeToggle: boolean;
    };
    isInDemoEnvironment: boolean;
    demoEnvironmentActionMessage: string;
    backend: {
        api: {
            baseUrl: string;
            userSnowDetails: string;
            // Knowledge AI
            listKbCategories: string; // GET
            listIssuesWithoutKbArticles: string; // GET
            listRecentKbArticles: string; // GET
            refineKbArticle: string; // POST
            generateKbArticle: string; // POST
            mergeKbArticles: string; // POST
            listDuplicateKnowledgeArticles: string; // GET
            createKnowledgeArticle: string; // POST
            updateKnowledgeArticle: string; // POST
            listKnowledgeArticles: string;
            // Incident AI
            listRelevantArticles: string;
            generateResolutionNotes: string;
            // Change AI
            draftChange: string; // POST
            uploadDraftImage: string;
            pushChangeRequestToItsm: string; // POST
            // Train AI
            listAllQuizzes: string; // GET
            // Chat BOT
            chatBot: string;
            // Admin portal //
            // Prompt Library
            getToolkitPackageConfig: string; // POST
            updateToolkitPackageConfig: string; // POST
            updateAgentDefination: string; // POST
            // LLM Models Configurations
            listLLMs: string; // GET
            listLLMsWithConfig: string; // GET
            onboardLLM: string; // POST
            getLLMConfig: string; // POST
            deleteLLM: string; // POST
            // Lite LLM Proxy Configurations
            listLiteLLMProxies: string; // GET
            onboardLiteLLMProxy: string; // POST
            deleteLiteLLMProxy: string; // POST
            // ITSM Connectors
            listITSMConnectors: string; // GET
            onboardITSMConnector: string; // POST
            deleteITSMConnector: string; // POST
            getITSMConnectorConfig: string; // POST
            // Vault Config
            uploadVaultConfig: string; // POST Multipart/form-data
            // meeting ai
            meeting_by_grp_partcipants: string;
            meeting_onboard: string;
            meeting_kb_creation: string;
            meeting_kb_categories: string;
            meeting_details_by_meeting_id: string;
            meeting_update_group: string;
            meeting_archived_articles: string;
            meeting_chat: string;
            meeting_get_auth_details: string;
            meeting_delete: string;
            meeting_start_refresh: string;
            meeting_transcript: string;
            // Problem AI
            problem_list_tickets: string;
            problem_assignment_groups: string;
            problem_state_choices: string;
            problem_group_members: string;
            problem_push_to_itsm: string;
            problem_update_details: string;
            //Train- Ai
            generateMcqs: string;
            getMcqs: string;
            submitQuiz: string;
            listQuestionsWithIncorrectResponses: string;
            generateScenarios: string;
            listQuizzes: string;
            listQuizzesForUser: string;
            // major-incident-management
            get_mim_details: string;
            upload_shift_roaster: string;
            download_roaster_file: string;
            // form management
            update_form_configuration: string; // PUT
            create_form_configuration: string; // POST
            get_form_configuration: string; // GET
            delete_form_configuration: string; // DELETE
        };
    };
    serviceNow: {
        api: {
            baseUrl: string;
            userDetails: string;
            userMemberOfAssignmentGroupsByUserSysId: string;
            assignmentGroups: string;
            incidentTable: string;
            knowledgeTable: string;
            problemTable: string;
            sysChoiceTable: string;
            ticketsAssignedByUserSysId: string;
            ticketsAssignedByGroupQuery: string;
            ticketsUnassignedByTicketType: string;
            ticketStateChoiceByTicketType: string;
            ticketRequestStateChoiceByTicketType: string;
            ticketJournalEntriesTypeTicketSysId: string;
            ticketAuditEntriesTypeTicketSysId: string;
            ticketRelatedIncidentsByTicketCmdbCiId: string;
            ticketRelatedChangesByTicketCmdbCiId: string;
            ticketRelatedAlertsByTicketSysId: string;
            groupMembersByGroupSysId: string;
            searchCmdbCi: string;
            patchTicketBySysId: string;
            ticketRelatedProblemsByTicketCmdbCiId: string;
            ticketRelatedProblemAlertsByTicketSysId: string;
            userRelatedRequestsByUserSysId: string;
            relatedRequestsByShortDescription: string;
            // Knowledge browser (accessible knowledge articles for the current user)
            knowledgeUserCriteria: string;
            knowledgeBaseReadAccess: string;
            knowledgeArticles: string;
            ticketAttachments: string;
            ticketDownloadAttachment: string;
            ticketUploadAttachment: string;
            ticketRelatedIncidentByTicketSysId: string;
            submitChangeRequest: string;
        };
    };
    fasteai: {
        baseUrl: string;
        sopBaseUrl: string;
        logsBaseUrl: string;
        sopGeneration: string;
        coreWebsocket: string;
        schedulerBaseUrl: string;
    };
    userServiceNowUserIDKeyInAuth: string;
    servicenowSysUserQueryKey: string;
    auth: {
        MAX_TOKEN_REFRESH_RETRIES: number;
        provider: AuthProviderType;
        entraId: {
            clientId: string;
            authority: string;
            redirectUri: string;
            postLogoutRedirectUri: string;
        };
        keycloak: {
            url: string;
            realm: string;
            clientId: string;
            redirectUri: string;
            postLogoutRedirectUri: string;
            identityProvider: KeycloakAuthIdentityProvider;
            identityProviderAlias: string;
        };
    };
    accessControl: {
        pages: {
            gbac: {
                admin: string;
            };
        };
        features: {
            gbac: {
                mimAiPromptLibrary: string;
                problemAiPromptLibrary: string;
                changeAiPromptLibrary: string;
                trainAiPromptLibrary: string;
                knowledgeAiPromptLibrary: string;
                meetingAiPromptLibrary: string;
                incidentAiPromptLibrary: string;
                adminPromptLibrary: string;
                adminItsmConnectors: string;
                adminLlmModels: string;
                adminLiteLLMProxy: string;
                adminAgentGateWay: string;
                adminVault: string;
                adminFormManagement: string;
                adminSsoClient: string;
            };
        };
    };
    externalLinks: {
        cloudAi: string;
        ticketAudit: string;
        callAudit: string;
        atkPulse: string;
    };
    iframes: {
        agentGateway: string;
    };
    hybridForms: {
        enableIncidentForm: boolean;
    };
}

let _appConfig: AppConfig | null = null;

function validateObject(obj: unknown, path: string, shape: Record<string, string>): string[] {
    const errors: string[] = [];
    if (typeof obj !== 'object' || obj === null) {
        return [`${path}: expected object, got ${typeof obj}`];
    }
    for (const [key, expectedType] of Object.entries(shape)) {
        const value = (obj as Record<string, unknown>)[key];
        if (value === undefined) {
            errors.push(`${path}.${key}: missing required field`);
        } else if (expectedType === 'object') {
            if (typeof value !== 'object' || value === null) {
                errors.push(`${path}.${key}: expected object, got ${typeof value}`);
            }
        } else if (expectedType.startsWith('enum:')) {
            const allowedValues: Array<string> = expectedType.slice(5).split(',');
            if (typeof value === 'string' && allowedValues.includes(value)) {
                continue;
            } else {
                errors.push(`${path}.${key}: expected ${expectedType}, got ${value}, ${typeof value}`);
            }
        } else if (typeof value !== expectedType) {
            errors.push(`${path}.${key}: expected ${expectedType}, got ${typeof value}`);
        }
    }
    return errors;
}

function validateAppConfig(config: unknown): string[] {
    const errors: string[] = [];
    if (typeof config !== 'object' || config === null) {
        return ['Config root: expected object'];
    }
    const c = config as Record<string, unknown>;

    // Root-level fields
    errors.push(
        ...validateObject(c, 'config', {
            cosmotics: 'object',
            isInDemoEnvironment: 'boolean',
            demoEnvironmentActionMessage: 'string',
            fasteai: 'object',
            backend: 'object',
            serviceNow: 'object',
            userServiceNowUserIDKeyInAuth: 'string',
            servicenowSysUserQueryKey: 'string',
            auth: 'object',
            accessControl: 'object',
            externalLinks: 'object',
            iframes: 'object',
        }),
    );

    // cosmotics
    errors.push(
        ...validateObject(c.cosmotics, 'cosmotics', {
            brandName: 'string',
            enableViewingModeToggle: 'boolean',
        }),
    );

    if (typeof c.fasteai === 'object' && c.fasteai !== null) {
        errors.push(
            ...validateObject(c.fasteai, 'fasteai', {
                baseUrl: 'string',
                sopBaseUrl: 'string',
                logsBaseUrl: 'string',
                sopGeneration: 'string',
                coreWebsocket: 'string',
                schedulerBaseUrl: 'string',
            }),
        );
    }

    // backend.api
    if (typeof c.backend === 'object' && c.backend !== null) {
        errors.push(
            ...validateObject((c.backend as Record<string, unknown>).api, 'backend.api', {
                baseUrl: 'string',
                userSnowDetails: 'string',
                listKbCategories: 'string',
                listIssuesWithoutKbArticles: 'string',
                listRecentKbArticles: 'string',
                refineKbArticle: 'string',
                generateKbArticle: 'string',
                mergeKbArticles: 'string',
                listDuplicateKnowledgeArticles: 'string',
                createKnowledgeArticle: 'string',
                updateKnowledgeArticle: 'string',
                listKnowledgeArticles: 'string',
                listRelevantArticles: 'string',
                generateResolutionNotes: 'string',
                draftChange: 'string',
                uploadDraftImage: 'string',
                pushChangeRequestToItsm: 'string',
                listAllQuizzes: 'string',
                chatBot: 'string',
                getToolkitPackageConfig: 'string',
                updateToolkitPackageConfig: 'string',
                updateAgentDefination: 'string',
                listLLMs: 'string',
                listLLMsWithConfig: 'string',
                onboardLLM: 'string',
                getLLMConfig: 'string',
                deleteLLM: 'string',
                listLiteLLMProxies: 'string',
                onboardLiteLLMProxy: 'string',
                deleteLiteLLMProxy: 'string',
                listITSMConnectors: 'string',
                onboardITSMConnector: 'string',
                deleteITSMConnector: 'string',
                getITSMConnectorConfig: 'string',
                uploadVaultConfig: 'string',
                meeting_by_grp_partcipants: 'string',
                meeting_onboard: 'string',
                meeting_kb_creation: 'string',
                meeting_kb_categories: 'string',
                meeting_details_by_meeting_id: 'string',
                meeting_update_group: 'string',
                meeting_archived_articles: 'string',
                meeting_chat: 'string',
                meeting_get_auth_details: 'string',
                meeting_delete: 'string',
                meeting_start_refresh: 'string',
                meeting_transcript: 'string',
                problem_list_tickets: 'string',
                problem_assignment_groups: 'string',
                problem_state_choices: 'string',
                problem_group_members: 'string',
                problem_push_to_itsm: 'string',
                problem_update_details: 'string',
                generateMcqs: 'string',
                getMcqs: 'string',
                submitQuiz: 'string',
                listQuestionsWithIncorrectResponses: 'string',
                generateScenarios: 'string',
                listQuizzes: 'string',
                listQuizzesForUser: 'string',
                get_mim_details: 'string',
                upload_shift_roaster: 'string',
                download_roaster_file: 'string',
                // form management
                update_form_configuration: 'string',
                create_form_configuration: 'string',
                get_form_configuration: 'string',
                delete_form_configuration: 'string',
            }),
        );
    }

    // serviceNow.api
    if (typeof c.serviceNow === 'object' && c.serviceNow !== null) {
        errors.push(
            ...validateObject((c.serviceNow as Record<string, unknown>).api, 'serviceNow.api', {
                baseUrl: 'string',
                userDetails: 'string',
                userMemberOfAssignmentGroupsByUserSysId: 'string',
                assignmentGroups: 'string',
                incidentTable: 'string',
                knowledgeTable: 'string',
                problemTable: 'string',
                sysChoiceTable: 'string',
                ticketsAssignedByUserSysId: 'string',
                ticketsAssignedByGroupQuery: 'string',
                ticketsUnassignedByTicketType: 'string',
                ticketStateChoiceByTicketType: 'string',
                ticketRequestStateChoiceByTicketType: 'string',
                ticketJournalEntriesTypeTicketSysId: 'string',
                ticketAuditEntriesTypeTicketSysId: 'string',
                ticketRelatedIncidentsByTicketCmdbCiId: 'string',
                ticketRelatedChangesByTicketCmdbCiId: 'string',
                ticketRelatedAlertsByTicketSysId: 'string',
                groupMembersByGroupSysId: 'string',
                searchCmdbCi: 'string',
                patchTicketBySysId: 'string',
                ticketRelatedProblemsByTicketCmdbCiId: 'string',
                ticketRelatedProblemAlertsByTicketSysId: 'string',
                userRelatedRequestsByUserSysId: 'string',
                relatedRequestsByShortDescription: 'string',
                knowledgeUserCriteria: 'string',
                knowledgeBaseReadAccess: 'string',
                knowledgeArticles: 'string',
                ticketAttachments: 'string',
                ticketDownloadAttachment: 'string',
                ticketUploadAttachment: 'string',
                ticketRelatedIncidentByTicketSysId: 'string',
                submitChangeRequest: 'string',
            }),
        );
    }

    // auth
    if (typeof c.auth === 'object' && c.auth !== null) {
        const auth = c.auth as Record<string, unknown>;
        errors.push(
            ...validateObject(auth, 'auth', {
                MAX_TOKEN_REFRESH_RETRIES: 'number',
                provider: 'enum:entra-id,keycloak',
                entraId: 'object',
                keycloak: 'object',
            }),
        );
        errors.push(
            ...validateObject(auth.entraId, 'auth.entraId', {
                clientId: 'string',
                authority: 'string',
                redirectUri: 'string',
                postLogoutRedirectUri: 'string',
            }),
        );
        errors.push(
            ...validateObject(auth.keycloak, 'auth.keycloak', {
                url: 'string',
                realm: 'string',
                clientId: 'string',
                identityProvider: 'enum:keycloak,others',
                identityProviderAlias: 'string',
            }),
        );
    }

    // accessControl
    if (typeof c.accessControl === 'object' && c.accessControl !== null) {
        const ac = c.accessControl as Record<string, unknown>;
        errors.push(...validateObject(ac, 'accessControl', { pages: 'object', features: 'object' }));
        if (typeof ac.pages === 'object' && ac.pages !== null) {
            errors.push(
                ...validateObject((ac.pages as Record<string, unknown>).gbac, 'accessControl.pages.gbac', {
                    admin: 'string',
                }),
            );
        }
        if (typeof ac.features === 'object' && ac.features !== null) {
            errors.push(
                ...validateObject((ac.features as Record<string, unknown>).gbac, 'accessControl.features.gbac', {
                    mimAiPromptLibrary: 'string',
                    problemAiPromptLibrary: 'string',
                    changeAiPromptLibrary: 'string',
                    trainAiPromptLibrary: 'string',
                    knowledgeAiPromptLibrary: 'string',
                    meetingAiPromptLibrary: 'string',
                    incidentAiPromptLibrary: 'string',
                    adminPromptLibrary: 'string',
                    adminItsmConnectors: 'string',
                    adminLlmModels: 'string',
                    adminLiteLLMProxy: 'string',
                    adminAgentGateWay: 'string',
                    adminVault: 'string',
                    adminFormManagement: 'string',
                    adminSsoClient: 'string',
                }),
            );
        }
    }

    // externalLinks
    errors.push(
        ...validateObject(c.externalLinks, 'externalLinks', {
            cloudAi: 'string',
            ticketAudit: 'string',
            callAudit: 'string',
            atkPulse: 'string',
        }),
    );

    // iframes
    errors.push(
        ...validateObject(c.iframes, 'iframes', {
            agentGateway: 'string',
        }),
    );

    // hybrid Forms
    errors.push(
        ...validateObject(c.hybridForms, 'hybridForms', {
            enableIncidentForm: 'boolean',
        }),
    );

    return errors;
}

export async function loadAppConfig(): Promise<AppConfig> {
    const response = await fetch(resolvePublicAssetPath('/app-config.json'));
    if (!response.ok) {
        throw new Error(`Failed to load app-config.json: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();

    // Validate the loaded config
    const errors = validateAppConfig(json);
    if (errors.length > 0) {
        throw new Error(`Invalid app-config.json:\n${errors.join('\n')}`);
    }

    // Inject runtime values that depend on the browser context
    json.auth.keycloak.redirectUri = window.location.href;
    json.auth.keycloak.postLogoutRedirectUri = window.location.href;

    _appConfig = json as AppConfig;
    return _appConfig;
}

export const appConfig: AppConfig = new Proxy({} as AppConfig, {
    get(_target, prop, receiver) {
        if (_appConfig === null) {
            throw new Error('appConfig accessed before loadAppConfig() was called. Ensure loadAppConfig() is awaited in main.tsx before rendering.');
        }
        return Reflect.get(_appConfig, prop, receiver);
    },

    ownKeys(_target) {
        if (_appConfig === null) {
            throw new Error('appConfig accessed before loadAppConfig() was called. Ensure loadAppConfig() is awaited in main.tsx before rendering.');
        }
        return Reflect.ownKeys(_appConfig);
    },
});
