FROM golang:1.22-alpine AS builder

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/core-api ./cmd/server

FROM alpine:3.20

RUN apk add --no-cache ca-certificates wget
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=builder /out/core-api /app/core-api

RUN chown -R app:app /app

USER app

EXPOSE 8080

ENTRYPOINT ["/app/core-api"]
