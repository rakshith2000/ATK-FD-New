# Author - Viraj Purandare
# Created On - October 8, 2025

# Default packages
import os
import sys
import logging
from typing import Annotated
from pydantic import Field

import yaml
import base64

# Third party packages
from litellm import completion
from agent_framework import tool, MCPStreamableHTTPTool

import litellm

from contextlib import asynccontextmanager
# litellm._turn_on_debug()

# Global variables
SCRIPT_PATH = os.path.dirname(__file__)
CONFIG_PATH = os.path.join(SCRIPT_PATH.split("utils")[0], "config")
ROOT_PATH = SCRIPT_PATH.split("modules")[0].strip()

sys.path.append(SCRIPT_PATH)
sys.path.append(ROOT_PATH)

# Custom packages
import system_config_ca as scf

from llm import LLM

from pro_logger import log_event, application_logger

# Tool to analyze image
@tool#(name="image_analyzer", description="Given image name and default system prompt for the tool, provides professional analysis of image.")
def analyze_image(
    image_name: Annotated[str, Field(description="Name of the image file to analyze")], 
    system_prompt: Annotated[str, Field(description="System prompt guiding the analysis")] 
) -> str:
 
    # Obtain configurations
    configs = scf.get_system_config()
    sys_prompts_config = configs["sys_prompts_config"]

    if sys_prompts_config == None:
        return "Guardrail note - System prompts not defined for any tool. Cannot proceed with the action. Contact developer."

    # Get LLM model and Override default system prompt if configured for tool
    aiaa_sys_prompt = sys_prompts_config.get("architecture_image_analyzer_tool", None)

    if aiaa_sys_prompt and (
            aiaa_sys_prompt.get("description", None) == None and aiaa_sys_prompt.get("instruction", None) == None or
            aiaa_sys_prompt.get("description").strip() == "" and aiaa_sys_prompt.get("instruction") == ""
            ):
        pass
    else:
        description = aiaa_sys_prompt.get("description", "")
        instruction = aiaa_sys_prompt.get("instruction", "")
        system_prompt = f"Purpose: {description}\n\nInstructions:\n{instruction}"

    llm_tag = aiaa_sys_prompt.get("llm_tag", configs["llm_tag"])

    llm_obj = LLM()
    llm_obj.set_litellm_environment(llm_tag)

    if not llm_obj.model:
        return "ERROR: Model not configured for ArchitectureImageAnalyzerTool. Configure valid model."

    # Encode image to base64 model
    image_path = os.path.join(ROOT_PATH, "temp", image_name)

    try:
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
           
    except Exception as e:
       
        # Application logging
        log_event(application_logger,
                  logging.ERROR,
                  str(e),
                  is_exception = True,
                  module_name = "change_assist",
                  component_type = "app_tool_execution",
                  component_name = "change_assist_tools - analyze_image")
        return ""
    
    formatted_url = f"data:image/png;base64,{encoded_string}"
    messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": system_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": formatted_url
                            }
                        }
                    ]
                }
            ]
    try:
        response = completion(
                model = llm_obj.model,
                messages = messages
                )
        # print("[IMAGE_ANALYSIS_RESPONSE]\n\n\n", response)
    except Exception as e:
        # print(str(e))
        # Application logging
        log_event(application_logger,
                  logging.ERROR,
                  str(e),
                  is_exception = True,
                  module_name = "change_assist",
                  component_type = "app_tool_execution",
                  component_name = "change_assist_tools - analyze_image")

    # return response
  
    return response.choices[0].message["content"]

# Tool to obtain architecture topology from ITSM CMDB
def get_servicenow_architecture_topology_insight(auth_token):
    """
        Call to internal ServiceNow MCP server
    """
    try:
        tool = MCPStreamableHTTPTool(
            name = "Servicenow MCP",
            url = "http://127.0.0.1:8000/mcp",#"https://demoadk.intelligentservicedeliveryplatform.com:9876/mcp",
            header_provider = lambda kwargs: {"Authorization": f"Bearer {auth_token}"},
        )
    
        
    except Exception as e:
        # Application logging
        log_event(application_logger,
                  logging.ERROR,
                  str(e),
                  is_exception = True,
                  module_name = "change_assist",
                  component_type = "app_tool_execution - MCP",
                  component_name = "change_assist_tools - get_servicenow_architecture_topology_insight")

