#!/bin/bash
# Compiles openapi docs
# Builds module's 'description' from openapi

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
  compile)
    case "$module" in
      all)
        echo "compiling openapi for all modules"
        ls $root/api/* | grep -E "/[a-z]*.prototype(.json|.yaml|.yml)" | while read f ;
        do
          module=`echo $f | sed 's/.*\/\([^\.]*\)\..*/\1/'`
          [ -d $root/$module ] && { \
            echo "for $f building $root/api/$module.yaml"
            node $root/utils/nodejs/openapi-compose/index.js compile-yaml $f > $root/api/$module.yaml
          } || echo "module '$module' not exists"
        done
      ;;
      *)
        echo "compiling openapi for '$module'"
        ls $root/api/$module.prototype.* | grep -E "(.json|.yaml|.yml)" | head -1 | while read f ;
        do
          [ -d $root/$module ] && { \
            echo "for $f building $root/api/$module.yaml"
            node $root/utils/nodejs/openapi-compose/index.js compile-yaml $f > $root/api/$module.yaml
          } || echo "module '$module' not exists"
        done
      ;;
    esac
    ;;
  description)
    case "$module" in
      all)
        echo "building description for all modules"
        ls $root/api/* | grep -v prototype | grep -E "/[a-z]*(.json|.yaml|.yml)" | while read f ;
        do
          module=`echo $f | sed 's/.*\/\([^\.]*\)\..*/\1/'`
          [ -d $root/$module ] && { \
            echo "for $f building $root/$module/description.json"
            node $root/utils/nodejs/openapi-compose/index.js description $f > $root/$module/description.json
          } || echo "module '$module' not exists"
        done
      ;;
      *)
        echo "building description for '$module'"
        ls $root/api/$module.* | grep -v prototype | grep -E "(.json|.yaml|.yml)" | head -1 | while read f ;
        do
          [ -d $root/$module ] && { \
            echo "for $f building $root/$module/description.json"
            node $root/utils/nodejs/openapi-compose/index.js description $f > $root/$module/description.json
          } || echo "module '$module' not exists"
        done
      ;;
    esac
  ;;
  *)
    echo "Usage: sh openapi.sh MODULE COMMAND"
    echo "modules: storage, server, ..., all"
    echo "commands: compile, description"
  ;;
esac
