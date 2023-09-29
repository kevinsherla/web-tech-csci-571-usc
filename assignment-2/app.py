from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/search', methods=['GET'])
def api_search():
    arg_count = 0
    keywords = request.args.get('keywords')
    keywords = keywords.replace(" ", "%20")
    from_price = request.args.get('from') or '0'
    to_price = request.args.get('to', '')
    new = "new" in request.args
    used = "used" in request.args
    very_good = "very_good" in request.args
    good = "good" in request.args
    acceptable = "acceptable" in request.args
    return_accepted = "seller" in request.args
    free = "free" in request.args
    expedited = "expedited" in request.args
    sort_by = request.args.get('sort_by', '')

    app_key = "KevinShe-assignme-PRD-c727b8eb0-b55a0d9c"
    url = f"https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&SECURITY-APPNAME={app_key}&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD"

    params = {
        "keywords": keywords,
        "paginationInput.entriesPerPage": 10,
        "sortOrder": f"{sort_by}",
        f"itemFilter({arg_count}).name": "MinPrice",
        f"itemFilter({arg_count}).value": from_price,
        f"itemFilter({arg_count}).paramName": "Currency",
        f"itemFilter({arg_count}).paramValue": "USD",
    }
    arg_count += 1

    if to_price != "":
        params[f"itemFilter({arg_count}).name"] = "MaxPrice"
        params[f"itemFilter({arg_count}).value"] = to_price
        params[f"itemFilter({arg_count}).paramName"] = "Currency"
        params[f"itemFilter({arg_count}).paramValue"] = "USD"
        arg_count += 1

    if return_accepted:
        params[f"itemFilter({arg_count}).name"] = "ReturnsAcceptedOnly"
        params[f"itemFilter({arg_count}).value"] = "true"
        arg_count += 1

    if free:
        params[f"itemFilter({arg_count}).name"] = "FreeShippingOnly"
        params[f"itemFilter({arg_count}).value"] = "true"
        arg_count += 1

    # If expedited filter starts working again, run the lines below
    # if expedited:
    #     params[f"itemFilter({arg_count}).name"] = "ExpeditedShippingType"
    #     params[f"itemFilter({arg_count}).value"] = "Expedited"
    #     arg_count += 1

    if new or used or very_good or good or acceptable:
        value = 0
        params[f"itemFilter({arg_count}).name"] = "Condition"
        if new:
            params[f"itemFilter({arg_count}).value({value})"] = "1000"
            value += 1
        if used:
            params[f"itemFilter({arg_count}).value({value})"] = "3000"
            value += 1
        if very_good:
            params[f"itemFilter({arg_count}).value({value})"] = "4000"
            value += 1
        if good:
            params[f"itemFilter({arg_count}).value({value})"] = "5000"
            value += 1
        if acceptable:
            params[f"itemFilter({arg_count}).value({value})"] = "6000"
            value += 1
        # marking arg_count + 1 just in case if more fields need to be added
        arg_count += 1

    for key, value in params.items():
        url += f"&{key}={value}"

    print(url)

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        # print(data)
        total_entries = data["findItemsAdvancedResponse"][0]["paginationOutput"][0]["totalEntries"][0]
        print(total_entries)

        items_info = []
        for item in data['findItemsAdvancedResponse'][0]['searchResult'][0]['item'][:10]:
            title = item['title'][0]
            category = item['primaryCategory'][0]['categoryName'][0]
            condition = item['condition'][0]['conditionDisplayName'][0]
            price = float(item['sellingStatus'][0]
                          ['currentPrice'][0]['__value__'])
            image_url = item['galleryURL'][0]
            top_rated = item['topRatedListing'][0]

            item_info = {
                'Title': title,
                'Category': category,
                'Condition': condition,
                'Price': price,
                'Image URL': image_url,
                'Top_Rated': top_rated,
            }

            items_info.append(item_info)

        # for i, item_info in enumerate(items_info, start=1):
        #     print(f"\nItem {i} Information:")
        #     for key, value in item_info.items():
        #         print(f"{key}: {value}")
        # return data

        result_data = {
            'total_entries': total_entries,
            'keywords': keywords,
            'items_info': items_info,
        }
        # return items_info
        return result_data

    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None


if __name__ == "__main__":
    app.run(debug=True)
