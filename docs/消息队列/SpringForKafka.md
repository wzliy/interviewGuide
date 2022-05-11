# Spring-Kafka详解

Spring-Kafka的官方文档地址：https://docs.spring.io/spring-kafka/docs/current/reference/html



## 连接Kafka

## Topic配置

## 发送消息

### KafkaTemplate使用

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

要使用Template，你可以template的构造函数中提供一个配置好的producer factory。以下示例展示了如何执行此操作：

```java
@Bean
public ProducerFactory<Integer, String> producerFactory() {
    return new DefaultKafkaProducerFactory<>(producerConfigs());
}

@Bean
public Map<String, Object> producerConfigs() {
    Map<String, Object> props = new HashMap<>();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    // See https://kafka.apache.org/documentation/#producerconfigs for more properties
    return props;
}

@Bean
public KafkaTemplate<Integer, String> kafkaTemplate() {
    return new KafkaTemplate<Integer, String>(producerFactory());
}
```

从2.5版本开始，你可以覆盖工厂的`ProducerConfig`属性，以创建具有来自同一工厂的不同生产者配置的模板。

```java
@Bean
public KafkaTemplate<String, String> stringTemplate(ProducerFactory<String, String> pf) {
    return new KafkaTemplate<>(pf);
}

@Bean
public KafkaTemplate<String, byte[]> bytesTemplate(ProducerFactory<String, byte[]> pf) {
    return new KafkaTemplate<>(pf,
            Collections.singletonMap(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class));
}
```

你还可以使用标准` <bean/>` 定义来配置模板。

然后，要使用template，你可以调用其中的一种方法。

当你使用带有 `Message<?>` 参数的方法时，topic、分区和key信息将在包含以下项目的消息头中提供：

- `KafkaHeaders.TOPIC`
- `KafkaHeaders.PARTITION_ID`
- `KafkaHeaders.MESSAGE_KEY`
- `KafkaHeaders.TIMESTAMP`

消息的有效负载是数据。

或者，你可以使用 `ProducerListener` 配置 `KafkaTemplate` 以获取带有发送结果（成功或失败）的异步回调，而不是等待 `Future` 完成。下面列表展示了`ProducerListener`接口的定义：

```java
public interface ProducerListener<K, V> {

    void onSuccess(ProducerRecord<K, V> producerRecord, RecordMetadata recordMetadata);

    void onError(ProducerRecord<K, V> producerRecord, RecordMetadata recordMetadata,
            Exception exception);

}
```

默认情况下，template配置了一个 `LoggingProducerListener`，它记录错误并且在发送成功时不执行任何操作。

为方便起见，提供了默认方法实现，以防你只想实现其中一种方法。

请注意，发送方法返回一个 `ListenableFuture<SendResult>`。你可以向侦听器注册回调以异步接收发送的结果。以下示例显示了如何执行此操作：

```java
ListenableFuture<SendResult<Integer, String>> future = template.send("myTopic", "something");
future.addCallback(new ListenableFutureCallback<SendResult<Integer, String>>() {

    @Override
    public void onSuccess(SendResult<Integer, String> result) {
        ...
    }

    @Override
    public void onFailure(Throwable ex) {
        ...
    }

});
```

`SendResult` 有两个属性，`ProducerRecord` 和 `RecordMetadata`。有关这些对象的信息，请参阅 Kafka API 文档。

### RoutingKafkaTemplate使用
