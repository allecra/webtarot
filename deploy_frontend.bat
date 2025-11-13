@echo off
echo ====================================
echo Deploy Frontend to Render
echo ====================================

echo.
echo Step 1: Add frontend files to Git...
git add index.html
git add styles.css
git add app.js
git add particles.js

echo.
echo Step 2: Commit...
git commit -m "Add frontend files (HTML, CSS, JS)"

echo.
echo Step 3: Push to GitHub...
git push origin main

echo.
echo ====================================
echo Done! Wait 2-3 minutes for Render to redeploy
echo Then visit: https://tamtam-tarot-api-1.onrender.com
echo ====================================
pause

