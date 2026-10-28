# Auth Module

## Approach

The auth module uses a **strategy pattern** to support multiple SSO providers (EntraID, Keycloak, etc.) behind a single interface. The app never imports provider-specific libraries
directly. It only depends on shared types and the `useAuth` hook.

The active provider is picked at runtime from `appConfig.auth.provider`. Switching providers is a one-line config change.

## Folder Structure

```
src/modules/auth/
  types.ts                                    Shared interfaces (IAuthProvider, AuthUser, AuthState)
  auth-provider-factory.ts                    Reads config and returns the correct provider instance
  context/
    AuthContext.tsx                            React context + <AuthProvider> wrapper component
  hooks/
    useAuth.ts                                useAuth() hook consumed by the rest of the app
  utils/
    get-auth-provider-instance.ts             Singleton accessor for the provider instance
  components/
    withAuth.tsx                              HOC that guards routes (auto-login + loading/error UI)
  providers/
    entra-id/
      entra-id-auth-provider.ts               EntraID (MSAL) implementation of IAuthProvider
    keycloak/
      keycloak-auth-provider.ts               Keycloak implementation of IAuthProvider
  services/
    ms-graph-service.ts                       MS Graph API helper (accepts a raw access token)
```

## How It Works

1. `App.tsx` renders `<AuthProvider>` at the root.
2. `AuthProvider` creates the provider singleton via the factory and calls `initialize()`.
3. The provider handles redirects, restores sessions, and subscribes to auth events internally.
4. State changes flow through `subscribe()` into React state, which updates the context.
5. Components use `useAuth()` for auth state, login, logout, and token access.
6. Route-level protection is done with the `withAuth` HOC, which auto-triggers login if no session exists.

## Diagrams

### Strategy Pattern Overview

```
                           +------------------+
                           |  IAuthProvider   |  (interface)
                           +------------------+
                            /    |         \
                           /     |          \
          +-----------------+  +----------+  +----------+
          | EntraIdAuth     |  | Keycloak |  |  ...     |
          | Provider        |  | Auth     |  | (future  |
          |                 |  | Provider |  | provider)|
          +-----------------+  +----------+  +----------+
                           \     |          /
                            \    |         /
                      +-------------------+
                      | AuthProvider      |
                      | Factory           |
                      +-------------------+
                               |
                 +-----------------------------+
                 |  getAuthProviderInstance()   |  (singleton)
                 +-----------------------------+
                        /              \
                       /                \
          (React code)                   (Non-React code)
                     /                    \
        +-------------------+    +-------------------------+
        | AuthContext       |    | Axios interceptors,     |
        +-------------------+    | services, utilities     |
                 |               +-------------------------+
        +-------------------+
        | useAuth()        |
        +-------------------+
                 |
        +-------------------+
        | Components       |
        +-------------------+
```

### Initialization & Login Flow

```
App.tsx
  |
  |-- renders <AuthProvider>
  |       |
  |       |-- getAuthProviderInstance()  (singleton)
  |       |       |
  |       |       |-- createAuthProvider()  (reads appConfig.auth.provider)
  |       |       |       |
  |       |       |       +-- "entra-id"  --> new EntraIdAuthProvider()
  |       |       |       +-- "keycloak"  --> new KeycloakAuthProvider()
  |       |
  |       |-- provider.initialize()
  |       |       |
  |       |       +-- handles redirects / restores existing session
  |       |       +-- sets state: isInitialized = true
  |       |
  |       |-- provider.subscribe(setState)  --> state flows into React context
  |
  |-- (if no session & route guarded by withAuth)
          |
          +-- provider.login()  --> redirect to IDP
          +-- IDP authenticates user --> redirect back
          +-- provider updates state: isAuthenticated = true, user = AuthUser
```

### Route Protection (withAuth HOC)

```
withAuth(Component)
  |
  +-- state.isInitialized == false?  --> show "Authenticating..." spinner
  |
  +-- state.error?                   --> show error UI + refresh button
  |
  +-- state.isAuthenticated == false? --> auto-trigger login()
  |
  +-- state.isAuthenticated == true?  --> render <Component user={AuthUser} />
```

## Key Interfaces

### AuthUser

Normalized user object returned by all providers:

| Field       | Type      | Description                               |
| ----------- | --------- | ----------------------------------------- |
| id          | string    | Provider-scoped user ID                   |
| uniqueId    | string    | Globally unique ID (OID, sub, etc.)       |
| username    | string    | UPN or email                              |
| displayName | string    | Human-readable name                       |
| email       | string?   | Email if available                        |
| tenantId    | string?   | Tenant or realm ID                        |
| roles       | string[]? | Assigned roles                            |
| raw         | unknown   | Original provider-specific account object |

### IAuthProvider

Every provider implements this:

- `initialize()` - bootstrap (handle redirects, restore session)
- `login()` / `logout()` - trigger auth flows
- `getUser()` - current user or null
- `getAccessToken(scopes?)` - acquire a valid token
- `refreshToken()` - force-refresh the token and return the new one
- `isAuthenticated()` - boolean check
- `getState()` - full state snapshot
- `subscribe(callback)` - listen for state changes, returns unsubscribe fn

## How to Switch Providers

In `src/config/app-config.ts`:

```ts
auth: {
    provider: 'keycloak', // change from 'entra-id' to 'keycloak'
    ...
}
```

Fill in the matching config block (`keycloak.url`, `keycloak.realm`, `keycloak.clientId`).

## How to Add a New Provider

1. Create `src/modules/auth/providers/<name>/<name>-auth-provider.ts`
2. Implement the `IAuthProvider` interface
3. Add the key to `AuthProviderType` in `types.ts`
4. Add a `case` in `auth-provider-factory.ts`
5. Add the config block in `app-config.ts` under `auth.<name>`

### Minimal example

```ts
import type { IAuthProvider, AuthState, AuthUser, AuthStateChangeCallback } from '../../types';
import { INITIAL_AUTH_STATE } from '../../types';

export class MyAuthProvider implements IAuthProvider {
    private state: AuthState = { ...INITIAL_AUTH_STATE };
    private listeners = new Set<AuthStateChangeCallback>();

    async initialize(): Promise<void> {
        /* ... */
    }
    async login(): Promise<void> {
        /* ... */
    }
    async logout(): Promise<void> {
        /* ... */
    }
    getUser(): AuthUser | null {
        /* ... */
    }
    async getAccessToken(scopes?: string[]): Promise<string> {
        /* ... */
    }
    isAuthenticated(): boolean {
        /* ... */
    }
    getState(): AuthState {
        return { ...this.state };
    }

    subscribe(callback: AuthStateChangeCallback): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    private setState(next: AuthState): void {
        this.state = next;
        this.listeners.forEach((cb) => cb(this.state));
    }
}
```

## Usage in Components

### Using the hook

```tsx
import { useAuth } from '@/modules/auth/hooks/useAuth';

const MyComponent = () => {
    const { state, logout, getAccessToken } = useAuth();

    if (!state.isAuthenticated) return null;

    return <p>Hello, {state.user?.displayName}</p>;
};
```

### Protecting a route

```tsx
import withAuth from '@/modules/auth/components/withAuth';

const Dashboard = ({ user }: WithAuthProps) => {
    return <p>Welcome {user.displayName}</p>;
};

export default withAuth(Dashboard);
```

### Getting a token for API calls

```tsx
const { getAccessToken } = useAuth();
const token = await getAccessToken(['User.Read']);
```

### Force-refreshing a token

```tsx
const { refreshToken } = useAuth();
const newToken = await refreshToken();
```

## Usage Outside React (plain TS files, services, interceptors)

Use `getAuthProviderInstance()` directly instead of `useAuth()`. It returns the same singleton provider that the React context uses.

```ts
import { getAuthProviderInstance } from '@/modules/auth/utils/get-auth-provider-instance';
```

### Adding a Bearer token in an Axios interceptor

```ts
const authToken = await getAuthProviderInstance().getAccessToken();

if (authToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
}
```

See `src/api/axios-clients/backend-api-client.ts` for the full example.

### Getting ServiceNow credentials in an interceptor

```ts
const snowCreds = await getAuthProviderInstance().getServiceNowDetails();

if (snowCreds && config.headers) {
    config.auth = {
        username: snowCreds.SNOW_USER,
        password: snowCreds.SNOW_PASS,
    };
}
```

See `src/api/axios-clients/service-now-api-client.ts` for the full example.

### Getting the current user's ServiceNow details in a service

```ts
const { user_name } = await getAuthProviderInstance().getUserSnowDetails();
```

See `src/shared/services/fetch-kb-categories.ts` for the full example.
