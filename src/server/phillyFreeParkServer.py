#!/usr/bin/env python

from flask import Flask
from flask import request
from DbHandler import DbHandler


handler = DbHandler()
app = Flask(__name__)

@app.route('/populate', methods=['POST', 'GET'])
def populate_database():
    if request.method == 'POST':
        startLat = request.form['startLat']
        startLong = request.form['startLong']
        endLat = request.form['endLat']
        endLong = request.form['endLong']
        startCross = request.form['startCross']
        endCross = request.form['endCross']
        category = request.form['category']
        price = request.form['price']
        verified = request.form['verified']
        dateAdded = request.form['dateAdded']
        duration = request.form['duration']

        return handler.insert(startLat, startLong, endLat, endLong, startCross, endCross, category, price, verified, dateAdded, duration)



if __name__=='__main__':
    app.run()