dir="`pwd`/`dirname $0`"

# Main file
file=index.js

# Logs (in /tmp)
logLevel=info
testLogLevel=verbose
logDir=mn_storage_logs
logOkFile=log
logErrFile=error

# Test option
test="--test"

file=`realpath $dir/$file`
while [ -n "$1" ]
do
  case "$1" in
		start)
      [ ! -d /tmp/$logDir ] && mkdir /tmp/$logDir
      export MN_STORAGE_LOG_LEVEL=$logLevel
      nohup node $file 1>>/tmp/$logDir/$logOkFile 2>>/tmp/$logDir/$logErrFile &
    ;;
    start-test)
      [ ! -d /tmp/$logDir.test ] && mkdir /tmp/$logDir.test
      export MN_STORAGE_LOG_LEVEL=$testLogLevel
      node $file $test 1>>/tmp/$logDir.test/$logOkFile 2>>/tmp/$logDir.test/$logErrFile &
    ;;
    status)
      ps -U `whoami` -x | grep "$file" | grep -v grep
      ;;
    stop)
      ps -U `whoami` -x | grep "$file$" | grep -v grep | sed 's/[ ]*\([0-9]*\) .*/\1/' | xargs -rn 1 echo "kill -9" | sh || true
		;;
    stop-test)
      ps -U `whoami` -x | grep "$file $test" | grep -v grep | sed 's/[ ]*\([0-9]*\) .*/\1/' | xargs -rn 1 echo "kill -9" | sh || true
		;;
  esac
  shift
done
