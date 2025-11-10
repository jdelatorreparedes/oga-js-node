@echo off
setlocal enabledelayedexpansion

REM Poner aquí la IP concreta por la que queremos que se publique la aplicación.
echo on
set SERVER_IP=172.16.10.16
echo off

REM ------------------------------------------------------------
REM Compila el frontend y lanza el servidor en nueva ventana
REM con registro de logs (mantiene los 5 más recientes)
REM ------------------------------------------------------------

set LOGDIR=logs
if not exist %LOGDIR% mkdir %LOGDIR%

set DATESTAMP=%DATE:~6,4%-%DATE:~3,2%-%DATE:~0,2%
set TIMESTAMP=%TIME:~0,2%-%TIME:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOGFILE=%LOGDIR%\build_y_arranca_%DATESTAMP%_%TIMESTAMP%.log

echo ------------------------------------------------------------ >> %LOGFILE%
echo [INICIO] %DATE% %TIME% - Compilacion frontend >> %LOGFILE%
echo Iniciando compilacion del frontend...

REM --- Compilar frontend ---
call npm run build >> %LOGFILE% 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error al compilar. Revisa el log: %LOGFILE%
    echo [ERROR] %DATE% %TIME% - Fallo en compilacion >> %LOGFILE%
    pause
    exit /b %ERRORLEVEL%
)

echo Compilacion completada correctamente. >> %LOGFILE%
echo Lanzando servidor Node.js...
echo [INICIO] %DATE% %TIME% - Lanzamiento del servidor >> %LOGFILE%

REM --- Abrir nueva ventana que ejecute el servidor ---
cd server
start "Servidor Node.js" cmd /k "npm run start:prod && pause"
cd ..

echo [FIN] %DATE% %TIME% - Script completado >> %LOGFILE%
echo ------------------------------------------------------------ >> %LOGFILE%

REM --- Mantener solo los 5 logs más recientes ---
set count=0
for /f "delims=" %%f in ('dir /b /a-d /o-d "%LOGDIR%\build_y_arranca_*.log"') do (
    set /a count+=1
    if !count! GTR 5 (
        del "%LOGDIR%\%%f"
    )
)

echo Servidor lanzado en nueva ventana. Log: %LOGFILE%
pause
