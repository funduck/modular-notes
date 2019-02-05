[ "$1" != "" ] && sh `dirname $0`/../$1/test/all.sh
[ "$1" = "" ] && echo "Usage: sh test.sh [module]"
