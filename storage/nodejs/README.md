# Storage nodejs
## Node implementation
### Common scripts
* `test.sh` runs tests
* `service.sh [start|start-test|status|stop|stop-test]` control script
### Files
* `index.js` http server
* `storage_file.js` first implementation of storage, simple, slow, stupid. it uses `database.json`
* `test/test_with_storage_file.js` - tests server with **storage_file** storage
* `test/test_storage_file.js` - tests **storage_file** storage
