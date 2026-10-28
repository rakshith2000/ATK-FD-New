# Author - Vishwas K S
# Created On - June 09, 2026

# Default packages
import os
import sys
import logging
import datetime
import html as html_lib

# Third party packages
from bs4 import BeautifulSoup

# Global variables
SCRIPT_PATH = os.path.dirname(__file__)
ROOT_PATH = SCRIPT_PATH.split("modules")[0]
DB_PATH = os.path.join(ROOT_PATH, "database")
MCP_PATH = os.path.join(ROOT_PATH, "mcp_servers")
EMBEDDING_MODEL_PATH = os.path.join(ROOT_PATH, "embedding_model", "model")

sys.path.append(SCRIPT_PATH)
sys.path.append(ROOT_PATH)
sys.path.append(DB_PATH)
sys.path.append(MCP_PATH)

# Custom packages
import core_crud
import db_session
import db_models

import system_config_ka as scf
from servicenow_mcp import ServiceNow
from embedding_model.embedding_service import Embedder

from pro_logger import log_event, application_logger

MODULE_NAME = "knowledge_assist"


def display_val(field, key = "display_value"):
    """Extract string from a sysparm_display_value=all dict, or return as-is."""
    if isinstance(field, dict):
        return field.get(key, "") or field.get("value", "")
    return field or ""


def html_to_text(html):
    html = html_lib.unescape(html)
    try:
        soup = BeautifulSoup(html, "lxml")
    except Exception:
        soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["style", "script", "head", "title", "meta", "link"]):
        tag.decompose()

    return soup.get_text(separator = "\n", strip = True)


def get_kb_roles_mapping(itsm_obj, itsm_details, kb_base_ids):
    """Fetch read roles for given KB base sys_ids from kb_uc_can_read_mtom."""
    if not kb_base_ids:
        return {}

    base_url = itsm_details.itsm_url.rstrip("/")
    query = ",".join(kb_base_ids)
    target_url = (
        f"{base_url}/api/now/table/kb_uc_can_read_mtom"
        f"?sysparm_query=kb_knowledge_baseIN{query}"
        f"&sysparm_fields=user_criteria.role,kb_knowledge_base.sys_id"
        f"&sysparm_display_value=true"
        f"&sysparm_exclude_reference_link=true"
    )

    kb_roles = {kb_id: [] for kb_id in kb_base_ids}

    try:
        response = itsm_obj._request(
            "get", target_url, itsm_details,
            headers = {"content-type": "application/json"}, verify = False,
        )

        for role in response.json().get("result", []):
            kb_sys_id = role.get("kb_knowledge_base.sys_id")
            if kb_sys_id in kb_roles:
                kb_roles[kb_sys_id].append(role.get("user_criteria.role", ""))

    except Exception as e:
        log_event(
            application_logger, logging.ERROR,
            f"Error fetching KB roles - {str(e)}",
            is_exception = True,
            module_name = MODULE_NAME,
            component_type = "kb_sync",
            component_name = "kb_sync - get_kb_roles_mapping",
        )

    return kb_roles


def run_kb_sync(sync_mode = "incremental", days = 1):
    """
    Sync ServiceNow KB articles into the local vector database.

    Args:
        sync_mode: "initial" for full sync, "incremental"/"scheduled" for delta sync.
        days: Look-back window (in days) for delta sync. Articles created after
              (now - days) are fetched. Ignored for "initial" sync.
    """
    configs = scf.get_system_config()
    itsm_tags = configs.get("itsm_tags", [])

    if not itsm_tags:
        log_event(
            application_logger, logging.ERROR,
            "No ITSM tags configured for knowledge_assist. Cannot proceed.",
            module_name = MODULE_NAME,
            component_type = "kb_sync",
            component_name = "kb_sync - run_kb_sync",
        )
        return

    itsm_tags_str = ",".join(itsm_tags)
    itsm_obj = ServiceNow()

    # Resolve ITSM connector details and service account user
    db_local_session = db_session.get_db()
    itsm_details = core_crud.get_itsm_connector_details_with_creds(db_local_session, itsm_tags[0])
    db_local_session.close()

    if not itsm_details:
        log_event(
            application_logger, logging.ERROR,
            f"ITSM connector details not found for tag: {itsm_tags[0]}",
            module_name = MODULE_NAME,
            component_type = "kb_sync",
            component_name = "kb_sync - run_kb_sync",
        )
        return

    sync_user = itsm_details.itsm_user
    base_url = itsm_details.itsm_url.rstrip("/")

    # For delta sync ("incremental"/"scheduled"), only fetch articles created
    # after (now - days). Not applicable for a full "initial" sync.
    date_filter = None
    if sync_mode != "initial":
        date_filter = (
            datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days = days)
        ).strftime("%Y-%m-%d %H:%M:%S")

    # Fetch published articles from ServiceNow using existing ServiceNow method
    (status, articles) = itsm_obj.list_knowledge_articles(
        itsm_tags = itsm_tags_str, user = sync_user, module_name = MODULE_NAME,
        date_filter = date_filter,
    )

    if not status or not articles:
        log_event(
            application_logger, logging.WARNING,
            f"No knowledge articles fetched from ServiceNow (status={status}).",
            module_name = MODULE_NAME,
            component_type = "kb_sync",
            component_name = "kb_sync - run_kb_sync",
        )
        return

    # Build KB base roles mapping from kb_uc_can_read_mtom
    kb_base_ids = set()
    for article in articles:
        kb_id = display_val(article.get("kb_knowledge_base", ""), key = "value")
        if kb_id:
            kb_base_ids.add(kb_id)

    kb_roles_map = get_kb_roles_mapping(itsm_obj, itsm_details, kb_base_ids)

    # Initialise embedder
    em_obj = Embedder(EMBEDDING_MODEL_PATH)
    em_obj.download_if_not_present()

    db_local_session = db_session.get_db()

    # Current ServiceNow KB numbers
    current_kb_numbers = [display_val(a.get("number", "")) for a in articles]
    current_kb_numbers = [n for n in current_kb_numbers if n]

    if sync_mode != "initial" and not date_filter and current_kb_numbers:
        try:
            db_local_session.query(db_models.KnowledgeArticleInventory).filter(
                ~db_models.KnowledgeArticleInventory.kb_metadata["number"].astext.in_(current_kb_numbers)
            ).delete(synchronize_session = "fetch")
            db_local_session.commit()
        except Exception as e:
            db_local_session.rollback()
            log_event(
                application_logger, logging.ERROR,
                f"Error deleting stale KB articles - {str(e)}",
                is_exception = True,
                module_name = MODULE_NAME,
                component_type = "kb_sync",
                component_name = "kb_sync - run_kb_sync",
            )

    for article in articles:
        text = display_val(article.get("text", ""))
        if not text:
            continue

        text = html_to_text(text)
        short_desc = display_val(article.get("short_description", ""))
        article_number = display_val(article.get("number", ""))
        article_sys_id = display_val(article.get("sys_id", ""), key = "value")
        kb_base_display = display_val(article.get("kb_knowledge_base", ""))
        kb_base_sys_id = display_val(article.get("kb_knowledge_base", ""), key = "value")

        content = f"Short Description - {short_desc}\n\nContent - \n{text}"

        metadata = {
            "number": article_number,
            "kb_knowledge_base": kb_base_display,
            "kb_category": display_val(article.get("kb_category", "")),
            "author": display_val(article.get("author", "")),
            "rating": display_val(article.get("rating", "")),
            "title": short_desc,
            "kb_link": f"{base_url}/now/nav/ui/classic/params/target/kb_view.do%3Fsys_kb_id%3D{article_sys_id}",
            "roles": kb_roles_map.get(kb_base_sys_id, []),
        }

        # Generate the embedding BEFORE touching the DB, so a failure here does
        # not leave us having deleted the old record without a replacement.
        (emb_status, embedding) = em_obj.embed(content)
        if not emb_status:
            log_event(
                application_logger, logging.ERROR,
                f"Embedding generation failed for {article_number} - {embedding}",
                module_name = MODULE_NAME,
                component_type = "kb_sync",
                component_name = "kb_sync - run_kb_sync",
            )
            continue

        # Idempotent upsert: unconditionally delete any existing copy of this KB
        # (a no-op when absent) and insert the fresh version in a single
        # transaction so re-syncs never accumulate duplicates.
        try:
            if article_number:
                db_local_session.query(db_models.KnowledgeArticleInventory).filter(
                    db_models.KnowledgeArticleInventory.kb_metadata["number"].astext == article_number
                ).delete(synchronize_session = "fetch")

            record = db_models.KnowledgeArticleInventory(
                content = content,
                embedding = embedding,
                kb_metadata = metadata,
            )
            db_local_session.add(record)
            db_local_session.commit()
        except Exception as e:
            db_local_session.rollback()
            log_event(
                application_logger, logging.ERROR,
                f"Error upserting KB {article_number} into DB - {str(e)}",
                is_exception = True,
                module_name = MODULE_NAME,
                component_type = "kb_sync",
                component_name = "kb_sync - run_kb_sync",
            )

    db_local_session.close()

    log_event(
        application_logger, logging.INFO,
        f"KB sync completed - mode: {sync_mode}",
        module_name = MODULE_NAME,
        component_type = "kb_sync",
        component_name = "kb_sync - run_kb_sync",
    )

if __name__ == "__main__":
    sync_mode = sys.argv[1] if len(sys.argv) > 1 else "incremental"
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    if sync_mode == "initial":
        db_models.create_tables()

    run_kb_sync(sync_mode = sync_mode, days = days)
