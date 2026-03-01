# Feature Updates

## September 2025: Downloads and Custom Filters per Forum

These features are still in progress, but this update captures current work on forum-scoped downloads and filters.

The platform vision is to combine:
- Downloadable files in niche subject areas (for example ebooks or game mods)
- A nearby wiki where beginners can learn how to make similar creations

This requires stronger navigation, organization, and security around shared files. One major piece is forum-specific filters for downloads.

In this `sims4_builds` example forum, users can filter downloads by lot type and lot size.

![download_list_with_filters_in_side_bar.png](../screenshots/download_list_with_filters_in_side_bar.png)

Applying the `Residential` filter updates results in place.

![one_active_filter.png](../screenshots/one_active_filter.png)

Applying two filters narrows results further (for example `Residential` + `20x20`).

![two_active_filters.png](../screenshots/two_active_filters.png)

These filters correspond to labels shown on each download detail page.

![labels_on_detail_page.png](../screenshots/labels_on_detail_page.png)

Filters are configured per forum in settings:

![filter_group_form1.png](../screenshots/filter_group_form1.png)

![filter_group_form2.png](../screenshots/filter_group_form2.png)

At the moment, labels are applied manually via form input. Work is in progress on an admin-enabled, forum-scoped auto-labeler so filtering metadata can be applied automatically.

## August 2025: Map Marker Clustering

The Google Maps Marker Clusterer was added to reduce visual noise when many events are displayed.

Before:

![marker clustering before - way too many markers](../screenshots/marker-clustering-before.png)

After:

![marker clustering after - much fewer markers](../screenshots/marker-clustering-after.png)

## July 2025: Wikis

A wiki feature was added. Forum owners can enable wiki support from forum settings, which shows a Wiki tab.

Single-page wiki example:

![one-page-wiki-example](../screenshots/one-page-wiki-example.png)

Multi-page wiki example:

![multiple-page-wiki-example](../screenshots/wiki-multiple-pages.png)

Editing a wiki page:

![edit wiki example](../screenshots/edit-wiki-example.png)

Fullscreen wiki editing:

![wiki edit fullscreen](../screenshots/wiki-edit-fullscreen.png)

Revision history view:

![wiki revision history](../screenshots/wiki-revision-history.png)

Diff view between revisions:

![wiki revision diff view](../screenshots/wiki-diff-view.png)
