from pymongo import MongoClient
import json
import requests
import urllib.parse
from scholarly import scholarly
import bson
import re
from collections import Counter
import nltk
from rake_nltk import Rake
from nltk.corpus import stopwords
import os

# Download necessary NLTK data files
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('punkt_tab')
code_dir = os.getcwd()

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, bson.ObjectId):
            return str(o)
        return super().default(o)

def check_name_in_database(name):
    """
    Check if the given name exists in the MongoDB database.

    Parameters:
    name (str): The name to search for.

    Returns:
    dict: The record if found, else None.
    """
    record = collection.find_one({"Name": name})
    return record

def extract_keywords(text, num_keywords=10, interest_terms=None):
    """
    Extract keywords from text using RAKE algorithm and optionally filter by interest terms.
    
    :param text: Input text to extract keywords from
    :param num_keywords: Maximum number of keywords to return
    :param interest_terms: List of terms to filter keywords (optional)
    :return: List of filtered keywords
    """
    # Initialize RAKE by providing a set of stopwords
    r = Rake(stopwords=stopwords.words('english'))
    
    # Extract keywords
    r.extract_keywords_from_text(text)
    
    # Get the ranked phrases with scores
    ranked_phrases = r.get_ranked_phrases_with_scores()
    
    # Filter keywords if interest terms are provided
    if interest_terms:
        filtered_keywords = [
            phrase for (score, phrase) in ranked_phrases
            if any(term.lower() in phrase.lower() for term in interest_terms)
        ]
    else:
        # If no interest terms, use all extracted phrases
        filtered_keywords = [phrase for (score, phrase) in ranked_phrases]
    
    # Get the top num_keywords phrases
    keywords = filtered_keywords[:num_keywords]
    
    return keywords

def fetch_from_dblp(author_name):
    """
    Fetch publication details from the DBLP API.

    Parameters:
    author_name (str): The author's name to search for.

    Returns:
    list: A list of publications.
    """
    base_url = "https://dblp.org/search/publ/api"
    query = f"author:{urllib.parse.quote(author_name)}"
    params = {"q": query, "format": "json"}

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()
        publications = data.get("result", {}).get("hits", {}).get("hit", [])

        result = []
        for publication in publications:
            info = publication.get("info", {})
            result.append({
                "Title": info.get("title", "N/A"),
                "Year": info.get("year", "N/A"),
                "Journal": info.get("venue", "N/A"),
                "Citations": info.get("numCitations", "N/A"),
                "Source": "DBLP"
            })
        return result

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from DBLP: {e}")
        return []

def fetch_from_google_scholar(author_name):
    """
    Fetch author details from Google Scholar using the scholarly module.

    Parameters:
    author_name (str): The author's name to search for.

    Returns:
    dict: Author details including publications.
    """
    search_query = scholarly.search_author(author_name)
    author = next(search_query, None)

    if not author:
        return {}

    author = scholarly.fill(author)

    publications = []
    for pub in author.get("publications", []):
        scholarly.fill(pub)
        publications.append({
            "Title": pub.get("bib", {}).get("title"),
            "Year": pub.get("bib", {}).get("pub_year"),
            "Journal": pub.get("bib", {}).get("journal"),
            "Citations": pub.get("num_citations"),
            "Abstract": pub.get("bib", {}).get("abstract", "N/A"),
            "Source": "Google Scholar"
        })

    author_details = {
        "Name": author.get("name"),
        "Affiliation": author.get("affiliation"),
        "Interests": author.get("interests"),
        "Citations": author.get("citedby"),
        "H-index": author.get("hindex"),
        "i10-index": author.get("i10index"),
        "Publications": publications
    }

    return author_details

def normalize_title(title):
    """
    Normalize the title by removing spaces, special characters, and converting to lowercase.

    Parameters:
    title (str): The title to normalize.

    Returns:
    str: The normalized title.
    """
    return re.sub(r'[^a-zA-Z0-9]', '', title).lower()

def remove_duplicates(publications):
    """
    Remove duplicate publications based on title, keeping the entry from Google Scholar.

    Parameters:
    publications (list): List of publication dictionaries.

    Returns:
    list: List of unique publication dictionaries.
    """
    seen_titles = {}
    unique_publications = []
    for pub in publications:
        title = pub.get("Title")
        source = pub.get("Source")
        if title:
            normalized_title = normalize_title(title)
            if normalized_title not in seen_titles or seen_titles[normalized_title] == "DBLP":
                if normalized_title in seen_titles:
                    unique_publications = [p for p in unique_publications if normalize_title(p.get("Title")) != normalized_title]
                seen_titles[normalized_title] = source
                unique_publications.append(pub)
    return unique_publications

def fetch_and_store_author_details(name):
    """
    Fetch author details from DBLP and Google Scholar, combine the data, and store it in MongoDB.

    Parameters:
    name (str): The author's name.

    Returns:
    dict: Combined author details and publications.
    """
    dblp_publications = fetch_from_dblp(name)
    scholar_details = fetch_from_google_scholar(name)

    combined_publications = dblp_publications + scholar_details.get("Publications", [])
    unique_publications = remove_duplicates(combined_publications)

    # Extract keywords and update interests
    all_keywords = []
    INTEREST_TERMS=scholar_details["Interests"]
    for pub in unique_publications:
        abstract = pub.pop("Abstract", None)
        if abstract:
            all_keywords.extend(list(set(extract_keywords(abstract, interest_terms=INTEREST_TERMS))))

    scholar_details["Interests"].extend(all_keywords)

    filtered_data = {
        "Name": scholar_details.get("Name", name),
        "Affiliation": scholar_details.get("Affiliation", "N/A"),
        "Interests": scholar_details.get("Interests", []),
        "Citations": scholar_details.get("Citations", "N/A"),
        "H-index": scholar_details.get("H-index", "N/A"),
        "i10-index": scholar_details.get("i10-index", "N/A"),
        "Publications": unique_publications
    }

    # Check if the name already exists in the database before inserting
    existing_record = check_name_in_database(name)
    if existing_record:
        print("Name already exists in the database. Updating existing record.")
        collection.update_one({"_id": existing_record["_id"]}, {"$set": filtered_data})
        filtered_data["_id"] = str(existing_record["_id"])
    else:
        print("Name not found in the database. Inserting new record.")
        inserted_id = collection.insert_one(filtered_data).inserted_id
        filtered_data["_id"] = str(inserted_id)

    return filtered_data

if __name__ == "__main__":
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client["my_database"]
    collection = db["my_collection"]

    # Take user input
    name_to_check = input("Enter the author's name: ")

    # Check if the name exists in the database
    record = check_name_in_database(name_to_check)

    if record:
        print("Name found in database. Here are the details:")
        print(json.dumps(record, indent=4, cls=JSONEncoder))
    else:
        print("Name not found in database. Fetching details from external sources...")
        new_data = fetch_and_store_author_details(name_to_check)
        print("Details fetched and stored in the database. Here are the details:")
        print(json.dumps(new_data, indent=4, cls=JSONEncoder))

