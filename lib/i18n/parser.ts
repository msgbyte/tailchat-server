import acceptLanguage from 'accept-language';
acceptLanguage.languages(['en-US', 'zh-CN']);

/**
 * 解析请求头的 Accept-Language
 */
export function parseLanguageFromHead(headerLanguage: string = 'zh-CN') {
  return acceptLanguage.get(headerLanguage);
}
