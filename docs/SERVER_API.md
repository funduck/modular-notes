# ServerAPI
*Server* provides secure access to internal server on storage from different interfaces, so it has a number of APIs
* http
* https - TODO
* web socket - TODO

May be it will have some additional functionality based on StorageAPI

## HTTP API
### Authentication
#### Basic
If Client request doesn't have valid *Access-Token* Server responds 401 with `WWW-Authenticate: Basic realm="Access to StorageAPI" charset="UTF-8"`
Client request with `Autorization: Basic <base64 encoded **user**:**password**>`
Server returns *Access-Token* that should be passed in all requests in header `Authorization: token <**Access-Token**>`

### Logout
    POST /logout
    with header Authorization: token <**Access-Token**>

Call to this method invalidates *Access-Token*

### Proxy for storage
Server proxies requests to StorageAPI with all their parameters if **Access-Token** is valid for **user**.
[StorageAPI full description and examples](STORAGE_API.md)
