import requests


def construct_api_url(app_key, params):
    # base_url = "https://svcs.ebay.com/services/search/FindingService/v1"
    # url = f"{base_url}?OPERATION-NAME=findItemsAdvanced"
    # url += "&SERVICE-VERSION=1.0.0"
    # url += f"&SECURITY-APPNAME={app_key}"
    # url += "&RESPONSE-DATA-FORMAT=JSON"
    # url += "&REST-PAYLOAD"

    url = f"https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&SECURITY-APPNAME={app_key}&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD"

    for key, value in params.items():
        url += f"&{key}={value}"

    return url


def make_api_call(app_key, params):
    url = construct_api_url(app_key, params)

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None


app_key = "KevinShe-assignme-PRD-c727b8eb0-b55a0d9c"
search_params = {
    "keywords": "laptop",
    "sortOrder": "BestMatch",
    "itemFilter(0).name": "MaxPrice",
    "itemFilter(0).value": "500",
    "itemFilter(0).paramName": "Currency",
    "itemFilter(0).paramValue": "USD",
}

api_response = make_api_call(app_key, search_params)
print(api_response)
