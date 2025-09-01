from fastapi import FastAPI

from api.core.config import settings
from api.core.logging import get_logger, setup_logging
from api.src.users.routes import router as auth_router
from api.src.cameras.routes import router as cameras_router
from api.src.gates.routes import router as gates_router
from api.src.logs.routes import router as logs_router
from api.src.websockets.routes import (
    router as websockets_router,
    setup_mqtt_client,
    shutdown_mqtt_client,
)
from api.src.scores.routes import router as scores_router

from api.utils.migrations import run_migrations
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.PROJECT_NAME, debug=settings.DEBUG, root_path="/api")


@app.on_event("startup")
def startup_event():
    print("Application startup: Setting up MQTT client.")
    try:
        setup_mqtt_client()
    except TimeoutError:
        print("WARNING: MQTT client connection timed out. MQTT features will not be available.")
    except Exception as e:
        print(f"WARNING: An unexpected error occurred during MQTT client setup: {e}")


@app.on_event("shutdown")
def shutdown_event():
    print("Application shutdown: Shutting down MQTT client.")
    shutdown_mqtt_client()


# Set up logging configuration
setup_logging()

# Optional: Run migrations on startup
run_migrations()

# Set up logger for this module
logger = get_logger(__name__)


origins = [
    "https://localhost",
    "https://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include routers
app.include_router(auth_router)
app.include_router(cameras_router)
app.include_router(gates_router)
app.include_router(logs_router)
app.include_router(websockets_router)
app.include_router(scores_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/")
async def root():
    logger.debug("Root endpoint called")
    return {"message": "Hello World"}
