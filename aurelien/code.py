DROPBOX_ACCESS_TOKEN = open("/Users/justinsavoie/Documents/toks/dpappAure.txt", "r").readlines()[0]

import pathlib
import pandas as pd
import dropbox
from dropbox.exceptions import AuthError
import os
import re

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
        return shared_link.replace('?dl=0', '?dl=1')
    except dropbox.exceptions.ApiError as exception:
        if exception.error.is_shared_link_already_exists():
            shared_link_metadata = dbx.sharing_get_shared_links(dropbox_file_path)
            shared_link = shared_link_metadata.links[0].url
            #return shared_link.replace('?dl=0', '?dl=1')    
            return shared_link


folder = "2022-07"
files = os.listdir("/Users/justinsavoie/Dropbox (Personal)/Photos Master Justin Alicia/" + folder)

regex = re.compile(r'DS_Store')
files = [i for i in files if not regex.search(i)]
files = sorted(files)

dropbox_get_link("/Photos Master Justin Alicia/2022-07/292637811_468383911289118_5880925896185018723_n.jpg")


