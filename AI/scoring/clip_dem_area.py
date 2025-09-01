import pandas as pd
import pyproj

# 변환할 위도, 경도 (WGS84, EPSG:4326 기준)
lat = 37.49858578128938
lon = 127.02676215392935 

# 원본 좌표계 -> 변환할 좌표계 설정
transformer = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:5186", always_xy=True)
# 위도, 경도 값을 EPSG:5186 좌표로 변환
x, y = transformer.transform(lon, lat)

print(f"원본 위도, 경도 (WGS84): ({lat}, {lon})")
print(f"변환된 EPSG:5186 좌표 (x, y): ({x}, {y})")

# 구한 좌표를 사용해 1km 범위 계산 (단위: m)
x_min = x - 1000
x_max = x + 1000
y_min = y - 1000
y_max = y + 1000

print("\n--- 1km 반경 범위 ---")
print(f"X 범위: {x_min} ~ {x_max}")
print(f"Y 범위: {y_min} ~ {y_max}")

# DEM 파일 불러오기
input_txt = "./data/서울특별시 서초구.txt"
df = pd.read_csv(input_txt, sep=r"\s+", names=["x", "y", "elevation"])

# 범위로 필터링
filtered = df[
    (df["x"] >= x_min) & (df["x"] <= x_max) &
    (df["y"] >= y_min) & (df["y"] <= y_max)
]

# 결과 저장
output_txt = "./data/seocho_clip.txt"
filtered.to_csv(output_txt, index=False, header=False, sep=' ')

print(f"총 {len(filtered)}개의 지점이 필터링 완료")
print(f"저장 위치: {output_txt}")