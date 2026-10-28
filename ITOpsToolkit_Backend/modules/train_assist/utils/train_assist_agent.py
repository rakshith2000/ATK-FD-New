# Author - Vishwas K S and Viraj Purandare
# Created On - May 6, 2026

# Default packages
import os
import sys
import logging

# Third party packages
from llm_guard import scan_prompt, scan_output
from llm_guard.input_scanners import Toxicity as InpToxicity, Gibberish as InpGibberish, BanCode as InpBanCode, PromptInjection, Anonymize, Secrets
from llm_guard.input_scanners.prompt_injection import MatchType as InpPIMatchType
from llm_guard.input_scanners.toxicity import MatchType as InpToxMatchType
from llm_guard.input_scanners.gibberish import MatchType as InpGibMatchType
from llm_guard.output_scanners import Toxicity as OutToxicity, Gibberish as OutGibberish, BanCode as OutBanCode, Deanonymize, Bias#, MaliciousURLs
from llm_guard.output_scanners.toxicity import MatchType as OutToxMatchType
from llm_guard.output_scanners.gibberish import MatchType as OutGibMatchType
from llm_guard.output_scanners.bias import MatchType as OutBiasMatchType
from llm_guard.vault import Vault

# Global variable and paths
SCRIPT_PATH = os.path.dirname(__file__)
CONFIG_PATH = os.path.join(SCRIPT_PATH.split("utils")[0], "config")
ROOT_PATH = os.path.join(SCRIPT_PATH.split("modules")[0])
AUTH_PATH = os.path.join(ROOT_PATH, "modules", "auth", "utils")

sys.path.append(ROOT_PATH)
sys.path.append(AUTH_PATH)

# Custom packages
from llm import LLM
import system_config_ta as scf
from usage_tracker import track_llm_tokens
from auth_handler import get_user_info_supplementary
from pro_logger import log_event, application_logger

def quiz_generation_agent(sys_prompts_config):
    configs = scf.get_system_config()
    mcq_sys_prompt = sys_prompts_config.get("quiz_generation_agent", None)
    (description, instruction) = scf.apply_system_prompt_guardrail(mcq_sys_prompt)

    llm_tag = mcq_sys_prompt.get("llm_tag", configs["llm_tag"])

    llm_obj = LLM()
    llm_obj.set_litellm_environment(llm_tag)
    client = llm_obj.client

    if not client:
        log_str = "ERROR: Model not configured for QuizGenerationAgent. Configure valid model."
        log_event(application_logger,
                  logging.ERROR,
                  log_str,
                  module_name="train_assist",
                  component_type="app_agent_execution",
                  component_name="quiz_generation_agent")
        return log_str

    client._default_options["temperature"] = 0.0

    return client.create_agent(
        name="QuizGenerationAgent",
        instructions=instruction,
        description=description,
        require_per_service_call_history_persistence=True
    ), client


def scenario_generation_agent(sys_prompts_config):
    configs = scf.get_system_config()
    scenario_sys_prompt = sys_prompts_config.get("scenario_generation_agent", None)
    (description, instruction) = scf.apply_system_prompt_guardrail(scenario_sys_prompt)

    llm_tag = scenario_sys_prompt.get("llm_tag", configs["llm_tag"])

    llm_obj = LLM()
    llm_obj.set_litellm_environment(llm_tag)
    client = llm_obj.client

    if not client:
        log_str = "ERROR: Model not configured for ScenarioGenerationAgent. Configure valid model."
        log_event(application_logger,
                  logging.ERROR,
                  log_str,
                  module_name="train_assist",
                  component_type="app_agent_execution",
                  component_name="scenario_generation_agent")
        return log_str

    return client.create_agent(
        name="ScenarioGenerationAgent",
        instructions=instruction,
        description=description,
        require_per_service_call_history_persistence=True
    ), client

def quiz_summary_agent(sys_prompts_config):
    configs = scf.get_system_config()
    quiz_summary_sys_prompt = sys_prompts_config.get("quiz_summary_agent", None)
    (description, instruction) = scf.apply_system_prompt_guardrail(quiz_summary_sys_prompt)

    llm_tag = quiz_summary_sys_prompt.get("llm_tag", configs["llm_tag"])

    llm_obj = LLM()
    llm_obj.set_litellm_environment(llm_tag)
    client = llm_obj.client

    if not client:
        log_str = "ERROR: Model not configured for QuizSummaryAgent. Configure valid model."
        log_event(application_logger,
                  logging.ERROR,
                  log_str,
                  module_name="train_assist",
                  component_type="app_agent_execution",
                  component_name="quiz_summary_agent")
        return log_str

    # No schema — this agent returns free-form mentoring and feedback text.

    return client.create_agent(
        name="QuizSummaryAgent",
        instructions=instruction,
        description=description,
        require_per_service_call_history_persistence=True
    ), client

async def quiz_generation(query, token):
    user_id = get_user_info_supplementary(token)["user_id"]

    configs = scf.get_system_config()
    sys_prompts_config = configs["sys_prompts_config"]

    if sys_prompts_config is None:
        log_str = "Guardrail note - System prompts not defined for any agent. Cannot proceed with the action. Contact developer."
        log_event(application_logger,
                  logging.ERROR,
                  log_str,
                  module_name="train_assist",
                  component_type="app_agent_execution",
                  component_name="train_assist_agent - run_quiz_generation")
        return log_str
    
    llm_guards = configs["llm_guards"]

    result = quiz_generation_agent(sys_prompts_config=sys_prompts_config)
    if isinstance(result, str):
        return result
    QuizGenerationAgent, quiz_client = result

    vault = Vault()
    input_llm_guard_dict = {
        "toxicity": InpToxicity(threshold = 0.5, match_type = InpToxMatchType.SENTENCE),
        "gibberish": InpGibberish(match_type = InpGibMatchType.FULL),
        "bancode": InpBanCode(),
        "prompt_injection": PromptInjection(threshold = 0.5, match_type = InpPIMatchType.FULL),
        "anonymization": Anonymize(vault)
    }

    output_llm_guard_dict = {
        "toxicity": OutToxicity(threshold = 0.5, match_type = OutToxMatchType.SENTENCE),
        #"malicious_urls": MaliciousURLs(threshold = 0.7),
        "gibberish": OutGibberish(match_type = OutGibMatchType.FULL),
        "bancode": OutBanCode(),
        "anonymization": Deanonymize(vault),
        "bias": Bias(threshold = 0.5, match_type = OutBiasMatchType.FULL)
    }

    input_scanners_list = []
    output_scanners_list = []

    for item in llm_guards:
        if item in input_llm_guard_dict:
            input_scanners_list.append(input_llm_guard_dict[item])

        if item in output_llm_guard_dict:
            output_scanners_list.append(output_llm_guard_dict[item])

    sanitized_prompt, results_valid, results_score = scan_prompt(input_scanners_list, query)

    quiz_client.usage = {}
    outcome = await QuizGenerationAgent.run(sanitized_prompt)

    track_llm_tokens(
        usage=quiz_client.usage,
        agent="QuizGenerationAgent",
        llm_tag=sys_prompts_config.get("quiz_generation_agent").get("llm_tag", configs["llm_tag"]),
        module="train_assist",
        user_id=user_id
    )

    outcome, is_valid, risk_score = scan_output(output_scanners_list, sanitized_prompt, str(outcome))

    return outcome

async def scenario_generation(query, token):
    user_id = get_user_info_supplementary(token)["user_id"]

    configs = scf.get_system_config()
    sys_prompts_config = configs["sys_prompts_config"]

    if sys_prompts_config is None:
        log_str = "Guardrail note - System prompts not defined for any agent. Cannot proceed with the action. Contact developer."
        log_event(application_logger,
                  logging.ERROR,
                  log_str,
                  module_name="train_assist",
                  component_type="app_agent_execution",
                  component_name="train_assist_agent - scenario_generation")
        return log_str

    llm_guards = configs["llm_guards"]

    result = scenario_generation_agent(sys_prompts_config=sys_prompts_config)
    if isinstance(result, str):
        return result
    ScenarioGenerationAgent, scenario_client = result

    vault = Vault()
    input_llm_guard_dict = {
        "toxicity": InpToxicity(threshold = 0.5, match_type = InpToxMatchType.SENTENCE),
        "gibberish": InpGibberish(match_type = InpGibMatchType.FULL),
        "bancode": InpBanCode(),
        "prompt_injection": PromptInjection(threshold = 0.5, match_type = InpPIMatchType.FULL),
        "anonymization": Anonymize(vault)
    }

    output_llm_guard_dict = {
        "toxicity": OutToxicity(threshold = 0.5, match_type = OutToxMatchType.SENTENCE),
        #"malicious_urls": MaliciousURLs(threshold = 0.7),
        "gibberish": OutGibberish(match_type = OutGibMatchType.FULL),
        "bancode": OutBanCode(),
        "anonymization": Deanonymize(vault),
        "bias": Bias(threshold = 0.5, match_type = OutBiasMatchType.FULL)
    }

    input_scanners_list = []
    output_scanners_list = []

    for item in llm_guards:
        if item in input_llm_guard_dict:
            input_scanners_list.append(input_llm_guard_dict[item])

        if item in output_llm_guard_dict:
            output_scanners_list.append(output_llm_guard_dict[item])

    sanitized_prompt, results_valid, results_score = scan_prompt(input_scanners_list, query)

    scenario_client.usage = {}
    outcome = await ScenarioGenerationAgent.run(sanitized_prompt)

    track_llm_tokens(
        usage=scenario_client.usage,
        agent="ScenarioGenerationAgent",
        llm_tag=sys_prompts_config.get("scenario_generation_agent").get("llm_tag", configs["llm_tag"]),
        module="train_assist",
        user_id=user_id
    )

    outcome, is_valid, risk_score = scan_output(output_scanners_list, sanitized_prompt, str(outcome))

    return outcome


async def quiz_summary(query, token):
    user_id = get_user_info_supplementary(token)["user_id"]

    configs = scf.get_system_config()
    sys_prompts_config = configs["sys_prompts_config"]

    if sys_prompts_config is None:
        log_str = "Guardrail note - System prompts not defined for any agent. Cannot proceed with the action. Contact developer."
        log_event(application_logger,
                  logging.ERROR,
                  log_str,
                  module_name="train_assist",
                  component_type="app_agent_execution",
                  component_name="train_assist_agent - quiz_summary")
        return log_str

    llm_guards = configs["llm_guards"]

    result = quiz_summary_agent(sys_prompts_config=sys_prompts_config)
    if isinstance(result, str):
        return result
    QuizSummaryAgent, summary_client = result

    vault = Vault()
    input_llm_guard_dict = {
        "toxicity": InpToxicity(threshold = 0.5, match_type = InpToxMatchType.SENTENCE),
        "gibberish": InpGibberish(match_type = InpGibMatchType.FULL),
        "bancode": InpBanCode(),
        "prompt_injection": PromptInjection(threshold = 0.5, match_type = InpPIMatchType.FULL),
        "anonymization": Anonymize(vault)
    }

    output_llm_guard_dict = {
        "toxicity": OutToxicity(threshold = 0.5, match_type = OutToxMatchType.SENTENCE),
        #"malicious_urls": MaliciousURLs(threshold = 0.7),
        "gibberish": OutGibberish(match_type = OutGibMatchType.FULL),
        "bancode": OutBanCode(),
        "anonymization": Deanonymize(vault),
        "bias": Bias(threshold = 0.5, match_type = OutBiasMatchType.FULL)
    }

    input_scanners_list = []
    output_scanners_list = []

    for item in llm_guards:
        if item in input_llm_guard_dict:
            input_scanners_list.append(input_llm_guard_dict[item])

        if item in output_llm_guard_dict:
            output_scanners_list.append(output_llm_guard_dict[item])

    sanitized_prompt, results_valid, results_score = scan_prompt(input_scanners_list, query)

    summary_client.usage = {}
    outcome = await QuizSummaryAgent.run(sanitized_prompt)

    track_llm_tokens(
        usage=summary_client.usage,
        agent="QuizSummaryAgent",
        llm_tag=sys_prompts_config.get("quiz_summary_agent").get("llm_tag", configs["llm_tag"]),
        module="train_assist",
        user_id=user_id
    )

    outcome, is_valid, risk_score = scan_output(output_scanners_list, sanitized_prompt, str(outcome))

    return outcome
