from selenium import webdriver
from selenium.webdriver.support import ui
import urllib2
from bs4 import BeautifulSoup
import re
import xlwt
import time

# dictionaries containing information on months and url formats
dateDict = {0: 'january', 1: 'february', 2: 'march', 3: 'april', 4: 'may', 5: 'june', 6: 'july', 7: 'august', 8: 'september', 9: 'october', 10: 'november', 11: 'december'}
yearDict = {0:614, 1: 892, 2: 1231}

def page_is_loaded(driver):
	"""Determine whether the current webpage has loaded."""
	return driver.find_element_by_tag_name("body") != None

def urlAdd(i):
	"""Format current url."""

	if i < 100:
		if i < 10:
			return "00%d" % i
		return "0%d" % i
	return "%d" % i

def removeLines(s):
	"""Remove empty lines from string."""
    return '\n'.join([x for x in s.split("\n") if x.strip()!=''])

def determineDateIndex(s):
	"""Find occurence of date substring within string."""

	for i in range(12):
		currentMonth = dateDict[i]
		index = s.lower().rfind(currentMonth)
		if not index == -1:
			return index
	return -1

# initialize webdriver
driver = webdriver.Chrome()
driver.get("https://cwld-alexanderstreet-com.ezp-prod1.hul.harvard.edu/cgi-bin/asp/philo/cwld/getdoc.pl?S1986-D001")
wait = ui.WebDriverWait(driver, 10)
wait.until(page_is_loaded)

# push page field entries
username_field = driver.find_element_by_name("username")
username_field.send_keys("twalker@college.harvard.edu")
password_field = driver.find_element_by_name("password")
password_field.send_keys("HUID password goes here")
driver.find_element_by_name("_eventId_submit").click()

# pause so that dual factor authentication can be completed
wait.until(page_is_loaded)
time.sleep(10)

url = "https://cwld-alexanderstreet-com.ezp-prod1.hul.harvard.edu/cgi-bin/asp/philo/cwld/getdoc.pl?S"
writeCount = 0

# create Excel document
book = xlwt.Workbook()
sh = book.add_sheet("sheet1")

# iterate through pages of interest
for k in range(0,3):
	year = 1986+k
	curl = url + "%d" % year
	curl += "-D"

	for i in range(1, yearDict[k]):

		# define current url
		ccurl = curl + urlAdd(i)
		driver.get(ccurl)
		wait.until(page_is_loaded)
		soup = BeautifulSoup(driver.page_source, 'html.parser')

		important = soup.find_all('tr')[2].get_text().splitlines()
		dateUnedited = importantText[5]

		textUnedited = ""

		# consider alphabetic text elements
		for j in range(6,len(importantText)-1):
			if re.search('[a-zA-Z]', importantText[j]):
				textUnedited += importantText[j] + "\n"
		text = removeLines(textUnedited)
		index = determineDateIndex(dateUnedited)
		date = dateUnedited[index:]
		length = len(text)

		# write data to Excel document
		sh.write(writeCount, 0, date)
		textNum = 1+length/30000
		for l in range(textNum):
			sh.write(writeCount, 1+l, text[30000*l:30000*(l+1)])

		# keep track of length of written dataset
		writeCount += 1

# save Excel document
book.save("newoutput")
