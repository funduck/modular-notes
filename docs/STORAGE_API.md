# StorageAPI
It is REST API for protected internal server providing access to storage without any security checks, only access model is applied.

## Get Nodes
### Request
to get one

    GET /nodes/<**id**>?user=<**user**>&responseFields=<**responseFields**>

to get multiple or search with paging

    GET /nodes?user=<**user**>
    &<id or idIn>=<**idIn**>&idOut=<**idOut**>&idMin=<**idMin**>&idMax=<**idMax**>
    &classIn=<**classIn**>&classOut=<**classOut**>
    &titleRegexp=<**titleRegexp**>
    &contentRegexp=<**contentRegexp**>
    &relationsIn=<**relationsIn**>&relationsOut=<**relationsOut**>
    &responseFields=<**responseFields**>
    &sort=<**sort**>&<cursor=<**cursor**>&skip=<**offset**>&limit=<**limit**>

Returned will be *Nodes* for which User has access 'read'.
If **id or idIn** were in request and user doesn't have access to even one *Node* then request fails with error.

#### Parameters
* int **user**
* string **id or idIn** - comma separated *Node* ids
* string **idOut** - comma separated *Node* ids
* string **idMin** - minimum *Node* id
* string **idMax** - maximum *Node* id
* string **classIn** - comma separated URI encoded *Node* classes
* string **classOut** - comma separated URI encoded *Node* classes
* string **titleRegexp** - URI encoded regular expression for *Node* title
* string **contentRegexp** - URI encoded regular expression for *Node* content, only if *Node* ctype is 'plain/text'
* string **relationsIn** - comma separated URI encoded `<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...` length is multiple of 4
* string **relationsOut** - comma separated URI encoded `<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...` length is multiple of 4
* string **responseFields** - comma separated URI encoded *Node* field names
* string **sort** - direction of sorting by **id**, 'desc' or 'asc'
* string **cursor** - paging option *nextCursor* or *prevCursor* from previous request
* int **offset** - paging option when no cursor is available or for random access
* int **limit** - paging option when no cursor is available or for random access

Paging options **cursor** and **offset** + **limit** are mutually exclusive.
TODO Regular expression standard must be defined precisely.

### Response
Body:
* multipart/form-data with fields going through **responseFields** for every found *Node*, in the end **nextCursor** and **prevCursor** fields may be returned for paging
* plain/text error message

Codes:
* 200 - ok
* 403 - access to node <Node id> denied
* 404 - node <Node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable

### Examples
Request

    GET /nodes/2?user=1

    GET /nodes?user=1&classIn=note,image,video&titleRegexp=%20dog&sort=asc&limit=10

Response body:

    --aBoundaryString
    Content-Disposition: form-data; name="id"
    Content-Type: text/plain

    2
    --aBoundaryString
    Content-Disposition: form-data; name="class"
    Content-Type: text/plain

    image
    --aBoundaryString
    Content-Disposition: form-data; name="title"
    Content-Type: text/plain

    i saw dalmatian
    --aBoundaryString
    Content-Disposition: form-data; name="ctype"
    Content-Type: text/plain

    image/jpeg
    --aBoundaryString
    Content-Disposition: form-data; name="content"
    Content-Type: application/octet-stream

    <raw binary image content>
    --aBoundaryString
    Content-Disposition: form-data; name="flags"
    Content-Type: text/plain

    42
    --aBoundaryString
    Content-Disposition: form-data; name="meta"
    Content-Type: text/plain

    {"date": "09-01-2019"}
    --aBoundaryString
    Content-Disposition: form-data; name="relations"
    Content-Type: text/plain

    4,"dalmatian",1
    --aBoundaryString
    Content-Disposition: form-data; name="id"
    Content-Type: text/plain

    5
    --aBoundaryString
    Content-Disposition: form-data; name="class"
    Content-Type: text/plain

    image
    --aBoundaryString
    Content-Disposition: form-data; name="title"
    Content-Type: text/plain

    i saw another dog
    --aBoundaryString
    Content-Disposition: form-data; name="ctype"
    Content-Type: text/plain

    image/jpeg
    --aBoundaryString
    Content-Disposition: form-data; name="content"
    Content-Type: application/octet-stream

    <raw binary another image content>
    --aBoundaryString
    Content-Disposition: form-data; name="flags"
    Content-Type: text/plain

    42
    --aBoundaryString
    Content-Disposition: form-data; name="meta"
    Content-Type: text/plain

    {"date": "10-01-2019"}
    --aBoundaryString
    Content-Disposition: form-data; name="relations"
    Content-Type: text/plain

    4,"another",1,3,"mammal",1
    --aBoundaryString
    Content-Disposition: form-data; name="nextCursor"
    Content-Type: application/x-www-form-urlencoded

    idMin=4&classIn=note,image,video&titleRegexp=%20dog&sort=asc&limit=10
    --aBoundaryString--


## Edit Node
### Request
    POST /node/<**id**>?user=<**user**>&operation=<**operation**>

When *Node* is new, full *Access* will be created for User.
To modify *Node* User needs access 'write'.
To modify relations User needs access 'relate'.
*Node* with same **class** + **title** + **ctype** + checksum(**content**) will not be duplicated

#### Parameters
* int **id** - *Node* id, 0 is passed to create
* int **user**
* int **operation** - bits telling what to update `<relations><meta><flags><content><title><delete>`

#### Body
Request body is 'multipart/form-data', so fields:
* string **class**
* string **title**
* string **ctype**
* string **content**
* int **flags**
* string **meta** - JSON string
* string **relationsAdd** - comma separated numbers and string `<id1>,"<local_title1>",<local_value1>,<id2>, ...` length is multiple of 3
* string **relationsRm** - comma separated numbers `<id1>,<id2>, ...`

### Response
Body:
* plain/text int **id** of *Node*
* plain/text error message

Codes:
* 200 - ok
* 403 - access to node <Node id> denied
* 404 - node <Node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable

### Examples
Request

    POST /node/0?user=1&operation=62
    Content-Type: multipart/form-data; boundary=aBoundaryString

Request body

    --aBoundaryString
    Content-Disposition: form-data; name="class"
    Content-Type: text/plain

    note
    --aBoundaryString
    Content-Disposition: form-data; name="title"
    Content-Type: text/plain

    i saw dalmatian
    --aBoundaryString
    Content-Disposition: form-data; name="ctype"
    Content-Type: text/plain

    image/jpeg
    --aBoundaryString
    Content-Disposition: form-data; name="content"
    Content-Type: application/octet-stream

    <raw binary image content>
    --aBoundaryString
    Content-Disposition: form-data; name="flags"
    Content-Type: text/plain

    42
    --aBoundaryString
    Content-Disposition: form-data; name="meta"
    Content-Type: text/plain

    {"date": "09-01-2019"}
    --aBoundaryString
    Content-Disposition: form-data; name="relationsAdd"
    Content-Type: text/plain

    4,"dalmatian",1
    --aBoundaryString
    Content-Disposition: form-data; name="relationsRm"
    Content-Type: text/plain

    3
    --aBoundaryString--


## Get Access
### Request
    GET /access?user=<**user**>&from=<**idA**>&to=<**idB**>

#### Parameters
* int **user**
* int **idA** - *Node* with access
* int **idB** - resource *Node*

### Response
Body:
* plain/text int **rights** of *Access*
* plain/text error message

Codes:
* 200 - ok
* 403 - access to <Node id> denied
* 404 - node <node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable

### Examples
Request

    GET /access?user=1&from=35&to=39

## Edit Access
### Request
    POST /access?user=<**user**>&from=<**idA**>&to=<**idB**>&rights=<**rights**>

User gives *Node A* access to *Node B*, only if User has access 'create access to' to *Node B* and 'create access from' to *Node A*

#### Parameters
* int **user**
* int **idA** - *Node* with access
* int **idB** - resource *Node*
* int **rights** - bits `<create access from><create access to><delete><write><relate><read>`

### Response
Body:
* plain/text ok
* plain/text error message

Codes:
* 200 - ok
* 403 - access to <Node id> denied
* 404 - node <node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable

### Examples
Request

    POST /access?user=1&from=35&to=39&rights=5
