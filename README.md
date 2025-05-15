# Multiforum

Multiforum is an online platform for communities to create forums for sharing discussions and events. Key features:

1. Each forum has two main sections:
  - Discussions: Content can be upvoted so best content rises to top
  - Events: Calendar with upcoming community events
2. Cross-posting capability:
  - Events and discussions can be submitted to multiple forums for increased visibility
3. Location-based event discovery:
  - Map integration shows events across forums
  - Events can be filtered by proximity, time, tags, and forums
4. Responsive design:
  - Works on both desktop and mobile
5. Technology stack:
  - Frontend: Vue/Nuxt.js with Apollo client
  - Backend: Apollo server with Neo4j graph database
  - Authentication: Auth0
  - Maps: Google Maps integration

This is a work in progress that intended to be an open-source, self-hosted platform.

## Video Demo

[![Video demo of Multiforum](./screenshots/video-demo-thumbnail.png)](https://www.loom.com/share/c94dcfcad181448abf6501584e01f9d2?sid=5d53630c-813f-4cfe-bb22-1d7289effc2e)

## Overview

Each forum has two sections, a discussion section and a calendar. In the discussion section, content
can be upvoted so that the best content rises to the top. In the event section, anyone can post
an event that participants in the community may be interested in.

Events can be submitted to multiple forums to increase visibility of them and
help promote them. The same can be done with text-based discussion posts.

To solve the problem where you're bored on the weekend but you don't know what to do in your area, events can be searched across multiple forums based on location, tags and keyword. Screenshots are below.

When the project is finished, I will add documentation so that anyone can deploy their own Multiforum with custom branding.

## Screenshots - Desktop width

The below screenshots capture the state of the project as of January 2025. The layout is responsive with both desktop and mobile views.

### Sitewide event search - filtering by time

Here's how it looks if you filter all in-person events by 'next month':

![All in person events filtered by next month](./screenshots/all-in-person-events-filtered-by-next-month.png)

### Highlighting events on the map

If you mouse over an event list item or map marker, an info window pops up on the map
and the list item is also highlighted. This is supposed to make it easier to draw a connection
between the two:

![Map view hover on list item](./screenshots/map-view-hover-on-list-item.png)

If you click the map marker, more details about the event show up:

![Clicking an item on the map filtered by forums](./screenshots/highlighting-item-on-map-filtered-by-forums.png)

### Filtering the map by forums

If I'm only interested in events from a few specific forums, I filter the 
map by those forums:

![Filtering map by multiple forums](./screenshots/filtering-map-by-multiple-forums2.png)

The resulting event list is now filtered by the two forums I selected - the free events group
and the family-friendly one. All of the concerts are no longer in the list and their map
markers are no longer on the map:

![Highlighting item on map filtered by forums](./screenshots/concerts-removed-from-map.png)

### Clicking forum name in event drawer

If you're looking at events from the map view, and you click on one, the details
will show up in a drawer:

![Clicking an event list item](./screenshots/clicking-an-event-list-item.png)

In that drawer you can see what forums that event was
submitted to. If you click the forum name it will take you to the event page in
the context of that forum:

![Clicking forum name in event drawer](./screenshots/clicking-the-forum-that-the-event-was-submitted-to.png)

Screenshots of event detail pages within a forum are below.

### Multiple events at the same location

Some map markers indicate that there are multiple events at the same location. If
you click that, you can see the list of events that are taking place there at different times:

![Clicking different map marker with multiple events](./screenshots/clicking-different-map-marker-with-multiple-events.png)

Here's a screenshot of how it looks when you click on a location with multiple events. In 
this case, the events are both at the same place, the Phoenix Zoo:

![Clicking map marker with multiple events](./screenshots/clicking-map-marker-with-multiple-events.png)


### Event list within a forum

Each forum can have its own list of upcoming events. In this example, a forum about
rock music in Phoenix is promoting events at multiple venues. Meanwhile, the
forum sidebar shows the handful of events which are coming up the soonest, so that
they are visible even when the Discussions tab is active:

![Phoenix rock event list](./screenshots/phx-rock-event-list.png)

Events can be filtered within a forum. This screenshot shows how it looks when
events in "Phoenix Bird Lovers" are filtered to show only events next weekend:

![Phoenix bird lovers filtered by next weekend](./screenshots/phx-bird-lovers-filtered-by-next-weekend.png)

Here are the events filtered by location. In this case they are filtered to show
events within 10 miles of Tempe:

![Phoenix bird lovers events filtered by location](./screenshots/phx-bird-lovers-events-filtered-by-location.png)


### Discussion list within a forum

A birdwatching forum is an example of a forum that could make use of both in-person events
and online discussions with people who may never attend any events. For example, someone
who takes a picture of an unfamiliar bird in Phoenix might ask the Phoenix birdwatchers what it is.
That's when the Discussions tab within a forum would come in handy:

![Discussion list within a forum](./screenshots/phx-bird-lovers-discussion-list.png)

### Discussion detail

If you click an item in the discussion list, it goes to the discussion detail view, which contains
the comments. In the case of a birdwatching group, maybe there's a comment identifying the bird:

![Phoenix bird lovers discussion detail](./screenshots/phx-bird-lovers-discussion-detail.png)


### Forum without any events

Events are optional for forums. I intend to make it possible for a forum to turn
off the events tab. The Discussions tab is the main landing page, especially for forums
that could be focused on technical questions and answers, which would
have no need for events:

![Forum without any events](./screenshots/forum-without-any-events.png)

### Submitting an event to forums

You can share an event to one or more forums. In a typical use case, you would link to an official
event page with the full details and information about how to buy tickets, if applicable.


Submitting an event to multiple forums is a good way to increase the visibility of the event. This one will now be visible in the context of both of the selected forums:

![Submitting an event to multiple forums](./screenshots/submitting-event-to-multiple-forums.png)

If you add an address, the event will be discoverable from the sitewide event search page (the map view):

![Adding an address for so that the event shows up on the map](./screenshots/adding-an-address-makes-the-event-discoverable-from-sitewide-search.png)


### Recently visited forums

If you click the menu button on the top left of any page, it shows recently visited forums
to support easy context switching.


![Recently visited forums](./screenshots/recently-visited-forums.png)


## Screenshots - Mobile width


### Discussion list views within a forum

Here's the discussion list within a single forum, at mobile width:

![Discussion list view at mobile width](./screenshots/discussion-list-within-channel-at-mobile-width.png)

Here's another example of a discussion list view at mobile width:

![Another discussion list view at mobile width](/screenshots/another-forum-discussion-list-at-mobile-width.png)

### Event list view within a forum

Here's the list of events within a specific forum:

![Forum event list at mobile width](./screenshots/forum-event-list-at-mobile-width.png)

### Event detail page

This screenshot shows how an event detail page looks at mobile width, if you
come to it from within the context of an individual forum:

![Event detail page at mobile width](./screenshots/event-detail-within-forum-at-mobile-width.png)

### Discussion detail page

This screenshot shows how a discussion detail page looks at mobile width, if
you come to it from within the context of an individual forum:

![Discussion detail page at mobile width](./screenshots/discussion-detail-at-mobile-width.png)


### Sitewide event list

Here's the sitewide in-person event list with an active filter,
shown here at mobile width. All the same filtering features work at mobile width
as well. Here, the events are filtered by the birdwatching forum,
so not all of the map markers are displayed.

![Sitewide filtered event list at mobile width](./screenshots/sitewide-filtered-event-list-at-mobile-width.png)


### List of all forums

Here is the list of forums at mobile width:

![Forum list at mobile width](./screenshots/forum-list-at-mobile-width.png)

The list of forums can be filtered by tag:

![The forum list can be filtered by tag](./screenshots/forum-list-filtered-by-tag.png)

The forum list can be filtered by search terms as well:

![Forum list filtered by search terms](./screenshots/forum-list-filtered-by-search-terms.png)


## Technology Stack

On the backend (https://github.com/gennit-project/multiforum-backend), an Apollo server fetches data from the database (a graph database, Neo4j). Some resolvers are auto-generated using the [Neo4j graphql library](https://neo4j.com/docs/graphql/current/), while more complex resolvers are implemented using a combination of the [OGM](https://neo4j.com/docs/graphql/current/ogm/) and custom Cypher queries.

The frontend is a Vue application that makes GraphQL queries to the Apollo server.

## Performance Optimizations

We have implemented several performance optimizations to improve load times, reduce bandwidth usage, and enhance the user experience. See [PERFORMANCE.md](./PERFORMANCE.md) for details on:

- Code splitting and lazy loading
- Text compression and caching
- JavaScript and CSS minification
- Image optimization
- Server response time improvement

## Environment Variables

The application requires several environment variables to be set up. For a comprehensive list of environment variables with detailed descriptions, see the [Environment Variables section in CONTRIBUTING.md](CONTRIBUTING.md#environment-variables).

### Development Setup
1. Create a `.env` file in the root directory
2. Copy the variables from `.env.example` (if available)
3. Fill in your values for each required variable
4. Never commit the `.env` file to version control

### Docker Setup
When using Docker Compose, these variables can be set in the environment or in a `.env` file. The `docker-compose.yml` file includes default values for some variables:
- `NEO4J_AUTH`: defaults to "neo4j/neo4j"
- `NEO4J_PASSWORD`: defaults to "neo4j"
- `NEO4J_USERNAME`: defaults to "neo4j"
- `VITE_SERVER_NAME`: title of the app
- `VITE_BASE_URL`: defaults to "http://localhost:3000"
- `VITE_GRAPHQL_URL`: defaults to "http://localhost:4000"
- `VITE_ENVIRONMENT`: defaults to "development"

## Tests

Integration tests are in the `cypress` directory