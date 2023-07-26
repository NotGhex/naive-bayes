import { Collection } from '@discordjs/collection';
import { collectionToRecord, defaultTokenizer } from '../utils/helpers';
import { Category, CategoryData } from './Category';
import { DocumentClassification } from '../utils/types';

export interface NaiveBayesClassifierData {
    categories: CategoryData[];
    vocabulary: string[];
}

export interface NaiveBayesClassifierOptions extends Partial<NaiveBayesClassifierData> {
    tokenizer?: (document: string) => string[]|PromiseLike<string[]>;
}

export class NaiveBayesClassifier implements Omit<NaiveBayesClassifierData, 'categories'> {
    public tokenizer: Exclude<NaiveBayesClassifierOptions['tokenizer'], undefined> = defaultTokenizer;
    public categories: Collection<string, Category> = new Collection();
    public vocabulary: string[] = [];

    get totalDocuments() {
        return this.categories.reduce((acc, category) => acc + category.documentsCount, 0);
    }

    constructor(options?: NaiveBayesClassifierOptions) {
        this.tokenizer = options?.tokenizer ?? this.tokenizer;
        this.vocabulary = options?.vocabulary ?? this.vocabulary;

        for (const categoryData of options?.categories ?? []) {
            this.categories.set(categoryData.name, new Category({ ...categoryData, classifier: this }));
        }
    }

    public addWordToVocabulary(word: string): this {
        if (this.vocabulary.includes(word)) return this;
        this.vocabulary.push(word);

        return this;
    }

    public async learn(document: string, classifications: string|string[]): Promise<this> {
        const categories = (typeof classifications === 'string' ? [classifications] : classifications).map(n => this.resolveCategory(n));
        const tokens = await this.tokenizer(document);

        await Promise.all(categories.map(c => c.addDocument(tokens)));

        return this;
    }

    public async classify(document: string): Promise<DocumentClassification> {
        const tokens = await this.tokenizer(document);
        const frequencyTable = this.getTokensFrequency(tokens);
        const totalDocuments = this.totalDocuments;
        const classification: DocumentClassification = {
            categories: [],
            tokensFrequency: collectionToRecord(frequencyTable)
        };

        for (const category of this.categories.values()) {
            let categoryProbability = Math.log(category.documentsCount / totalDocuments);

            const tokensProbability: Record<string, number> = {};

            for (const [token, tokenFrequency] of frequencyTable) {
                const tokenProbability = Math.log(category.getTokenProbability(token));

                tokensProbability[token] = tokenProbability;
                categoryProbability += tokenFrequency * tokenProbability;
            }

            classification.categories.push({
                name: category.name,
                category,
                probability: categoryProbability,
                tokensProbability
            });
        }

        classification.categories = classification.categories.sort((a, b) => b.probability - a.probability);

        return classification;
    }

    public resolveCategory(name: string): Category {
        let category = this.categories.get(name);
        if (category) return category;

        category = new Category({ name, classifier: this });

        this.categories.set(name, category);
        return category;
    }

    public getTokensFrequency(tokens: string[]): Collection<string, number> {
        const frequencyTable: Collection<string, number> = new Collection();

        for (const token of tokens) {
            frequencyTable.set(token, (frequencyTable.get(token) ?? 0) + 1);
        }

        return frequencyTable;
    }

    public toJSON(): NaiveBayesClassifierData {
        return {
            vocabulary: this.vocabulary,
            categories: this.categories.map(c => c.toJSON())
        };
    }
}