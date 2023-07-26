import { Category } from '../classes/Category';

export interface DocumentClassification {
    categories: CategoryClassification[];
    tokensFrequency: Record<string, number>;
}

export interface CategoryClassification {
    name: string;
    category: Category;
    probability: number;
    tokensProbability: Record<string, number>;
}