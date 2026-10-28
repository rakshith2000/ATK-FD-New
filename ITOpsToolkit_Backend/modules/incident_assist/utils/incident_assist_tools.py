# Author - Vishwas K S
# Created On - MAY 27, 2026

# Default packages
import os
import sys
import logging
from typing import Annotated
from pydantic import Field

import core_crud
import db_session

from agent_framework import tool

# Global variables
SCRIPT_PATH = os.path.dirname(__file__)
CONFIG_PATH = os.path.join(SCRIPT_PATH.split("utils")[0], "config")
ROOT_PATH = SCRIPT_PATH.split("modules")[0].strip()

sys.path.append(SCRIPT_PATH)
sys.path.append(ROOT_PATH)


from pro_logger import log_event, application_logger

def list_similar_articles(query):
    db_local_session = db_session.get_db()
    (status, similar_articles) = core_crud.list_articles_by_similarity(db_local_session, query)
    db_local_session.close()

    if not status:
        return [{"relevant_articles": "Similar articles listing failed"}]
    
    elif similar_articles == []:
        return [{"relevant_articles":"No relative articles found"}]
    
    else:
        return similar_articles
    
@tool(name = "list_similar_articles", description = "Searches the knowledge base and retrieves relevant articles based on the user's query.")
def list_similar_articles_tools(
    query: Annotated[
        str,
        "The user's question or topic to search for in the knowledge base. "
        "Should be a concise, descriptive phrase capturing the core issue or subject. "
    ]
) -> Annotated[list[dict], "A list of relevant knowledge base articles ranked by similarity to the query. " ]:
    return list_similar_articles(query)