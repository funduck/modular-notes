# Example scenarios
TODO actualize examples
## Adding node with inline tags and a file
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
