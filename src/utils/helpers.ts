import { PUNCTUATION_REGEX } from './constants';

export function defaultTokenizer(text: string): string[] {
    return text.replace(PUNCTUATION_REGEX, ' ').split(/\s+/).filter(Boolean);
}

export function collectionToRecord<K extends string|symbol, V>(collection: Map<K, V>): Record<K, V> {
    const record = {} as Record<K, V>;

    for (const [key, value] of collection) {
        record[key] = value;
    }

    return record;
}