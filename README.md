# Katalon IFG integration tests

Katalon Studio project scaffold for two integration flows:

1. REST API producer/consumer: POST a generated record, then GET it and verify the returned fields.
2. Kafka consumer: subscribe to a configured topic, poll for a configured key/value pair, and verify it.

The tests use configurable services and do not assume access to a particular public API or Kafka cluster. Set environment variables or edit the execution profile before running; see [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

This repository also includes a local PostgreSQL database seeded from `database/init/records.csv`, a REST API backed by that database, a single-node Kafka broker, and a Kafka fixture message. Start the services from the project directory with:

```shell
docker compose up --build -d
```

The REST API is available at `http://localhost:8080`; PostgreSQL is exposed on port `5432`; Kafka is exposed on `localhost:9092`. The Kafka fixture uses key `ifg-smoke` and value `hello-katalon`, matching the default Katalon profile.

## Project layout

- `Test Cases/REST/Produce and consume record.tc` — REST round-trip.
- `Test Cases/REST/Verify seeded dataset.tc` — checks all CSV seed rows against the API's record collection.
- `Test Cases/Kafka/Consume matching message.tc` — Kafka consumer assertion.
- `Keywords/ifg/KafkaConsumer.groovy` — small consumer helper using the Kafka Java client.
- `Profiles/default.glbl` — safe local defaults; no credentials.
- `database/init/records.csv` — seed dataset loaded into PostgreSQL on first startup.
- `services/rest-api/` — REST API used by the Katalon round-trip case.
- `docker-compose.yml` — PostgreSQL, API, Kafka, and Kafka fixture services.
- `build.gradle` — Kafka client dependency for Katalon Gradle integration.

## Open and run

Start the local services first, then open this directory in Katalon Studio. Configure the `default` execution profile or environment variables, then run the relevant test case. The REST case uses Java's HTTP client and has no external library requirement. The Kafka case requires the Kafka client dependency to be available on Katalon's runtime classpath. With Katalon Studio closed, run `gradle katalonCopyDependencies` from this directory, then reopen the project; see the configuration guide.

No repository is published by this scaffold. If you choose to publish it, remove any private endpoints or credentials first and use your own public repository.
