export interface DraftChangeRequest {
    change_title: string;
    change_purpose: string;
    config_items: string;
    os_info: string;
    uploaded_files: string;
}

export interface ChangeDetails {
    short_description: string;
    description: string;
    implementation_plan: string;
    /** Optional: the draft_change API does not always return a backout plan. */
    backout_plan?: string;
    test_plan: string;
    chg_model: string;
}

export interface DraftChangeResponse {
    change_details: ChangeDetails;
    impact_analysis: string;
}

export interface PushChangesRequest {
    cmdb_ci: string;
    short_description: string;
    description: string;
    implementation_plan: string;
    backout_plan: string;
    test_plan: string;
    chg_model: string;
    risk_impact_analysis: string;
    attachments: string[];
}

export interface PushChangesResponse {
    number: string;
    sys_id: string;
}
