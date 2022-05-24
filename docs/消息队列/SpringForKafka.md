# Spring-Kafka详解

Spring-Kafka的官方文档地址：https://docs.spring.io/spring-kafka/docs/current/reference/html

## 1. Spring kafka的使用

### 1.1 连接Kafka

### 1.2 Topic配置

### 1.3 发送消息

本节介绍如何发送消息。

#### 1.3.1 KafkaTemplate使用

本节介绍如何使用KafkaTemplate发送消息。

##### 概述

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

#### 1.3.2 RoutingKafkaTemplate使用

#### 1.3.3 DefaultKafkaProducerFactory使用

如[KafkaTemplate使用](#1.3.1 KafkaTemplate使用)所见，`ProducerFactory`用来创建producer。

当不使用事务时，默认情况下，`DefaultKafkaProducerFactory` 创建一个供所有客户端使用的单例producer，如 `KafkaProducer` javadocs 中所建议的那样。但是，如果你在template中调用 `flush()`方法，这可能会导致使用同一生产者的其他线程延迟。从 2.3 版开始，`DefaultKafkaProducerFactory` 有一个新的属性 `producerPerThread`。当设置为 true 时，factory将为每个线程创建（并缓存）一个单独的生产者，以避免这个问题。

> 当 `producerPerThread` 为`true`时，当不再需要producer时，用户代码必须在factory上调用 `closeThreadBoundProducer()`。这将物理关闭producer并将其从 `ThreadLocal` 中删除。调用 `reset()` 或 `destroy()` 不会清理这些producer。

另请参阅 KafkaTemplate 事务和非事务发布。

创建 `DefaultKafkaProducerFactory` 时，可以通过调用仅接受Map类型参数的构造函数从配置中获取key/value序列化器类（参见使用 KafkaTemplate 中的示例），或者可以将序列化器实例传递给`DefaultKafkaProducerFactory`构造函数（在这种情况下，所有`Producer` 共享相同的实例）。 或者，你可以提供 `Supplier<Serializer>` s（从 2.3 版开始），用于为每个 Producer 获取单独的 Serializer 实例：

```java
@Bean
public ProducerFactory<Integer, CustomValue> producerFactory() {
    return new DefaultKafkaProducerFactory<>(producerConfigs(), null, () -> new CustomValueSerializer());
}

@Bean
public KafkaTemplate<Integer, CustomValue> kafkaTemplate() {
    return new KafkaTemplate<Integer, CustomValue>(producerFactory());
}
```

从版本 2.5.10 开始，你现在可以在创建factory后更新producer属性。这可能很有用，例如，如果你必须在凭据更改后更新 SSL 密钥/信任存储位置。这些更改不会影响现有的生产者实例；调用 `reset()` 关闭现有的所有生产者，以便使用新属性创建新的生产者。注意：你不能将事务性生产者工厂更改为非事务性，反之亦然。

现在提供了两个新方法：

```java
void updateConfigs(Map<String, Object> updates);

void removeConfig(String configKey);
```

从 2.8 版开始，如果你将序列化器作为对象提供（在构造函数中或通过setter设置），factory将调用 `configure()` 方法以使用配置属性对其进行配置。

##### 源码解析

**类描述**

> 单例共享的Producer实例的ProducerFactory实现。
>
> 