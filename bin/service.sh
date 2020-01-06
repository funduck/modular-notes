module=$1
implementation=$2
command=$3

[[ ("$1" = "") || ("$2" = "") || ("$3" = "") ]] && {
  echo "Usage: sh service.sh MODULE IMPLEMENTATION COMMAND"
  echo "modules: storage, server"
  echo "implementations: nodejs"
  echo "commands: start, start-test, stop, stop-test, status"
} || {
  dir=`dirname $0`
  sh $dir/../$module/$implementation/service.sh $command
}
