#!/bin/bash
set -e # exit with nonzero exit code if anything fails

args=("$@")

BUILD="docker-compose build --force-rm"
START="docker-compose up -d && docker attach loginwebmakerorg_web_1"
TEST="docker-compose run web sh -c \"npm test\""
CPENV="cp env.sample .env"

if [ ${#args[@]} == 0 ]
then
  eval $BUILD
  eval $START
else
  if [ ${args[0]} == "test" ]
  then
    eval $BUILD
    eval $TEST
  elif [ ${args[0]} == "env" ]
  then
    eval $CPENV
  else
    echo "ERROR: Unknown command"
  fi
fi
