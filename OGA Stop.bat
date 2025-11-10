@echo off
REM -----------------------------------------
REM Detiene procesos en los puertos 4200 y 3000
REM -----------------------------------------

echo Buscando procesos en el puerto 4200...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4200 ^| findstr LISTENING') do (
    echo Deteniendo proceso con PID %%a en puerto 4200...
    taskkill /PID %%a /F
)

echo Buscando procesos en el puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Deteniendo proceso con PID %%a en puerto 3000...
    taskkill /PID %%a /F
)

echo Procesos detenidos (si existian).

pause

