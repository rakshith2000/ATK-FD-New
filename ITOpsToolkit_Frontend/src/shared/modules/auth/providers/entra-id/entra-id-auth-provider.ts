import { PublicClientApplication, EventType, LogLevel, type AccountInfo, type AuthenticationResult, type Configuration, type RedirectRequest } from '@azure/msal-browser';
import type { IAuthProvider, AuthUser, AuthState, AuthStateChangeCallback, UserSnowDetails } from '../../types/auth';
import { appConfig } from '@/config/app-config';
import logger from '@/shared/utils/logger';
import { INITIAL_AUTH_STATE } from '../../context/AuthContext';
import { fetchUserServiceNowDetails } from '../../services/fetch-user-servicenow-details';

const buildMsalConfig = (): Configuration => {
    const cfg = appConfig.auth.entraId;
    return {
        auth: {
            clientId: cfg.clientId,
            authority: cfg.authority,
            redirectUri: cfg.redirectUri,
            postLogoutRedirectUri: cfg.postLogoutRedirectUri,
        },
        cache: {
            cacheLocation: 'sessionStorage',
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {
                    if (containsPii) return;
                    switch (level) {
                        case LogLevel.Error:
                            logger.error(message);
                            return;
                        case LogLevel.Info:
                            logger.info(message);
                            return;
                        case LogLevel.Verbose:
                            logger.debug(message);
                            return;
                        case LogLevel.Warning:
                            logger.warn(message);
                            return;
                    }
                },
            },
        },
    };
};

const buildLoginRequest = (): RedirectRequest => ({
    scopes: ['User.Read'],
    redirectUri: appConfig.auth.entraId.redirectUri,
    redirectStartPage: window.location.href,
});

const mapAccount = (account: AccountInfo): AuthUser => {
    const userName = (account?.idTokenClaims as Record<string, unknown>)[appConfig.userServiceNowUserIDKeyInAuth];

    if (!userName || typeof userName !== 'string') {
        const error = new Error(`Unable to retrive userServiceNowUniqueIdKeyName from MS Account Info`);
        logger.error('Failed to fetch userServiceNowUniqueIdKeyName - userName from MS Account Info', error);
        throw error;
    }

    return {
        id: account.localAccountId,
        uniqueId: userName,
        username: account.username,
        displayName: account.name || account.username,
        email: account.username,
        tenantId: account.tenantId,
        raw: account,
        groups: [],
    };
};

export class EntraIdAuthProvider implements IAuthProvider {
    private msalInstance: PublicClientApplication;
    private state: AuthState = { ...INITIAL_AUTH_STATE };
    private listeners = new Set<AuthStateChangeCallback>();
    private initPromise: Promise<void> | null = null;
    private loginInProgress = false;
    private pendingUserSnowDetails: Promise<UserSnowDetails> | null = null;

    constructor() {
        this.msalInstance = new PublicClientApplication(buildMsalConfig());
    }

    revokeAccessToken(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    revokeRefreshToken(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async initialize(): Promise<void> {
        if (this.initPromise) return this.initPromise;
        this.initPromise = this.doInit();
        return this.initPromise;
    }

    private async doInit(): Promise<void> {
        try {
            await this.msalInstance.initialize();

            const response = await this.msalInstance.handleRedirectPromise();

            if (response?.account) {
                this.msalInstance.setActiveAccount(response.account);
            } else if (!this.msalInstance.getActiveAccount() && this.msalInstance.getAllAccounts().length > 0) {
                this.msalInstance.setActiveAccount(this.msalInstance.getAllAccounts()[0]);
            }

            if (window.location.hash.startsWith('#code=')) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            this.msalInstance.addEventCallback((event) => {
                try {
                    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
                        const { account } = event.payload as AuthenticationResult;
                        if (account) {
                            this.msalInstance.setActiveAccount(account);
                        }
                    }

                    if (event.eventType === EventType.HANDLE_REDIRECT_END && window.location.hash.startsWith('#code=')) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }

                    this.refreshState();
                } catch (error) {
                    logger.error('EntraID event callback failed', error);
                    this.setState({
                        ...this.state,
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                }
            });

            // Re-auth on tab focus after inactivity
            document.addEventListener('visibilitychange', async () => {
                if (document.visibilityState !== 'visible') return;
                const account = this.msalInstance.getActiveAccount();
                if (!account) return;

                try {
                    await this.msalInstance.acquireTokenSilent({
                        account,
                        scopes: ['User.Read'],
                    });
                    logger.debug('Token silently refreshed on tab focus');
                } catch {
                    logger.warn('Tab focus token refresh failed - session expired');
                    this.setState({
                        ...this.state,
                        sessionExpired: true,
                        error: new Error('Your session has expired. Please re-authenticate or logout.'),
                    });
                }
            });

            this.refreshState();
            this.setState({ ...this.state, isInitialized: true, isLoading: false });
        } catch (error) {
            logger.error('EntraID initialization failed', error);
            this.setState({
                ...this.state,
                isInitialized: true,
                isLoading: false,
                error: error instanceof Error ? error : new Error(String(error)),
            });
        }
    }

    async login(): Promise<void> {
        if (this.loginInProgress) return;
        this.loginInProgress = true;
        this.setState({ ...this.state, isLoading: true, error: null });
        try {
            await this.msalInstance.loginRedirect(buildLoginRequest());
        } catch (error) {
            this.loginInProgress = false;
            logger.error('EntraID login failed', error);
            this.setState({
                ...this.state,
                isLoading: false,
                error: error instanceof Error ? error : new Error(String(error)),
            });
        }
    }

    async logout(): Promise<void> {
        try {
            await this.msalInstance.logoutRedirect({
                postLogoutRedirectUri: appConfig.auth.entraId.postLogoutRedirectUri,
            });
        } catch (error) {
            logger.error('EntraID logout failed', error);
            this.setState({
                ...this.state,
                error: error instanceof Error ? error : new Error(String(error)),
            });
        }
    }

    getUser(): AuthUser | null {
        const account = this.msalInstance.getActiveAccount();
        return account ? mapAccount(account) : null;
    }

    async getUserMemberOfGroups(): Promise<Array<string>> {
        return [];
    }

    hasGroupMembership(group: string): boolean {
        const groups = this.state.user?.groups ?? [];
        return groups.includes(group);
    }

    async getAccessToken(scopes: string[] = ['User.Read']): Promise<string> {
        const account = this.msalInstance.getActiveAccount();
        if (!account) {
            const error = new Error('Your session has expired. Please re-authenticate or logout.');
            logger.error('EntraID getAccessToken failed - no active account', error);
            this.setState({ ...this.state, sessionExpired: true, error });
            throw error;
        }

        try {
            const response = await this.msalInstance.acquireTokenSilent({ account, scopes });
            return response.accessToken;
        } catch (silentErr) {
            logger.warn('EntraID silent token acquisition failed, trying ssoSilent', silentErr);

            // 1. Try ssoSilent - recovers expired server sessions (302 case)
            try {
                const response = await this.msalInstance.ssoSilent({ ...buildLoginRequest(), scopes });
                return response.accessToken;
            } catch (ssoErr) {
                logger.warn('ssoSilent failed, falling back to redirect', ssoErr);
            }

            // 2. Both failed - session is dead
            const error = new Error('Your session has expired. Please re-authenticate or logout.');
            this.setState({ ...this.state, sessionExpired: true, error });
            throw error;
        }
    }

    getRefreshToken(): Promise<string> {
        throw new Error('Method not implemented.');
    }

    async refreshToken(): Promise<string> {
        const account = this.msalInstance.getActiveAccount();
        if (!account) {
            const error = new Error('Your session has expired. Please re-authenticate or logout.');
            logger.error('EntraID refreshToken failed - no active account', error);
            this.setState({ ...this.state, sessionExpired: true, error });
            throw error;
        }

        try {
            const response = await this.msalInstance.acquireTokenSilent({
                account,
                scopes: ['User.Read'],
                forceRefresh: true,
            });
            this.setState({ ...this.state, sessionExpired: false, error: null });
            this.refreshState();
            return response.accessToken;
        } catch (silentErr) {
            logger.warn('EntraID token refresh failed, trying ssoSilent', silentErr);

            try {
                const response = await this.msalInstance.ssoSilent(buildLoginRequest());
                this.setState({ ...this.state, sessionExpired: false, error: null });
                this.refreshState();
                return response.accessToken;
            } catch (ssoErr) {
                logger.warn('ssoSilent failed - session expired', ssoErr);
            }

            const error = new Error('Your session has expired. Please re-authenticate or logout.');
            this.setState({ ...this.state, sessionExpired: true, error });
            throw error;
        }
    }

    async getUserSnowDetails(): Promise<UserSnowDetails> {
        if (this.state.user?.userSnowDetails) {
            return this.state.user.userSnowDetails;
        }

        if (this.pendingUserSnowDetails) {
            return this.pendingUserSnowDetails;
        }

        const account = this.msalInstance.getActiveAccount();

        if (!account) {
            const error = new Error('No active Entra ID session');
            logger.error('Failed to fetch user ServiceNow details', error);
            this.setState({ ...this.state, error });
            throw error;
        }

        const serviceNowUniqueKey = (account?.idTokenClaims as Record<string, unknown>)?.[appConfig.userServiceNowUserIDKeyInAuth];

        if (!serviceNowUniqueKey || typeof serviceNowUniqueKey !== 'string') {
            const error = new Error(`Unable to retrive userServiceNowUniqueIdKeyName from Entra ID account details`);
            logger.error('Failed to fetch user ServiceNow details', error);
            this.setState({ ...this.state, error });
            throw error;
        }

        this.pendingUserSnowDetails = fetchUserServiceNowDetails({ queryKey: appConfig.servicenowSysUserQueryKey, queryValue: serviceNowUniqueKey })
            .then((userDetails) => {
                const currentUser = this.state.user;
                if (!currentUser) throw new Error('No authenticated user');

                this.setState({
                    ...this.state,
                    user: {
                        ...currentUser,
                        userSnowDetails: { ...userDetails },
                    },
                });

                return userDetails;
            })
            .catch((error) => {
                const msg = error instanceof Error ? error.message : String(error);
                logger.error('Failed to fetch user ServiceNow details:', msg);
                this.setState({
                    ...this.state,
                    error: error instanceof Error ? error : new Error(msg),
                });
                throw error;
            })
            .finally(() => {
                this.pendingUserSnowDetails = null;
            });

        return this.pendingUserSnowDetails;
    }

    isAuthenticated(): boolean {
        return !!this.msalInstance.getActiveAccount();
    }

    getState(): AuthState {
        return { ...this.state };
    }

    subscribe(callback: AuthStateChangeCallback): () => void {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    private refreshState(): void {
        const account = this.msalInstance.getActiveAccount();
        const freshUser = account ? mapAccount(account) : null;
        this.setState({
            ...this.state,
            isAuthenticated: !!account,
            user: freshUser ? { ...freshUser, userSnowDetails: this.state.user?.userSnowDetails } : null,
        });
    }

    private setState(next: AuthState): void {
        this.state = next;
        this.listeners.forEach((cb) => cb(this.state));
    }
}
