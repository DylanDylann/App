# Pagination Philosophy
## What is pagination?
Pagination is the art of loading a large amount of ordered data page-by-page, rather than all at once. It is a specialized form of lazy-loading that's suitable for ordered data that displays in a list.

## Why lazy-load data?
The goal of lazy-loading is to decouple the volume of data a user has access to from the app's performance when they use it. This makes it important to ensure that our largest, high-value customers share the same great app experience as a smaller customer.

It makes sense to lazy-load a resource when the volume of that resource is unbounded, or the upper bound of the resource is too costly to load all at once.

## Pagination v.s. lazy-loading
As stated above, pagination is a specialized subset of lazy-loading for ordered lists of data. The advantage of structured pagination over a more naïve lazy-loading strategy is that it divides data into discrete chunks such that they can be loaded in batches (and that the order of those batches lends itself to a better product experience).

One example of data that's appropriate for pagination is reportActions (chat messages). We can load the 50 most recent messages, then scroll back and send one network request to get the next batch of 50.

One example of data that's appropriate to lazy-load but necessarily ideal for pagination is avatar images. It's too costly to load all avatar images for all users when the app loads, so we only fetch avatar images that a user wants to see on-demand. Another example might be `personalDetails`.

## How to implement pagination
1. Clearly define a deterministic sorting order of the data in question.
2. Define a "cursor" - a unique piece of data that encapsulates all the data you need to pinpoint the location of a single item in the list.
    - Each item in the list _MUST_ be unique. No ties allowed: typically this means your cursor should include an ID.
    - The cursor _MUST_ be serializable so it can be sent in a network request.
    - The cursor _SHOULD_ include only the minimal fields required to define the location of an item in the list.
    - _Example:_ For `reportActions`, we use the `created` timestamp, since `reportActions` are generally sorted by order of creation. A better cursor would have been a composite of:

        ```ts
        type ReportActionCursor = {
            /** The datetime when the reportAction was created, in ms precision. */
            created: string;

            /** The actionName is used as a tie-breaker when multiple reportActions are created in the same millisecond (i.e: CREATED actions always come first). */
            actionName: ReportActionName;

            /** The reportActionID is used as a tie-breaker when multiple reportActions of the same type are created in the same millisecond. */
            reportActionID: string;
        }
        ```

    - _Example:_ For a single search snapshot, an integer `sequenceNumber` is used. This is a simple implementation, but generally is not a scalable solution, because it requires that all the data you're paging over needs to be sorted before you can access it by an integer offset and limit.

3. Using your cursor as inputs, define a database query to _quickly_ access a limited number (a single page) of the resource in question. Test it for the highest volume of data you can find (i.e: the report with the most actions, the account with access to the most reports, etc...). If you do this well, you should find that the query execution time is unaffected by the total search volume (the total length of the "list" that you're paging over).
    - A good starting point for this is to write your query using a [row value comparison](https://www.sqlite.org/rowvalue.html). Then, if necessary, consider creating a sorted `COVERING` index for the row value you're searching over. For example:

        ```sql
        CREATE TABLE messages (
            id       INTEGER PRIMARY KEY,     -- unique message ID
            created  DATETIME NOT NULL,       -- message creation timestamp
            message  TEXT NOT NULL
        );

        -- Create a sorted covering index for the cursor (sorting by created, tie-breaking with IDs)
        CREATE INDEX idx_chatMessages_created_id
            ON chatMessages (created, id);

        -- Query a single page using your cursor as the "OFFSET"
        SELECT *
        FROM chatMessages
        WHERE (created, id) < ('2025-09-01 10:02:00', 3)
        ORDER BY created DESC, id DESC
        LIMIT 50;
        ```

4. Determine whether your use-case calls for **unidirectional** or **bidirectional** pagination. Generally, **bidirectional** pagination will be useful if:

    - The list live-updates and the user can "jump" to an arbitrary point in the list without loading all the data between the start of the list and that point.
    - The list doesn't live-update (i.e: if a user scrolls back in the list, and while they're looking at older items, they're not receiving newer items as they come in).

    If you need bidiectional pagination, you'll need to ensure that you craft queries and API endpoints to fetch data from a given cursor in both directions. In the example query above, it could be as simple as switching `<` to `>=`

> [!NOTE]
> At the time of writing, [RecyclerListView](https://github.com/Flipkart/recyclerlistview) and [FlashList](https://github.com/Shopify/flash-list) _do not_ support bidirectional pagination.
> React Native's built-in [FlatList](https://reactnative.dev/docs/flatlist) and [legend-list](https://github.com/LegendApp/legend-list) are some examples that _do_ support bidirectional pagination via the `onStartReached` prop.

5. Determine whether it's possible for **gaps** to appear in your data. It's non-trivial to list all the ways gaps can appear in a list, but here are couple examples, one real and one contrived:
    - "Comment linking"
        1. User has a simple paginated list of integers in ascending order, and it currently contains items 1-50.
        2. User jumps to the middle of the list (say for simplicity that they are looking at items 15-35)
        3. While they're looking at the middle of the list, more than 1 page (50 items) of data is added to the front of the list. Let's say these items are items 50-150.
        4. They jump back to the front of the page, and fetch the page at the front, 100-150.
            - _Note:_ Fetching "all the data they missed" generally isn't a scalable solution, because it's unbounded, and the unbounded loading of data is the problem pagination seeks to solve.
        5. Now there is a gap between items 50-100 :boom:
    - "Over-eager eviction"
        1. A user scrolls far back in the list. So far, that we decide there's too much data for us to handle all at once. Performance degrades, and we decide to start evicting the data at the front that's less-recently viewed. Let's say that the user now has items 50-100 loaded, and we've evicted items 100-200
        2. New data appears at the front of the list, say items 200-250. We add these items to the list as we normally would if they're looking at the front of the list.
        3. Now there is a gap between items 100-200 (the data we evicted) :boom:

    If it turns out you _do_ need a strategy for gap detection, here's a high-level summary of how you'd handle it:

    1. Start keeping track of the pages you've loaded in a `*pages_` Onyx key. This is a _sorted_ list of data.
    2. Post-process network requests in the [Pagination Middleware](https://github.com/Expensify/App/blob/1a06fa4add10b53a1a9266927d3b08a4ca35d3c4/src/libs/Middleware/Pagination.ts) to keep track of the start and end point of the page you loaded in a request, and [merge it to existing pages if it overlaps](https://github.com/Expensify/App/blob/1a06fa4add10b53a1a9266927d3b08a4ca35d3c4/src/libs/PaginationUtils.ts#L104).
    3. When rendering your list, use the `pages*` key for your sorting order, and insert "gap markers" between the edges of the pages you've loaded.
    4. When rendering your list, [only render a single continuous chunk](https://github.com/Expensify/App/blob/1a06fa4add10b53a1a9266927d3b08a4ca35d3c4/src/libs/PaginationUtils.ts#L166) containing your current "anchor point" (the reportAction you linked to, for example), up until you reach the end of the list in either direction or a gap marker.
    5. Then when you scroll, you'll hit your gap marker and can make network requests to fill in the gap.

    More details can be found in [the Pagination middleware](https://github.com/Expensify/App/blob/1a06fa4add10b53a1a9266927d3b08a4ca35d3c4/src/libs/Middleware/Pagination.ts). Efforts were made to generalize this code, but so far it has only been used for reportActions.

6. TODO: Describe (aspirational) two-layer pagination (RAM -> Disk -> Server)
7. TODO: Describe (aspirational) data pre-loading
