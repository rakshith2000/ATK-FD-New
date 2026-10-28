export interface KnowledgeArticle {
    content: string;
    kb_metadata: {
        roles: Array<string>;
        title: string;
        author: string;
        number: string;
        rating: string;
        kb_link: string;
        kb_category: string;
        kb_knowledge_base: string;
    };
}

export interface DisplayValue {
    display_value: string;
    value: string;
}

export interface KnowledgeArticle_From_List_API {
    sys_id: DisplayValue;
    number: DisplayValue;
    short_description: DisplayValue;
    kb_knowledge_base: DisplayValue;
    sys_created_on: DisplayValue;
    author: DisplayValue;
    rating: DisplayValue;
    workflow_state: DisplayValue;
    text: DisplayValue;
    kb_category: DisplayValue;
}

export interface CategoryKBAnalytics {
    category: KBCategory;
    articlesCount: number;
    articles: KnowledgeArticle_From_List_API[];
    lowScoringArticlesCount: number;
    lowScoringArticles: KnowledgeArticle_From_List_API[];
}

export interface KBCatalogAnalytics {
    articlesCount: number;
    articles: KnowledgeArticle_From_List_API[];
    lowScoringArticlesCount: number;
    lowScoringArticles: KnowledgeArticle_From_List_API[];
    byCategory: CategoryKBAnalytics[];
}

export interface RecentKBArticle {
    number: string;
    short_description: string;
    kb_category: string;
}

// Duplicate KB
export type KBNumber = string;

export type KBCategory = string;

export type DuplicateKBArticleMap = Record<KBNumber, KnowledgeArticle>;

export type DuplicateKBCategoryMap = Record<KBCategory, Array<DuplicateKBArticleMap>>;

export type DuplicateKBCatalog = DuplicateKBCategoryMap[];

export interface CategoryWiseDuplicateCatalog {
    category: KBCategory;
    articlesCount: number;
    duplicateArticlesCount: number;
    duplicateGroups: DuplicateGroup[];
}

export interface DuplicateGroup {
    groupIndex: number;
    articlesCount: number;
    category: string;
    knowledgeBase: string;
    articles: KnowledgeArticle[];
    kbNumbers: KBNumber[];
}

export interface DuplicateKBCatalogAnalytics {
    categoriesCount: number;
    articlesCount: number;
    duplicateGroupsCount: number;
    duplicateArticlesCount: number;
    byCategory: CategoryWiseDuplicateCatalog[];
}

export interface MergedKnowledgeArticleResponse {
    title: string;
    merged_article: string;
    details: {
        grammar: string[];
        overlapping: string[];
        conflicting: string[];
        complementary: string[];
    };
}
