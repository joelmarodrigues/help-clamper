"""
UK VRM Lookup API

A minimal FastAPI backend for UK vehicle registration lookup.
Uses the official DVLA Vehicle Enquiry Service.

Setup:
  1. Get DVLA API key: https://driver-vehicle-licensing.api.gov.uk
  2. Create .env file with DVLA_API_KEY
  3. Install: pip install -r requirements.txt
  4. Run: uvicorn main:app --reload

Environment variables:
  DVLA_API_KEY - Your DVLA API key (required)
  ALLOWED_ORIGINS - CORS origins, comma-separated (optional)
"""

from __future__ import annotations

import os
import re
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load environment variables from .env file
load_dotenv()

# Configuration
DVLA_API_KEY = os.getenv("DVLA_API_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS_LIST = [o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()]

# DVLA API endpoint
DVLA_URL = "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles"

# Global HTTP client for connection pooling
_http: Optional[httpx.AsyncClient] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for FastAPI app."""
    global _http
    _http = httpx.AsyncClient(timeout=10)
    yield
    if _http:
        await _http.aclose()
        _http = None

# Initialize FastAPI application
app = FastAPI(
    title="UK VRM Lookup",
    version="1.0.0",
    description="Educational API for UK vehicle registration lookup",
    lifespan=lifespan
)

# Configure CORS to allow frontend requests
# Default origins for local development
default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
# Combine default origins with custom origins from environment
cors_origins = list({*default_origins, *ALLOWED_ORIGINS_LIST})

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request and response data models
class LookupRequest(BaseModel):
    """Request model for vehicle lookup endpoint."""
    plate: str = Field(..., description="UK registration number (e.g., AB12CDE)")


class LookupResponse(BaseModel):
    """Response model containing vehicle details."""
    make: Optional[str] = None
    model: Optional[str] = None
    colour: Optional[str] = None
    year_of_manufacture: Optional[int] = None
    fuel_type: Optional[str] = None


# Helper functions
def normalize_plate(plate: str) -> str:
    """
    Normalize UK registration plate for API call.
    Removes spaces and hyphens, converts to uppercase.
    
    Examples:
      "AB 12 CDE" -> "AB12CDE"
      "AB-12-CDE" -> "AB12CDE"
    """
    return re.sub(r"[\s-]", "", plate).upper()


async def call_dvla(plate: str) -> Optional[Dict[str, Any]]:
    """
    Call DVLA Vehicle Enquiry Service API.
    
    Args:
      plate: UK registration number
      
    Returns:
      - dict with vehicle data on success (HTTP 200)
      - None if plate not found or invalid (HTTP 400/404)
      - Raises HTTPException on server errors
    """
    if not DVLA_API_KEY:
        # No API key configured
        return None

    assert _http is not None
    
    # Prepare request
    payload = {"registrationNumber": normalize_plate(plate)}
    headers = {"x-api-key": DVLA_API_KEY, "Content-Type": "application/json"}

    # Call DVLA API
    response = await _http.post(DVLA_URL, headers=headers, json=payload)
    
    # Handle success
    if response.status_code == 200:
        return response.json()

    # Handle "not found" gracefully
    if response.status_code in (400, 404):
        return None

    # Handle server errors
    raise HTTPException(response.status_code, f"DVLA error: {response.text[:200]}")


# API endpoints
@app.get("/")
def root():
    """Return API metadata."""
    return {
        "service": "UK VRM Lookup",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"ok": True}


@app.post("/lookup", response_model=LookupResponse)
async def lookup(request: LookupRequest) -> LookupResponse:
    """
    Lookup UK vehicle details by registration number.
    
    Example:
      POST /lookup
      {"plate": "AB12CDE"}
      
    Returns:
      Vehicle details (make, model, colour, year, fuel type)
      
    Raises:
      404 if vehicle not found
      400 if plate is empty
    """
    plate = request.plate.strip()
    if not plate:
        raise HTTPException(400, "plate required")

    # Query DVLA
    vehicle = await call_dvla(plate)
    if vehicle:
        return LookupResponse(
            make=vehicle.get("make"),
            model=vehicle.get("model"),
            colour=vehicle.get("colour"),
            year_of_manufacture=vehicle.get("yearOfManufacture"),
            fuel_type=vehicle.get("fuelType"),
        )

    # Not found
    raise HTTPException(404, "Vehicle not found")