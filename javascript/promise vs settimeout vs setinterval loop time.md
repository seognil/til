promise frame internal: <0.1ms
setTimeout/setInterval frame internal: ~4ms

---

Promise:

```js
{
  const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

  console.log('start', now());

  const LOOP_MAX = 20;

  let count = 0;
  let p = Promise.resolve(0);
  const loop = () => {
    if (count >= LOOP_MAX) return;
    p = p.then((e) => {
      console.log(count, e, now());
      count += 1;
      loop();
      return e + 1;
    });
  };
  loop();
}
```

---

setTimeout:

```js
{
  const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

  console.log('start', now());

  const LOOP_MAX = 20;

  let count = 0;
  const loop = () => {
    if (count >= LOOP_MAX) return;
    setTimeout(() => {
      console.log(count, now());
      count += 1;
      loop();
    }, 0);
  };
  loop();
}
```

---

setInverval:

```js
{
  const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();

  console.log('start', now());

  const LOOP_MAX = 20;

  let count = 0;
  const tick = setInterval(() => {
    if (count >= LOOP_MAX) clearInterval(tick);

    console.log(count, now());
    count += 1;
  }, 0);
}
```
