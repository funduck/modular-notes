# Modular structure
UI app -> Notes.main:User_API -> Notes.storage:Storage_API

# User API
There are several basic objects: *Note*, *Relation*, *Access*
This API should provide enough tools for building all features, but remain small and clear - this is crucial.

## Objects
### Note
Every data is a *Note*, field **type** tells what.
* string **id**
* string **author**
* string **type**
* string **title**
* binary **content**
* int **flags** - bits <is content=binary utf8><is all data encrypted>
* string **meta** - json string
* Relation[] **relations**
In case of encryption **title**, **content**, **meta** and all **relations** are encrypted  

### Relation
It is a reference from one *Note* to another *Note* or presence of related Note in some way.
* string **type** - related Note.type
* string **id** - related Note.id
* string **loc_title** - local synonym for related Note that can be used in this Note
* string **loc_value** - local value for relations that carry a number, for example: weight

### Access
* string **id** - object that has access
* string **resourceId** - object to which access is granted
* string **rights** - bits <create access><remove><write><read>

#### Explanation
*Note* has multiple *Relations* - different kind of objects: tags, images, other notes, etc.
*Relation* used in a *Note* may have a **loc_title**, so it would be possible to hide content behind it, for example text 'It was amazing show when _Bobby jumped from the balcony to a snow hill_ below.' could hide picture of Bobby jumping from the balcony under those words, and that _italic_ text could be a ref, while in another note we could reference to the same picture with some other text.
*Relation* used in a *Note* may have a **loc_value**, so it would allow better search, for example for text 'Seen Lamborghini in a street, think it costs about 300 000 $' we could save relation 'price' with value '300000'.

## Methods

### Find Notes
string[][] getNotesIds (**userId**, **ids**, **types**, **titleRegexp**, **relationsFilterIn**, **relationsFilterOut**)
returns [[<type1>, <id1>, <id2>, ...], [<type2>, ...]]
* string **userId**
* string[] **ids** - [] means 'all'
* string[] **types** - [] means 'all'
* string **titleRegexp**
* string[] **relationsFilterIn** - [] means 'all'. [<type1>, <f1_id>, <f1_val_min>, <f1_val_max>, <f2>, ..., <type2>, ...] length = 4*N
* string[] **relationsFilterOut** - [] means 'none'. [<type1>, <f1_id>, <f1_val_min>, <f1_val_max>, <f2>, ..., <type2>, ...] length = 4*N
### access
Having **userId** method will check access to *Notes* and there are two ideas of access:
1. direct: if *user* has *Access* to *Note A*
2. propagative: if *user* has access to *Note A* and it has *Access* to *Note B* then *user* has access to *Note B*

### Edit Note
string editNote (**userId**, **noteId**, **type**, **operation**, **title**, **content**, **flags**, **meta**, **relationsAdd**, **relationsRm**)
TODO throws ErrCode
* string **userId**
* string **noteId** - is null only if it is new Note
* string **type**
* int **operation** - bits telling what to update <relations><meta><flags><content><title><delete>
* string **title**
* binary **content**
* int **flags**
* string **meta**
* string[] **relationsAdd** - [<type1>, <id1>, <loc_title1>, <loc_value1>, <type2>, ...] length = 4*N
* string[] **relationsRm** - [<type1>, <id1>, <type2>, ...] length = 2*N

### Get Access
int getAccess (**userId**, **idA**, **idB**)
returns bits <create access from><create access to><remove><write><read>
* string **userId**
* string **idA** - note with access
* string **idB** - resource note

### Edit Access
editAccess (**userId**, **idA**, **idB**, **rights**)
TODO throws ErrCode
User gives *Note A* access to *Note B*, only if user has access 'create' to *Note B*
* string **userId**
* string **idA** - note with access
* string **idB** - resource note
* string **rights** - bits <create access><remove><write><read>

## Example scenarios
### Adding note with inline tags and a file
1. User
    1. writes title 'Dalmatin'
    2. writes text 'Seen a #dog in a #park today'
    3. loads a picture
    4. presses 'save'
2. App
    1. finds tags in text 'dog' and 'park'
    2. finds tag 'park' that is [parkTagId, 'park']
    ```
    getNotesIds(userId, [], ['tag'], 'park', [], [])
    or
    getNotesIds(userId, [], ['tag'], '^park$', [], [])
    ```
    3. creates tag
    ```
    dogTagId = editNote(
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
    dogImageId = editNote(
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
    5. creates note with relations
    ```
    dogNoteId = editNote(
        userId,
        null,
        'note',
        111110,
        'Dalmatin',
        <binary note text>,
        10,
        newNoteMeta,
        ['tag', dogTagId, 'dog', null, 'tag', parkTagId, 'park', null],
        []
    )
    ```

### Renaming a tag
When user renames tag 'dog' to 'dogs' in list of tags record [dogTagId, 'dog'] changes to [dogTagId, 'dogs']. It allows existing inline tags remain same and be used more times in a note where they are already present. In notes without tag 'dog' user now will be able to use tag 'dogs'.

## Questions
Author - set on create
Access rights - *Access*
C++ compatible API -
Full text search -

# Storage API
