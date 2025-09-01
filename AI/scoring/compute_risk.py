import pandas as pd
from datetime import datetime
from .get_rainfall import get_rain_data_by_stn 

# 위험도 등급 분류 함수
def classify_total_score(score):
    if score < 0.4:
        return "Safe"
    elif score < 0.7:
        return "Caution"
    else:
        return "Danger"

# 강수량 위험도 점수 계산
def calculate_rain_score(rn_hr1, rn_day, rn_15m_max):

    score = 0.0

    # 1시간 강수량 기준 
    if rn_hr1 >= 70:
        score += 0.4  
    elif rn_hr1 >= 50:
        score += 0.3   
    elif rn_hr1 >= 30:
        score += 0.2   
    elif rn_hr1 >= 15:
        score += 0.1   

    # 일 누적 강수량 기준 (배수 능력 초과 여부)
    if rn_day >= 300:
        score += 0.4   
    elif rn_day >= 200:
        score += 0.3   
    elif rn_day >= 100:
        score += 0.2   
    elif rn_day >= 60:
        score += 0.1  

    # 15분 강수량 기준
    if rn_15m_max >= 20:
        score += 0.3   # 저지대, 지하차도 침수 위험 매우 높음
    elif rn_15m_max >= 15:
        score += 0.2   # 도로, 배수 불량 지역 침수 위험 증가

    return min(score, 1.0)

# 메인 함수
def compute_flood_risk(
    dem_csv_path="./data/dem_risk_avg_score.csv",
    rn_hr1=0.0,
    rn_day=0.0,
    rn_15m_max=0.0,
    clean_count=0,
    unclean_count=0,
    puddle_ratio=None  # 시맨틱 모델용
):
    # 현재 시간
    current_time = datetime.now().isoformat()

    # 1. 강수량 점수 계산
    stn_id = 401  # 특정 지역 STN 코드
    # rain_data = get_rain_data_by_stn(stn_id)           # 실시간 기상청 API에서 호출
    # rain_score = calculate_rain_score(rain_data["RN_HR1"], rain_data["RN_DAY"], rain_data["RN_15M_MAX"])
    rain_score = 0.8  # 테스트용 강수량 점수 (실제 API 호출로 대체 필요)
    # print("rain_score = ", rain_score)

    # 2. DEM 위험도 불러오기 
    dem_df = pd.read_csv(dem_csv_path)

    # 3. 시맨틱 세그멘테이션 점수 (0.0 to 1.0)
    
    if puddle_ratio is not None:
        if puddle_ratio >= 0.25:
            puddle_score = max(0.7, puddle_ratio * 3.0)  # 최소 0.8
        elif puddle_ratio >= 0.15:
            puddle_score = max(0.4, puddle_ratio * 3.0)  # 최소 0.5
        else:
            puddle_score = puddle_ratio * 2.0  
        puddle_score = min(puddle_score, 1.0)  # 상한 1.0
    else:
        puddle_score = 0.0
    
    print("*** puddle_ratio: ", puddle_ratio)
    print("*** puddle_score: ", puddle_score)


    # 4. 하수구 점수 계산 (0.0 to 1.0)
    total = clean_count + unclean_count
    if total == 0:  # 하수구 탐지 X
        # 하수구 탐지가 안 되면서 물 비율이 높으면 위험으로 간주
        if puddle_ratio is not None and puddle_ratio > 0.5:  
            drain_score = 0.6  # 물에 잠겼을 가능성
        else:
            drain_score = 0.25  # 하수구 유무 불명확, 기본값 유지
    else:
        ratio = unclean_count / total
        drain_score = min(ratio * 2.0, 1.0) # 0 ~ 1

    print("drain_score: ", drain_score)

    # 각 위치에 대해 최종 침수 위험도 점수 계산
    final_scores = []
    for _, row in dem_df.iterrows():
        dem_score = row["risk_score"]  # DEM 기반 위험도 
        
        # 각 요소의 가중치를 적용해 최종 점수 계산
        final_score = (
            0.25 * dem_score +          
            0.25 * rain_score +
            0.10 * drain_score +
            0.40 * puddle_score 
        )

        # 비가 약할 때는( rain_score < 0.4 ) 최종 점수를 캡
        if rain_score < 0.4 or (puddle_ratio is None or puddle_ratio < 0.05):
            final_score = min(final_score, 0.399)

        # 점수에 따라 위험 등급 분류
        risk_level = classify_total_score(final_score)

        final_scores.append({
            "lat": row["lat"],
            "lng": row["lng"],
            # "dem_score": round(dem_score, 3),
            "final_score": round(final_score, 3),
            "risk_level": risk_level,
            "timestamp": current_time
        })

        print("dem_score:", dem_score)
        print("final_score:", final_score) #################################

    return pd.DataFrame(final_scores)


