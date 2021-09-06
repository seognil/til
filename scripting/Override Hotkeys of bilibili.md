---
date: '2021-09-06 12:08:12'
---

# Override Hotkeys of bilibili

## Demands

Bilibili has a hotkey system which is conflicting with my own video control hotkeys.

So I decide to override it.

## Solution

### getEventListener (failed)

<https://stackoverflow.com/questions/11013943/use-chromes-webkit-inspector-to-remove-an-event-listener>

```js
const events = getEventListeners(window).keydown;

const targetHandlers = events.filter((e) =>
  e.listener
    .toString()
    .slice(0.4)
    .match(/dispatch.apply/),
);

targetHandlers.forEach((bunlde) => {
  const fn = bunlde.listener;
  window.removeEventListener('keydown', fn);
  window.addEventListener('keydown', (e) => {
    const shouldOverride = 'qwerasdf'.includes(e.key);
    if (shouldOverride) return;
    fn(e);
  });
});
```

Unfortunately, `getEventListener` is not a standard API, it works only in the Chrome dev tools console. That means it would fail by any js injection extension.

So I need to find another way.

### jQuery (worked)

Fortunately, Bilibili use jQuery.

Events can be found directly by `$`.

full working script down below.

```js
let retryCount = 0;

const overrideHotkey = () => {
  if (retryCount++ > 10) {
    console.log('hotkey override failed');
    return;
  }

  try {
    const node = $(window);
    const events = $._data(node[0], 'events').keydown;

    events.forEach((bundle) => {
      const fn = bundle.handler;
      node.off('keydown', fn);
      node.on('keydown', (e) => {
        const shouldOverride = 'qwerasdf'.includes(e.key);
        if (shouldOverride) return;
        fn(e);
      });
    });
  } catch (error) {
    setTimeout(() => {
      overrideHotkey();
    }, 1000);
  }
};

overrideHotkey();
```
