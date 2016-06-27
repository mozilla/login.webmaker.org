SETLOCAL ENABLEEXTENSIONS

SET "build=docker-compose build --force-rm"
SET "start=docker-compose up -d && docker attach loginwebmakerorg_web_1"
SET "test=docker-compose run web sh -c \"npm test\""
SET "cpenv=COPY env.sample .env"

IF "%1"=="" (
    %build%
    %start%
) ELSE (
    CALL :CMD_%1
    IF ERRORLEVEL 1 CALL :ERROR
)

:CMD_test
  %build%
  %test%
  GOTO :EOF
:CMD_env
  %cpenv%
  GOTO :EOF
:ERROR
  ECHO ERROR: Unknown command
  GOTO :EOF
