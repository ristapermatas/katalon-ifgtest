package ifg

import com.kms.katalon.core.annotation.Keyword
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.clients.consumer.KafkaConsumer as KafkaClientConsumer
import org.apache.kafka.common.serialization.StringDeserializer

import java.time.Duration

class KafkaConsumer {

    /**
     * Consume until the exact key/value pair is seen or the timeout expires.
     * A run-specific group prevents offsets from a prior test run hiding the
     * fixture message. The caller is responsible for arranging a producer to
     * publish the fixture after the test starts.
     */
    @Keyword
    static Map consumeMatching(String bootstrapServers, String topic, String groupId,
                               String expectedKey, String expectedValue, int timeoutSeconds) {
        if (timeoutSeconds <= 0) {
            throw new IllegalArgumentException('timeoutSeconds must be greater than zero')
        }

        Properties properties = new Properties()
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers)
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, "${groupId}-${UUID.randomUUID()}")
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.name)
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.name)
        properties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, 'earliest')
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, 'false')

        KafkaClientConsumer<String, String> consumer = new KafkaClientConsumer<>(properties)
        long deadline = System.nanoTime() + Duration.ofSeconds(timeoutSeconds).toNanos()
        try {
            consumer.subscribe(Collections.singletonList(topic))
            while (System.nanoTime() < deadline) {
                long remainingMillis = Math.max(1L, Duration.ofNanos(deadline - System.nanoTime()).toMillis())
                def records = consumer.poll(Duration.ofMillis(Math.min(500L, remainingMillis)))
                for (ConsumerRecord<String, String> record : records) {
                    if (record.key() == expectedKey && record.value() == expectedValue) {
                        return [key: record.key(), value: record.value(), topic: record.topic(),
                                partition: record.partition(), offset: record.offset()]
                    }
                }
            }
            throw new AssertionError("Timed out after ${timeoutSeconds}s waiting for Kafka key='${expectedKey}' and expected value on topic '${topic}'")
        } finally {
            consumer.close(Duration.ofSeconds(5))
        }
    }
}
