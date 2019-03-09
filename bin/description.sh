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
        echo "compiling openapi -> description for all modules"
        ls $root/api/* | grep -E "/[a-z]*(.json|.yaml|.yml)" | while read f ;
        do
          module=`echo $f | sed 's/.*\/\(.*\)\..*/\1/'`
          [ -d $root/$module ] && { \
            echo compiling $f
            node $root/utils/nodejs/openapi2description.js $f > $root/$module/description.json
          } || echo "module '$module' not exists"
        done
      ;;
      *)
        echo "compiling openapi -> description for '$module'"
        ls $root/api/$module.* | grep -E "(.json|.yaml|.yml)" | head -1 | while read f ;
        do
          tmp="$root/$module/description.json"
          [ $command = check ] && tmp="/tmp/modular-notes-description.json" && [ -e $tmp ] && rm $tmp
          [ -d $root/$module ] && { \
            echo "compiling $f into $tmp"
            node $root/utils/nodejs/openapi2description.js $f > $tmp
          }
          [ $command = check ] && [ -e $tmp ] && { \
            echo "checking diff"
            diff $tmp $root/$module/description.json
          }
        done 
      ;;
    esac
  ;;
  *)
    echo "Usage: sh description.sh MODULE COMMAND"
    echo "modules: storage, server, ..., all"
    echo "commands: check, update"
  ;;
esac
