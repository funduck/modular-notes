module=$1
implementation=$2

[[ ("$1" = "") || ("$2" = "") ]] && {
  echo "Usage: sh test.sh MODULE IMPLEMENTATION"
  echo "modules: storage, server"
  echo "implementations: nodejs"
} || {
  dir=`dirname $0`

  echo internal module tests
  $dir/../$module/$implementation/test.sh

  echo External scenarios tests
  export MN_TESTING_MODULE=$module
  export MN_TESTING_IMPLEMENTATION=$implementation

  $dir/../$module/$implementation/service.sh stop-test
  $dir/../$module/$implementation/service.sh start-test
  mocha $dir/../utils/nodejs/http_scenarios_runner.js -b
  $dir/../$module/$implementation/service.sh stop-test
  
}
