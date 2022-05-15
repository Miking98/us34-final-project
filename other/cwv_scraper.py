import urllib2
import requests
from bs4 import BeautifulSoup
import xlwt


def formatString(s):
	"""Remove html tags from string."""

	s.replace('<tr>', '')
	s.replace('</tr>', '')
	s.replace('<b>', '')
	s.replace('</b>', '')
	s.replace('<td>', '')
	s.replace('<td/>', '')
	return s

def formatDate(s):
	"""Return date substring within string."""
	if len(s) < 15:
		return ""
	return s[14:]

def determineSide(s):
	"""Determine side of soldier based on side as substring."""

	if s.count("union") > 0:
		return "union"
	elif s.count("confederate") > 0:
		return "confederacy"
	return ""

def removeLines(s):
	"""Remove empty lines from string."""

    return '\n'.join([x for x in s.split("\n") if x.strip()!=''])

# base url
url = 'http://www.soldierstudies.org/index.php?action=view_letter&Letter='

# create Excel workbook
book = xlwt.Workbook()
sh = book.add_sheet("sheet1")

writeCount = 0

# iterate through letters
for i in range(1,1513):

	# define current url
	curl = url + "%d" % i

	# capture allegiance, date, and text from html
	soup = BeautifulSoup(requests.get(curl).content, 'html.parser')
	trOccur = soup.find_all('tr')
	textHTML = trOccur[16].find_all('td')[0].get_text()
	if len(textHTML) == 1:
		textHTML = trOccur[17].find_all('td')[0].get_text()
	date = formatDate(removeLines(trOccur[11].get_text()))
	allegiance = determineSide(trOccur[8].get_text().lower())
	text = removeLines(formatString(textHTML))

	if allegiance:

		# write data for current letter in Excel
		sh.write(writeCount, 0, allegiance)
		sh.write(writeCount, 1, date)
		length = len(text)
		textNum = 1+length/30000
		for j in range(textNum):
			sh.write(writeCount, 2+j, text[30000*j:30000*(j+1)])

		# keep track of length of written dataset
		writeCount += 1

# save Excel document
book.save("output")