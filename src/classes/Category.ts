import { Collection } from '@discordjs/collection';
import { NaiveBayesClassifier } from './NaiveBayesClassifier';
import { collectionToRecord } from '../utils/helpers';

export interface CategoryData {
    name: string;
    wordsFrequency: Record<string, number>;
    documentsCount: number;
}

export class Category implements Omit<CategoryData, 'wordsFrequency'> {
    public name: string;
    public wordsFrequency: Collection<string, number>;
    public documentsCount: number;

    readonly classifier: NaiveBayesClassifier;

    get totalWordsFrequency() {
        return this.wordsFrequency.reduce((acc, frequency) => acc + frequency, 0);
    }

    constructor(data: Partial<CategoryData> & { name: string; classifier: NaiveBayesClassifier; }) {
        this.name = data.name;
        this.wordsFrequency = new Collection();
        this.documentsCount = data.documentsCount ?? 0;

        const words = data.wordsFrequency ? Object.keys(data.wordsFrequency) : [];

        for (const word of words) {
            this.wordsFrequency.set(word, data.wordsFrequency![word]);
        }

        this.classifier = data.classifier;
    }

    public async addDocument(document: string|string[]): Promise<this> {
        const tokens = typeof document === 'string' ? await this.classifier.tokenizer(document) : document;

        for (const token of tokens) {
            this.addWord(token);
        }

        this.documentsCount++;

        return this;
    }

    public addWord(word: string): this {
        this.wordsFrequency.set(word, (this.wordsFrequency.get(word) ?? 0) + 1);
        this.classifier.addWordToVocabulary(word);

        return this;
    }

    public getTokenProbability(token: string): number {
        const frequency = this.wordsFrequency.get(token) ?? 0;
        return (frequency + 1) / (this.totalWordsFrequency + this.classifier.vocabulary.length);
    }

    public toJSON(): CategoryData {
        return {
            name: this.name,
            wordsFrequency: collectionToRecord(this.wordsFrequency),
            documentsCount: this.documentsCount
        }
    }
}