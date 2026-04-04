import json
import os
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


def _format_validation_errors(errors: list) -> str:
    parts: list[str] = []
    for err in sorted(errors, key=lambda item: list(item.path)):
        path_tokens = [str(token) for token in err.path]
        path = "$" if not path_tokens else f"$.{'.'.join(path_tokens)}"
        parts.append(f"{path}: {err.message}")
    return "; ".join(parts)


class _SchemaRegistry:
    def __init__(self, contracts_dir: Path):
        self._claim_batch = self._load_validator(contracts_dir / "claim_batch.schema.json")
        self._fraud_response = self._load_validator(contracts_dir / "fraud_evaluation_response.schema.json")

    @staticmethod
    def _load_validator(schema_path: Path) -> Draft202012Validator:
        if not schema_path.exists():
            raise RuntimeError(f"schema file not found: {schema_path}")
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        return Draft202012Validator(schema)

    def validate_claim_batch(self, payload: Any) -> None:
        errors = list(self._claim_batch.iter_errors(payload))
        if errors:
            raise ValueError(_format_validation_errors(errors))

    def validate_fraud_response(self, payload: Any) -> None:
        errors = list(self._fraud_response.iter_errors(payload))
        if errors:
            raise ValueError(_format_validation_errors(errors))


_default_contracts_dir = Path(
    os.getenv("CONTRACTS_DIR", str(Path(__file__).resolve().parent.parent / "contracts"))
).resolve()
_registry = _SchemaRegistry(_default_contracts_dir)


def validate_claim_batch_payload(payload: Any) -> None:
    _registry.validate_claim_batch(payload)


def validate_fraud_response_payload(payload: Any) -> None:
    _registry.validate_fraud_response(payload)
