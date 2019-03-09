# Storage
It is protected internal server providing access to storage without any security checks, only access model is applied.  
[Get Nodes](#get-nodes)  
[Edit Node](#edit-node)  
[Get Access](#get-access)  
[Edit Access](#edit-access)  
[Clear](#clear)

# OpenApi
[documentation](../api/storage.yaml)

# HTTP REST API
## Get Nodes
### Request
to get one

    GET /nodes?user=<**user**>&idIn=<**idIn**>&responseFields=<**responseFields**>

to get multiple or search with paging

    GET /nodes?user=<**user**>
    &<idIn>=<**idIn**>&idOut=<**idOut**>&idMin=<**idMin**>&idMax=<**idMax**>
    &classIn=<**classIn**>&classOut=<**classOut**>
    &titleLike=<**titleLike**>
    &contentLike=<**contentLike**>
    &relationsIn=<**relationsIn**>&relationsOut=<**relationsOut**>
    &responseFields=<**responseFields**>
    &sort=<**sort**>&limit=<**limit**>

Returned will be *Nodes* for which User has access 'read'.
If **idIn** were in request and user doesn't have access to even one *Node* then request fails with error.
Why there is `GET /nodes/<**id**>` allowed? Combination of **idIn** & **idOut** is clear and strict, otherwise there would be possible to make ambiguous requests like `GET /nodes/1,2?idIn=1,2,3` - which ids are meant `1,2` or `1,2,3`? Get rid of **idIn**? I think it is better to have couples of parameters like **\<something\>In** & **\<something\>Out**.

#### Parameters
* int **user**
* string **idIn** - comma separated *Node* ids
* string **idOut** - comma separated *Node* ids
* string **idMin** - minimum *Node* id
* string **idMax** - maximum *Node* id
* string **classIn** - comma separated URI encoded *Node* classes
* string **classOut** - comma separated URI encoded *Node* classes
* string **titleLike** - URI encoded string `<engine>:<expression>`, for regex `regex:^cat .*$`, for full text search `fts:cat `  
* string **contentLike** - URI encoded string `<engine>:<expression>`, only if *Node* ctype is 'plain/text'
* string **relationsIn** - comma separated URI encoded `<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...` length is multiple of 4
* string **relationsOut** - comma separated URI encoded `<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...` length is multiple of 4
* string **responseFields** - comma separated URI encoded *Node* field names, **id** is always included in response
* string **sort** - direction of sorting by **id**, 'desc' or 'asc'
* int **limit**

For encrypted *Nodes* options **titleLike** and **contentLike** wont be applied.  
If **titleLike** or **contentLike** use engine not provided by Storage response will contain **ignoredParameters** field with messages.  
If **titleLike** or **contentLike** is not empty encrypted *Nodes* wont be returned.  
Regex is always POSIX.

### Response
Body:
* multipart/form-data with fields going through **responseFields** for every found *Node*, in end adds field **end** to tell if there are more records to read
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

    GET /nodes?user=1&idIn=2

    GET /nodes?user=1&classIn=note,image,video&titleLike=regex%3Adog&contentLike=fts%3Adog&sort=asc&limit=10

Response body:

    --aBoundaryString
    Content-Disposition: form-data; name="ignoredParameters"
    Content-Type: text/plain

    contentLike
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

    tag,4,"dalmatian",1
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

    tag,4,"another",1,tag,3,"mammal",1
    --aBoundaryString
    Content-Disposition: form-data; name="end"
    Content-Type: text/plain

    false
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

## Clear
### Request
    DELETE /nodes

Method is required for tests and should work only in testing environment

### Response
Body:
* plain/text ok
* plain/text error message

Codes:
* 200 - ok
* 403 - forbidden
