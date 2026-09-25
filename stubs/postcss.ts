// Client-build replacement for `postcss`, aliased in nuxt.config.ts.
//
// sanitize-html requires postcss only to parse `style` attributes. The markdown
// renderer never allows `style` and sets `parseStyleAttributes: false`, so this
// is unreachable in the browser; stubbing it keeps ~55 KB (minified) of postcss
// out of every page that renders markdown. The server build keeps the real
// package. Throwing makes an accidental future call fail loudly rather than
// silently skip sanitization.
export const parse = (): never => {
  throw new Error(
    'postcss is not bundled for the browser; sanitize-html must run with parseStyleAttributes: false.'
  );
};

export default { parse };
