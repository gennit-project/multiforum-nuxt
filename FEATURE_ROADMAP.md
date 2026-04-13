# Feature Roadmap

## Remaining Implementation Work

### Super Upvotes

| Task | Type |
|------|------|
| Enable super upvotes - rainbow upvote button appears only after user has already upvoted; tooltip says "super upvote" | Feature |
| Create scratchpad feature - a list of public comments on a user's profile | Feature |
| Thank-you notes stored in scratchpad after super upvote | Feature |
| Allow super upvote after writing on someone's scratchpad. Placeholder: "thanks for your comment in [forumName]" | Feature |
| After super upvote, author sees notification that someone wrote on their scratchpad | Feature |
| Author can choose to make scratchpad post publicly visible on their profile, or ignore it | Feature |

---

### Downloads and Collections

| Task | Type |
|------|------|
| Things you download are listed in your 'library' (auto-saved to special private collection on download) | Feature |
| Download detail page shows count of unique and total downloads | Feature |
| Remove X/Twitter link from "share this download" component | Cleanup |
| Customize attribution in the modal that appears after clicking download | Feature |
| OP or mod with sufficient permissions can permanently delete downloadable file on backend | Feature |
| Uploader can configure download modal to include links to Patreon, Buy Me a Coffee, Ko-fi, or PayPal.me | Feature |
| Can exclude packs when filtering downloads | Feature |
| Can change the order of a collection | Feature |
| Can delete/update/add filter group | Feature |
| Can share a collection to forum as a discussion if visibility is set to public | Feature |
| User profile has up to four pinned posts | Feature |
| Allow images to be in more than one album | Feature |
| Image detail page shows albums containing this image by OP and by others | Feature |

---

### Wiki

| Task | Type |
|------|------|
| Channel sidebar has pinned wiki pages | Feature |
| Channel owners and mods with appropriate permissions see "pin wiki page here" button to attach existing wiki page to channel sidebar | Feature |
| Can also pin a wiki page to channel sidebar as an action menu item on wiki detail page | Feature |
| Can lock a wiki page so only channel owners can edit it | Feature |
| Mod can sticky a comment on a discussion or event, making it appear at the top of comments list | Feature |
| Server admins can add featured wiki pages (via server settings) that show up at /wiki/search | Feature |

---

### Notifications

| Task | Type |
|------|------|
| If you tag a mod (/m) in an issue or discussion comment, they get a notification | Feature |
| Text editor in issue mentions /m and /u; mentions /bot only if it's a discussion and channel has bots configured | Feature |
| Fix broken permalink in notification ("freshManySlimyShoe edited your discussion test post September 28") | Bug |
| Get notified of feedback | Feature |
| Notification page has separate tabs for feedback vs everything else | Feature |
| Can toggle receiving notifications on feedback | Feature |
| Email notification does not reveal feedback content | Privacy |
| Make sure edits are visible from feedback page | Feature |
| Get notified when a support ticket you subscribed to has a moderation action | Feature |
| If content was archived, notification tells user they can reopen and comment on the issue; include support email as fallback | Feature |
| All notifications have one-click unsubscribe links | Feature |
| Notification says whether you are subscribed by default; link to notification settings to unsubscribe from all future, or link to detail page to unsubscribe from this one | Feature |
| Notification about reply to discussion contains "unsubscribe" link that goes to discussion with `?action=unsubscribe` query param | Feature |
| If `?action=unsubscribe` param present and user logged in, show notification saying unsubscribed and update button state | Feature |
| Similar unsubscribe flow for event replies | Feature |
| Similar unsubscribe flow for comment replies | Feature |
| Similar unsubscribe flow for issue notifications | Feature |

---

### Misc

| Task | Type |
|------|------|
| Adding emoji to comment should not update last updated date; need new field `textLastEdited` | Bug |
| In comment section, can search comments by text to find specific comments | Feature |
| Album image and detail page has share button (copy link, crosspost) | Feature |
| Discussion detail page comments have less left side padding at mobile width | UI |
| In comment search results page, each result list item should be a permalink | Feature |
| Well-tested function for making accurate permalink to comment on event, discussion, feedback, issue (both frontend and backend) | Feature |
| Reduce API calls on favorites lists - include whether user has favorited each item in fetch-list API call | Performance |
| Auto-save for server settings and channel admin settings (at least for plugins; should not have two save buttons) | UX |
| Activity feed shows title edit history of an event (similar to discussion detail pages) | Feature |
| Can see description edits of event | Feature |
| Add a way to deprecate a channel - lock for reasons unrelated to sitewide rule violations | Feature |

---

## Verification Guide

This section contains detailed step-by-step instructions for manually verifying completed features. Each item includes prerequisites, test steps, and expected outcomes.

*(Verification steps will be added here as features are completed.)*
