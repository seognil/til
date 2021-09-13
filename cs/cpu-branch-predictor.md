---
date: '2021-09-13 14:19:10'
---

# CPU Branch Predictor And Array Loop

- [浅谈 CPU 分支预测技术](http://matt33.com/2020/04/16/cpu-branch-predictor/)
- [提前 if 判断帮助 CPU 分支预测](https://dubbo.apache.org/zh/blog/2019/02/03/%E6%8F%90%E5%89%8Dif%E5%88%A4%E6%96%AD%E5%B8%AE%E5%8A%A9cpu%E5%88%86%E6%94%AF%E9%A2%84%E6%B5%8B/)

---

## JS Benchmark

(on my laptop)

### TLDR

- `for loop`: sorted array is 4 times faster than unsorted array
- But don't do sort manually for that reason, because sorting is much much slower than branch prediction fail (`f31`, `f34`)
- `for loop` vs `reduce`: `for loop` wins the performance, but I'd still use `reduce` for readability unless hit the bottleneck.

```
┌─────────┬─────────┬─────────┬────────────────────────────────────────────────────────────────┐
│ (index) │  last   │  mean   │                               fn                               │
├─────────┼─────────┼─────────┼────────────────────────────────────────────────────────────────┤
│  f_s_f  │ '9,871' │ '9,871' │ '() => { const target = sorted; let sum = 0; for (let i = 0; ' │
│ f_un_f  │ '2,466' │ '2,466' │ '() => { const target = arr; let sum = 0; for (let i = 0; i <' │
│  f_s_r  │  '912'  │  '912'  │ '() => { const target = sorted; target.reduce((a, e) => (e > ' │
│ f_un_r  │  '647'  │  '647'  │ '() => { const target = arr; target.reduce((a, e) => (e > 0.5' │
│ f_man_f │   '6'   │   '6'   │ '() => { const target = [...arr].sort(); let sum = 0; for (le' │
│ f_man_r │   '5'   │   '5'   │ '() => { const target = [...arr].sort(); target.reduce((a, e)' │
└─────────┴─────────┴─────────┴────────────────────────────────────────────────────────────────┘
```

### Interesting Result:

unsorted `reduce` method caught up after 10 iterations. Thanks to the V8.

```
┌─────────┬─────────┬─────────┬────────────────────────────────────────────────────────────────┐
│ (index) │  last   │  mean   │                               fn                               │
├─────────┼─────────┼─────────┼────────────────────────────────────────────────────────────────┤
│ f_un_r  │ '8,849' │ '2,338' │ '() => { const target = arr; target.reduce((a, e) => (e > 0.5' │
│  f_s_f  │ '8,764' │ '9,017' │ '() => { const target = sorted; let sum = 0; for (let i = 0; ' │
│ f_un_f  │ '2,201' │ '2,265' │ '() => { const target = arr; let sum = 0; for (let i = 0; i <' │
│  f_s_r  │  '780'  │  '776'  │ '() => { const target = sorted; target.reduce((a, e) => (e > ' │
│ f_man_r │   '5'   │   '5'   │ '() => { const target = [...arr].sort(); target.reduce((a, e)' │
│ f_man_f │   '4'   │   '5'   │ '() => { const target = [...arr].sort(); let sum = 0; for (le' │
└─────────┴─────────┴─────────┴────────────────────────────────────────────────────────────────┘
```

sorted `reduce` method caught up after 20 iterations.

```
┌─────────┬─────────┬─────────┬────────────────────────────────────────────────────────────────┐
│ (index) │  last   │  mean   │                               fn                               │
├─────────┼─────────┼─────────┼────────────────────────────────────────────────────────────────┤
│ f_un_r  │ '9,745' │ '9,433' │ '() => { const target = arr; target.reduce((a, e) => (e > 0.5' │
│  f_s_f  │ '9,658' │ '9,379' │ '() => { const target = sorted; let sum = 0; for (let i = 0; ' │
│  f_s_r  │ '9,526' │ '5,819' │ '() => { const target = sorted; target.reduce((a, e) => (e > ' │
│ f_un_f  │ '2,475' │ '2,227' │ '() => { const target = arr; let sum = 0; for (let i = 0; i <' │
│ f_man_r │   '6'   │   '6'   │ '() => { const target = [...arr].sort(); target.reduce((a, e)' │
│ f_man_f │   '5'   │   '5'   │ '() => { const target = [...arr].sort(); let sum = 0; for (le' │
└─────────┴─────────┴─────────┴────────────────────────────────────────────────────────────────┘
```

---

Functions that benched.

```ts
const genArray = (length: number) => Array.from({ length }, () => Math.random());

const arr = genArray(100000);
const sorted = [...arr].sort();

bench({
  f_un_f: () => {
    const target = arr;
    let sum = 0;
    for (let i = 0; i < target.length; i++) {
      const e = target[i]!;
      sum += e > 0.5 ? e : 0;
    }
  },
  f_un_r: () => {
    const target = arr;
    target.reduce((a, e) => (e > 0.5 ? a + e : a), 0);
  },
  f_s_f: () => {
    const target = sorted;
    let sum = 0;
    for (let i = 0; i < target.length; i++) {
      const e = target[i]!;
      sum += e > 0.5 ? e : 0;
    }
  },
  f_s_r: () => {
    const target = sorted;
    target.reduce((a, e) => (e > 0.5 ? a + e : a), 0);
  },
  f_man_f: () => {
    const target = [...arr].sort();
    let sum = 0;
    for (let i = 0; i < target.length; i++) {
      const e = target[i]!;
      sum += e > 0.5 ? e : 0;
    }
  },
  f_man_r: () => {
    const target = [...arr].sort();
    target.reduce((a, e) => (e > 0.5 ? a + e : a), 0);
  },
});
```

---

I write a simple benchmark runner

```ts
// * ================================================================================ bench

export const bench = (testFns: Function | Record<string, Function>, loopCount = Infinity) => {
  console.log(`prepare...`);

  // * Do a empty loop first, warm up
  getCountOfSec(() => {});

  console.log(`starting... test ${loopCount} times`);

  const fnRecord = typeof testFns == 'function' ? { fn: testFns } : testFns;

  const countResults: Record<string, number[]> = {};

  // * ----------------

  const printResult = () => {
    const sortedResultList = Object.entries(countResults)
      .map<[string, number, number]>(([name, counts]) => [
        name,
        lastNAverage(counts),
        counts[counts.length - 1]!,
      ])
      .sort(([n1, a1, l1], [n2, a2, l2]) => l2 - l1)
      .map(([name, average, last]) => {
        return {
          label: name,
          fn: '' + fnRecord[name]!.toString().replace(/\s+/gm, ' ').slice(0, 60),
          last: toThousands(last),
          mean: toThousands(average),
        };
      });

    const printTable = Object.fromEntries(sortedResultList.map((e) => [e.label, e]));

    console.table(printTable, ['last', 'mean', 'fn']);
  };

  // * ----------------

  {
    const fns = Object.entries(fnRecord);
    let i = 1;
    while (i <= loopCount) {
      shuffle(fns);

      console.log(`${i}/${loopCount} ---------------- start`);

      fns.forEach(([name, fn]) => {
        if (!countResults[name]) countResults[name] = [];
        const result = getCountOfSec(fn);
        console.log(`${name} ${result} ${fn.toString().replace(/\s+/gm, ' ')} `);

        countResults[name]!.push(result);
      });

      printResult();

      console.log(`${i}/${loopCount} ---------------- end\n`);

      i++;
    }
  }
};

// * ================================================================================ test helper

const getCountOfSec = (fn: Function): number => {
  const secLoopCount = getCountOfSecFast(fn);
  const secLoopTime = getTimeOfCount(fn, secLoopCount);

  return Math.round((secLoopCount / secLoopTime) * 1000);
};

const getCountOfSecFast = (fn: Function): number => {
  let loopCount = 1;
  let lastLoopTime = getTimeOfCount(fn, loopCount);

  while (lastLoopTime < 100) {
    loopCount *= 10;
    lastLoopTime = getTimeOfCount(fn, loopCount);
  }

  return Math.round((loopCount / lastLoopTime) * 1000);
};

const getTimeOfCount = (fn: Function, loopCount: number): number => {
  const time = performance.now();
  while (loopCount-- > 0) fn();
  return performance.now() - time;
};

// * ================================================================================ utils

const toThousands = (num: number) => num.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');

// * ----------------

const shuffle = <T>(array: T[]): void => {
  let p2 = array.length - 1;

  while (p2) {
    const p1 = Math.floor(Math.random() * p2);

    const e = array[p2]!;
    array[p2] = array[p1]!;
    array[p1] = e;

    p2--;
  }
};

// * ----------------

const lastNAverage = (array: number[], n = 5): number => {
  const mirror = [...array].slice(-n);

  return Math.round(mirror.reduce((a, e) => a + e, 0) / mirror.length);
};
```
