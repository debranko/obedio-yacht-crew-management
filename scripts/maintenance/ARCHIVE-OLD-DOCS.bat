@echo off
echo Creating archive directory...
if not exist "docs\archive\old-docs-2025-11-01" mkdir "docs\archive\old-docs-2025-11-01"

echo.
echo Moving old documentation files to archive...
echo.

REM Move all .md files except the 5 essential ones
for %%f in (*.md) do (
    if /I NOT "%%f"=="OBEDIO-CONSOLIDATED-RULES-FOR-AI.md" (
    if /I NOT "%%f"=="OBEDIO-IMPLEMENTATION-TODO-LIST.md" (
    if /I NOT "%%f"=="OBEDIO-TECHNICAL-SPECIFICATIONS.md" (
    if /I NOT "%%f"=="CLAUDE-CODE-START-INSTRUCTIONS.md" (
    if /I NOT "%%f"=="README.md" (
        echo Moving %%f...
        move "%%f" "docs\archive\old-docs-2025-11-01\" >nul 2>&1
    )))))
)

echo.
echo Archive complete!
echo.
echo Remaining files in root:
dir *.md /b
echo.
pause