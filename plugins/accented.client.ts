export default defineNuxtPlugin(async () => {
  if (!import.meta.dev || !import.meta.client) {
    return;
  }

  const win = window as Window & { __ACCENTED_DISABLE__?: () => void };
  if (win.__ACCENTED_DISABLE__) {
    return;
  }

  const { accented } = await import('accented');
  const disable = accented();
  win.__ACCENTED_DISABLE__ = disable;

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      win.__ACCENTED_DISABLE__?.();
      delete win.__ACCENTED_DISABLE__;
    });
  }
});
