@echo off
echo ============================================
echo  PRAJA AI Analyzer - Python Setup
echo ============================================

echo.
echo [1/3] Installing PyTorch (CPU)...
pip install torch --index-url https://download.pytorch.org/whl/cpu

echo.
echo [2/3] Installing other dependencies...
pip install -r requirements.txt

echo.
echo [3/3] Starting AI service on http://localhost:8000 ...
echo       (First run will download the CLIP model ~600MB - please wait)
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
