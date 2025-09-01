import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# 스타일 세팅 (예쁜 시각화용)
plt.style.use("seaborn-v0_8-whitegrid")
sns.set_context("talk")

# CSV 불러오기
df = pd.read_csv("./output/final_flood_score.csv")

# 색상: final_score 기준으로 colormap 적용
fig, ax = plt.subplots(figsize=(12, 7))

sc = ax.scatter(
    df["lat"],
    df["lng"],
    c=df["final_score"],
    cmap="YlOrRd",         # Yellow → Orange → Red
    s=200,
    edgecolors="black",
    linewidth=0.7,
    alpha=0.9
)

# 색상 범례(colorbar)
cbar = plt.colorbar(sc)
cbar.set_label("Flood Risk Score", fontsize=14)

# 그래프 꾸미기
plt.title("Flood Risk Visualization (by Final Score)", fontsize=18, weight='bold')
plt.xlabel("lat Coordinate", fontsize=14)
plt.ylabel("lng Coordinate", fontsize=14)
plt.xticks(fontsize=12)
plt.yticks(fontsize=12)

plt.grid(True, linestyle="--", alpha=0.5)
plt.tight_layout()
plt.savefig("./output/flood_risk_map.png", dpi=300)