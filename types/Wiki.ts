import type {
  GetWikiPageQuery,
  GetSiteWideWikiListQuery,
} from '@/__generated__/operations';
export type WikiPageSelection = GetWikiPageQuery['wikiPages'][number];
export type WikiRevisionSelection = WikiPageSelection['PastVersions'][number];
export type WikiSearchSelection = NonNullable<
  GetSiteWideWikiListQuery['getSiteWideWikiList']
>['wikiPages'][number];
