# naive-bayes

```js
import { NaiveBayesClassifier } from '@catplusplus/naive-bayes';

const classifier = new NaiveBayesClassifier();

await classifier.addDocument('Hello, good morning!', 'greetings');
await classifier.addDocument('Hello, good evening!', 'greetings');
await classifier.addDocument('Hello, good day!', 'greetings');

await classifier.addDocument('How are you today?', 'question');
await classifier.addDocument('What are you up to?', 'question');
await classifier.addDocument('What is your name?', 'question');

await classifier.classify('Hi, good afternoon!'); // categories: [greetings, question]
await classifier.classify('Who are you?'); // categories: [question, greetings]
```