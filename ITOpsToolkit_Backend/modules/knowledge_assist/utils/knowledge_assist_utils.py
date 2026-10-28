# Author - Viraj Purandare
# Created On - May 12, 2026

# Default packages
import re
import os
import sys
import ast
import json
import logging
import datetime
import html as html_lib
from collections import defaultdict

# Third party packages
import numpy as np
from bs4 import BeautifulSoup
from sklearn.metrics.pairwise import cosine_similarity

# Global variables
SCRIPT_PATH = os.path.dirname(__file__)
ROOT_PATH = SCRIPT_PATH.split("modules")[0]
DB_PATH = os.path.join(ROOT_PATH, "database")
MCP_PATH = os.path.join(ROOT_PATH, "mcp_servers")

TS_FORMAT = "%Y-%m-%d %H:%M:%S"

sys.path.append(SCRIPT_PATH)
sys.path.append(ROOT_PATH)
sys.path.append(MCP_PATH)

# Custom packages
import core_crud
import db_session

import knowledge_assist_agent

import system_config_ka as scf
from servicenow_mcp import ServiceNow

from pro_logger import log_event, application_logger

# Knowledge assist functionalities
class KnowledgeAssistUtils:
    def __init__(self):
        # Tag duplicate threshold to knowledge articles
        db_local_session = db_session.get_db()

        (status, duplicate_article_threshold) = core_crud.get_module_configurations(db_local_session, "knowledge_assist", "DUPLICATE_ARTICLE_THRESHOLD")
        if status and duplicate_article_threshold:
            threshold_val = duplicate_article_threshold[0].value
            if isinstance(threshold_val, list):
                threshold_val = threshold_val[0]
            self.duplicate_article_threshold = float(threshold_val)
        else:
            self.duplicate_article_threshold = 0.9

        (status, incident_timeline) = core_crud.get_module_configurations(db_local_session, "incident_assist", "INCIDENT_TIMELINE")
        if status and incident_timeline:
            timeline_val = incident_timeline[0].value
            if isinstance(timeline_val, list):
                timeline_val = timeline_val[0]
            self.incident_timeline = int(timeline_val)
        else:
            self.incident_timeline = 7
                
        db_local_session.close()

    def html_to_text(self, html: str) -> str:

        html = html_lib.unescape(html)  

        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception:
            soup = BeautifulSoup(html, "html.parser")

        for tag in soup(["style", "script", "head", "title", "meta", "link"]):
            tag.decompose() 

        return soup.get_text(separator="\n", strip=True)

    # Merge knowledge articles
    async def merge_kb_articles(self, kb_article_1, kb_article_2, token):      
        configs = scf.get_system_config()
        sys_prompts_config = configs["sys_prompts_config"]
        pra_sys_prompt = sys_prompts_config.get("article_merger_agent", None)
        (description, instruction) = scf.apply_system_prompt_guardrail(pra_sys_prompt)

        query = f"{instruction} \n\n"
        query += "Merge 2 knowledge articles given below - \n\n"
        query += f"----------------\nArticle 1\n----------------\n{self.html_to_text(kb_article_1)}\n\n"
        query += f"----------------\nArticle 2\n----------------\n{self.html_to_text(kb_article_2)}"


        output = await knowledge_assist_agent.run_article_merger_agent(query, token)

        if output:
            output = "{" + "}".join("{".join(output.strip().split("{")[1:]).strip().split("}")[:-1]) + "}"
            output = json.loads(output)

            output_dict = {}
            output_dict["title"] = output.get("title", "")
            output_dict["merged_article"] = re.sub(r"^```html\s*|\s*```$", "", output["merged_article"].strip()) + f"\n<span>Reference Articles: {kb_article_1}, {kb_article_2}</span>"
            output_dict["details"] = output["details"]


            return (True, output_dict)
        else:
            return (False, "Please investigate agentic logs.")

# Refine knowledge article
    async def refine_kb_article(self, input_kb_article, token):
        configs = scf.get_system_config()
        sys_prompts_config = configs["sys_prompts_config"]
        pra_sys_prompt = sys_prompts_config.get("article_refinement_agent", None)
        (description, instruction) = scf.apply_system_prompt_guardrail(pra_sys_prompt)

        query = f"{instruction} \n\n"
        query += f"Refine the following input knowledge article - \n\n{self.html_to_text(input_kb_article)}"
        # Returns {"refined_article": "<html>"} from the refiner.
        output = await knowledge_assist_agent.run_article_refiner_agent(query, token)

        if output:
            output = "{" + "}".join("{".join(output.strip().split("{")[1:]).strip().split("}")[:-1]) + "}"
            output = json.loads(output)

            output_dict = {}
            output_dict["refined_article"] = re.sub(r"^```html\s*|\s*```$", "", output["refined_article"].strip())

            return (True, output_dict["refined_article"])
        else:
            return (False, "Please investigate agentic logs.")
 
    # Generate knowledge article
    async def generate_kb_article(self, topic_contents, token):
        configs = scf.get_system_config()
        sys_prompts_config = configs["sys_prompts_config"]
        pra_sys_prompt = sys_prompts_config.get("article_generation_agent", None)
        (description, instruction) = scf.apply_system_prompt_guardrail(pra_sys_prompt)

        query = f"{instruction} \n\n"
        query += f"Generate detailed knowledge article for below sericenow incident - \n\n"
        query += f"Short description -\n{topic_contents.get('short_description')}\n\n"

        if "description" in topic_contents:
            query += f"Description -\n{topic_contents.get('description')}\n\n"

        if "work_notes_and_comments" in topic_contents:
            query += f"Diagnostics/Troubleshooting -\n{topic_contents.get('work_notes_and_comments')}\n\n"

        query += f"Resolution notes -\n{topic_contents.get('resolution_notes')}"

        output = await knowledge_assist_agent.run_article_generation_agent(query, token)

        if output:
            output = "{" + "}".join("{".join(output.strip().split("{")[1:]).strip().split("}")[:-1]) + "}"
            output = json.loads(output)

            output_dict = {}
            output_dict["title"] = output.get("title", "")
            output_dict["generated_article"] = re.sub(r"^```html\s*|\s*```$", "", output["generated_article"].strip())

            return (True, output_dict)
        else:
            return (False, "Please investigate agentic logs.")

    # Retrieve knowledge articles by roles
    def retrieve_knowledge_articles_by_roles(self, user_info):
        db_local_session = db_session.get_db()

        configs = scf.get_system_config()
        itsm_tags = ",".join(configs["itsm_tags"])

        itsm_obj = ServiceNow()
        (status, roles) = itsm_obj.list_user_roles(itsm_tags = itsm_tags, user = user_info.user_id, module_name = "knowledge_assist")
 
        if not status:
            db_local_session.close()
            return (False, "User roles not setup in ServiceNow.")

        if roles:
            roles.append("")

        (status, db_articles) = core_crud.list_articles_by_roles(db_local_session, roles)
        db_local_session.close()
        return (status, db_articles)

    # Group duplicates based on cosine similarity
    def cosine_similarity_operation(self, data):
        content = [row.get("content") for row in data]
        embeddings = np.array([row.get("embedding") for row in data])
        kb_metadata = [row.get("kb_metadata") for row in data]
 
        similarity_matrix = cosine_similarity(embeddings)
        duplicates = []
        num_articles = len(data)

        if num_articles < 2:
            return (True, [])
        try:
            # Traversal through similarity matrix
            for i in range(num_articles):
                for j in range(i + 1, num_articles):
                    sim_score = similarity_matrix[i][j]
                    
                    if sim_score > self.duplicate_article_threshold:
                        duplicates.append({
                            kb_metadata[i]["number"]: { 
                                "content": content[i],
                                "kb_metadata": kb_metadata[i]
                                },
                            kb_metadata[j]["number"]: { 
                                "content": content[j],
                                "kb_metadata": kb_metadata[j]
                            }
                        })

        except Exception as e:
            # Application logging
            log_event(application_logger,
                      logging.ERROR,
                      f"Duplicate article analysis failed - {str(e)}",
                      is_exception = True,
                      module_name = "knowledge_assist",
                      component_type = "app_utils_execution",
                      component_name = "knowledge_assist_utils - cosine_similarity_operation")

            return (False, f"Duplicate article analysis failed - {str(e)}")
            
        return (True, duplicates)

    # Find duplicate articles
    def find_duplicate_articles(self, user_info):
        (status, db_articles) = self.retrieve_knowledge_articles_by_roles(user_info)

        if not status:
            return (status, db_articles)

        if db_articles == []:
            return (True, db_articles)

        # Group knowledge articles by categories
        unique_categories = list(set(d.get("kb_metadata", {}).get("kb_category") for d in db_articles))
        
        duplicate_data = []
        for category in unique_categories:
            # Find duplicates per category
            filtered_items = [item for item in db_articles if item.get("kb_metadata", {}).get("kb_category") == category]
            (status, duplicates) = self.cosine_similarity_operation(filtered_items)

            if not status:
                return (status, duplicates)

            category_data = {}
            if duplicates:
                category_data[category] = duplicates    
                duplicate_data.append(category_data)

        return (True, duplicate_data)

    # Filter incidents from ITSM and compare with Vector DB to find incidents without knowledge articles
    def filter_incs_without_kbs(self, user_info):
        db_local_session = db_session.get_db()

        configs = scf.get_system_config()
        itsm_tags = ",".join(configs["itsm_tags"])
        itsm_obj = ServiceNow()

        # List incidents of last x days (based on incident timeline from ITSM)
        (status, user_details) = itsm_obj.get_user_details(itsm_tags = itsm_tags, user = user_info.user_id)
        user_sys_id = user_details.get("sys_id")

        conditions = []
        conditions.append({"param": "state", "op": "IN", "val": "6,7"})
        conditions.append({"param": "sys_updated_on", "op": ">=", "val": f"javascript:gs.daysAgoStart({self.incident_timeline})"})
        conditions.append({"param": "assigned_to", "op": "=", "val": user_sys_id})
        (status, inc_details) = itsm_obj.list_ticket_details(itsm_tags, "incident", conditions = conditions, module_name = "knowledge_assist")
    
        if not status:
            db_local_session.close()
            return (status, inc_details)
        
        incs_without_kbs = []

        for inc in inc_details:
            query = ""
            query += inc.get("short_description", "")
            query += "\n\n" + inc.get("description", "")
            query += "\n\n" + inc.get("close_notes", "")

            (status, articles) = core_crud.list_articles_by_similarity(db_local_session, query, limit = 3)

            if not status:
                db_local_session.close()
                return (status, articles)    
    
            if len(articles) == 0:
                incs_without_kbs.append(inc)

        db_local_session.close()
        return (True, incs_without_kbs)

    # Knowledge article draft creation in ITSM
    def push_knowledge_article_to_itsm(self, payload, user_info):
        configs = scf.get_system_config()
        itsm_tags = ",".join(configs["itsm_tags"])
        itsm_obj = ServiceNow()

        (status, data) = itsm_obj.create_knowledge_article(itsm_tags = itsm_tags, user_id = user_info.user_id, short_description = payload.short_description, 
                                                           text = payload.text, kb_knowledge_base = payload.kb_knowledge_base, kb_category = payload.kb_category, 
                                                           module_name = "knowledge_assist")

        return (status, data)
    
    # Knowledge base category retrieval
    def list_knowledge_base_categories_from_itsm(self, user_info):
        configs = scf.get_system_config()
        itsm_tags = ",".join(configs["itsm_tags"])
        itsm_obj = ServiceNow()

        (status, data) = itsm_obj.list_knowledge_base_categories(itsm_tags = itsm_tags, user = user_info.user_id, module_name = "knowledge_assist")

        return (status, data)

    # Retrieve published knowledge articles from ITSM
    def list_knowledge_articles_from_itsm(self, user_info):
        configs = scf.get_system_config()
        itsm_tags = ",".join(configs["itsm_tags"])
        itsm_obj = ServiceNow()

        (status, data) = itsm_obj.list_knowledge_articles(itsm_tags = itsm_tags, user = user_info.user_id, module_name = "knowledge_assist")

        return (status, data)

    # Last x knowledge articles pushed to ITSM
    def list_recent_knowledge_articles_from_itsm(self, user_info):
        configs = scf.get_system_config()
        itsm_tags = ",".join(configs["itsm_tags"])
        itsm_obj = ServiceNow()

        (status, data) = itsm_obj.list_recent_knowledge_articles(itsm_tags = itsm_tags, user = user_info.user_id, module_name = "knowledge_assist")

        return (status, data)
         
    # Knowledge article draft update in ITSM
    def update_knowledge_article_in_itsm(self, payload, user_info):
        configs = scf.get_system_config()
        itsm_tags = ",".join(configs["itsm_tags"]) 
        itsm_obj = ServiceNow()

        (status, data) = itsm_obj.update_knowledge_article(itsm_tags = itsm_tags, user_id = user_info.user_id, number = payload.number,
                                                           text = payload.text, short_description = payload.short_description, kb_knowledge_base = "",
                                                           kb_category = "", module_name = "knowledge_assist")

        return (status, data)
