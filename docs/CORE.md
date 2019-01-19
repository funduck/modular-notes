# Core
Client application module providing access to Server.  
*Node* is used as described [here](../README.md#node)  
*Access* is used as described [here](../README.md#access)  

# Main API
Every method returns some kind of object with properties:
* error - that can be null
* result - that can also be null

For all methods only *result* is described.

## StartSession
### Parameters
* int **userId**
* string **accessToken**
* string **userId**
* string **password**
* string [serverConfig](#server-config)
### Returns
* string **sessionId**
* int **userId**
* string **accessToken**
### Examples
login to existing account by user/password

    StartSession(null, null, user, password, serverConfig)

login to known account by token

    StartSession(userId, token, null, null, serverConfig)

login to known account without token

    StartSession(userId, null, user, password, serverConfig)


## GetSessions
### Parameters
* int **userId**
### Returns
* string[] **sessions** - `[sessId1, sessId2, ...]`
* string[] **descriptions** - `[sessDescr1, sessDescr2, ...]`

## EndSession
### Parameters
* int **userId**
* string[] **sessions**
### Returns
null

## GetNodes
### Parameters
* int **userId**
* int[] **idIn** - *Node* ids
* int[] **idOut** - *Node* ids
* int **idMin** - minimum *Node* id
* int **idMax** - maximum *Node* id
* string[] **classIn** - *Node* classes
* string[] **classOut** - *Node* classes
* string **titleLike** - string `<engine>:<expression>`, for regex `regex:^cat .*$`, for full text search `fts:cat `. Regex is POSIX
* string **contentLike** - string `<engine>:<expression>`, only if *Node* ctype is 'plain/text'. Regex is POSIX
* string[] **relationsIn** - `[<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...]` length is multiple of 4
* string[] **relationsOut** - `[<class1>,<rel1_id>,<rel1_val_min>,<rel1_val_max>,<class2>, ...]` length is multiple of 4
* string[] **responseFields** - *Node* field names, **id** is always included in response
* string **sort** - direction of sorting by **id**, 'desc' or 'asc'
* int **limit**
* string **cursor** - if next page is needed, this parameter should be passed and all other parameters will be ignored
### Returns
* *Node*[] **nodes**
* string **nextCursor**
* string **prevCursor**
* string[] **ignoredParameters** - some parameters may be ignored by Server, for example **contentLike**

## GetAccess
### Parameters
* int **userId**
* int **idA** - *Node* with access
* int **idB** - resource *Node*
### Returns
* int **rights**

## EditNode
### Parameters
* int **id** - *Node* id, 0 is passed to create
* int **userId**
* int **operation** - bits telling what to update `<relations><meta><flags><content><title><delete>`
* string **class**
* string **title**
* string **ctype**
* string **content**
* int **flags**
* string **meta** - JSON string
* string[] **relationsAdd** - strings `["<id1>","<local_title1>","<local_value1>","<id2>", ...]` length is multiple of 3
* string[] **relationsRm** - numbers `[<id1>,<id2>, ...]`
### Returns

## EditAccess
### Parameters
* int **userId**
* int **idA** - *Node* with access
* int **idB** - resource *Node*
* int **rights** - bits `<create access from><create access to><delete><write><relate><read>`
### Returns
null

# Helpers
## Bit variables methods
Using integer for **operation**, **flags** and **rights** may not be the most comfortable so there are methods for constructing those variables.  
They all share the interface
Parameters
* int **currentValue**
* string **what**
* boolean **status**
Returns
* int
### NodeFlag
    title_encrypted, content_encrypted

Example

    flag = NodeFlag(0, 'title_encrypted', true)
    flag = NodeFlag(flag, 'content_encrypted', true)

### EditNodeOperation
    relations, meta, flags, content, title, delete

Example

    op = EditNodeOperation(0, 'relations', true)
    op = EditNodeOperation(op, 'title', true)

### AccessRights
    create access from, create access to, delete, write, relate, read

Example

    rights = AccessRights(0, 'create access from', true)
    rights = AccessRights(rights, 'create access to', true)

# Server Config
TODO localhost?  
TODO Server on file storage ?  
KeyValuePairs - `host=<> port=<>`
