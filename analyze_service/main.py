"""
PRAJA Civic Issue Detector — Python AI Service
Uses CLIP (openai/clip-vit-base-patch32) for zero-shot image classification.
No API keys required. Runs fully offline after first model download (~600 MB).

Target acceptance classes (strict):
- Garbage / trash dump
- Dirty public toilet
- Dirty road / unsanitary street
- Pothole / damaged road surface
- Stray dogs causing public nuisance or risk

All other images (car, bus, selfie, nature, random objects, etc.) are rejected.

Start: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import torch
from transformers import CLIPProcessor, CLIPModel

app = FastAPI(title="PRAJA Civic Issue Detector")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model at startup ─────────────────────────────────────────────────────
print("Loading CLIP model (first run downloads ~600 MB, cached after that)...")
_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
_model.eval()
print("✅ Model ready — listening on http://localhost:8000")

# ── Text prompts ──────────────────────────────────────────────────────────────

TARGET_CLASS_PROMPTS = [
    ("Waste Management", "a real photo of garbage piled on street, trash dump, littered public place, waste management issue"),
    ("Sanitation", "a real photo of dirty public toilet, unclean toilet area, unhygienic restroom in public place"),
    ("Sanitation", "a real photo of dirty road with filth, sewage, unhygienic waste on street"),
    ("Road & Infrastructure", "a real photo of pothole on road, damaged asphalt, broken road surface"),
    ("Public Safety", "a real photo of stray dogs on street causing public nuisance or safety concern"),
]

NON_TARGET_PROMPTS = [
    "a clear photo of a car or parked car",
    "a clear photo of a bus or truck",
    "a selfie or portrait of a person",
    "an indoor room, office, classroom, or home scene",
    "a landscape, sky, trees, or nature photo",
    "a random object or product photo not related to civic issue",
    "a clean road with no visible issue",
]

SEVERITY = {
    "Road & Infrastructure": "High",
    "Waste Management":      "Medium",
    "Public Safety":         "Critical",
    "Sanitation":            "High",
}

DEPARTMENT = {
    "Road & Infrastructure": "Public Works Department (PWD)",
    "Waste Management":      "Municipal Sanitation / Solid Waste Management",
    "Public Safety":         "Municipal Engineering Department",
    "Sanitation":            "Drainage Department / Underground Drainage",
}

STRICT_CLASS_THRESHOLD = 0.33
TARGET_VS_NON_TARGET_GAP = 0.08

# ── Helper ────────────────────────────────────────────────────────────────────

def clip_probs(image: Image.Image, texts: list[str]) -> list[float]:
    inputs = _processor(
        text=texts, images=image,
        return_tensors="pt", padding=True, truncation=True
    )
    with torch.no_grad():
        out = _model(**inputs)
    return out.logits_per_image[0].softmax(dim=0).tolist()

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "PRAJA Civic Issue Detector",
        "status": "running",
        "endpoints": {
            "health": "GET /health",
            "analyze": "POST /analyze  (send image as multipart form-data with field 'file')"
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # Read & decode image
    raw = await file.read()
    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        return {"isCivicIssue": False, "error": f"Cannot read image: {e}"}

    # ── Stage 1: civic vs non-civic ───────────────────────────────────────────
    target_texts = [p[1] for p in TARGET_CLASS_PROMPTS]
    target_probs = clip_probs(image, target_texts)
    best_target_idx = target_probs.index(max(target_probs))
    best_target_prob = target_probs[best_target_idx]
    best_target_label = TARGET_CLASS_PROMPTS[best_target_idx][0]

    non_target_probs = clip_probs(image, NON_TARGET_PROMPTS)
    best_non_target_prob = max(non_target_probs)

    confidence = int(best_target_prob * 100)
    is_civic = (
        best_target_prob >= STRICT_CLASS_THRESHOLD
        and (best_target_prob - best_non_target_prob) >= TARGET_VS_NON_TARGET_GAP
    )

    if not is_civic:
        return {
            "isCivicIssue": False,
            "imageQuality": "good",
            "mainSubject":  "Non-civic image",
            "reason": (
                "Image is not relevant for this complaint type. "
                "Please upload only: garbage, dirty toilet, dirty road, pothole, or stray dogs."
            ),
            "confidence": confidence,
            "acceptedClasses": [
                "garbage",
                "dirty toilet",
                "dirty road",
                "pothole",
                "stray dogs",
            ],
        }

    # ── Stage 2: strict category mapping (already selected in Stage 1) ──────
    category   = best_target_label
    severity   = SEVERITY[category]
    dept       = DEPARTMENT[category]
    urgency    = 1 if severity == "Critical" else (3 if severity == "High" else 7)

    return {
        "isCivicIssue":  True,
        "imageQuality":  "good",
        "category":      category,
        "severity":      severity,
        "confidence":    confidence,
        "title":         f"{category} issue detected",
        "description": (
            f"AI detected a {severity.lower()}-priority {category.lower()} issue. "
            "Please add specific details in the description to help authorities act faster."
        ),
        "tags": [
            category.lower().replace(" & ", "-").replace(" ", "-"),
            severity.lower(),
            "civic-issue",
            "india",
        ],
        "visualEvidence": [
            f"Classified as: {category}",
            f"Severity level: {severity}",
            f"Model confidence: {confidence}%",
        ],
        "estimatedImpact": {
            "peopleAffected": "50–200 residents",
            "urgencyDays":    urgency,
            "safetyRisk":     severity in ("Critical", "High"),
            "trafficImpact":  category == "Road & Infrastructure",
        },
        "aiRecommendations": {
            "department":          dept,
            "immediateAction":     f"Dispatch a field team to inspect the {category.lower()} issue",
            "permanentFix":        f"Restore and repair the {category.lower()} infrastructure",
            "estimatedRepairTime": "1–2 days" if severity == "Critical" else "3–7 days",
            "estimatedCostINR":    "10,000–50,000",
            "requiredResources":   ["Field inspection team", "Repair materials", "Equipment"],
            "suggestedATR": (
                f"The reported {category} issue has been verified and forwarded to {dept} "
                "for immediate action. Resolution expected within the stipulated timeframe."
            ),
        },
        "locationClues": {
            "locationType":     "unknown",
            "timeOfDay":        "unclear",
            "weatherCondition": "unclear",
            "nearbyLandmarks":  [],
            "urbanRural":       "unclear",
            "roadType":         "unknown",
        },
        "relatedIssues": [],
    }
