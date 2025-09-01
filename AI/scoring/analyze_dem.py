import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.neighbors import NearestNeighbors
from geopy.distance import geodesic

# 입력 DEM 파일 (lat, lng, elevation)
df = pd.read_csv("./data/seocho_elevation_data.csv")

# 기준: 평균 고도와 표준편차
mean_elev = df["elevation"].mean()
std_elev = df["elevation"].std()

# 고도 기반 위험 등급 부여 
def classify_by_elevation(elev):
    if elev >= mean_elev:
        return "Safe"
    elif elev < mean_elev - 1.5 * std_elev:
        return "Danger"
    else:
        return "Caution"

df["elevation_level"] = df["elevation"].apply(classify_by_elevation)

# k-NN 기반 경사도 계산
k = 30
coords = df[["lat", "lng"]].values
elevations = df["elevation"].values

nbrs = NearestNeighbors(n_neighbors=k + 1).fit(coords)
distances, indices = nbrs.kneighbors(coords)

slopes = []
for i, neighbors in enumerate(indices):
    neighbor_elev = elevations[neighbors[1:]]
    neighbor_dist = distances[i][1:]
    dz = neighbor_elev - elevations[i]
    slope = np.mean(np.abs(dz / neighbor_dist))
    slopes.append(slope)

df["slope"] = slopes
df["slope_norm"] = 1 - (np.array(slopes) / max(slopes))  # 평평할수록 1에 가까움

# 경사도 낮아서 평평한 지역이면 위험도 올려줌 (Caution → Danger)
def apply_slope_override(row):
    if row["elevation_level"] == "Caution" and row["slope_norm"] > 0.8:
        return "Danger"
    else:
        return row["elevation_level"]

df["risk_level"] = df.apply(apply_slope_override, axis=1)

# 위험 점수
df["risk_score"] = df["risk_level"].map({"Safe": 0.0, "Caution": 0.5, "Danger": 1.0})

# 저장 및 시각화
df["slope"] = df["slope"].round(4)
df["risk_score"] = df["risk_score"].round(4)

results = df[["lat", "lng", "elevation", "slope", "risk_score", "risk_level"]].copy()
results = results.sort_values(by=["lat", "lng"]).reset_index(drop=True)

# 시각화
color_map = {"Safe": "blue", "Caution": "orange", "Danger": "red"}
plt.figure(figsize=(8, 6))
plt.scatter(results["lng"], results["lat"], c=results["risk_level"].map(color_map), s=40)
plt.title("Flood Risk")
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.grid(True)
plt.tight_layout()
plt.savefig("./output/dem_risk_map.png")

# 저장
results.to_csv("./data/dem_risk_results.csv", index=False)


# ================================================================

# CCTV 위치 기반 DEM 평균 위험도 계산 및 저장 

def compute_average_dem_score_near_cctv(cctv_lat, cctv_lng, radius_m=150):
    nearby_points = []
    for _, row in results.iterrows():
        dist = geodesic((cctv_lat, cctv_lng), (row["lat"], row["lng"])).meters
        if dist <= radius_m:
            nearby_points.append(row["risk_score"])
    
    if not nearby_points:
        avg_score = 0.0  # 근처 데이터 없음 → 기본값
    else:
        avg_score = round(np.mean(nearby_points), 4)
    
    # 결과 저장
    avg_df = pd.DataFrame([{
        "lat": cctv_lat,
        "lng": cctv_lng,
        "risk_score": avg_score
    }])
    avg_df.to_csv("./data/dem_risk_avg_score.csv", index=False)
    print(f"CCTV 주변 평균 DEM 위험도 저장 완료: {avg_score}")


# ================================================================

# CCTV 위치 입력
# cctv_lat = 37.497531554375165
# cctv_lng = 127.02697946805908 

cctv_lat = 37.49858578128938
cctv_lng= 127.02676215392935 

# 평균 DEM 위험도 계산 및 저장
compute_average_dem_score_near_cctv(cctv_lat, cctv_lng)