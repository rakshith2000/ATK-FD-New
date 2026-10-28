// LLM -> Large Language Model
// Get the list of LLM's -> Array<LLM>;
export interface LLM {
    llm_tag: string;
    llm_type: string;
    llm_config: Record<string, string>;
    updated_by: string;
    updated_at: string;
    associated_agents_or_tools: Array<string> | null;
}

export type LLMTsListResponse = Array<{
    llm_tag: string;
    llm_type: string;
    updated_by: string;
}>;

// Create are new LLM
export interface OnboardLLMRequest {
    llm_tag: string;
    llm_type: string;
    llm_config: Record<string, string>;
}
export type OnboardLLMResponse = {
    message: string;
};

// Each LLM configuration details
export interface GetLLMConfigRequest {
    llm_tag: string;
}
export type GetLLMConfigRespone = Record<string, string>;

// Delete an LLM
export interface DeleteLLMRequest {
    llm_tag: string;
}
export type DeleteLLMResponse = {
    message: string;
};
