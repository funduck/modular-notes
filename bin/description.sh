#!/bin/bash
# Builds 'description' for module from its openapi doc

module=$1
command=$2

dir=`dirname $0`
root=`pwd`/$dir/..

case "$module" in
  --help|-h|help)
    command="help"
  ;;
esac

case "$command" in
  update|check)
    case "$module" in
      all)
        ls $root/api/* | grep -E "^[a-z]*(.json|.yaml|.yml)" | head -1 | while read f ;
        do
          filename=`echo $filename | sed 's/\(.*\)\.xls/\1/'`
          module=`echo $f | sed 's/\(.*\)\.*/\1/'`
          [ -d $root/$module ] && node $root/utils/nodejs/openapi2description.js $root/api/$f > $root/$module/description.json
        done
      ;;
      *)
        ls $root/api/$module.* | grep -E "(.json|.yaml|.yml)" | head -1 | while read f ;
        do
          tmp="$root/$module/description.json"
          [ $command = check ] && tmp="/tmp/modular-notes-description.json"
          [ -d $root/$module ] && node $root/utils/nodejs/openapi2description.js $f > $tmp
          [ $command = check ] && [ -e $tmp ] && { diff $tmp $root/$module/description.json ; rm $tmp ; }
        done 
      ;;
    esac
  ;;
  *)
    echo "Usage: sh description.sh COMMAND MODULE"
    echo "commands: check, update"
    echo "modules: storage, server, ..., all"
  ;;
esac
