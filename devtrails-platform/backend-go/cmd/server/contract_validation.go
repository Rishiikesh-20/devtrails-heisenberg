package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/xeipuuv/gojsonschema"
)

const (
	contractSchemaEventPayload            = "event_payload"
	contractSchemaClaimBatch              = "claim_batch"
	contractSchemaFraudEvaluationResponse = "fraud_evaluation_response"
	contractSchemaPayoutResponse          = "payout_response"
)

var contractSchemaFiles = map[string]string{
	contractSchemaEventPayload:            "event_payload.schema.json",
	contractSchemaClaimBatch:              "claim_batch.schema.json",
	contractSchemaFraudEvaluationResponse: "fraud_evaluation_response.schema.json",
	contractSchemaPayoutResponse:          "payout_response.schema.json",
}

type ContractValidator struct {
	schemas map[string]*gojsonschema.Schema
}

func NewContractValidator(contractsDir string) (*ContractValidator, error) {
	if strings.TrimSpace(contractsDir) == "" {
		return nil, fmt.Errorf("contracts directory is empty")
	}

	validator := &ContractValidator{schemas: make(map[string]*gojsonschema.Schema, len(contractSchemaFiles))}
	for schemaName, fileName := range contractSchemaFiles {
		schemaPath := filepath.Join(contractsDir, fileName)
		absPath, err := filepath.Abs(schemaPath)
		if err != nil {
			return nil, fmt.Errorf("resolve schema path %s: %w", schemaName, err)
		}

		if _, err := os.Stat(absPath); err != nil {
			return nil, fmt.Errorf("schema missing for %s at %s: %w", schemaName, absPath, err)
		}

		schemaURI := fileURI(absPath)
		schema, err := gojsonschema.NewSchema(gojsonschema.NewReferenceLoader(schemaURI))
		if err != nil {
			return nil, fmt.Errorf("compile schema %s: %w", schemaName, err)
		}
		validator.schemas[schemaName] = schema
	}

	return validator, nil
}

func (v *ContractValidator) ValidateBytes(schemaName string, raw []byte) error {
	if v == nil {
		return nil
	}

	schema, ok := v.schemas[schemaName]
	if !ok {
		return fmt.Errorf("unknown schema: %s", schemaName)
	}

	trimmed := bytes.TrimSpace(raw)
	if len(trimmed) == 0 {
		return fmt.Errorf("empty payload")
	}

	result, err := schema.Validate(gojsonschema.NewBytesLoader(trimmed))
	if err != nil {
		return err
	}
	if result.Valid() {
		return nil
	}

	return fmt.Errorf("%s", formatSchemaErrors(result.Errors()))
}

func (v *ContractValidator) ValidateValue(schemaName string, value any) error {
	if v == nil {
		return nil
	}

	raw, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	return v.ValidateBytes(schemaName, raw)
}

func fileURI(absPath string) string {
	unixPath := filepath.ToSlash(absPath)
	if strings.HasPrefix(unixPath, "/") {
		return "file://" + unixPath
	}
	return "file:///" + unixPath
}

func formatSchemaErrors(errors []gojsonschema.ResultError) string {
	parts := make([]string, 0, len(errors))
	for _, item := range errors {
		parts = append(parts, item.String())
	}
	return strings.Join(parts, "; ")
}

type schemaBufferedWriter struct {
	gin.ResponseWriter
	statusCode int
	body       bytes.Buffer
}

func newSchemaBufferedWriter(base gin.ResponseWriter) *schemaBufferedWriter {
	return &schemaBufferedWriter{
		ResponseWriter: base,
		statusCode:     http.StatusOK,
	}
}

func (w *schemaBufferedWriter) WriteHeader(code int) {
	w.statusCode = code
}

func (w *schemaBufferedWriter) WriteHeaderNow() {
}

func (w *schemaBufferedWriter) Write(data []byte) (int, error) {
	return w.body.Write(data)
}

func (w *schemaBufferedWriter) WriteString(s string) (int, error) {
	return w.body.WriteString(s)
}

func (w *schemaBufferedWriter) FlushToOriginal() error {
	w.ResponseWriter.WriteHeader(w.statusCode)
	_, err := w.ResponseWriter.Write(w.body.Bytes())
	return err
}

func ResponseSchemaValidationMiddleware(validator *ContractValidator) gin.HandlerFunc {
	return func(c *gin.Context) {
		if validator == nil {
			c.Next()
			return
		}

		schemaName := responseSchemaForPath(c.Request.URL.Path)
		if schemaName == "" {
			c.Next()
			return
		}

		buffered := newSchemaBufferedWriter(c.Writer)
		c.Writer = buffered
		c.Next()

		if buffered.statusCode < http.StatusBadRequest {
			contentType := strings.ToLower(strings.TrimSpace(buffered.Header().Get("Content-Type")))
			if strings.Contains(contentType, "application/json") {
				if err := validator.ValidateBytes(schemaName, buffered.body.Bytes()); err != nil {
					c.Writer = buffered.ResponseWriter
					c.Header("Content-Type", "application/json")
					c.JSON(http.StatusInternalServerError, gin.H{
						"error":   "response contract validation failed",
						"details": err.Error(),
					})
					return
				}
			}
		}

		c.Writer = buffered.ResponseWriter
		_ = buffered.FlushToOriginal()
	}
}

func responseSchemaForPath(path string) string {
	switch path {
	case "/payouts", "/api/payouts":
		return contractSchemaPayoutResponse
	default:
		return ""
	}
}
