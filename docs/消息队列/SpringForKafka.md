# Spring-Kafka详解

Spring-Kafka的官方文档地址：https://docs.spring.io/spring-kafka/docs/current/reference/html



## 连接Kafka

## Topic配置

## 发送消息

### 使用KafkaTemplate

本节介绍如何使用KafkaTemplate发送消息。

#### 概述

KafkaTemplate包装了一个Producer，提供了方便的方法用来发送消息到topic。KafkaTemplate提供的相关方法如下：



```java
ListenableFuture<SendResult<K, V>> sendDefault(V data);

ListenableFuture<SendResult<K, V>> sendDefault(K key, V data);

ListenableFuture<SendResult<K, V>> sendDefault(Integer partition, K key, V data);

ListenableFuture<SendResult<K, V>> sendDefault(Integer partition, Long timestamp, K key, V data);

ListenableFuture<SendResult<K, V>> send(String topic, V data);

ListenableFuture<SendResult<K, V>> send(String topic, K key, V data);

ListenableFuture<SendResult<K, V>> send(String topic, Integer partition, K key, V data);

ListenableFuture<SendResult<K, V>> send(String topic, Integer partition, Long timestamp, K key, V data);

ListenableFuture<SendResult<K, V>> send(ProducerRecord<K, V> record);

ListenableFuture<SendResult<K, V>> send(Message<?> message);

Map<MetricName, ? extends Metric> metrics();

List<PartitionInfo> partitionsFor(String topic);

<T> T execute(ProducerCallback<K, V, T> callback);

// Flush the producer.

void flush();

interface ProducerCallback<K, V, T> {

    T doInKafka(Producer<K, V> producer);
}
```

`sendDefault` 方法要求已向template提供了默认的topic。

这些方法中可以接收一个`timestamp`时间戳参数，并将该时间戳保存到消息记录中。用户提供的时间戳如何存储取决于kafka topic配置中的时间戳类型。如果topic配置中配置了`CREATE_TIME`，记录用户指定的时间戳（如果未指定，则生成）。如果topic配置中配置了 `LOG_APPEND_TIME`，则忽略用户指定的时间戳，并且broker中添加本地broker时间。

metrics 和 partitionsFor 方法委托给底层 Producer （kafka-client中的Producer）上的相同方法。 execute 方法提供对底层 Producer 的直接访问。

