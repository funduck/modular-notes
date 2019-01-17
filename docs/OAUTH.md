# OAuth 1.0
Not full description, some parts are omitted

## Parameters
**oauth_consumer_key** - client identificator, has a secret
**oauth_token** - token for access to resource, also has a secret

## Scheme
Client --> Server: [get temporary credentials](#gettempcredentials)
Client <-- Server: [temporary credentials](#temporarycredentials)
Client --> Server: [authorize owner](#ownerauthorize)
Client <-- Server: redirect to [callback](#callbackredirect) or return [access granted](#accessgranted)
Client --> Server: [get access token](#getaccesstoken)
Client <-- Server: [access token](#accesstoken)

### getTempCredentials
    POST /request_temp_credentials HTTP/1.1
    Host: server.example.com
    Authorization: OAuth realm="Example",
        oauth_consumer_key="jd83jd92dhsh93js",
        oauth_signature_method="PLAINTEXT",
        oauth_callback="http%3A%2F%2Fclient.example.net%2Fcb%3Fx%3D1",
        oauth_signature="ja893SD9%26"

### temporaryCredentials
Temporary token and secret to get real token

    Content-Type: application/x-www-form-urlencoded
    oauth_token=hdk48Djdsa&oauth_token_secret=xyz4992k83j47x0b&
    oauth_callback_confirmed=true

### ownerAuthorize
    GET /authorize_access?oauth_token=hdk48Djdsa HTTP/1.1
    Host: server.example.com

### accessGranted
Code to verify resource owner in next 'get access token' request

    Content-Type: application/x-www-form-urlencoded
    oauth_verifier=473f82d3

### callbackRedirect
    GET /cb?x=1&oauth_token=hdk48Djdsa&oauth_verifier=473f82d3 HTTP/1.1
    Host: client.example.net

### getAccessToken
    POST /request_token HTTP/1.1
    Host: server.example.com
    Authorization: OAuth realm="Example",
        oauth_consumer_key="jd83jd92dhsh93js",
        oauth_token="hdk48Djdsa",
        oauth_signature_method="PLAINTEXT",
        oauth_verifier="473f82d3",
        oauth_signature="ja893SD9%26xyz4992k83j47x0b"

### accessToken
Token and secret

    Content-Type: application/x-www-form-urlencoded
    oauth_token=j49ddk933skd9dks&oauth_token_secret=ll399dj47dskfjdk

## Authenticated request
    POST /request?b5=%3D%253D&a3=a&c%40=&a2=r%20b HTTP/1.1
    Host: example.com
    Content-Type: application/x-www-form-urlencoded
    Authorization: OAuth realm="Example",
        oauth_consumer_key="9djdj82h48djs9d2",
        oauth_token="kkk9d7dh3k39sjv7",
        oauth_signature_method="HMAC-SHA1",
        oauth_timestamp="137131201",
        oauth_nonce="7d8f3e4a",
        oauth_signature="bYT5CMsGcbgUdFHObYMEfcx6bsw%3D"

**oauth_nonce** is uniquely generated, value MUST be unique across all requests with the same timestamp, client credentials, and token combinations
**oauth_timestamp** is Unix epoch
**oauth_signature** is calculated using client secret and token secret. Base string is a consistent, reproducible concatenation of several of the HTTP request elements into a single string. The string is used as an input to the "HMAC-SHA1" and "RSA-SHA1" signature methods.

    HTTP method + "&" + encoded URI + "&"
    + encoded normalized protocol parameters excluding the "oauth_signature"

Example

    POST&http%3A%2F%2Fexample.com%2Frequest&a2%3Dr%2520b%26a3%3D2%2520q
    %26a3%3Da%26b5%3D%253D%25253D%26c%2540%3D%26c2%3D%26oauth_consumer_
    key%3D9djdj82h48djs9d2%26oauth_nonce%3D7d8f3e4a%26oauth_signature_m
    ethod%3DHMAC-SHA1%26oauth_timestamp%3D137131201%26oauth_token%3Dkkk
    9d7dh3k39sjv7

## Verifying request
1. Recalculating signature
2. If using the "HMAC-SHA1" or "RSA-SHA1" signature methods, ensuring that the combination of nonce/timestamp/token (if present) received from the client has not been used before in a previous request
3. If a token is present, verifying the scope and status of the client authorization as represented by the token
4. If the "oauth_version" parameter is present, ensuring its value is "1.0"

Errors returned are 400 or 401

## Additional
Since it is needed to store secrets but not their hashes system is vulnerable for stealing those secrets from server. But, if tokens are saved hashed it is harder to use stolen database.

 
