import pandas as pd
from pyproj import Transformer

# 파일 경로
input_txt_path = "./data/seocho_clip.txt"
output_csv_path = "./data/seocho_elevation_data.csv"

# 1. txt 파일 불러오기 (x, y, elevation 구조)
df = pd.read_csv(input_txt_path, sep=r"\s+", names=["x", "y", "elevation"])

# 2. 좌표 변환기 정의 (EPSG:5186 -> EPSG:4326)
transformer = Transformer.from_crs("epsg:5186", "epsg:4326", always_xy=True)

# 3. 위도 경도 변환
df["lng"], df["lat"] = transformer.transform(df["x"].values, df["y"].values)

# 4. 필요한 컬럼만 저장
df_latlng = df[["lat", "lng", "elevation"]]

# 5. CSV로 저장
df_latlng.to_csv(output_csv_path, index=False)