from fastapi import FastAPI, Request

from app.core_client import CoreApiClient, ToolCallLog
from app.domain.nlu import build_questions, classify_intent, extract_slots
from app.schemas.agent import AgentMessageRequest, AgentMessageResponse
from app.schemas.core import (
    AgentRunCreateRequest,
    LeadCreateRequest,
    LeadUpdateRequest,
    ToolCall,
    ToolUpdateLeadRequest,
 )

from app.logging import configure_logging
from app.middleware import RequestIdMiddleware


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="agent-orchestrator", version="0.1.0")
    app.add_middleware(RequestIdMiddleware)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/agent/message", response_model=AgentMessageResponse)
    async def agent_message(req: AgentMessageRequest, request: Request) -> AgentMessageResponse:
        request_id = getattr(request.state, "request_id", None)
        core = CoreApiClient(request_id=request_id)
        tool_logs: list[ToolCallLog] = []

        lead_id = req.lead_id
        if lead_id is None:
            lead, log = await core.create_lead(
                LeadCreateRequest(source="agent", metadata={"request_id": request_id} if request_id else {})
            )
            tool_logs.append(log)
            lead_id = lead.id

        intent = classify_intent(req.message)
        slots = extract_slots(req.message)

        # Persist extracted info to lead metadata (non-breaking for future schema evolution).
        lead_patch = LeadUpdateRequest(metadata={"intent": intent, "slots": slots})
        _, log = await core.update_lead(ToolUpdateLeadRequest(lead_id=lead_id, patch=lead_patch))
        tool_logs.append(log)

        questions = build_questions(intent, slots)
        if questions:
            summary = "Нужно уточнить данные по авто."
            next_step = "answer_questions"
        else:
            summary = "Данные приняты. Готов продолжать."
            next_step = "proceed"

        resp = AgentMessageResponse(
            lead_id=lead_id,
            intent=intent,
            slots=slots,
            summary=summary,
            questions=questions,
            next_step=next_step,
        )

        # Auditing: always write an agent_runs row in core-api.
        await core.log_agent_run(
            AgentRunCreateRequest(
                lead_id=lead_id,
                request_id=request_id,
                user_message=req.message,
                agent_response=resp.model_dump_json(),
                tool_calls=[
                    ToolCall(
                        tool_name=t.tool_name,
                        args=t.args,
                        result_summary=t.result_summary,
                        error=t.error,
                        duration_ms=t.duration_ms,
                    )
                    for t in tool_logs
                ],
                metadata={"intent": intent, "slots": slots},
            )
        )

        return resp

    return app


app = create_app()

