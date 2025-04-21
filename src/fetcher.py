from datetime import datetime

from dotenv import load_dotenv
import os
import requests

load_dotenv()

API_KEY = os.getenv('API_KEY')
LOC_LAT = os.getenv('LOCATION_LAT')
LOC_LNG = os.getenv('LOCATION_LNG')


def get_places_review_number(place_id):
    res = requests.get(
        f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=user_ratings_total,geometry&key={API_KEY}")

    return res


def get_places_routing_expenses(place_id):
    res = requests.post("https://routes.googleapis.com/directions/v2:computeRoutes",
                        json={
                            "origin": {
                                "location": {
                                    "latLng": {
                                        "latitude": LOC_LAT,
                                        "longitude": LOC_LNG
                                    }
                                }
                            },
                            "destination": {
                                "placeId": place_id
                            },
                            "travelMode": "TWO_WHEELER",
                            "routingPreference": "TRAFFIC_AWARE",
                            "computeAlternativeRoutes": False,
                            "routeModifiers": {
                                "avoidTolls": False,
                                "avoidHighways": False,
                                "avoidFerries": False
                            },
                            "languageCode": "en-US",
                            "units": "IMPERIAL"
                        },
                        headers={
                            'Content-Type': 'application/json',
                            'X-Goog-Api-Key': API_KEY,
                            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline"
                        })
    return res


res = requests.post("https://places.googleapis.com/v1/places:searchNearby",
                    json={
                        "includedTypes": ["restaurant"],
                        "locationRestriction": {
                            "circle": {
                                "center": {
                                    "latitude": LOC_LAT,
                                    "longitude": LOC_LNG
                                },
                                "radius": 1000.0 # in meters
                            }
                        },
                        "maxResultCount": 20,
                    },
                    headers={
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': API_KEY,
                        "X-Goog-FieldMask": "places.name,places.displayName,places.priceRange,places.rating,places.regularOpeningHours"
                    })

if res.status_code == 200:
    data = res.json()
    # print(data["places"])

    for e in data["places"]:
        print()
        print("Restaurant Name: ", e['displayName'])
        print("rating: ", e['rating'])
        # print("priceRange: ", e['priceRange'])

        print(e)
        # print(e['placeId'])
        # print(get_places_review_number(e['placeId']))
        # print(e['name'])
        # print(e['displayName'])
        # print(e['priceRange'])
        # print(e['rating'])
        # print(e['regularOpeningHours'])
        rating = get_places_review_number(e['name'].split('/')[-1])
        # print(rating)
        json = rating.json()

        # print("user_ratings_total: ", json['user_ratings_total'])
        print(json)

        distance = get_places_routing_expenses(e['name'].split('/')[-1])
        json2 = distance.json()
        print("time: ", json2['routes'][0]['duration'])
        print("distance: ", json2['routes'][0]['distanceMeters'])


    # if data['results']:
    #     for place in data['results']:
    #         name = place['name']
    #         address = place['vicinity']
    #         rating = place.get('rating', 'N/A')
    #         print(f"Name: {name}, Address: {address}, Rating: {rating}")
    # else:
    #     print("No results found.")
else:
    print(f"Error: {res.status_code}")
    print(res.text)
    print("Failed to fetch data from the API.")
