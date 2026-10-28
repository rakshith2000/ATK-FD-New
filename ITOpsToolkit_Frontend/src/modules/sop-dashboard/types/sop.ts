export interface SOP {
    id: number;
    sop_name: string;
    sop_content: string;
    category: string;
    created_by?: string;
    is_approved: 'True' | 'False';
}

export interface SOPVector {
    id: number;
    sop_name: string;
}
