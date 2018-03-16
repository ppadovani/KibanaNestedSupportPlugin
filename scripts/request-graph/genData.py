#!/usr/local/bin/python3

import json
import uuid
import requests
import sys
import re
import random
import itertools

services = []
proptaxes = []
elemschools = []
midschools = []
highschools = []
colleges = []
students = []

# Services
uiServices = ['ui-1','ui-2','ui-3']
loginServices = {'login-1', 'login-2', 'login-3'}
catalogServices = {'catalog-1', 'catalog-2', 'catalog-3'}
inventoryServices = {'inventory-1', 'inventory-2', 'inventory-3'}

esHostname = sys.argv[1]
numHomes = int(sys.argv[2])



class School:
	def __init__(self, type):
		self.id = str(uuid.uuid4())
		self.name = random.sample(streetNames, 1)[0] + ' ' + type
		self.type = type

class PropertyTax:
	def __init__(self, year, minValue, address, id):
		self.id = str(uuid.uuid4())
		self.propertyId = id
		self.address = address
		self.year = year
		self.appraisedValue = int(float(minValue) * (1+float(random.randint(3,15))/float(100)))

class Room:
	def __init__(self, type):
		self.type = type
		if (self.type == 'kitchen' or self.type == 'bathroom'):
			self.counter = random.sample(counterTypes, 1)[0]
		if (self.type == 'bedroom'):
			self.closet = random.sample(closetTypes, 1)[0]
		

class House:
	def __init__(self):
		self.id = str(uuid.uuid4())
		self.type = random.sample(houseTypes, 1)[0]
		self.siding = random.sample(houseSiding, 1)[0]
		self.roofTypes = random.sample(roofTypes, 1)[0]
		self.fence = random.sample(fenceTypes, 1)[0]
		self.garage = random.sample(garageTypes, 1)[0]
		self.address = {}
		self.address['street'] = str(random.randint(10, 1000)) + ' ' + random.sample(streetNames, 1)[0] + ' ' + random.sample(streetTypes, 1)[0]
		self.address['city'] = 'Austin'
		self.address['postalCode'] = '78745'
		surname = random.sample(surnames, 1)[0]
		self.name = 'Home of the ' + surname
		age = random.randint(35, 65)
		self.family = []
		self.cars = []
		self.family.append(Person(surname, age))
		age = random.randint(35, 65)
		self.family.append(Person(surname, age))
		count = random.randint(0, 6)
		for i in range(count):
			self.family.append(Person(surname, random.randint(1, 22)))
		self.family_size = len(self.family)
		count = random.randint(1, 3)
		for i in range(count):
			self.cars.append(Car())
		self.cars_size = len(self.cars)
		self.rooms = []
		self.rooms.append(Room('kitchen'))
		self.rooms.append(Room('master'))
		self.rooms.append(Room('family'))
		self.rooms.append(Room('bathroom'))
		count = random.randint(1, 3)
		for i in range(count):
			self.rooms.append(Room('bedroom'))
		count = random.randint(0, 2)
		for i in range(count):
			self.rooms.append(Room('bathroom'))
		count = random.randint(0, 2)
		for i in range(count):
			self.rooms.append(Room(random.sample(roomTypes, 1)[0]))	
		self.rooms_size = len(self.rooms)	
		minValue = random.randint(100000, 400000)
		for i in range(2000, 2016):
			tax = PropertyTax(i, minValue, self.address, self.id)
			minValue = tax.appraisedValue
			proptaxes.append(tax)

class Car:
	def __init__(self):
		self.id = str(uuid.uuid4())
		self.make = random.sample(carMakes, 1)[0]
		self.type = random.sample(carTypes[self.make], 1)[0]
		self.color = random.sample(colors, 1)[0]

class Person:
	def __init__(self, surname, age):
		self.id = str(uuid.uuid4())
		self.surname = surname
		self.gender = random.sample(personTypes, 1)[0]
		self.givenName = random.sample(givenMaleNames, 1)[0] if self.gender == 'male' else random.sample(givenFemaleNames, 1)[0]
		self.age = age
		if age >= 5 and age < 11:
			self.school = random.sample(elemschools,1)[0].id
		if age >= 11 and age < 14:
			self.school = random.sample(midschools,1)[0].id
		if age >= 14 and age < 19:
			self.school = random.sample(highschools,1)[0].id
		if age >= 19 and age < 22:
			self.school = random.sample(colleges,1)[0].id

print("Generating schools")
for i in range(20):
	elemschools.append(School("Elementary"))

for i in range(10):
	midschools.append(School("Middle School"))

for i in range(3):
	highschools.append(School("High School"))

for i in range(3):
	colleges.append(School("College"))

print("Generating homes")
for i in range(numHomes):
	homes.append(House())

url = 'http://' + esHostname

# print("Creating mappings in elasticsearch")
# create the mappings in elastic
# contents = open('home.json', 'rb').read()
# requests.post(url + '/homes', data=contents)
# contents = open('school.json', 'rb').read()
# requests.post(url + '/schools', data=contents)
# contents = open('propertytaxes.json', 'rb').read()
# requests.post(url + '/propertytaxes', data=contents)
headers = {'Content-Type': 'application/json'}
print("Indexing homes")
for i in homes:
#	print(json.dumps(i, default=lambda o: o.__dict__))
	requests.post(url + '/homes/home', headers=headers, data=json.dumps(i, default=lambda o: o.__dict__))

print("Indexing property taxes")
for i in proptaxes:
	requests.post(url + '/propertytaxes/record', headers=headers, data=json.dumps(i, default=lambda o: o.__dict__))
	
print("Indexing schools")
for i in elemschools:
	requests.post(url + '/schools/school', headers=headers, data=json.dumps(i, default=lambda o: o.__dict__))

for i in midschools:
	requests.post(url + '/schools/school', headers=headers, data=json.dumps(i, default=lambda o: o.__dict__))

for i in highschools:
	requests.post(url + '/schools/school', headers=headers, data=json.dumps(i, default=lambda o: o.__dict__))

for i in colleges:
	requests.post(url + '/schools/school', headers=headers, data=json.dumps(i, default=lambda o: o.__dict__))
