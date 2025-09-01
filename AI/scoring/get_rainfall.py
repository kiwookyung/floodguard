import requests
import pandas as pd
from io import StringIO
from datetime import datetime
import os
from dotenv import load_dotenv

def save_rain_data():
    # Load API key from .env file
    load_dotenv()
    API_KEY = os.getenv("API_KEY")

    # API endpoint
    url = "https://apihub.kma.go.kr/api/typ01/url/awsh.php"

    # Request parameters
    params = {
        "var": "RN",                          # RN = rainfall
        "tm": 202208082100,                   # Example time
        # "tm": datetime.now().strftime("%Y%m%d%H%M"),  # For real-time use
        "help": "1",                          # For readable format
        "authKey": API_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        print("Requested URL:", response.url)

        if response.status_code == 200:
            raw_text = response.text

            # Remove comment lines starting with '#'
            lines = [line for line in raw_text.splitlines() if line and not line.startswith("#")]

            # Expected column names (based on API doc and actual structure)
            columns = [
                "YYMMDDHHMI", "STN", "RE_SUM", "RE_QCM",
                "RN_DAY", "RN_DAY_MI", "RN_HR1", "RN_HR1_MI",
                "RN_60M_MAX", "RN_60M_MAX_MI", "RN_60M_QCM",
                "RN_15M_MAX", "RN_15M_MAX_MI", "RN_15M_QCM"
            ]

            # Parse data into DataFrame
            data_str = "\n".join(lines)
            df = pd.read_csv(StringIO(data_str), delim_whitespace=True, names=columns)

            # Select relevant columns
            selected = df[["YYMMDDHHMI", "STN", "RN_HR1", "RN_HR1_MI", "RN_15M_MAX", "RN_DAY"]]

            # Display results
            print("\nRainfall Summary:")
            print(selected)

            # Save to CSV
            selected.to_csv("./data/rainfall_summary.csv", index=False, encoding="utf-8-sig")
            print("\nSaved to 'data/rainfall_summary.csv'")

        else:
            print(f"Request failed with status code {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"Error occurred: {e}")


def get_rain_data_by_stn(stn_id, save_path=None):
    # Load API key
    load_dotenv()
    API_KEY = os.getenv("API_KEY")

    url = "https://apihub.kma.go.kr/api/typ01/url/awsh.php"
    params = {
        "var": "RN",
        "tm": 202208082100,
        #"tm": datetime.now().strftime("%Y%m%d%H%M"), 
        "help": "1",
        "authKey": API_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        print("Requested URL:", response.url)

        if response.status_code != 200:
            print(f"[ERROR] API 요청 실패 - 상태 코드: {response.status_code}")
            return None

        # Parse raw text
        lines = [line for line in response.text.splitlines() if line and not line.startswith("#")]
        columns = [
            "YYMMDDHHMI", "STN", "RE_SUM", "RE_QCM",
            "RN_DAY", "RN_DAY_MI", "RN_HR1", "RN_HR1_MI",
            "RN_60M_MAX", "RN_60M_MAX_MI", "RN_60M_QCM",
            "RN_15M_MAX", "RN_15M_MAX_MI", "RN_15M_QCM"
        ]
        data_str = "\n".join(lines)
        df = pd.read_csv(StringIO(data_str), delim_whitespace=True, names=columns)

        # STN 기준으로 필터링
        filtered = df[df["STN"] == stn_id]
        if filtered.empty:
            print(f"[WARNING] STN {stn_id}에 해당하는 데이터 없음.")
            return None

        row = filtered.iloc[0]
        result = {
            "RN_HR1": float(row["RN_HR1"]),
            "RN_DAY": float(row["RN_DAY"]),
            "RN_15M_MAX": float(row["RN_15M_MAX"])
        }

        print(result)

        # if save_path:
        #     filtered[["YYMMDDHHMI", "STN", "RN_HR1", "RN_15M_MAX", "RN_DAY"]].to_csv(
        #         save_path, index=False, encoding="utf-8-sig")
        #     print(f"결과 CSV 저장 완료: {save_path}")

        return result

    except Exception as e:
        print(f"[ERROR] API 요청 중 예외 발생: {e}")
        return None
