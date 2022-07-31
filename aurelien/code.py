# cd into personal_website/aurelien before 

DROPBOX_ACCESS_TOKEN = open("/Users/justinsavoie/Documents/toks/dpappAure.txt", "r").readlines()[0]

to_remove = ["282248943_392549602925651_1188772972070919140_n.jpg","283596438_385143626913351_1340144692078241921_n.jpg"]

import pathlib
import pandas as pd
import dropbox
from dropbox.exceptions import AuthError
import os
import re
import shutil
import glob

def dropbox_connect():
    """Create a connection to Dropbox."""

    try:
        dbx = dropbox.Dropbox(DROPBOX_ACCESS_TOKEN)
    except AuthError as e:
        print('Error connecting to Dropbox with access token: ' + str(e))
    return dbx

def dropbox_get_link(dropbox_file_path):
    """Get a shared link for a Dropbox file path.

    Args:
        dropbox_file_path (str): The path to the file in the Dropbox app directory.

    Returns:
        link: The shared link.
    """

    try:
        dbx = dropbox_connect()
        shared_link_metadata = dbx.sharing_create_shared_link_with_settings(dropbox_file_path)
        shared_link = shared_link_metadata.url
        return shared_link.replace('?dl=0', '?raw=1')
    except dropbox.exceptions.ApiError as exception:
        if exception.error.is_shared_link_already_exists():
            shared_link_metadata = dbx.sharing_get_shared_links(dropbox_file_path)
            shared_link = shared_link_metadata.links[0].url
            return shared_link.replace('?dl=0', '?raw=1')    
            #return shared_link

######## Only run for new folder
folders = {"2022-05-24-Naissance Aurelien Mai et Juin":"Mai et Juin 2022",
"2022-07": "Juillet 2022"}

os.remove('2022-07_shares')
os.remove('2022-05-24-Naissance Aurelien Mai et Juin_shares')

for folder in folders.keys():
    files = os.listdir("/Users/justinsavoie/Dropbox (Personal)/Photos Master Justin Alicia/" + folder)
    regex = re.compile(r'DS_Store|Rhistory|gitignore|httr-oauth')
    files = [i for i in files if not regex.search(i)]
    files = sorted(files)
    for file in files:
        mylink = dropbox_get_link("/Photos Master Justin Alicia/" + folder + "/" + file)
        file_object = open(folder+"_shares", 'a')
        file_object.write(mylink)
        file_object.write("\n")

    file_object.close()

########

myfolders = glob.glob("*/", recursive = True)

for folder in myfolders:
    shutil.rmtree(folder)

folders = {"2022-05-24-Naissance Aurelien Mai et Juin":"Mai et Juin 2022",
"2022-07": "Juillet 2022"}

for folder in folders.keys():
    
    templist = open(folder+"_shares", "r").readlines()
    templist = [line[:-1] for line in templist]
    
    isExist = os.path.exists(folders.get(folder))
    if not isExist:
        os.mkdir(folders.get(folder))
    
    file_object = open(folders.get(folder)+"/images.html","a")

    file_object.write(
"""<html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
    html, body {
    height: 100%;
    margin: 0;
    padding: 0;
}

img {
    padding: 0;
    display: block;
    margin: 0 auto;
    max-height: 85%;
    max-width: 85%;
}
    </style>
    </head>
    <body>""")        
#    """<html>
#    <head>
#    <meta name="viewport" content="width=device-width, initial-scale=1">
#    <style>
#    img {
#      display: block;
#      margin-left: auto;
#      margin-right: auto;
#    }
#    </style>
#    </head>
#    <body>\n""")
    

    for sharelink in templist:

        contains = 0;
        
        for k in to_remove:
            if bool(re.search(k,sharelink)):
                contains = 1;    
        
        if contains==1:
            continue
        
        extension = sharelink[-9:-6]

        if ((extension == 'jpg') or (extension == 'png')):
            file_object.write('<a href="' + sharelink + '">')
            file_object.write('<br>')
            file_object.write('<img src="' + sharelink + '"')
            file_object.write('<br>')
        if ((extension == 'mov') or (extension == 'mp4')):
            file_object.write('<a href="' + sharelink + '">')
            file_object.write('<center>')
            file_object.write('<video height="1000" controls>')
            file_object.write('<br>')
            file_object.write('<source src="' + sharelink + '" type="video/'+extension+'">')
            file_object.write('<br>')
            file_object.write('</video>')
            file_object.write('</center>')
            file_object.write('<br>')

    file_object.write('</body></html>')
    file_object.close()



