export interface LiteLLMProxy {
    proxy_base_url: string;
    proxy_key: string;
}

export interface OnboardLiteLLMProxyRequest {
    proxy_base_url: string;
    proxy_key: string;
}

export interface OnboardLiteLLMProxyResponse {
    message: string;
}

export interface DeleteLiteLLMProxyResponse {
    message: string;
}
