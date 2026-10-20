# Configuration

Start the bundled services with `docker compose up --build -d`. The database loads the initial dataset from `database/init/records.csv` the first time its volume is created. The local database credentials are only for development: database `ifg_test`, user `ifg_user`, password `ifg_local_only`. Do not reuse them outside the local container setup.

## REST producer/consumer

The REST case issues a JSON `POST` to the configured collection endpoint, extracts the created record's `id`, then issues `GET {collectionUrl}/{id}`. It asserts successful status codes and verifies the returned `name` and `job` values.

Configure these Katalon profile variables (or matching environment variables):

| Variable | Example | Purpose |
| --- | --- | --- |
| `REST_BASE_URL` | `http://localhost:8080` | API origin |
| `REST_COLLECTION_PATH` | `/records` | Collection path |
| `REST_AUTH_TOKEN` | empty | Optional bearer token |

The bundled API persists records in PostgreSQL and returns JSON with an `id` from POST, then `id`, `name`, and `job` from GET. `GET /records` returns the record collection as a JSON array. The round-trip test sends a unique record name on each run. The dataset verification test reads expected rows from `database/init/records.csv` and checks they appear exactly once in the API response. Seed rows can be changed in that CSV; PostgreSQL only applies the seed file when its data volume is first created.

## Kafka consumer

Configure these variables in the `default` profile:

| Variable | Example | Purpose |
| --- | --- | --- |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Broker list |
| `KAFKA_TOPIC` | `ifg-test-events` | Topic to consume |
| `KAFKA_GROUP_ID` | `katalon-ifg-tests` | Consumer group |
| `KAFKA_EXPECTED_KEY` | `ifg-smoke` | Key the case waits for |
| `KAFKA_EXPECTED_VALUE` | `hello-katalon` | Exact message value expected |
| `KAFKA_TIMEOUT_SECONDS` | `30` | Maximum poll duration |

The `kafka-fixture` compose service creates the topic and publishes the configured default key/value when the broker starts. The test uses a new consumer group per run and fails clearly if no matching record arrives before timeout. Use this local broker only for testing.

To stop services while keeping PostgreSQL data, run `docker compose down`. To delete the local database volume and reload the CSV seed on next startup, run `docker compose down -v`.

## Kafka dependency

`build.gradle` declares `org.apache.kafka:kafka-clients` and the Katalon Gradle plugin. Close Katalon Studio, run `gradle katalonCopyDependencies` from the project directory, then reopen the project. This copies the needed dependencies to `Drivers/`. If the command is unavailable, install Gradle first. The alternative is to add the Kafka client JAR and its runtime dependencies through **Project > Settings > Library Management** or `Drivers/`, following the official [Katalon library management guide](https://docs.katalon.com/katalon-studio/manage-projects/project-settings/library-management-in-katalon-studio).
