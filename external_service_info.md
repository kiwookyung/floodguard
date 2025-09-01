# 외부 서비스 사용 정보

## 1. 서비스명
- **기상청 단기예보 API (KMA Open API)**

## 2. 제공 기관
- 기상청 (Korea Meteorological Administration)

## 3. 활용 목적
- 실시간 강수량 및 강수 확률 데이터를 수집하여 침수 위험도 산정에 반영  
- 1시간 강수량, 일 누적 강수량, 15분 최대 강수량 등을 기반으로 위험 점수를 계산

## 4. 사용 방법
- 인증키(API Key)를 발급받아 HTTPS 요청으로 데이터 수집  
- 요청 파라미터: 발표시각(`tmfc`), 지역코드(`reg`), 관측소 번호(`stn`) 등  
- 응답 포맷: CSV / JSON  
- Python `requests` 모듈을 활용해 API 호출 후 Pandas DataFrame으로 변환

## 5. 실제 사용 변수
- **rn_hr1**: 1시간 강수량 (mm)  
- **rn_day**: 일 누적 강수량 (mm)  
- **rn_15m_max**: 15분 최대 강수량 (mm)  
- (추가적으로 필요한 경우 `timestamp` 를 함께 저장하여 시계열 분석에 활용)
