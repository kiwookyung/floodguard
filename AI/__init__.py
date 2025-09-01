# AI 패키지 초기화
from . import detection
from . import scoring
from . import model
from . import cctv

# detection 모듈
from .detection import model
from .detection import roi

# scoring 모듈
from .scoring.compute_risk import compute_risk
