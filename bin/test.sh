module=$1
implementation=$2

[[ ("$1" = "") || ("$2" = "") ]] && {
  echo "Usage: sh test.sh [module] [implementation]";
  exit -1;
}

dir=`dirname $0`

# internal module tests
sh $dir/../$module/$implementation/test.sh

# External scenarios tests
export MN_TESTING_MODULE=$module
export MN_TESTING_IMPLEMENTATION=$implementation

sh $dir/../$module/$implementation/service.sh stop-test
sh $dir/../$module/$implementation/service.sh start-test
mocha $dir/../utils/nodejs/http_scenarios_runner.js -b
sh $dir/../$module/$implementation/service.sh stop-test
