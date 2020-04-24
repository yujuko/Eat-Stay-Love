import pandas
import googlemaps


lat = []
lng = []
#stars_reviews = []

def is_number(str):
    '''helper function to check if item is a number'''
    for char in str:
        if not char.isdigit() and char != '.':
            return False
    return True

#read in csv
df = pandas.read_csv("/home/alteo/Desktop/EatStayLove/dataminer-marriott.csv")

gmaps = googlemaps.Client(key='AIzaSyBv0j8qqOw7CfTWwMISI9x3qANzdRCUbpQ')

# #geocoding
for i in range(0, df.shape[0]):
    geocode_result = gmaps.geocode(df['Addr'][i])
    if not geocode_result:
        lat.append('NULL')
        lng.append('NULL')
    #if geocoding is returned, append to lat/lng lists
    else:
        lat.append(geocode_result[0]['geometry']['location']['lat'])
        lng.append(geocode_result[0]['geometry']['location']['lng'])


## Clean Data: change 'category' to int field
# for i in range(0, df.shape[0]):
#     category = df['Category'][i]
#     print(category)
    #df.at[i, 'Category'] = cat_slice

print(df.head(3))
# category = [item[-1:] for item in category]
# category[0] = 'Category'
# for i in range(0,10):
#     print(category[i])

#add to dataframe
df['lat'] = lat
df['lng'] = lng

#export to csv
export_csv = df.to_csv(r'/home/alteo/Desktop/EatStayLove/marriot-clean.csv', index = None, header=True)