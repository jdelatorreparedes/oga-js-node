REM --- Arrancar FrontEnd y BackEnd ---
call npm run 

cd server
cmd /k "npm run start:prod && pause"


