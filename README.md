# Modular Notes
This project is an attempt to build a notes taking application with two main properties:
1. Whole application is separated into highly independent modules
2. It utilizes simple system for operating data built on idea how to store pieces of data and connections between them.

# Modules of an Application
Frontend we call App, backend is Backend.

## Top level - ServerAPI
ServerAPI separates App from Backend, App must have config for server so that it would be easy to switch to any other available server and App continues to run. Later we'll think about migration tool, it should be quite easy since all servers will have same api.
```mermaid
sequenceDiagram
    User->>App: some action
    App->>Backend: ServerAPI REST request
    Backend->>App: JSON response
    App->>User: draws something
```

## App level - ModelAPI and CoreAPI
What does any App do is it provides User with some **model** of his data. It takes user's data and keeps in some structure.
This structure may be built on some low level system and that is what **core** is - basic access system for data.
And finally User is provided with interface - **ui**.
So App consists of several modules:
```mermaid
sequenceDiagram
    User->>App.ui: some action
    App.ui-->>App.model: ModelAPI
    App.model-->>App.core: CoreAPI
    App.core->>Backend: ServerAPI REST request
    Backend->>App.core: JSON response
    App.core-->>App.model: s
    App.model-->>App.ui: s
    App.ui->>User: draws something
```

## Backend level
Backend.server - public server - provides authorization, authentication, balancing, caching, and different interfaces: http, https, web socket (+additional functionality?)
Backend.storage - protected server (local?) - provides only access to data
Two http servers seems the easiest way to completely separate these two modules.
```mermaid
sequenceDiagram
    App->>Backend.server: ServerAPI REST request
    Backend.server->>Backend.storage: StorageAPI REST request
    Backend.storage->>Backend.server: pure HTTP response
    Backend.server->>App: JSON response
```

## Profit
We can choose and develop quite independently any part of chain **ui.model.core.server.storage** in application we'd like to make better.
We can build different applications changing only **ui + model**.
We can play with any application setting up locally any **server + storage** we like.
We can have different servers for different applications or run all of them on one server or we can have different servers for one application and sync data between them.

# Basic idea
In result CoreAPI must provide enough tools for building all features, but remain small and clear - this is crucial.
1. There are several basic objects: *Node*, *Relation*, *Access*
2. There is StorageAPI accessing it

## Objects
### Node
Every data is a *Node*, field **class** tells what.
User is a *Node*, all it creates is a *Node*.
TODO what if all is encrypted?
TODO do something with flags
In case of encryption **title**, **content**, **meta** and all **relations** are
* int **id** - unique serial integer being assigned to *Node* on create
* int **author** - id of User who created this *Node*
* string **class** - one word
* string **title** - text
* string **ctype** - MIME content type?
* binary **content** - anything
* int **flags** - some bits?
* string **meta** - json string
* Relation[] **relations**

### Relation
*Relation* is a connection to other *Node* and contained in a *Node*.
*Node* cannot relate to itself.
To build a *Relation* one needs access to both *Nodes*.
*Node* can have multiple *Relations* - different kinds of objects: tags, images, etc.
*Relation* used in a *Node* can have a **local_title** covering title of related *Node*, for example we have a *Node* of class='note' with text: 'It was amazing show when _Bobby jumped from the balcony to a snow hill_ below.', we could hide a picture of Bobby jumping from the balcony under those words, and that _italic_ text could be a reference, while in another note we could reference to the same picture with some other text.
*Relation* used in a *Node* may have a **local_value**, a number if the *Relation* has idea of it, for example for text 'Seen Lamborghini in a street, think it costs about 300 000 $' we could save relation 'price' with value '300000'.
* string **class** - related Node class
* int **id** - related Node id
* string **local_title** - local synonym for related Node that can be used in this Node
* number **local_value** - local value for relations that carry a number, for example: weight

### Access
*Access* is an object containing access rights from one *Node* to another *Node*
* int **idA** - object that has access
* int **idB** - object that is accessed
* int **rights** - bits `<create access from><create access to><delete><write><relate><read>`

#### Direct
*Node* can have *Access* to other *Node*, that's direct access.
```mermaid
    sequenceDiagram
    Node_A->>Node_C: *Access* with rights R
    Node_A->>Node_C: access with rights R
```
#### Indirect
There is also indirect access, when *Node_A* relates to *Node_B* and *Node_B* has direct access to *Node_C* then *Node_A* has access to *Node_C*, same as *Node_B*.
```mermaid
    sequenceDiagram
    Node_A-->>Node_B: Relation
    Node_B->>Node_C: *Access* with rights R
    Node_A->>Node_C: access with same rights R
```
So if *Node* allows to relate to it, it gives access to all *Nodes* accessible for it.

#### Composition of indirect Accesses
If *Node_A* has no direct access and has multiple indirect accesses to *Node_C*, then indirect rights are summarized.
```mermaid
    sequenceDiagram
    Node_A->>Node_C: *Access* with rights X
    Node_A->>Node_C: *Access* with rights Y
    Node_A->>Node_C: *Access* with rights Z
    Node_A->>Node_C: access with rights X + Y + Z
```

#### Composition of direct and indirect Accesses
If *Node_A* has direct access to *Node_C*, then only direct rights are applied.
```mermaid
    sequenceDiagram
    Node_A-->>Node_B: Relation
    Node_B->>Node_C: *Access* with rights X
    Node_A->>Node_C: *Access* with rights Y
    Node_A->>Node_C: access with rights Y even if X is more powerful
```

#### Change Access
To change *Access* between *Node_A* and *Node_B* User needs rights 'create access from' *Node_A* and 'create access to' *Node_B*.

## StorageAPI
It is REST API for protected internal server providing access to storage without any security checks, only access model is applied.

### Get Nodes
to get one

    GET /nodes/<**id**>?user=<**user**>&responseFields=<**responseFields**>

to get multiple or search with paging

    GET /nodes?user=<**user**>
    &<id or idIn>=<**idIn**>&idOut=<**idOut**>&idMin=<**idMin**>&idMax=<**idMax**>
    &classIn=<**classIn**>&classOut=<**classOut**>
    &titleRegexp=<**titleRegexp**>
    &relationsIn=<**relationsIn**>&relationsOut=<**relationsOut**>
    &responseFields=<**responseFields**>
    &sort=<**sort**>&<cursor=<**cursor**>&skip=<**offset**>&limit=<**limit**>

Parameters:
* int **user**
* string **id or idIn** - comma separated *Node* ids
* string **idOut** - comma separated *Node* ids
* string **idMin** - minimum *Node* id
* string **idMax** - maximum *Node* id
* string **classIn** - comma separated URI encoded *Node* classes
* string **classOut** - comma separated URI encoded *Node* classes
* string **titleRegexp** - URI encoded regular expression for *Node* title
* string **relationsIn** - comma separated URI encoded `<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...` length is multiple of 4
* string **relationsOut** - comma separated URI encoded `<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...` length is multiple of 4
* string **responseFields** - comma separated URI encoded *Node* field names
* string **sort** - direction of sorting by **id**, 'desc' or 'asc'
* string **cursor** - paging option *nextCursor* or *prevCursor* from previous request
* int **offset** - paging option when no cursor is available or for random access
* int **limit** - paging option when no cursor is available or for random access

Paging options **cursor** and **offset** + **limit** are mutually exclusive.
Returned will be *Nodes* for which User has access 'read'.
If **id or idIn** were in request and user doesn't have access to even one *Node* then request fails with error.

Response body:
* multipart/form-data with fields going through **responseFields** for every found *Node*, in the end **nextCursor** and **prevCursor** fields may be returned for paging
* plain/text error message

Response codes:
* 200 - ok
* 403 - access to node <Node id> denied
* 404 - node <Node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable

Examples:

    GET /nodes/2?user=1

    GET /nodes?user=1&classIn=note,image,video&titleRegexp=%20dog&sort=asc&limit=10

### Edit Node
    POST /nodes/<**id**>?user=<**user**>&operation=<**operation**>

Parameters:
* int **id** - *Node* id, 0 is passed to create
* int **user**
* int **operation** - bits telling what to update `<relations><meta><flags><content><title><delete>`

Request body fields:
* string **class**
* string **title**
* string **ctype**
* string **content**
* int **flags**
* string **meta** - JSON string
* string **relationsAdd** - comma separated numbers and string `<id1>,"<local_title1>",<local_value1>,<id2>, ...` length is multiple of 3
* string **relationsRm** - comma separated numbers `<id1>,<id2>, ...`

Response body:
* plain/text int **id** of *Node*
* plain/text error message

Response codes:
* 200 - ok
* 403 - access to node <Node id> denied
* 404 - node <Node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable


When *Node* is new, full *Access* will be created for User.
To modify *Node* User needs access 'write'.
To modify relations User needs access 'relate'.
*Node* with same **class** + **title** + **ctype** + checksum(**content**) will not be duplicated

Example:

    POST /node/0?user=1&operation=62 body in examples/POST_node.txt

### Get Access
    GET /access?user=<**user**>&from=<**idA**>&to=<**idB**>

Parameters:
* int **user**
* int **idA** - *Node* with access
* int **idB** - resource *Node*

Response body:
* plain/text int **rights** of *Access*
* plain/text error message

Response codes:
* 200 - ok
* 403 - access to <Node id> denied
* 404 - node <node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable

Example:

    GET /access?user=1&from=35&to=39

### Edit Access
    POST /access?user=<**user**>&from=<**idA**>&to=<**idB**>&rights=<**rights**>

Parameters:
* int **user**
* int **idA** - *Node* with access
* int **idB** - resource *Node*
* int **rights** - bits `<create access from><create access to><delete><write><relate><read>`

Response body:
* plain/text ok
* plain/text error message

Response codes:
* 200 - ok
* 403 - access to <Node id> denied
* 404 - node <node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable

User gives *Node A* access to *Node B*, only if User has access 'create access to' to *Node B* and 'create access from' to *Node A*

Example:

    POST /access?user=1&from=35&to=39&rights=5

## Example scenarios
TODO actualize examples
### Adding node with inline tags and a file
1. User
    1. writes title 'Dalmatin'
    2. writes text 'Seen a #dog in a #park today'
    3. loads a picture
    4. presses 'save'
2. App
    1. finds tags in text 'dog' and 'park'
    2. finds tag 'park' that is [parkTagId, 'park']
    ```
    findNodes(user, [], ['tag'], 'park', [], [])
    or
    findNodes(user, [], ['tag'], '^park$', [], [])
    ```
    3. creates tag
    ```
    dogTagId = editNode(
        user,
        null,
        'tag',
        111110,
        'dog',
        <binary dog text>,
        10,
        dogTagMeta,
        [],
        []
    )
    ```
    4. creates image
    ```
    dogImageId = editNode(
        user,
        null,
        'image',
        111110,
        dogImageTitle,
        <binary image content>,
        00,
        dogImageMeta,
        [],
        []
    )
    ```
    5. creates node with relations
    ```
    dogNodeId = editNode(
        user,
        null,
        'note',
        111110,
        'Dalmatin',
        <binary node text>,
        10,
        newNodeMeta,
        ['tag', dogTagId, 'dog', null, 'tag', parkTagId, 'park', null],
        []
    )
    ```

### Renaming a tag
When user renames tag 'dog' to 'dogs' in list of tags record [dogTagId, 'dog'] changes to [dogTagId, 'dogs']. It allows existing inline tags remain same and be used more times in a node where they are already present. In nodes without tag 'dog' user now will be able to use tag 'dogs'.

## Questions
C++ compatible API -
Full text search -
Sharding of data -
Indexing of data -
