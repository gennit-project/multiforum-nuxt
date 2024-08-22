export function isAlphaNumeric(str: string) {
    // The author of this validator is Michael Martin-Smucker. Source: 
    // https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
    let code, i, len;
  
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
}

export function checkUrl(str: string) {
    // Valid URL checker from Devshed
    // Sources:
    // https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
    // http://forums.devshed.com/javascript-development-115/regexp-to-match-url-pattern-493764.html
    const pattern = new RegExp(
      "^(https?:\\/\\/)" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    const valid = !!pattern.test(str);
    return valid;
  }