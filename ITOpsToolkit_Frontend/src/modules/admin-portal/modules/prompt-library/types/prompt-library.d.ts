interface PackageConfiguration {
    llm_tag: string;
    itsm_tags: string[];
    llm_guards: string[];
}

export interface PromptConfiguration {
    description: string;
    instruction: string;
    llm_tag?: string | null;
    itsm_tags?: Array<string> | null;
}

export interface GetToolkitPackageConfigRequest {
    package_name: string;
}

interface GetToolkitPackageConfigResponse {
    package_configs: PackageConfiguration;
    prompts: Record<string, PromptConfiguration>;
}

export interface UpdatePromptConfigRequest {
    package_name: string;
    agent_or_tool_name: string;
    description: string;
    instruction: string;
    llm_tag: string | null;
    itsm_tags: Array<string> | null;
}

export interface UpdatePromptConfigResponse {
    message: string;
}

export interface UpdateToolkitPackageConfigRequest {
    package_name: string;
    llm_tag: string;
    llm_guards: Array<string>;
    itsm_tags: Array<string>;
}

export interface UpdateToolkitPackageConfigResponse {
    message: string;
}
