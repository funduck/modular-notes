# Index
It is REST API for protected internal server providing access to index without any security checks.

# HTTP REST API
## Get Nodes
### Request
Exactly same as [StorageAPI Get Nodes](STORAGE.md#get-nodes), but Index uses only some of parameters and ignores others.
It definitely uses **limit**, **idMin**, **idMax**, **idIn**, **idOut**.

### Response
Body:
* multipart/form-data with field **id** for every found *Node* and in end field **end** to tell if there are more records to read
* plain/text error message

Codes:
* 200 - ok
* 404 - node <Node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable

## Edit Node
### Request
Exactly same as [StorageAPI Edit Node](STORAGE.md#edit-node)

### Response
Body:
* plain/text error message

Codes:
* 200 - ok
* 404 - node <Node id> not exists
* 422 - invalid parameters
* 500 - internal errors
* 503 + header Retry-After - service is temporarily unavailable
