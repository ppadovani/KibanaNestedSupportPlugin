#!/usr/local/bin/python3

import json
import uuid
import requests
import sys
import re
import random
import itertools

homes = []
proptaxes = []
elemschools = []
midschools = []
highschools = []
colleges = []
students = []

# Car data for random creation
carMakes = ['Honda','Acura','Lexus']
carTypes = {'Honda': ['CRV','HRV','Civic','Accord'], 'Acura' : ['TLX','RDX', 'MDX'], 'Lexus' : ['RX350', 'IS', 'ES', 'GS', 'LS']}
colors = ['blue', 'red', 'black', 'white', 'purple', 'yellow', 'brown', 'pearl', 'graphite', 'grey']
carOptions = {'Leather': 650.00, 'Entertainment': 1250.00, 'AlloyWheels': 3125.00, 'AllWeatherMats' : 350.00, 'V6': 5500.00}

#House data for random creation
houseTypes = ['ranch', 'cape', 'townhouse', 'condo', 'two story']
houseSiding = ['clapboard', 'stone', 'brick', 'stucco']
garageTypes = ['2 car', '1 car']
roofTypes = ['asphalt shingle', 'steel', 'thatch', 'concrete tile']
fenceTypes = ['none', 'wooden', 'steel']

roomTypes = ['living','study','dining','game','theater']
closetTypes = ['walk-in','simple']
counterTypes = ['faux marble', 'quartz', 'granite', 'laminate']

personTypes = ['male', 'female']
surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young', 'Allen', 'Sanchez', 'Wright', 'King', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Ramirez', 'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner', 'Torres', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Flores', 'Morris', 'Nguyen', 'Murphy', 'Rivera', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed', 'Bailey', 'Bell', 'Gomez', 'Kelly', 'Howard', 'Ward', 'Cox', 'Diaz', 'Richardson', 'Wood', 'Watson', 'Brooks', 'Bennett', 'Gray', 'James', 'Reyes', 'Cruz', 'Hughes', 'Price', 'Myers', 'Long', 'Foster', 'Sanders', 'Ross', 'Morales', 'Powell', 'Sullivan', 'Russell', 'Ortiz', 'Jenkins', 'Gutierrez', 'Perry', 'Butler', 'Barnes', 'Fisher']
givenMaleNames = ['Santiago','Mateo','Juan','Matias','Nicolas','Benjamin','Pedro','Tomas','Thiago','Santino', 'Daniel','Dylan','Dyllan','Kevin','Keven', 'Miguel','Arthur','Davi','Pedro','Bernardo','Gabriel','Lucas','Matheus','Heitor','Rafael', 'Liam','Jackson','Logan','Lucas','Noah','Ethan','Jack','William','Jacob','James', 'Thomas','William','Jacob','Liam','Felix','Nathan','Samuel','Logan','Alexis','Noah', 'Agustin','Benjamin','Vicente','Mateo','Martin','Matias','Alonso','Tomas','Maximiliano','Joaquin', 'Santiago','Juan','David','Juan','Jose','Andres','Felipe','Samuel','Sebastian','Matias','Alejandro','Nicolas','Jeronimo', 'Stevenson','Stanley','Samuel','Peterson','Daniel','Wilson','Jameson','Evens','Ricardo','Emmanuel', 'Jayden','Daniel','Joshua','Justin','Ajani,','Jaden', 'Santiago','Mateo','Matias','Diego','Sebastian','Nicolas','Miguel','Angel','Iker','Alejandro','Samuel', 'Ramon','Juan','Jose','Antonio','Carlos','Daniel','Luis','Javier','David','Cesar', 'Luis','Jose','Alexander','David','Angel','Carlos','Sebastian','Daniel','Jesus','Juan', 'Sebastian','Dylan','Ian','Jayden','Adrian','Angel','Luis','Diego','Noah','Fabian', 'Noah','Liam','Mason','Jacob','William','Ethan','James','Alexander','Michael','Benjamin', 'Jackson','Aiden','Liam','Lucas','Noah','Mason','Ethan','Caden','Logan','Jacob', 'Santiago','Mateo','Matias','Sebastian','Martin','Alejandro','Samuel','Benjamin','Nicolas','Diego', 'Ethan','Noah','Aiden,','Jayden','Elijah','Jeremiah','Liam','Joshua','Carter','Mason','Amir', 'Jayden','Ethan','Ryan','Lucas','Aiden','Muhammad','Daniel','William','Eric','Jason', 'Liam','Dylan,','Jacob','Noah','Jayden','Ethan','Matthew','Sebastian','Alexander','Daniel','Angel', 'Joseph','David','Michael','Moshe','Jacob','Benjamin','Alexander','Daniel','Samuel','Jack', 'Deven','Ishaan','Neil','Aryan','Rohan','Arnav','Nikhil','David','Armaan','Suraj', 'James','John','Robert','Michael','William','David','Richard','Charles','Joseph','Thomas', 'Matias','Santiago','Nicolas','Martin','Bruno','Francisco','Rodrigo','Mateo','Joaquin', 'Sebastian','Santiago','Samuel','Diego','Gabriel','Alejandro','Diego','Alejandro','Daniel','Alejandro','David','Juan','Andres']
givenFemaleNames = ['Sofia','Maria','Lucia','Martina','Catalina','Elena','Emilia','Valentina','Paula','Zoe', 'Alysha','Isabella','Isabelle','Emily','Emely', 'Alice','Sophia','Julia','Laura','Isabella','Manuela','Luiza','Helena','Valentina','Giovanna', 'Emma','Olivia','Sophia','Zoe','Emily','Avery','Isabella','Charlotte','Lily','Ava', 'Emma','Lea','Olivia','Alice','Florence','Zoe','Chloe','Beatrice','Charlotte','Rosalie', 'Sofia','Emilia','Isidora','Florencia','Maite','Josefa','Amanda','Antonella','Agustina','Martina', 'Mariana','Valentina','Isabella','Sofia','Valeria','Maria','Jose','Gabriela','Sara','Salome','Daniela', 'Widelene','Mirlande','Myrlande','Islande','Lovelie','Lovely','Judeline','Angeline','Esther','Chedeline','Jessica','Rose-Merline', 'Gabrielle','Amelia','Tianna','Brianna','Jada', 'Ximena','Valentina','Maria','Fernanda','Sofia','Maria','Jose','Martina','Emilia','Zoe','Mia','Dulce','Maria', 'Maria','Elizabeth','Beatriz','Ramona','Liz','Concepcion','Carolina','Mabel','Raquel','Noemi', 'Maria','Valentina','Camila','Fernanda','Milagros','Luz','Abigail','Ariana','Luciana','Alexandra', 'Victoria','Valentina','Mia','Kamila','Amanda','Mikaela','Camila','Isabella','Sofia','Amaia', 'Emma','Olivia','Sophia','Isabella','Ava','Mia','Abigail','Emily','Charlotte','Harper', 'Sophia','Emma','Olivia','Ava','Mia','Isabella','Zoe','Lily','Emily','Madison', 'Sofia','Isabella','Lucia','Valentina','Emma','Martina','Luciana','Camila','Victoria','Valeria', 'Madison','Ava','Chloe','Aaliyah','Skylar','London,','Mia','Savannah','Olivia','Fatoumata,','Isabella,','Mariam','Serenity', 'Olivia','Chloe,','Sophia','Emma','Emily','Angela','Mia','Grace','Isabella','Claire','Alina,','Anna', 'Isabella','Sophia','Mia','Sofia','Camila','Emily','Emma','Victoria','Ashley','Valentina', 'Olivia','Esther','Rachel','Leah','Emma','Chaya','Sarah','Sophia','Ava','Chana,','Emily,','Miriam', 'Anya','Arushi','Aditi','Shreya','Anjali','Kavya','Nisha,','Nishi','Diya','Riya','Ruhi', 'Mary','Patricia','Linda','Barbara','Elizabeth','Jennifer','Maria','Susan','Margaret','Dorothy', 'Florencia','Lucia','Agustina','Valentina','Camila','Julia,','Julieta','Sofia','Abril','Ana','Paula','Micaela', 'Camila','Isabella','Sofia','Victoria','Valentina','Valeria','Nicole','Samantha','Mariana','Antonella']

streetNames = ['2nd', 'Second', 'Highland', '3rd', 'Third', 'Johnson', '1st', 'First', 'Forest', '4th', 'Fourth', 'Jefferson', 'Park', 'Hickory', '5th', 'Fifth', 'Wilson', 'Main', 'River', '6th', 'Sixth', 'Meadow', 'Oak', 'Valley', '7th', 'Seventh', 'Smith', 'Pine', 'East', 'Maple', 'Chestnut', 'Cedar', '13th', 'Thirteenth', '8th', 'Eighth', 'Franklin', 'Elm', 'Adams', 'View', '14th', 'Fourteenth', 'Washington', 'Spruce', '9th', 'Ninth', 'Laurel', 'Lake', 'Davis', 'Hill', 'Birch', 'Walnut', 'Williams', '10th', 'Tenth', 'Lee', 'Spring', 'Dogwood', 'North', 'Green', 'Ridge', 'Poplar', 'Lincoln', 'Locust', 'Church', 'Woodland', 'Willow', 'Taylor', 'Mill', 'Ash', 'Sunset', 'Madison', 'Railroad', '15th', 'Fifteenth', '11th', 'Eleventh', 'Hillcrest', 'Jackson', 'Sycamore', 'Cherry', 'Broadway', 'West', 'Miller', 'South', 'Lakeview', '12th', 'Twelfth', 'College', 'Center', 'Central']
streetTypes = ['Avenue', 'Road', 'Street', 'Cove']

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
			car = Car()
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
		self.options = []
		optionCount = random.randint(1, 3)
		for o in range(optionCount):
			self.options.append(CarOption())


class CarOption:
    def __init__(self):
        optionKey = random.sample(list(carOptions), 1)[0]
        self.name = optionKey
        self.price = carOptions[optionKey]

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

print("Indexing homes")
for i in homes:
	requests.post(url + '/homes/home', json.dumps(i, default=lambda o: o.__dict__))

print("Indexing property taxes")
for i in proptaxes:
	requests.post(url + '/propertytaxes/record', json.dumps(i, default=lambda o: o.__dict__))
	
print("Indexing schools")
for i in elemschools:
	requests.post(url + '/schools/school', json.dumps(i, default=lambda o: o.__dict__))

for i in midschools:
	requests.post(url + '/schools/school', json.dumps(i, default=lambda o: o.__dict__))

for i in highschools:
	requests.post(url + '/schools/school', json.dumps(i, default=lambda o: o.__dict__))

for i in colleges:
	requests.post(url + '/schools/school', json.dumps(i, default=lambda o: o.__dict__))
