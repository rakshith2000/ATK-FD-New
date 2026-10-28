export interface ITSMConnector {
    itsm_tag: string;
    itsm_type: string;
    updated_by: string;
}

export type ITSMConnectorsListResponse = Array<ITSMConnector>;

export interface ITSMConnectorConfig {
    itsm_tag: string;
    itsm_type: string;
    itsm_auth_type: string;
    itsm_url: string;
    itsm_user: string;
    itsm_password: string;
    bearer_token: string;
    itsm_additional_config?: Record<string, unknown> | null;
}

export interface GetITSMConnectorConfigRequest {
    itsm_tag: string;
}

export type OnboardITSMConnectorRequest = ITSMConnectorConfig;

export interface OnboardITSMConnectorResponse {
    message: string;
}
export interface DeleteITSMConnectorRequest {
    itsm_tag: string;
}

export interface DeleteITSMConnectorResponse {
    message: string;
}
