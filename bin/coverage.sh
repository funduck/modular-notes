module=$1
implementation=$2

[[ ("$1" = "") || ("$2" = "") ]] && {
  echo "Usage: sh test.sh MODULE IMPLEMENTATION"
  echo "modules: storage, server"
  echo "implementations: nodejs"
} || {
  dir=`dirname $0`

  $dir/../$module/$implementation/coverage.sh
  firefox $dir/../$module/$implementation/coverage/index.html
}
