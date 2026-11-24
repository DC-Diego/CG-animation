
@echo off
setlocal

title RayMarching Luz - Build

echo =====================================
echo       RAYMARCHING LUZ - BUILD
echo =====================================

:: MSYS2 UCRT64
set "MSYS=C:\msys64\ucrt64"
set "PATH=%MSYS%\bin;%PATH%"

:: Project directories
set "BUILD=build"
set "INCLUDES=-I. -Iincludes -Istb_image"

:: Check compiler
where g++ >nul 2>nul
if errorlevel 1 (
    echo [ERROR] g++ nao encontrado.
    echo Verifique a instalacao do MSYS2 UCRT64.
    pause
    exit /b 1
)

:: Check GLFW
if not exist "%MSYS%\lib\libglfw3.a" (
    echo [ERROR] GLFW nao encontrado.
    echo Instale com:
    echo pacman -S mingw-w64-ucrt-x86_64-glfw
    pause
    exit /b 1
)

:: Create build directory
if not exist "%BUILD%" mkdir "%BUILD%"

echo.
echo [1/3] Compiling GLAD...

gcc -O2 %INCLUDES% -c glad.c -o "%BUILD%\glad.o"
if errorlevel 1 goto error

echo.
echo [2/3] Compiling project...

g++ -std=c++17 -O2 -Wall -Wextra %INCLUDES% ^
    Math3.cpp Animation.cpp "%BUILD%\glad.o" ^
    -o "%BUILD%\RayMarching.exe" ^
    -L"%MSYS%\lib" -lglfw3 ^
    -lopengl32 -lgdi32 -luser32 -lshell32

if errorlevel 1 goto error

echo.
echo [3/3] Running...

"%BUILD%\RayMarching.exe"

if errorlevel 1 (
    echo.
    echo [WARNING] Program returned an error.
)

pause
exit /b 0

:error
echo.
echo [BUILD FAILED]
pause
exit /b 1
