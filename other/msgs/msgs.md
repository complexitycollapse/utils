# Msgs
A Kafka-like message broker, just for fun.

Features to try and support:
1. Cluster: Kafka runs as a distributed cluster of brokers, each managing data storage and serving client requests.

2. Topics & Partitions: Messages are organized into topics, which are divided into partitions for scalability and parallelism. Each partition is an append-only log.

3. Producers: Clients called producers send messages to a specific topic. Kafka appends each message to one of the topic's partitions (often via a key-based partitioner).

4. Storage: Messages in partitions are stored on disk sequentially with an offset (a unique ID per partition). Kafka persists messages for a configurable retention time, regardless of whether they’re read.

5. Consumers & Groups: Consumers read messages by offset. They form consumer groups, where each partition is assigned to only one consumer in the group, enabling parallel processing.

6. Offset Management: Consumers track their own position (offset) in each partition. They can replay messages by resetting offsets.

7. Replication: Each partition has a leader and zero or more followers (replicas). The leader handles reads/writes; followers replicate data for fault tolerance.

8. Fault Tolerance: If a broker or leader fails, another replica is elected leader, ensuring high availability.

9. High Throughput: Kafka achieves high performance via sequential disk writes, zero-copy transfer, and batching.
