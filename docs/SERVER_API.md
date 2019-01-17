# ServerAPI
*Server* provides secure access to internal server on storage from different interfaces, so it has a number of APIs
* http
* https - TODO
* web socket - TODO

May be it will have some additional functionality based on StorageAPI

## HTTP API
### Authentication
First and super naive.
To perform any request Client must provide valid *Access-Token* in header **Cookie** - `Cookie: token=<**Access-Token**>`

#### Sessions
Server keeps a list of active sessions by keeping valid *Access-Tokens* for user.
When *Access-Token* is invalidated session ends.
To get a list of sessions:

    GET /sessions?user=<**user**>

Returns list of active sessions in response body multipart/form-data

        --aBoundaryString
        Content-Disposition: form-data; name="session_id"
        Content-Type: text/plain

        2
        --aBoundaryString
        Content-Disposition: form-data; name="description"
        Content-Type: text/plain

        Web client - Safari browser - logged in 01.01.2019T12:00:00Z
        --aBoundaryString--

#### Authorization
Client can authorize himself in any request providing header `Authorization: Basic <base64 encoded **user**:**password**>`, in response he will get *Access-Token* in header `Set-Cookie: token=<**Access-Token**> Secure HttpOnly`
TODO get rid of cookies
TODO use OAuth or something

#### Logout
    POST /logout?user=<**user**>&session=<**sessionIds**>

* string **sessionIds** - comma separated session ids. If empty - session is found by provided *Access-Token*

Invalidates *Access-Tokens* and ends corresponding sessions for user.

### Storage Methods
All methods from StorageAPI are available in Server and proxied to Storage.
[StorageAPI full description and examples](STORAGE_API.md)

### Indexes
