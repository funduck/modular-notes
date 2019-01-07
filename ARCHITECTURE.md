# Modular structure
UI app -> Nodes.main:User_API -> Nodes.storage:Storage_API

# User API
There are several basic objects: *Node*, *Relation*, *Access*
This API should provide enough tools for building all features, but remain small and clear - this is crucial.

## Objects
### Node
Every data is a *Node*, field **type** tells what.
* string **id**
* string **author**
* string **type**
* string **title**
* binary **content**
* int **flags** - bits <is content=binary utf8><is all data encrypted> TODO what if all is encrypted?
* string **meta** - json string
* Relation[] **relations**
In case of encryption **title**, **content**, **meta** and all **relations** are encrypted  

### Relation
*Relation* is contained in a *Node*.
*Node* has multiple *Relations* - different kind of objects: tags, images, other nodes, etc.
It is a reference from one *Node* to another *Node* or presence of related Node in some way.
*Relation* used in a *Node* may have a **loc_title**, so it would be possible to hide content behind it, for example text 'It was amazing show when _Bobby jumped from the balcony to a snow hill_ below.' could hide picture of Bobby jumping from the balcony under those words, and that _italic_ text could be a ref, while in another node we could reference to the same picture with some other text.
*Relation* used in a *Node* may have a **loc_value**, so it would allow better search, for example for text 'Seen Lamborghini in a street, think it costs about 300 000 $' we could save relation 'price' with value '300000'.
To build a *Relation* access to both *Nodes* is required.
*Node* cannot relate to itself.
* string **type** - related Node.type
* string **id** - related Node.id
* string **loc_title** - local synonym for related Node that can be used in this Node
* string **loc_value** - local value for relations that carry a number, for example: weight

### Access
*Access* is contained in a *Node* for all *Nodes* that have access to it.
* string **id** - object that has access
* string **rights** - bits <create access from><create access to><delete><write><relate><read>
*Node_A* has access to *Node_B* if there is *Access* in *Node_B* for *Node_A*.
Also *Node_A* has access to *Node_C* if *Node_A* relates to *Node_B* and *Node_B* has access to *Node_C*. Only one transition of access is supported for simplicity. And direct *Access* covers all indirect accesses, but if there is no direct access, then sum is calculated.  
For example: these *Nodes* could be 'user', 'chat room' and 'chat messages', 'user' is in 'chat room' can be represented as 'user' has a *Relation* to 'chat room', and 'chat room' has access to all messages in it, so user has access to messages in chat. One may continue building roles for access: user relates to role and role provides access of special kind to resources.

## Methods

### Find Nodes
TODO throws ErrCode
TODO paging
string[] findNodes (**userId**, **types**, **titleRegexp**, **relationsFilterIn**, **relationsFilterOut**)
returns [<id1>, <author1>, <type1>, <title1>, <id2>, ...] length = 4*N
Returned will be *Nodes* for which user has access 'read'.
* string **userId**
* string[] **types** - [] means 'all'
* string **titleRegexp**
* string[] **relationsFilterIn** - [] means 'all'. [<type1>, <f1_id>, <f1_val_min>, <f1_val_max>, <f2>, ..., <type2>, ...] length = 4*N
* string[] **relationsFilterOut** - [] means 'none'. [<type1>, <f1_id>, <f1_val_min>, <f1_val_max>, <f2>, ..., <type2>, ...] length = 4*N

### Get Nodes
*Node*[] getNodes (**userId**, **ids**)
TODO throws ErrCode
Checks access to *Nodes* and fails if there is no access 'read' for event one *Node*
* string **userId**
* string[] **ids**

### Edit Node
string editNode (**userId**, **nodeId**, **type**, **operation**, **title**, **content**, **flags**, **meta**, **relationsAdd**, **relationsRm**)
TODO throws ErrCode
When *Node* is new, creates full access to new *Node*. User needs access 'relate' to modify relations
* string **userId**
* string **nodeId** - is null only if it is new Node
* string **type**
* int **operation** - bits telling what to update <relations><meta><flags><content><title><delete>
* string **title**
* binary **content**
* int **flags**
* string **meta**
* string[] **relationsAdd** - [<id1>, <loc_title1>, <loc_value1>, <id2>, ...] length = 3*N
* string[] **relationsRm** - [<id1>, <id2>, ...]

### Get Access
int getAccess (**userId**, **idA**, **idB**)
TODO throws ErrCode
returns bits <create access from><create access to><delete><write><read>
* string **userId**
* string **idA** - *Node* with access
* string **idB** - resource *Node*

### Edit Access
editAccess (**userId**, **idA**, **idB**, **rights**)
TODO throws ErrCode
User gives *Node A* access to *Node B*, only if user has access 'create access to' to *Node B* and 'create access from' to *Node A*
* string **userId**
* string **idA** - *Node* with access
* string **idB** - resource *Node*
* string **rights** - bits <create access from><create access to><delete><write><relate><read>

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
    findNodes(userId, [], ['tag'], 'park', [], [])
    or
    findNodes(userId, [], ['tag'], '^park$', [], [])
    ```
    3. creates tag
    ```
    dogTagId = editNode(
        userId,
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
        userId,
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
        userId,
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
